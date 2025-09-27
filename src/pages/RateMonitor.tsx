// File: src/pages/RateMonitor.tsx
import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Bell, Target } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import HistoricalRateChart from '../components/RateMonitor/HistoricalRateChart'
import { RateService } from '../lib/rateService'
import { supabase } from '../lib/supabase'

interface RateDisplayData {
  loan_type: string
  rate: number
  change: number
  trend: 'up' | 'down'
  lastUpdate: string
  // Add the MND data fields
  range_52_week_low?: number
  range_52_week_high?: number
  change_1_week?: number
  change_1_month?: number
  change_1_year?: number
  // Remove this since we removed the clients column
  // clientsMatching?: number
}

export const RateMonitor: React.FC = () => {
  const [rates, setRates] = useState<RateDisplayData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [rateHistory, setRateHistory] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchRates()
    fetchRateHistory()
    fetchRealAlerts()
  }, [])

  const fetchRates = async () => {
    try {
      const currentRates = await RateService.getCurrentRates()
      const displayRates: RateDisplayData[] = []
  
      console.log('Raw current rates:', currentRates)
  
      // Define exactly which rates we want to display
      const rateMapping = {
        '30yr_conventional': { loan_type: 'conventional', label: '30-Year Fixed' },
        '30yr_fha': { loan_type: 'fha', label: 'FHA Loan' },
        '30yr_va': { loan_type: 'va', label: 'VA Loan' },
        '30yr_jumbo': { loan_type: 'jumbo', label: 'Jumbo Loan' }
      }
  
      // Process existing rates
      Object.entries(rateMapping).forEach(([key, config]) => {
        const rateData = currentRates[key]
        if (rateData) {
          displayRates.push({
            loan_type: config.loan_type,
            rate: rateData.rate_value,
            change: rateData.change_1_day || 0,
            trend: (rateData.change_1_day || 0) > 0 ? 'up' : 'down',
            lastUpdate: new Date(rateData.rate_date).toLocaleDateString(),
            range_52_week_low: rateData.range_52_week_low,
            range_52_week_high: rateData.range_52_week_high,
            change_1_week: rateData.change_1_week,
            change_1_month: rateData.change_1_month,
            change_1_year: rateData.change_1_year
          })
        }
      })
  
      // Always add 15yr rate - get latest available
      try {
        const latest15yr = await RateService.getCurrentRate(15, '15yr_conventional')
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
      const history = await RateService.getRateHistory(30, 'conventional', 30) // 30-year rates, last 30 days
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

      // Add some market alerts based on rate changes
      const currentRates = await RateService.getCurrentRates()
      const marketAlerts: any[] = []

      // Check for significant rate movements
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
      
      // Add message if no real alerts
      if (allAlerts.length === 0) {
        allAlerts.push({
          id: 1,
          message: 'No active alerts - all clients within target ranges',
          type: 'info',
          time: '5 min ago',
          urgent: false
        })
      }

      setAlerts(allAlerts.slice(0, 5)) // Show max 5 alerts
    } catch (error) {
      console.error('Error fetching real alerts:', error)
      setAlerts([]) // Empty array instead of fake alerts
    }
  }

  const refreshRates = async () => {
    setLoading(true)
    try {
      console.log('Fetching fresh rates from MND...')
      
      // First, try to get fresh data from MND
      const freshDataSuccess = await RateService.fetchFreshRates()
      
      if (freshDataSuccess) {
        console.log('✅ Successfully fetched fresh MND data')
        // Wait a moment for data to be stored
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log('⚠️ Failed to fetch fresh data, using existing database data')
      }
      
      // Now refresh the UI with latest data (fresh or existing)
      await fetchRates()
      await fetchRateHistory()
      await fetchRealAlerts()
      setLastRefresh(new Date())
      
      if (freshDataSuccess) {
        alert('✅ Rates updated with fresh data!')
      } else {
        alert('⚠️ Refreshed with existing data. Fresh data fetch failed')
      }
      
    } catch (error) {
      console.error('Error refreshing rates:', error)
      alert('❌ Failed to refresh rates.')
    } finally {
      setLoading(false)
    }
  }

  const getLoanTypeLabel = (type: string) => {
    switch (type) {
      case 'conventional': return '30-Year Fixed'
      case '15yr_conventional': return '15-Year Fixed'
      case 'fha': return 'FHA Loan'
      case 'va': return 'VA Loan'
      case 'jumbo': return 'Jumbo Loan'
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rate Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={refreshRates} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Rates
        </Button>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rates.map((rate) => (
          <Card key={rate.loan_type} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {getLoanTypeLabel(rate.loan_type)}
                </h3>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  rate.trend === 'up' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                    : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {rate.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(rate.change).toFixed(3)}%
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {rate.rate.toFixed(2)}%
                </div>
                <p className="text-sm text-gray-500">
                  Updated {rate.lastUpdate}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week high:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {(rate.rate + 0.5).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week low:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {(rate.rate - 0.8).toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical Rate Chart with Real Data */}
      <HistoricalRateChart 
        height={500}
        variant="full"
        title="Historical Rate Analytics"
        className="shadow-lg"
      />

      {/* Rate Alerts */}
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
              const getAlertColor = (type: string) => {
                switch (type) {
                  case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                }
              }

              return (
                <div key={alert.id} className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                      {alert.message}
                    </p>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {alert.time}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      
      // Rate Comparison Table - Complete MND Format (No Clients Column)
<Card>
  <CardHeader>
    <CardTitle>Rate Comparison - Live Market Data</CardTitle>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Real-time data from Mortgage News Daily - updated daily
    </p>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">Loan Type</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">Current</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">1 day</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">1 week</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">1 month</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">1 year</th>
            <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">52 Week Range</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            // Helper function to format change with color
            const formatChange = (change: number | undefined) => {
              if (change === undefined || change === null) return <span className="text-gray-400">--</span>
              
              if (change === 0) {
                return <span className="text-blue-600 dark:text-blue-400">+0.00%</span>
              }
              
              const isPositive = change > 0
              const colorClass = isPositive 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
              
              return (
                <span className={colorClass}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
              )
            }

            return (
              <tr key={rate.loan_type} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-4 font-medium text-gray-900 dark:text-gray-100">
                  {getLoanTypeLabel(rate.loan_type)}
                </td>
                <td className="py-4 text-gray-900 dark:text-gray-100 text-lg font-bold">
                  {rate.rate.toFixed(2)}%
                </td>
                <td className="py-4">
                  {formatChange(rate.change)}
                </td>
                <td className="py-4">
                  {formatChange(rate.change_1_week)}
                </td>
                <td className="py-4">
                  {formatChange(rate.change_1_month)}
                </td>
                <td className="py-4">
                  {formatChange(rate.change_1_year)}
                </td>
                <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                  {rate.range_52_week_low && rate.range_52_week_high ? (
                    `${rate.range_52_week_low.toFixed(2)}% - ${rate.range_52_week_high.toFixed(2)}%`
                  ) : (
                    <span className="text-gray-400 italic">Updating...</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
      * Data sourced directly from Mortgage News Daily Rate Index
      <br />
      * Red = rate increase, Green = rate decrease, Blue = no change
    </div>
  </CardContent>
</Card>

      {/* Development Tools */}
      {import.meta.env.VITE_APP_ENV === 'development' && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              Development Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tools for testing real data integration:
              </p>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const success = await RateService.fetchFreshRates()
                    if (success) {
                      await fetchRates()
                      await fetchRateHistory()
                      await fetchRealAlerts()
                      alert('Fresh rates fetched successfully!')
                    } else {
                      alert('Failed to fetch fresh rates')
                    }
                  }}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Fetch Fresh Rates
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const alerts = await RateService.checkRateAlerts()
                    console.log('Rate alerts:', alerts)
                    alert(`Found ${alerts.length} rate alerts - check console`)
                  }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Check Rate Alerts
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Current rates:', rates)
                    console.log('Rate history:', rateHistory)
                    console.log('Alerts:', alerts)
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Debug Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}