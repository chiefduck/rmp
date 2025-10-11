// src/components/RateMonitor/RateAlertsSection.tsx
import React from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'

interface Alert {
  id: number
  message: string
  type: 'success' | 'warning' | 'info'
  time: string
  urgent: boolean
}

interface RateAlertsSectionProps {
  alerts: Alert[]
  isExpanded: boolean
  onToggle: () => void
}

export const RateAlertsSection: React.FC<RateAlertsSectionProps> = ({ alerts, isExpanded, onToggle }) => {
  const alertColors = {
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
  }

  return (
    <Card>
      <CardHeader>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
            <span>Rate Alerts ({alerts.length})</span>
          </CardTitle>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 md:p-4 rounded-xl border ${alertColors[alert.type] || 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs md:text-sm text-gray-900 dark:text-gray-100 flex-1 break-words">
                    {alert.message}
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}