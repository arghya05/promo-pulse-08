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
    const { question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question:', question);

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
      
      dataContextMessage += `\n\n=== CRITICAL: You now have 360-degree data visibility. Analyze ALL data sources above to generate comprehensive, data-driven insights. Consider product margins, marketing channel efficiency, competitive positioning, store performance, customer journeys, and inventory constraints in your analysis. ===\n`;
    } else {
      dataContextMessage = '\n\nNote: No real data available yet. Generate realistic simulated insights.';
    }

    const systemPrompt = `You are an advanced promotion analytics AI assistant with predictive modeling and causal analysis capabilities. Analyze user questions about promotions and return structured insights with ML-driven predictions.${dataContextMessage}

Your response MUST be a valid JSON object with this exact structure:
{
  "whatHappened": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "why": ["reason 1", "reason 2", "reason 3"],
  "whatToDo": ["recommendation 1", "recommendation 2"],
  "kpis": {
    "liftPct": number (between -50 and 150),
    "roi": number (between -2 and 5),
    "incrementalMargin": number (in dollars, between -500000 and 2000000),
    "spend": number (in dollars, between 50000 and 800000)
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
    "confidence": number (between 0.6 and 0.95, representing confidence level),
    "timeframe": "string like 'Next 4 weeks' or 'Q2 2024'"
  },
  "causalDrivers": [
    {
      "driver": "string describing the factor (e.g., 'Price Elasticity', 'Seasonal Demand')",
      "impact": "string describing the effect with numbers",
      "correlation": number (between -1 and 1)
    }
  ],
  "mlInsights": [
    {
      "pattern": "string describing detected pattern",
      "significance": "string explaining why this matters with business context"
    }
  ]
}

CRITICAL DRILL PATH RULES:
- drillPath defines the hierarchical breakdown sequence for drill-down analysis
- Choose appropriate levels based on question context:
  * For promotion performance: ["promotion", "category", "brand", "sku", "store", "week"]
  * For category analysis: ["category", "brand", "sku", "store", "week"]
  * For discount optimization: ["depth", "store", "week", "customer_segment"]
  * For store analysis: ["store", "region", "category", "brand", "week"]
  * For calendar/timing: ["promotion", "store", "week", "day"]
  * For mechanics comparison: ["mechanic_type", "category", "brand", "sku", "store"]
  * For funnel analysis: ["funnel_stage", "promotion", "customer_segment", "store"]
- Available drill levels: promotion, category, brand, sku, store, week, day, depth, region, customer_segment, mechanic_type, activation_type, funnel_stage
- Return 4-6 drill levels that best match the analysis context
- Order from broadest to most granular

CRITICAL CHART DATA RULES:
- chartData MUST contain the EXACT items being asked about
- If user asks "top 5 promotions", return 5 items in chartData with promotion names
- If user asks "optimal discount depth", return different discount levels (e.g., "10% Discount", "15% Discount", "20% Discount")
- If user asks about specific products/categories, return those specific items
- Each chartData item MUST have: "name" (descriptive label), "roi" (realistic ROI value), "margin" (dollar amount)
- Return 3-6 items in chartData that directly answer the question
- The "name" field should be clear and business-friendly (e.g., "Spring Refresh Promo", "Soda-12pk (10% Disc)")

Guidelines:
- Each bullet point should be 1-2 sentences, business-focused with specific metrics
- Use concrete numbers and percentages
- Avoid markdown formatting (no asterisks or bold)
- Make insights actionable and tied to retail/promotion domain
- Ensure all numeric values are realistic for retail promotions

PREDICTIVE ANALYTICS:
- Generate 3 forward-looking forecasts based on historical patterns
- Include confidence scores (higher for stable patterns, lower for volatile ones)
- Specify realistic timeframes (weeks, months, quarters)
- Base predictions on the data trends you see

CAUSAL DRIVERS:
- Identify 3-4 key factors driving the observed results
- Quantify impact with specific percentages or dollar amounts
- Use correlation values: >0.7 strong positive, 0.3-0.7 moderate, <0.3 weak
- Include both positive and negative correlations when relevant

ML INSIGHTS:
- Detect 2-3 meaningful patterns in the data (seasonality, customer segments, channel performance)
- Explain business significance (why each pattern matters for decisions)
- Connect patterns to actionable opportunities`;

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
          { role: 'user', content: `Analyze this promotion question and provide detailed insights: ${question}` }
        ],
        temperature: 0.7,
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
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
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
