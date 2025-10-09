// src/pages/AuthCallback.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { products } from '../stripe-config'
import { Loader2 } from 'lucide-react'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying email...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Getting session...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          navigate('/?error=auth_callback_failed')
          return
        }

        if (!data.session) {
          navigate('/')
          return
        }

        const user = data.session.user
        
        setStatus('Checking subscription...')
        
        // Check if user has a Stripe customer record
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        // If no customer exists, this is a new signup - redirect to Stripe
        if (!customer) {
          setStatus('Creating checkout session...')
          await redirectToStripeCheckout(data.session.access_token)
          return
        }

        // Check subscription status
        const { data: subscription } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customer.customer_id)
          .is('deleted_at', null)
          .maybeSingle()

        // If they have active or trialing status, go to dashboard
        if (subscription && ['active', 'trialing'].includes(subscription.status)) {
          navigate('/dashboard')
        } else {
          // No active subscription - redirect to Stripe
          setStatus('Creating checkout session...')
          await redirectToStripeCheckout(data.session.access_token)
        }

      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/?error=auth_callback_failed')
      }
    }

    const redirectToStripeCheckout = async (accessToken: string) => {
      try {
        const PRICE_ID = products[0].priceId
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              price_id: PRICE_ID,
              success_url: `${window.location.origin}/dashboard`,
              cancel_url: `${window.location.origin}/`,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Stripe checkout failed:', errorData)
          throw new Error(`Failed to create checkout session: ${errorData.error || response.statusText}`)
        }

        const data = await response.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL returned from Stripe')
        }
      } catch (error) {
        console.error('Stripe checkout error:', error)
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => navigate('/'), 3000)
      }
    }

    const timer = setTimeout(handleAuthCallback, 1000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Setting Up Your Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {status}
        </p>
      </div>
    </div>
  )
}