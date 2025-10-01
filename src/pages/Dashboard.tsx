import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingDown, Phone, Mail, DollarSign, Target, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'
import { StatsCard } from '../components/Dashboard/StatsCard'
import { RateChart } from '../components/Dashboard/RateChart'
import { RecentActivity } from '../components/Dashboard/RecentActivity'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { RateService } from '../lib/rateService'

interface MarketData {
  current_30yr: number | null
  current_15yr: number | null
  current_fha: number | null
  current_va: number | null
  current_jumbo: number | null
  change_1day_30yr: number | null
  change_1week_30yr: number | null
  change_1month_30yr: number | null
  last_updated: string | null
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [rateHistory, setRateHistory] = useState<Array<{ date: string; rate: number }>>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeOpportunities: 0,
    callsMade: 12,
    emailsSent: 48,
    pipelineValue: 2450000,
    conversionRate: 34.5
  })

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  // Refresh data when user navigates back to dashboard
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData()
      setRefreshTrigger(prev => prev + 1) // Trigger RecentActivity refresh
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch client stats
      const [
        { count: clientCount },
        { count: opportunityCount },
        { data: pipelineData },
        currentRates,
        historyData
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('current_stage', ['qualified', 'application']),
        supabase.from('clients').select('loan_amount').eq('user_id', user.id).not('loan_amount', 'is', null),
        RateService.getCurrentRates(),
        RateService.getRateHistory(30, 'conventional', 30)
      ])

      const pipelineValue = pipelineData?.reduce((sum, client) => sum + (client.loan_amount || 0), 0) || 0

      setStats(prev => ({
        ...prev,
        totalClients: clientCount || 0,
        activeOpportunities: opportunityCount || 0,
        pipelineValue
      }))

      setMarketData({
        current_30yr: currentRates['30yr_conventional']?.rate_value || null,
        current_15yr: currentRates['15yr_conventional']?.rate_value || null,
        current_fha: currentRates['30yr_fha']?.rate_value || null,
        current_va: currentRates['30yr_va']?.rate_value || null,
        current_jumbo: currentRates['30yr_jumbo']?.rate_value || null,
        change_1day_30yr: currentRates['30yr_conventional']?.change_1_day || null,
        change_1week_30yr: currentRates['30yr_conventional']?.change_1_week || null,
        change_1month_30yr: currentRates['30yr_conventional']?.change_1_month || null,
        last_updated: currentRates['30yr_conventional']?.rate_date || null
      })

      // Convert RateTrend[] to the format expected by RateChart
      const chartData = historyData?.map(trend => ({
        date: trend.date,
        rate: trend.rate
      })) || []
      setRateHistory(chartData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const calculateOpportunities = (currentRates: any, clientsWithRates: any[]) => {
    const marketRate30yr = currentRates['30yr_conventional']?.rate_value
    const dailyChange = currentRates['30yr_conventional']?.change_1_day
    const weeklyChange = currentRates['30yr_conventional']?.change_1_week

    // Calculate daily insight
    let dailyInsight = ''
    let dailyColor = 'text-blue-800 dark:text-blue-400'
    
    if (dailyChange !== null && dailyChange !== undefined) {
      if (Math.abs(dailyChange) < 0.05) {
        dailyInsight = `Rates stable at ${marketRate30yr?.toFixed(3)}% - steady market conditions`
        dailyColor = 'text-blue-800 dark:text-blue-400'
      } else if (dailyChange > 0) {
        dailyInsight = `Rates increased ${Math.abs(dailyChange).toFixed(3)}% - advise clients to lock soon`
        dailyColor = 'text-red-800 dark:text-red-400'
      } else {
        dailyInsight = `Rates dropped ${Math.abs(dailyChange).toFixed(3)}% - contact prospects immediately`
        dailyColor = 'text-green-800 dark:text-green-400'
      }
    } else {
      dailyInsight = 'Rate data loading...'
    }

    // Calculate weekly trend insight
    let weeklyInsight = ''
    let weeklyColor = 'text-green-800 dark:text-green-400'
    
    if (weeklyChange !== null && weeklyChange !== undefined) {
      if (weeklyChange < -0.1) {
        weeklyInsight = `Strong downward trend - best refinance window in weeks`
        weeklyColor = 'text-green-800 dark:text-green-400'
      } else if (weeklyChange > 0.1) {
        weeklyInsight = `Rates rising fast - time-sensitive lock recommendations`
        weeklyColor = 'text-red-800 dark:text-red-400'
      } else {
        weeklyInsight = `Moderate weekly movement - normal market conditions`
        weeklyColor = 'text-gray-800 dark:text-gray-400'
      }
    } else {
      weeklyInsight = 'Calculating weekly trends...'
    }

    // Calculate opportunity insight based on client portfolio
    let opportunityInsight = ''
    let opportunityColor = 'text-purple-800 dark:text-purple-400'
    
    if (clientsWithRates.length > 0 && marketRate30yr) {
      const refinanceCandidates = clientsWithRates.filter(client => 
        client.current_rate && (client.current_rate - marketRate30yr) >= 0.25
      )
      
      const highValueCandidates = refinanceCandidates.filter(client =>
        client.loan_amount && client.loan_amount >= 200000
      )

      if (refinanceCandidates.length === 0) {
        opportunityInsight = 'Portfolio rates competitive - focus on new purchase leads'
        opportunityColor = 'text-blue-800 dark:text-blue-400'
      } else if (highValueCandidates.length >= 3) {
        opportunityInsight = `${refinanceCandidates.length} clients qualify for refinance - ${highValueCandidates.length} high-value prospects`
        opportunityColor = 'text-green-800 dark:text-green-400'
      } else if (refinanceCandidates.length >= 2) {
        opportunityInsight = `${refinanceCandidates.length} refinance opportunities - reach out today`
        opportunityColor = 'text-blue-800 dark:text-blue-400'
      } else {
        opportunityInsight = `${refinanceCandidates.length} client qualifies for refinance savings`
        opportunityColor = 'text-purple-800 dark:text-purple-400'
      }
    } else {
      // This means we have clients but no current_rate data
      opportunityInsight = 'Opportunity analysis available with client rate data'
      opportunityColor = 'text-gray-800 dark:text-gray-400'
    }

    setOpportunityInsights({
      dailyInsight,
      weeklyInsight,
      opportunityInsight,
      dailyColor,
      weeklyColor,
      opportunityColor
    })
  }

  const handleRefreshRates = async () => {
    setIsRefreshing(true)
    try {
      await RateService.fetchFreshRates()
      await fetchDashboardData()
    } catch (error) {
      console.error('Error refreshing rates:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getChangeColor = (change: number | null) => {
    if (!change) return 'text-gray-500'
    return change > 0 ? 'text-red-500' : 'text-green-500'
  }

  const getChangeIcon = (change: number | null) => {
    if (!change) return null
    return change > 0 ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        
        {/* Glassmorphism overlay */}
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">
                Welcome back! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Here's what's happening with your mortgage business today.
              </p>
            </div>
            <button
              onClick={handleRefreshRates}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh Rates</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Rate Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: '30yr Fixed', current: marketData?.current_30yr, change: marketData?.change_1day_30yr, gradient: 'from-blue-500 to-blue-600' },
          { label: '15yr Fixed', current: marketData?.current_15yr, change: marketData?.change_1day_30yr, gradient: 'from-green-500 to-green-600' },
          { label: 'FHA', current: marketData?.current_fha, change: marketData?.change_1day_30yr, gradient: 'from-purple-500 to-purple-600' },
          { label: 'VA', current: marketData?.current_va, change: marketData?.change_1day_30yr, gradient: 'from-orange-500 to-orange-600' },
          { label: 'Jumbo', current: marketData?.current_jumbo, change: marketData?.change_1day_30yr, gradient: 'from-red-500 to-red-600' }
        ].map((rate, index) => (
          <div key={index} className="relative group">
            {/* Glassmorphism Card */}
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-4 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
              <div className={`w-10 h-10 bg-gradient-to-r ${rate.gradient} rounded-xl flex items-center justify-center mb-3`}>
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                {rate.label}
              </h3>
              
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {rate.current ? `${rate.current.toFixed(3)}%` : '-.---'}
                </span>
                
                {rate.change && (
                  <div className={`flex items-center gap-1 ${getChangeColor(rate.change)}`}>
                    {React.createElement(getChangeIcon(rate.change) || TrendingDown, { className: 'w-3 h-3' })}
                    <span className="text-xs font-medium">
                      {Math.abs(rate.change).toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Grid with Glassmorphism */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clients</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClients}</p>
        {stats.totalClients > 0 ? (
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            {stats.totalClients === 1 ? 'Your first client' : 'Growing your pipeline'}
          </p>
        ) : (
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Add your first client</p>
        )}
      </div>
      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
        <Users className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>

  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Opportunities</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeOpportunities}</p>
        {stats.activeOpportunities > 0 ? (
          <p className="text-sm mt-1 text-green-600 dark:text-green-400">
            {stats.activeOpportunities === 1 ? '1 hot lead' : `${stats.activeOpportunities} hot leads`}
          </p>
        ) : (
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">No active opportunities yet</p>
        )}
      </div>
      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
        <Target className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>

  <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pipeline Value</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.pipelineValue)}</p>
        {stats.pipelineValue > 0 ? (
          <p className="text-sm mt-1 text-green-600 dark:text-green-400">
            {stats.totalClients > 0 
              ? `Avg ${formatCurrency(stats.pipelineValue / stats.totalClients)} per client`
              : 'Building your pipeline'
            }
          </p>
        ) : (
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Add loan amounts to track</p>
        )}
      </div>
      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
        <DollarSign className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
</div>

      {/* Quick Actions with Glassmorphism - Now in Center */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/crm')}
            className="flex flex-col items-center p-4 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Add Client</span>
          </button>
          
          <button 
            onClick={() => navigate('/calling')}
            className="flex flex-col items-center p-4 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/70 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <Phone className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">Start Calling</span>
          </button>
          
          <button 
            onClick={() => navigate('/rates')}
            className="flex flex-col items-center p-4 bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <TrendingDown className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">View Rates</span>
          </button>
          
          <button 
            onClick={() => navigate('/ai-assistant')}
            className="flex flex-col items-center p-4 bg-orange-50/50 dark:bg-orange-900/20 hover:bg-orange-100/70 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <Mail className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl overflow-hidden">
          <RateChart 
            data={rateHistory} 
            title="30yr Fixed Rate Trends (Last 30 Days)"
          />
        </div>
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl overflow-hidden">
          <RecentActivity refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}