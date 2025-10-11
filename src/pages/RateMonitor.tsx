import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import HistoricalRateChart from '../components/RateMonitor/HistoricalRateChart'
import { MonitoringOverview } from '../components/RateMonitor/MonitoringOverview'
import { AddMonitoringClientModal } from '../components/RateMonitor/AddMonitoringClientModal'
import { RateMonitorCard } from '../components/CRM/RateMonitorCard'
import { EditMortgageModal } from '../components/CRM/EditMortgageModal'
import { MortgageDetailsModal } from '../components/CRM/MortgageDetailsModal'
import { RateService } from '../lib/rateService'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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

interface MortgageData {
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

export const RateMonitor: React.FC = () => {
  const { user } = useAuth()
  const { info } = useToast()
  
  const [rates, setRates] = useState<RateDisplayData[]>([])
  const [mortgages, setMortgages] = useState<MortgageData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [dataLastUpdated, setDataLastUpdated] = useState<string>('')
  const [alerts, setAlerts] = useState<any[]>([])
  
  // UI State
  const [showAlerts, setShowAlerts] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedMortgage, setSelectedMortgage] = useState<MortgageData | null>(null)

  useEffect(() => {
    if (user) {
      fetchRates()
      fetchMortgages()
      fetchRealAlerts()
    }

    // Real-time subscription for rate updates
    const rateSubscription = supabase
      .channel('rate_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rate_history' }, () => {
        info('New rates available! Updating...')
        fetchRates()
        fetchMortgages()
        fetchRealAlerts()
        setLastRefresh(new Date())
      })
      .subscribe()

    // Auto-refresh every 15 minutes
    const refreshInterval = setInterval(() => {
      fetchRates()
      fetchMortgages()
      fetchRealAlerts()
      setLastRefresh(new Date())
    }, 15 * 60 * 1000)

    // Refresh on window focus
    const handleFocus = () => {
      fetchRates()
      fetchMortgages()
      fetchRealAlerts()
      setLastRefresh(new Date())
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      rateSubscription.unsubscribe()
      clearInterval(refreshInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

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

  const fetchMortgages = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('mortgages')
        .select(`
          *,
          clients!inner(
            first_name,
            last_name,
            email,
            phone,
            user_id
          )
        `)
        .eq('clients.user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const transformedMortgages = await Promise.all(
        (data || []).map(async (mortgage: any) => {
          const loanType = mortgage.loan_type || 'conventional'
          const termYears = mortgage.term_years || 30
          const marketRate = await RateService.getMarketRate(loanType, termYears)
          
          return {
            ...mortgage,
            client_name: `${mortgage.clients.first_name} ${mortgage.clients.last_name}`,
            first_name: mortgage.clients.first_name,
            last_name: mortgage.clients.last_name,
            phone: mortgage.clients.phone,
            email: mortgage.clients.email,
            market_rate: marketRate,
            savings_potential: calculateSavings(mortgage.current_rate, marketRate, mortgage.loan_amount)
          }
        })
      )
      
      setMortgages(transformedMortgages)
    } catch (error) {
      console.error('Error fetching mortgages:', error)
      setMortgages([])
    }
  }

  const calculateSavings = (currentRate: number, marketRate: number, loanAmount: number) => {
    if (currentRate <= marketRate) return 0
    const months = 360
    const currentMonthlyRate = currentRate / 100 / 12
    const currentPayment = loanAmount * 
      (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, months)) / 
      (Math.pow(1 + currentMonthlyRate, months) - 1)
    const newMonthlyRate = marketRate / 100 / 12
    const newPayment = loanAmount * 
      (newMonthlyRate * Math.pow(1 + newMonthlyRate, months)) / 
      (Math.pow(1 + newMonthlyRate, months) - 1)
    return Math.round(currentPayment - newPayment)
  }

  const handleDeleteMortgage = async (mortgage: MortgageData) => {
    const confirmed = confirm(
      `Delete ${mortgage.client_name}'s mortgage?\n\nThis will remove it from rate monitoring and cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('mortgages')
        .delete()
        .eq('id', mortgage.id)
      
      if (error) throw error
      
      info('Mortgage deleted successfully')
      fetchMortgages()
      
      if (selectedMortgage?.id === mortgage.id) {
        setSelectedMortgage(null)
        setShowEditModal(false)
        setShowDetailsModal(false)
      }
    } catch (error) {
      console.error('Error deleting mortgage:', error)
      info('Failed to delete mortgage. Please try again.')
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

  const refreshRates = async () => {
    setLoading(true)
    try {
      info('Updating market rates...')
      const freshDataSuccess = await RateService.fetchFreshRates()
      
      if (freshDataSuccess) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await fetchRates()
        await fetchMortgages()
        await fetchRealAlerts()
        setLastRefresh(new Date())
        info('✅ Rates updated successfully!')
      } else {
        await fetchRates()
        await fetchMortgages()
        await fetchRealAlerts()
        setLastRefresh(new Date())
        info('⚠️ Could not fetch fresh data, showing latest available rates')
      }
    } catch (error) {
      console.error('Error refreshing rates:', error)
      await fetchRates()
      await fetchMortgages()
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

  const formatDateTime = (date: Date) => date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
  
  const formatDateOnly = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) {
      return <span className="text-gray-400 dark:text-gray-500">--</span>
    }
    if (change === 0) {
      return <span className="text-blue-600 dark:text-blue-400 font-medium">+0.00%</span>
    }
    const isPositive = change > 0
    return (
      <span className={`font-medium ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Rate Monitor</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:flex-wrap">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 min-w-0">
              <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="truncate">Last: {formatDateTime(lastRefresh)}</span>
            </div>
            {dataLastUpdated && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 px-2 md:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-full">
                <Activity className="w-3 h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-400 animate-pulse flex-shrink-0" />
                <span className="font-medium text-blue-900 dark:text-blue-300 truncate">
                  Data: {formatDateOnly(dataLastUpdated)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="whitespace-nowrap">Live</span>
            </div>
          </div>
        </div>
        
        <Button onClick={refreshRates} loading={loading} className="w-full sm:w-auto flex-shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Add Closed Client Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Closed Client
        </Button>
      </div>

      {/* Monitoring Overview */}
      {mortgages.length > 0 && (
        <MonitoringOverview
          mortgages={mortgages}
          currentMarketRate={rates.find(r => r.loan_type === 'conventional')?.rate || 6.5}
          onViewMortgage={(mortgage) => {
            setSelectedMortgage(mortgage)
            setShowDetailsModal(true)
          }}
        />
      )}

      {/* Current Rates Grid - Moved to top */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {rates.map((rate) => (
          <Card key={rate.loan_type} hover>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate flex-1 pr-2">
                  {getLoanTypeLabel(rate.loan_type)}
                </h3>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                  rate.trend === 'up' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                    : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {rate.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(rate.change).toFixed(3)}%
                </div>
              </div>
              <div className="mb-3 md:mb-4">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {rate.rate.toFixed(2)}%
                </div>
                <p className="text-xs md:text-sm text-gray-500 truncate">Updated {rate.lastUpdate}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm gap-2">
                  <span className="text-gray-600 dark:text-gray-400 truncate">52-week high:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {rate.range_52_week_high ? `${rate.range_52_week_high.toFixed(2)}%` : '--'}
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm gap-2">
                  <span className="text-gray-600 dark:text-gray-400 truncate">52-week low:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {rate.range_52_week_low ? `${rate.range_52_week_low.toFixed(2)}%` : '--'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mortgage Cards Grid */}
      {mortgages.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monitored Clients</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mortgages.map(mortgage => (
              <RateMonitorCard 
                key={mortgage.id} 
                mortgage={mortgage}
                onEdit={(m) => {
                  setSelectedMortgage(m)
                  setShowEditModal(true)
                }}
                onViewDetails={(m) => {
                  setSelectedMortgage(m)
                  setShowDetailsModal(true)
                }}
                onDelete={handleDeleteMortgage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historical Rate Chart */}
      <HistoricalRateChart height={300} variant="full" title="Historical Rate Analytics" className="shadow-lg" />

      {/* Rate Alerts - Collapsible */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              <span>Rate Alerts ({alerts.length})</span>
            </CardTitle>
            {showAlerts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </CardHeader>
        {showAlerts && (
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {alerts.map((alert) => {
                const colors = {
                  success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
                  warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
                  info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                }
                return (
                  <div 
                    key={alert.id} 
                    className={`p-3 md:p-4 rounded-xl border ${colors[alert.type as keyof typeof colors] || 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs md:text-sm text-gray-900 dark:text-gray-100 flex-1 break-words">
                        {alert.message}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{alert.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Rate Comparison Table - Collapsible */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div>
              <CardTitle className="text-base md:text-lg">Rate Comparison - Live Market Data</CardTitle>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time mortgage rate data - updates automatically every 15 minutes
              </p>
            </div>
            {showComparison ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </CardHeader>
        {showComparison && (
          <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {rates.map((rate) => (
                <div key={rate.loan_type} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{getLoanTypeLabel(rate.loan_type)}</h4>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{rate.rate.toFixed(2)}%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                      <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Day</span>
                      {formatChange(rate.change)}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                      <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Week</span>
                      {formatChange(rate.change_1_week)}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                      <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Month</span>
                      {formatChange(rate.change_1_month)}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                      <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Year</span>
                      {formatChange(rate.change_1_year)}
                    </div>
                  </div>
                  
                  {rate.range_52_week_low && rate.range_52_week_high && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-600 dark:text-gray-400">52-Week Range:</span>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {rate.range_52_week_low.toFixed(2)}% - {rate.range_52_week_high.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Loan Type', 'Current', '1 day', '1 week', '1 month', '1 year', '52 Week Range'].map(h => (
                      <th key={h} className="text-left py-3 px-2 font-medium text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.loan_type} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {getLoanTypeLabel(rate.loan_type)}
                      </td>
                      <td className="py-4 px-2 text-gray-900 dark:text-gray-100 text-lg font-bold whitespace-nowrap">
                        {rate.rate.toFixed(2)}%
                      </td>
                      <td className="py-4 px-2">{formatChange(rate.change)}</td>
                      <td className="py-4 px-2">{formatChange(rate.change_1_week)}</td>
                      <td className="py-4 px-2">{formatChange(rate.change_1_month)}</td>
                      <td className="py-4 px-2">{formatChange(rate.change_1_year)}</td>
                      <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">
                        {rate.range_52_week_low && rate.range_52_week_high 
                          ? `${rate.range_52_week_low.toFixed(2)}% - ${rate.range_52_week_high.toFixed(2)}%` 
                          : <span className="text-gray-400 italic">Updating...</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">⚠️ Disclaimer</h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Rates shown are national averages for reference only and may not reflect current market conditions</p>
                <p>• Always verify rates directly with your lender before making financial decisions</p>
                <p>• Rate Monitor Pro aggregates data from publicly available market sources</p>
                <p>• Updates automatically via real-time monitoring - Red = rate increase, Green = rate decrease</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modals */}
      <AddMonitoringClientModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onClientAdded={() => {
          fetchMortgages()
          fetchRealAlerts()
        }} 
      />
      
      <EditMortgageModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false)
          setSelectedMortgage(null)
        }} 
        mortgage={selectedMortgage} 
        onMortgageUpdated={() => {
          fetchMortgages()
          fetchRealAlerts()
        }} 
      />
      
      <MortgageDetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedMortgage(null)
        }} 
        mortgage={selectedMortgage} 
        onEdit={(m) => {
          setShowDetailsModal(false)
          setSelectedMortgage(m)
          setShowEditModal(true)
        }} 
        onDelete={handleDeleteMortgage} 
      />
    </div>
  )
}