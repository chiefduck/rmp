import { useEffect, useState, useRef } from 'react'
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
  const userId = user?.id ?? null
  
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [internalLoading, setInternalLoading] = useState(true)
  const isFetchingRef = useRef(false)
  const userIdRef = useRef<string | null>(null)
  
  // If userId just changed and we have a user, force loading=true
  // This prevents the race condition where ProtectedRoute sees loading=false before useEffect runs
  const loading = (userId !== userIdRef.current && userId !== null) || internalLoading

  useEffect(() => {
    const currentUserId = userId
    
    // Only re-run if the USER ID actually changed
    if (currentUserId === userIdRef.current && userIdRef.current !== null) {
      return
    }
    
    userIdRef.current = currentUserId
    setInternalLoading(true)
    
    if (!currentUserId) {
      setSubscription(null)
      setHasActiveSubscription(false)
      setInternalLoading(false)
      isFetchingRef.current = false
      return
    }

    const fetchSubscription = async () => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      try {
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', currentUserId)
          .is('deleted_at', null)
          .maybeSingle()

        if (customerError) throw customerError

        if (!customerData) {
          setSubscription(null)
          setHasActiveSubscription(false)
          setInternalLoading(false)
          return
        }

        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (subscriptionError) throw subscriptionError

        if (subscriptionData) {
          const isActive = ['active', 'trialing'].includes(subscriptionData.status)
          setSubscription(subscriptionData)
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
        setInternalLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchSubscription()

    const subscription_channel = supabase
      .channel('stripe_subscriptions_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stripe_subscriptions' }, () => {
        isFetchingRef.current = false
        fetchSubscription()
      })
      .subscribe()

    return () => {
      subscription_channel.unsubscribe()
    }
  }, [userId])

  return { subscription, loading, hasActiveSubscription }
}