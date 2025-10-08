import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'
import { AppLayout } from './components/Layout/AppLayout'
import { AuthModal } from './components/Auth/AuthModal'
import Dashboard from './pages/Dashboard'
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
import { Loader2 } from 'lucide-react'

// Simple component to handle landing page logic
const Landing: React.FC<{ onShowAuth: () => void; onGetStarted: () => void }> = ({ onShowAuth, onGetStarted }) => {
  const { user, loading: authLoading } = useAuth()
  const { hasActiveSubscription, loading: subLoading } = useSubscription()
  const location = useLocation()

  // Show loader while checking subscription (only if logged in)
  if (authLoading || (user && subLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // Only redirect to dashboard if we're actually on the "/" route
  if (user && hasActiveSubscription && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />
  }

  // Show landing page (logged out OR logged in without subscription)
  return (
    <LandingPage 
      onLogin={onShowAuth}
      onGetStarted={onGetStarted}
    />
  )
}

// ✅ NEW: Smart catch-all that waits for auth to load before redirecting
const CatchAll: React.FC<{ onShowAuth: () => void; onGetStarted: () => void }> = ({ onShowAuth, onGetStarted }) => {
  const { user, loading: authLoading } = useAuth()
  const { hasActiveSubscription, loading: subLoading } = useSubscription()
  const location = useLocation()

  console.log('🔀 CatchAll route hit:', {
    path: location.pathname,
    authLoading,
    subLoading,
    hasUser: !!user,
    hasActiveSubscription
  })

  // ✅ CRITICAL: Show loader during auth check to prevent premature redirects
  if (authLoading || subLoading) {
    console.log('🔀 CatchAll: Auth/Sub loading, showing loader')
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // If authenticated with subscription, redirect to dashboard
  if (user && hasActiveSubscription) {
    console.log('🔀 CatchAll: Authenticated user, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // Otherwise, show landing page
  console.log('🔀 CatchAll: Not authenticated or no subscription, showing landing')
  return <Landing onShowAuth={onShowAuth} onGetStarted={onGetStarted} />
}

const AppContent: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode)
    setShowAuthModal(true)
  }

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route 
          path="/" 
          element={
            <Landing 
              onShowAuth={() => openAuthModal('signin')} 
              onGetStarted={() => openAuthModal('signup')}
            />
          }
        />
        
        {/* Auth Callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* All Protected Routes under one parent */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rates" element={<RateMonitor />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/calling" element={<AutoCalling />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/billing" element={<Billing />} />
        </Route>
        
        {/* ✅ FIXED: Catch all - waits for auth before redirecting */}
        <Route 
          path="*" 
          element={
            <CatchAll 
              onShowAuth={() => openAuthModal('signin')} 
              onGetStarted={() => openAuthModal('signup')}
            />
          } 
        />
      </Routes>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultMode={authModalMode}
      />
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App