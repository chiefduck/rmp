// src/components/RateMonitor/MonitoringDetailModal.tsx
import React from 'react'
import { X, Phone, Mail, DollarSign, Clock, Target, TrendingDown, Activity } from 'lucide-react'
import { MortgageWithDetails } from '../../lib/rateMonitorInsights'
import { Button } from '../ui/Button'

interface MonitoringDetailModalProps {
  isOpen: boolean
  onClose: () => void
  insightType: 'target' | 'close' | 'stale' | 'calls' | null
  mortgages: MortgageWithDetails[]
  onViewMortgage?: (mortgage: MortgageWithDetails) => void
  totalSavings?: number
}

export const MonitoringDetailModal: React.FC<MonitoringDetailModalProps> = ({
  isOpen,
  onClose,
  insightType,
  mortgages,
  onViewMortgage,
  totalSavings = 0
}) => {
  if (!isOpen || !insightType) return null

  const getInsightConfig = () => {
    switch (insightType) {
      case 'target':
        return {
          title: 'Target Hits',
          icon: Target,
          color: 'green',
          description: 'These clients have reached their target rate! The market rate is now at or below what they wanted.',
          actionLabel: 'Why this matters',
          actionText: `This is the HOTTEST opportunity! These clients are ready to refi NOW and could save a combined $${totalSavings}/month. Call them immediately.`,
          tips: [
            'Call today - rates can change tomorrow',
            'Lead with: "Great news! Rates hit your target"',
            'Mention their specific monthly savings',
            'Get them pre-approved ASAP to lock the rate'
          ]
        }
      case 'close':
        return {
          title: 'Close to Target',
          icon: TrendingDown,
          color: 'orange',
          description: 'These clients are within 0.25% of their target rate. Almost there!',
          actionLabel: 'Why this matters',
          actionText: 'They\'re close! A small rate drop or adjusting their target slightly could create an opportunity. Stay proactive.',
          tips: [
            'Monitor daily - they could hit target soon',
            'Ask if they\'d consider 0.125% above target',
            'Explain break-even point at current rates',
            'Keep them warm with market updates'
          ]
        }
      case 'stale':
        return {
          title: 'Stale Monitoring',
          icon: Clock,
          color: 'red',
          description: 'These clients haven\'t been contacted (manually or by AI) in 60+ days.',
          actionLabel: 'Why this matters',
          actionText: 'Out of sight = out of mind. These clients might forget you\'re monitoring for them or assume you\'re not working for them.',
          tips: [
            'Send a "We\'re still watching" message',
            'Share a market update or rate forecast',
            'Re-confirm their target rate is still accurate',
            'Ask about any life changes (new job, moving, etc.)'
          ]
        }
      case 'calls':
        return {
          title: 'AI Calls This Week',
          icon: Activity,
          color: 'blue',
          description: 'These clients were contacted by the AI calling system in the last 7 days.',
          actionLabel: 'Why this matters',
          actionText: 'AI is keeping them engaged! Review call transcripts to see what they said and follow up on any questions.',
          tips: [
            'Check call outcomes and transcripts',
            'Follow up on any questions AI couldn\'t answer',
            'Add personal touch after AI contact',
            'Adjust target rates based on feedback'
          ]
        }
      default:
        return null
    }
  }

  const config = getInsightConfig()
  if (!config) return null

  const Icon = config.icon

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100'
      case 'red':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
    }
  }

  const getDaysSinceContact = (lastContact?: string): string => {
    if (!lastContact) return 'Never'
    const lastContactDate = new Date(lastContact)
    const today = new Date()
    const diffTime = today.getTime() - lastContactDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const formatSavings = (savings?: number): string => {
    if (!savings || savings <= 0) return '$0'
    return `$${savings.toLocaleString()}/mo`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b ${getColorClasses(config.color)} border`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                config.color === 'green' ? 'bg-green-100 dark:bg-green-900/40' :
                config.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40' :
                config.color === 'red' ? 'bg-red-100 dark:bg-red-900/40' :
                'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-sm mt-1 opacity-80">
                  {mortgages.length} client{mortgages.length !== 1 ? 's' : ''}
                  {insightType === 'target' && totalSavings > 0 && (
                    <span className="ml-2 font-semibold">• ${totalSavings.toLocaleString()}/mo total savings</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              {config.description}
            </p>
            
            <div className={`${getColorClasses(config.color)} border rounded-lg p-4`}>
              <h3 className="font-semibold mb-2">💡 {config.actionLabel}</h3>
              <p className="text-sm">{config.actionText}</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">📋 Action Tips:</h3>
            <ul className="space-y-2">
              {config.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mortgage List */}
          {mortgages.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Clients in this category:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mortgages.map((mortgage) => (
                  <div
                    key={mortgage.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      onViewMortgage?.(mortgage)
                      onClose()
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {mortgage.client_name || `${mortgage.first_name} ${mortgage.last_name}`}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {mortgage.phone || 'No phone'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${(mortgage.loan_amount / 1000).toFixed(0)}K
                          </span>
                          {mortgage.savings_potential && mortgage.savings_potential > 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              💰 {formatSavings(mortgage.savings_potential)} savings
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Target: {mortgage.target_rate}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {getDaysSinceContact(mortgage.last_contact || mortgage.last_ai_call)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No clients in this category!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}