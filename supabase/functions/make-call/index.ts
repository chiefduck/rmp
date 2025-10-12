import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // 🎯 DYNAMIC VARIABLES FOR SCRIPTS
    const vars = {
      // Client info
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: `${client.first_name} ${client.last_name}`,

      // Broker info
      broker_name: profile.full_name || 'your mortgage advisor',
      company: profile.company || profile.company_name || 'their mortgage office',

      // Loan details
      loan_type: mortgage.loan_type || 'conventional',
      loan_type_full: `${mortgage.loan_type || 'conventional'} ${mortgage.term_years || 30}-year`,
      loan_amount: mortgage.loan_amount?.toLocaleString() || '300,000',
      term_years: mortgage.term_years || 30,
      lender: mortgage.lender || 'your current lender',

      // Rates
      current_rate: mortgage.current_rate?.toFixed(3) || 'N/A',
      target_rate: mortgage.target_rate?.toFixed(3) || 'N/A',
      market_rate: currentMarketRate.toFixed(3),

      // Savings
      monthly_savings: monthlySavings.toLocaleString(),
      annual_savings: annualSavings.toLocaleString(),
      lifetime_savings: (annualSavings * mortgage.term_years).toLocaleString()
    }

    console.log('✅ Dynamic variables prepared:', vars)

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

            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 400,
            temperature: 0.7,
            language: 'eng',
            background_track: 'none',

            // 📞 BROKER SCRIPT - PROFESSIONAL & TO-THE-POINT (with dynamic variables)
            task: `You are calling ${vars.broker_name} with a time-sensitive client opportunity.

RULES:
- Wait for them to answer and greet you first
- Be brief and professional - they're busy
- Get straight to the point
- Answer questions if asked, but keep it concise

SCRIPT:
When they greet you, say:

"Hi, this is your rate alert system. Quick update - ${vars.first_name} ${vars.last_name} just hit their target rate."

Pause briefly, then deliver the key info:

"${vars.loan_type_full} dropped to ${vars.market_rate}%, target was ${vars.target_rate}%. Monthly savings: $${vars.monthly_savings}."

Then ask:

"Your system will call ${vars.first_name} in 2 minutes. Want to reach out personally instead?"

Wait for their response:
- If YES: "Perfect, I'll cancel the automated call. Good luck!"
- If NO: "Got it, the call will go out in 2 minutes."
- If they have questions: Answer briefly and professionally

Keep it under 90 seconds. They're busy, so respect their time.`,

            voice: 'maya',
            max_duration: 3,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
            metadata: {
              call_type: 'broker',
              user_id: userId,
              client_id: clientId
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

            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 400,
            temperature: 0.7,
            language: 'eng',
            background_track: 'none',

            // 💬 CLIENT SCRIPT - WARM, NATURAL & CONVERSATIONAL (with dynamic variables)
            task: `You are a friendly assistant calling ${vars.first_name} ${vars.last_name} on behalf of ${vars.broker_name} at ${vars.company}.

PERSONALITY:
- Warm and conversational (like a helpful friend)
- Natural pauses and questions
- Listen actively and respond to what they say
- Never robotic or scripted-sounding
- Genuinely excited about helping them save money

RULES:
- Wait for them to say "hello" before speaking
- Let them interrupt you - it means they're engaged!
- If they're busy, offer to call back later
- If they ask questions, answer naturally
- Keep the conversation flowing - this isn't a monologue!

OPENING:
When they answer, wait for their greeting, then say:

"Hey ${vars.first_name}! This is ${vars.broker_name}'s office calling. I've actually got some really good news for you - do you have just a quick minute?"

[Wait for response. If YES, continue. If NO/BUSY, say: "No problem! What's a better time to call you back?"]

THE GOOD NEWS:
"So here's the exciting part - ${vars.loan_type} mortgage rates just dropped to ${vars.market_rate}%, which is exactly what you've been waiting for!"

[Pause - let them react]

THE SAVINGS:
"By refinancing now, you'd save about $${vars.monthly_savings} every month. That's over $${vars.annual_savings} a year back in your pocket!"

[Pause - let them respond]

THE ASK:
"Would you like ${vars.broker_name} to give you a call in the next day or two to go over your options and get the ball rolling?"

[Wait for response]

HANDLING RESPONSES:
- If INTERESTED: "Awesome! ${vars.broker_name} will reach out within 24 hours. You're going to love these savings!"
- If MAYBE/UNSURE: "Totally understand! Would you like some time to think about it? We can always call back."
- If NOT INTERESTED: "No worries at all! If anything changes and you want to look at rates, just let us know. Have a great day!"
- If QUESTIONS: Answer naturally and conversationally

ADDITIONAL CONTEXT (use if they ask):
- Current lender: ${vars.lender}
- Your loan is with ${vars.lender}
- Your ${vars.loan_type_full} loan
- Over the life of the loan, that's about $${vars.lifetime_savings} in total savings

TONE EXAMPLES:
❌ DON'T SAY: "I am calling to inform you about mortgage rate opportunities."
✅ DO SAY: "Hey! Got some really good news about your mortgage rates!"

❌ DON'T SAY: "This represents a monthly savings of..."
✅ DO SAY: "You'd save about $${vars.monthly_savings} every month - pretty nice, right?"

Remember: You're having a CONVERSATION with a real person. Be warm, natural, and genuinely helpful. Let them guide the conversation. Aim for 2-3 minutes, but let it flow naturally!`,

            voice: 'maya',
            max_duration: 5,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
            metadata: {
              call_type: 'client',
              user_id: userId,
              client_id: clientId,
              mortgage_id: mortgage.id
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
          ? 'Called broker and client successfully'
          : results.brokerCallId
            ? 'Called broker successfully'
            : results.clientCallId
              ? 'Called client successfully'
              : 'No calls were made',
        // Return calculated values for debugging
        debug: {
          market_rate: currentMarketRate,
          monthly_savings: monthlySavings,
          annual_savings: annualSavings
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