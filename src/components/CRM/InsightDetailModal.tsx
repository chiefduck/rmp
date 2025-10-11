// src/components/CRM/InsightDetailModal.tsx
import React from 'react'
import { X, Phone, Mail, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, Flame, Snowflake } from 'lucide-react'
import { Client } from '../../lib/supabase'
import { Button } from '../ui/Button'

interface InsightDetailModalProps {
  isOpen: boolean
  onClose: () => void
  insightType: 'stale' | 'ready' | 'followup' | 'closing' | 'hot' | 'cold' | null
  clients: Client[]
  onViewClient?: (client: Client) => void
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  isOpen,
  onClose,
  insightType,
  clients,
  onViewClient
}) => {
  if (!isOpen || !insightType) return null

  const getInsightConfig = () => {
    switch (insightType) {
      case 'stale':
        return {
          title: 'Stale Leads',
          icon: Clock,
          color: 'red',
          description: 'These leads are in the New/Prospect stage and haven\'t been contacted in 14+ days (or never).',
          actionLabel: 'Why this matters',
          actionText: 'Leads go cold quickly. After 2 weeks without contact, conversion rates drop significantly. Reach out now to re-engage before they\'re lost.',
          tips: [
            'Start with the oldest leads first',
            'Use a friendly "checking in" approach',
            'Ask if their plans or timeline have changed',
            'Offer valuable market updates as a conversation starter'
          ]
        }
      case 'ready':
        return {
          title: 'Ready to Advance',
          icon: TrendingUp,
          color: 'green',
          description: 'These clients are qualified and you\'ve contacted them recently (within 7 days). They\'re hot and ready to move forward!',
          actionLabel: 'Why this matters',
          actionText: 'These are your warmest leads. They\'re qualified, engaged, and ready for the next step. Strike while the iron is hot.',
          tips: [
            'Move them to Application stage if ready',
            'Schedule their next action immediately',
            'Keep momentum high with quick follow-ups',
            'Don\'t let these go cold - they\'re ready to close'
          ]
        }
      case 'followup':
        return {
          title: 'Need Follow-Up',
          icon: AlertCircle,
          color: 'orange',
          description: 'These clients are in the Application stage but haven\'t been contacted in 7+ days.',
          actionLabel: 'Why this matters',
          actionText: 'Applications can stall without consistent communication. These clients need a status update or gentle push to keep moving forward.',
          tips: [
            'Check application status first',
            'Proactively address any blockers',
            'Set clear next steps and timelines',
            'Send reminder about required documents'
          ]
        }
      case 'closing':
        return {
          title: 'Closing Soon',
          icon: CheckCircle,
          color: 'blue',
          description: 'These clients are in the Closing stage. Final stretch!',
          actionLabel: 'Why this matters',
          actionText: 'These are your near-term closings. Stay on top of final details to ensure smooth closings and happy clients.',
          tips: [
            'Confirm closing date and time',
            'Verify all documents are ready',
            'Coordinate with title company',
            'Prepare for post-close follow-up'
          ]
        }
      case 'hot':
        return {
          title: 'Hot Leads',
          icon: Flame,
          color: 'red',
          description: 'Recently contacted clients in good stages (Qualified, Application, or Closing).',
          actionLabel: 'Why this matters',
          actionText: 'These leads are actively engaged. Keep the momentum going with consistent communication.',
          tips: [
            'Maintain regular contact',
            'Be responsive to questions',
            'Keep them informed of next steps',
            'Don\'t let them cool off'
          ]
        }
      case 'cold':
        return {
          title: 'Cold Leads',
          icon: Snowflake,
          color: 'blue',
          description: 'No contact in 30+ days across all stages.',
          actionLabel: 'Why this matters',
          actionText: 'These leads have gone cold. Re-engagement campaigns can revive some, but expect lower conversion rates.',
          tips: [
            'Send a "We miss you" message',
            'Share relevant market updates',
            'Ask if circumstances have changed',
            'Consider moving to nurture status if no response'
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
      case 'red':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100'
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b ${getColorClasses(config.color)} border`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                config.color === 'red' ? 'bg-red-100 dark:bg-red-900/40' :
                config.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40' :
                config.color === 'green' ? 'bg-green-100 dark:bg-green-900/40' :
                'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-sm mt-1 opacity-80">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
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

          {/* Client List */}
          {clients.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Clients in this category:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      onViewClient?.(client)
                      onClose()
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {client.first_name} {client.last_name}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone || 'No phone'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email || 'No email'}
                          </span>
                          {client.loan_amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${(client.loan_amount / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                          {client.current_stage}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {getDaysSinceContact(client.last_contact)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No clients in this category yet!</p>
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