// src/lib/emailTemplates.ts

interface RateAlertData {
    clientName: string
    loanType: string
    currentRate: number
    targetRate: number
    clientId: string
  }
  
  interface WeeklySummaryData {
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
  }
  
  export function createRateAlertEmail(data: RateAlertData) {
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
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="font-size: 30px;">🎯</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Rate Alert!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Target rate hit for ${data.clientName}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">Great News!</h2>
              <p style="color: #047857; margin: 0; line-height: 1.6;">
                The ${data.loanType} rate has dropped to <strong>${data.currentRate.toFixed(3)}%</strong>, 
                which is <strong>${rateDifference}%</strong> below your target of ${data.targetRate.toFixed(3)}%.
              </p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0;">Client Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Client Name:</td>
                  <td style="padding: 10px 0; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Loan Type:</td>
                  <td style="padding: 10px 0; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.loanType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Current Rate:</td>
                  <td style="padding: 10px 0; color: #10b981; font-weight: 600; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.currentRate.toFixed(3)}%</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Target Rate:</td>
                  <td style="padding: 10px 0; color: #64748b; text-align: right;">${data.targetRate.toFixed(3)}%</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fffbeb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏰ Act Fast:</strong> Rates can change quickly. Contact your client now to lock in this rate.
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://ratemonitorpro.com/crm?client=${data.clientId}" 
                 style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                View Client Details
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              Rate Monitor Pro - Real-time mortgage rate alerts
            </p>
            <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 12px;">
              You're receiving this because rate alerts are enabled in your preferences.
              <a href="https://ratemonitorpro.com/settings" style="color: #1e40af; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  export function createWeeklySummaryEmail(data: WeeklySummaryData) {
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
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="font-size: 30px;">📊</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Rate Summary</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${data.weekStart} - ${data.weekEnd}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Hi ${data.userName}, here's your weekly mortgage rate update.
            </p>
            
            <!-- Rate Cards -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">This Week's Rates</h2>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year Conventional</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.conventional30.current.toFixed(3)}%</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px;">${formatChange(data.rates.conventional30.change)}</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">15-Year Conventional</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.conventional15.current.toFixed(3)}%</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px;">${formatChange(data.rates.conventional15.change)}</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year FHA</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.fha30.current.toFixed(3)}%</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px;">${formatChange(data.rates.fha30.change)}</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">30-Year VA</div>
                    <div style="color: #1e293b; font-size: 24px; font-weight: 700;">${data.rates.va30.current.toFixed(3)}%</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px;">${formatChange(data.rates.va30.change)}</div>
                  </div>
                </div>
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
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              Rate Monitor Pro - Your weekly rate digest
            </p>
            <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 12px;">
              You're receiving this weekly summary. 
              <a href="https://ratemonitorpro.com/settings" style="color: #1e40af; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  export function createWelcomeEmail(fullName: string, companyName?: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Rate Monitor Pro</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #1e40af; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
            RMP
          </div>
          <h1 style="color: #1e40af; margin: 0;">Welcome to Rate Monitor Pro!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #334155; margin-top: 0;">Hi ${fullName},</h2>
          <p style="color: #64748b; line-height: 1.6;">
            Your Rate Monitor Pro account is now active and ready to help you track mortgage rates and manage your client portfolio.
          </p>
          ${companyName ? `<p style="color: #64748b; line-height: 1.6;">We're excited to help ${companyName} streamline your rate monitoring process.</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e40af;">What's Next?</h3>
          <ul style="color: #64748b; line-height: 1.8;">
            <li>Add your first client to start tracking rates</li>
            <li>Set target rates for rate alert notifications</li>
            <li>Explore the dashboard to see current market rates</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ratemonitorpro.com/dashboard" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Go to Dashboard
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #94a3b8; font-size: 14px; text-align: center;">
          <p>Need help? Reply to this email or visit our <a href="https://ratemonitorpro.com/help" style="color: #1e40af;">help center</a>.</p>
          <p>Rate Monitor Pro - Streamlining mortgage rate tracking for professionals</p>
        </div>
      </body>
      </html>
    `
  }