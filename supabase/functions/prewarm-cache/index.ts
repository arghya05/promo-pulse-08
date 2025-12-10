import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 70 questions from the library
const questionLibrary = [
  { id: 1, question: "Top 5 promotions by ROI last month?" },
  { id: 2, question: "Top 5 by incremental margin last quarter?" },
  { id: 3, question: "Which promos lost money (ROI < 1) in past 8 weeks?" },
  { id: 4, question: "Optimal discount depth for Soda-12pk to maximize margin?" },
  { id: 5, question: "Category-level promo ROI for Snacks in May?" },
  { id: 6, question: "Promo calendar Region North next month (predicted lift)?" },
  { id: 7, question: "Impact of display vs feature on Beverages last quarter?" },
  { id: 8, question: "Effect of vendor funding on ROI last quarter?" },
  { id: 9, question: "Top 10 price-off promos by units lifted?" },
  { id: 10, question: "Stores that overspend with weak lifts?" },
  { id: 11, question: "Best mechanic (price-off/BOGO/bundle/coupon) for Dairy?" },
  { id: 12, question: "Weeks where halo to soda >5% from chips promos?" },
  { id: 13, question: "Products most cannibalized during Pasta Sauce promos?" },
  { id: 14, question: "Coupon redemption rate by promo last month?" },
  { id: 15, question: "Margin impact of 20% vs 30% depth for Top-selling Yogurt?" },
  { id: 16, question: "Which brand benefited most from holiday promos Q4?" },
  { id: 17, question: "Are we over-promoting low-elasticity products?" },
  { id: 18, question: "Region comparison: promo spend vs incremental margin YTD?" },
  { id: 19, question: "Which promos improved basket size the most?" },
  { id: 20, question: "Vendor-funded promos with ROI ≥ 2 to scale?" },
  { id: 21, question: "Promotion fatigue: did repeated deals lose lift?" },
  { id: 22, question: "Best weekday to start promos for Frozen?" },
  { id: 23, question: "Are we profitable after markdown + funding for Produce?" },
  { id: 24, question: "Which promos drove new vs repeat (proxy) customers?" },
  { id: 25, question: "Best combo: feature + display vs either alone (Beverages)?" },
  { id: 26, question: "Which promos increased stockout risk?" },
  { id: 27, question: "BOGO effectiveness vs price-off in Snacks?" },
  { id: 28, question: "Bundle (chips+soda) performance last 12 weeks?" },
  { id: 29, question: "Top store clusters by promo ROI?" },
  { id: 30, question: "Where did promos widen market share (proxy units)?" },
  { id: 31, question: "Depth optimizer recommendations for Beverages this month?" },
  { id: 32, question: "Net halo−cannibal for Snacks?" },
  { id: 33, question: "Top promos by A/B uplift vs forecast?" },
  { id: 34, question: "Vendor ranking by ROI and funding fairness?" },
  { id: 35, question: "Which promos underperformed predicted lift?" },
  { id: 36, question: "Holiday vs non-holiday promo efficiency?" },
  { id: 37, question: "Coupon leakage (issued→redeemed)?" },
  { id: 38, question: "Core vs long-tail SKU promo return?" },
  { id: 39, question: "Best new item starter pack?" },
  { id: 40, question: "Where can we cut promos with minimal sales loss?" },
  { id: 41, question: "Affluence index effect on promo response?" },
  { id: 42, question: "Elasticity outliers to watch?" },
  { id: 43, question: "Feature-only wins (no discount)?" },
  { id: 44, question: "Promos that drove repeat purchases week+1?" },
  { id: 45, question: "Spend efficiency trend YTD?" },
  { id: 46, question: "Vendor funding gaps vs expected?" },
  { id: 47, question: "Top 5 risks in next month's plan?" },
  { id: 48, question: "Attach rate change for soda during chips promos?" },
  { id: 49, question: "Where did display outperform feature?" },
  { id: 50, question: "Executive promo scorecard for this month?" },
  { id: 51, question: "Forecast next month's sales by category with promotion impact?" },
  { id: 52, question: "Which customers have highest propensity to respond to promotions?" },
  { id: 53, question: "Predict churn risk for high-value customers without promotions?" },
  { id: 54, question: "Customer lifetime value prediction by segment with promo frequency?" },
  { id: 55, question: "Forecast demand spike for seasonal products next quarter?" },
  { id: 56, question: "Market basket prediction: what products will customers buy together?" },
  { id: 57, question: "Price elasticity forecast: optimal price points for next campaign?" },
  { id: 58, question: "Predict which promotions will underperform before launch?" },
  { id: 59, question: "Customer conversion probability by promotion type and segment?" },
  { id: 60, question: "Forecast incremental margin impact of planned promotions Q2?" },
  { id: 61, question: "Predict promotion fatigue point by customer segment?" },
  { id: 62, question: "Anomaly detection: which promotions deviate from expected patterns?" },
  { id: 63, question: "Trend analysis: are promotion returns improving or declining?" },
  { id: 64, question: "Cross-category cannibalization forecast for upcoming campaigns?" },
  { id: 65, question: "Predict optimal promotion mix to maximize portfolio ROI?" },
  { id: 66, question: "Customer acquisition propensity score by promotion offer?" },
  { id: 67, question: "Forecast store-level performance variance for next campaign?" },
  { id: 68, question: "Predictive LTV by promo exposure: heavy vs light promotion users?" },
  { id: 69, question: "Time series forecast: when will promotion ROI peak this year?" },
  { id: 70, question: "Predict incremental units by promotion depth: 10% vs 20% vs 30%?" },
];

const personas = ['executive', 'category_manager_consumables', 'category_manager_non_consumables'];

// Background task to warm cache - runs after response is sent
async function warmCacheInBackground(supabaseUrl: string, supabaseKey: string, personasToWarm: string[]) {
  console.log(`Starting background cache warming for ${personasToWarm.length} personas, ${questionLibrary.length} questions each`);
  
  let successCount = 0;
  let cachedCount = 0;
  let failedCount = 0;
  
  for (const persona of personasToWarm) {
    console.log(`Warming cache for persona: ${persona}`);
    
    for (const q of questionLibrary) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/analyze-question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            question: q.question,
            persona: persona,
          }),
        });
        
        const cacheHeader = response.headers.get('X-Cache');
        
        if (response.ok) {
          successCount++;
          if (cacheHeader === 'HIT') cachedCount++;
          console.log(`✓ Q${q.id} for ${persona}: ${cacheHeader === 'HIT' ? 'cached' : 'generated'}`);
        } else {
          failedCount++;
          console.log(`✗ Q${q.id} for ${persona}: failed (${response.status})`);
        }
        
        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        failedCount++;
        console.error(`✗ Q${q.id} for ${persona}: error - ${error}`);
      }
    }
    
    console.log(`Completed persona ${persona}: ${successCount} success, ${cachedCount} cached, ${failedCount} failed`);
  }
  
  console.log(`Cache warming complete: ${successCount} generated, ${cachedCount} already cached, ${failedCount} failed`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const { persona = 'all' } = await req.json().catch(() => ({}));
    
    const personasToWarm = persona === 'all' ? personas : [persona];
    const totalQuestions = personasToWarm.length * questionLibrary.length;
    
    console.log(`Pre-warm request: ${personasToWarm.length} personas, ${questionLibrary.length} questions = ${totalQuestions} total`);
    
    // Start background task using EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(warmCacheInBackground(supabaseUrl, supabaseKey, personasToWarm));
    
    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: 'Cache warming started in background',
        personas: personasToWarm,
        questionsPerPersona: questionLibrary.length,
        totalQuestions,
        estimatedTime: `${Math.ceil(totalQuestions * 0.8 / 60)} minutes`
      }),
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

// Handle shutdown gracefully
addEventListener('beforeunload', (ev: any) => {
  console.log('Cache warming function shutting down:', ev.detail?.reason);
});
