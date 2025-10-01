// src/hooks/useSubscription.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface StripeSubscription {
  id: number
  customer_id: string
  subscription_id: string | null
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean | null
  payment_method_brand: string | null
  payment_method_last4: string | null
  status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null)
  // Initialize loading as true if user exists
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    // Reset state when user changes
    setLoading(true)
    setSubscription(null)
    setHasActiveSubscription(false)

    if (!user) {
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        // Get customer ID
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        if (customerError) {
          throw customerError
        }

        // No customer = no subscription
        if (!customerData) {
          setSubscription(null)
          setHasActiveSubscription(false)
          setLoading(false)
          return
        }

        // Get subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (subscriptionError) {
          throw subscriptionError
        }

        if (subscriptionData) {
          setSubscription(subscriptionData)
          // Only 'active' or 'trialing' = access granted
          const isActive = ['active', 'trialing'].includes(subscriptionData.status)
          setHasActiveSubscription(isActive)
        } else {
          setSubscription(null)
          setHasActiveSubscription(false)
        }

      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(null)
        setHasActiveSubscription(false)
      } finally {
        // Always set loading to false when done
        setLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchSubscription()

    // Set up real-time subscription updates
    const subscription_channel = supabase
      .channel('stripe_subscriptions_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'stripe_subscriptions'
        }, 
        () => {
          fetchSubscription()
        }
      )
      .subscribe()

    return () => {
      subscription_channel.unsubscribe()
    }
  }, [user])

  return { subscription, loading, hasActiveSubscription }
}