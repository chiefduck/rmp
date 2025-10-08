import React, { useState, useEffect } from 'react'
import { Bell, User, Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../ui/Card'
import { supabase } from '../../lib/supabase'
import { RateService } from '../../lib/rateService'

interface HeaderProps {
  onMenuToggle: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'rate_alert' | 'client_update' | 'system'
  client_id?: string
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { profile, user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 1. Fetch rate alerts (clients whose target rates have been reached)
      const rateAlerts = await RateService.checkRateAlerts()
      
      // 2. Fetch system notifications from database
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notifications:', error)
      }

      // 3. Combine rate alerts with system notifications
      const allNotifications: Notification[] = []

      // Add rate alerts as notifications
      rateAlerts.forEach((alert) => {
        allNotifications.push({
          id: `rate_${alert.id}`,
          title: '🎯 Target Rate Reached!',
          message: `${alert.first_name} ${alert.last_name}'s target rate of ${alert.target_rate}% has been reached for ${alert.loan_type} loan`,
          time: 'Just now',
          read: false,
          type: 'rate_alert',
          client_id: alert.id
        })
      })

      // Add database notifications
      if (dbNotifications && dbNotifications.length > 0) {
        dbNotifications.forEach((notif) => {
          allNotifications.push({
            id: notif.id,
            title: notif.title || 'Notification',
            message: notif.message || '',
            time: formatTimeAgo(new Date(notif.created_at)),
            read: notif.read || false,
            type: notif.type || 'system'
          })
        })
      }

      // If no notifications, show welcome message
      if (allNotifications.length === 0) {
        allNotifications.push({
          id: 'welcome',
          title: '👋 Welcome!',
          message: 'You\'re all set! We\'ll notify you when client target rates are reached.',
          time: '1 hour ago',
          read: true,
          type: 'system'
        })
      }

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([{
        id: 'error',
        title: '⚠️ Notice',
        message: 'Unable to load notifications. Please refresh.',
        time: 'Just now',
        read: false,
        type: 'system'
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const markAsRead = async (notificationId: string) => {
    // Only mark database notifications as read (not rate alerts)
    if (notificationId.startsWith('rate_')) {
      // Rate alerts are ephemeral, just update UI
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      return
    }

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id)

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Mark all database notifications as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)

      // Update all notifications in UI
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('.notification-panel')) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo/Title (visible on mobile when menu is closed) */}
        <div className="flex-1 md:flex-none">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white md:hidden">
            Rate Monitor Pro
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <div className="relative notification-panel">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 z-50">
                <Card className="shadow-2xl border border-gray-200 dark:border-gray-700">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mark all as read */}
                  {unreadCount > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                          className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* User Profile - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {profile?.company || 'Mortgage Pro'}
              </p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}