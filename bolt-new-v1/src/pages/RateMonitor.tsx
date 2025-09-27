import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RateChart } from '../components/Dashboard/RateChart'
import { supabase } from '../lib/supabase'

interface RateData {
  loan_type: string
  rate: number
  change: number
  trend: 'up' | 'down'
  lastUpdate: string
}

export const RateMonitor: React.FC = () => {
  const [rates, setRates] = useState<RateData[]>([
    { loan_type: '30yr', rate: 7.25, change: -0.05, trend: 'down', lastUpdate: '2 min ago' },
    { loan_type: 'fha', rate: 6.95, change: -0.12, trend: 'down', lastUpdate: '5 min ago' },
    { loan_type: 'va', rate: 6.85, change: +0.02, trend: 'up', lastUpdate: '3 min ago' },
    { loan_type: '15yr', rate: 6.75, change: -0.08, trend: 'down', lastUpdate: '1 min ago' }
  ])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const refreshRates = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setRates(prev => prev.map(rate => ({
        ...rate,
        rate: rate.rate + (Math.random() - 0.5) * 0.1,
        change: (Math.random() - 0.5) * 0.2,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        lastUpdate: 'Just now'
      })))
      setLastRefresh(new Date())
      setLoading(false)
    }, 2000)
  }

  const getLoanTypeLabel = (type: string) => {
    switch (type) {
      case '30yr': return '30-Year Fixed'
      case 'fha': return 'FHA Loan'
      case 'va': return 'VA Loan'
      case '15yr': return '15-Year Fixed'
      default: return type
    }
  }

  const alerts = [
    { id: 1, message: 'Sarah Johnson\'s target rate of 6.95% reached for FHA loan', type: 'success', time: '5 min ago' },
    { id: 2, message: '3 clients have target rates within 0.1% of current 30yr rate', type: 'warning', time: '12 min ago' },
    { id: 3, message: 'VA rates dropped below 7% - 5 clients notified automatically', type: 'info', time: '1 hour ago' }
  ]

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
                  {rate.rate.toFixed(3)}%
                </div>
                <p className="text-sm text-gray-500">
                  Updated {rate.lastUpdate}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week high:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {(rate.rate + 0.5).toFixed(3)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">52-week low:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {(rate.rate - 0.8).toFixed(3)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rate Chart */}
      <RateChart title="30-Year Fixed Rate Trends" />

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

      {/* Rate Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">Loan Type</th>
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">Current Rate</th>
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">24h Change</th>
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">7d Change</th>
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-gray-100">Clients Matching</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate, index) => (
                  <tr key={rate.loan_type} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4 font-medium text-gray-900 dark:text-gray-100">
                      {getLoanTypeLabel(rate.loan_type)}
                    </td>
                    <td className="py-4 text-gray-900 dark:text-gray-100">
                      {rate.rate.toFixed(3)}%
                    </td>
                    <td className={`py-4 ${rate.trend === 'down' ? 'text-green-600' : 'text-red-600'}`}>
                      {rate.change > 0 ? '+' : ''}{rate.change.toFixed(3)}%
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-400">
                      -0.12%
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg text-sm">
                        {Math.floor(Math.random() * 8) + 1} clients
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}