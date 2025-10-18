// supabase/functions/bland-webhook-public/index.ts
// PUBLIC WEBHOOK - No authentication required - FIXED VERSION
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Import makeClientCall from make-call function
const MAKE_CALL_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-call`

// Helper function to call individual clients
async function makeClientCall(clientId: string, supabaseClient: any, blandApiKey: string) {
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

    // Calculate monthly savings (simplified version of the function from make-call)
    const calculateMonthlySavings = (currentRate: number, newRate: number, loanAmount: number, termYears: number = 30) => {
      if (!loanAmount || !currentRate || !newRate || currentRate <= 0 || newRate <= 0 || loanAmount <= 0) {
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

      return Math.round(currentPayment - newPayment)
    }

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
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: `${client.first_name} ${client.last_name}`,
      broker_name: brokerProfile.full_name || 'your mortgage advisor',
      company: brokerProfile.company || brokerProfile.company_name || 'their mortgage office',
      loan_type: mortgage.loan_type || 'conventional',
      loan_type_full: `${(mortgage.loan_type || 'conventional').charAt(0).toUpperCase() + (mortgage.loan_type || 'conventional').slice(1)}`,
      loan_amount: mortgage.loan_amount?.toLocaleString() || '300,000',
      term_years: mortgage.term_years || 30,
      lender: mortgage.lender || 'your current lender',
      current_rate: mortgage.current_rate?.toFixed(2) || 'N/A',
      target_rate: mortgage.target_rate?.toFixed(2) || 'N/A',
      market_rate: currentMarketRate.toFixed(2),
      monthly_savings: monthlySavings.toLocaleString(),
      annual_savings: annualSavings.toLocaleString(),
      lifetime_savings: (annualSavings * mortgage.term_years).toLocaleString()
    }

    // Make Bland call with CLIENT_PATHWAY_ID
    const CLIENT_PATHWAY_ID = '9d2c24e4-6f3d-4648-9ceb-c47c30238667'
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

// 🎯 HANDLE BROKER BATCH WEBHOOK LOGIC
async function handleBrokerBatchWebhook(payload: any, supabase: any) {
  try {
    const { call_id, metadata, pathway_result, variables } = payload
    
    console.log('📊 Broker batch payload:', { call_id, metadata, pathway_result, variables })

    // Get call_id from webhook body
    if (!call_id) {
      throw new Error('Missing call_id in webhook payload')
    }

    // Query broker_notifications WHERE call_id = X
    const { data: notification, error: notificationError } = await supabase
      .from('broker_notifications')
      .select('*')
      .eq('call_id', call_id)
      .single()

    if (notificationError || !notification) {
      console.error('❌ Could not find broker notification for call_id:', call_id)
      return
    }

    console.log('📋 Found notification:', notification.id)

    // Extract broker_preference from webhook body
    let brokerPreference = ''
    
    // Check multiple possible locations for the preference
    if (pathway_result?.choice || pathway_result?.decision) {
      brokerPreference = pathway_result.choice || pathway_result.decision
    } else if (variables?.broker_choice || variables?.preference) {
      brokerPreference = variables.broker_choice || variables.preference
    } else if (payload.transcript) {
      // Fallback: analyze transcript for keywords
      const transcript = payload.transcript.toLowerCase()
      if (transcript.includes('email') || transcript.includes('send') || transcript.includes('list')) {
        brokerPreference = 'email'
      } else if (transcript.includes('call') || transcript.includes('reach out')) {
        brokerPreference = 'call_clients'
      } else if (transcript.includes('myself') || transcript.includes('personally') || transcript.includes("i'll") || transcript.includes('handle')) {
        brokerPreference = 'handle_myself'
      }
    }

    console.log('🎯 Detected broker preference:', brokerPreference)

    // Update broker_notifications
    await supabase
      .from('broker_notifications')
      .update({
        call_status: 'completed',
        broker_action: brokerPreference || 'no_action'
      })
      .eq('call_id', call_id)

    // BRANCH ON PREFERENCE
    if (brokerPreference.includes('email') || brokerPreference.includes('send') || brokerPreference.includes('list')) {
      console.log('📧 Processing email request...')
      await handleEmailRequest(notification, supabase)
    } else if (brokerPreference.includes('call') || brokerPreference.includes('reach out')) {
      console.log('📞 Processing call clients request...')
      await handleCallClientsRequest(notification, supabase)
    } else if (brokerPreference.includes('myself') || brokerPreference.includes('personally') || brokerPreference.includes("i'll") || brokerPreference.includes('handle')) {
      console.log('✋ Processing handle myself request...')
      await handleHandleMyselfRequest(notification, supabase)
    } else {
      console.log('❓ No clear preference detected, no additional action taken')
    }

  } catch (error) {
    console.error('❌ Error in broker batch webhook handler:', error)
    throw error
  }
}

// A) EMAIL REQUEST HANDLER
async function handleEmailRequest(notification: any, supabase: any) {
  try {
    // Query notification_clients with client and mortgage details
    const { data: notificationClients, error: clientsError } = await supabase
      .from('notification_clients')
      .select(`
        *,
        clients:client_id (first_name, last_name, phone, email),
        mortgages:mortgage_id (loan_amount, current_rate, target_rate, loan_type, term_years)
      `)
      .eq('notification_id', notification.id)

    if (clientsError) throw clientsError

    // Get broker details
    const { data: broker, error: brokerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', notification.broker_id)
      .single()

    if (brokerError) throw brokerError

    // Build HTML email
    const clientCount = notificationClients.length
    const subject = `${clientCount} Client${clientCount > 1 ? 's' : ''} Hit Target Rate`
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .highlight { background-color: #e8f5e8; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Rate Alert Notification</h1>
        <p>Your clients have hit their target rates!</p>
    </div>
    
    <div class="content">
        <h2>Hello ${broker.full_name || 'Valued Broker'},</h2>
        
        <p>Great news! <strong>${clientCount} of your client${clientCount > 1 ? 's' : ''}</strong> ${clientCount > 1 ? 'have' : 'has'} reached their target rate${clientCount > 1 ? 's' : ''}. Here are the details:</p>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Client Name</th>
                    <th>Current Rate</th>
                    <th>Target Rate</th>
                    <th>Loan Amount</th>
                    <th>Monthly Savings</th>
                    <th>Phone</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                ${notificationClients.map(client => `
                <tr class="highlight">
                    <td><strong>${client.client_name}</strong></td>
                    <td>${client.current_rate?.toFixed(2)}%</td>
                    <td>${client.target_rate?.toFixed(2)}%</td>
                    <td>$${client.loan_amount?.toLocaleString()}</td>
                    <td><strong>$${client.savings_amount?.toLocaleString()}</strong></td>
                    <td>${client.clients?.phone || 'N/A'}</td>
                    <td>${client.clients?.email || 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Contact these clients to discuss refinancing opportunities</li>
            <li>Calculate exact savings based on their specific loan terms</li>
            <li>Prepare refinancing proposals and documentation</li>
        </ul>
        
        <p>This is an automated notification from your Rate Monitor Pro system.</p>
    </div>
    
    <div class="footer">
        <p>Rate Monitor Pro - Automated Rate Tracking</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Rate Alerts <alerts@ratemonitorpro.com>',
        to: broker.email,
        subject: subject,
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Email sent successfully:', emailResult.id)

    // Update broker_notifications
    await supabase
      .from('broker_notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        broker_action: 'email_sent'
      })
      .eq('id', notification.id)

    // Log to email_logs table (if it exists)
    try {
      await supabase.from('email_logs').insert({
        broker_id: notification.broker_id,
        notification_id: notification.id,
        email_id: emailResult.id,
        recipient: broker.email,
        subject: subject,
        sent_at: new Date().toISOString(),
        client_count: clientCount
      })
    } catch (logError) {
      console.warn('⚠️ Could not log to email_logs table (may not exist):', logError.message)
    }

  } catch (error) {
    console.error('❌ Error sending email:', error)
    throw error
  }
}

// B) CALL CLIENTS REQUEST HANDLER
async function handleCallClientsRequest(notification: any, supabase: any) {
  try {
    // Query notification_clients
    const { data: notificationClients, error: clientsError } = await supabase
      .from('notification_clients')
      .select('client_id')
      .eq('notification_id', notification.id)

    if (clientsError) throw clientsError

    const BLAND_API_KEY = Deno.env.get('BLAND_API_KEY')
    if (!BLAND_API_KEY) {
      throw new Error('BLAND_API_KEY not configured')
    }

    // Call each client with 30 second delays
    for (let i = 0; i < notificationClients.length; i++) {
      const client = notificationClients[i]
      
      try {
        console.log(`📞 Calling client ${i + 1}/${notificationClients.length}: ${client.client_id}`)
        
        await makeClientCall(client.client_id, supabase, BLAND_API_KEY)
        
        // Add 30 second delay between calls (except for the last one)
        if (i < notificationClients.length - 1) {
          console.log('⏳ Waiting 30 seconds before next call...')
          await new Promise(resolve => setTimeout(resolve, 30000))
        }
        
      } catch (callError) {
        console.error(`❌ Failed to call client ${client.client_id}:`, callError)
        // Continue with other clients even if one fails
      }
    }

    // Update broker_notifications
    await supabase
      .from('broker_notifications')
      .update({
        broker_action: 'call_clients'
      })
      .eq('id', notification.id)

    console.log('✅ All client calls initiated')

  } catch (error) {
    console.error('❌ Error calling clients:', error)
    throw error
  }
}

// C) HANDLE MYSELF REQUEST HANDLER
async function handleHandleMyselfRequest(notification: any, supabase: any) {
  try {
    // Get all client_ids from notification_clients
    const { data: notificationClients, error: clientsError } = await supabase
      .from('notification_clients')
      .select('client_id')
      .eq('notification_id', notification.id)

    if (clientsError) throw clientsError

    const clientIds = notificationClients.map(nc => nc.client_id)

    // UPDATE clients SET broker_contacted_at = NOW() WHERE id IN (client_ids)
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        broker_contacted_at: new Date().toISOString()
      })
      .in('id', clientIds)

    if (updateError) throw updateError

    // Update broker_notifications
    await supabase
      .from('broker_notifications')
      .update({
        broker_action: 'handle_myself'
      })
      .eq('id', notification.id)

    console.log(`✅ Marked ${clientIds.length} clients as broker-contacted`)

  } catch (error) {
    console.error('❌ Error handling myself request:', error)
    throw error
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('📞 Webhook START')

  try {
    const payload = await req.json()
    console.log('✅ Payload received:', JSON.stringify(payload, null, 2))
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔑 Env vars:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    })
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created')

    // Bland.AI webhook payload
    const {
      call_id,
      status,
      call_length,
      transcript,
      concatenated_transcript,
      recording_url,
      metadata,
      corrected_duration
    } = payload

    // 🔧 FIX: Round call_length to integer (Bland sends decimals)
    const durationSeconds = Math.round(call_length || corrected_duration || 0)
    
    // Calculate cost
    const costCents = Math.ceil(durationSeconds / 60 * 9)
    
    console.log(`📞 Processing call ${call_id} - Status: ${status}, Duration: ${durationSeconds}s`)

    // Find existing log
    console.log('🔍 Searching for existing log...')
    const { data: existingLog, error: findError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('bland_call_id', call_id)
      .maybeSingle()

    if (findError) {
      console.error('⚠️ Query error:', findError)
    }
    
    console.log('📊 Existing log found:', !!existingLog)

    if (existingLog) {
      // Update existing
      console.log('📝 Updating existing log...')
      const { error } = await supabase
        .from('call_logs')
        .update({
          call_status: status,
          call_duration: durationSeconds, // ✅ INTEGER
          transcript: concatenated_transcript || transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          completed_at: new Date().toISOString()
        })
        .eq('bland_call_id', call_id)

      if (error) {
        console.error('❌ Update error:', error)
        throw error
      }
      console.log('✅ Updated existing call log')
    } else {
      // Create new (shouldn't happen but handle it)
      console.log('📝 Creating new log...')
      
      // Validate UUIDs before inserting
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }
      
      const userId = metadata?.user_id && isValidUUID(metadata.user_id) ? metadata.user_id : null
      const clientId = metadata?.client_id && isValidUUID(metadata.client_id) ? metadata.client_id : null
      
      console.log('🔑 IDs:', { userId, clientId, hasValidUser: !!userId, hasValidClient: !!clientId })
      
      const { error } = await supabase
        .from('call_logs')
        .insert({
          bland_call_id: call_id,
          call_status: status,
          call_duration: durationSeconds, // ✅ INTEGER
          transcript: concatenated_transcript || transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          completed_at: new Date().toISOString(),
          user_id: userId,
          client_id: clientId,
          call_type: metadata?.call_type || 'client',
          phone_number: payload.to || 'unknown'
        })

      if (error) {
        console.error('❌ Insert error:', error)
        throw error
      }
      console.log('✅ Created new call log')
    }

    // 🎯 HANDLE BROKER BATCH ACTIONS
    if (metadata?.call_type === 'broker_batch') {
      console.log('🏢 Processing broker batch webhook...')
      await handleBrokerBatchWebhook(payload, supabase)
    }

    console.log('🎉 Webhook processing complete')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed',
        call_id: call_id,
        status: status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    console.error('Stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})