import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface RateData {
  rate_date: string;
  rate_type: string;
  rate_value: number;
  term_years: number;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { rates, source = 'mortgage_news_daily' }: { 
      rates: RateData[], 
      source?: string 
    } = await req.json();

    if (!rates || !Array.isArray(rates)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rate data format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Received ${rates.length} rate records from ${source}`);

    // Store rate data with upsert to handle duplicates
    const { data, error } = await supabase
      .from('rate_history')
      .upsert(rates, {
        onConflict: 'rate_date,term_years'
      })
      .select();

    if (error) {
      console.error('Error storing rate data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store rate data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully stored ${data?.length || 0} rate records`);

    // Check for rate alerts after storing new data
    EdgeRuntime.waitUntil(checkRateAlerts());

    return new Response(
      JSON.stringify({ 
        success: true, 
        stored: data?.length || 0,
        message: 'Rate data processed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Rate webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkRateAlerts() {
  try {
    console.log('Checking for rate alerts...');

    // Get clients with target rates
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, target_rate, loan_type, broker_id')
      .not('target_rate', 'is', null);

    if (clientError) {
      console.error('Error fetching clients:', clientError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('No clients with target rates found');
      return;
    }

    // Get latest rates
    const { data: latestRates, error: rateError } = await supabase
      .from('rate_history')
      .select('term_years, rate_value, rate_date')
      .order('rate_date', { ascending: false })
      .limit(10);

    if (rateError) {
      console.error('Error fetching latest rates:', rateError);
      return;
    }

    // Group rates by term
    const ratesByTerm: Record<number, number> = {};
    latestRates?.forEach(rate => {
      if (!ratesByTerm[rate.term_years] || rate.rate_date > ratesByTerm[rate.term_years]) {
        ratesByTerm[rate.term_years] = rate.rate_value;
      }
    });

    const alerts: any[] = [];

    // Check each client against current rates
    clients.forEach(client => {
      const termYears = client.loan_type === '15yr' ? 15 : 30;
      const currentRate = ratesByTerm[termYears];

      if (currentRate && client.target_rate && currentRate <= client.target_rate) {
        alerts.push({
          client_id: client.id,
          broker_id: client.broker_id,
          ghl_contact_id: `contact_${client.id}`, // Would be actual GHL contact ID
          tagged_rate: currentRate,
          target_rate: client.target_rate,
          monthly_savings: calculateMonthlySavings(client.target_rate, currentRate),
          tags_added: [`rate_alert_${currentRate}`],
          market_rate_date: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (alerts.length > 0) {
      console.log(`Found ${alerts.length} rate alerts`);

      // Store rate alert logs
      const { error: logError } = await supabase
        .from('ghl_target_rate_logs')
        .insert(alerts);

      if (logError) {
        console.error('Error storing rate alert logs:', logError);
      } else {
        console.log(`Stored ${alerts.length} rate alert logs`);
      }

      // Here you would typically trigger notifications
      // For now, just log the alerts
      alerts.forEach(alert => {
        console.log(`Rate alert: Client ${alert.client_id} target ${alert.target_rate}% reached with current rate ${alert.tagged_rate}%`);
      });
    } else {
      console.log('No rate alerts triggered');
    }

  } catch (error) {
    console.error('Error in checkRateAlerts:', error);
  }
}

function calculateMonthlySavings(targetRate: number, currentRate: number, loanAmount: number = 300000): number {
  // Simple monthly payment calculation for demonstration
  const monthlyRate = currentRate / 100 / 12;
  const numPayments = 30 * 12;
  
  const targetMonthlyRate = targetRate / 100 / 12;
  
  const currentPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
    
  const targetPayment = loanAmount * (targetMonthlyRate * Math.pow(1 + targetMonthlyRate, numPayments)) / 
    (Math.pow(1 + targetMonthlyRate, numPayments) - 1);
  
  return Math.round((targetPayment - currentPayment) * 100) / 100;
}