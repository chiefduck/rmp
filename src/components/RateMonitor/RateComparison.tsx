// src/components/RateMonitor/RateComparison.tsx
import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'

interface RateData {
  loan_type: string
  rate: number
  change: number
  change_1_week?: number
  change_1_month?: number
  change_1_year?: number
  range_52_week_low?: number
  range_52_week_high?: number
}

interface RateComparisonProps {
  rates: RateData[]
  isExpanded: boolean
  onToggle: () => void
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  conventional: '30-Year Fixed',
  '15yr': '15-Year Fixed',
  fha: 'FHA Loan',
  va: 'VA Loan',
  jumbo: 'Jumbo Loan'
}

const formatChange = (change: number | undefined) => {
  if (change === undefined || change === null) {
    return <span className="text-gray-400 dark:text-gray-500">--</span>
  }
  if (change === 0) {
    return <span className="text-blue-600 dark:text-blue-400 font-medium">+0.00%</span>
  }
  const isPositive = change > 0
  return (
    <span className={`font-medium ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
      {isPositive ? '+' : ''}{change.toFixed(2)}%
    </span>
  )
}

export const RateComparison: React.FC<RateComparisonProps> = ({ rates, isExpanded, onToggle }) => {
  return (
    <Card>
      <CardHeader>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div>
            <CardTitle className="text-base md:text-lg">Rate Comparison - Live Market Data</CardTitle>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time mortgage rate data - updates automatically every 15 minutes
            </p>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3">
            {rates.map((rate) => (
              <div key={rate.loan_type} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {LOAN_TYPE_LABELS[rate.loan_type] || rate.loan_type}
                  </h4>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {rate.rate.toFixed(2)}%
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Day</span>
                    {formatChange(rate.change)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Week</span>
                    {formatChange(rate.change_1_week)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Month</span>
                    {formatChange(rate.change_1_month)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">1 Year</span>
                    {formatChange(rate.change_1_year)}
                  </div>
                </div>
                
                {rate.range_52_week_low && rate.range_52_week_high && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400">52-Week Range:</span>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {rate.range_52_week_low.toFixed(2)}% - {rate.range_52_week_high.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {['Loan Type', 'Current', '1 day', '1 week', '1 month', '1 year', '52 Week Range'].map(h => (
                    <th key={h} className="text-left py-3 px-2 font-medium text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.loan_type} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4 px-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {LOAN_TYPE_LABELS[rate.loan_type] || rate.loan_type}
                    </td>
                    <td className="py-4 px-2 text-gray-900 dark:text-gray-100 text-lg font-bold whitespace-nowrap">
                      {rate.rate.toFixed(2)}%
                    </td>
                    <td className="py-4 px-2">{formatChange(rate.change)}</td>
                    <td className="py-4 px-2">{formatChange(rate.change_1_week)}</td>
                    <td className="py-4 px-2">{formatChange(rate.change_1_month)}</td>
                    <td className="py-4 px-2">{formatChange(rate.change_1_year)}</td>
                    <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {rate.range_52_week_low && rate.range_52_week_high 
                        ? `${rate.range_52_week_low.toFixed(2)}% - ${rate.range_52_week_high.toFixed(2)}%` 
                        : <span className="text-gray-400 italic">Updating...</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">⚠️ Disclaimer</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Rates shown are national averages for reference only and may not reflect current market conditions</p>
              <p>• Always verify rates directly with your lender before making financial decisions</p>
              <p>• Rate Monitor Pro aggregates data from publicly available market sources</p>
              <p>• Updates automatically via real-time monitoring - Red = rate increase, Green = rate decrease</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}