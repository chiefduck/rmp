// src/components/RateMonitor/MonitoringOverview.tsx
import React, { useMemo, useState } from 'react'
import { 
  Target,
  TrendingDown,
  Activity,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { MortgageWithDetails, analyzeRateMonitoring, formatCurrency } from '../../lib/rateMonitorInsights'
import { MonitoringDetailModal } from './MonitoringDetailModal'

interface MonitoringOverviewProps {
  mortgages: MortgageWithDetails[]
  currentMarketRate: number
  onViewMortgage?: (mortgage: MortgageWithDetails) => void
}

export const MonitoringOverview: React.FC<MonitoringOverviewProps> = ({ 
  mortgages,
  currentMarketRate,
  onViewMortgage
}) => {
  const [isExpanded, setIsExpanded] = useState(false) // Changed to false - collapsed by default
  const [showModal, setShowModal] = useState(false)
  const [modalInsightType, setModalInsightType] = useState<'target' | 'close' | 'stale' | 'calls' | null>(null)
  
  const insights = useMemo(() => {
    return analyzeRateMonitoring(mortgages, currentMarketRate)
  }, [mortgages, currentMarketRate])

  const getMortgagesForInsight = (type: string): MortgageWithDetails[] => {
    switch (type) {
      case 'target': return insights.targetHits
      case 'close': return insights.closeToTarget
      case 'stale': return insights.staleMonitoring
      case 'calls': 
        // Return mortgages with AI calls in last 7 days
        return mortgages.filter(m => {
          if (!m.last_ai_call) return false
          const lastCall = new Date(m.last_ai_call)
          const today = new Date()
          const diffDays = Math.ceil((today.getTime() - lastCall.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays <= 7
        })
      default: return []
    }
  }

  const stats = [
    {
      id: 'target',
      label: 'Target Hits',
      value: insights.targetHits.length,
      icon: Target,
      color: insights.targetHits.length > 0 ? 'green' : 'gray',
      description: 'Ready to call NOW',
      urgent: insights.targetHits.length > 0
    },
    {
      id: 'close',
      label: 'Close to Target',
      value: insights.closeToTarget.length,
      icon: TrendingDown,
      color: insights.closeToTarget.length >= 3 ? 'orange' : 'gray',
      description: 'Within 0.25% of target',
      urgent: false
    },
    {
      id: 'calls',
      label: 'AI Calls This Week',
      value: insights.aiCallsThisWeek,
      icon: Activity,
      color: 'blue',
      description: 'Automated outreach',
      urgent: false
    },
    {
      id: 'stale',
      label: 'Stale Monitoring',
      value: insights.staleMonitoring.length,
      icon: Clock,
      color: insights.staleMonitoring.length >= 5 ? 'red' : insights.staleMonitoring.length >= 3 ? 'orange' : 'gray',
      description: 'No contact 60+ days',
      urgent: insights.staleMonitoring.length >= 5
    }
  ]

  const summaryStats = [
    {
      label: 'Total Monitored',
      value: insights.allMonitored,
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'Active Opportunities',
      value: insights.activeOpportunities,
      icon: Target,
      color: 'green'
    },
    {
      label: 'Monthly Savings',
      value: formatCurrency(insights.totalPotentialSavings),
      icon: DollarSign,
      color: 'green'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          icon: 'text-green-600 dark:text-green-400'
        }
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-400',
          icon: 'text-orange-600 dark:text-orange-400'
        }
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          icon: 'text-red-600 dark:text-red-400'
        }
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-400',
          icon: 'text-blue-600 dark:text-blue-400'
        }
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          icon: 'text-gray-600 dark:text-gray-400'
        }
    }
  }

  const handleStatClick = (statId: string) => {
    setModalInsightType(statId as any)
    setShowModal(true)
  }

  return (
    <>
      <div className="backdrop-blur-sm bg-gray-800/60 border border-gray-700/50 rounded-xl md:rounded-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Monitoring Overview</h3>
              <p className="text-sm text-gray-400">Refi opportunities & engagement tracking</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-4 md:p-6 pt-0 space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((stat) => {
                const colors = getColorClasses(stat.color)
                const Icon = stat.icon
                
                return (
                  <button
                    key={stat.id}
                    onClick={() => handleStatClick(stat.id)}
                    className={`relative ${colors.bg} ${colors.border} border rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-lg group`}
                  >
                    {/* Urgent indicator */}
                    {stat.urgent && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    
                    {/* Info icon */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-white/20 dark:bg-black/20 rounded-lg flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                      <span className={`text-2xl font-bold ${colors.text}`}>
                        {stat.value}
                      </span>
                    </div>
                    
                    <div className={`text-sm font-semibold ${colors.text} mb-1`}>
                      {stat.label}
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.description}
                    </div>
                    
                    {/* Hover hint */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400">
                      Click for details
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {summaryStats.map((stat) => {
                const colors = getColorClasses(stat.color)
                const Icon = stat.icon
                
                return (
                  <div
                    key={stat.label}
                    className={`${colors.bg} ${colors.border} border rounded-lg p-3 text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${colors.text} mb-0.5 truncate`}>
                          {stat.label}
                        </div>
                        <div className={`text-lg font-bold ${colors.text}`}>
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Alert Messages */}
            {insights.targetHits.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900 dark:text-green-300">
                    <strong>🎯 HOT OPPORTUNITIES!</strong> You have{' '}
                    <span className="font-bold">{insights.targetHits.length} client{insights.targetHits.length !== 1 ? 's' : ''}</span>
                    {' '}who hit their target rate! Combined monthly savings:{' '}
                    <span className="font-bold">${insights.totalPotentialSavings.toLocaleString()}</span>.
                    Click "Target Hits" above to call them now!
                  </div>
                </div>
              </div>
            )}

            {insights.staleMonitoring.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-900 dark:text-orange-300">
                    <strong>Attention needed:</strong> You have{' '}
                    <span className="font-bold">{insights.staleMonitoring.length} client{insights.staleMonitoring.length !== 1 ? 's' : ''}</span>
                    {' '}who haven't been contacted in 60+ days. Send them a quick update to stay top of mind.
                  </div>
                </div>
              </div>
            )}

            {insights.targetHits.length === 0 && insights.closeToTarget.length === 0 && insights.allMonitored > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>All good!</strong> No target hits yet, but we're monitoring{' '}
                    {insights.allMonitored} client{insights.allMonitored !== 1 ? 's' : ''} 24/7.
                    You'll be notified the moment rates drop to their targets.
                  </div>
                </div>
              </div>
            )}

            {insights.allMonitored === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900 dark:text-purple-300">
                    <strong>No clients being monitored yet.</strong> When you close a deal in the CRM,
                    it will automatically appear here for rate monitoring. We'll watch the market 24/7 and
                    alert you when refi opportunities arise!
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <MonitoringDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        insightType={modalInsightType}
        mortgages={getMortgagesForInsight(modalInsightType || '')}
        onViewMortgage={(mortgage) => onViewMortgage?.(mortgage)}
        totalSavings={insights.totalPotentialSavings}
      />
    </>
  )
}