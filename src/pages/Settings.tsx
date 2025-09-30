import React, { useState, useEffect } from 'react'
import { User, Bell, Shield, Mail, Phone, Settings2, Lock, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Switch } from '../components/ui/Switch'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const Settings: React.FC = () => {
  const { user, profile, updateProfile, updateEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    company: profile?.company || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || ''
  })

  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState({
    rate_alerts: true,
    weekly_reports: true,
    client_updates: true,
    market_insights: false,
    product_updates: true
  })
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(false)

  // Load email preferences on mount
  useEffect(() => {
    if (user) {
      fetchEmailPreferences()
      fetchNotificationPreferences()
    }
  }, [user])

  const fetchEmailPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setEmailPrefs({
          rate_alerts: data.rate_alerts,
          weekly_reports: data.weekly_reports,
          client_updates: data.client_updates,
          market_insights: data.market_insights,
          product_updates: data.product_updates
        })
      } else if (error && error.code === 'PGRST116') {
        // No preferences exist yet, create default ones
        const { data: newPrefs } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            rate_alerts: true,
            weekly_reports: true,
            client_updates: true,
            market_insights: false,
            product_updates: true
          })
          .select()
          .single()

        if (newPrefs) {
          setEmailPrefs({
            rate_alerts: newPrefs.rate_alerts,
            weekly_reports: newPrefs.weekly_reports,
            client_updates: newPrefs.client_updates,
            market_insights: newPrefs.market_insights,
            product_updates: newPrefs.product_updates
          })
        }
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error)
    }
  }

  const handleSaveEmailPreferences = async () => {
    if (!user) return

    setEmailPrefsLoading(true)
    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          ...emailPrefs
        })

      if (error) throw error
      alert('Email preferences saved successfully!')
    } catch (error) {
      console.error('Error saving email preferences:', error)
      alert('Failed to save email preferences')
    } finally {
      setEmailPrefsLoading(false)
    }
  }

  const fetchNotificationPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setNotificationPrefs({
          in_app_notifications: data.in_app_notifications,
          rate_alerts: data.rate_alerts,
          call_results: data.call_results,
          system_updates: data.system_updates
        })
      } else if (error && error.code === 'PGRST116') {
        // No preferences exist yet, create default ones
        const { data: newPrefs } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            in_app_notifications: true,
            rate_alerts: true,
            call_results: true,
            system_updates: true
          })
          .select()
          .single()

        if (newPrefs) {
          setNotificationPrefs({
            in_app_notifications: newPrefs.in_app_notifications,
            rate_alerts: newPrefs.rate_alerts,
            call_results: newPrefs.call_results,
            system_updates: newPrefs.system_updates
          })
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    }
  }

  const handleSaveNotificationPreferences = async () => {
    if (!user) return

    setNotificationPrefsLoading(true)
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...notificationPrefs
        })

      if (error) throw error
      alert('Notification preferences saved successfully!')
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      alert('Failed to save notification preferences')
    } finally {
      setNotificationPrefsLoading(false)
    }
  }

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    in_app_notifications: true,
    rate_alerts: true,
    call_results: true,
    system_updates: true
  })
  const [notificationPrefsLoading, setNotificationPrefsLoading] = useState(false)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Update profile data (excluding email since it's now disabled)
      const { email, ...profileUpdates } = profileData
      await updateProfile(profileUpdates)
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!passwordData.currentPassword) {
      alert('Please enter your current password')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long')
      return
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      alert('New password must be different from current password')
      return
    }

    setPasswordLoading(true)
    try {
      // First, verify the current password by attempting to sign in
      if (!user?.email) {
        throw new Error('User email not found')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        throw updateError
      }

      alert('Password updated successfully!')
      // Clear the form
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      console.error('Error changing password:', error)
      alert(`Failed to change password: ${error.message || 'Unknown error'}`)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including clients, rates, and activity history.'
    )
    if (!confirmation) return

    const doubleConfirmation = window.prompt(
      'To confirm deletion, please type "DELETE" in all caps:'
    )
    if (doubleConfirmation !== 'DELETE') {
      alert('Account deletion cancelled')
      return
    }

    try {
      if (!user) {
        alert('No user found')
        return
      }

      // Delete user account via Supabase Admin API
      // Note: This requires an Edge Function because client-side can't delete auth users
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      alert('Account deleted successfully. You will be signed out.')
      
      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to homepage or login
      window.location.href = '/'
    } catch (error: any) {
      console.error('Error deleting account:', error)
      alert(`Failed to delete account: ${error.message || 'Please contact support@ratemonitorpro.com'}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 text-white">
          <div className="text-center">
            <Settings2 className="w-12 h-12 mx-auto mb-4 drop-shadow-sm" />
            <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">
              Account Settings
            </h1>
            <p className="text-white/90 text-lg">
              Manage your profile, preferences, and security settings
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profile Information
          </h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder="Enter your email"
                />
                {/* Tooltip */}
                <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-0 mb-2 w-full max-w-xs bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 z-10">
                  Email cannot be changed as it's used for sign-in. To update your email, please contact support@ratemonitorpro.com
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Email updates require contacting support</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Picture URL
            </label>
            <input
              type="url"
              value={profileData.avatar_url}
              onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Company
              </label>
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Your company name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {emailLoading ? 'Updating Email...' : 'Update Profile'}
          </Button>
        </form>
      </div>

      {/* Email Preferences */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Email Preferences
          </h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'rate_alerts', title: 'Rate Alerts', desc: 'Get notified when client target rates are reached' },
            { key: 'weekly_reports', title: 'Weekly Reports', desc: 'Receive weekly performance and pipeline summaries' },
            { key: 'client_updates', title: 'Client Updates', desc: 'Notifications about client status changes and milestones' },
            { key: 'market_insights', title: 'Market Insights', desc: 'Analysis and trends from mortgage market data' },
            { key: 'product_updates', title: 'Product Updates', desc: 'New features, improvements, and platform updates' }
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{pref.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pref.desc}</p>
              </div>
              <Switch
                checked={emailPrefs[pref.key as keyof typeof emailPrefs]}
                onChange={(checked) => setEmailPrefs(prev => ({ ...prev, [pref.key]: checked }))}
              />
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSaveEmailPreferences}
          loading={emailPrefsLoading}
          className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Email Preferences
        </Button>
      </div>

      {/* Auto-Calling Preferences - Locked */}
      <div className="relative backdrop-blur-sm bg-gray-100/60 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 opacity-75">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Auto-Calling Preferences
            </h3>
          </div>
          <div className="flex items-center space-x-2 bg-orange-100/50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
            <Lock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Coming Soon</span>
          </div>
        </div>

        <div className="space-y-4 opacity-50">
          <div className="p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Call Triggers</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically call clients when their target rates are reached</p>
          </div>
          
          <div className="p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Call Scheduling</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Set business hours and optimal calling times</p>
          </div>
          
          <div className="p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Call Scripts</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize AI calling scripts and conversation flow</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'in_app_notifications', title: 'In-App Notifications', desc: 'Show notifications within the application' },
            { key: 'rate_alerts', title: 'Rate Alert Notifications', desc: 'Push notifications for important rate changes' },
            { key: 'call_results', title: 'Call Result Notifications', desc: 'Notifications about automated calling outcomes' },
            { key: 'system_updates', title: 'System Updates', desc: 'Notifications about maintenance and system changes' }
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{pref.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pref.desc}</p>
              </div>
              <Switch
                checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, [pref.key]: checked }))}
              />
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSaveNotificationPreferences}
          loading={notificationPrefsLoading}
          className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>

      {/* Security */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Security
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Change Password</h4>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter new password"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            loading={passwordLoading}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            <Shield className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="relative backdrop-blur-sm bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
            Danger Zone
          </h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-100/50 dark:bg-red-900/30 rounded-xl backdrop-blur-sm border border-red-200/50 dark:border-red-700/50">
            <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
              Permanently delete your account and all associated data including clients, rates, and activity history. This action cannot be undone.
            </p>
            <Button 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}