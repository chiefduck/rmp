// src/pages/AutoCalling.tsx - AI CALLING WITH DELETE/ARCHIVE
import React, { useState, useEffect } from 'react'
import { Phone, TrendingUp, Clock, Zap, CheckCircle, XCircle, RefreshCw, Search, BarChart3, List, Trash2, Archive, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../hooks/useConfirm'
import { CallDetailModal } from '../components/AutoCalling/CallDetailModal'
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
import { LiveCallMonitor } from '../components/AutoCalling/LiveCallMonitor'
import { supabase } from '../lib/supabase'

export const AutoCalling: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError, info } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
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
  const [showArchived, setShowArchived] = useState(false)
  
  // Selection state
  const [selectedCallIds, setSelectedCallIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // Modal state
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Stats Modal states
  const [showTotalCallsModal, setShowTotalCallsModal] = useState(false)
  const [showSuccessRateModal, setShowSuccessRateModal] = useState(false)
  const [showAvgDurationModal, setShowAvgDurationModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, dateRange, statusFilter, showArchived])

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
      
      // Use BlandService to get call logs (maintains consistency)
      const logs = await BlandService.getCallLogs({
        userId: user.id,
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate,
        limit: 100
      })
      
      // Filter by archived status on client side
      const filteredLogs = logs.filter(log => {
        if (showArchived) {
          return log.deleted_at != null
        } else {
          return log.deleted_at == null
        }
      })
      
      setCallLogs(filteredLogs)
      
      // Fetch stats (only non-archived)
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

  // Archive single call (soft delete)
  const handleArchiveCall = async (callId: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    
    const confirmed = await confirm({
      title: 'Archive this call?',
      message: 'The call will be hidden from your activity feed but can be restored later.',
      variant: 'warning',
      confirmText: 'Archive'
    })
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', callId)
      
      if (error) throw error
      
      success('Call archived successfully')
      fetchData()
      setSelectedCallIds(prev => {
        const next = new Set(prev)
        next.delete(callId)
        return next
      })
    } catch (error) {
      console.error('Error archiving call:', error)
      showError('Failed to archive call')
    }
  }

  // Delete single call (hard delete)
  const handleDeleteCall = async (callId: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    
    const confirmed = await confirm({
      title: 'Permanently Delete?',
      message: 'This will permanently delete this call record and cannot be undone.\n\nConsider archiving instead to keep records.',
      variant: 'danger',
      confirmText: 'Delete Permanently'
    })
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', callId)
      
      if (error) throw error
      
      success('Call deleted permanently')
      fetchData()
      setSelectedCallIds(prev => {
        const next = new Set(prev)
        next.delete(callId)
        return next
      })
    } catch (error) {
      console.error('Error deleting call:', error)
      showError('Failed to delete call')
    }
  }

  // Restore archived call
  const handleRestoreCall = async (callId: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    
    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ deleted_at: null })
        .eq('id', callId)
      
      if (error) throw error
      
      success('Call restored successfully')
      fetchData()
    } catch (error) {
      console.error('Error restoring call:', error)
      showError('Failed to restore call')
    }
  }

  // Bulk archive
  const handleBulkArchive = async () => {
    if (selectedCallIds.size === 0) return
    
    const confirmed = await confirm({
      title: `Archive ${selectedCallIds.size} calls?`,
      message: 'These calls will be hidden from your activity feed but can be restored later.',
      variant: 'warning',
      confirmText: 'Archive All'
    })
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', Array.from(selectedCallIds))
      
      if (error) throw error
      
      success(`${selectedCallIds.size} calls archived successfully`)
      setSelectedCallIds(new Set())
      setIsSelectionMode(false)
      fetchData()
    } catch (error) {
      console.error('Error bulk archiving:', error)
      showError('Failed to archive calls')
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCallIds.size === 0) return
    
    const confirmed = await confirm({
      title: `Permanently Delete ${selectedCallIds.size} Calls?`,
      message: 'This will permanently delete these call records and CANNOT be undone.\n\nConsider archiving instead to keep records.',
      variant: 'danger',
      confirmText: 'Delete All'
    })
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('call_logs')
        .delete()
        .in('id', Array.from(selectedCallIds))
      
      if (error) throw error
      
      success(`${selectedCallIds.size} calls deleted permanently`)
      setSelectedCallIds(new Set())
      setIsSelectionMode(false)
      fetchData()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      showError('Failed to delete calls')
    }
  }

  // Toggle call selection
  const toggleCallSelection = (callId: string) => {
    setSelectedCallIds(prev => {
      const next = new Set(prev)
      if (next.has(callId)) {
        next.delete(callId)
      } else {
        next.add(callId)
      }
      return next
    })
  }

  // Select all visible calls
  const handleSelectAll = () => {
    if (selectedCallIds.size === filteredLogs.length) {
      setSelectedCallIds(new Set())
    } else {
      setSelectedCallIds(new Set(filteredLogs.map(log => log.id)))
    }
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
            <Button onClick={handleRefresh} loading={refreshing} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Call Monitor */}
        <LiveCallMonitor />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            {/* Filters & Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-4">
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

                <Button
                  onClick={() => setShowArchived(!showArchived)}
                  variant="outline"
                  className={showArchived ? 'border-orange-500 text-orange-600' : ''}
                >
                  {showArchived ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </Button>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode)
                      setSelectedCallIds(new Set())
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                  </Button>

                  {isSelectionMode && filteredLogs.length > 0 && (
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                    >
                      {selectedCallIds.size === filteredLogs.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}

                  {selectedCallIds.size > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCallIds.size} selected
                    </span>
                  )}
                </div>

                {selectedCallIds.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkArchive}
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Archive ({selectedCallIds.size})
                    </Button>
                    <Button
                      onClick={handleBulkDelete}
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete ({selectedCallIds.size})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Call Activity Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {showArchived ? 'Archived Calls' : 'Recent Call Activity'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredLogs.length} {filteredLogs.length === 1 ? 'call' : 'calls'} found
                </p>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState
                  icon={showArchived ? <Archive className="w-16 h-16" /> : <Phone className="w-16 h-16" />}
                  title={showArchived ? 'No archived calls' : 'No calls yet'}
                  description={showArchived 
                    ? 'Archived calls will appear here. You can restore them anytime.'
                    : 'Start making AI-powered calls to see activity here.'}
                  action={undefined}
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {isSelectionMode && (
                            <input
                              type="checkbox"
                              checked={selectedCallIds.has(log.id)}
                              onChange={() => toggleCallSelection(log.id)}
                              className="mt-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}

                          <div 
                            className="flex items-start space-x-3 flex-1 cursor-pointer"
                            onClick={() => {
                              if (!isSelectionMode) {
                                setSelectedCall(log)
                                setShowDetailModal(true)
                              }
                            }}
                          >
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
                                {showArchived && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                                    ARCHIVED
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
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </div>

                          {!isSelectionMode && (
                            <div className="flex gap-1">
                              {showArchived ? (
                                <Button
                                  onClick={(e) => handleRestoreCall(log.id, e)}
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500 text-green-600 hover:bg-green-50"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  onClick={(e) => handleArchiveCall(log.id, e)}
                                  variant="outline"
                                  size="sm"
                                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                onClick={(e) => handleDeleteCall(log.id, e)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
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

        <TotalCostModal
          isOpen={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
          calls={callLogs}
          totalCost={stats.totalCost}
        />

        {/* Confirmation Dialog */}
        <ConfirmDialog />
      </div>
    </div>
  )
}