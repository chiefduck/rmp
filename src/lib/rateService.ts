import { supabase } from './supabase'

export interface RateData {
  id?: string;
  rate_date: string;
  rate_type: string;
  rate_value: number;
  term_years: number;
  loan_type: string;
  created_at: string;
  change_1_day?: number;
  change_1_week?: number;
  change_1_month?: number;
  change_1_year?: number;
  range_52_week_low?: number;
  range_52_week_high?: number;
}

export interface RateTrend {
  date: string
  rate: number
  change?: number
}

export interface RateAlert {
  client_id: string
  first_name: string
  last_name: string
  target_rate: number
  current_rate: number
  loan_type: string
}

export class RateService {
  // Fetch current rates for all loan types with loan_type support
  static async getCurrentRates(): Promise<Record<string, RateData>> {
    try {
      const { data, error } = await supabase
        .from('rate_history')
        .select('*')
        .order('rate_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50) // Get more records to ensure we have latest for each type
  
      if (error) throw error
  
      // Group by term_years + loan_type to get latest rate for each combination
      const ratesByType: Record<string, RateData> = {}
      
      data?.forEach(rate => {
        const key = `${rate.term_years}yr_${rate.loan_type}`
        
        // Only keep if this is newer than what we have
        if (!ratesByType[key] || 
            new Date(rate.rate_date) > new Date(ratesByType[key].rate_date) ||
            (rate.rate_date === ratesByType[key].rate_date && 
             new Date(rate.created_at) > new Date(ratesByType[key].created_at))) {
          ratesByType[key] = rate
        }
      })
  
      return ratesByType
    } catch (error) {
      console.error('Error fetching current rates:', error)
      return {}
    }
  }

  // Get specific rate by loan type and term
  static async getCurrentRate(termYears: number, loanType: string = 'conventional'): Promise<RateData | null> {
    try {
      const { data, error } = await supabase
        .from('rate_history')
        .select('*')
        .eq('term_years', termYears)
        .eq('loan_type', loanType)
        .order('rate_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error fetching specific rate:', error)
      return null
    }
  }

  // Fetch rate history for a specific term and loan type
  static async getRateHistory(termYears: number, loanType: string = 'conventional', days: number = 30): Promise<RateTrend[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('rate_history')
        .select('rate_date, rate_value')
        .eq('term_years', termYears)
        .eq('loan_type', loanType)
        .gte('rate_date', startDate.toISOString().split('T')[0])
        .order('rate_date', { ascending: true })

      if (error) throw error

      // Calculate daily changes
      const trends: RateTrend[] = []
      data?.forEach((rate, index) => {
        const trend: RateTrend = {
          date: rate.rate_date,
          rate: rate.rate_value
        }

        if (index > 0) {
          trend.change = rate.rate_value - data[index - 1].rate_value
        }

        trends.push(trend)
      })

      return trends
    } catch (error) {
      console.error('Error fetching rate history:', error)
      return []
    }
  }

  // Fetch fresh rates from the Edge Function and update database
  // File: src/lib/rateService.ts - Update this function:
  static async fetchFreshRates(): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !anonKey) {
        console.error('Supabase configuration not found')
        return false
      }
  
      const response = await fetch(`${supabaseUrl}/functions/v1/rate-fetch`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Rate fetch failed: ${response.status}`)
      }
  
      const result = await response.json()
      
      if (result.success) {
        console.log(`Successfully fetched ${result.rates_fetched} fresh rates`)
        return true
      } else {
        console.error('Rate fetch failed:', result.error)
        return false
      }
    } catch (error) {
      console.error('Error fetching fresh rates:', error)
      return false
    }
  }

  // Store new rate data (for manual integration)
  static async storeRateData(rates: Omit<RateData, 'id' | 'created_at'>[]): Promise<boolean> {
    try {
      const ratesWithTimestamp = rates.map(rate => ({
        ...rate,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('rate_history')
        .upsert(ratesWithTimestamp, {
          onConflict: 'rate_date,term_years,loan_type'
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error storing rate data:', error)
      return false
    }
  }

  // Get rate alerts for clients whose target rates have been reached
  static async checkRateAlerts(): Promise<RateAlert[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, target_rate, loan_type')
        .not('target_rate', 'is', null)

      if (error) throw error

      const currentRates = await this.getCurrentRates()
      const alerts: RateAlert[] = []

      clients?.forEach(client => {
        // Map client loan_type to our rate keys
        let rateKey: string
        
        switch (client.loan_type) {
          case '30yr':
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

        const currentRate = currentRates[rateKey]

        if (currentRate && client.target_rate && currentRate.rate_value <= client.target_rate) {
          alerts.push({
            client_id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            target_rate: client.target_rate,
            current_rate: currentRate.rate_value,
            loan_type: client.loan_type
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking rate alerts:', error)
      return []
    }
  }

  // Get market rate for mortgage calculations (replaces hardcoded 6.2%)
  static async getMarketRate(loanType: string = 'conventional', termYears: number = 30): Promise<number> {
    try {
      const rateData = await this.getCurrentRate(termYears, loanType)
      
      if (rateData) {
        return rateData.rate_value
      }

      // Fallback to any 30-year conventional rate if specific type not found
      if (loanType !== 'conventional' || termYears !== 30) {
        const fallbackRate = await this.getCurrentRate(30, 'conventional')
        if (fallbackRate) return fallbackRate.rate_value
      }

      // Final fallback to prevent errors in calculations
      console.warn('No market rate found, using fallback rate of 6.5%')
      return 6.5
      
    } catch (error) {
      console.error('Error getting market rate:', error)
      return 6.5 // Safe fallback
    }
  }

  // Calculate rate-based opportunity score
  static calculateOpportunityScore(currentRate: number, marketRate: number, loanAmount: number): {
    monthlySavings: number
    annualSavings: number
    opportunityLevel: 'excellent' | 'good' | 'moderate' | 'low'
    score: number
  } {
    const rateDifference = currentRate - marketRate
    
    if (rateDifference <= 0) {
      return {
        monthlySavings: 0,
        annualSavings: 0,
        opportunityLevel: 'low',
        score: 0
      }
    }

    // Calculate monthly payment difference (simplified P&I calculation)
    const currentMonthlyRate = currentRate / 100 / 12
    const marketMonthlyRate = marketRate / 100 / 12
    const termMonths = 30 * 12

    const currentPayment = loanAmount * (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, termMonths)) / 
                          (Math.pow(1 + currentMonthlyRate, termMonths) - 1)
    const marketPayment = loanAmount * (marketMonthlyRate * Math.pow(1 + marketMonthlyRate, termMonths)) / 
                         (Math.pow(1 + marketMonthlyRate, termMonths) - 1)

    const monthlySavings = Math.max(0, currentPayment - marketPayment)
    const annualSavings = monthlySavings * 12

    // Determine opportunity level and score
    let opportunityLevel: 'excellent' | 'good' | 'moderate' | 'low'
    let score: number

    if (monthlySavings >= 300) {
      opportunityLevel = 'excellent'
      score = 90 + Math.min(10, (monthlySavings - 300) / 50) // 90-100
    } else if (monthlySavings >= 150) {
      opportunityLevel = 'good'
      score = 70 + ((monthlySavings - 150) / 150) * 20 // 70-90
    } else if (monthlySavings >= 50) {
      opportunityLevel = 'moderate'
      score = 40 + ((monthlySavings - 50) / 100) * 30 // 40-70
    } else {
      opportunityLevel = 'low'
      score = (monthlySavings / 50) * 40 // 0-40
    }

    return {
      monthlySavings,
      annualSavings,
      opportunityLevel,
      score: Math.round(score)
    }
  }

  // Get rate trends summary for dashboard
  static async getRateTrendsSummary(): Promise<{
    trend30yr: 'up' | 'down' | 'stable'
    trend15yr: 'up' | 'down' | 'stable'
    trendFHA: 'up' | 'down' | 'stable'
    trendVA: 'up' | 'down' | 'stable'
    lastUpdated: string
  }> {
    try {
      const trends = await Promise.all([
        this.getRateHistory(30, 'conventional', 7),
        this.getRateHistory(15, 'conventional', 7),
        this.getRateHistory(30, 'fha', 7),
        this.getRateHistory(30, 'va', 7)
      ])

      const getTrend = (trendData: RateTrend[]) => {
        if (trendData.length < 2) return 'stable'
        const recent = trendData.slice(-3)
        const avgChange = recent.reduce((sum, t) => sum + (t.change || 0), 0) / recent.length
        return avgChange > 0.05 ? 'up' : avgChange < -0.05 ? 'down' : 'stable'
      }

      const currentRates = await this.getCurrentRates()
      const lastUpdated = Object.values(currentRates)[0]?.rate_date || new Date().toISOString().split('T')[0]

      return {
        trend30yr: getTrend(trends[0]),
        trend15yr: getTrend(trends[1]),
        trendFHA: getTrend(trends[2]),
        trendVA: getTrend(trends[3]),
        lastUpdated
      }
    } catch (error) {
      console.error('Error getting trends summary:', error)
      return {
        trend30yr: 'stable',
        trend15yr: 'stable',
        trendFHA: 'stable',
        trendVA: 'stable',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  }

  // Legacy method for backward compatibility - now uses real data
  static generateMockRates(days: number = 30): Omit<RateData, 'id' | 'created_at'>[] {
    console.warn('generateMockRates is deprecated - use fetchFreshRates() for real data')
    
    const rates: Omit<RateData, 'id' | 'created_at'>[] = []
    const baseRates = { 
      30: { conventional: 6.4, fha: 6.1, va: 6.1 }, 
      15: { conventional: 5.9 } 
    }
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      Object.entries(baseRates).forEach(([term, loanTypes]) => {
        Object.entries(loanTypes).forEach(([loanType, baseRate]) => {
          // Add some realistic variation
          const variation = (Math.random() - 0.5) * 0.2 + Math.sin(i * 0.1) * 0.1
          const rate = baseRate + variation

          rates.push({
            rate_date: dateStr,
            rate_type: 'fixed',
            rate_value: Math.round(rate * 1000) / 1000,
            term_years: parseInt(term),
            loan_type: loanType
          })
        })
      })
    }

    return rates
  }
}

// Rate webhook integration for automated updates
export const createRateWebhook = async (rateData: Omit<RateData, 'id' | 'created_at'>[]): Promise<boolean> => {
  try {
    const success = await RateService.storeRateData(rateData)
    
    if (success) {
      // Trigger rate alert checks
      const alerts = await RateService.checkRateAlerts()
      
      // Log alerts for now - in production, send notifications
      if (alerts.length > 0) {
        console.log('Rate alerts triggered:', alerts)
        
        // TODO: Implement notification system
        // - Email alerts to clients
        // - SMS notifications
        // - Dashboard notifications
        // - Slack/Teams integration
      }
      
      console.log(`Processed ${rateData.length} rate updates, triggered ${alerts.length} alerts`)
    }
    
    return success
  } catch (error) {
    console.error('Rate webhook error:', error)
    return false
  }
}