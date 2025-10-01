// supabase/functions/send-weekly-summary/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  try {
    console.log('Starting weekly summary emails...')

    // Get all users with weekly_reports enabled
    const { data: users, error: usersError } = await supabase
      .from('email_preferences')
      .select(`
        user_id,
        profiles!inner(id, email, full_name)
      `)
      .eq('weekly_reports', true)

    if (usersError) throw usersError

    console.log(`Found ${users?.length || 0} users with weekly reports enabled`)

    // Get current rates
    const { data: currentRates, error: currentError } = await supabase
      .from('rate_history')
      .select('*')
      .order('rate_date', { ascending: false })
      .limit(10)

    if (currentError) throw currentError

    // Get rates from 7 days ago for comparison
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: weekOldRates, error: weekOldError } = await supabase
      .from('rate_history')
      .select('*')
      .lte('rate_date', sevenDaysAgo.toISOString())
      .order('rate_date', { ascending: false })
      .limit(10)

    if (weekOldError) throw weekOldError

    // Helper to find rate by loan type
    const findRate = (rates: any[], loanType: string) => {
      return rates?.find(r => r.loan_type === loanType)?.rate_value || 0
    }

    // Calculate rate data
    const rateData = {
      conventional30: {
        current: findRate(currentRates, '30yr_conventional'),
        change: findRate(currentRates, '30yr_conventional') - findRate(weekOldRates, '30yr_conventional')
      },
      conventional15: {
        current: findRate(currentRates, '15yr_conventional'),
        change: findRate(currentRates, '15yr_conventional') - findRate(weekOldRates, '15yr_conventional')
      },
      fha30: {
        current: findRate(currentRates, '30yr_fha'),
        change: findRate(currentRates, '30yr_fha') - findRate(weekOldRates, '30yr_fha')
      },
      va30: {
        current: findRate(currentRates, '30yr_va'),
        change: findRate(currentRates, '30yr_va') - findRate(weekOldRates, '30yr_va')
      }
    }

    // Get date range for email
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 7)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const results = await Promise.all(
      (users || []).map(async (user) => {
        try {
          // Get clients needing attention for this user
          const { data: clients } = await supabase
            .from('clients')
            .select('id, target_rate, loan_type')
            .eq('user_id', user.user_id)
            .not('target_rate', 'is', null)

          let clientsNeedingAttention = 0
          
          clients?.forEach(client => {
            const currentRate = findRate(currentRates, client.loan_type)
            if (currentRate && currentRate <= client.target_rate) {
              clientsNeedingAttention++
            }
          })

          // Create email HTML
          const emailHtml = createWeeklySummaryEmail({
            userName: user.profiles.full_name || 'there',
            rates: rateData,
            clientsNeedingAttention,
            weekStart: formatDate(weekStart),
            weekEnd: formatDate(today)
          })

          // Send via Resend
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Rate Monitor Pro <reports@ratemonitorpro.com>',
              to: [user.profiles.email],
              subject: `Your Weekly Rate Summary - ${formatDate(weekStart)} to ${formatDate(today)}`,
              html: emailHtml
            })
          })

          const result = await response.json()

          if (response.ok) {
            // Log successful email
            await supabase.from('email_logs').insert({
              user_id: user.user_id,
              email_type: 'weekly_summary',
              subject: 'Weekly Rate Summary',
              sent_at: new Date().toISOString()
            })

            return { success: true, user: user.profiles.email }
          } else {
            throw new Error(result.message || 'Failed to send email')
          }
        } catch (error) {
          console.error(`Failed to send summary to ${user.profiles.email}:`, error)
          return { success: false, user: user.profiles.email, error: error.message }
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: results.filter(r => r.success).length,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Weekly summary error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Email template function
function createWeeklySummaryEmail(data: {
  userName: string
  rates: {
    conventional30: { current: number; change: number }
    conventional15: { current: number; change: number }
    fha30: { current: number; change: number }
    va30: { current: number; change: number }
  }
  clientsNeedingAttention: number
  weekStart: string
  weekEnd: string
}) {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    const color = change >= 0 ? '#dc2626' : '#10b981'
    return `<span style="color: ${color}; font-weight: 600;">${sign}${change.toFixed(3)}%</span>`
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Weekly Rate Summary</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
          <div style="background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <span style="font-size: 30px;">📊</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Rate Summary</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${data.weekStart} - ${data.weekEnd}</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            Hi ${data.userName}, here's your weekly mortgage rate update.
          </p>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">This Week's Rates</h2>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
              <table style="width: 100%;">
                <tr>
                  <td>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year Conventional</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.conventional30.current.toFixed(3)}%</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    ${formatChange(data.rates.conventional30.change)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
              <table style="width: 100%;">
                <tr>
                  <td>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">15-Year Conventional</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.conventional15.current.toFixed(3)}%</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    ${formatChange(data.rates.conventional15.change)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
              <table style="width: 100%;">
                <tr>
                  <td>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year FHA</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.fha30.current.toFixed(3)}%</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    ${formatChange(data.rates.fha30.change)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px;">
              <table style="width: 100%;">
                <tr>
                  <td>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year VA</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.va30.current.toFixed(3)}%</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    ${formatChange(data.rates.va30.change)}
                  </td>
                </tr>
              </table>
            </div>
          </div>
          
          ${data.clientsNeedingAttention > 0 ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Action Required</h3>
            <p style="color: #78350f; margin: 0; line-height: 1.6;">
              You have <strong>${data.clientsNeedingAttention} client${data.clientsNeedingAttention !== 1 ? 's' : ''}</strong> who may benefit from current rates.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="https://ratemonitorpro.com/dashboard" 
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              View Full Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            Rate Monitor Pro - Your weekly rate digest
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