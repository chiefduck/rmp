import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

interface MortgageRate {
  rate_date: string;
  rate_type: string;
  rate_value: number;
  term_years: number;
  loan_type: string;
  created_at: string;
}

function parseLastUpdated(lastUpdatedText: string): string {
  if (!lastUpdatedText) return new Date().toISOString().split('T')[0];
  
  // Extract date from "Last Updated: 8/19/25" format
  const dateMatch = lastUpdatedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dateMatch) {
    let [, month, day, year] = dateMatch;
    
    // Handle 2-digit years (25 = 2025)
    if (year.length === 2) {
      year = year < 50 ? `20${year}` : `19${year}`;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
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
    
    // Find the "Last Updated" date first
    const lastUpdatedElement = doc.querySelector('body');
    let rateDate = new Date().toISOString().split('T')[0];
    
    if (lastUpdatedElement) {
      const bodyText = lastUpdatedElement.textContent || '';
      const lastUpdatedMatch = bodyText.match(/Last Updated:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if (lastUpdatedMatch) {
        rateDate = parseLastUpdated(lastUpdatedMatch[0]);
        console.log('Found rate date:', rateDate);
      }
    }
    
    // Define the rate mappings we want to extract
    const rateTypes = [
      { label: '30 Yr. Fixed', termYears: 30, loanType: 'conventional' },
      { label: '15 Yr. Fixed', termYears: 15, loanType: 'conventional' },
      { label: '30 Yr. FHA', termYears: 30, loanType: 'fha' },
      { label: '30 Yr. VA', termYears: 30, loanType: 'va' },
      { label: '30 Yr. Jumbo', termYears: 30, loanType: 'jumbo' },
      { label: '7/6 SOFR ARM', termYears: 30, loanType: 'arm' }
    ];
    
    // Look for the main rates table
    const tableRows = doc.querySelectorAll('tr');
    
    for (const rateType of rateTypes) {
      let foundRate = false;
      
      // Search through table rows for our rate type
      for (const row of tableRows) {
        const rowText = row.textContent || '';
        
        if (rowText.includes(rateType.label)) {
          // Look for percentage in this row
          const rateMatch = rowText.match(/(\d+\.\d+)%/);
          
          if (rateMatch) {
            const rateValue = parseFloat(rateMatch[1]);
            
            if (rateValue > 0 && rateValue < 20) { // Sanity check
              rates.push({
                rate_date: rateDate,
                rate_type: 'fixed',
                rate_value: rateValue,
                term_years: rateType.termYears,
                loan_type: rateType.loanType,
                created_at: new Date().toISOString(),
              });
              
              console.log(`✓ Found ${rateType.label}: ${rateValue}%`);
              foundRate = true;
              break;
            }
          }
        }
      }
      
      if (!foundRate) {
        console.log(`✗ Could not find rate for ${rateType.label}`);
      }
    }
    
    // Fallback: Try to extract from table cells more aggressively
    if (rates.length === 0) {
      console.log('No rates found in table rows, trying cell-by-cell approach...');
      
      const cells = doc.querySelectorAll('td, th');
      const cellTexts: string[] = [];
      
      for (const cell of cells) {
        const text = cell.textContent?.trim() || '';
        if (text) cellTexts.push(text);
      }
      
      console.log('Found table cells:', cellTexts.slice(0, 20)); // Log first 20 cells for debugging
      
      // Look for patterns like "30 Yr. Fixed" followed by "6.60%"
      for (let i = 0; i < cellTexts.length - 1; i++) {
        const currentCell = cellTexts[i];
        const nextCell = cellTexts[i + 1];
        
        for (const rateType of rateTypes) {
          if (currentCell.includes(rateType.label)) {
            const rateMatch = nextCell.match(/(\d+\.\d+)%/);
            if (rateMatch) {
              const rateValue = parseFloat(rateMatch[1]);
              if (rateValue > 0 && rateValue < 20) {
                rates.push({
                  rate_date: rateDate,
                  rate_type: 'fixed',
                  rate_value: rateValue,
                  term_years: rateType.termYears,
                  loan_type: rateType.loanType,
                  created_at: new Date().toISOString(),
                });
                console.log(`✓ Found ${rateType.label}: ${rateValue}% (cell method)`);
              }
            }
          }
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

    // Fetch all rates from MND
    const allRates = await fetchMNDRates();
    
    if (allRates.length === 0) {
      throw new Error('Failed to fetch any rates from MND');
    }

    // Store all rates in database
    const { error: upsertError } = await supabase
      .from('rate_history')
      .upsert(allRates, { onConflict: 'rate_date,term_years,loan_type' });
    
    if (upsertError) throw upsertError;

    console.log(`Successfully stored ${allRates.length} rates in database`);

    // Return summary for API response
    const responseData = allRates.map(rate => ({
      rate_value: rate.rate_value,
      rate_date: rate.rate_date,
      term_years: rate.term_years,
      loan_type: rate.loan_type,
      created_at: rate.created_at,
    }));

    return new Response(JSON.stringify({
      success: true,
      rates_fetched: allRates.length,
      rate_date: allRates[0]?.rate_date,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch rates', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});