// src/components/RateMonitor/RateDetailModal.tsx
import React from 'react'
import { X, TrendingUp, TrendingDown, Calendar, BarChart3, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface RateDetailModalProps {
  isOpen: boolean
  onClose: () => void
  rate: {
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
  } | null
}

export const RateDetailModal: React.FC<RateDetailModalProps> = ({
  isOpen,
  onClose,
  rate
}) => {
  if (!isOpen || !rate) return null

  const getLoanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conventional: '30-Year Fixed Conventional',
      '15yr': '15-Year Fixed Conventional',
      fha: 'FHA Loan',
      va: 'VA Loan',
      jumbo: 'Jumbo Loan'
    }
    return labels[type] || type
  }

  const getLoanTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      conventional: 'Standard mortgage for primary residences with good credit. Requires minimum 3-5% down payment. No mortgage insurance with 20% down.',
      '15yr': 'Shorter term with lower rates but higher monthly payments. Build equity faster and save on total interest paid.',
      fha: 'Government-backed loan requiring only 3.5% down. More lenient credit requirements. Ideal for first-time homebuyers.',
      va: 'Available to veterans, active military, and eligible spouses. No down payment required. No mortgage insurance.',
      jumbo: 'For loan amounts exceeding conventional limits ($726,200 in most areas). Stricter credit and reserve requirements.'
    }
    return descriptions[type] || 'Competitive mortgage rate for qualified borrowers.'
  }

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return '--'
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(3)}%`
  }

  const getChangeColor = (change: number | undefined) => {
    if (!change) return 'text-gray-400'
    return change > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  }

  const getTrendAnalysis = () => {
    const changes = [
      { period: '1 Day', value: rate.change },
      { period: '1 Week', value: rate.change_1_week },
      { period: '1 Month', value: rate.change_1_month },
      { period: '1 Year', value: rate.change_1_year }
    ]

    const recentTrend = changes.slice(0, 2).every(c => c.value && c.value < 0) ? 'down' : 
                        changes.slice(0, 2).every(c => c.value && c.value > 0) ? 'up' : 'mixed'

    if (recentTrend === 'down') {
      return {
        message: 'Rates are trending down! Good time to contact clients about refinancing.',
        color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
        icon: TrendingDown
      }
    } else if (recentTrend === 'up') {
      return {
        message: 'Rates are trending up. Clients may want to lock in current rates soon.',
        color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
        icon: TrendingUp
      }
    } else {
      return {
        message: 'Rates are fluctuating. Monitor closely for opportunity windows.',
        color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
        icon: BarChart3
      }
    }
  }

  const trendAnalysis = getTrendAnalysis()
  const TrendIcon = trendAnalysis.icon

  const currentVs52WeekLow = rate.range_52_week_low 
    ? ((rate.rate - rate.range_52_week_low) / rate.range_52_week_low * 100).toFixed(2)
    : null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {getLoanTypeLabel(rate.loan_type)}
              </h2>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-white">
                  {rate.rate.toFixed(3)}%
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                  rate.trend === 'up' 
                    ? 'bg-red-500/20 text-white' 
                    : 'bg-green-500/20 text-white'
                }`}>
                  {rate.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatChange(rate.change)}
                </div>
              </div>
              <p className="text-blue-100 text-sm mt-2">
                Updated {rate.lastUpdate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About This Loan Type</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getLoanTypeDescription(rate.loan_type)}
            </p>
          </div>

          {/* Trend Analysis */}
          <div className={`rounded-xl p-4 border ${trendAnalysis.color}`}>
            <div className="flex items-start gap-3">
              <TrendIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Market Trend Analysis</h3>
                <p className="text-sm">{trendAnalysis.message}</p>
              </div>
            </div>
          </div>

          {/* Rate Changes */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Historical Changes</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '1 Day', value: rate.change },
                { label: '1 Week', value: rate.change_1_week },
                { label: '1 Month', value: rate.change_1_month },
                { label: '1 Year', value: rate.change_1_year }
              ].map(item => (
                <div 
                  key={item.label}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{item.label}</div>
                  <div className={`text-lg font-bold ${getChangeColor(item.value)}`}>
                    {formatChange(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 52-Week Range */}
          {rate.range_52_week_low && rate.range_52_week_high && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">52-Week Range</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Low</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {rate.range_52_week_low.toFixed(3)}%
                    </div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-green-500 to-red-500"
                        style={{ 
                          width: `${((rate.rate - rate.range_52_week_low) / (rate.range_52_week_high - rate.range_52_week_low)) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="text-center mt-1">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        Current: {rate.rate.toFixed(3)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 dark:text-gray-400">High</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {rate.range_52_week_high.toFixed(3)}%
                    </div>
                  </div>
                </div>
                {currentVs52WeekLow && (
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Current rate is {currentVs52WeekLow}% {parseFloat(currentVs52WeekLow) > 0 ? 'above' : 'below'} 52-week low
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Action Items */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Action Items for Brokers
                </h3>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• Check if any monitored clients have targets near this rate</li>
                  <li>• Review pipeline for clients who could benefit from current rates</li>
                  <li>• Consider proactive outreach if rates are favorable</li>
                  <li>• Update client expectations based on trend direction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {rate.lastUpdate}</span>
            </div>
            <div>Data updates every 15 minutes</div>
          </div>
          <Button
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}