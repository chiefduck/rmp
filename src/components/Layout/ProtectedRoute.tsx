// src/components/Layout/ProtectedRoute.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const { subscription, hasActiveSubscription, loading: subLoading } = useSubscription()
  const location = useLocation()


  // Show loader while checking auth OR subscription
  // Keep showing loader until we have a definitive answer
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to home
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // No active subscription - redirect to home
  // This only happens after loading is complete
  if (!hasActiveSubscription) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // All checks passed - show the protected content
  return <>{children}</>
}