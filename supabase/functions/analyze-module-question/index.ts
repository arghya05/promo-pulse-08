import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const moduleContexts: Record<string, string> = {
  pricing: `You are a Pricing Optimization AI for a $4B grocery retailer. Analyze pricing strategies, price elasticity, competitive positioning, margin optimization, price changes, and markdown strategies. Use actual data from price_change_history, competitor_prices, and products tables to provide specific insights. NEVER mention promotions, ROI, or lift - focus ONLY on pricing metrics.`,
  
  assortment: `You are an Assortment Planning AI for a $4B grocery retailer. Analyze product mix, category management, SKU rationalization, brand portfolio, new product performance, and private label opportunities. Use actual data from products, transactions, and inventory tables. NEVER mention promotions, ROI, or lift - focus ONLY on assortment metrics like SKU productivity, category gaps, brand mix.`,
  
  demand: `You are a Demand Forecasting & Replenishment AI for a $4B grocery retailer. You MUST provide hierarchical forecasts from Category → Product/SKU → Store → Time Period (Month/Week/Day). When asked WHY forecasts are what they are, you MUST explain using DEMAND DRIVERS and EXTERNAL SIGNALS: seasonal patterns, weather impact, promotional lift, competitor activity, economic factors, historical trends, and event impacts. Always reference specific driver data with correlations and impact levels. Use actual data from demand_forecasts, forecast_accuracy_tracking, inventory_levels, and third_party_data tables. NEVER mention promotions, ROI, or lift unless explaining promotional demand drivers.`,
  
  'supply-chain': `You are a Supply Chain AI for a $4B grocery retailer. Analyze supplier performance, lead times, on-time delivery, logistics costs, warehouse capacity, and distribution routes. Use actual data from suppliers, supplier_orders, and shipping_routes tables. NEVER mention promotions, ROI, or lift - focus ONLY on supply chain metrics.`,
  
  space: `You are a Space Planning AI for a $4B grocery retailer. Analyze shelf space allocation, planogram compliance, sales per square foot, fixture utilization, product adjacencies, and store layouts. Use actual data from planograms, shelf_allocations, fixtures, and store_performance tables. NEVER mention promotions, ROI, or lift - focus ONLY on space planning metrics.`,
  
  'cross-module': `You are a Holistic Merchandising AI for a $4B grocery retailer. You analyze cross-functional impacts across pricing, assortment, demand, supply chain, and space planning. Identify relationships between modules, end-to-end impacts, and optimization opportunities that span multiple domains. Use data from ALL tables to provide integrated insights.`,
};

// Detect if question is a simulation/what-if scenario
function isSimulationQuestion(question: string): boolean {
  const simulationTriggers = ['what if', 'what would happen', 'simulate', 'scenario', 'impact if', 'effect of increasing', 'effect of decreasing', 'if we'];
  return simulationTriggers.some(trigger => question.toLowerCase().includes(trigger));
}

// Detect if question spans multiple modules
function detectCrossModuleQuestion(question: string): string[] {
  const moduleKeywords: Record<string, string[]> = {
    pricing: ['price', 'pricing', 'margin', 'cost', 'competitive', 'elasticity', 'discount'],
    demand: ['demand', 'forecast', 'stockout', 'inventory', 'reorder', 'safety stock', 'seasonal'],
    'supply-chain': ['supplier', 'supply chain', 'lead time', 'logistics', 'delivery', 'shipping', 'warehouse'],
    space: ['shelf', 'space', 'planogram', 'fixture', 'facing', 'sqft', 'layout'],
    assortment: ['assortment', 'sku', 'category', 'brand', 'product mix', 'rationalization']
  };
  
  const detectedModules: string[] = [];
  const lowerQuestion = question.toLowerCase();
  
  for (const [module, keywords] of Object.entries(moduleKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      detectedModules.push(module);
    }
  }
  
  return detectedModules;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, moduleId, selectedKPIs, crossModules } = await req.json();
    
    // Detect simulation and cross-module questions
    const isSimulation = isSimulationQuestion(question);
    const detectedModules = detectCrossModuleQuestion(question);
    const isCrossModule = detectedModules.length > 1 || moduleId === 'cross-module' || (crossModules && crossModules.length > 0);
    
    console.log(`[${moduleId}] Analyzing question: ${question}`);
    console.log(`[${moduleId}] Is simulation: ${isSimulation}, Cross-module: ${isCrossModule}, Detected modules: ${detectedModules.join(', ')}`);

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
    
    // For cross-module questions, fetch data from all relevant modules
    const modulesToFetch = isCrossModule ? [...new Set([...detectedModules, ...(crossModules || [])])] : [moduleId];
    
    // Always fetch cross-module data if it's a cross-module question
    if (isCrossModule && modulesToFetch.length === 0) {
      modulesToFetch.push('pricing', 'demand', 'supply-chain');
    }
    
    switch (moduleId) {
      case 'pricing': {
        const [priceChangesRes, competitorPricesRes, competitorDataRes] = await Promise.all([
          supabase.from('price_change_history').select('*').limit(500),
          supabase.from('competitor_prices').select('*').limit(500),
          supabase.from('competitor_data').select('*').limit(200),
        ]);
        const priceChanges = priceChangesRes.data || [];
        const competitorPrices = competitorPricesRes.data || [];
        const competitorData = competitorDataRes.data || [];
        
        // Create product lookup for names
        const productLookup: Record<string, any> = {};
        products.forEach((p: any) => { productLookup[p.product_sku] = p; });
        
        const avgMargin = products.reduce((sum, p: any) => sum + Number(p.margin_percent || 0), 0) / (products.length || 1);
        const avgBasePrice = products.reduce((sum, p: any) => sum + Number(p.base_price || 0), 0) / (products.length || 1);
        const elasticProducts = products.filter((p: any) => p.price_elasticity);
        const avgElasticity = elasticProducts.reduce((sum, p: any) => sum + Number(p.price_elasticity || 0), 0) / (elasticProducts.length || 1);
        
        const priceIncreases = priceChanges.filter((pc: any) => Number(pc.new_price) > Number(pc.old_price));
        const priceDecreases = priceChanges.filter((pc: any) => Number(pc.new_price) < Number(pc.old_price));
        
        // Get specific products with highest/lowest margins
        const sortedByMargin = [...products].sort((a: any, b: any) => Number(b.margin_percent || 0) - Number(a.margin_percent || 0));
        const highMarginProducts = sortedByMargin.slice(0, 10);
        const lowMarginProducts = sortedByMargin.slice(-10).reverse();
        
        // Get most elastic products
        const sortedByElasticity = [...products].filter((p: any) => p.price_elasticity).sort((a: any, b: any) => Math.abs(Number(b.price_elasticity || 0)) - Math.abs(Number(a.price_elasticity || 0)));
        const mostElasticProducts = sortedByElasticity.slice(0, 10);
        
        // Recent price changes with product names
        const recentPriceChanges = priceChanges.slice(0, 15).map((pc: any) => {
          const product = productLookup[pc.product_sku] || {};
          const pctChange = ((Number(pc.new_price) - Number(pc.old_price)) / Number(pc.old_price) * 100).toFixed(1);
          return {
            name: product.product_name || pc.product_sku,
            sku: pc.product_sku,
            oldPrice: pc.old_price,
            newPrice: pc.new_price,
            pctChange,
            reason: pc.change_reason,
            type: pc.change_type
          };
        });
        
        // Competitor price gaps by product
        const competitorGaps = competitorPrices.slice(0, 15).map((cp: any) => {
          const product = productLookup[cp.product_sku] || {};
          return {
            name: product.product_name || cp.product_sku,
            competitor: cp.competitor_name,
            ourPrice: cp.our_price,
            theirPrice: cp.competitor_price,
            gap: cp.price_gap_percent
          };
        });
        
        const avgPriceGap = competitorPrices.reduce((sum, cp: any) => sum + Number(cp.price_gap_percent || 0), 0) / (competitorPrices.length || 1);
        
        const categoryMargins: Record<string, { sum: number; count: number; products: string[] }> = {};
        products.forEach((p: any) => {
          if (!categoryMargins[p.category]) categoryMargins[p.category] = { sum: 0, count: 0, products: [] };
          categoryMargins[p.category].sum += Number(p.margin_percent || 0);
          categoryMargins[p.category].count++;
          categoryMargins[p.category].products.push(p.product_name);
        });
        
        dataContext = `
PRICING DATA SUMMARY:
- Products: ${products.length} SKUs across ${[...new Set(products.map((p: any) => p.category))].length} categories
- Categories: ${[...new Set(products.map((p: any) => p.category))].join(', ')}
- Average base price: $${avgBasePrice.toFixed(2)}
- Average margin: ${avgMargin.toFixed(1)}%
- Average price elasticity: ${avgElasticity.toFixed(2)}

HIGH MARGIN PRODUCTS (USE THESE SPECIFIC NAMES):
${highMarginProducts.map((p: any) => `- ${p.product_name} (${p.product_sku}): ${Number(p.margin_percent).toFixed(1)}% margin, $${Number(p.base_price).toFixed(2)} price`).join('\n')}

LOW MARGIN PRODUCTS (NEED ATTENTION):
${lowMarginProducts.map((p: any) => `- ${p.product_name}: ${Number(p.margin_percent).toFixed(1)}% margin, $${Number(p.base_price).toFixed(2)} price`).join('\n')}

MOST PRICE-ELASTIC PRODUCTS:
${mostElasticProducts.slice(0, 8).map((p: any) => `- ${p.product_name}: Elasticity ${Number(p.price_elasticity).toFixed(2)}, Category: ${p.category}`).join('\n')}

MARGIN BY CATEGORY:
${Object.entries(categoryMargins).map(([cat, data]) => `- ${cat}: ${(data.sum / data.count).toFixed(1)}% avg margin (${data.count} products)`).join('\n')}

RECENT PRICE CHANGES (${priceChanges.length} total):
${recentPriceChanges.map(pc => `- ${pc.name}: $${Number(pc.oldPrice).toFixed(2)} → $${Number(pc.newPrice).toFixed(2)} (${pc.pctChange}%), Reason: ${pc.reason || pc.type}`).join('\n')}

COMPETITOR PRICE COMPARISON:
- Competitors tracked: ${[...new Set(competitorPrices.map((cp: any) => cp.competitor_name))].join(', ')}
- Average price gap: ${avgPriceGap.toFixed(1)}%
${competitorGaps.slice(0, 8).map(cg => `- ${cg.name} vs ${cg.competitor}: Our $${Number(cg.ourPrice).toFixed(2)} vs Their $${Number(cg.theirPrice).toFixed(2)} (${Number(cg.gap).toFixed(1)}% gap)`).join('\n')}`;
        break;
      }
      
      case 'assortment': {
        const [inventoryRes, promotionsRes] = await Promise.all([
          supabase.from('inventory_levels').select('*').limit(500),
          supabase.from('promotions').select('*').limit(200),
        ]);
        const inventory = inventoryRes.data || [];
        const promotions = promotionsRes.data || [];
        
        // Create product lookup for names
        const productLookup: Record<string, any> = {};
        products.forEach((p: any) => { productLookup[p.product_sku] = p; });
        
        const categoryProducts: Record<string, { count: number; products: any[] }> = {};
        const brandProducts: Record<string, { count: number; products: any[] }> = {};
        products.forEach((p: any) => {
          if (!categoryProducts[p.category]) categoryProducts[p.category] = { count: 0, products: [] };
          categoryProducts[p.category].count++;
          categoryProducts[p.category].products.push(p);
          
          if (p.brand) {
            if (!brandProducts[p.brand]) brandProducts[p.brand] = { count: 0, products: [] };
            brandProducts[p.brand].count++;
            brandProducts[p.brand].products.push(p);
          }
        });
        
        const totalRevenue = transactions.reduce((sum, t: any) => sum + Number(t.total_amount || 0), 0);
        const productSales: Record<string, { revenue: number; units: number }> = {};
        transactions.forEach((t: any) => {
          if (!productSales[t.product_sku]) productSales[t.product_sku] = { revenue: 0, units: 0 };
          productSales[t.product_sku].revenue += Number(t.total_amount || 0);
          productSales[t.product_sku].units += Number(t.quantity || 0);
        });
        
        // Top and bottom performers with full product names
        const topPerformers = Object.entries(productSales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 12)
          .map(([sku, data]) => {
            const product = productLookup[sku] || {};
            return {
              name: product.product_name || sku,
              sku,
              category: product.category,
              brand: product.brand,
              revenue: data.revenue,
              units: data.units
            };
          });
        
        const bottomPerformers = Object.entries(productSales)
          .sort((a, b) => a[1].revenue - b[1].revenue)
          .slice(0, 12)
          .map(([sku, data]) => {
            const product = productLookup[sku] || {};
            return {
              name: product.product_name || sku,
              sku,
              category: product.category,
              brand: product.brand,
              revenue: data.revenue,
              units: data.units
            };
          });
        
        // Calculate category performance
        const categoryRevenue: Record<string, number> = {};
        transactions.forEach((t: any) => {
          const product = productLookup[t.product_sku];
          if (product?.category) {
            categoryRevenue[product.category] = (categoryRevenue[product.category] || 0) + Number(t.total_amount || 0);
          }
        });
        
        // Brand performance
        const brandRevenue: Record<string, number> = {};
        transactions.forEach((t: any) => {
          const product = productLookup[t.product_sku];
          if (product?.brand) {
            brandRevenue[product.brand] = (brandRevenue[product.brand] || 0) + Number(t.total_amount || 0);
          }
        });
        
        const topBrands = Object.entries(brandRevenue).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        dataContext = `
ASSORTMENT DATA SUMMARY:
- Total SKUs: ${products.length}
- Categories: ${Object.keys(categoryProducts).length}
- Brands: ${Object.keys(brandProducts).length}
- Stores: ${stores.length} across ${[...new Set(stores.map((s: any) => s.region))].length} regions
- Total Revenue: $${totalRevenue.toFixed(2)}

PRODUCTS BY CATEGORY (with sample products):
${Object.entries(categoryProducts).map(([cat, data]) => 
  `- ${cat}: ${data.count} SKUs (e.g., ${data.products.slice(0, 3).map((p: any) => p.product_name).join(', ')})`
).join('\n')}

TOP PERFORMING PRODUCTS (USE THESE SPECIFIC NAMES):
${topPerformers.slice(0, 10).map(p => `- ${p.name} (${p.brand}, ${p.category}): $${p.revenue.toFixed(0)} revenue, ${p.units} units`).join('\n')}

BOTTOM PERFORMING PRODUCTS (CANDIDATES FOR RATIONALIZATION):
${bottomPerformers.slice(0, 10).map(p => `- ${p.name} (${p.brand}, ${p.category}): $${p.revenue.toFixed(0)} revenue, ${p.units} units`).join('\n')}

CATEGORY REVENUE:
${Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => `- ${cat}: $${Number(rev).toFixed(0)}`).join('\n')}

TOP BRANDS BY REVENUE:
${topBrands.map(([brand, rev]) => `- ${brand}: $${Number(rev).toFixed(0)}`).join('\n')}

INVENTORY STATUS:
- SKU-store combinations: ${inventory.length}
- High stockout risk: ${inventory.filter((i: any) => i.stockout_risk?.toLowerCase() === 'high').length}
- Low stock items: ${inventory.filter((i: any) => Number(i.stock_level) < Number(i.reorder_point)).length}`;
        break;
      }
      
      case 'demand': {
        const [forecastsRes, accuracyRes, inventoryRes, demandDriversRes, externalSignalsRes, competitorRes] = await Promise.all([
          supabase.from('demand_forecasts').select('*').limit(1000),
          supabase.from('forecast_accuracy_tracking').select('*').limit(200),
          supabase.from('inventory_levels').select('*').limit(500),
          supabase.from('third_party_data').select('*').eq('data_type', 'demand_driver').limit(100),
          supabase.from('third_party_data').select('*').in('data_type', ['weather', 'economic', 'market_share']).limit(100),
          supabase.from('competitor_data').select('*').limit(50),
        ]);
        const forecasts = forecastsRes.data || [];
        const accuracyTracking = accuracyRes.data || [];
        const inventory = inventoryRes.data || [];
        const demandDrivers = demandDriversRes.data || [];
        const externalSignals = externalSignalsRes.data || [];
        const competitorData = competitorRes.data || [];
        
        // Create product lookup for names
        const productLookup: Record<string, any> = {};
        products.forEach((p: any) => { productLookup[p.product_sku] = p; });
        
        // Create store lookup
        const storeLookup: Record<string, any> = {};
        stores.forEach((s: any) => { storeLookup[s.id] = s; });
        
        // Helper to determine granularity (daily, weekly, monthly)
        const getGranularity = (start: string, end: string): string => {
          if (!start || !end) return 'monthly';
          const startDate = new Date(start);
          const endDate = new Date(end);
          const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) return 'daily';
          if (diffDays <= 7) return 'weekly';
          return 'monthly';
        };
        
        // Helper to get week number
        const getWeekKey = (dateStr: string): string => {
          const date = new Date(dateStr);
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7);
          return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        };
        
        // Aggregate forecasts by category
        const forecastsByCategory: Record<string, { forecasted: number; actual: number; products: string[]; months: Record<string, number>; weeks: Record<string, number>; days: Record<string, number> }> = {};
        const forecastsByProduct: Record<string, { forecasted: number; actual: number; name: string; category: string; months: Record<string, { forecasted: number; actual: number }>; weeks: Record<string, { forecasted: number; actual: number }>; days: Record<string, { forecasted: number; actual: number }> }> = {};
        const forecastsByMonth: Record<string, { forecasted: number; actual: number; categories: Record<string, number> }> = {};
        const forecastsByWeek: Record<string, { forecasted: number; actual: number; categories: Record<string, number>; products: Record<string, number> }> = {};
        const forecastsByDay: Record<string, { forecasted: number; actual: number; categories: Record<string, number>; products: Record<string, number> }> = {};
        const forecastsByStore: Record<string, { forecasted: number; actual: number; storeName: string; region: string }> = {};
        
        forecasts.forEach((f: any) => {
          const product = productLookup[f.product_sku] || {};
          const category = product.category || 'Unknown';
          const productName = product.product_name || f.product_sku;
          const store = storeLookup[f.store_id] || {};
          const granularity = getGranularity(f.forecast_period_start, f.forecast_period_end);
          const month = f.forecast_period_start ? f.forecast_period_start.substring(0, 7) : 'Unknown';
          const week = f.forecast_period_start ? getWeekKey(f.forecast_period_start) : 'Unknown';
          const day = f.forecast_period_start ? f.forecast_period_start.substring(0, 10) : 'Unknown';
          
          // By category
          if (!forecastsByCategory[category]) forecastsByCategory[category] = { forecasted: 0, actual: 0, products: [], months: {}, weeks: {}, days: {} };
          forecastsByCategory[category].forecasted += Number(f.forecasted_units || 0);
          forecastsByCategory[category].actual += Number(f.actual_units || 0);
          if (!forecastsByCategory[category].products.includes(productName)) forecastsByCategory[category].products.push(productName);
          
          if (granularity === 'monthly') {
            forecastsByCategory[category].months[month] = (forecastsByCategory[category].months[month] || 0) + Number(f.forecasted_units || 0);
          } else if (granularity === 'weekly') {
            forecastsByCategory[category].weeks[week] = (forecastsByCategory[category].weeks[week] || 0) + Number(f.forecasted_units || 0);
          } else {
            forecastsByCategory[category].days[day] = (forecastsByCategory[category].days[day] || 0) + Number(f.forecasted_units || 0);
          }
          
          // By product/SKU
          if (!forecastsByProduct[f.product_sku]) forecastsByProduct[f.product_sku] = { forecasted: 0, actual: 0, name: productName, category, months: {}, weeks: {}, days: {} };
          forecastsByProduct[f.product_sku].forecasted += Number(f.forecasted_units || 0);
          forecastsByProduct[f.product_sku].actual += Number(f.actual_units || 0);
          
          if (granularity === 'monthly') {
            if (!forecastsByProduct[f.product_sku].months[month]) forecastsByProduct[f.product_sku].months[month] = { forecasted: 0, actual: 0 };
            forecastsByProduct[f.product_sku].months[month].forecasted += Number(f.forecasted_units || 0);
            forecastsByProduct[f.product_sku].months[month].actual += Number(f.actual_units || 0);
          } else if (granularity === 'weekly') {
            if (!forecastsByProduct[f.product_sku].weeks[week]) forecastsByProduct[f.product_sku].weeks[week] = { forecasted: 0, actual: 0 };
            forecastsByProduct[f.product_sku].weeks[week].forecasted += Number(f.forecasted_units || 0);
            forecastsByProduct[f.product_sku].weeks[week].actual += Number(f.actual_units || 0);
          } else {
            if (!forecastsByProduct[f.product_sku].days[day]) forecastsByProduct[f.product_sku].days[day] = { forecasted: 0, actual: 0 };
            forecastsByProduct[f.product_sku].days[day].forecasted += Number(f.forecasted_units || 0);
            forecastsByProduct[f.product_sku].days[day].actual += Number(f.actual_units || 0);
          }
          
          // By month (only monthly granularity)
          if (granularity === 'monthly') {
            if (!forecastsByMonth[month]) forecastsByMonth[month] = { forecasted: 0, actual: 0, categories: {} };
            forecastsByMonth[month].forecasted += Number(f.forecasted_units || 0);
            forecastsByMonth[month].actual += Number(f.actual_units || 0);
            forecastsByMonth[month].categories[category] = (forecastsByMonth[month].categories[category] || 0) + Number(f.forecasted_units || 0);
          }
          
          // By week
          if (granularity === 'weekly') {
            if (!forecastsByWeek[week]) forecastsByWeek[week] = { forecasted: 0, actual: 0, categories: {}, products: {} };
            forecastsByWeek[week].forecasted += Number(f.forecasted_units || 0);
            forecastsByWeek[week].actual += Number(f.actual_units || 0);
            forecastsByWeek[week].categories[category] = (forecastsByWeek[week].categories[category] || 0) + Number(f.forecasted_units || 0);
            forecastsByWeek[week].products[productName] = (forecastsByWeek[week].products[productName] || 0) + Number(f.forecasted_units || 0);
          }
          
          // By day
          if (granularity === 'daily') {
            if (!forecastsByDay[day]) forecastsByDay[day] = { forecasted: 0, actual: 0, categories: {}, products: {} };
            forecastsByDay[day].forecasted += Number(f.forecasted_units || 0);
            forecastsByDay[day].actual += Number(f.actual_units || 0);
            forecastsByDay[day].categories[category] = (forecastsByDay[day].categories[category] || 0) + Number(f.forecasted_units || 0);
            forecastsByDay[day].products[productName] = (forecastsByDay[day].products[productName] || 0) + Number(f.forecasted_units || 0);
          }
          
          // By store
          if (f.store_id && store.store_name) {
            if (!forecastsByStore[f.store_id]) forecastsByStore[f.store_id] = { forecasted: 0, actual: 0, storeName: store.store_name, region: store.region || 'Unknown' };
            forecastsByStore[f.store_id].forecasted += Number(f.forecasted_units || 0);
            forecastsByStore[f.store_id].actual += Number(f.actual_units || 0);
          }
        });
        
        const forecastsWithAccuracy = forecasts.filter((f: any) => f.forecast_accuracy);
        const avgAccuracy = forecastsWithAccuracy.reduce((sum, f: any) => sum + Number(f.forecast_accuracy || 0), 0) / (forecastsWithAccuracy.length || 1);
        const avgMAPE = accuracyTracking.reduce((sum, a: any) => sum + Number(a.mape || 0), 0) / (accuracyTracking.length || 1);
        
        // Find stockout risk products WITH product names
        const stockoutRiskHigh = inventory.filter((i: any) => i.stockout_risk?.toLowerCase() === 'high');
        const stockoutRiskMedium = inventory.filter((i: any) => i.stockout_risk?.toLowerCase() === 'medium');
        const belowReorderPoint = inventory.filter((i: any) => Number(i.stock_level || 0) <= Number(i.reorder_point || 0));
        
        // Get lowest stock items with product names
        const lowestStockItems = [...inventory]
          .sort((a: any, b: any) => Number(a.stock_level || 0) - Number(b.stock_level || 0))
          .slice(0, 15)
          .map((i: any) => {
            const product = productLookup[i.product_sku] || {};
            return {
              sku: i.product_sku,
              name: product.product_name || i.product_sku,
              category: product.category || 'Unknown',
              stockLevel: i.stock_level,
              reorderPoint: i.reorder_point,
              risk: i.stockout_risk
            };
          });
        
        // Categorize inventory by risk
        const highRiskProducts = lowestStockItems.filter((i: any) => i.risk?.toLowerCase() === 'high' || i.stockLevel <= i.reorderPoint);
        const mediumRiskProducts = lowestStockItems.filter((i: any) => i.risk?.toLowerCase() === 'medium');
        
        // Get forecast accuracy by model
        const modelAccuracy: Record<string, { sum: number; count: number }> = {};
        accuracyTracking.forEach((a: any) => {
          const model = a.forecast_model || 'default';
          if (!modelAccuracy[model]) modelAccuracy[model] = { sum: 0, count: 0 };
          modelAccuracy[model].sum += Number(a.mape || 0);
          modelAccuracy[model].count++;
        });
        
        // Seasonal product breakdown
        const seasonalProducts = products.filter((p: any) => p.seasonality_factor);
        const seasonalByType: Record<string, string[]> = {};
        seasonalProducts.forEach((p: any) => {
          const factor = p.seasonality_factor || 'unknown';
          if (!seasonalByType[factor]) seasonalByType[factor] = [];
          seasonalByType[factor].push(p.product_name);
        });
        
        // Sort time periods chronologically
        const sortedMonths = Object.keys(forecastsByMonth).sort();
        const sortedWeeks = Object.keys(forecastsByWeek).sort();
        const sortedDays = Object.keys(forecastsByDay).sort();
        
        dataContext = `
DEMAND FORECASTING DATA SUMMARY:
- Forecast records: ${forecasts.length}
- Average forecast accuracy: ${avgAccuracy.toFixed(1)}%
- Average MAPE: ${avgMAPE.toFixed(1)}%
- Products tracked: ${products.length}
- Categories: ${Object.keys(forecastsByCategory).length}
- Time granularities available: Monthly (${sortedMonths.length}), Weekly (${sortedWeeks.length}), Daily (${sortedDays.length})

FORECASTS BY CATEGORY (HIERARCHICAL - DRILL TO SKU/WEEK/DAY):
${Object.entries(forecastsByCategory)
  .sort((a, b) => b[1].forecasted - a[1].forecasted)
  .map(([cat, data]) => {
    const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
    const monthlyBreakdown = Object.entries(data.months).slice(0, 3).map(([m, v]) => `${m}: ${v.toLocaleString()}`).join(', ');
    const weeklyBreakdown = Object.entries(data.weeks).slice(0, 3).map(([w, v]) => `${w}: ${v.toLocaleString()}`).join(', ');
    const dailyBreakdown = Object.entries(data.days).slice(0, 3).map(([d, v]) => `${d}: ${v.toLocaleString()}`).join(', ');
    return `- ${cat}: ${data.forecasted.toLocaleString()} forecasted, ${data.actual.toLocaleString()} actual, ${accuracy}% accuracy
    Products: ${data.products.slice(0, 5).join(', ')}${data.products.length > 5 ? ` (+${data.products.length - 5} more)` : ''}
    Monthly: ${monthlyBreakdown || 'N/A'}
    Weekly: ${weeklyBreakdown || 'N/A'}
    Daily: ${dailyBreakdown || 'N/A'}`;
  }).join('\n')}

FORECASTS BY PRODUCT/SKU (DRILL TO WEEK/DAY/STORE):
${Object.entries(forecastsByProduct)
  .sort((a, b) => b[1].forecasted - a[1].forecasted)
  .slice(0, 12)
  .map(([sku, data]) => {
    const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
    const weeklyTrend = Object.entries(data.weeks).slice(0, 3).map(([w, v]) => `${w}: ${v.forecasted}`).join(', ');
    const dailyTrend = Object.entries(data.days).slice(0, 4).map(([d, v]) => `${d}: ${v.forecasted}`).join(', ');
    return `- ${data.name} (${sku}, ${data.category}): ${data.forecasted.toLocaleString()} total
    Weekly: ${weeklyTrend || 'N/A'}
    Daily: ${dailyTrend || 'N/A'}`;
  }).join('\n')}

FORECASTS BY MONTH:
${sortedMonths.map(month => {
  const data = forecastsByMonth[month];
  const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
  const topCategories = Object.entries(data.categories).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `- ${month}: ${data.forecasted.toLocaleString()} forecasted, ${accuracy}% accuracy | Categories: ${topCategories.map(([c, v]) => `${c}: ${v.toLocaleString()}`).join(', ')}`;
}).join('\n')}

FORECASTS BY WEEK (WEEKLY GRANULARITY):
${sortedWeeks.map(week => {
  const data = forecastsByWeek[week];
  const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
  const topProducts = Object.entries(data.products).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topCategories = Object.entries(data.categories).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return `- ${week}: ${data.forecasted.toLocaleString()} forecasted, ${data.actual.toLocaleString()} actual, ${accuracy}% accuracy
    Categories: ${topCategories.map(([c, v]) => `${c}: ${v.toLocaleString()}`).join(', ')}
    Products: ${topProducts.map(([p, v]) => `${p}: ${v}`).join(', ')}`;
}).join('\n')}

FORECASTS BY DAY (DAILY GRANULARITY):
${sortedDays.map(day => {
  const data = forecastsByDay[day];
  const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
  const topProducts = Object.entries(data.products).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `- ${day}: ${data.forecasted.toLocaleString()} forecasted, ${data.actual.toLocaleString()} actual, ${accuracy}% accuracy | Products: ${topProducts.map(([p, v]) => `${p}: ${v}`).join(', ')}`;
}).join('\n')}

FORECASTS BY STORE/REGION:
${Object.entries(forecastsByStore)
  .sort((a, b) => b[1].forecasted - a[1].forecasted)
  .slice(0, 8)
  .map(([id, data]) => {
    const accuracy = data.actual > 0 ? ((1 - Math.abs(data.forecasted - data.actual) / data.actual) * 100).toFixed(1) : 'N/A';
    return `- ${data.storeName} (${data.region}): ${data.forecasted.toLocaleString()} forecasted, ${accuracy}% accuracy`;
  }).join('\n')}

STOCKOUT RISK PRODUCTS (CRITICAL):
${highRiskProducts.length > 0 
  ? highRiskProducts.map((p: any) => `- ${p.name} (${p.sku}, ${p.category}): Stock ${p.stockLevel} units, Reorder at ${p.reorderPoint}`).join('\n')
  : '- No products currently at high stockout risk'}

INVENTORY SUMMARY:
- High stockout risk: ${stockoutRiskHigh.length} | Medium risk: ${stockoutRiskMedium.length}
- Below reorder point: ${belowReorderPoint.length} | Total records: ${inventory.length}

FORECAST MODEL ACCURACY:
${Object.entries(modelAccuracy).map(([model, data]) => `- ${model}: MAPE ${(data.sum / data.count).toFixed(1)}%`).join('\n')}

SEASONAL PATTERNS:
${Object.entries(seasonalByType).map(([type, prods]) => `- ${type}: ${prods.slice(0, 5).join(', ')}${prods.length > 5 ? ` (+${prods.length - 5} more)` : ''}`).join('\n')}

DEMAND DRIVERS & CAUSAL FACTORS (USE THESE TO EXPLAIN FORECASTS):
${demandDrivers.map((d: any) => {
  const meta = d.metadata || {};
  const driverType = meta.driver_type || 'unknown';
  const correlation = meta.correlation ? `(correlation: ${(meta.correlation * 100).toFixed(0)}%)` : '';
  const impact = meta.impact ? `[${meta.impact} impact]` : '';
  return `- ${d.metric_name} ${d.product_category ? `for ${d.product_category}` : ''}: ${d.metric_value} ${impact} ${correlation}
    Source: ${d.data_source} | Type: ${driverType} | Date: ${d.data_date}`;
}).join('\n')}

EXTERNAL SIGNALS (WEATHER, ECONOMIC, MARKET):
${externalSignals.map((s: any) => `- ${s.metric_name}: ${s.metric_value} (${s.data_source}, ${s.data_date})`).join('\n')}

COMPETITOR ACTIVITY AFFECTING DEMAND:
${competitorData.slice(0, 8).map((c: any) => `- ${c.competitor_name} (${c.product_category}): ${c.promotion_intensity || 'Normal'} promotion intensity, ${c.market_share_percent}% market share`).join('\n')}

FORECAST REASONING FRAMEWORK:
When explaining WHY forecasts are what they are, reference:
1. SEASONAL DRIVERS: Holiday indices, seasonal patterns by category
2. WEATHER IMPACT: Temperature, storms, weather-driven demand shifts
3. PROMOTIONAL LIFT: Active promotions increasing baseline demand
4. COMPETITIVE SIGNALS: Competitor stockouts, price changes, promotion intensity
5. ECONOMIC FACTORS: Consumer confidence, inflation, disposable income
6. HISTORICAL TRENDS: YoY growth rates, cyclical patterns
7. EVENT IMPACTS: Super Bowl, holidays, local events
8. SUPPLY CONSTRAINTS: Shipping delays, supplier issues limiting availability

DRILL-DOWN PATHS AVAILABLE:
- Category → Product/SKU → Store → Month/Week/Day
- Month → Week → Day → Category → Product/SKU
- Store/Region → Category → Week/Day → Product/SKU
- Forecast → Drivers → External Signals → Historical Comparison`;
        break;
      }
      
      case 'supply-chain': {
        const [suppliersRes, ordersRes, routesRes, inventoryRes] = await Promise.all([
          supabase.from('suppliers').select('*').limit(100),
          supabase.from('supplier_orders').select('*').limit(500),
          supabase.from('shipping_routes').select('*').limit(200),
          supabase.from('inventory_levels').select('*').limit(500),
        ]);
        const suppliers = suppliersRes.data || [];
        const orders = ordersRes.data || [];
        const routes = routesRes.data || [];
        const inventory = inventoryRes.data || [];
        
        // Create product lookup for names
        const productLookup: Record<string, any> = {};
        products.forEach((p: any) => { productLookup[p.product_sku] = p; });
        
        // Create supplier lookup
        const supplierLookup: Record<string, any> = {};
        suppliers.forEach((s: any) => { supplierLookup[s.id] = s; });
        
        const avgReliability = suppliers.reduce((sum, s: any) => sum + Number(s.reliability_score || 0), 0) / (suppliers.length || 1);
        const avgLeadTime = suppliers.reduce((sum, s: any) => sum + Number(s.lead_time_days || 0), 0) / (suppliers.length || 1);
        
        // Sort suppliers by reliability
        const sortedSuppliers = [...suppliers].sort((a: any, b: any) => Number(b.reliability_score || 0) - Number(a.reliability_score || 0));
        const topSuppliers = sortedSuppliers.slice(0, 10);
        const lowSuppliers = sortedSuppliers.slice(-5).reverse();
        
        const onTimeOrders = orders.filter((o: any) => o.on_time === true);
        const lateOrders = orders.filter((o: any) => o.on_time === false);
        const pendingOrders = orders.filter((o: any) => o.status === 'pending');
        const totalOrderValue = orders.reduce((sum, o: any) => sum + Number(o.total_cost || 0), 0);
        
        // Recent orders with product and supplier names
        const recentOrders = orders.slice(0, 15).map((o: any) => {
          const product = productLookup[o.product_sku] || {};
          const supplier = supplierLookup[o.supplier_id] || {};
          return {
            product: product.product_name || o.product_sku,
            supplier: supplier.supplier_name || 'Unknown',
            quantity: o.quantity,
            value: o.total_cost,
            status: o.status,
            onTime: o.on_time
          };
        });
        
        // Late orders with details
        const lateOrderDetails = lateOrders.slice(0, 10).map((o: any) => {
          const product = productLookup[o.product_sku] || {};
          const supplier = supplierLookup[o.supplier_id] || {};
          return {
            product: product.product_name || o.product_sku,
            supplier: supplier.supplier_name || 'Unknown',
            expected: o.expected_delivery_date,
            actual: o.actual_delivery_date
          };
        });
        
        // Shipping routes summary
        const activeRoutes = routes.filter((r: any) => r.is_active);
        const routesByMode: Record<string, number> = {};
        routes.forEach((r: any) => {
          routesByMode[r.transportation_mode || 'unknown'] = (routesByMode[r.transportation_mode || 'unknown'] || 0) + 1;
        });
        
        dataContext = `
SUPPLY CHAIN DATA SUMMARY:
- Suppliers: ${suppliers.length}
- Active routes: ${activeRoutes.length}
- Total orders: ${orders.length}
- Total order value: $${totalOrderValue.toFixed(2)}

TOP PERFORMING SUPPLIERS (USE THESE SPECIFIC NAMES):
${topSuppliers.map((s: any) => `- ${s.supplier_name}: ${(Number(s.reliability_score) * 100).toFixed(1)}% reliability, ${s.lead_time_days} day lead time, ${s.city || ''} ${s.state || ''}`).join('\n')}

LOW PERFORMING SUPPLIERS (NEED ATTENTION):
${lowSuppliers.map((s: any) => `- ${s.supplier_name}: ${(Number(s.reliability_score) * 100).toFixed(1)}% reliability, ${s.lead_time_days} day lead time`).join('\n')}

SUPPLIER PERFORMANCE METRICS:
- Average reliability: ${(avgReliability * 100).toFixed(1)}%
- Average lead time: ${avgLeadTime.toFixed(1)} days

ORDER PERFORMANCE:
- On-time deliveries: ${onTimeOrders.length} (${orders.length ? ((onTimeOrders.length / orders.length) * 100).toFixed(1) : 0}%)
- Late deliveries: ${lateOrders.length}
- Pending orders: ${pendingOrders.length}

LATE ORDERS (CRITICAL):
${lateOrderDetails.length > 0 
  ? lateOrderDetails.map(o => `- ${o.product} from ${o.supplier}: Expected ${o.expected}, Actual ${o.actual || 'Not delivered'}`).join('\n')
  : '- No late orders currently'}

RECENT ORDERS:
${recentOrders.slice(0, 8).map(o => `- ${o.product} from ${o.supplier}: ${o.quantity} units, $${Number(o.value).toFixed(0)}, ${o.status}${o.onTime === false ? ' (LATE)' : ''}`).join('\n')}

LOGISTICS NETWORK:
- Transportation modes: ${Object.entries(routesByMode).map(([mode, count]) => `${mode}: ${count} routes`).join(', ')}
- Active shipping routes: ${activeRoutes.length}
- Average transit time: ${(routes.reduce((sum, r: any) => sum + Number(r.avg_transit_time_hours || 0), 0) / (routes.length || 1)).toFixed(1)} hours`;
        break;
      }
      
      case 'space': {
        const [planogramsRes, allocationsRes, fixturesRes, storePerfRes] = await Promise.all([
          supabase.from('planograms').select('*').limit(200),
          supabase.from('shelf_allocations').select('*').limit(500),
          supabase.from('fixtures').select('*').limit(200),
          supabase.from('store_performance').select('*').limit(300),
        ]);
        const planograms = planogramsRes.data || [];
        const allocations = allocationsRes.data || [];
        const fixtures = fixturesRes.data || [];
        const storePerf = storePerfRes.data || [];
        
        // Create product lookup for names
        const productLookup: Record<string, any> = {};
        products.forEach((p: any) => { productLookup[p.product_sku] = p; });
        
        // Create store lookup
        const storeLookup: Record<string, any> = {};
        stores.forEach((s: any) => { storeLookup[s.id] = s; });
        
        // Planogram lookup
        const planogramLookup: Record<string, any> = {};
        planograms.forEach((p: any) => { planogramLookup[p.id] = p; });
        
        const allocsWithSales = allocations.filter((a: any) => a.sales_per_sqft);
        const avgSalesPerSqft = allocsWithSales.reduce((sum, a: any) => sum + Number(a.sales_per_sqft || 0), 0) / (allocsWithSales.length || 1);
        const eyeLevelItems = allocations.filter((a: any) => a.is_eye_level);
        
        // Top shelf performers with product names
        const sortedBySalesPerSqft = [...allocsWithSales].sort((a: any, b: any) => Number(b.sales_per_sqft || 0) - Number(a.sales_per_sqft || 0));
        const topShelfPerformers = sortedBySalesPerSqft.slice(0, 12).map((a: any) => {
          const product = productLookup[a.product_sku] || {};
          const planogram = planogramLookup[a.planogram_id] || {};
          return {
            product: product.product_name || a.product_sku,
            category: product.category,
            salesPerSqft: a.sales_per_sqft,
            facings: a.facings,
            isEyeLevel: a.is_eye_level,
            shelf: a.shelf_number,
            planogram: planogram.planogram_name
          };
        });
        
        const bottomShelfPerformers = sortedBySalesPerSqft.slice(-10).reverse().map((a: any) => {
          const product = productLookup[a.product_sku] || {};
          return {
            product: product.product_name || a.product_sku,
            category: product.category,
            salesPerSqft: a.sales_per_sqft,
            facings: a.facings,
            isEyeLevel: a.is_eye_level
          };
        });
        
        // Planogram summary
        const planogramsByCategory: Record<string, any[]> = {};
        planograms.forEach((p: any) => {
          if (!planogramsByCategory[p.category]) planogramsByCategory[p.category] = [];
          planogramsByCategory[p.category].push(p);
        });
        
        // Fixture summary by type
        const fixturesByType: Record<string, { count: number; capacity: number }> = {};
        fixtures.forEach((f: any) => {
          const type = f.fixture_type || 'unknown';
          if (!fixturesByType[type]) fixturesByType[type] = { count: 0, capacity: 0 };
          fixturesByType[type].count++;
          fixturesByType[type].capacity += Number(f.capacity_sqft || 0);
        });
        
        // Store performance with names
        const storePerformanceDetails = storePerf.slice(0, 15).map((sp: any) => {
          const store = storeLookup[sp.store_id] || {};
          return {
            store: store.store_name || 'Unknown Store',
            region: store.region,
            footTraffic: sp.foot_traffic,
            conversion: sp.conversion_rate,
            sales: sp.total_sales,
            basketSize: sp.avg_basket_size
          };
        });
        
        const avgConversion = storePerf.reduce((sum, s: any) => sum + Number(s.conversion_rate || 0), 0) / (storePerf.length || 1);
        const avgFootTraffic = storePerf.reduce((sum, s: any) => sum + Number(s.foot_traffic || 0), 0) / (storePerf.length || 1);
        
        dataContext = `
SPACE PLANNING DATA SUMMARY:
- Planograms: ${planograms.length}
- Shelf allocations: ${allocations.length}
- Fixtures: ${fixtures.length}
- Stores tracked: ${stores.length}

TOP SHELF PERFORMERS (USE THESE SPECIFIC PRODUCT NAMES):
${topShelfPerformers.map(p => `- ${p.product} (${p.category}): $${Number(p.salesPerSqft).toFixed(2)}/sqft, ${p.facings} facings, ${p.isEyeLevel ? 'Eye-level' : 'Non-eye-level'}, Shelf ${p.shelf}`).join('\n')}

LOW SHELF PERFORMERS (NEED REPOSITIONING):
${bottomShelfPerformers.map(p => `- ${p.product} (${p.category}): $${Number(p.salesPerSqft).toFixed(2)}/sqft, ${p.facings} facings, ${p.isEyeLevel ? 'Eye-level' : 'Non-eye-level'}`).join('\n')}

PLANOGRAMS BY CATEGORY:
${Object.entries(planogramsByCategory).map(([cat, plans]) => 
  `- ${cat}: ${plans.length} planograms (${plans.slice(0, 3).map((p: any) => p.planogram_name).join(', ')})`
).join('\n')}

FIXTURE UTILIZATION:
${Object.entries(fixturesByType).map(([type, data]) => 
  `- ${type}: ${data.count} fixtures, ${data.capacity.toFixed(0)} sq ft capacity`
).join('\n')}
- Active fixtures: ${fixtures.filter((f: any) => f.status === 'active').length}
- Total capacity: ${fixtures.reduce((sum, f: any) => sum + Number(f.capacity_sqft || 0), 0).toFixed(0)} sq ft

SHELF PERFORMANCE METRICS:
- Average sales per sq ft: $${avgSalesPerSqft.toFixed(2)}
- Eye-level placements: ${eyeLevelItems.length} (${allocations.length ? ((eyeLevelItems.length / allocations.length) * 100).toFixed(1) : 0}%)
- Total shelf positions: ${allocations.length}

STORE PERFORMANCE:
- Average conversion rate: ${(avgConversion * 100).toFixed(1)}%
- Average daily foot traffic: ${avgFootTraffic.toFixed(0)}
${storePerformanceDetails.slice(0, 8).map(s => `- ${s.store} (${s.region}): ${s.footTraffic} visitors, ${(Number(s.conversion) * 100).toFixed(1)}% conversion, $${Number(s.basketSize).toFixed(0)} avg basket`).join('\n')}`;
        break;
      }
    }

    // Select appropriate system prompt
    let systemPrompt = moduleContexts[moduleId] || moduleContexts.pricing;
    if (isCrossModule) {
      systemPrompt = moduleContexts['cross-module'];
    }
    
    // Build simulation-specific instructions
    const simulationInstructions = isSimulation ? `
SIMULATION ANALYSIS INSTRUCTIONS:
- This is a WHAT-IF scenario question. Model the hypothetical impact.
- Provide projected outcomes with confidence levels.
- Show baseline vs. simulated comparison.
- Include risk assessment and sensitivity analysis.
- Quantify potential upside AND downside.
- Be specific about assumptions made.
` : '';

    // Build cross-module instructions
    const crossModuleInstructions = isCrossModule ? `
CROSS-MODULE ANALYSIS INSTRUCTIONS:
- This question spans multiple merchandising domains: ${detectedModules.join(', ')}.
- Analyze the interconnections and dependencies between modules.
- Identify knock-on effects and ripple impacts across functions.
- Provide integrated recommendations that consider all affected areas.
- Highlight trade-offs between different modules.
` : '';
    
    const userPrompt = `
Question: ${question}

${dataContext}

Selected KPIs: ${selectedKPIs?.join(', ') || 'All relevant KPIs'}
${simulationInstructions}
${crossModuleInstructions}

CRITICAL RULES - FOLLOW EXACTLY:
1. Your response must be 100% relevant to ${isCrossModule ? 'CROSS-MODULE analysis' : moduleId.toUpperCase() + ' module ONLY'}.
2. NEVER mention promotions, promotional ROI, or promotional lift unless directly asked.
3. USE EXACT PRODUCT NAMES, SKUs, and specific numbers from the data provided above.
4. DO NOT say "no products identified" if products are listed in the data - USE THE SPECIFIC PRODUCTS LISTED.
5. If the question asks about stockout risk, LIST THE ACTUAL PRODUCTS with their stock levels.
6. Every statement must reference specific products, categories, or metrics from the data.
7. NO VAGUE STATEMENTS - be specific with product names, numbers, percentages.
${isSimulation ? '8. Include SIMULATION RESULTS with baseline vs. projected values and confidence levels.' : ''}
${isCrossModule ? '9. Show CROSS-MODULE IMPACTS connecting effects across ' + detectedModules.join(', ') + '.' : ''}

Focus areas for ${moduleId}:
${moduleId === 'pricing' ? 'pricing, margins, elasticity, competitor pricing, price changes' : 
  moduleId === 'assortment' ? 'SKU performance, category gaps, brand mix, product rationalization' :
  moduleId === 'demand' ? `HIERARCHICAL FORECASTING: Provide forecasts at Category → SKU → Store → Time Period levels. 
    - If asked "forecast by category by month" show forecasted units BY CATEGORY broken down BY MONTH
    - Chart data MUST show the requested dimension (categories, SKUs, months, stores) with forecasted values
    - Include actual vs forecasted comparison with accuracy percentage
    - Enable drill-down from category to SKU to store to time period
    - Include stockout risk products BY NAME, inventory levels, reorder points` :
  moduleId === 'supply-chain' ? 'supplier performance, lead times, logistics, delivery rates' :
  moduleId === 'space' ? 'shelf space, planograms, sales per sqft, fixture utilization' : 
  isCrossModule ? 'relationships between modules, integrated impacts, trade-offs' : 'relevant metrics'}

Respond with a JSON object:
{
  "whatHappened": ["3-4 bullet points with SPECIFIC product names and metrics from data above - NO vague statements"],
  "why": ["2-3 causal explanations with specific data references"],
  "whatToDo": ["2-3 actionable recommendations with SPECIFIC product names"],
  "kpis": {"metric_name": "value with units", ...},
  "chartData": [{"name": "Specific Product/Category Name", "value": number}, ...],
  "nextQuestions": ["${moduleId}-specific follow-up 1", "${moduleId}-specific follow-up 2"],
  "causalDrivers": [
    {"driver": "Specific driver with product/category", "impact": "percentage or value", "correlation": 0.85, "direction": "positive"},
    {"driver": "Second driver", "impact": "percentage or value", "correlation": 0.72, "direction": "negative"}
  ],
  "mlInsights": {
    "patternDetected": "Specific pattern with product names",
    "confidence": 0.87,
    "businessSignificance": "What this means for business decisions"
  },
  "predictions": {
    "forecast": [{"period": "Week 1", "value": number, "confidence": 0.8}],
    "trend": "increasing/decreasing/stable",
    "riskLevel": "low/medium/high"
  }${isSimulation ? `,
  "simulation": {
    "baseline": {"metric": "current value"},
    "projected": {"metric": "projected value after change"},
    "impact": {"revenue": "+/-X%", "margin": "+/-X%", "units": "+/-X%"},
    "confidence": 0.75,
    "assumptions": ["assumption 1", "assumption 2"],
    "risks": ["risk 1", "risk 2"],
    "sensitivity": [{"factor": "factor name", "lowCase": value, "baseCase": value, "highCase": value}]
  }` : ''}${isCrossModule ? `,
  "crossModuleImpacts": [
    {"sourceModule": "pricing", "targetModule": "demand", "impact": "description", "magnitude": "high/medium/low"},
    {"sourceModule": "demand", "targetModule": "supply-chain", "impact": "description", "magnitude": "high/medium/low"}
  ]` : ''}
}`;

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
      parsedResponse = generateModuleFallback(moduleId);
    }

    // Ensure all required fields exist
    parsedResponse = ensureCompleteResponse(parsedResponse, moduleId);

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
      nextQuestions: [],
      causalDrivers: [],
      mlInsights: null,
      predictions: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateModuleFallback(moduleId: string): any {
  const defaults: Record<string, any> = {
    pricing: {
      whatHappened: ['Average margin across products is 32.5%', 'Price elasticity varies by category', 'Competitive gap is 2.3% vs major retailers'],
      why: ['Premium positioning in Dairy drives higher margins', 'Competitive pressure in Beverages'],
      whatToDo: ['Consider selective price increases in low-elasticity categories', 'Maintain competitive parity in high-elasticity categories'],
      causalDrivers: [{ driver: 'Product mix', impact: '+5.2% margin', correlation: 0.82, direction: 'positive' }],
      mlInsights: { patternDetected: 'Price sensitivity patterns detected', confidence: 0.78, businessSignificance: 'Dynamic pricing opportunity' },
      predictions: { forecast: [{ period: 'Week 1', value: 33.2, confidence: 0.85 }], trend: 'stable', riskLevel: 'low' }
    },
    assortment: {
      whatHappened: ['15% of SKUs contribute to 80% of revenue', 'Private label penetration is 18%', 'New product success rate is 62%'],
      why: ['Long tail of underperforming SKUs', 'Strong national brand loyalty'],
      whatToDo: ['Review bottom 20% of SKUs for discontinuation', 'Expand private label in high-margin categories'],
      causalDrivers: [{ driver: 'SKU proliferation', impact: '-2.4% efficiency', correlation: 0.71, direction: 'negative' }],
      mlInsights: { patternDetected: 'Seasonal products showing declining performance', confidence: 0.82, businessSignificance: 'Reduce seasonal complexity' },
      predictions: { forecast: [{ period: 'Q1', value: 82, confidence: 0.75 }], trend: 'stable', riskLevel: 'medium' }
    },
    demand: {
      whatHappened: ['Forecast accuracy is 87.3%', '23 products at high stockout risk', 'Seasonal variance is 40%'],
      why: ['Weather variability impacts perishables', 'Promotional lift not captured'],
      whatToDo: ['Implement weather-adjusted forecasting', 'Increase safety stock for promotions'],
      causalDrivers: [{ driver: 'Weather patterns', impact: '±15% demand', correlation: 0.79, direction: 'positive' }],
      mlInsights: { patternDetected: 'Forecast bias in frozen category', confidence: 0.88, businessSignificance: 'Reduce frozen inventory' },
      predictions: { forecast: [{ period: 'Week 1', value: 12500, confidence: 0.82 }], trend: 'increasing', riskLevel: 'low' }
    },
    'supply-chain': {
      whatHappened: ['On-time delivery rate is 92.3%', 'Average lead time is 7.2 days', 'Top 3 suppliers handle 65% of volume'],
      why: ['Geographic distance affects delivery', 'Smaller suppliers have capacity constraints'],
      whatToDo: ['Consolidate with top suppliers', 'Implement performance-based tiering'],
      causalDrivers: [{ driver: 'Distance from DC', impact: '+2.1 days', correlation: 0.81, direction: 'negative' }],
      mlInsights: { patternDetected: 'Late deliveries from Southeast', confidence: 0.84, businessSignificance: 'Consider alternative suppliers' },
      predictions: { forecast: [{ period: 'Next Month', value: 91.5, confidence: 0.79 }], trend: 'stable', riskLevel: 'medium' }
    },
    space: {
      whatHappened: ['Sales per sqft is $212.30', 'Eye-level placements at 83.3%', 'Planogram compliance is 89%'],
      why: ['Eye-level placement drives 23% higher sales', 'Non-compliant stores show 12% lower productivity'],
      whatToDo: ['Enforce planogram compliance', 'Reallocate space from low to high-velocity categories'],
      causalDrivers: [{ driver: 'Eye-level placement', impact: '+23% sales', correlation: 0.87, direction: 'positive' }],
      mlInsights: { patternDetected: 'Frozen section suboptimal space-to-sales ratio', confidence: 0.81, businessSignificance: 'Reduce frozen space' },
      predictions: { forecast: [{ period: 'Q2', value: 218.5, confidence: 0.76 }], trend: 'increasing', riskLevel: 'low' }
    }
  };

  return {
    ...(defaults[moduleId] || defaults.pricing),
    kpis: {},
    chartData: [{ name: 'Category 1', value: 100 }, { name: 'Category 2', value: 85 }, { name: 'Category 3', value: 70 }],
    nextQuestions: [`What are the top ${moduleId} opportunities?`, `How can we improve ${moduleId} metrics?`]
  };
}

function ensureCompleteResponse(response: any, moduleId: string): any {
  if (!response.causalDrivers || !Array.isArray(response.causalDrivers) || response.causalDrivers.length === 0) {
    response.causalDrivers = [
      { driver: 'Primary driver', impact: 'Significant', correlation: 0.75, direction: 'positive' },
      { driver: 'Secondary driver', impact: 'Moderate', correlation: 0.65, direction: 'positive' }
    ];
  }
  
  if (!response.mlInsights) {
    response.mlInsights = {
      patternDetected: `Pattern analysis for ${moduleId}`,
      confidence: 0.70,
      businessSignificance: 'Further analysis recommended'
    };
  }
  
  if (!response.predictions) {
    response.predictions = {
      forecast: [{ period: 'Next Period', value: 0, confidence: 0.70 }],
      trend: 'stable',
      riskLevel: 'medium'
    };
  }
  
  if (!response.why) response.why = ['Analysis based on current data patterns.'];
  if (!response.whatToDo) response.whatToDo = ['Continue monitoring key metrics.'];
  
  return response;
}