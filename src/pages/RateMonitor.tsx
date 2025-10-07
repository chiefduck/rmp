import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Bell, Target, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import HistoricalRateChart from '../components/RateMonitor/HistoricalRateChart'
import { RateService } from '../lib/rateService'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

interface RateDisplayData {
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

export const RateMonitor: React.FC = () => {
  const { info } = useToast()
  const [rates, setRates] = useState<RateDisplayData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [dataLastUpdated, setDataLastUpdated] = useState<string>('')
  const [rateHistory, setRateHistory] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchRates()
    fetchRateHistory()
    fetchRealAlerts()

    // ✅ REAL-TIME SUBSCRIPTION - Updates instantly when GitHub Action adds new rates
    console.log('Setting up real-time rate subscription...')
    const rateSubscription = supabase
      .channel('rate_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rate_history'
        },
        (payload) => {
          console.log('🔔 New rate data received!', payload)
          info('New rates available! Updating...')
          fetchRates()
          fetchRateHistory()
          fetchRealAlerts()
          setLastRefresh(new Date())
        }
      )
      .subscribe()

    // Auto-refresh every 15 minutes as backup
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing rate data...')
      fetchRates()
      fetchRateHistory()
      fetchRealAlerts()
      setLastRefresh(new Date())
    }, 15 * 60 * 1000)

    // Refresh on window focus
    const handleFocus = () => {
      console.log('Window focused - refreshing rates')
      fetchRates()
      fetchRateHistory()
      fetchRealAlerts()
      setLastRefresh(new Date())
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      rateSubscription.unsubscribe()
      clearInterval(refreshInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchRates = async () => {
    try {
      const currentRates = await RateService.getCurrentRates()
      const displayRates: RateDisplayData[] = []
      const rateMapping = {
        '30yr_conventional': { loan_type: 'conventional', label: '30-Year Fixed' },
        '30yr_fha': { loan_type: 'fha', label: 'FHA Loan' },
        '30yr_va': { loan_type: 'va', label: 'VA Loan' },
        '30yr_jumbo': { loan_type: 'jumbo', label: 'Jumbo Loan' }
      }

      Object.entries(rateMapping).forEach(([key, config]) => {
        const rateData = currentRates[key]
        if (rateData) {
          const rateDate = new Date(rateData.rate_date + 'T00:00:00')
          displayRates.push({
            loan_type: config.loan_type,
            rate: rateData.rate_value,
            change: rateData.change_1_day || 0,
            trend: (rateData.change_1_day || 0) > 0 ? 'up' : 'down',
            lastUpdate: rateDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            range_52_week_low: rateData.range_52_week_low,
            range_52_week_high: rateData.range_52_week_high,
            change_1_week: rateData.change_1_week,
            change_1_month: rateData.change_1_month,
            change_1_year: rateData.change_1_year
          })
          if (!dataLastUpdated) setDataLastUpdated(rateData.rate_date)
        }
      })

      try {
        const latest15yr = await RateService.getCurrentRate(15, 'conventional')
        if (latest15yr) {
          displayRates.push({
            loan_type: '15yr',
            rate: latest15yr.rate_value,
            change: latest15yr.change_1_day || 0,
            trend: (latest15yr.change_1_day || 0) > 0 ? 'up' : 'down',
            lastUpdate: new Date(latest15yr.rate_date).toLocaleDateString(),
            range_52_week_low: latest15yr.range_52_week_low,
            range_52_week_high: latest15yr.range_52_week_high,
            change_1_week: latest15yr.change_1_week,
            change_1_month: latest15yr.change_1_month,
            change_1_year: latest15yr.change_1_year
          })
        }
      } catch (error) {
        console.error('Error fetching 15yr rate:', error)
      }

      setRates(displayRates)
    } catch (error) {
      console.error('Error fetching rates:', error)
      setRates([])
    }
  }

  const fetchRateHistory = async () => {
    try {
      const history = await RateService.getRateHistory(30, 'conventional', 30)
      setRateHistory(history)
    } catch (error) {
      console.error('Error fetching rate history:', error)
    }
  }

  const fetchRealAlerts = async () => {
    try {
      const rateAlerts = await RateService.checkRateAlerts()
      const formattedAlerts = rateAlerts.map((alert, index) => ({
        id: index + 1,
        message: `${alert.first_name} ${alert.last_name}'s target rate of ${alert.target_rate}% reached for ${alert.loan_type} loan`,
        type: 'success',
        time: 'Just now',
        urgent: true
      }))

      const currentRates = await RateService.getCurrentRates()
      const marketAlerts: any[] = []

      for (const [key, rateData] of Object.entries(currentRates)) {
        const loanType = key.replace(/^\d+yr_/, '')
        const termYears = key.startsWith('15yr') ? 15 : 30
        try {
          const history = await RateService.getRateHistory(termYears, loanType, 7)
          if (history.length >= 2) {
            const weekChange = history[history.length - 1].rate - history[0].rate
            if (Math.abs(weekChange) > 0.1) {
              marketAlerts.push({
                id: formattedAlerts.length + marketAlerts.length + 1,
                message: `${key.replace('_', ' ')} rates ${weekChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(weekChange).toFixed(2)}% this week`,
                type: weekChange > 0 ? 'warning' : 'info',
                time: '1 hour ago',
                urgent: Math.abs(weekChange) > 0.25
              })
            }
          }
        } catch (error) {
          console.error(`Error checking rate change for ${key}:`, error)
        }
      }

      const allAlerts = [...formattedAlerts, ...marketAlerts]
      if (allAlerts.length === 0) {
        allAlerts.push({
          id: 1,
          message: 'No active alerts - all clients within target ranges',
          type: 'info',
          time: '5 min ago',
          urgent: false
        })
      }
      setAlerts(allAlerts.slice(0, 5))
    } catch (error) {
      console.error('Error fetching real alerts:', error)
      setAlerts([])
    }
  }

  // ✅ Manual refresh triggers fresh scrape from MND
  const refreshRates = async () => {
    setLoading(true)
    try {
      info('Fetching fresh rates from MND...')
      const freshDataSuccess = await RateService.fetchFreshRates()
      
      if (freshDataSuccess) {
        // Wait a bit for data to be written to DB
        await new Promise(resolve => setTimeout(resolve, 2000))
        await fetchRates()
        await fetchRateHistory()
        await fetchRealAlerts()
        setLastRefresh(new Date())
        info('✅ Fresh rates updated successfully!')
      } else {
        // Fallback to just re-fetching existing data
        await fetchRates()
        await fetchRateHistory()
        await fetchRealAlerts()
        setLastRefresh(new Date())
        info('⚠️ Could not fetch fresh data, showing latest available rates')
      }
    } catch (error) {
      console.error('Error refreshing rates:', error)
      // Still try to show existing data
      await fetchRates()
      await fetchRateHistory()
      await fetchRealAlerts()
    } finally {
      setLoading(false)
    }
  }

  const getLoanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conventional: '30-Year Fixed',
      '15yr': '15-Year Fixed',
      fha: 'FHA Loan',
      va: 'VA Loan',
      jumbo: 'Jumbo Loan'
    }
    return labels[type] || type
  }

  const formatDateTime = (date: Date) => date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
  const formatDateOnly = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Rate Monitor</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last refreshed: {formatDateTime(lastRefresh)}</span>
            </div>
            {dataLastUpdated && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="font-medium text-blue-900 dark:text-blue-300">MND Data: {formatDateOnly(dataLastUpdated)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Updates</span>
            </div>
          </div>
        </div>
        <Button onClick={refreshRates} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rates.map((rate) => (
          <Card key={rate.loan_type} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{getLoanTypeLabel(rate.loan_type)}</h3>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${rate.trend === 'up' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                  {rate.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(rate.change).toFixed(3)}%
                </div>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{rate.rate.toFixed(2)}%</div>
                <p className="text-sm text-gray-500">Updated {rate.lastUpdate}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week high:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{rate.range_52_week_high ? `${rate.range_52_week_high.toFixed(2)}%` : '--'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week low:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{rate.range_52_week_low ? `${rate.range_52_week_low.toFixed(2)}%` : '--'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <HistoricalRateChart height={500} variant="full" title="Historical Rate Analytics" className="shadow-lg" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span>Rate Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => {
              const colors = {
                success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
                warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
                info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }
              return (
                <div key={alert.id} className={`p-4 rounded-xl border ${colors[alert.type as keyof typeof colors] || 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900 dark:text-gray-100 flex-1">{alert.message}</p>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">{alert.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Comparison - Live Market Data</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time data from Mortgage News Daily - updates automatically</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {['Loan Type', 'Current', '1 day', '1 week', '1 month', '1 year', '52 Week Range'].map(h => (
                    <th key={h} className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const formatChange = (change: number | undefined) => {
                    if (change === undefined || change === null) return <span className="text-gray-400">--</span>
                    if (change === 0) return <span className="text-blue-600 dark:text-blue-400">+0.00%</span>
                    const isPositive = change > 0
                    return <span className={isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                  }
                  return (
                    <tr key={rate.loan_type} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 font-medium text-gray-900 dark:text-gray-100">{getLoanTypeLabel(rate.loan_type)}</td>
                      <td className="py-4 text-gray-900 dark:text-gray-100 text-lg font-bold">{rate.rate.toFixed(2)}%</td>
                      <td className="py-4">{formatChange(rate.change)}</td>
                      <td className="py-4">{formatChange(rate.change_1_week)}</td>
                      <td className="py-4">{formatChange(rate.change_1_month)}</td>
                      <td className="py-4">{formatChange(rate.change_1_year)}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {rate.range_52_week_low && rate.range_52_week_high ? `${rate.range_52_week_low.toFixed(2)}% - ${rate.range_52_week_high.toFixed(2)}%` : <span className="text-gray-400 italic">Updating...</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            * Data sourced directly from Mortgage News Daily Rate Index<br />
            * Red = rate increase, Green = rate decrease, Blue = no change<br />
            * Updates automatically via real-time subscription
          </div>
        </CardContent>
      </Card>
    </div>
  )
}