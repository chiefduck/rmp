import React, { useState } from 'react'
import { User, Bell, Key, Palette, Globe, Shield } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export const Settings: React.FC = () => {
  const { profile, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    company: profile?.company || '',
    phone: profile?.phone || ''
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(profileData)
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
    { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company"
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <Button type="submit" loading={loading}>
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Theme</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your preferred color scheme
                </p>
              </div>
              <Button variant="outline" onClick={toggleTheme}>
                {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <Select options={timezoneOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Rate Alerts</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when client target rates are reached
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive weekly performance reports via email
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">SMS Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get important alerts via text message
                </p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Call Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications about automated calling results
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API & Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">API Keys</h4>
              <div className="space-y-2">
                <Input
                  label="OpenAI API Key"
                  type="password"
                  placeholder="sk-..."
                  help="Required for AI assistant functionality"
                />
                <Input
                  label="Bland AI API Key"
                  type="password"
                  placeholder="bland_..."
                  help="Required for automated calling"
                />
                <Input
                  label="Resend API Key"
                  type="password"
                  placeholder="re_..."
                  help="Required for email notifications"
                />
              </div>
            </div>

            <Button variant="outline">
              Save API Keys
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Password</h4>
              <Button variant="outline">
                Change Password
              </Button>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline">
                Enable 2FA
              </Button>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Sessions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Manage your active sessions across devices
              </p>
              <Button variant="outline">
                View Active Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">Export Data</h4>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                Download all your data including clients, rates, and interactions
              </p>
              <Button variant="outline">
                Export My Data
              </Button>
            </div>

            <div>
              <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                Permanently delete your account and all associated data
              </p>
              <Button variant="danger">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}