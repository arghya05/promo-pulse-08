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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query all data tables to provide context
    const [storesResult, promotionsResult, transactionsResult, customersResult, thirdPartyResult] = await Promise.all([
      supabaseClient.from('stores').select('*').limit(1000),
      supabaseClient.from('promotions').select('*').limit(1000),
      supabaseClient.from('transactions').select('*').limit(5000),
      supabaseClient.from('customers').select('*').limit(1000),
      supabaseClient.from('third_party_data').select('*').limit(1000),
    ]);

    const dataContext = {
      stores: storesResult.data || [],
      promotions: promotionsResult.data || [],
      transactions: transactionsResult.data || [],
      customers: customersResult.data || [],
      thirdPartyData: thirdPartyResult.data || [],
      totalStores: storesResult.data?.length || 0,
      totalPromotions: promotionsResult.data?.length || 0,
      totalTransactions: transactionsResult.data?.length || 0,
      totalCustomers: customersResult.data?.length || 0,
    };

    return new Response(
      JSON.stringify(dataContext),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query-analytics-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
