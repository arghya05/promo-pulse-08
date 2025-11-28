import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `You are an advanced promotion analytics AI assistant with predictive modeling and causal analysis capabilities. Analyze user questions about promotions and return structured insights with ML-driven predictions.

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
