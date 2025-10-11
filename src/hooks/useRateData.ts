// src/hooks/useRateData.ts
import { useState, useEffect } from 'react'
import { RateService } from '../lib/rateService'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { calculateMonthlySavings } from '../utils/calculations'
import { REFRESH_INTERVALS } from '../utils/constants'

export interface RateDisplayData {
  loan_type: string
  rate: number
  change: number
  trend: 'up' | 'down'
  lastUpdate: string
  range_52_week_low?: number
  range_52_week_high?: number
  change_1_week?: number
  change_1_month?: number
  change_1_year?: number
}

export interface MortgageData {
  id: string
  client_id: string
  client_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  current_rate: number
  target_rate: number
  loan_amount: number
  term_years: number
  start_date: string
  lender: string
  notes?: string
  refi_eligible_date?: string
  created_at: string
  updated_at: string
  last_contact?: string
  last_ai_call?: string
  total_ai_calls?: number
  market_rate?: number
  savings_potential?: number
}

export interface Alert {
  id: number
  message: string
  type: 'success' | 'warning' | 'info'
  time: string
  urgent: boolean
}

export const useRateData = (userId: string | undefined) => {
  const { info } = useToast()
  
  const [rates, setRates] = useState<RateDisplayData[]>([])
  const [mortgages, setMortgages] = useState<MortgageData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [dataLastUpdated, setDataLastUpdated] = useState<string>('')

  useEffect(() => {
    if (userId) {
      fetchAll()
    }

    // Real-time subscription
    const subscription = supabase
      .channel('rate_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'rate_history' 
      }, () => {
        info('New rates available! Updating...')
        fetchAll()
      })
      .subscribe()

    // Auto-refresh using constant
    const interval = setInterval(fetchAll, REFRESH_INTERVALS.RATES)

    // Refresh on focus
    const handleFocus = () => fetchAll()
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [userId])

  const fetchAll = async () => {
    await Promise.all([
      fetchRates(),
      fetchMortgages(),
      fetchAlerts()
    ])
    setLastRefresh(new Date())
    setInitialLoading(false)
  }

  const fetchRates = async () => {
    try {
      const currentRates = await RateService.getCurrentRates()
      const displayRates: RateDisplayData[] = []
      
      const rateMapping = {
        '30yr_conventional': 'conventional',
        '30yr_fha': 'fha',
        '30yr_va': 'va',
        '30yr_jumbo': 'jumbo'
      }

      Object.entries(rateMapping).forEach(([key, loanType]) => {
        const rateData = currentRates[key]
        if (rateData) {
          displayRates.push({
            loan_type: loanType,
            rate: rateData.rate_value,
            change: rateData.change_1_day || 0,
            trend: (rateData.change_1_day || 0) > 0 ? 'up' : 'down',
            lastUpdate: new Date(rateData.rate_date + 'T00:00:00').toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric' 
            }),
            range_52_week_low: rateData.range_52_week_low,
            range_52_week_high: rateData.range_52_week_high,
            change_1_week: rateData.change_1_week,
            change_1_month: rateData.change_1_month,
            change_1_year: rateData.change_1_year
          })
          if (!dataLastUpdated) setDataLastUpdated(rateData.rate_date)
        }
      })

      // Add 15yr rate
      try {
        const rate15yr = await RateService.getCurrentRate(15, 'conventional')
        if (rate15yr) {
          displayRates.push({
            loan_type: '15yr',
            rate: rate15yr.rate_value,
            change: rate15yr.change_1_day || 0,
            trend: (rate15yr.change_1_day || 0) > 0 ? 'up' : 'down',
            lastUpdate: new Date(rate15yr.rate_date).toLocaleDateString(),
            range_52_week_low: rate15yr.range_52_week_low,
            range_52_week_high: rate15yr.range_52_week_high,
            change_1_week: rate15yr.change_1_week,
            change_1_month: rate15yr.change_1_month,
            change_1_year: rate15yr.change_1_year
          })
        }
      } catch (error) {
        console.error('Error fetching 15yr rate:', error)
      }

      setRates(displayRates)
    } catch (error) {
      console.error('Error fetching rates:', error)
    }
  }

  const fetchMortgages = async () => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from('mortgages')
        .select(`*, clients!inner(first_name, last_name, email, phone, user_id)`)
        .eq('clients.user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const enriched = await Promise.all(
        (data || []).map(async (m: any) => {
          const marketRate = await RateService.getMarketRate(
            m.loan_type || 'conventional', 
            m.term_years || 30
          )
          return {
            ...m,
            client_name: `${m.clients.first_name} ${m.clients.last_name}`,
            first_name: m.clients.first_name,
            last_name: m.clients.last_name,
            phone: m.clients.phone,
            email: m.clients.email,
            market_rate: marketRate,
            savings_potential: calculateSavings(m.current_rate, marketRate, m.loan_amount)
          }
        })
      )
      
      setMortgages(enriched)
    } catch (error) {
      console.error('Error fetching mortgages:', error)
    }
  }

  const calculateSavings = (
    currentRate: number, 
    marketRate: number, 
    loanAmount: number
  ): number => {
    return calculateMonthlySavings(loanAmount, currentRate, marketRate, 30)
  }

  const fetchAlerts = async () => {
    try {
      const rateAlerts = await RateService.checkRateAlerts()
      const formatted = rateAlerts.map((a, i) => ({
        id: i + 1,
        message: `${a.first_name} ${a.last_name}'s target rate of ${a.target_rate}% reached for ${a.loan_type} loan`,
        type: 'success' as const,
        time: 'Just now',
        urgent: true
      }))

      if (formatted.length === 0) {
        formatted.push({
          id: 1,
          message: 'No active alerts - all clients within target ranges',
          type: 'info' as const,
          time: '5 min ago',
          urgent: false
        })
      }
      
      setAlerts(formatted.slice(0, 5))
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const refreshRates = async () => {
    setLoading(true)
    try {
      info('Updating market rates...')
      await RateService.fetchFreshRates()
      await new Promise(resolve => setTimeout(resolve, 2000))
      await fetchAll()
      info('✅ Rates updated successfully!')
    } catch (error) {
      console.error('Error refreshing:', error)
      await fetchAll()
      info('⚠️ Showing latest available rates')
    } finally {
      setLoading(false)
    }
  }

  return {
    rates,
    mortgages,
    alerts,
    loading,
    initialLoading,
    lastRefresh,
    dataLastUpdated,
    fetchAll,
    refreshRates
  }
}