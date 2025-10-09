// supabase/functions/check-rate-alerts/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://ratemonitorpro.com'

interface RateAlert {
  clientId: string
  clientName: string
  clientEmail: string
  brokerName: string
  brokerEmail: string
  brokerPhone: string | null
  userId: string
  loanType: string
  currentRate: number
  targetRate: number
}

Deno.serve(async (req) => {
  try {
    console.log('🚀 Starting rate alert check...')

    // Get current rates from rate_history (most recent for each loan type)
    const { data: latestRates, error: ratesError } = await supabase
      .from('rate_history')
      .select('*')
      .order('rate_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)

    if (ratesError) throw ratesError

    // Create map of current rates by loan type
    const currentRates: Record<string, { rate: number, date: string }> = {}
    latestRates?.forEach((rate) => {
      const key = `${rate.term_years}yr_${rate.loan_type}`
      if (!currentRates[key]) {
        currentRates[key] = { 
          rate: rate.rate_value, 
          date: rate.rate_date 
        }
      }
    })

    console.log('📊 Current rates:', currentRates)

    // Get all clients with target rates set
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        target_rate,
        loan_type,
        user_id,
        profiles!inner(email, full_name, phone)
      `)
      .not('target_rate', 'is', null)
      .not('loan_type', 'is', null)
      .is('deleted_at', null)

    if (clientsError) throw clientsError

    console.log(`👥 Found ${clients?.length || 0} clients with target rates`)

    const alertsToSend: RateAlert[] = []

    // Check each client
    for (const client of clients || []) {
      // Map client loan_type to rate key
      let rateKey: string
      
      switch (client.loan_type.toLowerCase()) {
        case '30yr':
        case 'conventional':
          rateKey = '30yr_conventional'
          break
        case '15yr':
          rateKey = '15yr_conventional'
          break
        case 'fha':
          rateKey = '30yr_fha'
          break
        case 'va':
          rateKey = '30yr_va'
          break
        default:
          rateKey = '30yr_conventional'
      }

      const currentRateData = currentRates[rateKey]

      if (!currentRateData) {
        console.log(`⚠️ No current rate found for ${rateKey}`)
        continue
      }

      // Check if rate hit target
      if (currentRateData.rate <= client.target_rate) {
        console.log(`🎯 Target hit for ${client.first_name} ${client.last_name}`)

        // Check cooldown (24 hours)
        const cooldownTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: recentAlerts } = await supabase
          .from('email_logs')
          .select('id')
          .eq('client_id', client.id)
          .eq('email_type', 'rate_alert')
          .gte('sent_at', cooldownTime)

        if (recentAlerts && recentAlerts.length > 0) {
          console.log(`⏰ Cooldown active for client ${client.id}`)
          continue
        }

        // Check if broker has rate alerts enabled
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('rate_alerts, send_client_emails')
          .eq('user_id', client.user_id)
          .single()

        if (!prefs?.rate_alerts) {
          console.log(`🔕 Rate alerts disabled for user ${client.user_id}`)
          continue
        }

        alertsToSend.push({
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          clientEmail: client.email,
          brokerName: client.profiles.full_name || 'Your Broker',
          brokerEmail: client.profiles.email,
          brokerPhone: client.profiles.phone,
          userId: client.user_id,
          loanType: client.loan_type,
          currentRate: currentRateData.rate,
          targetRate: client.target_rate
        })
      }
    }

    console.log(`📧 Sending ${alertsToSend.length} rate alerts`)

    // Send alerts sequentially with delay to avoid rate limits
    const results = []
    
    for (let i = 0; i < alertsToSend.length; i++) {
      const alert = alertsToSend[i]
      
      try {
        // Get user preferences for client emails
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('send_client_emails')
          .eq('user_id', alert.userId)
          .single()

        const sendToClient = prefs?.send_client_emails || false

        // Send to broker (always)
        const brokerEmailHtml = createBrokerEmail(alert)
        
        const brokerResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Rate Alerts <alerts@ratemonitorpro.com>',
            to: [alert.brokerEmail],
            subject: `🎯 Rate Alert: ${alert.clientName}'s Target Rate Reached!`,
            html: brokerEmailHtml
          })
        })

        const brokerResult = await brokerResponse.json()

        if (!brokerResponse.ok) {
          throw new Error(`Broker email failed: ${brokerResult.message}`)
        }

        // Log broker email
        await supabase.from('email_logs').insert({
          user_id: alert.userId,
          client_id: alert.clientId,
          email_type: 'rate_alert',
          subject: `Rate Alert: ${alert.clientName}`,
          sent_at: new Date().toISOString()
        })

        let clientEmailSent = false

        // Send to client if enabled
        if (sendToClient && alert.clientEmail) {
          // Add small delay before client email to avoid rate limit
          await new Promise(resolve => setTimeout(resolve, 600))
          
          const clientEmailHtml = createClientEmail(alert)
          
          const clientResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Rate Monitor Pro <notifications@ratemonitorpro.com>',
              to: [alert.clientEmail],
              subject: `Great News About Your Mortgage Rate! 🎉`,
              html: clientEmailHtml
            })
          })

          const clientResult = await clientResponse.json()

          if (clientResponse.ok) {
            clientEmailSent = true
            
            // Log client email
            await supabase.from('email_logs').insert({
              user_id: alert.userId,
              client_id: alert.clientId,
              email_type: 'rate_alert_client',
              subject: 'Great News About Your Mortgage Rate!',
              sent_at: new Date().toISOString()
            })
          }
        }

        results.push({ 
          success: true, 
          client: alert.clientName,
          brokerEmailSent: true,
          clientEmailSent 
        })

      } catch (error) {
        console.error(`❌ Failed to send alert for ${alert.clientName}:`, error)
        results.push({ 
          success: false, 
          client: alert.clientName, 
          error: error.message 
        })
      }
      
      // Add delay between different clients to respect rate limits (2 per second)
      if (i < alertsToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
    }

    const successful = results.filter(r => r.success).length
    const totalClientEmails = results.filter(r => r.clientEmailSent).length

    console.log(`✅ Success: ${successful}/${alertsToSend.length} alerts sent`)
    console.log(`📨 Client emails sent: ${totalClientEmails}`)

    return new Response(
      JSON.stringify({
        success: true,
        clientsChecked: clients?.length || 0,
        alertsSent: successful,
        clientEmailsSent: totalClientEmails,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Rate alert check error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// 📧 BROKER EMAIL TEMPLATE
function createBrokerEmail(data: RateAlert): string {
  const rateDifference = Math.abs(data.targetRate - data.currentRate).toFixed(3)
  const savingsEstimate = Math.round((parseFloat(rateDifference) * 1000) * 12)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rate Alert - Target Rate Hit!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <div style="background: white; width: 70px; height: 70px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <span style="font-size: 36px;">🎯</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Rate Alert!</h1>
          <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px;">Target rate reached for your client</p>
        </div>
        
        <div style="padding: 40px 30px;">
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: #065f46; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Client: ${data.clientName}</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #047857; font-weight: 500;">Target Rate:</span>
                <strong style="color: #065f46; font-size: 18px;">${data.targetRate.toFixed(3)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #047857; font-weight: 500;">Current Rate:</span>
                <strong style="color: #10b981; font-size: 18px;">${data.currentRate.toFixed(3)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #047857; font-weight: 500;">Loan Type:</span>
                <strong style="color: #065f46;">${data.loanType.toUpperCase()}</strong>
              </div>
            </div>
          </div>
          
          <div style="background: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <p style="color: #1e40af; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Annual Savings</p>
            <p style="color: #1e3a8a; margin: 8px 0 0 0; font-size: 32px; font-weight: 700;">$${savingsEstimate.toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${APP_URL}/crm?client=${data.clientId}" 
               style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              View Client in CRM →
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px; font-weight: 600;">Quick Actions:</p>
            <div style="display: grid; gap: 10px;">
              <a href="mailto:${data.clientEmail}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                📧 Email ${data.clientName}
              </a>
              ${data.brokerPhone ? `
              <a href="tel:${data.brokerPhone}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                📞 Call Client
              </a>
              ` : ''}
            </div>
          </div>
          
        </div>
        
        <div style="background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">
            Rate Monitor Pro
          </p>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            Don't wait - rates can change anytime!
          </p>
          <p style="margin: 16px 0 0 0; font-size: 12px;">
            <a href="${APP_URL}/settings" style="color: #3b82f6; text-decoration: none;">Manage Email Preferences</a>
          </p>
        </div>
        
      </div>
      
    </body>
    </html>
  `
}

// 📧 CLIENT EMAIL TEMPLATE
function createClientEmail(data: RateAlert): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Great News About Your Mortgage Rate!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
          <div style="background: white; width: 70px; height: 70px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <span style="font-size: 36px;">🎉</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Great News!</h1>
          <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px;">Your target rate has been reached</p>
        </div>
        
        <div style="padding: 40px 30px;">
          
          <p style="color: #374151; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
            Hi <strong>${data.clientName.split(' ')[0]}</strong>,
          </p>
          
          <p style="color: #374151; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
            We have exciting news! The mortgage rate you've been watching has dropped to your target rate.
          </p>
          
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
            <div style="display: grid; gap: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #1e40af; font-weight: 500; font-size: 15px;">Your Target Rate:</span>
                <strong style="color: #1e3a8a; font-size: 20px;">${data.targetRate.toFixed(3)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #1e40af; font-weight: 500; font-size: 15px;">Current Rate:</span>
                <strong style="color: #3b82f6; font-size: 20px;">${data.currentRate.toFixed(3)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #1e40af; font-weight: 500; font-size: 15px;">Loan Type:</span>
                <strong style="color: #1e3a8a; font-size: 16px;">${data.loanType.toUpperCase()}</strong>
              </div>
            </div>
          </div>
          
          <p style="color: #374151; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
            Your mortgage broker <strong>${data.brokerName}</strong> will be reaching out to you soon to discuss this opportunity.
          </p>
          
          <div style="background: #f9fafb; border: 2px solid #e5e7eb; padding: 24px; border-radius: 12px; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px; font-weight: 600;">Want to act fast?</p>
            ${data.brokerPhone ? `
            <a href="tel:${data.brokerPhone}" 
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin-bottom: 12px;">
              📞 Call ${data.brokerName}
            </a>
            <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 13px;">${data.brokerPhone}</p>
            ` : `
            <a href="mailto:${data.brokerEmail}" 
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              📧 Email ${data.brokerName}
            </a>
            `}
          </div>
          
        </div>
        
        <div style="background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">
            Sent by ${data.brokerName}
          </p>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            via Rate Monitor Pro
          </p>
          <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">
            This is an automated notification from your mortgage broker.
          </p>
        </div>
        
      </div>
      
    </body>
    </html>
  `
}