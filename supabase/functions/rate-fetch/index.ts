// File: supabase/functions/rate-fetch/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// Updated interface to hold all the new data
interface MortgageRate {
  rate_date: string;
  rate_type: string;
  rate_value: number;
  term_years: number;
  loan_type: string;
  created_at: string;
  change_1_day?: number;
  change_1_week?: number;
  change_1_month?: number;
  change_1_year?: number;
  range_52_week_low?: number;
  range_52_week_high?: number;
}

// Helper to parse rate values like "+0.03%" or "6.13%" into numbers
function parseRateValue(text: string | null): number | undefined {
  if (!text) return undefined;
  const match = text.match(/(-?\d+\.\d+)/);
  if (match) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? undefined : value;
  }
  return undefined;
}

// ... (Your existing parseLastUpdated function can remain the same) ...
function parseLastUpdated(lastUpdatedText: string): string {
    // ...
}

async function fetchMNDRates(): Promise<MortgageRate[]> {
  const rates: MortgageRate[] = [];
  
  try {
    const url = 'https://www.mortgagenewsdaily.com/mortgage-rates/mnd';
    console.log('Fetching rates from MND rate index...');
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`MND fetch error: ${response.status}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    let rateDate = new Date().toISOString().split('T')[0];
    const lastUpdatedElement = doc.querySelector('body');
    if (lastUpdatedElement) {
      const lastUpdatedMatch = lastUpdatedElement.textContent.match(/Last Updated:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if (lastUpdatedMatch) {
        rateDate = parseLastUpdated(lastUpdatedMatch[0]);
      }
    }
    console.log('Using rate date:', rateDate);

    const rateMappings = [
      { label: '30 Yr. Fixed', termYears: 30, loanType: 'conventional' },
      { label: '15 Yr. Fixed', termYears: 15, loanType: 'conventional' },
      { label: '30 Yr. FHA', termYears: 30, loanType: 'fha' },
      { label: '30 Yr. VA', termYears: 30, loanType: 'va' },
      { label: '30 Yr. Jumbo', termYears: 30, loanType: 'jumbo' },
      // ARM is now scraped but not mapped to a standard type for now
      // { label: '7/6 SOFR ARM', termYears: 30, loanType: 'arm' }
    ];

    const tableRows = doc.querySelectorAll('.rate-chart-table-container table tr');
    
    for (const row of tableRows) {
      const cells = row.querySelectorAll('th, td');
      if (cells.length < 8) continue; // Ensure the row has enough columns

      const labelText = cells[0]?.textContent.trim();
      const mapping = rateMappings.find(m => m.label === labelText);

      if (mapping) {
        const rate: Partial<MortgageRate> = {
          rate_date: rateDate,
          rate_type: 'fixed', // Assuming fixed, can be adjusted if needed
          term_years: mapping.termYears,
          loan_type: mapping.loanType,
          created_at: new Date().toISOString(),
          rate_value: parseRateValue(cells[1]?.textContent),
          change_1_day: parseRateValue(cells[2]?.textContent),
          change_1_week: parseRateValue(cells[3]?.textContent),
          change_1_month: parseRateValue(cells[4]?.textContent),
          change_1_year: parseRateValue(cells[5]?.textContent),
          range_52_week_low: parseRateValue(cells[6]?.textContent),
          range_52_week_high: parseRateValue(cells[7]?.textContent),
        };

        if (rate.rate_value !== undefined) {
          rates.push(rate as MortgageRate);
          console.log(`✓ Found ${mapping.label}: ${rate.rate_value}%`);
        }
      }
    }
    
    console.log(`Successfully extracted ${rates.length} rates from MND`);
    return rates;
    
  } catch (error) {
    console.error('Error fetching MND rates:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const allRates = await fetchMNDRates();
    
    if (allRates.length === 0) {
      throw new Error('Failed to fetch any rates from MND');
    }

    const { error: upsertError } = await supabase
      .from('rate_history')
      .upsert(allRates, { onConflict: 'rate_date,term_years,loan_type' });
    
    if (upsertError) throw upsertError;

    console.log(`Successfully stored ${allRates.length} rates in database`);

    return new Response(JSON.stringify({
      success: true,
      rates_fetched: allRates.length,
      data: allRates
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process rates', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});