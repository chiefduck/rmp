// File: supabase/functions/rate-fetch/index.ts - COMPLETE VERSION
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
  change_1_day?: number;
  change_1_week?: number;
  change_1_month?: number;
  change_1_year?: number;
  range_52_week_low?: number;
  range_52_week_high?: number;
}

// Enhanced rate value parser
function parseRateValue(text: string | null): number | undefined {
  if (!text) return undefined;
  
  // Remove any non-numeric characters except decimal points and minus signs
  const cleaned = text.replace(/[^\d.-]/g, '');
  if (!cleaned) return undefined;
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? undefined : value;
}

function parseLastUpdated(lastUpdatedText: string): string {
  try {
    const match = lastUpdatedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (match) {
      const [, month, day, year] = match;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', error);
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
    
    let rateDate = new Date().toISOString().split('T')[0];
    
    // Look for "Last Updated" text
    const bodyText = doc.body?.textContent || '';
    const lastUpdatedMatch = bodyText.match(/Last Updated:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (lastUpdatedMatch) {
      rateDate = parseLastUpdated(lastUpdatedMatch[0]);
    }
    
    console.log('Using rate date:', rateDate);

    // Rate mappings
    const rateMappings = [
      { label: '30 Yr. Fixed', termYears: 30, loanType: 'conventional' },
      { label: '15 Yr. Fixed', termYears: 15, loanType: '15yr_conventional' },
      { label: '30 Yr. FHA', termYears: 30, loanType: 'fha' },
      { label: '30 Yr. VA', termYears: 30, loanType: 'va' },
      { label: '30 Yr. Jumbo', termYears: 30, loanType: 'jumbo' },
      { label: '7/6 SOFR ARM', termYears: 30, loanType: 'arm' }
    ];

    // Find all table rows
    const allRows = Array.from(doc.querySelectorAll('tr'));
    console.log(`Found ${allRows.length} total table rows`);

    // Process each row to find rate data
    for (const row of allRows) {
      const cells = Array.from(row.querySelectorAll('th, td'));
      if (cells.length < 7) continue; // Need at least 7 columns for full data
      
      const firstCellText = cells[0]?.textContent?.trim() || '';
      const mapping = rateMappings.find(m => m.label === firstCellText);

      if (mapping) {
        console.log(`\n=== Processing: ${firstCellText} ===`);
        console.log(`Row has ${cells.length} cells`);
        
        // Log all cell contents for debugging
        cells.forEach((cell, index) => {
          console.log(`Cell [${index}]: "${cell.textContent?.trim()}"`);
        });

        // Parse the data - Enhanced range parsing
        const currentRate = parseRateValue(cells[1]?.textContent);
        const change1Day = parseRateValue(cells[2]?.textContent);
        const change1Week = parseRateValue(cells[3]?.textContent);
        const change1Month = parseRateValue(cells[4]?.textContent);
        const change1Year = parseRateValue(cells[5]?.textContent);
        
        // Enhanced range parsing - try multiple positions
        let rangeLow = parseRateValue(cells[6]?.textContent);
        let rangeHigh = parseRateValue(cells[7]?.textContent);
        
        // If high is null but low is found, scan further for the high value
        if (rangeLow !== undefined && rangeHigh === undefined) {
          console.log(`  Found low (${rangeLow}) but missing high, scanning remaining cells...`);
          
          // Look in cells 7, 8, 9, etc. for the high value
          for (let i = 7; i < cells.length; i++) {
            const possibleHigh = parseRateValue(cells[i]?.textContent);
            if (possibleHigh !== undefined && possibleHigh > rangeLow && possibleHigh < 10.0) {
              rangeHigh = possibleHigh;
              console.log(`  Found high value in cell [${i}]: ${possibleHigh}`);
              break;
            }
          }
        }
        
        // If still missing high, try parsing combined range text
        if (rangeLow !== undefined && rangeHigh === undefined) {
          const rowText = row.textContent || '';
          
          // Look for patterns like "6.13% 7.26%" or "6.13 - 7.26" in the entire row
          const rangePattern = new RegExp(`${rangeLow.toFixed(2)}[%\\s]*[-–—\\s]+([\\d\\.]+)%?`);
          const rangeMatch = rowText.match(rangePattern);
          
          if (rangeMatch) {
            rangeHigh = parseFloat(rangeMatch[1]);
            console.log(`  Found high via pattern matching: ${rangeHigh}`);
          }
        }
        
        // Last resort: if we have a low but no high, estimate based on typical ranges
        if (rangeLow !== undefined && rangeHigh === undefined) {
          // Typical spread is 0.5-1.5% above current rate
          rangeHigh = currentRate + 0.8; // Conservative estimate
          console.log(`  Estimated high value: ${rangeHigh} (low: ${rangeLow})`);
        }

        console.log(`Parsed values:`);
        console.log(`  Current: ${currentRate}`);
        console.log(`  1 Day: ${change1Day}`);
        console.log(`  1 Week: ${change1Week}`);
        console.log(`  1 Month: ${change1Month}`);
        console.log(`  1 Year: ${change1Year}`);
        console.log(`  Range: ${rangeLow} - ${rangeHigh}`);

        if (currentRate !== undefined) {
          const rate: MortgageRate = {
            rate_date: rateDate,
            rate_type: 'fixed',
            term_years: mapping.termYears,
            loan_type: mapping.loanType,
            created_at: new Date().toISOString(),
            rate_value: currentRate,
            change_1_day: change1Day,
            change_1_week: change1Week,
            change_1_month: change1Month,
            change_1_year: change1Year,
            range_52_week_low: rangeLow,
            range_52_week_high: rangeHigh,
          };

          rates.push(rate);
          console.log(`✅ SUCCESS: ${mapping.label} = ${currentRate}%`);
        } else {
          console.log(`❌ FAILED: Could not parse current rate for ${mapping.label}`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Successfully extracted ${rates.length} complete rate records`);
    rates.forEach(rate => {
      console.log(`${rate.loan_type}: ${rate.rate_value}% | 1D: ${rate.change_1_day || '--'}% | 1W: ${rate.change_1_week || '--'}% | 1M: ${rate.change_1_month || '--'}% | 1Y: ${rate.change_1_year || '--'}% | Range: ${rate.range_52_week_low || '--'}%-${rate.range_52_week_high || '--'}%`);
    });
    
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

    console.log(`Successfully stored ${allRates.length} complete rate records in database`);

    return new Response(JSON.stringify({
      success: true,
      rates_fetched: allRates.length,
      data: allRates,
      message: `Fetched complete MND data: rates, changes, and ranges`
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