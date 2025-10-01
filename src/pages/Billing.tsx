import React, { useState, useEffect } from 'react'
import { CreditCard, Check, Star, Shield, Zap, Loader2, Calendar, AlertCircle, ExternalLink, Gift, Clock, Crown, TrendingUp } from 'lucide-react'
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
  const isNewUser = !subscription || subscription.status === 'not_started'
  const isTrialExpiring = subscription?.subscription_status === 'trialing' && getTrialDaysRemaining() <= 3
  const isOnboarding = urlParams.get('onboarding') === 'true'
  const isTrialing = subscription?.status === 'trialing'
  const actualVariant = isOnboarding || isNewUser || isTrialing ? 'onboarding' : variant

  const currentProduct = products.find(p => p.priceId === subscription?.price_id)
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development'
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'

  useEffect(() => {
    if (urlParams.get('success')) {
      setSuccess('Payment successful! Your subscription is now active.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    if (urlParams.get('canceled')) {
      setError('Payment was canceled. You can try again anytime.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    // If new user without subscription, auto-start checkout
    if (user && !subscription && !loading) {
      handleSubscribe(products[0].priceId)
    }
  }, [user, subscription, loading])

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
    }).format(amount / 100)
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
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    )
  }

  // Onboarding Experience with Glassmorphism
  if (actualVariant === 'onboarding') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 text-white">
            <div className="text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 drop-shadow-sm" />
              <h1 className="text-4xl font-bold mb-2 drop-shadow-sm">
                {isOnboarding && !subscription ? 'Welcome to Rate Monitor Pro! 🎉' : 'Your Free Trial is Active! 🚀'}
              </h1>
              <p className="text-xl text-white/90 mb-4">
                {isOnboarding && !subscription 
                  ? 'Your 14-day free trial starts now - no credit card required'
                  : `${getTrialDaysRemaining()} days remaining in your free trial`
                }
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block border border-white/30">
                <p className="text-lg font-semibold">
                  Trial expires in {getTrialDaysRemaining()} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Showcase with Glassmorphism */}
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <Crown className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Full access to all premium features during your trial
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="text-center space-y-6">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start exploring all features immediately. When you're ready to continue after your trial:
            </p>
            <div className="relative backdrop-blur-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl"></div>
              <div className="relative">
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
                  className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscribe Now (Optional)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide with Glassmorphism */}
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Get Started in 3 Easy Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { number: 1, title: 'Add Your Clients', desc: 'Import or manually add your client database with target rates', color: 'from-blue-500 to-blue-600' },
              { number: 2, title: 'Set Up Monitoring', desc: 'Configure rate alerts and automated calling preferences', color: 'from-green-500 to-green-600' },
              { number: 3, title: 'Watch It Work', desc: 'Get notified when rates hit targets and close more deals', color: 'from-purple-500 to-purple-600' }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-xl font-bold text-white">{step.number}</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Management Experience with Glassmorphism
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 text-white">
          <div className="text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 drop-shadow-sm" />
            <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">
              Billing & Subscription
            </h1>
            <p className="text-white/90 text-lg">
              Manage your Rate Monitor Pro subscription
            </p>
          </div>
        </div>
      </div>

      {/* Development Mode Notice */}
      {devMode && (
        <div className="relative backdrop-blur-sm bg-yellow-50/60 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-300 font-medium">
              Development Mode: Subscription checks are bypassed
            </p>
          </div>
        </div>
      )}

      {/* Trial Expiring Warning */}
      {isTrialExpiring && (
        <div className="relative backdrop-blur-sm bg-orange-50/60 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                Trial Ending Soon
              </h3>
              <p className="text-orange-800 dark:text-orange-300">
                Your trial expires in {getTrialDaysRemaining()} days. Subscribe now to continue using Rate Monitor Pro without interruption.
              </p>
            </div>
            <Button 
              onClick={() => handleSubscribe(products[0].priceId)} 
              loading={loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      )}

      {/* Current Plan Status with Glassmorphism */}
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
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
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${hasActiveSubscription ? currentProduct?.price || '49.99' : '0'}
            </p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
        </div>
        
        {hasActiveSubscription && !isTrialing && (
          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button 
              variant="outline" 
              onClick={handleCancelSubscription}
              loading={loading}
              size="sm"
              className="backdrop-blur-sm bg-white/50 dark:bg-gray-700/50"
            >
              Manage Subscription
            </Button>
          </div>
        )}

        {subscription?.cancel_at_period_end && (
          <div className="mt-4 p-3 bg-orange-50/60 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50 backdrop-blur-sm">
            <p className="text-orange-800 dark:text-orange-300 text-sm">
              Your subscription is scheduled to cancel on {formatDate(new Date(subscription.current_period_end * 1000).toISOString())}. 
              You'll continue to have full access until then.
            </p>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="relative backdrop-blur-sm bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="relative backdrop-blur-sm bg-green-50/60 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Pricing Plans for Non-Subscribers */}
      {!hasActiveSubscription && products.map((product, index) => (
        <div key={product.priceId} className="relative overflow-hidden">
          <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-8">
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-bl-2xl rounded-tr-2xl">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Most Popular</span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  ${product.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-lg">
                  per {product.interval}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  14-day free trial • Cancel anytime
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center space-x-3 p-3 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => handleSubscribe(product.priceId)} 
              loading={loading}
              size="lg" 
              className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure payment processing by Stripe
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancel anytime • 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Billing History with Glassmorphism */}
      {hasActiveSubscription && (
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Billing History
            </h3>
          </div>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : billingHistory.length > 0 ? (
            <div className="space-y-3">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(bill.created_at)} • {bill.status}
                    </p>
                  </div>
                  {bill.invoice_pdf && (
                    <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/50 dark:bg-gray-700/50">
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
        </div>
      )}

      {/* Value Proposition with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: 'Save Time', desc: 'Automated workflows save 10+ hours per week on client management and follow-ups', color: 'from-green-500 to-emerald-500' },
          { icon: TrendingUp, title: 'Increase Revenue', desc: 'Never miss rate opportunities. Average users see 35% increase in conversion rates', color: 'from-blue-500 to-blue-600' },
          { icon: Shield, title: 'Stay Competitive', desc: 'AI-powered insights and automation keep you ahead of the competition', color: 'from-purple-500 to-purple-600' }
        ].map((item, index) => (
          <div key={index} className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 text-center">
            <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Development Testing with Glassmorphism */}
      {isDevelopment && (
        <div className="relative backdrop-blur-sm bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6">
          <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-4">
            Development Testing
          </h4>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use Stripe test cards for testing:
            </p>
            <div className="bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl space-y-2 text-sm font-mono border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-gray-900 dark:text-gray-100">Success: 4242 4242 4242 4242</div>
              <div className="text-gray-900 dark:text-gray-100">Decline: 4000 0000 0000 0002</div>
              <div className="text-gray-900 dark:text-gray-100">Insufficient funds: 4000 0000 0000 9995</div>
            </div>
            <p className="text-xs text-gray-500">
              Use any future expiry date and any 3-digit CVC
            </p>
          </div>
        </div>
      )}
    </div>
  )
}