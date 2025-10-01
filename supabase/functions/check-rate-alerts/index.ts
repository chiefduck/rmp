// supabase/functions/check-rate-alerts/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface RateAlert {
  clientId: string
  clientName: string
  clientEmail: string
  userEmail: string
  loanType: string
  currentRate: number
  targetRate: number
}

Deno.serve(async (req) => {
  try {
    console.log('Starting rate alert check...')

    // Get current rates from rate_history table (most recent entry)
    const { data: latestRates, error: ratesError } = await supabase
      .from('rate_history')
      .select('*')
      .order('rate_date', { ascending: false })
      .limit(5)

    if (ratesError) throw ratesError

    // Create a map of current rates by loan type
    const currentRates: Record<string, number> = {}
    latestRates?.forEach((rate) => {
      currentRates[rate.loan_type] = rate.rate_value
    })

    console.log('Current rates:', currentRates)

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
        profiles!inner(email)
      `)
      .not('target_rate', 'is', null)
      .not('loan_type', 'is', null)

    if (clientsError) throw clientsError

    console.log(`Found ${clients?.length || 0} clients with target rates`)

    const alertsToSend: RateAlert[] = []

    // Check each client to see if their target rate has been hit
    for (const client of clients || []) {
      const currentRate = currentRates[client.loan_type]
      
      if (!currentRate) {
        console.log(`No current rate found for ${client.loan_type}`)
        continue
      }

      // If current rate is at or below target rate, send alert
      if (currentRate <= client.target_rate) {
        // Check if we've already sent an alert for this in the last 24 hours
        const { data: recentAlerts } = await supabase
          .from('email_logs')
          .select('id')
          .eq('client_id', client.id)
          .eq('email_type', 'rate_alert')
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (recentAlerts && recentAlerts.length > 0) {
          console.log(`Already sent alert for client ${client.id} in last 24h`)
          continue
        }

        // Check if user has rate alerts enabled
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('rate_alerts')
          .eq('user_id', client.user_id)
          .single()

        if (!prefs?.rate_alerts) {
          console.log(`Rate alerts disabled for user ${client.user_id}`)
          continue
        }

        alertsToSend.push({
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          clientEmail: client.email,
          userEmail: client.profiles.email,
          loanType: client.loan_type,
          currentRate,
          targetRate: client.target_rate
        })
      }
    }

    console.log(`Sending ${alertsToSend.length} rate alerts`)

    // Send alerts
    const results = await Promise.all(
      alertsToSend.map(async (alert) => {
        try {
          // Create email HTML using your template function
          const emailHtml = createRateAlertEmail({
            clientName: alert.clientName,
            loanType: alert.loanType,
            currentRate: alert.currentRate,
            targetRate: alert.targetRate,
            clientId: alert.clientId
          })

          // Send via Resend
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Rate Alerts <alerts@ratemonitorpro.com>',
              to: [alert.userEmail],
              subject: `Rate Alert: ${alert.clientName} - Target Rate Hit! 🎯`,
              html: emailHtml
            })
          })

          const result = await response.json()

          if (response.ok) {
            // Log successful email
            await supabase.from('email_logs').insert({
              user_id: alert.clientId,
              client_id: alert.clientId,
              email_type: 'rate_alert',
              subject: `Rate Alert: ${alert.clientName}`,
              sent_at: new Date().toISOString()
            })

            return { success: true, client: alert.clientName }
          } else {
            throw new Error(result.message || 'Failed to send email')
          }
        } catch (error) {
          console.error(`Failed to send alert for ${alert.clientName}:`, error)
          return { success: false, client: alert.clientName, error: error.message }
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        alertsChecked: clients?.length || 0,
        alertsSent: results.filter(r => r.success).length,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Rate alert check error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Email template function (inline for now, matches your template)
function createRateAlertEmail(data: {
  clientName: string
  loanType: string
  currentRate: number
  targetRate: number
  clientId: string
}) {
  const rateDifference = (data.targetRate - data.currentRate).toFixed(3)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rate Alert - Target Rate Hit!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <div style="background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <span style="font-size: 30px;">🎯</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px;">Rate Alert!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Target rate hit for ${data.clientName}</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">Great News!</h2>
            <p style="color: #047857; margin: 0; line-height: 1.6;">
              The ${data.loanType} rate has dropped to <strong>${data.currentRate.toFixed(3)}%</strong>, 
              which is <strong>${rateDifference}%</strong> below your target of ${data.targetRate.toFixed(3)}%.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://ratemonitorpro.com/crm?client=${data.clientId}" 
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              View Client Details
            </a>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            Rate Monitor Pro - Real-time mortgage rate alerts
          </p>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 12px;">
            <a href="https://ratemonitorpro.com/settings" style="color: #1e40af; text-decoration: none;">Manage preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}