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
    const { clientId, userId, callType = 'both' }: CallRequest = await req.json()
    
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
            'Authorization': BLAND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: profile.broker_phone_number,
            task: `You are calling ${profile.full_name || 'a mortgage broker'}. 
                   This is an urgent opportunity alert. 
                   
                   Their client ${client.first_name} ${client.last_name} has just hit their target rate. 
                   
                   Details:
                   - Loan type: ${client.loan_type || '30-year fixed'}
                   - Current market rate: ${currentRate}%
                   - Client's target rate: ${client.target_rate}%
                   - Potential monthly savings: $${monthlySavings}
                   - Annual savings: $${monthlySavings * 12}
                   
                   Tell them their automated system will call the client in 2 minutes, 
                   or they can reach out personally first if they prefer.
                   
                   Keep this call brief and professional - under 1 minute. 
                   The goal is to alert them to the opportunity so they can act quickly.`,
            voice: 'maya',
            max_duration: 1.5,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/call-webhook`,
            metadata: {
              call_type: 'broker',
              user_id: userId,
              client_id: clientId
            }
          })
        })

        if (!brokerCallResponse.ok) {
          throw new Error(`Bland API error: ${brokerCallResponse.status}`)
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
          cost_cents: 9 // Estimated ~$0.09 per minute
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
            'Authorization': BLAND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: client.phone,
            task: `You are calling ${client.first_name} ${client.last_name} on behalf of their mortgage advisor ${profile.full_name || profile.company || 'from their mortgage office'}.
                   
                   This is great news! You're calling to inform them that ${client.loan_type || '30-year fixed'} mortgage rates 
                   have dropped to ${currentRate}%, which is at or below their target rate of ${client.target_rate}%.
                   
                   By refinancing now, they could save approximately $${monthlySavings} per month, 
                   which is $${monthlySavings * 12} per year.
                   
                   Ask if they would like their mortgage advisor to reach out to discuss their refinancing options 
                   and get the process started.
                   
                   Be friendly, professional, and enthusiastic about this opportunity. 
                   Keep the call under 2 minutes. If they're interested, let them know their advisor will 
                   contact them within 24 hours to discuss next steps.`,
            voice: 'maya',
            max_duration: 3,
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/call-webhook`,
            metadata: {
              call_type: 'client',
              user_id: userId,
              client_id: clientId
            }
          })
        })

        if (!clientCallResponse.ok) {
          throw new Error(`Bland API error: ${clientCallResponse.status}`)
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
          cost_cents: 18 // Estimated ~$0.18 for 2 minutes
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