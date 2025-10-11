// src/components/CRM/PipelineOverview.tsx
import React, { useMemo, useState } from 'react'
import { 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  Flame,
  Snowflake,
  Info
} from 'lucide-react'
import { Client } from '../../lib/supabase'
import { analyzePipeline, formatCurrency } from '../../lib/crmInsights'
import { InsightDetailModal } from './InsightDetailModal'

interface PipelineOverviewProps {
  clients: Client[]
  onViewClient?: (client: Client) => void
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({ 
  clients,
  onViewClient
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalInsightType, setModalInsightType] = useState<'stale' | 'ready' | 'followup' | 'closing' | 'hot' | 'cold' | null>(null)
  
  const insights = useMemo(() => {
    return analyzePipeline(clients)
  }, [clients])

  const getClientsForInsight = (type: string): Client[] => {
    switch (type) {
      case 'stale': return insights.staleLeads
      case 'ready': return insights.readyToAdvance
      case 'followup': return insights.needFollowUp
      case 'closing': return insights.closingSoon
      case 'hot': return insights.hotLeads
      case 'cold': return insights.coldLeads
      default: return []
    }
  }

  const stats = [
    {
      id: 'stale',
      label: 'Stale Leads',
      value: insights.staleLeads.length,
      icon: Clock,
      color: insights.staleLeads.length >= 10 ? 'red' : insights.staleLeads.length >= 5 ? 'orange' : 'green',
      description: 'New leads, no contact 14+ days',
      urgent: insights.staleLeads.length >= 10
    },
    {
      id: 'ready',
      label: 'Ready to Advance',
      value: insights.readyToAdvance.length,
      icon: TrendingUp,
      color: insights.readyToAdvance.length >= 5 ? 'green' : insights.readyToAdvance.length >= 3 ? 'blue' : 'gray',
      description: 'Qualified & recently contacted',
      urgent: false
    },
    {
      id: 'followup',
      label: 'Need Follow-Up',
      value: insights.needFollowUp.length,
      icon: AlertCircle,
      color: insights.needFollowUp.length >= 5 ? 'orange' : insights.needFollowUp.length >= 3 ? 'yellow' : 'green',
      description: 'Applications, no contact 7+ days',
      urgent: insights.needFollowUp.length >= 5
    },
    {
      id: 'closing',
      label: 'Closing Soon',
      value: insights.closingSoon.length,
      icon: CheckCircle,
      color: 'blue',
      description: 'In closing stage',
      urgent: false
    }
  ]

  const secondaryStats = [
    {
      id: 'hot',
      label: 'Hot Leads',
      value: insights.hotLeads.length,
      icon: Flame,
      color: 'red',
      description: 'Active engagement'
    },
    {
      id: 'cold',
      label: 'Cold Leads',
      value: insights.coldLeads.length,
      icon: Snowflake,
      color: 'blue',
      description: 'No contact 30+ days'
    },
    {
      id: 'value',
      label: 'Total Pipeline',
      value: formatCurrency(insights.totalPipelineValue),
      icon: DollarSign,
      color: 'green',
      description: 'Total loan value',
      isValue: true
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          icon: 'text-red-600 dark:text-red-400'
        }
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-400',
          icon: 'text-orange-600 dark:text-orange-400'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          icon: 'text-yellow-600 dark:text-yellow-400'
        }
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          icon: 'text-green-600 dark:text-green-400'
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
    if (statId === 'value') return // Don't open modal for total value
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Pipeline Health</h3>
              <p className="text-sm text-gray-400">Quick insights on your active deals</p>
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

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {secondaryStats.map((stat) => {
                const colors = getColorClasses(stat.color)
                const Icon = stat.icon
                
                return (
                  <button
                    key={stat.id}
                    onClick={() => !stat.isValue && handleStatClick(stat.id)}
                    disabled={stat.isValue}
                    className={`${colors.bg} ${colors.border} border rounded-lg p-3 text-left transition-all ${!stat.isValue ? 'hover:scale-105 hover:shadow-md cursor-pointer group' : 'cursor-default'} relative`}
                  >
                    {/* Info icon for clickable stats */}
                    {!stat.isValue && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-5 h-5 bg-white/20 dark:bg-black/20 rounded-lg flex items-center justify-center">
                          <Info className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${colors.text} mb-0.5 truncate`}>
                          {stat.label}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-lg font-bold ${colors.text}`}>
                            {stat.value}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {stat.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Action Prompt */}
            {(insights.staleLeads.length > 0 || insights.needFollowUp.length > 0) && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-900 dark:text-orange-300">
                    <strong>Action needed:</strong> You have{' '}
                    {insights.staleLeads.length > 0 && (
                      <>
                        <span className="font-bold">{insights.staleLeads.length} stale lead{insights.staleLeads.length !== 1 ? 's' : ''}</span>
                        {insights.needFollowUp.length > 0 && ' and '}
                      </>
                    )}
                    {insights.needFollowUp.length > 0 && (
                      <>
                        <span className="font-bold">{insights.needFollowUp.length} application{insights.needFollowUp.length !== 1 ? 's' : ''}</span>
                        {' '}needing follow-up
                      </>
                    )}
                    . Click any card above to see details and action tips.
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {insights.staleLeads.length === 0 && insights.needFollowUp.length === 0 && insights.readyToAdvance.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900 dark:text-green-300">
                    <strong>Looking good!</strong> Your pipeline is healthy with {insights.readyToAdvance.length} qualified lead{insights.readyToAdvance.length !== 1 ? 's' : ''} ready to advance.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <InsightDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        insightType={modalInsightType}
        clients={getClientsForInsight(modalInsightType || '')}
        onViewClient={(client) => onViewClient?.(client)}
      />
    </>
  )
}