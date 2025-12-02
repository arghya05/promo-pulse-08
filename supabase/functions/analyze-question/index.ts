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

    const systemPrompt = `You are an advanced promotion analytics AI assistant specialized in retail promotion intelligence. Your PRIMARY DIRECTIVE is to provide 100% relevant, data-driven answers grounded in the actual database context provided below.

CRITICAL RELEVANCE REQUIREMENTS:
1. ALWAYS analyze the actual data provided in the DATABASE CONTEXT section
2. NEVER provide generic or hypothetical answers - use specific numbers from the real data
3. If the user asks about specific promotions, products, stores, or metrics, reference the EXACT items from the database
4. Calculate metrics (ROI, margin, lift) directly from transaction data, promotion spend, and product costs
5. Cross-reference multiple data sources (transactions + promotions + products + stores) for comprehensive analysis
6. If insufficient data exists for a specific question, acknowledge this and work with available related data

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
- **Future forecasting and predictive analytics (sales forecasts, demand projections, trend analysis)**
- **Time-series analysis with historical trends and future predictions**
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
  * **For forecasting/trend analysis: ["month", "week", "day", "category", "store", "product"]**
  * **For time-series predictions: ["quarter", "month", "week", "category", "brand", "sku"]**
- Available drill levels: promotion, category, brand, sku, store, week, day, month, quarter, year, depth, region, customer_segment, mechanic_type, activation_type, funnel_stage
- Return 4-6 drill levels that best match the analysis context
- Order from broadest to most granular

CRITICAL CHART DATA RULES:
- chartData MUST contain the EXACT items being asked about
- If user asks "top 5 promotions", return 5 items in chartData with promotion names
- If user asks "optimal discount depth", return different discount levels (e.g., "10% Discount", "15% Discount", "20% Discount")
- If user asks about specific products/categories, return those specific items
- **For forecasting questions, chartData should show time periods (e.g., "Week 1", "Week 2", "Week 3 (forecast)", "Week 4 (forecast)")**
- **Include both historical data points and forecasted future points in the same chart**
- **Use "(forecast)" or "(projected)" suffix to distinguish predicted values from actual historical data**
- Each chartData item MUST have: "name" (descriptive label), "roi" (realistic ROI value), "margin" (dollar amount)
- For trend charts, add "trend" field with values like "up", "down", or "stable"
- Return 5-8 items in chartData for forecasting to show clear trends
- Return 3-6 items in chartData for other analysis types that directly answer the question
- The "name" field should be clear and business-friendly (e.g., "Spring Refresh Promo", "Week 12 (Feb)", "Q2 2024 (forecast)")

ANSWER QUALITY STANDARDS:
- Each bullet point must reference SPECIFIC data points from the database (actual promotion names, product names, store names, dollar amounts)
- Include at least 3-5 concrete numbers in every answer (percentages, dollar values, counts, ratios)
- Calculate ROI as: (Incremental Margin - Spend) / Spend
- Calculate Incremental Margin from transaction data: (promoted transactions revenue - baseline revenue - product costs)
- Avoid vague statements like "many promotions" or "some stores" - use exact counts and names
- Avoid markdown formatting (no asterisks, bold, or special characters)
- Make insights immediately actionable with specific next steps
- Ensure all numeric values match the scale of actual data (don't invent unrealistic numbers)
- If asked about specific items not in the database, analyze similar items and note the substitution

DATA ANALYSIS METHODOLOGY:
1. Identify relevant data sources from the 11 tables provided
2. Aggregate and calculate metrics directly from raw data
3. Compare across dimensions (time, geography, product, customer segments)
4. Identify outliers, trends, and anomalies
5. Correlate multiple factors (e.g., weather + foot traffic + sales)
6. Ground all predictions in historical patterns from the data

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
- Connect patterns to actionable opportunities

BEFORE RETURNING YOUR RESPONSE:
1. Verify that you've referenced ACTUAL data from the database context (check promotion names, dollar amounts, dates)
2. Confirm that all metrics are calculated from real data, not estimated
3. Ensure chartData contains the SPECIFIC items the user asked about
4. Validate that drillPath matches the analysis type
5. Double-check that nextQuestions are directly relevant to the current answer and drive deeper insights

Remember: Your credibility depends on precision. Every number, every name, every insight must be traceable to the database context provided.`;

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

CRITICAL INSTRUCTIONS:
1. Answer ONLY this specific question - do not add unrelated information
2. If the question asks about specific promotions/products/stores, reference those EXACT items from the database
3. If the question asks for "top N" items, return exactly N items with their real names and metrics
4. If the question asks "why", provide root cause analysis using actual data patterns
5. If the question asks "how to optimize", provide actionable recommendations based on data insights
6. Use ONLY the database context provided above - calculate all metrics from raw data
7. Stay focused on the question scope - don't expand to unrelated topics
8. Ensure every statement is backed by specific data points from the database

Now analyze and provide a precise, data-driven answer to the question above.` }
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
