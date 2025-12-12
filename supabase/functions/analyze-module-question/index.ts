import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const moduleContexts: Record<string, string> = {
  pricing: `You are a Pricing Optimization AI for a $4B grocery retailer. Analyze pricing strategies, elasticity, competitive positioning, and margin optimization. Focus on actionable pricing recommendations.`,
  assortment: `You are an Assortment Planning AI for a $4B grocery retailer. Analyze product mix, category management, SKU rationalization, and brand portfolio optimization. Focus on assortment decisions that maximize sales and margins.`,
  demand: `You are a Demand Forecasting & Replenishment AI for a $4B grocery retailer. Analyze demand patterns, forecast accuracy, inventory optimization, and replenishment strategies. Focus on reducing stockouts and overstock.`,
  'supply-chain': `You are a Supply Chain AI for a $4B grocery retailer. Analyze logistics, supplier performance, distribution efficiency, and cost optimization. Focus on supply chain resilience and efficiency.`,
  space: `You are a Space Planning AI for a $4B grocery retailer. Analyze shelf space allocation, planogram optimization, sales per square foot, and store layout effectiveness. Focus on maximizing space productivity.`,
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

    // Fetch relevant data based on module
    const [
      { data: products },
      { data: stores },
      { data: transactions },
      { data: inventory },
      { data: competitors },
      { data: storePerformance }
    ] = await Promise.all([
      supabase.from('products').select('*').limit(50),
      supabase.from('stores').select('*').limit(50),
      supabase.from('transactions').select('*').limit(500),
      supabase.from('inventory_levels').select('*').limit(100),
      supabase.from('competitor_data').select('*').limit(50),
      supabase.from('store_performance').select('*').limit(100)
    ]);

    // Build context based on module
    let dataContext = '';
    
    switch (moduleId) {
      case 'pricing':
        dataContext = `
Products (${products?.length || 0} items): Categories include ${[...new Set(products?.map(p => p.category))].join(', ')}.
Average base price: $${(products?.reduce((sum, p) => sum + Number(p.base_price), 0) / (products?.length || 1)).toFixed(2)}
Average margin: ${(products?.reduce((sum, p) => sum + Number(p.margin_percent || 0), 0) / (products?.length || 1)).toFixed(1)}%
Competitors: ${[...new Set(competitors?.map(c => c.competitor_name))].join(', ')}
Average competitor pricing index: ${(competitors?.reduce((sum, c) => sum + Number(c.pricing_index || 100), 0) / (competitors?.length || 1)).toFixed(1)}`;
        break;
      
      case 'assortment':
        dataContext = `
Products (${products?.length || 0} SKUs): Categories: ${[...new Set(products?.map(p => p.category))].join(', ')}
Brands: ${[...new Set(products?.map(p => p.brand).filter(Boolean))].slice(0, 10).join(', ')}
Stores: ${stores?.length || 0} locations across ${[...new Set(stores?.map(s => s.region))].join(', ')}
Recent transactions: ${transactions?.length || 0} records`;
        break;
      
      case 'demand':
        dataContext = `
Inventory levels: ${inventory?.length || 0} SKU-store combinations
Products at risk (low stock): ${inventory?.filter(i => i.stockout_risk === 'high').length || 0}
Recent transaction volume: ${transactions?.length || 0} transactions
Stores: ${stores?.length || 0} locations`;
        break;
      
      case 'supply-chain':
        dataContext = `
Stores/Warehouses: ${stores?.length || 0} across ${[...new Set(stores?.map(s => s.region))].join(', ')}
Inventory records: ${inventory?.length || 0}
Products requiring restock: ${inventory?.filter(i => (i.stock_level || 0) < (i.reorder_point || 0)).length || 0}`;
        break;
      
      case 'space':
        dataContext = `
Stores: ${stores?.length || 0} locations
Store performance records: ${storePerformance?.length || 0}
Average sales: $${(storePerformance?.reduce((sum, s) => sum + Number(s.total_sales || 0), 0) / (storePerformance?.length || 1)).toFixed(0)}
Product categories: ${[...new Set(products?.map(p => p.category))].join(', ')}`;
        break;
    }

    const systemPrompt = moduleContexts[moduleId] || moduleContexts.pricing;
    
    const userPrompt = `
Question: ${question}

Available Data:
${dataContext}

Selected KPIs to focus on: ${selectedKPIs?.join(', ') || 'All relevant KPIs'}

Respond with a JSON object containing:
{
  "whatHappened": ["3-4 bullet points with specific numbers from the data"],
  "why": ["2-3 reasons explaining the patterns"],
  "whatToDo": ["2-3 actionable recommendations"],
  "kpis": {"kpi_name": "value", ...},
  "chartData": [{"name": "Label", "value": number}, ...],
  "nextQuestions": ["Follow-up question 1", "Follow-up question 2"]
}

Use actual numbers from the data provided. Be specific and actionable.`;

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
      // Fallback response
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
