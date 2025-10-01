import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'
import { AppLayout } from './components/Layout/AppLayout'
import { AuthModal } from './components/Auth/AuthModal'
import { Dashboard } from './pages/Dashboard'
import { RateMonitor } from './pages/RateMonitor'
import { CRM } from './pages/CRM'
import { AIAssistant } from './pages/AIAssistant'
import { AutoCalling } from './pages/AutoCalling'
import { Billing } from './pages/Billing'
import { Settings } from './pages/Settings'
import { LandingPage } from './pages/LandingPage'
import { AuthCallback } from './pages/AuthCallback'
import { useState } from 'react'
import { useSubscription } from './hooks/useSubscription'

const LandingRoute: React.FC<{ onShowAuth: () => void }> = ({ onShowAuth }) => {
  const { user } = useAuth()
  const { hasActiveSubscription, loading, subscription } = useSubscription()

  // Debug logging
  console.log('LandingRoute render:', { 
    userId: user?.id,
    userEmail: user?.email,
    hasUser: !!user, 
    hasActiveSubscription, 
    loading,
    subscriptionStatus: subscription?.status
  })

  // Show loading while checking auth or subscription
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // If logged in AND has active subscription, go to dashboard
  if (user && hasActiveSubscription) {
    console.log('Redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('Showing landing page')

  // If logged in but NO subscription, they need to subscribe
  // Keep them on landing page so they can see the issue or contact support
  
  // Otherwise show landing page (logged out OR logged in without subscription)
  return (
    <LandingPage 
      onLogin={onShowAuth}
      onGetStarted={onShowAuth}
    />
  )
}

const AppContent: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={<LandingRoute onShowAuth={() => setShowAuthModal(true)} />}
        />
        
        {/* Auth Callback Route */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected App Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rates" element={<RateMonitor />} />
          <Route path="crm" element={<CRM />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="calling" element={<AutoCalling />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Billing />} />
        </Route>
        
        {/* Catch all route - go to landing, not dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App