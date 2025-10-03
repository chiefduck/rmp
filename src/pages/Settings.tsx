import React, { useState, useEffect } from 'react'
import { User, Bell, CreditCard, Key, Trash2, Mail, Save, Loader2, AlertCircle, Check, Settings as SettingsIcon, Phone } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Profile, EmailPreferences, NotificationPreferences } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { products } from '../stripe-config'

type TabType = 'profile' | 'email' | 'notifications' | 'billing' | 'calling' | 'password' | 'danger'

export const Settings: React.FC = () => {
  const { user, profile, updateProfile } = useAuth()
  const { subscription, hasActiveSubscription, loading: subscriptionLoading } = useSubscription()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profileData, setProfileData] = useState({ full_name: profile?.full_name || '', company: profile?.company || '', phone: profile?.phone || '', email: profile?.email || user?.email || '' })
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({ user_id: user?.id || '', rate_alerts: true, weekly_reports: true, client_updates: true, market_insights: false, product_updates: true })
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({ user_id: user?.id || '', in_app_notifications: true, rate_alerts: true, call_results: true, system_updates: true })
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loadingBilling, setLoadingBilling] = useState(false)

  useEffect(() => {
    if (profile) setProfileData({ full_name: profile.full_name || '', company: profile.company || '', phone: profile.phone || '', email: profile.email || user?.email || '' })
  }, [profile, user])

  useEffect(() => {
    if (user) { fetchEmailPreferences(); fetchNotificationPreferences() }
  }, [user])

  useEffect(() => {
    if (activeTab === 'billing' && user && hasActiveSubscription) fetchBillingHistory()
  }, [activeTab, user, hasActiveSubscription])

  const fetchEmailPreferences = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('email_preferences').select('*').eq('user_id', user.id).single()
      if (data) setEmailPrefs(data)
      else if (error?.code === 'PGRST116') {
        const defaultPrefs = { user_id: user.id, rate_alerts: true, weekly_reports: true, client_updates: true, market_insights: false, product_updates: true }
        const { error: insertError } = await supabase.from('email_preferences').insert(defaultPrefs)
        if (!insertError) setEmailPrefs(defaultPrefs)
      }
    } catch (error) { console.error('Error fetching email preferences:', error) }
  }

  const fetchNotificationPreferences = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).single()
      if (data) setNotificationPrefs(data)
      else if (error?.code === 'PGRST116') {
        const defaultPrefs = { user_id: user.id, in_app_notifications: true, rate_alerts: true, call_results: true, system_updates: true }
        const { error: insertError } = await supabase.from('notification_preferences').insert(defaultPrefs)
        if (!insertError) setNotificationPrefs(defaultPrefs)
      }
    } catch (error) { console.error('Error fetching notification preferences:', error) }
  }

  const fetchBillingHistory = async () => {
    if (!user) return
    setLoadingBilling(true)
    try {
      const { data, error } = await supabase.from('billing_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      if (error) throw error
      setBillingHistory(data || [])
    } catch (error) { console.error('Error fetching billing history:', error) }
    finally { setLoadingBilling(false) }
  }

  const handleProfileSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      await updateProfile({ full_name: profileData.full_name, company: profileData.company, phone: profileData.phone })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally { setLoading(false) }
  }

  const handleEmailPrefsSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.from('email_preferences').upsert({ ...emailPrefs, user_id: user.id }, { onConflict: 'user_id' })
      if (error) throw error
      setMessage({ type: 'success', text: 'Email preferences saved!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } finally { setLoading(false) }
  }

  const handleNotificationPrefsSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.from('notification_preferences').upsert({ ...notificationPrefs, user_id: user.id }, { onConflict: 'user_id' })
      if (error) throw error
      setMessage({ type: 'success', text: 'Notification preferences saved!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } finally { setLoading(false) }
  }

  const handlePasswordChange = async () => {
    setLoading(true)
    setMessage(null)
    if (passwordData.new !== passwordData.confirm) { setMessage({ type: 'error', text: 'New passwords do not match' }); setLoading(false); return }
    if (passwordData.new.length < 8) { setMessage({ type: 'error', text: 'Password must be at least 8 characters' }); setLoading(false); return }
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser?.email) throw new Error('No user email found')
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: passwordData.current })
      if (signInError) throw new Error('Current password is incorrect')
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordData.new })
      if (updateError) throw updateError
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.')) return
    const confirmText = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmText !== 'DELETE') { setMessage({ type: 'error', text: 'Account deletion cancelled' }); return }
    setLoading(true)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' })
    } finally { setLoading(false) }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    setLoadingBilling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ return_url: `${window.location.origin}/settings` })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to open billing portal')
      }
      const { url } = await response.json()
      if (url) window.location.href = url
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally { setLoadingBilling(false) }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)
  const getTrialDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0
    const endDate = new Date(subscription.current_period_end * 1000)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const currentProduct = products.find(p => p.priceId === subscription?.price_id)
  const isTrialing = subscription?.status === 'trialing'

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'email' as TabType, label: 'Email', icon: Mail },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'billing' as TabType, label: 'Billing', icon: CreditCard },
    { id: 'calling' as TabType, label: 'Calling', icon: Phone },
    { id: 'password' as TabType, label: 'Password', icon: Key },
    { id: 'danger' as TabType, label: 'Danger', icon: Trash2 }
  ]

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6 px-2 md:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold drop-shadow-sm">Settings</h1>
              <p className="text-sm md:text-base text-white/90">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`relative backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border ${message.type === 'success' ? 'bg-green-50/60 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50' : 'bg-red-50/60 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
            <p className={`text-sm md:text-base ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{message.text}</p>
          </div>
        </div>
      )}

      {/* Mobile Tab Selector */}
      <div className="lg:hidden relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl p-2">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabType)}
          className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-medium"
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-2">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Profile Information</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Update your personal information</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input type="text" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
                    <input type="text" value={profileData.company} onChange={(e) => setProfileData({ ...profileData, company: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (Disabled for MVP)</label>
                    <input type="email" value={profileData.email} disabled className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed text-sm md:text-base" />
                    <p className="text-xs md:text-sm text-gray-500 mt-2">Email changes require verification. Contact support@ratemonitorpro.com</p>
                  </div>
                  <Button onClick={handleProfileSave} loading={loading} className="w-full md:w-auto min-h-[44px]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Email Preferences Tab */}
            {activeTab === 'email' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Email Preferences</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Choose what emails you want to receive</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {[
                    { key: 'rate_alerts', label: 'Rate Alerts', desc: 'Get notified when rates hit targets' },
                    { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Summary of rate changes' },
                    { key: 'client_updates', label: 'Client Updates', desc: 'Notifications about client activity' },
                    { key: 'market_insights', label: 'Market Insights', desc: 'Industry news and analysis' },
                    { key: 'product_updates', label: 'Product Updates', desc: 'New features and improvements' }
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between p-3 md:p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base">{pref.label}</p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{pref.desc}</p>
                      </div>
                      <button onClick={() => setEmailPrefs({ ...emailPrefs, [pref.key]: !emailPrefs[pref.key as keyof EmailPreferences] })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${emailPrefs[pref.key as keyof EmailPreferences] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailPrefs[pref.key as keyof EmailPreferences] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                  <Button onClick={handleEmailPrefsSave} loading={loading} className="w-full md:w-auto min-h-[44px]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Notification Preferences</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage your in-app notifications</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {[
                    { key: 'in_app_notifications', label: 'In-App Notifications', desc: 'Show notifications in the app' },
                    { key: 'rate_alerts', label: 'Rate Alerts', desc: 'Notify when target rates reached' },
                    { key: 'call_results', label: 'Call Results', desc: 'Updates about calling outcomes' },
                    { key: 'system_updates', label: 'System Updates', desc: 'Important announcements' }
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between p-3 md:p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base">{pref.label}</p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{pref.desc}</p>
                      </div>
                      <button onClick={() => setNotificationPrefs({ ...notificationPrefs, [pref.key]: !notificationPrefs[pref.key as keyof NotificationPreferences] })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${notificationPrefs[pref.key as keyof NotificationPreferences] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationPrefs[pref.key as keyof NotificationPreferences] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                  <Button onClick={handleNotificationPrefsSave} loading={loading} className="w-full md:w-auto min-h-[44px]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Billing & Subscription</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage your subscription</p>
                </div>
                {subscriptionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="bg-white/40 dark:bg-gray-700/40 rounded-xl p-4 md:p-6 border border-gray-200/50 dark:border-gray-600/50">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{hasActiveSubscription ? currentProduct?.name || 'Active Subscription' : 'No Active Subscription'}</h3>
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{hasActiveSubscription ? (isTrialing ? `Trial: ${getTrialDaysRemaining()} days remaining` : `Status: ${subscription?.status} • Renews ${subscription?.current_period_end ? formatDate(new Date(subscription.current_period_end * 1000).toISOString()) : 'N/A'}`) : 'No subscription found'}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">${hasActiveSubscription ? currentProduct?.price || '49' : '0'}</p>
                          <p className="text-xs md:text-sm text-gray-500">per month</p>
                        </div>
                      </div>
                      {hasActiveSubscription && (
                        <Button variant="outline" onClick={handleManageSubscription} loading={loadingBilling} className="w-full min-h-[44px]">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Manage Subscription
                        </Button>
                      )}
                      {subscription?.cancel_at_period_end && (
                        <div className="mt-4 p-3 bg-orange-50/60 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                          <p className="text-orange-800 dark:text-orange-300 text-xs md:text-sm">Subscription cancels on {formatDate(new Date(subscription.current_period_end * 1000).toISOString())}</p>
                        </div>
                      )}
                    </div>
                    {hasActiveSubscription && (
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 md:mb-4">Billing History</h3>
                        {loadingBilling ? (
                          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                        ) : billingHistory.length > 0 ? (
                          <div className="space-y-2 md:space-y-3">
                            {billingHistory.map(bill => (
                              <div key={bill.id} className="flex items-center justify-between p-3 md:p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base">{formatCurrency(bill.amount)}</p>
                                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{formatDate(bill.created_at)} • {bill.status}</p>
                                </div>
                                {bill.invoice_pdf && (
                                  <Button variant="outline" size="sm" asChild className="min-h-[36px] flex-shrink-0">
                                    <a href={bill.invoice_pdf} target="_blank" rel="noopener noreferrer">View</a>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400 text-center py-8 text-sm md:text-base">No billing history yet.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Auto-Calling Tab */}
            {activeTab === 'calling' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Auto-Calling Preferences</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Configure automated calling settings</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/60 to-blue-50/60 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-6 md:p-8 text-center">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-bl-xl text-xs md:text-sm font-medium">Coming Soon</div>
                  <Phone className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Automated Calling with Bland AI</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">Configure call schedules, scripts, and preferences for automated client outreach. Available in the next release.</p>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">Change Password</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                    <input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                    <input type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                    <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm md:text-base" />
                  </div>
                  <Button onClick={handlePasswordChange} loading={loading} className="w-full md:w-auto min-h-[44px]">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mb-1 md:mb-2">Danger Zone</h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Irreversible and destructive actions</p>
                </div>
                <div className="bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Account</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">Once you delete your account, there is no going back. This will permanently delete your account, all your clients, rates data, and cancel your subscription.</p>
                      <Button variant="outline" onClick={handleDeleteAccount} loading={loading} className="w-full md:w-auto min-h-[44px] border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}