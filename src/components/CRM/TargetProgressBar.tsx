import React from 'react'
import { TrendingDown, Target } from 'lucide-react'

interface TargetProgressBarProps {
  currentRate: number
  targetRate: number
  marketRate: number
  className?: string
}

export const TargetProgressBar: React.FC<TargetProgressBarProps> = ({
  currentRate,
  targetRate,
  marketRate,
  className = ''
}) => {
  // Calculate progress percentage (0-100)
  const calculateProgress = () => {
    if (marketRate <= targetRate) return 100 // Target achieved!
    if (marketRate >= currentRate) return 0  // No progress
    
    const totalDrop = currentRate - targetRate
    const currentDrop = currentRate - marketRate
    return Math.min(100, Math.max(0, (currentDrop / totalDrop) * 100))
  }

  const progress = calculateProgress()
  const isTargetReached = marketRate <= targetRate
  const rateDifference = Math.abs(marketRate - targetRate)

  const getProgressColor = () => {
    if (isTargetReached) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getProgressLabel = () => {
    if (isTargetReached) return 'Target Reached!'
    if (progress >= 90) return 'Almost There'
    if (progress >= 75) return 'Getting Close'
    if (progress >= 50) return 'Halfway There'
    if (progress >= 25) return 'Making Progress'
    return 'Far From Target'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with target info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-gray-400">
          <Target className="w-3 h-3" />
          <span>Target: {targetRate}%</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-400">
          <TrendingDown className="w-3 h-3" />
          <span>Market: {marketRate}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress indicator dot */}
        <div 
          className={`absolute top-1/2 w-3 h-3 rounded-full border-2 border-white transform -translate-y-1/2 transition-all duration-500 ${getProgressColor()}`}
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Progress status */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${isTargetReached ? 'text-green-400' : 'text-gray-300'}`}>
          {getProgressLabel()}
        </span>
        <span className="text-gray-400">
          {isTargetReached 
            ? `${rateDifference.toFixed(2)}% below target`
            : `${rateDifference.toFixed(2)}% to go`
          }
        </span>
      </div>

      {/* Achievement badge */}
      {isTargetReached && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-900/30 border border-green-600/50 rounded-full text-xs text-green-400">
            <Target className="w-3 h-3" />
            <span>Ready to Refinance</span>
          </div>
        </div>
      )}
    </div>
  )
}