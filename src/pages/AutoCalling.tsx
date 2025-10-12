// src/pages/AutoCalling.tsx - AI CALLING CONTROL CENTER
import React, { useState, useEffect } from 'react'
import { Phone, TrendingUp, Clock, DollarSign, CheckCircle, XCircle, RefreshCw, Filter, Search, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { CallDetailModal } from '../components/AutoCalling/CallDetailModal'
import { ManualCallTrigger } from '../components/AutoCalling/ManualCallTrigger'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import BlandService, { CallLogEntry } from '../lib/blandService'

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
  
  // Modal state
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCallTrigger, setShowCallTrigger] = useState(false)

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

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading call data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 p-4 md:p-0">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Phone className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalCalls}</div>
          <div className="text-sm opacity-90">Total Calls</div>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <div className="text-sm opacity-90">30 days</div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.successRate.toFixed(1)}%</div>
          <div className="text-sm opacity-90">Success Rate</div>
        </div>

        {/* Average Duration */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <div className="text-xs opacity-90">{stats.successfulCalls} calls</div>
          </div>
          <div className="text-2xl font-bold mb-1">{formatDuration(Math.round(stats.averageDuration))}</div>
          <div className="text-sm opacity-90">Avg Duration</div>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className="text-xs opacity-90">Last 30d</div>
          </div>
          <div className="text-2xl font-bold mb-1">{formatCost(stats.totalCost)}</div>
          <div className="text-sm opacity-90">Total Cost</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
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

          {/* Status Filter */}
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

          {/* Date Range */}
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
      </div>

      {/* Call Activity Feed */}
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
          <div className="p-12 text-center">
            <Phone className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No calls yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Call activity will appear here once you start making calls
            </p>
          </div>
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
                    {/* Status Icon */}
                    <div className="mt-1">
                      {getStatusIcon(log.call_status)}
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                        {log.cost_cents > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCost(log.cost_cents)}
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

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Detail Modal */}
      <CallDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedCall(null)
        }}
        call={selectedCall}
      />

      {/* Manual Call Trigger Modal */}
      <ManualCallTrigger
        isOpen={showCallTrigger}
        onClose={() => setShowCallTrigger(false)}
        onCallInitiated={() => {
          fetchData() // Refresh data after call is initiated
        }}
      />
    </div>
  )
}