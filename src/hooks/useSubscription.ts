// src/hooks/useSubscription.ts - Fixed to handle existing records
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
        console.log('Fetching subscription for user:', user.id)

        // First, get or create the customer record
        const customerId = await ensureCustomerExists()
        if (!customerId) {
          console.error('Failed to create or retrieve customer')
          setHasActiveSubscription(devMode)
          setLoading(false)
          return
        }

        // Get subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerId)
          .is('deleted_at', null)
          .maybeSingle()

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError
        }

        if (subscriptionData) {
          console.log('Found existing subscription:', subscriptionData)
          setSubscription(subscriptionData)
          const isActive = ['trialing', 'active'].includes(subscriptionData.status)
          setHasActiveSubscription(isActive || devMode)
        } else {
          console.log('No subscription found, creating trial')
          // No subscription exists, create trial
          const trialSub = await createTrialSubscription(customerId)
          if (trialSub) {
            setSubscription(trialSub)
            setHasActiveSubscription(true)
          } else {
            setHasActiveSubscription(devMode)
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(null)
        setHasActiveSubscription(devMode) // Allow access in dev mode even on error
      } finally {
        setLoading(false)
      }
    }

    const ensureCustomerExists = async (): Promise<string | null> => {
      try {
        // First check if customer already exists
        const { data: existingCustomer, error: selectError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError
        }

        if (existingCustomer) {
          console.log('Found existing customer:', existingCustomer.customer_id)
          return existingCustomer.customer_id
        }

        // Customer doesn't exist, create one
        const customerId = `trial_${user.id}`
        console.log('Creating new customer:', customerId)
        
        const { data: newCustomer, error: insertError } = await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            customer_id: customerId
          })
          .select('customer_id')
          .single()

        if (insertError) {
          // Handle the case where another process created the customer
          if (insertError.code === '23505') {
            console.log('Customer already exists (race condition), fetching existing')
            const { data: existingCustomer } = await supabase
              .from('stripe_customers')
              .select('customer_id')
              .eq('user_id', user.id)
              .is('deleted_at', null)
              .single()
            
            return existingCustomer?.customer_id || null
          }
          throw insertError
        }

        return newCustomer.customer_id
      } catch (error) {
        console.error('Error ensuring customer exists:', error)
        return null
      }
    }

    const createTrialSubscription = async (customerId: string): Promise<StripeSubscription | null> => {
      try {
        console.log('Creating trial subscription for customer:', customerId)
        
        // Check if subscription already exists first
        const { data: existingSubscription } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerId)
          .is('deleted_at', null)
          .maybeSingle()

        if (existingSubscription) {
          console.log('Subscription already exists:', existingSubscription)
          return existingSubscription
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
          // Handle the case where another process created the subscription
          if (subscriptionError.code === '23505') {
            console.log('Subscription already exists (race condition), fetching existing')
            const { data: existingSubscription } = await supabase
              .from('stripe_subscriptions')
              .select('*')
              .eq('customer_id', customerId)
              .is('deleted_at', null)
              .single()
            
            return existingSubscription || null
          }
          throw subscriptionError
        }

        console.log('Created trial subscription:', trialSubscription)
        return trialSubscription
      } catch (error) {
        console.error('Error creating trial subscription:', error)
        return null
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
          console.log('Subscription updated:', payload)
          // Refetch subscription data
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