import React from 'react'
import { CreditCard, Check, Star, Shield, Zap } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const Billing: React.FC = () => {
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

  const handleSubscribe = () => {
    // In a real app, this would integrate with Stripe
    alert('Stripe integration would be implemented here. For demo purposes, consider this a successful subscription!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the plan that's right for your mortgage business
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Current Plan: Free Trial
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your 14-day free trial expires in 12 days
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$0</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plan */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-bl-2xl">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Most Popular</span>
          </div>
        </div>

        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Rate Monitor Pro
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everything you need to scale your mortgage business
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">$97</span>
              <span className="text-gray-600 dark:text-gray-400">per month</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Save $200+ per month compared to similar tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleSubscribe} size="lg" className="w-full mb-4">
            <CreditCard className="w-5 h-5 mr-2" />
            Subscribe Now
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

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Is there a setup fee?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No, there are no setup fees or hidden charges. The monthly fee is all you pay.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, we offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your first month.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                How does the AI calling work?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our AI automatically calls your clients when their target rates are reached, using natural-sounding voice and customizable scripts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}