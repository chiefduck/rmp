import { supabase } from './supabase'

export interface RateData {
  id: string
  rate_date: string
  rate_type: string
  rate_value: number
  term_years: number
  created_at: string
}

export interface RateTrend {
  date: string
  rate: number
  change?: number
}

export class RateService {
  // Fetch current rates for all loan types
  static async getCurrentRates(): Promise<Record<string, RateData>> {
    try {
      const { data, error } = await supabase
        .from('rate_history')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(4) // Get latest rate for each term

      if (error) throw error

      // Group by term_years to get latest rate for each
      const ratesByTerm: Record<string, RateData> = {}
      data?.forEach(rate => {
        const key = `${rate.term_years}yr`
        if (!ratesByTerm[key] || new Date(rate.rate_date) > new Date(ratesByTerm[key].rate_date)) {
          ratesByTerm[key] = rate
        }
      })

      return ratesByTerm
    } catch (error) {
      console.error('Error fetching current rates:', error)
      return {}
    }
  }

  // Fetch rate history for a specific term
  static async getRateHistory(termYears: number, days: number = 30): Promise<RateTrend[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('rate_history')
        .select('rate_date, rate_value')
        .eq('term_years', termYears)
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

  // Store new rate data (for Python scraper integration)
  static async storeRateData(rates: {
    rate_date: string
    rate_type: string
    rate_value: number
    term_years: number
  }[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rate_history')
        .upsert(rates, {
          onConflict: 'rate_date,term_years'
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error storing rate data:', error)
      return false
    }
  }

  // Get rate alerts for clients whose target rates have been reached
  static async checkRateAlerts(): Promise<{
    client_id: string
    first_name: string
    last_name: string
    target_rate: number
    current_rate: number
    loan_type: string
  }[]> {
    try {
      // This would typically join clients with current rates
      // For now, return mock data structure
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, target_rate, loan_type')
        .not('target_rate', 'is', null)

      if (error) throw error

      const currentRates = await this.getCurrentRates()
      const alerts: any[] = []

      clients?.forEach(client => {
        const rateKey = client.loan_type === '30yr' ? '30yr' : 
                       client.loan_type === '15yr' ? '15yr' : '30yr'
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

  // Generate mock rate data for development
  static generateMockRates(days: number = 30): {
    rate_date: string
    rate_type: string
    rate_value: number
    term_years: number
  }[] {
    const rates: any[] = []
    const baseRates = { 30: 7.25, 15: 6.75 }
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      Object.entries(baseRates).forEach(([term, baseRate]) => {
        // Add some realistic variation
        const variation = (Math.random() - 0.5) * 0.2 + Math.sin(i * 0.1) * 0.1
        const rate = baseRate + variation

        rates.push({
          rate_date: dateStr,
          rate_type: 'Fixed',
          rate_value: Math.round(rate * 1000) / 1000, // Round to 3 decimal places
          term_years: parseInt(term)
        })
      })
    }

    return rates
  }
}

// Python scraper integration endpoint
export const createRateWebhook = async (rateData: any[]) => {
  try {
    const success = await RateService.storeRateData(rateData)
    
    if (success) {
      // Trigger rate alert checks
      const alerts = await RateService.checkRateAlerts()
      
      // Here you would typically send notifications to clients
      // For now, just log the alerts
      if (alerts.length > 0) {
        console.log('Rate alerts triggered:', alerts)
      }
    }
    
    return success
  } catch (error) {
    console.error('Rate webhook error:', error)
    return false
  }
}