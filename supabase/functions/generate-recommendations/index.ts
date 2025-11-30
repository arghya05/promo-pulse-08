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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating promotion recommendations...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Gather comprehensive data for recommendations
    const [
      inventoryResult,
      competitorResult,
      customersResult,
      promotionsResult,
      productsResult,
      storePerformanceResult,
      transactionsResult
    ] = await Promise.all([
      supabaseClient.from('inventory_levels').select('*, stores(store_name, region)').order('stockout_risk', { ascending: false }),
      supabaseClient.from('competitor_data').select('*').order('observation_date', { ascending: false }).limit(50),
      supabaseClient.from('customers').select('*'),
      supabaseClient.from('promotions').select('*').eq('status', 'active'),
      supabaseClient.from('products').select('*'),
      supabaseClient.from('store_performance').select('*, stores(store_name, region)').order('metric_date', { ascending: false }).limit(20),
      supabaseClient.from('transactions').select('*, promotions(promotion_name)').order('transaction_date', { ascending: false }).limit(100)
    ]);

    // Build rich context for AI
    let contextMessage = `=== PROMOTION RECOMMENDATIONS CONTEXT ===\n\n`;
    
    // Inventory analysis
    contextMessage += `INVENTORY ANALYSIS (${inventoryResult.data?.length || 0} items):\n`;
    const highRiskItems = inventoryResult.data?.filter(inv => inv.stockout_risk === 'High') || [];
    const lowRiskItems = inventoryResult.data?.filter(inv => inv.stock_level > (inv.reorder_point || 0) * 2) || [];
    contextMessage += `- High stockout risk: ${highRiskItems.length} items\n`;
    contextMessage += `- Overstocked items: ${lowRiskItems.length} items\n`;
    highRiskItems.slice(0, 5).forEach(inv => {
      contextMessage += `  • ${inv.product_sku} at ${inv.stores?.store_name}: Stock=${inv.stock_level}, Reorder=${inv.reorder_point}\n`;
    });
    lowRiskItems.slice(0, 5).forEach(inv => {
      contextMessage += `  • ${inv.product_sku} at ${inv.stores?.store_name}: Stock=${inv.stock_level} (overstocked)\n`;
    });
    
    // Competitive intelligence
    contextMessage += `\nCOMPETITIVE INTELLIGENCE (${competitorResult.data?.length || 0} observations):\n`;
    competitorResult.data?.slice(0, 10).forEach(comp => {
      contextMessage += `- ${comp.competitor_name} (${comp.product_category}): Pricing=${comp.pricing_index}, Promo Intensity=${comp.promotion_intensity}, Market Share=${comp.market_share_percent}%\n`;
    });
    
    // Customer segments
    contextMessage += `\nCUSTOMER SEGMENTS (${customersResult.data?.length || 0} customers):\n`;
    const segments = customersResult.data?.reduce((acc: any, cust) => {
      const seg = cust.segment || 'Unknown';
      if (!acc[seg]) acc[seg] = { count: 0, totalLTV: 0, tiers: {} };
      acc[seg].count++;
      acc[seg].totalLTV += cust.total_lifetime_value || 0;
      const tier = cust.loyalty_tier || 'Unknown';
      acc[seg].tiers[tier] = (acc[seg].tiers[tier] || 0) + 1;
      return acc;
    }, {});
    Object.entries(segments || {}).forEach(([segment, data]: [string, any]) => {
      contextMessage += `- ${segment}: ${data.count} customers, Avg LTV=$${(data.totalLTV / data.count).toFixed(0)}, Tiers: ${JSON.stringify(data.tiers)}\n`;
    });
    
    // Active promotions
    contextMessage += `\nACTIVE PROMOTIONS (${promotionsResult.data?.length || 0}):\n`;
    promotionsResult.data?.forEach(promo => {
      contextMessage += `- ${promo.promotion_name}: ${promo.promotion_type}, ${promo.product_category || 'All categories'}, Discount=${promo.discount_percent ? promo.discount_percent + '%' : '$' + promo.discount_amount}\n`;
    });
    
    // Product catalog
    contextMessage += `\nPRODUCT CATALOG (${productsResult.data?.length || 0} products):\n`;
    const categoryMargins = productsResult.data?.reduce((acc: any, prod) => {
      if (!acc[prod.category]) acc[prod.category] = { count: 0, avgMargin: 0, avgElasticity: 0 };
      acc[prod.category].count++;
      acc[prod.category].avgMargin += prod.margin_percent || 0;
      acc[prod.category].avgElasticity += prod.price_elasticity || 0;
      return acc;
    }, {});
    Object.entries(categoryMargins || {}).forEach(([cat, data]: [string, any]) => {
      contextMessage += `- ${cat}: ${data.count} products, Avg Margin=${(data.avgMargin / data.count).toFixed(1)}%, Avg Elasticity=${(data.avgElasticity / data.count).toFixed(2)}\n`;
    });
    
    // Recent performance
    contextMessage += `\nRECENT STORE PERFORMANCE:\n`;
    storePerformanceResult.data?.slice(0, 5).forEach(perf => {
      contextMessage += `- ${perf.stores?.store_name} (${perf.metric_date}): Traffic=${perf.foot_traffic}, Conversion=${perf.conversion_rate}%, Sales=$${perf.total_sales}\n`;
    });

    const systemPrompt = `You are an expert retail promotion strategist with deep knowledge of inventory management, competitive positioning, and customer segmentation. Your task is to generate 3-5 specific, actionable promotion recommendations.

${contextMessage}

Generate promotion recommendations following this EXACT JSON structure:
{
  "recommendations": [
    {
      "title": "Clear promotion name (e.g., 'Flash Sale: Overstocked Beverages')",
      "promotionType": "One of: Percentage Discount, Dollar Off, BOGO, Bundle, Clearance, Flash Sale",
      "targetCategory": "Specific product category from data",
      "targetSegment": "Customer segment to target (Premium, Value, Family, etc.)",
      "discountMechanic": "Specific discount (e.g., '25% off', 'Buy 2 Get 1', '$5 off $25')",
      "rationale": {
        "inventory": "How this addresses inventory concerns (stockout risk or overstock)",
        "competition": "How this positions against competitors",
        "customer": "Why this appeals to the target segment"
      },
      "expectedImpact": {
        "liftPct": number (10-80, realistic sales lift percentage),
        "roi": number (0.8-3.5, expected return on investment),
        "marginImpact": number (-50000 to 100000, dollar impact on margin),
        "unitsMoved": number (100-5000, expected units to sell)
      },
      "priority": "High, Medium, or Low",
      "timing": "Recommended timing (e.g., 'Next 7 days', 'Weekend only', 'Month-long')",
      "stores": ["List of specific store names or 'All stores'"]
    }
  ]
}

CRITICAL RULES:
- Each recommendation must be specific and actionable with concrete numbers
- Prioritize addressing inventory risks (high stockout risk or overstock situations)
- Consider competitive gaps where competitors are weak or gaining share
- Target customer segments with appropriate value propositions
- Ensure discount mechanics align with product margins and elasticity
- Provide realistic impact estimates based on historical data patterns
- High priority for urgent inventory issues or major competitive threats
- Include 3-5 recommendations ordered by priority`;

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
          { role: 'user', content: 'Generate promotion recommendations based on the current data context.' }
        ],
        temperature: 0.8,
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
    console.log('AI recommendations received');

    let result;
    try {
      const content = data.choices[0].message.content;
      console.log('Raw AI content:', content);
      
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      result = JSON.parse(jsonString);
      console.log('Parsed recommendations:', result);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
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
