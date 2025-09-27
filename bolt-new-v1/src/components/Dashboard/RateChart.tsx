import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'

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
  const rateRange = maxRate - minRate

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4">
            <span className="text-xs text-gray-500">{maxRate.toFixed(2)}%</span>
            <span className="text-xs text-gray-500">{((maxRate + minRate) / 2).toFixed(2)}%</span>
            <span className="text-xs text-gray-500">{minRate.toFixed(2)}%</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full relative">
            <svg className="w-full h-full">
              {/* Grid lines */}
              <defs>
                <linearGradient id="rateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Grid */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={`${i * 25}%`}
                  x2="100%"
                  y2={`${i * 25}%`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  className="dark:stroke-gray-700"
                />
              ))}

              {/* Rate line */}
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100
                  const y = 100 - ((point.rate - minRate) / rateRange) * 100
                  return `${x},${y}`
                }).join(' ')}
              />

              {/* Fill area */}
              <polygon
                fill="url(#rateGradient)"
                points={`0,100 ${chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100
                  const y = 100 - ((point.rate - minRate) / rateRange) * 100
                  return `${x},${y}`
                }).join(' ')} 100,100`}
              />
            </svg>
          </div>

          {/* Current rate indicator */}
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Current: {chartData[chartData.length - 1]?.rate.toFixed(3)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}