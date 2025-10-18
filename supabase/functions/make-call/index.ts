import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🎯 BLAND PATHWAY IDS
const BROKER_BATCH_PATHWAY_ID = '10a3e2ba-d1f5-49e1-9b1e-a15d1d8a597e'
const CLIENT_PATHWAY_ID = '9d2c24e4-6f3d-4648-9ceb-c47c30238667'

interface BatchCallRequest {
  broker_id: string
  mortgage_id?: string
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

// 🎯 HELPER FUNCTION FOR INDIVIDUAL CLIENT CALLS
export async function makeClientCall(clientId: string, supabaseClient: any, blandApiKey: string) {
  try {
    console.log('📞 Making individual client call for:', clientId)

    // Get client with mortgage JOIN
    const { data: clientData, error: clientError } = await supabaseClient
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

    const client = clientData as any
    const mortgage = client.mortgages?.[0] || client.mortgages

    if (!mortgage) {
      throw new Error(`No mortgage found for client ${client.first_name} ${client.last_name}`)
    }

    // Get current market rate from rate_history
    const { data: rateData, error: rateError } = await supabaseClient
      .from('rate_history')
      .select('rate_value')
      .eq('term_years', mortgage.term_years || 30)
      .eq('loan_type', mortgage.loan_type || 'conventional')
      .order('rate_date', { ascending: false })
      .limit(1)
      .single()

    if (rateError || !rateData) {
      throw new Error(`No current market rate found for ${mortgage.loan_type} ${mortgage.term_years}-year loan`)
    }

    const currentMarketRate = rateData.rate_value

    // Calculate monthly savings
    const monthlySavings = calculateMonthlySavings(
      mortgage.current_rate,
      currentMarketRate,
      mortgage.loan_amount,
      mortgage.term_years
    )

    // Get broker profile for variables
    const { data: brokerProfile, error: brokerError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', client.user_id)
      .single()

    if (brokerError) throw brokerError

    const annualSavings = monthlySavings * 12

    // Build pathway variables
    const pathwayVariables = {
      // Client info
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: `${client.first_name} ${client.last_name}`,

      // Broker info
      broker_name: brokerProfile.full_name || 'your mortgage advisor',
      company: brokerProfile.company || brokerProfile.company_name || 'their mortgage office',

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

    // Make Bland call with CLIENT_PATHWAY_ID
    const clientCallResponse = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'authorization': blandApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: client.phone,
        pathway_id: CLIENT_PATHWAY_ID,
        request_data: pathwayVariables,
        wait_for_greeting: true,
        interruption_threshold: 400,
        voice: 'maya',
        language: 'eng',
        max_duration: 5,
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
        metadata: {
          call_type: 'client',
          user_id: client.user_id,
          client_id: clientId,
          mortgage_id: mortgage.id,
          pathway_id: CLIENT_PATHWAY_ID
        }
      })
    })

    if (!clientCallResponse.ok) {
      const errorText = await clientCallResponse.text()
      throw new Error(`Bland API error: ${clientCallResponse.status} - ${errorText}`)
    }

    const clientCallData = await clientCallResponse.json()

    // Log to call_logs
    await supabaseClient.from('call_logs').insert({
      user_id: client.user_id,
      client_id: clientId,
      call_type: 'client',
      bland_call_id: clientCallData.call_id,
      phone_number: client.phone,
      call_status: 'initiated',
      cost_cents: 0
    })

    // Update client.last_called_at
    await supabaseClient
      .from('clients')
      .update({
        last_called_at: new Date().toISOString(),
        total_calls_made: (client.total_calls_made || 0) + 1
      })
      .eq('id', clientId)

    console.log('✅ Individual client call initiated:', clientCallData.call_id)
    return { success: true, call_id: clientCallData.call_id }

  } catch (error) {
    console.error('❌ Error making individual client call:', error)
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('📥 Request received:', requestBody)

    // Handle both new batch format and legacy format
    let broker_id: string
    let mortgage_id: string | undefined

    if (requestBody.broker_id) {
      // New batch format
      broker_id = requestBody.broker_id
      mortgage_id = requestBody.mortgage_id
    } else if (requestBody.clientId && requestBody.userId) {
      // Legacy format - derive broker from user
      broker_id = requestBody.userId
      // Could also derive from mortgage if needed
    } else {
      throw new Error('Invalid request format. Expected broker_id or legacy clientId/userId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const BLAND_API_KEY = Deno.env.get('BLAND_API_KEY')
    if (!BLAND_API_KEY) {
      throw new Error('BLAND_API_KEY not configured')
    }

    // Get broker_id (from request OR derive from mortgage via get_broker_from_mortgage RPC)
    if (mortgage_id && !broker_id) {
      const { data: mortgageBroker, error: mortgageError } = await supabase
        .rpc('get_broker_from_mortgage', { mortgage_id })

      if (mortgageError) throw mortgageError
      broker_id = mortgageBroker
    }

    if (!broker_id) {
      throw new Error('Could not determine broker_id')
    }

    console.log('🏢 Processing broker notification for:', broker_id)

    // SAFETY CHECK: Query broker_notifications WHERE broker_id = X AND notification_date = today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingNotification, error: notificationCheckError } = await supabase
      .from('broker_notifications')
      .select('*')
      .eq('broker_id', broker_id)
      .eq('notification_date', today)
      .single()

    if (existingNotification) {
      console.log('⚠️ Broker already notified today:', existingNotification.id)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Already notified today',
          notification_id: existingNotification.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Query broker_rate_alerts view WHERE broker_id = X
    const { data: rateAlerts, error: alertsError } = await supabase
      .from('broker_rate_alerts')
      .select('*')
      .eq('broker_id', broker_id)

    if (alertsError) throw alertsError

    if (!rateAlerts || rateAlerts.length === 0) {
      console.log('📊 No clients hitting target rates for broker:', broker_id)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No clients hitting target'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`🎯 Found ${rateAlerts.length} clients hitting target rates`)

    // Get broker profile
    const { data: brokerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', broker_id)
      .single()

    if (profileError) throw profileError

    if (!brokerProfile.broker_calls_enabled || !brokerProfile.broker_phone_number) {
      console.log('📵 Broker calls not enabled or no phone number')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Broker calls not enabled'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Build client summary
    const clientCount = rateAlerts.length
    let clientSummary: string
    let clientNames: string[] = []

    if (clientCount === 1) {
      const client = rateAlerts[0]
      clientNames = [`${client.first_name} ${client.last_name}`]
      const savings = calculateMonthlySavings(
        client.current_rate,
        client.target_rate,
        client.loan_amount,
        client.term_years
      )
      clientSummary = `Your client ${client.first_name} ${client.last_name} hit their target rate of ${client.target_rate}%. They could save $${savings.toLocaleString()} monthly.`
    } else if (clientCount <= 3) {
      clientNames = rateAlerts.map(c => `${c.first_name} ${c.last_name}`)
      clientSummary = `Your clients ${clientNames.join(', ')} all hit their target rates.`
    } else {
      clientNames = rateAlerts.map(c => `${c.first_name} ${c.last_name}`)
      clientSummary = `You have ${clientCount} clients with rates at target levels.`
    }

    // Prepare client_details JSON array
    const client_details = rateAlerts.map(client => ({
      client_id: client.client_id,
      mortgage_id: client.mortgage_id,
      name: `${client.first_name} ${client.last_name}`,
      phone: client.phone,
      email: client.email,
      current_rate: client.current_rate,
      target_rate: client.target_rate,
      loan_amount: client.loan_amount,
      savings_amount: calculateMonthlySavings(
        client.current_rate,
        client.target_rate,
        client.loan_amount,
        client.term_years
      ),
      loan_type: client.loan_type,
      term_years: client.term_years
    }))

    // Prepare pathway variables for broker call
    const pathwayVariables = {
      broker_name: brokerProfile.full_name || 'valued broker',
      company: brokerProfile.company || brokerProfile.company_name || 'your office',
      client_count: clientCount.toString(),
      client_summary: clientSummary,
      client_names: clientNames.join(', '),
      total_savings: client_details.reduce((sum, c) => sum + c.savings_amount, 0).toLocaleString()
    }

    console.log('📞 Making broker batch call with variables:', pathwayVariables)

    // Make ONE Bland call with BROKER_BATCH_PATHWAY_ID
    const brokerCallResponse = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'authorization': BLAND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: brokerProfile.broker_phone_number,
        pathway_id: BROKER_BATCH_PATHWAY_ID,
        request_data: pathwayVariables,
        wait_for_greeting: true,
        interruption_threshold: 400,
        voice: 'maya',
        language: 'eng',
        max_duration: 3,
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/bland-webhook-public`,
        metadata: {
          call_type: 'broker_batch',
          broker_id: broker_id,
          client_count: clientCount,
          pathway_id: BROKER_BATCH_PATHWAY_ID
        }
      })
    })

    if (!brokerCallResponse.ok) {
      const errorText = await brokerCallResponse.text()
      throw new Error(`Bland API error: ${brokerCallResponse.status} - ${errorText}`)
    }

    const brokerCallData = await brokerCallResponse.json()
    console.log('✅ Broker batch call initiated:', brokerCallData.call_id)

    // Log to broker_notifications
    const { data: notification, error: notificationError } = await supabase
      .from('broker_notifications')
      .insert({
        broker_id: broker_id,
        notification_date: today,
        client_count: clientCount,
        client_ids: rateAlerts.map(c => c.client_id),
        call_id: brokerCallData.call_id,
        call_status: 'initiated',
        client_details: client_details
      })
      .select()
      .single()

    if (notificationError) throw notificationError

    // Log each client to notification_clients
    const notificationClients = rateAlerts.map(client => ({
      notification_id: notification.id,
      client_id: client.client_id,
      mortgage_id: client.mortgage_id,
      client_name: `${client.first_name} ${client.last_name}`,
      current_rate: client.current_rate,
      target_rate: client.target_rate,
      loan_amount: client.loan_amount,
      savings_amount: calculateMonthlySavings(
        client.current_rate,
        client.target_rate,
        client.loan_amount,
        client.term_years
      )
    }))

    await supabase
      .from('notification_clients')
      .insert(notificationClients)

    // Log to call_logs for history
    await supabase.from('call_logs').insert({
      user_id: broker_id,
      client_id: null, // This is a broker call, not client-specific
      call_type: 'broker_batch',
      bland_call_id: brokerCallData.call_id,
      phone_number: brokerProfile.broker_phone_number,
      call_status: 'initiated',
      cost_cents: 0
    })

    // Decrement calls_remaining
    await supabase
      .from('profiles')
      .update({
        calls_remaining: Math.max(0, (brokerProfile.calls_remaining || 50) - 1)
      })
      .eq('id', broker_id)

    return new Response(
      JSON.stringify({
        success: true,
        call_id: brokerCallData.call_id,
        notification_id: notification.id,
        client_count: clientCount,
        clients: client_details.map(c => ({
          name: c.name,
          savings: `$${c.savings_amount.toLocaleString()}`
        })),
        message: `Batch notification sent to broker for ${clientCount} client${clientCount > 1 ? 's' : ''}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Batch call function error:', error)
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
🎯 BATCH CALL SYSTEM IMPLEMENTED:
1. ✅ Updated interface to BatchCallRequest with broker_id and optional mortgage_id
2. ✅ Added safety check for existing notifications today
3. ✅ Query broker_rate_alerts view for clients hitting targets
4. ✅ Build dynamic client summary based on count (1, 2-3, 4+)
5. ✅ Prepare client_details JSON with all client info for email
6. ✅ Make single Bland call with BROKER_BATCH_PATHWAY_ID
7. ✅ Log to broker_notifications with all required fields
8. ✅ Log each client to notification_clients table
9. ✅ Log to call_logs for history tracking
10. ✅ Decrement calls_remaining counter
11. ✅ Added makeClientCall helper function for webhook use
12. ✅ Return comprehensive response with notification details

📊 PATHWAY VARIABLES FOR BROKER BATCH CALL:
- {{broker_name}}, {{company}}
- {{client_count}}, {{client_summary}}
- {{client_names}}, {{total_savings}}

🔄 BACKWARDS COMPATIBILITY:
- Still handles legacy clientId/userId format
- Maintains existing calculateMonthlySavings function
- Preserves all logging and tracking mechanisms
*/