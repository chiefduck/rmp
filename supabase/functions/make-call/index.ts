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

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (clientError) throw clientError

    // Get current market rate for this loan type
    const { data: rateData, error: rateError } = await supabase
      .from('rate_history')
      .select('rate_value')
      .eq('term_years', client.loan_term || 30)
      .eq('loan_type', client.loan_type || 'conventional')
      .order('rate_date', { ascending: false })
      .limit(1)
      .single()
    
    const currentRate = rateData?.rate_value || 6.5

    // Calculate savings
    const calculateMonthlySavings = (currentRate: number, newRate: number, loanAmount: number): number => {
      if (!loanAmount || !currentRate || !newRate) return 0
      
      const monthlyRateCurrent = currentRate / 100 / 12
      const monthlyRateNew = newRate / 100 / 12
      const months = 360 // 30 year loan
      
      const currentPayment = loanAmount * 
        (monthlyRateCurrent * Math.pow(1 + monthlyRateCurrent, months)) / 
        (Math.pow(1 + monthlyRateCurrent, months) - 1)
      
      const newPayment = loanAmount * 
        (monthlyRateNew * Math.pow(1 + monthlyRateNew, months)) / 
        (Math.pow(1 + monthlyRateNew, months) - 1)
      
      return Math.round(currentPayment - newPayment)
    }

    const monthlySavings = calculateMonthlySavings(
      client.current_rate || currentRate + 0.5,
      currentRate,
      client.loan_amount || 300000
    )

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
            
            // 🎯 CONVERSATIONAL AI SETTINGS - IMPROVED THRESHOLD
            wait_for_greeting: true,
            interruption_threshold: 400, // ⬆️ Increased from 300 to 400 (less sensitive to background noise)
            temperature: 0.7,
            language: 'eng',
            background_track: 'none',
            
            // 📞 BROKER SCRIPT - PROFESSIONAL & TO-THE-POINT
            task: `You are calling ${profile.full_name || 'a mortgage broker'} with a time-sensitive client opportunity.

RULES:
- Wait for them to answer and greet you first
- Be brief and professional - they're busy
- Get straight to the point
- Answer questions if asked, but keep it concise

SCRIPT:
When they greet you, say:

"Hi, this is your rate alert system. Quick update - ${client.first_name} ${client.last_name} just hit their target rate."

Pause briefly, then deliver the key info:

"${client.loan_type || 'Conventional 30-year'} at ${currentRate}%, target was ${client.target_rate}%. Monthly savings: $${monthlySavings}."

Then ask:

"Your system will call ${client.first_name} in 2 minutes. Want to reach out personally instead?"

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
          console.error('Bland API error:', errorText)
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

        // Wait 2 minutes before calling client
        if (callType === 'both') {
          await new Promise(resolve => setTimeout(resolve, 120000))
        }

      } catch (brokerError) {
        console.error('Error calling broker:', brokerError)
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
            
            // 🎯 CONVERSATIONAL AI SETTINGS - IMPROVED THRESHOLD
            wait_for_greeting: true,
            interruption_threshold: 400, // ⬆️ Increased from 300 to 400 (less sensitive to background noise)
            temperature: 0.7,
            language: 'eng',
            background_track: 'none',
            
            // 💬 CLIENT SCRIPT - WARM, NATURAL & CONVERSATIONAL
            task: `You are a friendly assistant calling ${client.first_name} ${client.last_name} on behalf of their mortgage advisor ${profile.full_name || profile.company || 'their mortgage office'}.

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

"Hey ${client.first_name}! This is ${profile.full_name || 'your mortgage advisor'}'s office calling. I've actually got some really good news for you - do you have just a quick minute?"

[Wait for response. If YES, continue. If NO/BUSY, say: "No problem! What's a better time to call you back?"]

THE GOOD NEWS:
"So here's the exciting part - mortgage rates just dropped to ${currentRate}%, which is exactly what you've been waiting for!"

[Pause - let them react]

THE SAVINGS:
"By refinancing now, you'd save about $${monthlySavings} every month. That's over $${monthlySavings * 12} a year back in your pocket!"

[Pause - let them respond]

THE ASK:
"Would you like ${profile.full_name || 'your advisor'} to give you a call in the next day or two to go over your options and get the ball rolling?"

[Wait for response]

HANDLING RESPONSES:
- If INTERESTED: "Awesome! ${profile.full_name || 'They'}'ll reach out within 24 hours. You're going to love these savings!"
- If MAYBE/UNSURE: "Totally understand! Would you like some time to think about it? We can always call back."
- If NOT INTERESTED: "No worries at all! If anything changes and you want to look at rates, just let us know. Have a great day!"
- If QUESTIONS: Answer naturally and conversationally

TONE EXAMPLES:
❌ DON'T SAY: "I am calling to inform you about mortgage rate opportunities."
✅ DO SAY: "Hey! Got some really good news about your mortgage rates!"

❌ DON'T SAY: "This represents a monthly savings of..."
✅ DO SAY: "You'd save about [amount] every month - pretty nice, right?"

Remember: You're having a CONVERSATION with a real person. Be warm, natural, and genuinely helpful. Let them guide the conversation. Aim for 2-3 minutes, but let it flow naturally!`,
            
            voice: 'maya',
            max_duration: 5,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
            metadata: {
              call_type: 'client',
              user_id: userId,
              client_id: clientId
            }
          })
        })

        if (!clientCallResponse.ok) {
          const errorText = await clientCallResponse.text()
          console.error('Bland API error:', errorText)
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

        results.success = true

      } catch (clientError) {
        console.error('Error calling client:', clientError)
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
              : 'No calls were made'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Make-call function error:', error)
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