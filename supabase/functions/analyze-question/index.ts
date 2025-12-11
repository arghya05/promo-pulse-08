import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create a consistent hash for cache key
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Normalize question for cache matching
function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[?!.,]/g, '').replace(/\s+/g, ' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, persona = 'executive', categories = null, selectedKPIs = null } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question:', question);
    console.log('Persona:', persona);
    console.log('Categories filter:', categories);
    console.log('Selected KPIs:', selectedKPIs);

    // Query ALL actual data from database for rich context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // === CACHE CHECK ===
    const normalizedQuestion = normalizeQuestion(question);
    const kpiSuffix = selectedKPIs && selectedKPIs.length > 0 ? '|' + selectedKPIs.sort().join(',') : '';
    const questionHash = simpleHash(normalizedQuestion + '|' + persona + kpiSuffix);
    
    console.log('Checking cache for hash:', questionHash);
    
    const { data: cachedResult } = await supabaseClient
      .from('question_cache')
      .select('*')
      .eq('persona', persona)
      .eq('question_hash', questionHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (cachedResult) {
      console.log('Cache HIT! Returning cached response');
      
      // Update hit count async (don't wait)
      supabaseClient
        .from('question_cache')
        .update({ hit_count: (cachedResult.hit_count || 0) + 1 })
        .eq('id', cachedResult.id)
        .then(() => console.log('Cache hit count updated'));
      
      return new Response(
        JSON.stringify(cachedResult.response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }
    
    console.log('Cache MISS, proceeding with AI analysis');

    const [
      storesResult, 
      promotionsResult, 
      transactionsResult, 
      customersResult, 
      thirdPartyResult,
      productsResult,
      marketingChannelsResult,
      competitorDataResult,
      storePerformanceResult,
      customerJourneyResult,
      inventoryLevelsResult
    ] = await Promise.all([
      supabaseClient.from('stores').select('*'),
      supabaseClient.from('promotions').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('transactions').select('*, stores(store_name, region), promotions(promotion_name, promotion_type)').order('transaction_date', { ascending: false }),
      supabaseClient.from('customers').select('*'),
      supabaseClient.from('third_party_data').select('*').order('data_date', { ascending: false }).limit(100),
      supabaseClient.from('products').select('*'),
      supabaseClient.from('marketing_channels').select('*, promotions(promotion_name)'),
      supabaseClient.from('competitor_data').select('*').order('observation_date', { ascending: false }),
      supabaseClient.from('store_performance').select('*, stores(store_name)').order('metric_date', { ascending: false }),
      supabaseClient.from('customer_journey').select('*, customers(customer_name), promotions(promotion_name)').order('touchpoint_date', { ascending: false }),
      supabaseClient.from('inventory_levels').select('*, stores(store_name)').order('created_at', { ascending: false })
    ]);

    const hasData = (transactionsResult.data?.length || 0) > 0;
    
    let dataContextMessage = '';
    if (hasData) {
      // Build rich data context with actual data
      dataContextMessage = `\n\n=== REAL DATABASE CONTEXT - USE THIS ACTUAL DATA FOR ANALYSIS ===\n\n`;
      
      // Stores data
      dataContextMessage += `STORES (${storesResult.data?.length || 0} total):\n`;
      storesResult.data?.forEach(store => {
        dataContextMessage += `- ${store.store_name} (${store.store_code}): ${store.region} region, ${store.store_type} type, Location: ${store.location}\n`;
      });
      
      // Promotions data
      dataContextMessage += `\n\nPROMOTIONS (${promotionsResult.data?.length || 0} total):\n`;
      promotionsResult.data?.forEach(promo => {
        dataContextMessage += `- ${promo.promotion_name}: Type=${promo.promotion_type}, Period=${promo.start_date} to ${promo.end_date}, `;
        dataContextMessage += `Discount=${promo.discount_percent ? promo.discount_percent + '%' : '$' + promo.discount_amount}, `;
        dataContextMessage += `Category=${promo.product_category || 'All'}, Status=${promo.status}, Total Spend=$${promo.total_spend}\n`;
      });
      
      // === PRE-COMPUTED PROMOTION ANALYTICS ===
      dataContextMessage += `\n\n=== PRE-COMPUTED PROMOTION ANALYTICS ===\n`;
      
      // REALISTIC SPEND SCALING - promo spend should be 5-15% of revenue, not exceeding revenue
      const totalRevenue = transactionsResult.data?.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0) || 1000000;
      const totalRawSpend = promotionsResult.data?.reduce((sum: number, p: any) => sum + parseFloat(p.total_spend || 0), 0) || 1;
      const spendScaleFactor = totalRawSpend > totalRevenue * 0.15 ? (totalRevenue * 0.12) / totalRawSpend : 1;
      console.log(`Spend scaling: Revenue=$${totalRevenue.toFixed(0)}, RawSpend=$${totalRawSpend.toFixed(0)}, ScaleFactor=${spendScaleFactor.toFixed(4)}`);
      
      // Performance by Discount Depth
      const discountDepthAnalysis: Record<string, { count: number; revenue: number; discount: number; units: number; promoSpend: number }> = {};
      promotionsResult.data?.forEach((promo: any) => {
        const depth = promo.discount_percent 
          ? `${promo.discount_percent}%` 
          : promo.discount_amount 
            ? `$${promo.discount_amount}` 
            : 'Unknown';
        
        if (!discountDepthAnalysis[depth]) {
          discountDepthAnalysis[depth] = { count: 0, revenue: 0, discount: 0, units: 0, promoSpend: 0 };
        }
        discountDepthAnalysis[depth].count++;
        // Scale spend to realistic levels
        discountDepthAnalysis[depth].promoSpend += parseFloat(promo.total_spend || 0) * spendScaleFactor;
        
        // Aggregate transactions for this promotion
        const promoTxns = transactionsResult.data?.filter((t: any) => t.promotion_id === promo.id) || [];
        promoTxns.forEach((txn: any) => {
          discountDepthAnalysis[depth].revenue += parseFloat(txn.total_amount || 0);
          discountDepthAnalysis[depth].discount += parseFloat(txn.discount_amount || 0);
          discountDepthAnalysis[depth].units += parseInt(txn.quantity || 0);
        });
      });
      
      dataContextMessage += `\nPERFORMANCE BY DISCOUNT DEPTH:\n`;
      Object.entries(discountDepthAnalysis).forEach(([depth, stats]) => {
        const margin = stats.revenue - stats.discount - stats.promoSpend;
        const roi = stats.promoSpend > 0 ? margin / stats.promoSpend : 0;
        const avgBasket = stats.count > 0 ? stats.revenue / stats.count : 0;
        dataContextMessage += `- ${depth} Discount: ${stats.count} promotions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)}, ROI=${roi.toFixed(2)}, Units=${stats.units}, Avg Revenue/Promo=$${avgBasket.toFixed(2)}\n`;
      });
      
      // Performance by Promotion Type
      const promoTypeAnalysis: Record<string, { count: number; revenue: number; discount: number; units: number; promoSpend: number }> = {};
      promotionsResult.data?.forEach((promo: any) => {
        const type = promo.promotion_type || 'Unknown';
        
        if (!promoTypeAnalysis[type]) {
          promoTypeAnalysis[type] = { count: 0, revenue: 0, discount: 0, units: 0, promoSpend: 0 };
        }
        promoTypeAnalysis[type].count++;
        promoTypeAnalysis[type].promoSpend += parseFloat(promo.total_spend || 0) * spendScaleFactor;
        
        const promoTxns = transactionsResult.data?.filter((t: any) => t.promotion_id === promo.id) || [];
        promoTxns.forEach((txn: any) => {
          promoTypeAnalysis[type].revenue += parseFloat(txn.total_amount || 0);
          promoTypeAnalysis[type].discount += parseFloat(txn.discount_amount || 0);
          promoTypeAnalysis[type].units += parseInt(txn.quantity || 0);
        });
      });
      
      dataContextMessage += `\nPERFORMANCE BY PROMOTION TYPE:\n`;
      Object.entries(promoTypeAnalysis).forEach(([type, stats]) => {
        const margin = stats.revenue - stats.discount - stats.promoSpend;
        const roi = stats.promoSpend > 0 ? margin / stats.promoSpend : 0;
        dataContextMessage += `- ${type}: ${stats.count} promotions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)}, ROI=${roi.toFixed(2)}, Units=${stats.units}\n`;
      });
      
      // Performance by Category
      const categoryAnalysis: Record<string, { txnCount: number; revenue: number; discount: number; units: number; cost: number }> = {};
      transactionsResult.data?.forEach((txn: any) => {
        const product = productsResult.data?.find((p: any) => p.product_sku === txn.product_sku);
        const category = product?.category || 'Unknown';
        
        if (!categoryAnalysis[category]) {
          categoryAnalysis[category] = { txnCount: 0, revenue: 0, discount: 0, units: 0, cost: 0 };
        }
        categoryAnalysis[category].txnCount++;
        categoryAnalysis[category].revenue += parseFloat(txn.total_amount || 0);
        categoryAnalysis[category].discount += parseFloat(txn.discount_amount || 0);
        categoryAnalysis[category].units += parseInt(txn.quantity || 0);
        categoryAnalysis[category].cost += (product?.cost || 0) * parseInt(txn.quantity || 0);
      });
      
      dataContextMessage += `\nPERFORMANCE BY CATEGORY:\n`;
      Object.entries(categoryAnalysis).forEach(([category, stats]) => {
        const margin = stats.revenue - stats.cost - stats.discount;
        const roi = stats.discount > 0 ? margin / stats.discount : 0;
        const marginPct = stats.revenue > 0 ? (margin / stats.revenue * 100) : 0;
        dataContextMessage += `- ${category}: ${stats.txnCount} transactions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)} (${marginPct.toFixed(1)}%), ROI=${roi.toFixed(2)}, Units=${stats.units}\n`;
      });
      
      // Performance by Store/Region
      const regionAnalysis: Record<string, { txnCount: number; revenue: number; discount: number; units: number }> = {};
      transactionsResult.data?.forEach((txn: any) => {
        const store = storesResult.data?.find((s: any) => s.id === txn.store_id);
        const region = store?.region || 'Unknown';
        
        if (!regionAnalysis[region]) {
          regionAnalysis[region] = { txnCount: 0, revenue: 0, discount: 0, units: 0 };
        }
        regionAnalysis[region].txnCount++;
        regionAnalysis[region].revenue += parseFloat(txn.total_amount || 0);
        regionAnalysis[region].discount += parseFloat(txn.discount_amount || 0);
        regionAnalysis[region].units += parseInt(txn.quantity || 0);
      });
      
      dataContextMessage += `\nPERFORMANCE BY REGION:\n`;
      Object.entries(regionAnalysis).forEach(([region, stats]) => {
        const margin = stats.revenue - stats.discount;
        const roi = stats.discount > 0 ? margin / stats.discount : 0;
        dataContextMessage += `- ${region}: ${stats.txnCount} transactions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)}, ROI=${roi.toFixed(2)}, Units=${stats.units}\n`;
      });
      
      // Performance by Customer Segment
      const segmentAnalysis: Record<string, { txnCount: number; revenue: number; discount: number; units: number; avgLTV: number; custCount: number }> = {};
      transactionsResult.data?.forEach((txn: any) => {
        const customer = customersResult.data?.find((c: any) => c.id === txn.customer_id);
        const segment = customer?.segment || 'Unknown';
        
        if (!segmentAnalysis[segment]) {
          segmentAnalysis[segment] = { txnCount: 0, revenue: 0, discount: 0, units: 0, avgLTV: 0, custCount: 0 };
        }
        segmentAnalysis[segment].txnCount++;
        segmentAnalysis[segment].revenue += parseFloat(txn.total_amount || 0);
        segmentAnalysis[segment].discount += parseFloat(txn.discount_amount || 0);
        segmentAnalysis[segment].units += parseInt(txn.quantity || 0);
        if (customer?.total_lifetime_value) {
          segmentAnalysis[segment].avgLTV += parseFloat(customer.total_lifetime_value);
          segmentAnalysis[segment].custCount++;
        }
      });
      
      dataContextMessage += `\nPERFORMANCE BY CUSTOMER SEGMENT:\n`;
      Object.entries(segmentAnalysis).forEach(([segment, stats]) => {
        const margin = stats.revenue - stats.discount;
        const roi = stats.discount > 0 ? margin / stats.discount : 0;
        const avgLTV = stats.custCount > 0 ? stats.avgLTV / stats.custCount : 0;
        dataContextMessage += `- ${segment}: ${stats.txnCount} transactions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)}, ROI=${roi.toFixed(2)}, Avg LTV=$${avgLTV.toFixed(2)}\n`;
      });
      
      // Time-based Analysis (for forecasting)
      const timeAnalysis: Record<string, { txnCount: number; revenue: number; discount: number; units: number }> = {};
      transactionsResult.data?.forEach((txn: any) => {
        const date = new Date(txn.transaction_date);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!timeAnalysis[monthKey]) {
          timeAnalysis[monthKey] = { txnCount: 0, revenue: 0, discount: 0, units: 0 };
        }
        timeAnalysis[monthKey].txnCount++;
        timeAnalysis[monthKey].revenue += parseFloat(txn.total_amount || 0);
        timeAnalysis[monthKey].discount += parseFloat(txn.discount_amount || 0);
        timeAnalysis[monthKey].units += parseInt(txn.quantity || 0);
      });
      
      dataContextMessage += `\nPERFORMANCE BY MONTH (for trend/forecasting):\n`;
      Object.entries(timeAnalysis).forEach(([month, stats]) => {
        const margin = stats.revenue - stats.discount;
        const roi = stats.discount > 0 ? margin / stats.discount : 0;
        dataContextMessage += `- ${month}: ${stats.txnCount} transactions, Revenue=$${stats.revenue.toFixed(2)}, Margin=$${margin.toFixed(2)}, ROI=${roi.toFixed(2)}, Units=${stats.units}\n`;
      });
      
      // Individual Promotion Performance (Top performers)
      dataContextMessage += `\nINDIVIDUAL PROMOTION PERFORMANCE:\n`;
      const promoPerformance = promotionsResult.data?.map((promo: any) => {
        const promoTxns = transactionsResult.data?.filter((t: any) => t.promotion_id === promo.id) || [];
        const revenue = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
        const discount = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.discount_amount || 0), 0);
        const units = promoTxns.reduce((sum: number, t: any) => sum + parseInt(t.quantity || 0), 0);
        // Apply realistic spend scaling
        const spend = parseFloat(promo.total_spend || 0) * spendScaleFactor;
        const margin = revenue - discount - spend;
        const roi = spend > 0 ? margin / spend : 0;
        const liftPct = revenue > 0 ? ((revenue - discount) / revenue * 100) : 0;
        
        return {
          name: promo.promotion_name,
          type: promo.promotion_type,
          discount: promo.discount_percent ? `${promo.discount_percent}%` : `$${promo.discount_amount}`,
          category: promo.product_category,
          revenue,
          margin,
          roi,
          liftPct,
          units,
          spend,
          txnCount: promoTxns.length
        };
      }).sort((a: any, b: any) => b.roi - a.roi);
      
      promoPerformance?.slice(0, 15).forEach((promo: any) => {
        dataContextMessage += `- ${promo.name} (${promo.type}, ${promo.discount}): ROI=${promo.roi.toFixed(2)}, Revenue=$${promo.revenue.toFixed(2)}, Margin=$${promo.margin.toFixed(2)}, Units=${promo.units}, Spend=$${promo.spend.toFixed(2)}\n`;
      });
      
      // === END PRE-COMPUTED ANALYTICS ===
      
      // Transactions summary
      dataContextMessage += `\n\nTRANSACTIONS (${transactionsResult.data?.length || 0} total):\n`;
      const transactionsByPromo = transactionsResult.data?.reduce((acc: any, txn: any) => {
        const promoName = txn.promotions?.promotion_name || 'No Promotion';
        if (!acc[promoName]) acc[promoName] = { count: 0, totalAmount: 0, totalDiscount: 0 };
        acc[promoName].count++;
        acc[promoName].totalAmount += parseFloat(txn.total_amount || 0);
        acc[promoName].totalDiscount += parseFloat(txn.discount_amount || 0);
        return acc;
      }, {});
      Object.entries(transactionsByPromo || {}).forEach(([promo, stats]: [string, any]) => {
        dataContextMessage += `- ${promo}: ${stats.count} transactions, Total=$${stats.totalAmount.toFixed(2)}, Discounts=$${stats.totalDiscount.toFixed(2)}\n`;
      });
      
      // Customers data
      dataContextMessage += `\n\nCUSTOMERS (${customersResult.data?.length || 0} total):\n`;
      customersResult.data?.forEach(customer => {
        dataContextMessage += `- ${customer.customer_name} (${customer.customer_code}): ${customer.segment} segment, ${customer.loyalty_tier} tier, LTV=$${customer.total_lifetime_value}\n`;
      });
      
      // Third-party data
      dataContextMessage += `\n\nTHIRD-PARTY DATA (${thirdPartyResult.data?.length || 0} insights):\n`;
      thirdPartyResult.data?.forEach(data => {
        dataContextMessage += `- ${data.data_source} (${data.data_type}): ${data.metric_name}=${data.metric_value} on ${data.data_date}`;
        if (data.product_category) dataContextMessage += `, Category: ${data.product_category}`;
        if (data.metadata) dataContextMessage += `, Details: ${JSON.stringify(data.metadata)}`;
        dataContextMessage += `\n`;
      });
      
      // Products catalog
      dataContextMessage += `\n\nPRODUCTS CATALOG (${productsResult.data?.length || 0} products):\n`;
      productsResult.data?.forEach(product => {
        dataContextMessage += `- ${product.product_name} (${product.product_sku}): ${product.category}/${product.subcategory}, `;
        dataContextMessage += `Brand=${product.brand}, Price=$${product.base_price}, Cost=$${product.cost}, `;
        dataContextMessage += `Margin=${product.margin_percent}%, Elasticity=${product.price_elasticity}, Seasonality=${product.seasonality_factor}\n`;
      });
      
      // Marketing channels
      dataContextMessage += `\n\nMARKETING CHANNELS (${marketingChannelsResult.data?.length || 0} campaigns):\n`;
      marketingChannelsResult.data?.forEach(channel => {
        dataContextMessage += `- ${channel.channel_name} (${channel.channel_type}): Spend=$${channel.spend_amount}, `;
        if (channel.impressions) dataContextMessage += `Impressions=${channel.impressions}, `;
        if (channel.clicks) dataContextMessage += `Clicks=${channel.clicks}, `;
        if (channel.conversions) dataContextMessage += `Conversions=${channel.conversions}, `;
        if (channel.engagement_rate) dataContextMessage += `Engagement=${channel.engagement_rate}%`;
        if (channel.promotions) dataContextMessage += `, Promo=${channel.promotions.promotion_name}`;
        dataContextMessage += `\n`;
      });
      
      // Competitor intelligence
      dataContextMessage += `\n\nCOMPETITOR INTELLIGENCE (${competitorDataResult.data?.length || 0} observations):\n`;
      competitorDataResult.data?.forEach(comp => {
        dataContextMessage += `- ${comp.competitor_name} (${comp.product_category}): Pricing Index=${comp.pricing_index}, `;
        dataContextMessage += `Promo Intensity=${comp.promotion_intensity}, Market Share=${comp.market_share_percent}%, `;
        dataContextMessage += `Date=${comp.observation_date}, Notes: ${comp.notes}\n`;
      });
      
      // Store performance
      dataContextMessage += `\n\nSTORE PERFORMANCE (${storePerformanceResult.data?.length || 0} metrics):\n`;
      storePerformanceResult.data?.forEach(perf => {
        dataContextMessage += `- ${perf.stores?.store_name} on ${perf.metric_date}: Traffic=${perf.foot_traffic}, `;
        dataContextMessage += `Avg Basket=$${perf.avg_basket_size}, Conversion=${perf.conversion_rate}%, `;
        dataContextMessage += `Sales=$${perf.total_sales}, Staff=${perf.staff_count}, Weather=${perf.weather_condition}\n`;
      });
      
      // Customer journey
      dataContextMessage += `\n\nCUSTOMER JOURNEY (${customerJourneyResult.data?.length || 0} touchpoints):\n`;
      const journeyByCustomer = customerJourneyResult.data?.reduce((acc: any, touch: any) => {
        const custName = touch.customers?.customer_name || 'Unknown';
        if (!acc[custName]) acc[custName] = [];
        acc[custName].push({
          type: touch.touchpoint_type,
          channel: touch.channel,
          date: touch.touchpoint_date,
          converted: touch.converted
        });
        return acc;
      }, {});
      Object.entries(journeyByCustomer || {}).slice(0, 3).forEach(([customer, touches]: [string, any]) => {
        dataContextMessage += `- ${customer}: ${touches.length} touchpoints, `;
        dataContextMessage += `Converted: ${touches.some((t: any) => t.converted) ? 'Yes' : 'No'}\n`;
      });
      
      // Inventory levels
      dataContextMessage += `\n\nINVENTORY LEVELS (${inventoryLevelsResult.data?.length || 0} items tracked):\n`;
      inventoryLevelsResult.data?.forEach(inv => {
        dataContextMessage += `- ${inv.stores?.store_name} - ${inv.product_sku}: Stock=${inv.stock_level}, `;
        dataContextMessage += `Reorder Point=${inv.reorder_point}, Risk=${inv.stockout_risk}, Last Restocked=${inv.last_restocked}\n`;
      });
      
      dataContextMessage += `\n\n=== CRITICAL: You now have 360-degree data visibility with PRE-COMPUTED ANALYTICS. Use the aggregated metrics above (by discount depth, promotion type, category, region, segment, month) to answer questions directly. For "optimal discount depth" questions, reference the PERFORMANCE BY DISCOUNT DEPTH section. ===\n`;
    } else {
      dataContextMessage = '\n\nNote: No real data available yet. Generate realistic simulated insights.';
    }

    // Build persona-specific context with STRICT filtering
    const CONSUMABLE_CATEGORIES = ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'];
    const NON_CONSUMABLE_CATEGORIES = ['Personal Care', 'Home Care', 'Household'];
    
    const personaContext = persona === 'executive' 
      ? `PERSONA: EXECUTIVE (Strategic Leadership View)
You are providing insights for C-level executives. Focus on:
- Strategic portfolio-wide performance across ALL categories (consumables AND non-consumables)
- Include analysis of BOTH consumable categories (${CONSUMABLE_CATEGORIES.join(', ')}) AND non-consumable categories (${NON_CONSUMABLE_CATEGORIES.join(', ')})
- High-level KPIs, trends, and cross-category opportunities
- Competitive positioning and market share implications
- Long-term growth opportunities and risk mitigation
- Resource allocation recommendations across business units
- Language should be strategic and business-outcome focused
- Compare division performance (grocery vs home care) when relevant
- Focus on aggregate metrics and portfolio-level decisions`
      : persona === 'consumables'
      ? `PERSONA: CATEGORY MANAGER - CONSUMABLES (Tactical Grocery Analysis)
You are providing insights for a Category Manager responsible ONLY for grocery/consumables.

CRITICAL FILTER: ONLY analyze and mention these categories: ${CONSUMABLE_CATEGORIES.join(', ')}
DO NOT include or reference: ${NON_CONSUMABLE_CATEGORIES.join(', ')}

Focus on:
- SKU-level performance within grocery categories ONLY
- Promotional mechanics effectiveness (BOGO, depth, timing) for grocery items
- Vendor funding negotiations and trade spend ROI for grocery brands
- Competitive pricing against grocery peers
- Shelf space and assortment optimization for food/beverage
- Weekly/seasonal planning for consumable categories
- Language should be tactical and execution-focused
- All chartData, recommendations, and insights must be filtered to consumables only`
      : `PERSONA: CATEGORY MANAGER - NON-CONSUMABLES (Tactical Personal/Home Care Analysis)
You are providing insights for a Category Manager responsible ONLY for non-consumables.

CRITICAL FILTER: ONLY analyze and mention these categories: ${NON_CONSUMABLE_CATEGORIES.join(', ')}
DO NOT include or reference: ${CONSUMABLE_CATEGORIES.join(', ')}

Focus on:
- Non-consumable SKU performance (soaps, oils, cleaning products, personal care)
- Higher-margin item optimization strategies for household/personal care
- Cross-selling opportunities within personal care and home care
- Seasonal trends for cleaning and personal care products
- Brand performance in non-consumable aisles
- Promotional strategies specific to non-grocery items
- Language should be tactical and execution-focused
- All chartData, recommendations, and insights must be filtered to non-consumables only`;

    // Build KPI focus instructions if user selected specific KPIs
    const kpiInstructions = selectedKPIs && selectedKPIs.length > 0 
      ? `
USER-SELECTED KPIs FOR FOCUSED ANALYSIS (CRITICAL - THESE MUST APPEAR IN YOUR ANSWER):
The user has specifically selected these KPIs: ${selectedKPIs.join(', ')}

MANDATORY KPI DISPLAY REQUIREMENTS:
1. For EACH selected KPI, you MUST calculate and display the actual value in your answer
2. Include a "selectedKpiValues" object in your response with each KPI and its calculated value
3. In whatHappened bullets, START with the selected KPI values and their context
4. In why section, EXPLAIN what drives each selected KPI
5. In whatToDo section, provide SPECIFIC actions to improve each selected KPI with TARGET numbers
6. chartData MUST include columns for selected KPIs (e.g., if user selected "roi" and "lift_pct", each chart item must have these fields)

KPI CALCULATION FORMULAS (use ACTUAL database values):
- roi: (Revenue - Cost - Discounts - Spend) / Spend * 100, format as "1.85x"
- lift_pct: ((Promo Sales - Baseline Sales) / Baseline Sales) * 100, format as "+18.5%"
- incremental_margin: Revenue - Baseline Revenue - Variable Costs, format as "$XXX,XXX"
- promo_spend: Sum of promotion total_spend, format as "$XXX,XXX"
- revenue: Sum of transaction total_amount, format as "$X.XXM"
- gross_margin: Revenue - COGS, format as "$XXX,XXX"
- margin_pct: (Gross Margin / Revenue) * 100, format as "XX.X%"
- aov: Total Revenue / Transaction Count, format as "$XX.XX"
- units_sold: Sum of transaction quantities, format as "XX,XXX units"
- customer_count: Distinct customer_ids, format as "X,XXX customers"
- clv: Sum of customer total_lifetime_value / count, format as "$X,XXX"
- retention_rate: Repeat customers / Total customers * 100, format as "XX%"
- conversion_rate: Transactions / Store foot traffic * 100, format as "XX.X%"
- redemption_rate: Redeemed / Issued * 100, format as "XX%"
- market_share: Category sales / Total category market * 100, format as "XX.X%"
- stock_level: Current inventory units, format as "X,XXX units"
- stockout_risk: Items at risk / Total items * 100, format as "XX% at risk"
- impressions: Marketing channel impressions sum, format as "X.XM"
- ctr: Clicks / Impressions * 100, format as "X.XX%"
- roas: Revenue / Marketing Spend, format as "X.Xx"
- category_share: Category revenue / Total revenue * 100, format as "XX.X%"
- halo_effect: Related product lift %, format as "+X.X%"
- cannibalization: Lost sales from substitution / Promo sales * 100, format as "X.X%"
- price_elasticity: % Change in demand / % Change in price, format as "-X.XX"

EXAMPLE: If user selected ["roi", "lift_pct", "incremental_margin"]:
- whatHappened MUST include: "ROI reached 1.85x on Dairy BOGO promotion, with 18.5% lift and $342,500 incremental margin"
- selectedKpiValues MUST include: {"roi": 1.85, "lift_pct": 18.5, "incremental_margin": 342500}
`
      : '';

    const systemPrompt = `You are an advanced promotion analytics AI assistant specialized in retail promotion intelligence. Your PRIMARY DIRECTIVE is to provide 100% relevant, data-driven answers grounded in the actual database context provided below.

${personaContext}

${kpiInstructions}

CRITICAL RELEVANCE REQUIREMENTS - ANSWER MUST BE 100% LINKED TO QUESTION:
1. READ THE QUESTION CAREFULLY - identify exactly what is being asked (promotion name, category, metric, time period, etc.)
2. EXTRACT KEY ENTITIES from the question and MATCH them EXACTLY to database records
3. NEVER provide generic or hypothetical answers - use ONLY specific numbers from the real data
4. If the user asks about specific promotions, products, stores, or metrics, reference the EXACT items from the database
5. Calculate metrics (ROI, margin, lift) directly from transaction data, promotion spend, and product costs
6. Cross-reference multiple data sources (transactions + promotions + products + stores) for comprehensive analysis
7. If insufficient data exists for a specific question, acknowledge this and work with available related data
${categories ? `8. FILTER YOUR ANALYSIS TO ONLY INCLUDE THESE CATEGORIES: ${categories.join(', ')}` : ''}

PRE-FLIGHT VALIDATION (DO THIS BEFORE GENERATING ANSWER):
1. Parse the question to identify: 
   - What entity type is being asked about? (promotion, category, product, store, region, time period)
   - What metric is being requested? (ROI, margin, sales, lift, spend, units)
   - What filter/scope is specified? (top N, specific name, time range, category filter)
   - What analysis type? (comparison, trend, optimization, ranking, forecasting)
2. Locate the EXACT matching data in the database context
3. Calculate the requested metrics DIRECTLY from raw data
4. Verify your answer addresses the SPECIFIC question asked

QUESTION-TO-DATA MAPPING EXAMPLES:
- "Top 5 promotions by ROI" → Find 5 promotions with highest (Margin-Spend)/Spend from INDIVIDUAL PROMOTION PERFORMANCE
- "Which Dairy promotions lost money" → Filter promotions where product_category='Dairy' AND ROI < 0 or margin < 0
- "Optimal discount depth for Beverages" → Analyze PERFORMANCE BY DISCOUNT DEPTH filtered to Beverages category
- "Best promotion mechanic for Snacks" → Compare PERFORMANCE BY PROMOTION TYPE filtered to Snacks category
- "Store performance comparison" → Use PERFORMANCE BY REGION data
- "Customer segment analysis" → Use PERFORMANCE BY CUSTOMER SEGMENT data

UNIVERSAL QUESTION HANDLING:
You can answer ANY question about:
- Promotion performance (ROI, margin, lift, incrementality)
- Product/category analysis (sales, margins, elasticity)
- Store/regional performance
- Customer behavior and segmentation
- Marketing channel effectiveness
- Competitor positioning
- Inventory and supply chain impact on promotions
- Temporal patterns (daily, weekly, seasonal)
- Discount optimization and pricing strategies
- Promotional mechanics comparison (BOGO, percent off, dollar off, coupons)
- Future forecasting and predictive analytics (sales forecasts, demand projections, trend analysis)
- Time-series analysis with historical trends and future predictions
- Risk assessment and underperforming campaigns

FORECASTING & TREND ANALYSIS REQUIREMENTS:
When user asks forecasting questions (keywords: "forecast", "predict", "future", "next", "trend", "projection", "will"):
1. Analyze historical data patterns from transactions and promotions
2. Calculate trend lines using time-series data (week-over-week, month-over-month)
3. Generate chartData with time periods (weeks/months) showing both historical and forecasted values
4. Include confidence intervals in predictions
5. Set drillPath to time-based hierarchy: ["month", "week", "day", "category", "store"]
6. In predictions section, provide specific numerical forecasts with timeframes
7. Identify seasonal patterns and cyclical trends from historical data
8. Chart should show clear visual trend line from past into future

${dataContextMessage}

Your response MUST be a valid JSON object with this exact structure:
{
  "whatHappened": ["bullet point 1 with specific KPI values", "bullet point 2 with numbers", "bullet point 3 with data"],
  "why": ["data-backed reason 1 with correlation %", "reason 2 with specific metrics", "reason 3 tied to actual patterns"],
  "whatToDo": ["ACTION-DRIVEN recommendation with TARGET: 'Increase Dairy BOGO from 20% to 25% discount - projected to lift ROI from 1.2x to 1.6x based on elasticity of -1.8'", "Second specific action with expected outcome and timeline"],
  "kpis": {
    "liftPct": number (calculated from actual data),
    "roi": number (calculated as (margin - spend) / spend from actual data),
    "incrementalMargin": number (sum of margins from relevant transactions),
    "spend": number (sum of total_spend from relevant promotions)
  },
  "selectedKpiValues": {
    "kpi_id": {"value": number, "formatted": "formatted string", "trend": "+X% vs prior period"}
  },
  "chartData": [
    {"name": "Category A", "roi": number, "margin": number, "forecast": number},
    {"name": "Category B", "roi": number, "margin": number, "forecast": number}
  ],
  "drillPath": ["level1", "level2", "level3", ...],
  "nextQuestions": ["question 1", "question 2"],
  "sources": "string describing data sources",
  "predictions": {
    "forecast": ["SPECIFIC prediction with number: 'Beverages ROI will increase to 1.95x by Q2 if 20% discount maintained'", "Second prediction with $ impact", "Third prediction with timeline"],
    "confidence": number (between 0.6 and 0.95),
    "timeframe": "string like 'Next 4 weeks' or 'Q2 2024'",
    "projectedImpact": {
      "revenue": number,
      "margin": number,
      "roi": number
    }
  },
  "causalDrivers": [
    {
      "driver": "string describing the factor",
      "impact": "QUANTIFIED impact: '+$125K margin' or '-15% conversion'",
      "correlation": number (between -1 and 1),
      "actionable": "specific action to leverage/mitigate this driver"
    }
  ],
  "mlInsights": [
    {
      "pattern": "string describing detected pattern from actual data",
      "significance": "string explaining business impact with $ or % numbers",
      "recommendation": "specific action based on this pattern"
    }
  ]
}

CRITICAL: ACTION-DRIVEN RECOMMENDATIONS WITH SPECIFIC NUMBERS
Your whatToDo recommendations MUST follow this format:
1. SPECIFIC ACTION: What exactly to do (e.g., "Increase discount from 15% to 20%", "Shift $50K budget from Snacks to Dairy")
2. TARGET METRIC: What KPI will improve and by how much (e.g., "ROI projected to increase from 1.2x to 1.6x")
3. DATA JUSTIFICATION: Why this works (e.g., "based on price elasticity of -1.8 and 23% lift at 20% depth in test stores")
4. TIMELINE: When to implement (e.g., "Implement in Q1 2025 before seasonal peak")
5. RISK MITIGATION: What could go wrong and how to monitor (e.g., "Monitor cannibalization rate weekly - abort if >25%")

BAD RECOMMENDATION (too generic): "Consider increasing promotional activity"
GOOD RECOMMENDATION: "Increase Dairy BOGO promotion budget by $75K (from $200K to $275K) to capture 12% more market share - based on 1.85x ROI performance and 18% lift in Northeast stores. Expected incremental margin: $138K over 6 weeks. Monitor cannibalization vs yogurt category weekly."

PREDICTIVE FORECAST REQUIREMENTS:
1. EVERY answer must include predictions with SPECIFIC NUMBERS
2. Base forecasts on historical trends from PERFORMANCE BY MONTH data
3. Include confidence intervals (e.g., "ROI forecast: 1.6x-1.9x with 85% confidence")
4. Project specific $ impacts (e.g., "Expected revenue uplift: $2.3M over Q2")
5. Provide 3 forecast scenarios: conservative, expected, optimistic
6. Tie forecasts to actionable triggers (e.g., "If conversion drops below 12%, reduce discount to 15%")

CRITICAL: REALISTIC NUMBERS FOR $3-4 BILLION US GROCERY RETAILER
This retailer represents a major US grocery chain with:
- Annual Revenue: $3.5-4 billion USD
- 50 stores across 5 US regions
- ~80 products/SKUs across 9 categories
- Typical grocery industry benchmarks apply

SCALING FACTOR: The sample database contains representative transactions. When reporting numbers, SCALE appropriately:
- Total annual promotion spend: $40-60 million (1.2-1.5% of revenue)
- Individual major promotion spend: $200K-$800K per campaign
- Category-level promotion ROI: typically 0.8 to 2.5 (some negative, most positive)
- Lift percentages: typically 8-35% for successful promotions
- Incremental margin per major promotion: $50K-$500K
- Weekly store revenue: $1.3-1.8 million per store
- Annual category revenue: $200M-$600M per major category

REALISTIC BENCHMARK RANGES FOR US GROCERY:
- Promotion ROI: 0.6 to 2.8 (healthy range 1.2-1.8)
- Lift %: 5% to 40% (average 15-22%)
- Margin impact: -2% to +8% (target +2-4%)
- Discount depth effectiveness: 15-25% discounts typically optimal
- Customer segment response rates: 12-35%
- Cannibalization rates: 8-25% for aggressive promos

CRITICAL KPI CALCULATION RULES (USE ACTUAL DATA, SCALE APPROPRIATELY):
- liftPct: Calculate proportionally, ensure realistic range (5-40%)
- roi: Scale to realistic range (0.6-2.8), most should be 0.9-1.8
- incrementalMargin: Scale to realistic $ amounts ($50K-$2M for major campaigns)
- spend: Scale to realistic promotion budgets ($100K-$800K per campaign)

CRITICAL DRILL PATH RULES (MANDATORY - NEVER SKIP):
- drillPath array MUST NEVER be empty - always provide at least 4-6 levels
- DEFAULT drillPath if unsure: ["category", "brand", "sku", "store", "region"]
- drillPath defines dynamic hierarchical breakdown - start from higher aggregation levels
- Choose paths that match the question focus:
  * For ROI/performance questions: ["category", "brand", "sku", "store", "region"]
  * For depth optimization: ["category", "depth", "sku", "store"]
  * For regional analysis: ["region", "store", "category", "brand", "sku"]
  * For customer analysis: ["customer_segment", "category", "brand", "sku", "store"]
  * For forecasting/trend: ["month", "quarter", "week", "category", "brand", "sku"]
  * For inventory questions: ["category", "sku", "store", "region"]
  * For competitive analysis: ["category", "brand", "sku", "region", "store"]
  * For timing analysis: ["month", "week", "day", "category", "store"]
  * For market share questions: ["category", "region", "store", "brand", "sku"]
- CRITICAL: Start with category/region/segment (aggregated), then drill to sku/store/day (granular)
- Available drill levels: category, brand, sku, store, region, customer_segment, depth, month, week, day, quarter, year
- The drill-down will use REAL DATA from all 11 database sources for each level
- ALWAYS return 4-6 drill levels - never an empty array
- Order from broadest to most granular

CRITICAL CHART DATA RULES (MANDATORY - NEVER SKIP):
- chartData array MUST NEVER be empty - always provide at least 3-6 data points
- Every chartData item MUST have a "name" field (string) and at least one numeric field
- STANDARD FORMAT: {"name": "Item Name", "value": number, "margin": number, "roi": number}
- For comparison questions: include "value" or "margin" as primary metric with actual $ amounts
- For market share questions: use {"name": "Category", "market_share": number, "competitor_avg_share": number}
- For trend/forecast questions: use {"name": "Jan 2024", "value": number, "forecast": number}
- ALWAYS scale values to realistic amounts - margins should be $50K-$2M, not $0
- If user asks "top 5 promotions", return 5 promotions with their ACTUAL names, ROI, and margin values
- If user asks "optimal discount depth", return discount levels with their ACTUAL performance metrics
- chartData values MUST be non-zero realistic numbers from the pre-computed analytics sections
- Return 5-8 items for trends, 3-6 items for comparisons - NEVER return empty arrays

ANSWER ACCURACY STANDARDS:
- EVERY bullet point must cite SPECIFIC promotion names, product names, store names, and dollar amounts from the database
- ALL numbers must be CALCULATED or EXTRACTED directly from the database context - never estimated or made up
- ROI = (Incremental Margin - Spend) / Spend - calculate this EXACTLY from the data
- Incremental Margin = Revenue - Product Cost - Discounts (from transaction data)
- AVOID vague statements like "many promotions" or "some stores" - use EXACT counts and ACTUAL names
- Avoid markdown formatting (no asterisks, bold, or special characters)
- Make insights immediately actionable with specific next steps
- If asked about items not in the database, state this clearly and analyze available related items

FINAL VALIDATION CHECKLIST (VERIFY BEFORE RETURNING):
1. Does your answer DIRECTLY address the SPECIFIC question asked? (not a general overview)
2. Are ALL promotion names, product names, store names in your answer EXACT matches from the database?
3. Are ALL dollar amounts and percentages CALCULATED from actual database values (not estimated)?
4. Does chartData contain items that DIRECTLY answer the question with REAL metrics?
5. Are KPI values derived from ACTUAL database calculations?
6. Would a user comparing your answer to the database find 100% accuracy?

Remember: Your credibility depends on 100% precision. Every number, every name, every insight must be DIRECTLY traceable to the database context provided. Generic or approximate answers are unacceptable.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `QUESTION: "${question}"

MANDATORY PRE-ANALYSIS STEPS:
1. PARSE THE QUESTION: What specific entity is being asked about? (promotion name, category, product, store, time period, metric)
2. LOCATE IN DATABASE: Find the EXACT matching records in the database context above
3. CALCULATE METRICS: Compute ROI, margin, spend, etc. DIRECTLY from the raw data for those specific records
4. VERIFY SCOPE: Ensure your answer stays within the scope of what was asked - no tangential information

RESPONSE REQUIREMENTS:
1. Answer ONLY this specific question - do not add unrelated information
2. Every promotion, product, or store name you mention MUST appear EXACTLY in the database context
3. Every number (ROI, margin, spend, units) MUST be calculated from actual database values
4. If the question asks for "top N" items, return exactly N items with their REAL names and ACTUAL metrics
5. If the question asks "why", trace root causes to specific data patterns
6. If the question asks "how to optimize", base recommendations on comparative data analysis
7. chartData must contain items that DIRECTLY answer the question with REAL metrics from the database
8. KPIs must be aggregated from the actual relevant records

ACCURACY CHECK - Before responding, verify:
- Can you point to the exact database records supporting each claim?
- Are all dollar amounts and percentages calculated (not estimated)?
- Does your chartData contain ACTUAL items from the database?

Now analyze and provide a 100% accurate, data-driven answer to the question above.` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    let analysisResult;
    try {
      const content = data.choices[0].message.content;
      console.log('Raw AI content:', content);
      
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      analysisResult = JSON.parse(jsonString);
      console.log('Parsed analysis result:', analysisResult);
      
      // POST-PROCESSING: Ensure all KPIs are numeric (not strings)
      if (analysisResult.kpis) {
        const kpis = analysisResult.kpis;
        
        // Convert liftPct - if it's a string or null, calculate from data or set default
        if (typeof kpis.liftPct !== 'number' || isNaN(kpis.liftPct) || kpis.liftPct === null) {
          // Try to calculate lift from available data
          const transactions = transactionsResult.data || [];
          if (transactions.length > 0) {
            const promoTxns = transactions.filter((t: any) => t.promotion_id);
            const nonPromoTxns = transactions.filter((t: any) => !t.promotion_id);
            if (promoTxns.length > 0 && nonPromoTxns.length > 0) {
              const avgPromoRevenue = promoTxns.reduce((s: number, t: any) => s + (t.total_amount || 0), 0) / promoTxns.length;
              const avgNonPromoRevenue = nonPromoTxns.reduce((s: number, t: any) => s + (t.total_amount || 0), 0) / nonPromoTxns.length;
              kpis.liftPct = avgNonPromoRevenue > 0 ? ((avgPromoRevenue - avgNonPromoRevenue) / avgNonPromoRevenue * 100) : 0;
            } else {
              kpis.liftPct = 15.0; // Default when cannot calculate
            }
          } else {
            kpis.liftPct = 15.0;
          }
        }
        kpis.liftPct = parseFloat(Number(kpis.liftPct).toFixed(1));
        
        // Ensure ROI is numeric
        if (typeof kpis.roi !== 'number' || isNaN(kpis.roi) || kpis.roi === null) {
          kpis.roi = 1.0;
        }
        kpis.roi = parseFloat(Number(kpis.roi).toFixed(2));
        
        // Ensure incrementalMargin is numeric
        if (typeof kpis.incrementalMargin !== 'number' || isNaN(kpis.incrementalMargin) || kpis.incrementalMargin === null) {
          kpis.incrementalMargin = 0;
        }
        kpis.incrementalMargin = parseFloat(Number(kpis.incrementalMargin).toFixed(2));
        
        // Ensure spend is numeric
        if (typeof kpis.spend !== 'number' || isNaN(kpis.spend) || kpis.spend === null) {
          kpis.spend = 0;
        }
        kpis.spend = parseFloat(Number(kpis.spend).toFixed(2));
        
        analysisResult.kpis = kpis;
        console.log('Post-processed KPIs:', kpis);
      }
      
      // Ensure chartData is never empty and has proper numeric values
      if (!analysisResult.chartData || !Array.isArray(analysisResult.chartData) || analysisResult.chartData.length === 0) {
        // Generate fallback chartData from pre-computed analytics
        const categoryAnalysis: any = {};
        transactionsResult.data?.forEach((txn: any) => {
          const product = productsResult.data?.find((p: any) => p.product_sku === txn.product_sku);
          const category = product?.category || 'Other';
          if (!categoryAnalysis[category]) {
            categoryAnalysis[category] = { revenue: 0, cost: 0, discount: 0 };
          }
          categoryAnalysis[category].revenue += parseFloat(txn.total_amount || 0);
          categoryAnalysis[category].discount += parseFloat(txn.discount_amount || 0);
          categoryAnalysis[category].cost += (product?.cost || 0) * parseInt(txn.quantity || 0);
        });
        
        analysisResult.chartData = Object.entries(categoryAnalysis).slice(0, 6).map(([name, stats]: [string, any]) => ({
          name,
          margin: Math.round(stats.revenue - stats.cost - stats.discount),
          roi: stats.discount > 0 ? parseFloat(((stats.revenue - stats.cost - stats.discount) / stats.discount).toFixed(2)) : 1.5,
          value: Math.round(stats.revenue)
        }));
        console.log('Generated fallback chartData:', analysisResult.chartData);
      } else {
        // Ensure all numeric fields are properly formatted
        analysisResult.chartData = analysisResult.chartData.map((item: any) => {
          const numericFields: any = {};
          Object.keys(item).forEach(key => {
            if (key === 'name') {
              numericFields[key] = item[key];
            } else if (typeof item[key] === 'number' || !isNaN(parseFloat(item[key]))) {
              numericFields[key] = parseFloat(Number(item[key] || 0).toFixed(2));
            }
          });
          // Ensure at least margin and roi exist
          if (numericFields.margin === undefined && numericFields.value !== undefined) {
            numericFields.margin = numericFields.value;
          }
          if (numericFields.roi === undefined) {
            numericFields.roi = 1.0;
          }
          return numericFields;
        });
      }
      
      // Ensure drillPath is never empty
      if (!analysisResult.drillPath || !Array.isArray(analysisResult.drillPath) || analysisResult.drillPath.length === 0) {
        analysisResult.drillPath = ['category', 'brand', 'sku', 'store', 'region'];
        console.log('Applied default drillPath');
      }
      
      // Ensure predictions confidence is numeric
      if (analysisResult.predictions && typeof analysisResult.predictions.confidence !== 'number') {
        analysisResult.predictions.confidence = 0.75;
      }
      
      // Ensure causalDrivers correlation values are numeric
      if (analysisResult.causalDrivers && Array.isArray(analysisResult.causalDrivers)) {
        analysisResult.causalDrivers = analysisResult.causalDrivers.map((driver: any) => ({
          ...driver,
          correlation: parseFloat(Number(driver.correlation || 0.5).toFixed(2))
        }));
      }
      
      // === VERIFICATION LAYER: Cross-check AI answers against actual database ===
      console.log('Starting verification layer...');
      
      // Build verification context from actual database
      const verificationData = {
        promotionNames: new Set(promotionsResult.data?.map((p: any) => p.promotion_name) || []),
        productNames: new Set(productsResult.data?.map((p: any) => p.product_name) || []),
        productSkus: new Set(productsResult.data?.map((p: any) => p.product_sku) || []),
        categories: new Set(productsResult.data?.map((p: any) => p.category) || []),
        brands: new Set(productsResult.data?.map((p: any) => p.brand).filter(Boolean) || []),
        storeNames: new Set(storesResult.data?.map((s: any) => s.store_name) || []),
        regions: new Set(storesResult.data?.map((s: any) => s.region).filter(Boolean) || []),
        customerSegments: new Set(customersResult.data?.map((c: any) => c.segment).filter(Boolean) || []),
      };
      
      // Calculate actual KPIs from database
      const actualKPIs = {
        totalRevenue: 0,
        totalDiscount: 0,
        totalCost: 0,
        totalSpend: 0,
        promoTxnCount: 0,
        nonPromoTxnCount: 0,
        promoRevenue: 0,
        nonPromoRevenue: 0,
      };
      
      transactionsResult.data?.forEach((txn: any) => {
        actualKPIs.totalRevenue += parseFloat(txn.total_amount || 0);
        actualKPIs.totalDiscount += parseFloat(txn.discount_amount || 0);
        const product = productsResult.data?.find((p: any) => p.product_sku === txn.product_sku);
        actualKPIs.totalCost += (product?.cost || 0) * parseInt(txn.quantity || 0);
        
        if (txn.promotion_id) {
          actualKPIs.promoTxnCount++;
          actualKPIs.promoRevenue += parseFloat(txn.total_amount || 0);
        } else {
          actualKPIs.nonPromoTxnCount++;
          actualKPIs.nonPromoRevenue += parseFloat(txn.total_amount || 0);
        }
      });
      
      // Apply realistic spend scaling to verification
      const rawTotalSpend = promotionsResult.data?.reduce((sum: number, p: any) => sum + parseFloat(p.total_spend || 0), 0) || 0;
      const verifySpendScale = rawTotalSpend > actualKPIs.totalRevenue * 0.15 ? (actualKPIs.totalRevenue * 0.12) / rawTotalSpend : 1;
      actualKPIs.totalSpend = rawTotalSpend * verifySpendScale;
      
      const actualMargin = actualKPIs.totalRevenue - actualKPIs.totalCost - actualKPIs.totalDiscount;
      const actualROI = actualKPIs.totalSpend > 0 ? actualMargin / actualKPIs.totalSpend : 0;
      const actualLiftPct = actualKPIs.nonPromoTxnCount > 0 && actualKPIs.promoTxnCount > 0
        ? (((actualKPIs.promoRevenue / actualKPIs.promoTxnCount) - (actualKPIs.nonPromoRevenue / actualKPIs.nonPromoTxnCount)) / (actualKPIs.nonPromoRevenue / actualKPIs.nonPromoTxnCount) * 100)
        : 0;
      
      console.log('Actual KPIs from database (with scaled spend):', { 
        actualMargin, 
        actualROI: actualROI.toFixed(2), 
        actualLiftPct: actualLiftPct.toFixed(1), 
        totalSpend: actualKPIs.totalSpend.toFixed(0),
        totalRevenue: actualKPIs.totalRevenue.toFixed(0)
      });
      
      // === CALCULATE SELECTED KPI VALUES BASED ON USER SELECTION ===
      if (selectedKPIs && selectedKPIs.length > 0) {
        const calculatedKpiValues: any = {};
        const totalTxns = transactionsResult.data?.length || 1;
        const totalUnits = transactionsResult.data?.reduce((sum: number, t: any) => sum + parseInt(t.quantity || 0), 0) || 0;
        const uniqueCustomers = new Set(transactionsResult.data?.map((t: any) => t.customer_id).filter(Boolean)).size;
        
        selectedKPIs.forEach((kpi: string) => {
          switch(kpi.toLowerCase()) {
            case 'roi':
              calculatedKpiValues.roi = { 
                value: parseFloat(actualROI.toFixed(2)), 
                formatted: `${actualROI.toFixed(2)}x`,
                trend: actualROI > 1 ? '+positive ROI' : 'negative ROI'
              };
              break;
            case 'lift_pct':
            case 'liftpct':
              calculatedKpiValues.lift_pct = { 
                value: parseFloat(actualLiftPct.toFixed(1)), 
                formatted: `${actualLiftPct > 0 ? '+' : ''}${actualLiftPct.toFixed(1)}%`,
                trend: actualLiftPct > 0 ? 'positive lift' : 'no lift'
              };
              break;
            case 'incremental_margin':
            case 'incrementalmargin':
              calculatedKpiValues.incremental_margin = { 
                value: Math.round(actualMargin), 
                formatted: `$${(actualMargin / 1000).toFixed(0)}K`,
                trend: actualMargin > 0 ? 'profitable' : 'loss'
              };
              break;
            case 'promo_spend':
            case 'promospend':
              calculatedKpiValues.promo_spend = { 
                value: Math.round(actualKPIs.totalSpend), 
                formatted: `$${(actualKPIs.totalSpend / 1000).toFixed(0)}K`,
                trend: 'total investment'
              };
              break;
            case 'revenue':
              calculatedKpiValues.revenue = { 
                value: Math.round(actualKPIs.totalRevenue), 
                formatted: `$${(actualKPIs.totalRevenue / 1000000).toFixed(2)}M`,
                trend: 'total sales'
              };
              break;
            case 'gross_margin':
            case 'grossmargin':
              const grossMargin = actualKPIs.totalRevenue - actualKPIs.totalCost;
              calculatedKpiValues.gross_margin = { 
                value: Math.round(grossMargin), 
                formatted: `$${(grossMargin / 1000).toFixed(0)}K`,
                trend: `${(grossMargin / actualKPIs.totalRevenue * 100).toFixed(1)}% margin`
              };
              break;
            case 'units_sold':
            case 'unitssold':
              calculatedKpiValues.units_sold = { 
                value: totalUnits, 
                formatted: `${totalUnits.toLocaleString()} units`,
                trend: 'total volume'
              };
              break;
            case 'customer_count':
            case 'customercount':
              calculatedKpiValues.customer_count = { 
                value: uniqueCustomers, 
                formatted: `${uniqueCustomers.toLocaleString()} customers`,
                trend: 'unique buyers'
              };
              break;
            case 'aov':
              const aov = actualKPIs.totalRevenue / totalTxns;
              calculatedKpiValues.aov = { 
                value: parseFloat(aov.toFixed(2)), 
                formatted: `$${aov.toFixed(2)}`,
                trend: 'avg basket'
              };
              break;
          }
        });
        
        // Force override analysisResult.selectedKpiValues with our calculated values
        analysisResult.selectedKpiValues = calculatedKpiValues;
        console.log('Calculated selectedKpiValues:', calculatedKpiValues);
      }
      
      // Verify and correct chartData - ensure all names exist in database
      if (analysisResult.chartData && Array.isArray(analysisResult.chartData)) {
        analysisResult.chartData = analysisResult.chartData.map((item: any) => {
          // Verify the name exists in our data
          const name = item.name;
          const isValidPromo = verificationData.promotionNames.has(name);
          const isValidProduct = verificationData.productNames.has(name);
          const isValidCategory = verificationData.categories.has(name);
          const isValidBrand = verificationData.brands.has(name);
          const isValidStore = verificationData.storeNames.has(name);
          const isValidRegion = verificationData.regions.has(name);
          const isValidSegment = verificationData.customerSegments.has(name);
          
          // If name is not found, try to match to closest valid entity
          if (!isValidPromo && !isValidProduct && !isValidCategory && !isValidBrand && !isValidStore && !isValidRegion && !isValidSegment) {
            console.log(`Chart item "${name}" not found in database, attempting correction...`);
            
            // Find closest match from promotions
            const closestPromo = promotionsResult.data?.find((p: any) => 
              p.promotion_name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(p.promotion_name.toLowerCase().split(' ')[0])
            );
            
            if (closestPromo) {
              // Calculate actual metrics for this promotion
              const promoTxns = transactionsResult.data?.filter((t: any) => t.promotion_id === closestPromo.id) || [];
              const revenue = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
              const discount = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.discount_amount || 0), 0);
              const spend = parseFloat(closestPromo.total_spend || 0) * verifySpendScale;
              
              let cost = 0;
              promoTxns.forEach((t: any) => {
                const prod = productsResult.data?.find((p: any) => p.product_sku === t.product_sku);
                cost += (prod?.cost || 0) * parseInt(t.quantity || 0);
              });
              
              const margin = revenue - cost - discount - spend;
              const roi = spend > 0 ? margin / spend : 0;
              
              return {
                name: closestPromo.promotion_name,
                margin: Math.round(margin),
                roi: parseFloat(roi.toFixed(2)),
                spend: Math.round(spend),
                value: Math.round(revenue)
              };
            }
          }
          
          // If it's a valid promotion, recalculate metrics from actual data
          if (isValidPromo) {
            const promo = promotionsResult.data?.find((p: any) => p.promotion_name === name);
            if (promo) {
              const promoTxns = transactionsResult.data?.filter((t: any) => t.promotion_id === promo.id) || [];
              const revenue = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
              const discount = promoTxns.reduce((sum: number, t: any) => sum + parseFloat(t.discount_amount || 0), 0);
              const spend = parseFloat(promo.total_spend || 0) * verifySpendScale;
              
              let cost = 0;
              promoTxns.forEach((t: any) => {
                const prod = productsResult.data?.find((p: any) => p.product_sku === t.product_sku);
                cost += (prod?.cost || 0) * parseInt(t.quantity || 0);
              });
              
              const margin = revenue - cost - discount - spend;
              const roi = spend > 0 ? margin / spend : 0;
              
              return {
                name: promo.promotion_name,
                margin: Math.round(margin),
                roi: parseFloat(roi.toFixed(2)),
                spend: Math.round(spend),
                value: Math.round(revenue)
              };
            }
          }
          
          // If it's a valid category, recalculate metrics
          if (isValidCategory) {
            const categoryTxns = transactionsResult.data?.filter((t: any) => {
              const prod = productsResult.data?.find((p: any) => p.product_sku === t.product_sku);
              return prod?.category === name;
            }) || [];
            
            const revenue = categoryTxns.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
            const discount = categoryTxns.reduce((sum: number, t: any) => sum + parseFloat(t.discount_amount || 0), 0);
            
            let cost = 0;
            categoryTxns.forEach((t: any) => {
              const prod = productsResult.data?.find((p: any) => p.product_sku === t.product_sku);
              cost += (prod?.cost || 0) * parseInt(t.quantity || 0);
            });
            
            const margin = revenue - cost - discount;
            const roi = discount > 0 ? margin / discount : 0;
            
            return {
              name,
              margin: Math.round(margin),
              roi: parseFloat(roi.toFixed(2)),
              value: Math.round(revenue)
            };
          }
          
          // If it's a valid region, recalculate metrics
          if (isValidRegion) {
            const regionStores = storesResult.data?.filter((s: any) => s.region === name) || [];
            const storeIds = regionStores.map((s: any) => s.id);
            const regionTxns = transactionsResult.data?.filter((t: any) => storeIds.includes(t.store_id)) || [];
            
            const revenue = regionTxns.reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);
            const discount = regionTxns.reduce((sum: number, t: any) => sum + parseFloat(t.discount_amount || 0), 0);
            
            let cost = 0;
            regionTxns.forEach((t: any) => {
              const prod = productsResult.data?.find((p: any) => p.product_sku === t.product_sku);
              cost += (prod?.cost || 0) * parseInt(t.quantity || 0);
            });
            
            const margin = revenue - cost - discount;
            const roi = discount > 0 ? margin / discount : 0;
            
            return {
              name,
              margin: Math.round(margin),
              roi: parseFloat(roi.toFixed(2)),
              value: Math.round(revenue)
            };
          }
          
          return item;
        });
        
        console.log('Verified chartData:', analysisResult.chartData.length, 'items');
      }
      
      // Verify KPIs are within reasonable bounds based on actual data
      if (analysisResult.kpis) {
        const kpis = analysisResult.kpis;
        
        // ALWAYS set liftPct from actual data if null/undefined/NaN
        if (kpis.liftPct === null || kpis.liftPct === undefined || isNaN(kpis.liftPct)) {
          kpis.liftPct = parseFloat(actualLiftPct.toFixed(1));
          console.log('Set liftPct from actual data:', kpis.liftPct);
        } else if (Math.abs(kpis.liftPct) > 100) {
          kpis.liftPct = parseFloat(actualLiftPct.toFixed(1));
          console.log('Corrected extreme liftPct to:', kpis.liftPct);
        }
        
        // ALWAYS set ROI from actual data if null/undefined/NaN or unrealistic
        if (kpis.roi === null || kpis.roi === undefined || isNaN(kpis.roi) || Math.abs(kpis.roi) > 10) {
          kpis.roi = parseFloat(actualROI.toFixed(2));
          console.log('Set ROI from actual data:', kpis.roi);
        }
        
        // ALWAYS set spend from actual data if null/undefined or unrealistic
        if (kpis.spend === null || kpis.spend === undefined || kpis.spend < 0 || kpis.spend > actualKPIs.totalSpend * 2) {
          kpis.spend = Math.round(actualKPIs.totalSpend);
          console.log('Set spend from actual data:', kpis.spend);
        }
        
        // ALWAYS set margin from actual data if null/undefined or unrealistic
        if (kpis.incrementalMargin === null || kpis.incrementalMargin === undefined || Math.abs(kpis.incrementalMargin) > actualMargin * 3) {
          kpis.incrementalMargin = Math.round(actualMargin);
          console.log('Set incrementalMargin from actual data:', kpis.incrementalMargin);
        }
        
        analysisResult.kpis = kpis;
      } else {
        // If no kpis object at all, create one from actual data
        analysisResult.kpis = {
          liftPct: parseFloat(actualLiftPct.toFixed(1)),
          roi: parseFloat(actualROI.toFixed(2)),
          incrementalMargin: Math.round(actualMargin),
          spend: Math.round(actualKPIs.totalSpend)
        };
        console.log('Created kpis from actual data:', analysisResult.kpis);
      }
      
      // ALWAYS include lift_pct in selectedKpiValues if user selected it
      if (selectedKPIs && selectedKPIs.length > 0) {
        const liftKpiNames = ['lift_pct', 'liftpct', 'lift %', 'lift', 'lift_percent'];
        const hasLiftSelected = selectedKPIs.some((kpi: string) => 
          liftKpiNames.includes(kpi.toLowerCase().replace(/[^a-z_]/g, '').replace('percent', 'pct'))
        );
        
        if (hasLiftSelected && !analysisResult.selectedKpiValues?.lift_pct) {
          if (!analysisResult.selectedKpiValues) analysisResult.selectedKpiValues = {};
          analysisResult.selectedKpiValues.lift_pct = { 
            value: parseFloat(actualLiftPct.toFixed(1)), 
            formatted: `${actualLiftPct > 0 ? '+' : ''}${actualLiftPct.toFixed(1)}%`,
            trend: actualLiftPct > 0 ? 'positive lift' : actualLiftPct < 0 ? 'negative lift' : 'no lift'
          };
          console.log('Added lift_pct to selectedKpiValues:', analysisResult.selectedKpiValues.lift_pct);
        }
      }
      
      // Add verification metadata
      analysisResult.verified = true;
      analysisResult.dataSource = {
        promotions: promotionsResult.data?.length || 0,
        transactions: transactionsResult.data?.length || 0,
        products: productsResult.data?.length || 0,
        stores: storesResult.data?.length || 0,
        customers: customersResult.data?.length || 0,
      };
      
      console.log('Verification complete. Data source counts:', analysisResult.dataSource);
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Enrich with real drill-down data from all data sources
    if (analysisResult.drillPath && analysisResult.drillPath.length > 0) {
      console.log('Enriching drill-down with real data from all sources...');
      
      try {
        // Fetch all data needed for drill-down enrichment
        const [productsRes, storesRes, txRes, customersRes] = await Promise.all([
          supabaseClient.from('products').select('*').order('category'),
          supabaseClient.from('stores').select('*, store_performance(*)').order('store_code'),
          supabaseClient.from('transactions').select(`
            product_sku,
            store_id,
            customer_id,
            quantity,
            unit_price,
            total_amount,
            discount_amount,
            promotion_id,
            transaction_date
          `).order('transaction_date', { ascending: false }).limit(5000),
          supabaseClient.from('customers').select('*').order('segment')
        ]);

        const enrichedLevels: any[] = [];
        
        // Process each drill level
        for (const level of analysisResult.drillPath) {
          let levelData = null;
          
          switch (level) {
            case 'category':
              levelData = productsRes.data?.reduce((acc: any[], p: any) => {
                if (!acc.find(x => x.category === p.category)) {
                  acc.push({
                    category: p.category,
                    base_price: p.base_price,
                    cost: p.cost,
                    margin_percent: p.margin_percent
                  });
                }
                return acc;
              }, []);
              break;
              
            case 'brand':
              levelData = productsRes.data?.filter((p: any) => p.brand).reduce((acc: any[], p: any) => {
                if (!acc.find(x => x.brand === p.brand)) {
                  acc.push({
                    brand: p.brand,
                    category: p.category,
                    base_price: p.base_price,
                    cost: p.cost,
                    margin_percent: p.margin_percent
                  });
                }
                return acc;
              }, []);
              break;
              
            case 'sku':
              levelData = productsRes.data?.map((p: any) => ({
                product_sku: p.product_sku,
                product_name: p.product_name,
                brand: p.brand,
                category: p.category,
                base_price: p.base_price,
                cost: p.cost,
                margin_percent: p.margin_percent,
                price_elasticity: p.price_elasticity
              }));
              break;
              
            case 'store':
              levelData = storesRes.data?.map((s: any) => ({
                store_code: s.store_code,
                store_name: s.store_name,
                region: s.region,
                store_type: s.store_type,
                store_performance: s.store_performance
              }));
              break;
              
            case 'region':
              levelData = storesRes.data?.reduce((acc: any[], s: any) => {
                if (s.region && !acc.find(x => x.region === s.region)) {
                  acc.push({ region: s.region });
                }
                return acc;
              }, []);
              break;
              
            case 'customer_segment':
              levelData = customersRes.data?.reduce((acc: any[], c: any) => {
                if (c.segment && !acc.find(x => x.segment === c.segment)) {
                  acc.push({
                    segment: c.segment,
                    loyalty_tier: c.loyalty_tier,
                    total_lifetime_value: c.total_lifetime_value
                  });
                }
                return acc;
              }, []);
              break;
          }
          
          if (levelData && levelData.length > 0) {
            enrichedLevels.push({ level, data: levelData });
          }
        }
        
        // Attach enriched data and transactions to the response
        analysisResult.enrichedData = {
          path: analysisResult.drillPath,
          enrichedLevels,
          transactions: txRes.data || [],
          products: productsRes.data || [],
          stores: storesRes.data || [],
          customers: customersRes.data || []
        };
        
        console.log(`Enriched ${enrichedLevels.length} drill levels with real data`);
      } catch (enrichError) {
        console.error('Error enriching drill-down data:', enrichError);
        // Continue without enriched data - will fall back to mock data
      }
    }

    // === CACHE WRITE ===
    // Store successful response in cache for future requests
    try {
      const { error: cacheError } = await supabaseClient
        .from('question_cache')
        .upsert({
          persona,
          question: question.substring(0, 500), // Limit question length
          question_hash: questionHash,
          response: analysisResult,
          hit_count: 0,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }, { onConflict: 'persona,question_hash' });
      
      if (cacheError) {
        console.error('Failed to cache response:', cacheError);
      } else {
        console.log('Response cached successfully for hash:', questionHash);
      }
    } catch (cacheWriteError) {
      console.error('Cache write error:', cacheWriteError);
      // Continue - caching failure shouldn't break the response
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );

  } catch (error) {
    console.error('Error in analyze-question function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
