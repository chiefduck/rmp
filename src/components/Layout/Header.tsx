import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { supabase } from '../../lib/supabase'

export const Header: React.FC = () => {
  const { profile, user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  const fetchNotifications = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      // If no real notifications, show mock data for demo
      const realNotifications = data || []
      const mockNotifications = realNotifications.length === 0 ? [
        {
          id: '1',
          title: 'Rate Alert',
          message: 'Sarah Johnson\'s target rate of 6.95% has been reached',
          time: '5 min ago',
          read: false
        },
        {
          id: '2', 
          title: 'New Client',
          message: 'Mike Chen has been added to your pipeline',
          time: '1 hour ago',
          read: false
        },
        {
          id: '3',
          title: 'Call Completed',
          message: 'Automated call to Lisa Rodriguez completed successfully',
          time: '2 hours ago',
          read: true
        }
      ] : realNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleString(),
        read: n.read
      }))
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Fallback to mock data on error
      setNotifications([
        {
          id: '1',
          title: 'Welcome',
          message: 'Welcome to Rate Monitor Pro!',
          time: '1 hour ago',
          read: false
        }
      ])
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user])
  
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients, rates, or anything..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
            <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 z-50">
                <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {profile?.company || 'Mortgage Professional'}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}