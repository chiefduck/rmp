// src/pages/AutoCalling.tsx - AI CALLING CONTROL CENTER (NO COST DISPLAY)
import React, { useState, useEffect } from 'react'
import { Phone, TrendingUp, Clock, Zap, CheckCircle, XCircle, RefreshCw, Search, Plus, BarChart3, List } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { CallDetailModal } from '../components/AutoCalling/CallDetailModal'
import { ManualCallTrigger } from '../components/AutoCalling/ManualCallTrigger'
import { 
  TotalCallsModal, 
  SuccessRateModal, 
  AvgDurationModal, 
  TotalCostModal 
} from '../components/AutoCalling/AutoCallingModals'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import BlandService, { CallLogEntry } from '../lib/blandService'
import { DashboardLoadingSkeleton, EmptyState } from '../components/ui/Skeletons'
import { CallAnalyticsCharts } from '../components/AutoCalling/CallAnalyticsCharts'

// Import LiveCallMonitor separately
import { LiveCallMonitor } from '../components/AutoCalling/LiveCallMonitor'

export const AutoCalling: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError, info } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([])
  const [stats, setStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalDuration: 0,
    totalCost: 0,
    averageDuration: 0,
    successRate: 0
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [activeTab, setActiveTab] = useState<'calls' | 'analytics'>('calls')
  
  // Modal state
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCallTrigger, setShowCallTrigger] = useState(false)
  
  // Stats Modal states
  const [showTotalCallsModal, setShowTotalCallsModal] = useState(false)
  const [showSuccessRateModal, setShowSuccessRateModal] = useState(false)
  const [showAvgDurationModal, setShowAvgDurationModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, dateRange, statusFilter])

  const fetchData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Calculate date range
      let startDate: string | undefined
      const now = new Date()
      
      if (dateRange === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (dateRange === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
      } else if (dateRange === 'month') {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString()
      }
      
      // Fetch call logs
      const logs = await BlandService.getCallLogs({
        userId: user.id,
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate,
        limit: 100
      })
      
      setCallLogs(logs)
      
      // Fetch stats
      const callStats = await BlandService.getCallStats(user.id, 30)
      setStats(callStats)
      
    } catch (error) {
      console.error('Error fetching call data:', error)
      showError('Failed to load call data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    info('Call data refreshed')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'failed':
      case 'no-answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'voicemail':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'initiated':
      case 'ringing':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
      case 'no-answer':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Phone className="w-4 h-4 text-blue-500" />
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes < 1 ? 'Just now' : `${minutes}m ago`
    }
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Filter logs by search
  const filteredLogs = callLogs.filter(log => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      log.client_name?.toLowerCase().includes(search) ||
      log.phone_number?.includes(search)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardLoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-6 pb-20 md:pb-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              AI Calling Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and manage your automated calling system
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCallTrigger(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Call Client Now
            </Button>
            <Button onClick={handleRefresh} loading={refreshing} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Call Monitor */}
        <LiveCallMonitor />

        {/* Stats Cards - CLICKABLE - NO COST */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Calls */}
          <button
            onClick={() => setShowTotalCallsModal(true)}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <Phone className="w-8 h-8 opacity-80" />
              <TrendingUp className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalCalls}</div>
            <div className="text-sm opacity-90">Total Calls</div>
            <div className="text-xs opacity-70 mt-1">Click for details →</div>
          </button>

          {/* Success Rate */}
          <button
            onClick={() => setShowSuccessRateModal(true)}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <div className="text-sm opacity-90">Last 30d</div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm opacity-90">Success Rate</div>
            <div className="text-xs opacity-70 mt-1">Click for details →</div>
          </button>

          {/* Average Duration */}
          <button
            onClick={() => setShowAvgDurationModal(true)}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <div className="text-xs opacity-90">{stats.successfulCalls} calls</div>
            </div>
            <div className="text-2xl font-bold mb-1">{formatDuration(Math.round(stats.averageDuration))}</div>
            <div className="text-sm opacity-90">Avg Duration</div>
            <div className="text-xs opacity-70 mt-1">Click for details →</div>
          </button>

          {/* Credits Used - NO DOLLAR SIGNS */}
          <button
            onClick={() => setShowCreditsModal(true)}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 opacity-80" />
              <div className="text-xs opacity-90">Last 30d</div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalCalls}</div>
            <div className="text-sm opacity-90">Credits Used</div>
            <div className="text-xs opacity-70 mt-1">Click for details →</div>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('calls')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'calls'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <List className="w-5 h-5" />
              Call Activity
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'calls' ? (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by client name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="no-answer">No Answer</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="initiated">In Progress</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {(searchQuery || statusFilter !== 'all') && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Showing {filteredLogs.length} of {callLogs.length} calls</span>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Call Activity Feed - NO COST DISPLAY */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Recent Call Activity
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredLogs.length} {filteredLogs.length === 1 ? 'call' : 'calls'} found
                </p>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState
                  icon={<Phone className="w-16 h-16" />}
                  title={callLogs.length === 0 ? 'No calls yet' : 'No matching calls'}
                  description={callLogs.length === 0 
                    ? 'Start making AI-powered calls to see activity here. Click the button below to make your first call!'
                    : 'Try adjusting your filters to see more results. Clear filters or change the date range.'}
                  action={callLogs.length === 0 ? {
                    label: 'Make Your First Call',
                    onClick: () => setShowCallTrigger(true)
                  } : undefined}
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedCall(log)
                        setShowDetailModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(log.call_status)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {log.client_name}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.call_status)}`}>
                                {log.call_status.replace('-', ' ').toUpperCase()}
                              </span>
                              {log.call_type === 'broker' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                  BROKER
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {log.phone_number}
                              </span>
                              {log.call_duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(log.call_duration)}
                                </span>
                              )}
                            </div>

                            {log.transcript && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {log.transcript}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-500 ml-4 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <CallAnalyticsCharts calls={callLogs} />
        )}

        {/* Modals */}
        <CallDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedCall(null)
          }}
          call={selectedCall}
        />

        <ManualCallTrigger
          isOpen={showCallTrigger}
          onClose={() => setShowCallTrigger(false)}
          onCallInitiated={() => {
            fetchData()
          }}
        />

        <TotalCallsModal
          isOpen={showTotalCallsModal}
          onClose={() => setShowTotalCallsModal(false)}
          calls={callLogs}
          totalCalls={stats.totalCalls}
        />

        <SuccessRateModal
          isOpen={showSuccessRateModal}
          onClose={() => setShowSuccessRateModal(false)}
          calls={callLogs}
          successRate={stats.successRate}
        />

        <AvgDurationModal
          isOpen={showAvgDurationModal}
          onClose={() => setShowAvgDurationModal(false)}
          calls={callLogs}
          avgDuration={stats.averageDuration}
        />

        {/* Changed from TotalCostModal to Credits display */}
        <TotalCostModal
          isOpen={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
          calls={callLogs}
          totalCost={stats.totalCost}
        />
      </div>
    </div>
  )
}