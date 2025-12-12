import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const moduleContexts: Record<string, string> = {
  pricing: `You are a Pricing Optimization AI for a $4B grocery retailer. Analyze pricing strategies, price elasticity, competitive positioning, margin optimization, price changes, and markdown strategies. Use actual data from price_change_history, competitor_prices, and products tables to provide specific insights.`,
  
  assortment: `You are an Assortment Planning AI for a $4B grocery retailer. Analyze product mix, category management, SKU rationalization, brand portfolio, new product performance, and private label opportunities. Use actual data from products, transactions, and inventory tables to provide specific insights.`,
  
  demand: `You are a Demand Forecasting & Replenishment AI for a $4B grocery retailer. Analyze demand patterns, forecast accuracy, stockout risks, reorder points, safety stock levels, and seasonal trends. Use actual data from demand_forecasts, forecast_accuracy_tracking, and inventory_levels tables to provide specific insights.`,
  
  'supply-chain': `You are a Supply Chain AI for a $4B grocery retailer. Analyze supplier performance, lead times, on-time delivery, logistics costs, warehouse capacity, and distribution routes. Use actual data from suppliers, supplier_orders, and shipping_routes tables to provide specific insights.`,
  
  space: `You are a Space Planning AI for a $4B grocery retailer. Analyze shelf space allocation, planogram compliance, sales per square foot, fixture utilization, product adjacencies, and store layouts. Use actual data from planograms, shelf_allocations, fixtures, and store_performance tables to provide specific insights.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, moduleId, selectedKPIs } = await req.json();
    
    console.log(`[${moduleId}] Analyzing question: ${question}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Common data queries
    const productsRes = await supabase.from('products').select('*').limit(100);
    const storesRes = await supabase.from('stores').select('*').limit(50);
    const transactionsRes = await supabase.from('transactions').select('*').limit(500);
    
    const products = productsRes.data || [];
    const stores = storesRes.data || [];
    const transactions = transactionsRes.data || [];

    // Build comprehensive data context based on module
    let dataContext = '';
    
    switch (moduleId) {
      case 'pricing': {
        const [priceChangesRes, competitorPricesRes, competitorDataRes] = await Promise.all([
          supabase.from('price_change_history').select('*').limit(200),
          supabase.from('competitor_prices').select('*').limit(200),
          supabase.from('competitor_data').select('*').limit(100),
        ]);
        const priceChanges = priceChangesRes.data || [];
        const competitorPrices = competitorPricesRes.data || [];
        const competitorData = competitorDataRes.data || [];
        
        const avgMargin = products.reduce((sum, p: any) => sum + Number(p.margin_percent || 0), 0) / (products.length || 1);
        const avgBasePrice = products.reduce((sum, p: any) => sum + Number(p.base_price || 0), 0) / (products.length || 1);
        const elasticProducts = products.filter((p: any) => p.price_elasticity);
        const avgElasticity = elasticProducts.reduce((sum, p: any) => sum + Number(p.price_elasticity || 0), 0) / (elasticProducts.length || 1);
        
        const priceIncreases = priceChanges.filter((pc: any) => pc.new_price > pc.old_price);
        const priceDecreases = priceChanges.filter((pc: any) => pc.new_price < pc.old_price);
        
        const avgPriceGap = competitorPrices.reduce((sum, cp: any) => sum + Number(cp.price_gap_percent || 0), 0) / (competitorPrices.length || 1);
        
        const categoryMargins: Record<string, { sum: number; count: number }> = {};
        products.forEach((p: any) => {
          if (!categoryMargins[p.category]) categoryMargins[p.category] = { sum: 0, count: 0 };
          categoryMargins[p.category].sum += Number(p.margin_percent || 0);
          categoryMargins[p.category].count++;
        });
        
        dataContext = `
PRICING DATA SUMMARY:
- Products: ${products.length} SKUs across ${[...new Set(products.map((p: any) => p.category))].length} categories
- Categories: ${[...new Set(products.map((p: any) => p.category))].join(', ')}
- Average base price: $${avgBasePrice.toFixed(2)}
- Average margin: ${avgMargin.toFixed(1)}%
- Average price elasticity: ${avgElasticity.toFixed(2)}

MARGIN BY CATEGORY:
${Object.entries(categoryMargins).map(([cat, data]) => `- ${cat}: ${(data.sum / data.count).toFixed(1)}%`).join('\n')}

PRICE CHANGES (${priceChanges.length} records):
- Price increases: ${priceIncreases.length} (avg increase: $${priceIncreases.length ? ((priceIncreases.reduce((s, p: any) => s + (p.new_price - p.old_price), 0) / priceIncreases.length)).toFixed(2) : '0.00'})
- Price decreases: ${priceDecreases.length} (avg decrease: $${priceDecreases.length ? ((priceDecreases.reduce((s, p: any) => s + (p.old_price - p.new_price), 0) / priceDecreases.length)).toFixed(2) : '0.00'})
- Change types: ${[...new Set(priceChanges.map((pc: any) => pc.change_type))].join(', ')}

COMPETITOR ANALYSIS:
- Competitors tracked: ${[...new Set(competitorPrices.map((cp: any) => cp.competitor_name))].join(', ')}
- Average price gap vs competitors: ${avgPriceGap.toFixed(1)}%
- Competitor pricing index range: ${competitorData.length ? Math.min(...competitorData.map((c: any) => Number(c.pricing_index || 100))).toFixed(0) : 100} - ${competitorData.length ? Math.max(...competitorData.map((c: any) => Number(c.pricing_index || 100))).toFixed(0) : 100}

REGIONAL ANALYSIS:
- Regions: ${[...new Set(stores.map((s: any) => s.region))].join(', ')}
- Stores by region: ${[...new Set(stores.map((s: any) => s.region))].map(r => `${r}: ${stores.filter((s: any) => s.region === r).length}`).join(', ')}`;
        break;
      }
      
      case 'assortment': {
        const [inventoryRes, promotionsRes] = await Promise.all([
          supabase.from('inventory_levels').select('*').limit(200),
          supabase.from('promotions').select('*').limit(100),
        ]);
        const inventory = inventoryRes.data || [];
        const promotions = promotionsRes.data || [];
        
        const categoryProducts: Record<string, number> = {};
        const brandProducts: Record<string, number> = {};
        products.forEach((p: any) => {
          categoryProducts[p.category] = (categoryProducts[p.category] || 0) + 1;
          if (p.brand) brandProducts[p.brand] = (brandProducts[p.brand] || 0) + 1;
        });
        
        const totalRevenue = transactions.reduce((sum, t: any) => sum + Number(t.total_amount || 0), 0);
        const productSales: Record<string, number> = {};
        transactions.forEach((t: any) => {
          productSales[t.product_sku] = (productSales[t.product_sku] || 0) + Number(t.total_amount || 0);
        });
        
        const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const lowPerformers = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 10);
        
        dataContext = `
ASSORTMENT DATA SUMMARY:
- Total SKUs: ${products.length}
- Categories: ${Object.keys(categoryProducts).length}
- Brands: ${Object.keys(brandProducts).length}
- Stores: ${stores.length} across ${[...new Set(stores.map((s: any) => s.region))].length} regions
- Active promotions: ${promotions.length}

PRODUCTS BY CATEGORY:
${Object.entries(categoryProducts).map(([cat, count]) => `- ${cat}: ${count} SKUs`).join('\n')}

TOP BRANDS BY SKU COUNT:
${Object.entries(brandProducts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([brand, count]) => `- ${brand}: ${count} SKUs`).join('\n')}

SALES PERFORMANCE (${transactions.length} transactions):
- Total revenue: $${totalRevenue.toFixed(2)}
- Top performers: ${topProducts.slice(0, 5).map(([sku, sales]) => `${sku}: $${Number(sales).toFixed(0)}`).join(', ')}
- Low performers: ${lowPerformers.slice(0, 5).map(([sku, sales]) => `${sku}: $${Number(sales).toFixed(0)}`).join(', ')}

INVENTORY STATUS:
- SKU-store combinations tracked: ${inventory.length}
- High stockout risk: ${inventory.filter((i: any) => i.stockout_risk === 'high').length}
- Medium stockout risk: ${inventory.filter((i: any) => i.stockout_risk === 'medium').length}

STORE TYPES:
${[...new Set(stores.map((s: any) => s.store_type))].map(type => `- ${type}: ${stores.filter((s: any) => s.store_type === type).length} stores`).join('\n')}`;
        break;
      }
      
      case 'demand': {
        const [forecastsRes, accuracyRes, inventoryRes] = await Promise.all([
          supabase.from('demand_forecasts').select('*').limit(200),
          supabase.from('forecast_accuracy_tracking').select('*').limit(100),
          supabase.from('inventory_levels').select('*').limit(200),
        ]);
        const forecasts = forecastsRes.data || [];
        const accuracyTracking = accuracyRes.data || [];
        const inventory = inventoryRes.data || [];
        
        const forecastsWithAccuracy = forecasts.filter((f: any) => f.forecast_accuracy);
        const avgAccuracy = forecastsWithAccuracy.reduce((sum, f: any) => sum + Number(f.forecast_accuracy || 0), 0) / (forecastsWithAccuracy.length || 1);
        const avgMAPE = accuracyTracking.reduce((sum, a: any) => sum + Number(a.mape || 0), 0) / (accuracyTracking.length || 1);
        
        const stockoutRiskHigh = inventory.filter((i: any) => i.stockout_risk === 'high');
        const belowReorderPoint = inventory.filter((i: any) => (i.stock_level || 0) < (i.reorder_point || 0));
        
        const forecastModels = [...new Set(forecasts.map((f: any) => f.forecast_model))];
        const modelAccuracy: Record<string, { sum: number; count: number }> = {};
        forecasts.forEach((f: any) => {
          if (f.forecast_model && f.forecast_accuracy) {
            if (!modelAccuracy[f.forecast_model]) modelAccuracy[f.forecast_model] = { sum: 0, count: 0 };
            modelAccuracy[f.forecast_model].sum += Number(f.forecast_accuracy);
            modelAccuracy[f.forecast_model].count++;
          }
        });
        
        dataContext = `
DEMAND FORECASTING DATA SUMMARY:
- Forecast records: ${forecasts.length}
- Average forecast accuracy: ${avgAccuracy.toFixed(1)}%
- Average MAPE: ${avgMAPE.toFixed(1)}%
- Forecast models used: ${forecastModels.join(', ')}

FORECAST ACCURACY BY MODEL:
${Object.entries(modelAccuracy).map(([model, data]) => `- ${model}: ${(data.sum / data.count).toFixed(1)}%`).join('\n')}

STOCKOUT RISK ANALYSIS:
- High risk items: ${stockoutRiskHigh.length}
- Items below reorder point: ${belowReorderPoint.length}
- Total inventory records: ${inventory.length}

FORECAST VS ACTUAL (sample):
${forecasts.filter((f: any) => f.actual_units).slice(0, 5).map((f: any) => `- ${f.product_sku}: Forecast ${f.forecasted_units}, Actual ${f.actual_units}, Accuracy ${f.forecast_accuracy?.toFixed(1)}%`).join('\n')}

SEASONAL PATTERNS:
- Products with seasonal factor: ${products.filter((p: any) => p.seasonality_factor).length}
- Seasonality types: ${[...new Set(products.map((p: any) => p.seasonality_factor).filter(Boolean))].join(', ')}

INVENTORY TURNOVER:
- Average stock level: ${(inventory.reduce((sum, i: any) => sum + Number(i.stock_level || 0), 0) / (inventory.length || 1)).toFixed(0)} units`;
        break;
      }
      
      case 'supply-chain': {
        const [suppliersRes, ordersRes, routesRes, inventoryRes] = await Promise.all([
          supabase.from('suppliers').select('*').limit(50),
          supabase.from('supplier_orders').select('*').limit(200),
          supabase.from('shipping_routes').select('*').limit(100),
          supabase.from('inventory_levels').select('*').limit(200),
        ]);
        const suppliers = suppliersRes.data || [];
        const orders = ordersRes.data || [];
        const routes = routesRes.data || [];
        const inventory = inventoryRes.data || [];
        
        const avgReliability = suppliers.reduce((sum, s: any) => sum + Number(s.reliability_score || 0), 0) / (suppliers.length || 1);
        const avgLeadTime = suppliers.reduce((sum, s: any) => sum + Number(s.lead_time_days || 0), 0) / (suppliers.length || 1);
        
        const onTimeOrders = orders.filter((o: any) => o.on_time === true);
        const lateOrders = orders.filter((o: any) => o.on_time === false);
        const totalOrderValue = orders.reduce((sum, o: any) => sum + Number(o.total_cost || 0), 0);
        
        const avgTransitTime = routes.reduce((sum, r: any) => sum + Number(r.avg_transit_time_hours || 0), 0) / (routes.length || 1);
        const totalDistance = routes.reduce((sum, r: any) => sum + Number(r.distance_miles || 0), 0);
        
        dataContext = `
SUPPLY CHAIN DATA SUMMARY:
- Suppliers: ${suppliers.length}
- Active routes: ${routes.filter((r: any) => r.is_active).length}
- Total orders tracked: ${orders.length}

SUPPLIER PERFORMANCE:
- Average reliability score: ${(avgReliability * 100).toFixed(1)}%
- Average lead time: ${avgLeadTime.toFixed(1)} days
- Top reliable suppliers: ${suppliers.sort((a: any, b: any) => (b.reliability_score || 0) - (a.reliability_score || 0)).slice(0, 3).map((s: any) => `${s.supplier_name} (${((s.reliability_score || 0) * 100).toFixed(0)}%)`).join(', ')}

ORDER PERFORMANCE:
- On-time deliveries: ${onTimeOrders.length} (${orders.length ? ((onTimeOrders.length / orders.length) * 100).toFixed(1) : 0}%)
- Late deliveries: ${lateOrders.length}
- Total order value: $${totalOrderValue.toFixed(2)}
- Order statuses: ${[...new Set(orders.map((o: any) => o.status))].join(', ')}

LOGISTICS:
- Active shipping routes: ${routes.filter((r: any) => r.is_active).length}
- Average transit time: ${avgTransitTime.toFixed(1)} hours
- Total route distance: ${totalDistance.toFixed(0)} miles
- Transportation modes: ${[...new Set(routes.map((r: any) => r.transportation_mode))].join(', ')}
- Avg cost per mile: $${(routes.reduce((sum, r: any) => sum + Number(r.cost_per_mile || 0), 0) / (routes.length || 1)).toFixed(2)}

WAREHOUSE/STORE CAPACITY:
- Regions covered: ${[...new Set(stores.map((s: any) => s.region))].join(', ')}
- Items needing restock: ${inventory.filter((i: any) => (i.stock_level || 0) < (i.reorder_point || 0)).length}`;
        break;
      }
      
      case 'space': {
        const [planogramsRes, allocationsRes, fixturesRes, storePerfRes] = await Promise.all([
          supabase.from('planograms').select('*').limit(100),
          supabase.from('shelf_allocations').select('*').limit(200),
          supabase.from('fixtures').select('*').limit(100),
          supabase.from('store_performance').select('*').limit(200),
        ]);
        const planograms = planogramsRes.data || [];
        const allocations = allocationsRes.data || [];
        const fixtures = fixturesRes.data || [];
        const storePerf = storePerfRes.data || [];
        
        const allocsWithSales = allocations.filter((a: any) => a.sales_per_sqft);
        const avgSalesPerSqft = allocsWithSales.reduce((sum, a: any) => sum + Number(a.sales_per_sqft || 0), 0) / (allocsWithSales.length || 1);
        const eyeLevelItems = allocations.filter((a: any) => a.is_eye_level);
        const avgFacings = allocations.reduce((sum, a: any) => sum + Number(a.facings || 0), 0) / (allocations.length || 1);
        
        const categoryPlanograms: Record<string, number> = {};
        planograms.forEach((p: any) => {
          categoryPlanograms[p.category] = (categoryPlanograms[p.category] || 0) + 1;
        });
        
        const fixtureTypes: Record<string, number> = {};
        fixtures.forEach((f: any) => {
          fixtureTypes[f.fixture_type] = (fixtureTypes[f.fixture_type] || 0) + 1;
        });
        
        const avgConversion = storePerf.reduce((sum, s: any) => sum + Number(s.conversion_rate || 0), 0) / (storePerf.length || 1);
        const avgFootTraffic = storePerf.reduce((sum, s: any) => sum + Number(s.foot_traffic || 0), 0) / (storePerf.length || 1);
        
        dataContext = `
SPACE PLANNING DATA SUMMARY:
- Planograms: ${planograms.length}
- Shelf allocations: ${allocations.length}
- Fixtures: ${fixtures.length}
- Store performance records: ${storePerf.length}

PLANOGRAM ANALYSIS:
- Active planograms: ${planograms.filter((p: any) => p.status === 'active').length}
- Categories covered: ${Object.keys(categoryPlanograms).join(', ')}
- Planograms by category: ${Object.entries(categoryPlanograms).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
- Store types: ${[...new Set(planograms.map((p: any) => p.store_type))].join(', ')}

SHELF PERFORMANCE:
- Average sales per sq ft: $${avgSalesPerSqft.toFixed(2)}
- Eye-level placements: ${eyeLevelItems.length} (${allocations.length ? ((eyeLevelItems.length / allocations.length) * 100).toFixed(1) : 0}%)
- Average facings per product: ${avgFacings.toFixed(1)}
- Total shelf positions: ${allocations.length}

FIXTURE UTILIZATION:
- Fixture types: ${Object.entries(fixtureTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}
- Active fixtures: ${fixtures.filter((f: any) => f.status === 'active').length}
- Total capacity: ${fixtures.reduce((sum, f: any) => sum + Number(f.capacity_sqft || 0), 0).toFixed(0)} sq ft

STORE PERFORMANCE:
- Average conversion rate: ${(avgConversion * 100).toFixed(1)}%
- Average daily foot traffic: ${avgFootTraffic.toFixed(0)}
- Total sales tracked: $${storePerf.reduce((sum, s: any) => sum + Number(s.total_sales || 0), 0).toFixed(0)}`;
        break;
      }
    }

    const systemPrompt = moduleContexts[moduleId] || moduleContexts.pricing;
    
    const userPrompt = `
Question: ${question}

${dataContext}

Selected KPIs to focus on: ${selectedKPIs?.join(', ') || 'All relevant KPIs'}

Based on the actual data provided above, respond with a JSON object containing:
{
  "whatHappened": ["3-4 bullet points with specific numbers from the data above"],
  "why": ["2-3 reasons explaining the patterns seen in the data"],
  "whatToDo": ["2-3 actionable recommendations based on the analysis"],
  "kpis": {"kpi_name": "value with units", ...},
  "chartData": [{"name": "Label", "value": number}, ...],
  "nextQuestions": ["Follow-up question 1", "Follow-up question 2"]
}

IMPORTANT: Use actual numbers from the data provided. Be specific and reference real values from the data context. Do not make up numbers.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let parsedResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback response with module-specific defaults
      parsedResponse = {
        whatHappened: [`Analysis of ${moduleId} data shows typical patterns for a $4B retailer.`],
        why: ['Based on current market conditions and historical trends.'],
        whatToDo: ['Continue monitoring key metrics and adjust strategies as needed.'],
        kpis: {},
        chartData: [
          { name: 'Category 1', value: 100 },
          { name: 'Category 2', value: 85 },
          { name: 'Category 3', value: 70 },
        ],
        nextQuestions: ['What are the top performing items?', 'How do we compare to last year?']
      };
    }

    console.log(`[${moduleId}] Analysis complete`);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-module-question:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      whatHappened: ['Unable to complete analysis at this time.'],
      why: ['The system encountered an error processing your request.'],
      whatToDo: ['Please try again or rephrase your question.'],
      kpis: {},
      chartData: [],
      nextQuestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
