import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🎯 BLAND PATHWAY IDS
const BROKER_PATHWAY_ID = '10a3e2ba-d1f5-49e1-9b1e-a15d1d8a597e'
const CLIENT_PATHWAY_ID = '9d2c24e4-6f3d-4648-9ceb-c47c30238667'

interface CallRequest {
  clientId: string
  userId: string
  callType?: 'both' | 'client-only' | 'broker-only'
}

// 💰 ACCURATE MORTGAGE CALCULATION
const calculateMonthlySavings = (
  currentRate: number,
  newRate: number,
  loanAmount: number,
  termYears: number = 30
): number => {
  if (!loanAmount || !currentRate || !newRate) {
    console.error('❌ Missing calculation data:', { currentRate, newRate, loanAmount })
    return 0
  }

  // Validate inputs
  if (currentRate <= 0 || newRate <= 0 || loanAmount <= 0) {
    console.error('❌ Invalid calculation inputs:', { currentRate, newRate, loanAmount })
    return 0
  }

  const monthlyRateCurrent = currentRate / 100 / 12
  const monthlyRateNew = newRate / 100 / 12
  const months = termYears * 12

  const currentPayment = loanAmount *
    (monthlyRateCurrent * Math.pow(1 + monthlyRateCurrent, months)) /
    (Math.pow(1 + monthlyRateCurrent, months) - 1)

  const newPayment = loanAmount *
    (monthlyRateNew * Math.pow(1 + monthlyRateNew, months)) /
    (Math.pow(1 + monthlyRateNew, months) - 1)

  const savings = Math.round(currentPayment - newPayment)

  // 🚨 VALIDATION: Flag suspicious calculations
  if (savings < 0) {
    console.warn('⚠️ Negative savings calculated - new rate higher than current?', {
      currentRate,
      newRate,
      savings
    })
  }

  if (savings > loanAmount * 0.01) {
    console.warn('⚠️ Very high savings (>1% of loan amount) - verify rates:', {
      currentRate,
      newRate,
      loanAmount,
      savings
    })
  }

  console.log('✅ Calculated savings:', {
    currentRate,
    newRate,
    loanAmount,
    termYears,
    currentPayment: Math.round(currentPayment),
    newPayment: Math.round(newPayment),
    monthlySavings: savings,
    annualSavings: savings * 12
  })

  return savings
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { clientId, userId, callType = 'client-only' }: CallRequest = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const BLAND_API_KEY = Deno.env.get('BLAND_API_KEY')

    if (!BLAND_API_KEY) {
      throw new Error('BLAND_API_KEY not configured')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // 🎯 GET CLIENT WITH MORTGAGE DATA (JOIN)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        mortgages (
          id,
          current_rate,
          target_rate,
          loan_amount,
          term_years,
          loan_type,
          lender
        )
      `)
      .eq('id', clientId)
      .single()

    if (clientError) throw clientError

    // Extract mortgage data (single mortgage per client)
    const client = clientData as any
    const mortgage = client.mortgages?.[0] || client.mortgages

    if (!mortgage) {
      throw new Error(`No mortgage found for client ${client.first_name} ${client.last_name}`)
    }

    console.log('📊 Client data loaded:', {
      client: `${client.first_name} ${client.last_name}`,
      mortgage: {
        loan_type: mortgage.loan_type,
        term_years: mortgage.term_years,
        current_rate: mortgage.current_rate,
        target_rate: mortgage.target_rate,
        loan_amount: mortgage.loan_amount
      }
    })

    // 🎯 GET CURRENT MARKET RATE (REAL DATA, NO FALLBACK!)
    const { data: rateData, error: rateError } = await supabase
      .from('rate_history')
      .select('rate_value')
      .eq('term_years', mortgage.term_years || 30)
      .eq('loan_type', mortgage.loan_type || 'conventional')
      .order('rate_date', { ascending: false })
      .limit(1)
      .single()

    if (rateError || !rateData) {
      throw new Error(
        `No current market rate found for ${mortgage.loan_type} ${mortgage.term_years}-year loan. ` +
        `Please update rate_history table with current rates.`
      )
    }

    const currentMarketRate = rateData.rate_value

    console.log('📈 Market rate loaded:', {
      loan_type: mortgage.loan_type,
      term_years: mortgage.term_years,
      current_market_rate: currentMarketRate
    })

    // 🚨 VALIDATION: Check if target rate has been hit
    if (currentMarketRate > mortgage.target_rate) {
      console.warn('⚠️ Market rate not yet at target:', {
        market: currentMarketRate,
        target: mortgage.target_rate,
        difference: (currentMarketRate - mortgage.target_rate).toFixed(3)
      })
      // Could optionally throw error here to prevent premature calls
    }

    // 💰 CALCULATE SAVINGS (with validation)
    const monthlySavings = calculateMonthlySavings(
      mortgage.current_rate,
      currentMarketRate,
      mortgage.loan_amount,
      mortgage.term_years
    )

    if (monthlySavings <= 0) {
      throw new Error(
        `Invalid savings calculation: $${monthlySavings}. ` +
        `Current rate (${mortgage.current_rate}%) must be higher than market rate (${currentMarketRate}%).`
      )
    }

    const annualSavings = monthlySavings * 12

    // 🎯 DYNAMIC VARIABLES FOR PATHWAYS
    const pathwayVariables = {
      // Client info
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: `${client.first_name} ${client.last_name}`,

      // Broker info
      broker_name: profile.full_name || 'your mortgage advisor',
      company: profile.company || profile.company_name || 'their mortgage office',

      // Loan details
      loan_type: mortgage.loan_type || 'conventional',
      loan_type_full: `${(mortgage.loan_type || 'conventional').charAt(0).toUpperCase() + (mortgage.loan_type || 'conventional').slice(1)}`,
      loan_amount: mortgage.loan_amount?.toLocaleString() || '300,000',
      term_years: mortgage.term_years || 30,
      lender: mortgage.lender || 'your current lender',

      // Rates
      current_rate: mortgage.current_rate?.toFixed(2) || 'N/A',
      target_rate: mortgage.target_rate?.toFixed(2) || 'N/A',
      market_rate: currentMarketRate.toFixed(2),

      // Savings
      monthly_savings: monthlySavings.toLocaleString(),
      annual_savings: annualSavings.toLocaleString(),
      lifetime_savings: (annualSavings * mortgage.term_years).toLocaleString()
    }

    console.log('✅ Pathway variables prepared:', pathwayVariables)

    const results = {
      brokerCallId: null as string | null,
      clientCallId: null as string | null,
      success: false,
      error: null as string | null
    }

    // STEP 1: Call broker first (if enabled and requested)
    if (
      (callType === 'both' || callType === 'broker-only') &&
      profile.broker_calls_enabled &&
      profile.broker_phone_number
    ) {
      try {
        const brokerCallResponse = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: {
            'authorization': BLAND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: profile.broker_phone_number,

            // 🎯 USE PATHWAY INSTEAD OF TASK
            pathway_id: BROKER_PATHWAY_ID,

            // 🎯 PATHWAY VARIABLES (replaces old task script)
            request_data: pathwayVariables,

            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 400,
            voice: 'maya',
            language: 'eng',
            max_duration: 3,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
            
            // 📊 METADATA FOR TRACKING
            metadata: {
              call_type: 'broker',
              user_id: userId,
              client_id: clientId,
              pathway_id: BROKER_PATHWAY_ID
            }
          })
        })

        if (!brokerCallResponse.ok) {
          const errorText = await brokerCallResponse.text()
          console.error('❌ Bland API error:', errorText)
          throw new Error(`Bland API error: ${brokerCallResponse.status} - ${errorText}`)
        }

        const brokerCallData = await brokerCallResponse.json()
        results.brokerCallId = brokerCallData.call_id

        // Log broker call
        await supabase.from('call_logs').insert({
          user_id: userId,
          client_id: clientId,
          call_type: 'broker',
          bland_call_id: brokerCallData.call_id,
          phone_number: profile.broker_phone_number,
          call_status: 'initiated',
          cost_cents: 0
        })

        console.log('✅ Broker call initiated:', brokerCallData.call_id)

        // Wait 2 minutes before calling client
        if (callType === 'both') {
          console.log('⏳ Waiting 2 minutes before client call...')
          await new Promise(resolve => setTimeout(resolve, 120000))
        }

      } catch (brokerError) {
        console.error('❌ Error calling broker:', brokerError)
        results.error = `Broker call failed: ${brokerError.message}`
      }
    }

    // STEP 2: Call client (if enabled and requested)
    if (
      (callType === 'both' || callType === 'client-only') &&
      profile.auto_calling_enabled &&
      client.phone
    ) {
      try {
        const clientCallResponse = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: {
            'authorization': BLAND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: client.phone,

            // 🎯 USE PATHWAY INSTEAD OF TASK
            pathway_id: CLIENT_PATHWAY_ID,

            // 🎯 PATHWAY VARIABLES (replaces old task script)
            request_data: pathwayVariables,

            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 400,
            voice: 'maya',
            language: 'eng',
            max_duration: 5,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
            
            // 📊 METADATA FOR TRACKING
            metadata: {
              call_type: 'client',
              user_id: userId,
              client_id: clientId,
              mortgage_id: mortgage.id,
              pathway_id: CLIENT_PATHWAY_ID
            }
          })
        })

        if (!clientCallResponse.ok) {
          const errorText = await clientCallResponse.text()
          console.error('❌ Bland API error:', errorText)
          throw new Error(`Bland API error: ${clientCallResponse.status} - ${errorText}`)
        }

        const clientCallData = await clientCallResponse.json()
        results.clientCallId = clientCallData.call_id

        // Log client call
        await supabase.from('call_logs').insert({
          user_id: userId,
          client_id: clientId,
          call_type: 'client',
          bland_call_id: clientCallData.call_id,
          phone_number: client.phone,
          call_status: 'initiated',
          cost_cents: 0
        })

        // Update client record
        await supabase
          .from('clients')
          .update({
            last_called_at: new Date().toISOString(),
            total_calls_made: (client.total_calls_made || 0) + 1
          })
          .eq('id', clientId)

        console.log('✅ Client call initiated:', clientCallData.call_id)

        results.success = true

      } catch (clientError) {
        console.error('❌ Error calling client:', clientError)
        results.error = `Client call failed: ${clientError.message}`
      }
    }

    // Decrement calls remaining
    if (results.brokerCallId || results.clientCallId) {
      const callsMade = (results.brokerCallId ? 1 : 0) + (results.clientCallId ? 1 : 0)
      await supabase
        .from('profiles')
        .update({
          calls_remaining: Math.max(0, (profile.calls_remaining || 50) - callsMade)
        })
        .eq('id', userId)
    }

    return new Response(
      JSON.stringify({
        success: results.success || !!results.brokerCallId,
        brokerCallId: results.brokerCallId,
        clientCallId: results.clientCallId,
        error: results.error,
        message: results.brokerCallId && results.clientCallId
          ? 'Called broker and client successfully using pathways'
          : results.brokerCallId
            ? 'Called broker successfully using pathway'
            : results.clientCallId
              ? 'Called client successfully using pathway'
              : 'No calls were made',
        // Return calculated values for debugging
        debug: {
          market_rate: currentMarketRate,
          monthly_savings: monthlySavings,
          annual_savings: annualSavings,
          pathways_used: {
            broker: BROKER_PATHWAY_ID,
            client: CLIENT_PATHWAY_ID
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Make-call function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/* 
🎯 CHANGES MADE:
1. ✅ Added BROKER_PATHWAY_ID and CLIENT_PATHWAY_ID constants at top
2. ✅ Replaced 'task' field with 'pathway_id' in both Bland API calls
3. ✅ Renamed 'vars' to 'pathwayVariables' for clarity
4. ✅ Changed variables to 'request_data' (Bland's format for pathway variables)
5. ✅ Added pathway_id to metadata for tracking
6. ✅ Removed old task scripts - pathways handle all conversation logic
7. ✅ All dynamic variables still calculated and passed to pathways
8. ✅ All existing functionality preserved (calculations, validations, logging)

🎤 PATHWAYS IN USE:
- Broker: 10a3e2ba-d1f5-49e1-9b1e-a15d1d8a597e
- Client: 9d2c24e4-6f3d-4648-9ceb-c47c30238667

📊 VARIABLES PASSED TO PATHWAYS:
All these work in your pathway scripts using {{variable_name}}:
- {{first_name}}, {{last_name}}, {{full_name}}
- {{broker_name}}, {{company}}
- {{loan_type}}, {{loan_type_full}}, {{term_years}}
- {{current_rate}}, {{target_rate}}, {{market_rate}}
- {{monthly_savings}}, {{annual_savings}}, {{lifetime_savings}}
- {{loan_amount}}, {{lender}}
*/