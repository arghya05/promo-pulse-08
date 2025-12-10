import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All questions from the library that should be cached for fast access
const questionLibrary = [
  { id: 1, question: "Top 5 promotions by ROI last month?" },
  { id: 2, question: "Top 5 by incremental margin last quarter?" },
  { id: 3, question: "Which promos lost money (ROI < 1) in past 8 weeks?" },
  { id: 4, question: "Optimal discount depth for Soda-12pk to maximize margin?" },
  { id: 5, question: "Category-level promo ROI for Snacks in May?" },
  { id: 6, question: "Promo calendar Region North next month (predicted lift)?" },
  { id: 11, question: "Best mechanic (price-off/BOGO/bundle/coupon) for Dairy?" },
  { id: 14, question: "Coupon redemption rate by promo last month?" },
  { id: 20, question: "Vendor-funded promos with ROI ≥ 2 to scale?" },
  { id: 50, question: "Executive promo scorecard for this month?" },
  { id: 51, question: "Forecast next month's sales by category with promotion impact?" },
  { id: 52, question: "Which customers have highest propensity to respond to promotions?" },
  { id: 58, question: "Predict which promotions will underperform before launch?" },
  { id: 65, question: "Predict optimal promotion mix to maximize portfolio ROI?" },
];

const personas = ['executive', 'category_manager_consumables', 'category_manager_non_consumables'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const { persona = 'all', forceRefresh = false } = await req.json().catch(() => ({}));
    
    console.log('Pre-warming cache for persona:', persona, 'forceRefresh:', forceRefresh);
    
    const personasToWarm = persona === 'all' ? personas : [persona];
    const results: any[] = [];
    
    for (const p of personasToWarm) {
      console.log(`Warming cache for persona: ${p}`);
      
      for (const q of questionLibrary) {
        try {
          // Call the analyze-question function
          const response = await fetch(`${supabaseUrl}/functions/v1/analyze-question`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              question: q.question,
              persona: p,
            }),
          });
          
          const cacheHeader = response.headers.get('X-Cache');
          const status = response.ok ? 'success' : 'failed';
          
          results.push({
            questionId: q.id,
            question: q.question,
            persona: p,
            status,
            cached: cacheHeader === 'HIT',
          });
          
          console.log(`Question ${q.id} for ${p}: ${status}, cache: ${cacheHeader}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed to warm question ${q.id} for ${p}:`, error);
          results.push({
            questionId: q.id,
            question: q.question,
            persona: p,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      cached: results.filter(r => r.cached).length,
      failed: results.filter(r => r.status !== 'success').length,
    };
    
    console.log('Pre-warm complete:', summary);
    
    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Pre-warm error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
