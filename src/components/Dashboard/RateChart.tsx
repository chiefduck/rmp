import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RateChartProps {
  data?: Array<{ date: string; rate: number }>
  title?: string
}

export const RateChart: React.FC<RateChartProps> = ({ 
  title = "Rate Trends (Last 30 Days)",
  data = [] 
}) => {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rate: 7.25 + Math.sin(i * 0.2) * 0.3 + (Math.random() - 0.5) * 0.1
  }))

  const maxRate = Math.max(...chartData.map(d => d.rate))
  const minRate = Math.min(...chartData.map(d => d.rate))
  const rateRange = maxRate - minRate || 1

  // Calculate rate change
  const firstRate = chartData[0]?.rate || 0
  const lastRate = chartData[chartData.length - 1]?.rate || 0
  const rateChange = lastRate - firstRate
  const rateChangePercent = ((rateChange / firstRate) * 100).toFixed(2)

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col p-3 md:p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(chartData[0]?.date)} - {formatDate(chartData[chartData.length - 1]?.date)}
          </p>
        </div>
        
        {/* Compact Current Rate */}
        <div className="text-right">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {lastRate.toFixed(3)}%
            </span>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${
              rateChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {rateChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(parseFloat(rateChangePercent))}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">30 day change</p>
        </div>
      </div>

      {/* Compact Chart */}
      <div className="flex-1 relative min-h-[120px] md:min-h-[140px]">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-1">
          <span className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">{maxRate.toFixed(2)}%</span>
          <span className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">{minRate.toFixed(2)}%</span>
        </div>

        {/* Chart area */}
        <div className="ml-10 md:ml-11 h-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="rateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            
            {/* Minimal grid */}
            {[0, 50, 100].map(i => (
              <line
                key={i}
                x1="0"
                y1={i}
                x2="100"
                y2={i}
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-gray-200 dark:text-gray-700"
              />
            ))}

            {/* Fill area */}
            <path
              d={`M 0,100 ${chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100
                const y = 100 - ((point.rate - minRate) / rateRange) * 85 - 7.5
                return `L ${x},${y}`
              }).join(' ')} L 100,100 Z`}
              fill="url(#rateGradient)"
            />

            {/* Rate line */}
            <path
              d={chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100
                const y = 100 - ((point.rate - minRate) / rateRange) * 85 - 7.5
                return `${index === 0 ? 'M' : 'L'} ${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="ml-10 md:ml-11 mt-1.5 flex justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(chartData[0]?.date)}</span>
          <span>{formatDate(chartData[chartData.length - 1]?.date)}</span>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">High</p>
          <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">{maxRate.toFixed(3)}%</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Avg</p>
          <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">
            {(chartData.reduce((sum, d) => sum + d.rate, 0) / chartData.length).toFixed(3)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Low</p>
          <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">{minRate.toFixed(3)}%</p>
        </div>
      </div>
    </div>
  )
}