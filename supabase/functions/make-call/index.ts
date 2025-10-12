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
            'authorization': BLAND_API_KEY, // Send API key exactly as stored
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: profile.broker_phone_number,
            
            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 300, // ⬆️ Much higher = less sensitive (default 100, max 500)
            temperature: 0.7,
            language: 'eng',
            background_track: 'none', // Reduce background noise pickup
            
            task: `You are an AI assistant calling ${profile.full_name || 'a mortgage broker'} with an urgent opportunity alert.

CRITICAL RULES:
1. When they answer, WAIT for them to say "hello" or greet you
2. Do NOT say goodbye unless they want to end the call
3. This is a CONVERSATION - listen and respond naturally
4. If they seem confused or don't respond, introduce yourself again

When they greet you, say:

"Hi! This is your automated rate alert system calling. I have great news about one of your clients - ${client.first_name} ${client.last_name} has just hit their target mortgage rate!"

Then explain:
- Loan type: ${client.loan_type || '30-year fixed'}
- Current market rate: ${currentRate}%
- Client's target rate: ${client.target_rate}%
- Monthly savings: ${monthlySavings}
- Annual savings: ${monthlySavings * 12}

Tell them: "Your automated system will call ${client.first_name} in 2 minutes to let them know. Would you prefer to reach out personally instead?"

Keep it professional and helpful. If they have questions, answer them. Don't rush off the call - this is important information for them!`,
            
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
          cost_cents: 0 // Will be updated by webhook
        })

        // Wait 2 minutes before calling client (gives broker time to see alert)
        if (callType === 'both') {
          await new Promise(resolve => setTimeout(resolve, 120000))
        }

      } catch (brokerError) {
        console.error('Error calling broker:', brokerError)
        results.error = `Broker call failed: ${brokerError.message}`
        // Continue to client call even if broker call fails
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
            'authorization': BLAND_API_KEY, // Send API key exactly as stored
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: client.phone,
            
            // 🎯 CONVERSATIONAL AI SETTINGS
            wait_for_greeting: true,
            interruption_threshold: 300, // ⬆️ Much higher = less sensitive (default 100, max 500)
            temperature: 0.7,
            language: 'eng',
            background_track: 'none', // Reduce background noise pickup
            
            task: `You are a friendly AI assistant calling ${client.first_name} ${client.last_name} on behalf of their mortgage advisor ${profile.full_name || profile.company || 'from their mortgage office'}.

CRITICAL: This is a natural, two-way conversation. You MUST listen to what they say and respond accordingly. Let them speak, ask questions, and interrupt you. This is NOT a monologue!

When they answer the phone, wait for them to say "hello" or greet you, then say:

"Hi ${client.first_name}! This is the automated assistant from ${profile.full_name || 'your mortgage advisor'}'s office. I'm calling with some really great news about mortgage rates - do you have a quick minute?"

Wait for their response. If they say yes, continue naturally:

"Excellent! So here's the exciting part - ${client.loan_type || '30-year fixed'} mortgage rates have dropped to ${currentRate}%, which is right at your target rate of ${client.target_rate}%!"

Pause and let them respond. Then share the savings:

"By refinancing now, you could save approximately $${monthlySavings} per month. That's $${monthlySavings * 12} every year back in your pocket!"

Then ask: "Would you like ${profile.full_name || 'your mortgage advisor'} to reach out to discuss your refinancing options and help you get started?"

IMPORTANT RULES:
- Listen actively and respond to what they say
- If they ask questions, answer them naturally
- If they're busy, offer to call back later
- If they're interested, confirm their advisor will call within 24 hours
- If they're not interested, thank them politely and end the call
- Keep it conversational and warm, not scripted or robotic
- Aim for 2-3 minutes, but let the conversation flow naturally
- Let them interrupt you - it's a sign they're engaged!

Remember: You're having a CONVERSATION, not delivering a speech!`,
            
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
          cost_cents: 0 // Will be updated by webhook
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