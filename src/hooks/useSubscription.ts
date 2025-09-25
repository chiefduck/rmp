import { useEffect, useState } from 'react'
import { supabase, Subscription } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setHasActiveSubscription(false)
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          setSubscription(data)
          setHasActiveSubscription(data.status === 'active' || data.status === 'trialing')
        } else {
          setSubscription(null)
          setHasActiveSubscription(false)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(null)
        setHasActiveSubscription(false)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()

    // Set up real-time subscription updates
    const subscription_subscription = supabase
      .channel('subscriptions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          if (payload.new) {
            const newSub = payload.new as Subscription
            setSubscription(newSub)
            setHasActiveSubscription(newSub.status === 'active' || newSub.status === 'trialing')
          }
        }
      )
      .subscribe()

    return () => {
      subscription_subscription.unsubscribe()
    }
  }, [user])

  return { subscription, loading, hasActiveSubscription }
}