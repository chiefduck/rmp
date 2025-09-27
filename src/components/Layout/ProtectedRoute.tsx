import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { Loader2, Clock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresSubscription?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresSubscription = true 
}) => {
  const { user, loading: authLoading } = useAuth()
  const { subscription, hasActiveSubscription, loading: subLoading } = useSubscription()
  const location = useLocation()

  // Development mode bypass
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'

  if (authLoading || (user && subLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check if subscription is required and user doesn't have active subscription
  // Don't redirect while subscription is still loading to prevent F5 redirect issues
  if (requiresSubscription && !hasActiveSubscription && !devMode && !subLoading) {
    // Check if trial has expired
    const isTrialExpired = subscription?.status === 'trialing' && 
      subscription?.current_period_end && 
      new Date(subscription.current_period_end * 1000) < new Date()

    // Only redirect if we're not loading AND (trial expired OR no subscription exists)
    if (isTrialExpired || (!subscription && !subLoading)) {
      return <Navigate to="/billing" replace />
    }

    // Show trial warning for last 3 days
    const trialDaysRemaining = subscription?.current_period_end ? 
      Math.ceil((new Date(subscription.current_period_end * 1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

    if (subscription?.status === 'trialing' && trialDaysRemaining <= 3) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Trial Ending Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}. 
              Subscribe now to continue using Rate Monitor Pro.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/billing'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Subscribe Now
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}