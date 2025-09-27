import React, { useState } from 'react'
import { User, Bell, Key, Palette, Globe, Shield, Code } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Switch } from '../components/ui/Switch'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export const Settings: React.FC = () => {
  const { user, profile, updateProfile, updateEmail } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [devMode, setDevMode] = useState(localStorage.getItem('devMode') === 'true')
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    company: profile?.company || '',
    phone: profile?.phone || ''
  })

  const handleDevModeToggle = (enabled: boolean) => {
    setDevMode(enabled)
    localStorage.setItem('devMode', enabled.toString())
    if (enabled) {
      alert('Development mode enabled. Subscription checks will be bypassed. Refresh the page for changes to take effect.')
    } else {
      alert('Development mode disabled. Normal subscription checks will apply. Refresh the page for changes to take effect.')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Update email if it changed
      if (profileData.email !== user?.email) {
        setEmailLoading(true)
        const { error: emailError } = await updateEmail(profileData.email)
        if (emailError) {
          alert(`Failed to update email: ${emailError.message}`)
          setEmailLoading(false)
          setLoading(false)
          return
        }
        alert('Email update initiated. Please check your new email for a confirmation link.')
      }

      // Update profile data (excluding email since it's handled by auth)
      const { email, ...profileUpdates } = profileData
      await updateProfile(profileUpdates)
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
      setEmailLoading(false)
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
                help="Changing your email will require verification"
              />
            </div>
            
            <Input
              label="Avatar URL"
              value={profileData.avatar_url}
              onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
              help="URL to your profile picture"
            />
            
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
              {emailLoading ? 'Updating Email...' : 'Update Profile'}
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

      {/* Development Settings */}
      {import.meta.env.VITE_APP_ENV === 'development' && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Development Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Development Mode</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bypass subscription checks for testing purposes
                  </p>
                </div>
                <Switch 
                  checked={devMode} 
                  onChange={handleDevModeToggle}
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Test Data Seeding
                </h5>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Seed Test Clients
                  </Button>
                  <Button variant="outline" size="sm">
                    Create Trial Subscription
                  </Button>
                  <Button variant="outline" size="sm">
                    Simulate Active Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure your API keys for various integrations. These are stored securely and encrypted.
              </p>
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
                <Input
                  label="Stripe Publishable Key"
                  type="password"
                  placeholder="pk_test_..."
                  help="Required for payment processing"
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

      {/* Stripe Testing */}
      {import.meta.env.VITE_APP_ENV === 'development' && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">
              Stripe Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use these test card numbers in Stripe checkout:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Successful payment:</span>
                  <span>4242 4242 4242 4242</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment declined:</span>
                  <span>4000 0000 0000 0002</span>
                </div>
                <div className="flex justify-between">
                  <span>Insufficient funds:</span>
                  <span>4000 0000 0000 9995</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired card:</span>
                  <span>4000 0000 0000 0069</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Use any future expiry date (e.g., 12/34) and any 3-digit CVC (e.g., 123)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}