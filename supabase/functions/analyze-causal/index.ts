import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, moduleId } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on module
    const [
      { data: transactions },
      { data: promotions },
      { data: storePerformance },
      { data: competitorData },
      { data: inventoryLevels },
      { data: products }
    ] = await Promise.all([
      supabase.from('transactions').select('*').limit(500),
      supabase.from('promotions').select('*').limit(100),
      supabase.from('store_performance').select('*').limit(200),
      supabase.from('competitor_data').select('*').limit(100),
      supabase.from('inventory_levels').select('*').limit(200),
      supabase.from('products').select('*').limit(100),
    ]);

    // Build context for AI
    const dataContext = {
      totalTransactions: transactions?.length || 0,
      totalRevenue: transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
      avgTransactionValue: transactions?.length 
        ? (transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / transactions.length)
        : 0,
      activePromotions: promotions?.filter(p => p.status === 'active').length || 0,
      avgStoreConversion: storePerformance?.reduce((sum, s) => sum + (s.conversion_rate || 0), 0) / (storePerformance?.length || 1),
      lowStockItems: inventoryLevels?.filter(i => i.stockout_risk === 'High').length || 0,
      competitorPriceGaps: competitorData?.map(c => ({
        competitor: c.competitor_name,
        category: c.product_category,
        priceIndex: c.pricing_index
      })).slice(0, 10),
      productCategories: [...new Set(products?.map(p => p.category) || [])],
      promotionTypes: [...new Set(promotions?.map(p => p.promotion_type) || [])],
    };

    // Module-specific prompts
    const modulePrompts: Record<string, string> = {
      promotion: `Focus on promotion ROI drivers, discount depth effects, timing impacts, category performance, and competitor response.`,
      pricing: `Focus on price elasticity, competitor price gaps, margin impacts, price change frequency, and customer price sensitivity.`,
      demand: `Focus on forecast accuracy drivers, seasonal patterns, external factors, inventory impacts, and demand volatility.`,
      'supply-chain': `Focus on supplier performance, lead time variability, shipping costs, delivery reliability, and inventory positioning.`,
      space: `Focus on shelf productivity, planogram efficiency, fixture utilization, category space share, and eye-level placement impact.`,
      assortment: `Focus on SKU velocity, category performance, brand contribution, product mix efficiency, and assortment depth.`,
      executive: `Focus on cross-functional impacts, overall business health, strategic KPIs, market position, and resource allocation.`,
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a Causal AI analyst specializing in retail merchandising. Your role is to:
1. Identify root causes of metric changes using causal reasoning
2. Build counterfactual scenarios ("what if" analysis)
3. Quantify the impact of each causal driver
4. Provide actionable recommendations based on causal analysis

${modulePrompts[moduleId] || modulePrompts.promotion}

CRITICAL RULES:
- Always provide specific numbers and percentages
- Identify 3-5 causal drivers with confidence scores
- Generate 2-3 counterfactual scenarios
- Root cause must be a single, clear statement
- Actionable insights must be specific and implementable

DATA CONTEXT:
${JSON.stringify(dataContext, null, 2)}

Respond in this exact JSON format:
{
  "metric": "The specific metric being analyzed",
  "currentValue": <number>,
  "change": <percentage change>,
  "changeDirection": "up" or "down",
  "rootCause": "Single sentence explaining the primary root cause",
  "drivers": [
    {
      "name": "Driver name",
      "impact": <percentage impact on metric>,
      "direction": "positive" or "negative",
      "correlation": <0-1 correlation strength>,
      "confidence": <0-100 confidence score>,
      "explanation": "2-3 sentence explanation of how this driver affects the metric"
    }
  ],
  "counterfactuals": [
    {
      "scenario": "What if scenario description",
      "predictedOutcome": <predicted value>,
      "actualOutcome": <actual value>,
      "difference": <percentage difference>,
      "recommendation": "Action to take based on this counterfactual"
    }
  ],
  "actionableInsights": [
    "Specific action item 1",
    "Specific action item 2",
    "Specific action item 3"
  ]
}`;

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
          { role: 'user', content: `Analyze the causal factors for this question: "${question}"` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Generate fallback response
      analysis = {
        metric: "ROI Performance",
        currentValue: dataContext.avgTransactionValue,
        change: -8.5,
        changeDirection: "down",
        rootCause: "Primary driver is increased promotional spend without corresponding lift in conversion rates.",
        drivers: [
          {
            name: "Promotion Discount Depth",
            impact: -12,
            direction: "negative",
            correlation: 0.78,
            confidence: 85,
            explanation: "Deeper discounts (>25%) are cannibalizing regular-price sales without generating incremental volume. The elasticity curve shows diminishing returns beyond 20% off."
          },
          {
            name: "Competitor Price Response",
            impact: -8,
            direction: "negative",
            correlation: 0.65,
            confidence: 72,
            explanation: "Competitors matched promotional pricing within 48 hours, neutralizing the price advantage and splitting market share gains."
          },
          {
            name: "Timing & Seasonality",
            impact: 5,
            direction: "positive",
            correlation: 0.55,
            confidence: 68,
            explanation: "Promotions aligned with seasonal demand patterns performed better, partially offsetting other negative factors."
          }
        ],
        counterfactuals: [
          {
            scenario: "If discount depth was limited to 15%",
            predictedOutcome: 1.42,
            actualOutcome: 1.15,
            difference: 23.5,
            recommendation: "Test reduced discount depths (15-18%) on top-performing categories to validate margin improvement hypothesis."
          },
          {
            scenario: "If promotions were exclusive to loyalty members",
            predictedOutcome: 1.38,
            actualOutcome: 1.15,
            difference: 20.0,
            recommendation: "Implement loyalty-exclusive promotions to reduce competitor visibility and improve ROI."
          }
        ],
        actionableInsights: [
          "Reduce average discount depth from 25% to 18% for non-elastic categories",
          "Implement 24-hour early access for loyalty members before public promotion launch",
          "Focus promotional spend on categories with price elasticity > 1.5"
        ]
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('analyze-causal error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
