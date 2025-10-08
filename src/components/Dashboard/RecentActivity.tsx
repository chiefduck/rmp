import React, { useState, useEffect } from 'react'
import { Clock, TrendingUp, Phone, Mail, User, Target, AlertCircle, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface ActivityItem {
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
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentActivity()
    }
  }, [user, refreshTrigger])

  const fetchRecentActivity = async () => {
    if (!user) return

    try {
      const activities: ActivityItem[] = []
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // 1. Fetch new clients
      const { data: newClients } = await supabase
        .from('clients')
        .select('id, first_name, last_name, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      newClients?.forEach(client => {
        activities.push({
          id: `new_client_${client.id}`,
          type: 'new_client',
          message: `Added ${client.first_name} ${client.last_name}`,
          timestamp: formatTimeAgo(new Date(client.created_at)),
          status: 'success',
          client_name: `${client.first_name} ${client.last_name}`
        })
      })

      // 2. Fetch rate changes
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
          const changeDirection = rate.change_1_day > 0 ? 'up' : 'down'
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

      // 3. Check target rates
      const { data: clientsWithTargets } = await supabase
        .from('clients')
        .select('id, first_name, last_name, target_rate, loan_type, updated_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('target_rate', 'is', null)

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
              message: `${client.first_name} ${client.last_name} target reached`,
              timestamp: formatTimeAgo(rateDate),
              status: 'success',
              client_name: `${client.first_name} ${client.last_name}`,
              rate_value: relevantRate.rate_value
            })
          }
        }
      })

      // 4. Track client updates
      const { data: recentUpdates } = await supabase
        .from('clients')
        .select('id, first_name, last_name, current_stage, updated_at, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
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
            message: `${client.first_name} ${client.last_name} → ${client.current_stage}`,
            timestamp: formatTimeAgo(updatedAt),
            status: 'info',
            client_name: `${client.first_name} ${client.last_name}`,
            stage_to: client.current_stage
          })
        }
      })

      activities.sort((a, b) => parseTimeAgo(a.timestamp) - parseTimeAgo(b.timestamp))
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

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo === 'now') return 0
    if (timeAgo.includes('m')) return parseInt(timeAgo)
    if (timeAgo.includes('h')) return parseInt(timeAgo) * 60
    if (timeAgo.includes('d')) return parseInt(timeAgo) * 60 * 24
    return 0
  }

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'rate_alert': return Target
      case 'rate_change': return TrendingUp
      case 'client_update': 
      case 'stage_change': return Activity
      case 'new_client': return User
      case 'call_made': return Phone
      case 'email_sent': return Mail
      default: return AlertCircle
    }
  }

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'warning': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 md:p-5">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Recent Activity
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-3 md:p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] md:text-xs font-medium">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Compact Activity List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[120px] md:min-h-[140px] pr-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">No recent activity</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500">Activity appears as you use the system</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getIcon(activity.type)
            
            return (
              <div 
                key={activity.id} 
                className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                {/* Compact Icon */}
                <div className={`flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-lg ${getStatusColor(activity.status)} flex items-center justify-center`}>
                  <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </div>

                {/* Compact Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">
                    {activity.message}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {activity.timestamp}
                  </p>
                </div>

                {/* Optional rate badge */}
                {activity.rate_value && (
                  <div className="flex-shrink-0 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] md:text-xs font-semibold">
                    {activity.rate_value.toFixed(3)}%
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Compact Footer */}
      {activities.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] md:text-xs text-center text-gray-500 dark:text-gray-400">
            {activities.length} recent {activities.length === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      )}
    </div>
  )
}