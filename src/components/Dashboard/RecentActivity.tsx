import React, { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, Phone, Mail, User, Target, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Activity {
  id: string
  type: 'rate_alert' | 'client_update' | 'call_made' | 'email_sent' | 'rate_change' | 'new_client' | 'stage_change'
  message: string
  timestamp: string
  status?: 'success' | 'warning' | 'error' | 'info'
  client_name?: string
  rate_value?: number
  stage_from?: string
  stage_to?: string
}

export const RecentActivity: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentActivity()
    }
  }, [user, refreshTrigger])

// In RecentActivity.tsx, replace the fetchRecentActivity function with this:

const fetchRecentActivity = async () => {
  if (!user) return

  try {
    const activities: Activity[] = []
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Fetch new clients added in last 7 days - EXCLUDE deleted
    const { data: newClients } = await supabase
      .from('clients')
      .select('id, first_name, last_name, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null) // ← ADDED
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    newClients?.forEach(client => {
      activities.push({
        id: `new_client_${client.id}`,
        type: 'new_client',
        message: `Added new client ${client.first_name} ${client.last_name}`,
        timestamp: formatTimeAgo(new Date(client.created_at)),
        status: 'success',
        client_name: `${client.first_name} ${client.last_name}`
      })
    })

    // 2. Fetch significant rate changes (±0.125% or more)
    const { data: recentRates } = await supabase
      .from('rate_history')
      .select('rate_date, rate_value, change_1_day, created_at')
      .eq('term_years', 30)
      .eq('loan_type', 'conventional')
      .gte('rate_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('rate_date', { ascending: false })
      .limit(3)

    recentRates?.forEach(rate => {
      if (rate.change_1_day && Math.abs(rate.change_1_day) >= 0.125) {
        const changeDirection = rate.change_1_day > 0 ? 'increased' : 'dropped'
        activities.push({
          id: `rate_change_${rate.rate_date}`,
          type: 'rate_change',
          message: `30yr rates ${changeDirection} to ${rate.rate_value.toFixed(3)}%`,
          timestamp: formatTimeAgo(new Date(rate.created_at || rate.rate_date)),
          status: rate.change_1_day > 0 ? 'warning' : 'success',
          rate_value: rate.rate_value
        })
      }
    })

    // 3. Check for clients whose target rates were recently met - EXCLUDE deleted
    const { data: clientsWithTargets } = await supabase
      .from('clients')
      .select('id, first_name, last_name, target_rate, loan_type, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null) // ← ADDED
      .not('target_rate', 'is', null)

    // Get latest rates to check against targets
    const { data: latestRates } = await supabase
      .from('rate_history')
      .select('rate_value, term_years, loan_type, rate_date')
      .order('rate_date', { ascending: false })
      .limit(10)

    clientsWithTargets?.forEach(client => {
      const relevantRate = latestRates?.find(rate => 
        (client.loan_type === 'conventional' && rate.term_years === 30 && rate.loan_type === 'conventional') ||
        (client.loan_type === 'fha' && rate.loan_type === 'fha') ||
        (client.loan_type === 'va' && rate.loan_type === 'va')
      )

      if (relevantRate && client.target_rate && relevantRate.rate_value <= client.target_rate) {
        const rateDate = new Date(relevantRate.rate_date)
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        
        if (rateDate >= threeDaysAgo) {
          activities.push({
            id: `rate_alert_${client.id}`,
            type: 'rate_alert',
            message: `${client.first_name} ${client.last_name}'s target rate of ${client.target_rate}% reached`,
            timestamp: formatTimeAgo(rateDate),
            status: 'success',
            client_name: `${client.first_name} ${client.last_name}`,
            rate_value: relevantRate.rate_value
          })
        }
      }
    })

    // 4. Track recent client updates - EXCLUDE deleted
    const { data: recentUpdates } = await supabase
      .from('clients')
      .select('id, first_name, last_name, current_stage, updated_at, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null) // ← ADDED
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5)

    recentUpdates?.forEach(client => {
      const updatedAt = new Date(client.updated_at)
      const createdAt = new Date(client.created_at)
      const timeDiff = Math.abs(updatedAt.getTime() - createdAt.getTime())
      
      if (updatedAt > sevenDaysAgo && timeDiff > 60000) {
        activities.push({
          id: `client_update_${client.id}`,
          type: 'stage_change',
          message: `${client.first_name} ${client.last_name} moved to ${client.current_stage} stage`,
          timestamp: formatTimeAgo(updatedAt),
          status: 'info',
          client_name: `${client.first_name} ${client.last_name}`,
          stage_to: client.current_stage
        })
      }
    })

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const timeA = parseTimeAgo(a.timestamp)
      const timeB = parseTimeAgo(b.timestamp)
      return timeA - timeB
    })

    setActivities(activities.slice(0, 5))
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    setActivities([])
  } finally {
    setLoading(false)
  }
}

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }

  const parseTimeAgo = (timeAgo: string): number => {
    // Simple parser for sorting - returns minutes ago
    if (timeAgo.includes('minute')) {
      return parseInt(timeAgo)
    } else if (timeAgo.includes('hour')) {
      return parseInt(timeAgo) * 60
    } else if (timeAgo.includes('day')) {
      return parseInt(timeAgo) * 60 * 24
    }
    return 0
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'rate_alert': return Target
      case 'rate_change': return TrendingUp
      case 'client_update': 
      case 'stage_change': return Clock
      case 'new_client': return User
      case 'call_made': return Phone
      case 'email_sent': return Mail
      default: return AlertCircle
    }
  }

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'warning': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity found</p>
              <p className="text-sm">Activity will appear here as you use the system</p>
            </div>
          ) : (
            activities.map((activity) => {
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
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}