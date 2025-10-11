// src/components/RateMonitor/RateCard.tsx
import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'

interface RateCardProps {
  rate: {
    loan_type: string
    rate: number
    change: number
    trend: 'up' | 'down'
    lastUpdate: string
    range_52_week_low?: number
    range_52_week_high?: number
  }
  onClick: () => void
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  conventional: '30-Year Fixed',
  '15yr': '15-Year Fixed',
  fha: 'FHA Loan',
  va: 'VA Loan',
  jumbo: 'Jumbo Loan'
}

export const RateCard: React.FC<RateCardProps> = ({ rate, onClick }) => {
  const label = LOAN_TYPE_LABELS[rate.loan_type] || rate.loan_type

  return (
    <Card 
      hover
      onClick={onClick}
      className="cursor-pointer"
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate flex-1 pr-2">
            {label}
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
  )
}