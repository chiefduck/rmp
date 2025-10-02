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
import { Loader2 } from 'lucide-react'

// Simple component to handle landing page logic
const Landing: React.FC<{ onShowAuth: () => void; onGetStarted: () => void }> = ({ onShowAuth, onGetStarted }) => {
  const { user } = useAuth()
  const { hasActiveSubscription, loading } = useSubscription()

  console.log('Landing component render - should ONLY show when on / route:', {
    path: window.location.pathname,
    hasUser: !!user,
    hasActiveSubscription,
    loading
  })

  // Show loader while checking subscription (only if logged in)
  if (user && loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // Redirect to dashboard if logged in with active subscription
  if (user && hasActiveSubscription) {
    console.log('Landing: Redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('Landing: Showing landing page')

  // Show landing page (logged out OR logged in without subscription)
  return (
    <LandingPage 
      onLogin={onShowAuth}
      onGetStarted={onGetStarted}
    />
  )
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
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App