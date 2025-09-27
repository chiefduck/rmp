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
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Check if development mode is enabled
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setHasActiveSubscription(devMode) // Allow access in dev mode
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        // First, get the customer ID from stripe_customers table
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError
        }

        if (!customerData) {
          // No customer record exists, create one for trial
          await createTrialSubscription()
          return
        }

        // Get subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError
        }

        if (subscriptionData) {
          setSubscription(subscriptionData)
          const isActive = ['trialing', 'active'].includes(subscriptionData.status)
          setHasActiveSubscription(isActive || devMode)
        } else {
          // No subscription exists, create trial
          await createTrialSubscription()
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(null)
        setHasActiveSubscription(devMode) // Allow access in dev mode even on error
      } finally {
        setLoading(false)
      }
    }

    const createTrialSubscription = async () => {
      try {
        // Create a customer record if it doesn't exist
        const { data: existingCustomer } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        let customerId = existingCustomer?.customer_id

        if (!customerId) {
          // Generate a temporary customer ID for trial users
          customerId = `trial_${user.id}`
          
          const { error: customerError } = await supabase
            .from('stripe_customers')
            .insert({
              user_id: user.id,
              customer_id: customerId
            })

          if (customerError) {
            console.error('Error creating customer:', customerError)
            return
          }
        }

        // Create trial subscription
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

        const { data: trialSubscription, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .insert({
            customer_id: customerId,
            status: 'trialing',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(trialEndDate.getTime() / 1000),
            cancel_at_period_end: false
          })
          .select()
          .single()

        if (subscriptionError) {
          console.error('Error creating trial subscription:', subscriptionError)
          return
        }

        setSubscription(trialSubscription)
        setHasActiveSubscription(true)
      } catch (error) {
        console.error('Error creating trial subscription:', error)
      }
    }

    fetchSubscription()

    // Set up real-time subscription updates
    const subscription_channel = supabase
      .channel('stripe_subscriptions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'stripe_subscriptions'
        }, 
        (payload) => {
          // Check if this update is for the current user's subscription
          fetchSubscription()
        }
      )
      .subscribe()

    return () => {
      subscription_channel.unsubscribe()
    }
  }, [user, devMode])

  return { subscription, loading, hasActiveSubscription }
}