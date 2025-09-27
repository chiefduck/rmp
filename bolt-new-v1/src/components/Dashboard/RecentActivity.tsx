import React from 'react'
import { Clock, TrendingUp, TrendingDown, Phone, Mail } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'

interface Activity {
  id: string
  type: 'rate_alert' | 'client_update' | 'call_made' | 'email_sent'
  message: string
  timestamp: string
  status?: 'success' | 'warning' | 'error'
}

export const RecentActivity: React.FC = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'rate_alert',
      message: 'Rate dropped to 6.85% - 3 clients notified',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'call_made',
      message: 'Auto-called John Smith about rate opportunity',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'client_update',
      message: 'Sarah Johnson moved to Application stage',
      timestamp: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'email_sent',
      message: 'Weekly rate report sent to 24 clients',
      timestamp: '2 hours ago',
      status: 'success'
    },
    {
      id: '5',
      type: 'rate_alert',
      message: 'FHA rates increased to 7.15%',
      timestamp: '3 hours ago',
      status: 'warning'
    }
  ]

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'rate_alert': return TrendingUp
      case 'client_update': return Clock
      case 'call_made': return Phone
      case 'email_sent': return Mail
      default: return Clock
    }
  }

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}