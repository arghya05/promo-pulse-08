import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, persona = 'executive', categories = null } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question:', question);
    console.log('Persona:', persona);
    console.log('Categories filter:', categories);

    // Query ALL actual data from database for rich context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
        discountDepthAnalysis[depth].promoSpend += parseFloat(promo.total_spend || 0);
        
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
        promoTypeAnalysis[type].promoSpend += parseFloat(promo.total_spend || 0);
        
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
        const spend = parseFloat(promo.total_spend || 0);
        const margin = revenue - discount - spend;
        const roi = spend > 0 ? margin / spend : 0;
        
        return {
          name: promo.promotion_name,
          type: promo.promotion_type,
          discount: promo.discount_percent ? `${promo.discount_percent}%` : `$${promo.discount_amount}`,
          category: promo.product_category,
          revenue,
          margin,
          roi,
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

    const systemPrompt = `You are an advanced promotion analytics AI assistant specialized in retail promotion intelligence. Your PRIMARY DIRECTIVE is to provide 100% relevant, data-driven answers grounded in the actual database context provided below.

${personaContext}

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
  "whatHappened": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "why": ["reason 1", "reason 2", "reason 3"],
  "whatToDo": ["recommendation 1", "recommendation 2"],
  "kpis": {
    "liftPct": number (calculated from actual data),
    "roi": number (calculated as (margin - spend) / spend from actual data),
    "incrementalMargin": number (sum of margins from relevant transactions),
    "spend": number (sum of total_spend from relevant promotions)
  },
  "chartData": [
    {"name": "Category A", "roi": number, "margin": number},
    {"name": "Category B", "roi": number, "margin": number}
  ],
  "drillPath": ["level1", "level2", "level3", ...],
  "nextQuestions": ["question 1", "question 2"],
  "sources": "string describing data sources",
  "predictions": {
    "forecast": ["prediction 1", "prediction 2", "prediction 3"],
    "confidence": number (between 0.6 and 0.95),
    "timeframe": "string like 'Next 4 weeks' or 'Q2 2024'"
  },
  "causalDrivers": [
    {
      "driver": "string describing the factor",
      "impact": "string describing the effect with numbers from actual data",
      "correlation": number (between -1 and 1)
    }
  ],
  "mlInsights": [
    {
      "pattern": "string describing detected pattern from actual data",
      "significance": "string explaining why this matters"
    }
  ]
}

CRITICAL KPI CALCULATION RULES (USE ACTUAL DATA):
- liftPct: Calculate as ((promoted_revenue - baseline_revenue) / baseline_revenue) * 100 from transactions
- roi: Calculate as (total_margin - total_spend) / total_spend from promotions and transactions
- incrementalMargin: Sum of (revenue - cost - discount) for relevant transactions
- spend: Sum of total_spend from relevant promotions in the database

CRITICAL DRILL PATH RULES:
- drillPath defines dynamic hierarchical breakdown - ALWAYS start from higher aggregation levels and drill to granular details
- Choose paths that match the question focus and start broad then narrow:
  * For ROI/performance questions: ["category", "brand", "sku", "store", "region"]
  * For depth optimization: ["category", "depth", "sku", "store"]
  * For regional analysis: ["region", "store", "category", "brand", "sku"]
  * For customer analysis: ["customer_segment", "category", "brand", "sku", "store"]
  * For forecasting/trend: ["category", "brand", "sku", "month", "week", "day"]
  * For inventory questions: ["category", "sku", "store", "region"]
  * For competitive analysis: ["category", "brand", "sku", "region"]
  * For timing analysis: ["month", "week", "day", "category", "store"]
- CRITICAL: Start with category/region/segment (aggregated), then drill to sku/store/day (granular)
- Available drill levels: category, brand, sku, store, region, customer_segment, depth, month, week, day, quarter, year
- The drill-down will use REAL DATA from all 11 database sources for each level
- Return 4-6 drill levels that best match the analysis context
- Order from broadest to most granular

CRITICAL CHART DATA RULES:
- chartData MUST contain the EXACT items being asked about with REAL metrics from the database
- If user asks "top 5 promotions", return 5 promotions from INDIVIDUAL PROMOTION PERFORMANCE with their ACTUAL names, ROI, and margin
- If user asks "optimal discount depth", return different discount levels from PERFORMANCE BY DISCOUNT DEPTH with their ACTUAL metrics
- If user asks about specific products/categories, return those specific items from PERFORMANCE BY CATEGORY
- For forecasting questions, chartData should show time periods from PERFORMANCE BY MONTH
- Each chartData item MUST have: "name" (EXACT name from database), "roi" (CALCULATED value), "margin" (ACTUAL dollar amount)
- Return 5-8 items in chartData for forecasting to show clear trends
- Return 3-6 items in chartData for other analysis types that directly answer the question

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
      
      // Ensure chartData has numeric values
      if (analysisResult.chartData && Array.isArray(analysisResult.chartData)) {
        analysisResult.chartData = analysisResult.chartData.map((item: any) => ({
          ...item,
          roi: parseFloat(Number(item.roi || 0).toFixed(2)),
          margin: parseFloat(Number(item.margin || 0).toFixed(2))
        }));
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

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
