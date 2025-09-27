import React, { useState, useEffect } from 'react'
import { CreditCard, Check, Star, Shield, Zap, Loader2, Calendar, AlertCircle, ExternalLink, Gift, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { products } from '../stripe-config'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface BillingPageProps {
  variant?: 'onboarding' | 'management'
}

export const Billing: React.FC<BillingPageProps> = ({ variant = 'management' }) => {
  const { user } = useAuth()
  const { subscription, hasActiveSubscription, loading: subscriptionLoading } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const getTrialDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0
    const endDate = new Date(subscription.current_period_end * 1000)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }
  const urlParams = new URLSearchParams(window.location.search)

  // Determine billing variant based on user state
  const isNewUser = !subscription || subscription.status === 'not_started'
  const isTrialExpiring = subscription?.subscription_status === 'trialing' && getTrialDaysRemaining() <= 3
// Show onboarding if: URL param OR new user OR during trial period
  const isOnboarding = urlParams.get('onboarding') === 'true'
  const isTrialing = subscription?.status === 'trialing'
  const actualVariant = isOnboarding || isNewUser || isTrialing ? 'onboarding' : variant

  const currentProduct = products.find(p => p.priceId === subscription?.price_id)
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development'
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'

  useEffect(() => {
    // Check for success/cancel parameters
    if (urlParams.get('success')) {
      setSuccess('Payment successful! Your subscription is now active.')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    if (urlParams.get('canceled')) {
      setError('Payment was canceled. You can try again anytime.')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (user && hasActiveSubscription && actualVariant === 'management') {
      fetchBillingHistory()
    }
  }, [user, hasActiveSubscription, actualVariant])

  const fetchBillingHistory = async () => {
    if (!user) return
    
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setBillingHistory(data || [])
    } catch (error) {
      console.error('Error fetching billing history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!user) return
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session); 
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/billing?success=true`,
          cancel_url: `${window.location.origin}/billing?canceled=true`,
          mode: 'subscription'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
  
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          return_url: `${window.location.origin}/billing`
        })
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to open billing portal')
      }
  
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100) // Stripe amounts are in cents
  }

  const features = [
    'Real-time mortgage rate monitoring',
    'Complete CRM with pipeline management', 
    'AI-powered portfolio insights',
    'Automated client calling with Bland AI',
    'Email automation and notifications',
    'Rate history and trend analysis',
    'Client target rate tracking',
    'Custom rate alerts and notifications',
    'Dark/light mode interface',
    'Mobile responsive design',
    'Priority customer support',
    'API access for integrations'
  ]

  if (subscriptionLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Onboarding Experience for New Users
  if (actualVariant === 'onboarding') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <Gift className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">
  {isOnboarding && !subscription ? 'Welcome to Rate Monitor Pro! 🎉' : 'Your Free Trial is Active! 🚀'}
</h1>
<p className="text-xl text-blue-100 mb-4">
  {isOnboarding && !subscription 
    ? 'Your 14-day free trial starts now - no credit card required'
    : `${getTrialDaysRemaining()} days remaining in your free trial`
  }
</p>
          <div className="bg-white/20 rounded-xl p-4 inline-block">
            <p className="text-lg font-semibold">
              Trial expires in {getTrialDaysRemaining()} days
            </p>
          </div>
        </div>

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Everything You Need to Scale Your Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Start exploring all features immediately. When you're ready to continue after your trial:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  ${products[0].price}/month
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Cancel anytime • 30-day money-back guarantee
                </p>
                <Button 
                  onClick={() => handleSubscribe(products[0].priceId)} 
                  loading={loading}
                  size="lg"
                  className="px-8"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscribe Now (Optional)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started in 3 Easy Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Add Your Clients</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Import or manually add your client database with target rates
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Set Up Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure rate alerts and automated calling preferences
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Watch It Work</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when rates hit targets and close more deals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Management Experience for Existing Users
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Rate Monitor Pro subscription
        </p>
      </div>

      {/* Development Mode Notice */}
      {devMode && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                Development Mode: Subscription checks are bypassed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Expiring Warning */}
      {isTrialExpiring && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                  Trial Ending Soon
                </h3>
                <p className="text-orange-800 dark:text-orange-300">
                  Your trial expires in {getTrialDaysRemaining()} days. Subscribe now to continue using Rate Monitor Pro without interruption.
                </p>
              </div>
              <Button onClick={() => handleSubscribe(products[0].priceId)} loading={loading}>
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Current Plan: {hasActiveSubscription ? currentProduct?.name || 'Active Subscription' : 'No Active Subscription'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {hasActiveSubscription ? (
                  isTrialing ? (
                    `Trial: ${getTrialDaysRemaining()} days remaining`
                  ) : (
                    `Status: ${subscription?.status} • Next billing: ${subscription?.current_period_end ? formatDate(new Date(subscription.current_period_end * 1000).toISOString()) : 'N/A'}`
                  )
                ) : (
                  'Subscribe to access all features'
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${hasActiveSubscription ? currentProduct?.price || '49.99' : '0'}
              </p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
          
          {hasActiveSubscription && !isTrialing && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                loading={loading}
                size="sm"
              >
                Cancel Subscription
              </Button>
            </div>
          )}

            {subscription?.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                 <p className="text-orange-800 dark:text-orange-300 text-sm">
                 Your subscription is scheduled to cancel on {formatDate(new Date(subscription.current_period_end * 1000).toISOString())}. 
                  You'll continue to have full access until then.
                 </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans for Non-Subscribers */}
      {!hasActiveSubscription && products.map((product, index) => (
        <Card key={product.priceId} className="relative overflow-hidden">
          {index === 0 && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-bl-2xl">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Most Popular</span>
              </div>
            </div>
          )}

          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.description}
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  ${product.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  per {product.interval}
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                14-day free trial • Cancel anytime
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => handleSubscribe(product.priceId)} 
              loading={loading}
              size="lg" 
              className="w-full mb-4"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🔒 Secure payment processing by Stripe
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ✨ Cancel anytime • 30-day money-back guarantee
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Billing History */}
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : billingHistory.length > 0 ? (
              <div className="space-y-4">
                {billingHistory.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(bill.amount)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(bill.created_at)} • {bill.status}
                      </p>
                    </div>
                    {bill.invoice_pdf && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No billing history available yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Value Proposition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Save Time
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automated workflows save 10+ hours per week on client management and follow-ups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Increase Revenue
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Never miss rate opportunities. Average users see 35% increase in conversion rates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Stay Competitive
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered insights and automation keep you ahead of the competition
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Development Testing */}
      {isDevelopment && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              Development Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use Stripe test cards for testing:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm font-mono">
                <div>Success: 4242 4242 4242 4242</div>
                <div>Decline: 4000 0000 0000 0002</div>
                <div>Insufficient funds: 4000 0000 0000 9995</div>
              </div>
              <p className="text-xs text-gray-500">
                Use any future expiry date and any 3-digit CVC
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}