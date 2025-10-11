// src/App.tsx - Updated with Opportunity Finder
import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute } from './components/Layout/ProtectedRoute'
import { AppLayout } from './components/Layout/AppLayout'
import { ScrollToTop } from './components/Layout/ScrollToTop'
import { AuthModal } from './components/Auth/AuthModal'
import Dashboard from './pages/Dashboard'
import { RateMonitor } from './pages/RateMonitor'
import { CRM } from './pages/CRM'
import { AutoCalling } from './pages/AutoCalling'
import { Billing } from './pages/Billing'
import { Settings } from './pages/Settings'
import { LandingPage } from './pages/LandingPage'
import { AuthCallback } from './pages/AuthCallback'
import { 
  PrivacyPolicyPage, 
  TermsOfServicePage, 
  CookiePolicyPage, 
  CompliancePage 
} from './pages/LegalPages'
import { useSubscription } from './hooks/useSubscription'
import { Loader2 } from 'lucide-react'

type LegalPageType = 'privacy' | 'terms' | 'cookies' | 'compliance' | null

// Simple component to handle landing page logic
const Landing: React.FC<{ 
  onShowAuth: () => void
  onGetStarted: () => void
  onLegalClick: (page: 'privacy' | 'terms' | 'cookies' | 'compliance') => void
}> = ({ onShowAuth, onGetStarted, onLegalClick }) => {
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
      onLegalClick={onLegalClick}
    />
  )
}

// Smart catch-all that waits for auth to load before redirecting
const CatchAll: React.FC<{ 
  onShowAuth: () => void
  onGetStarted: () => void
  onLegalClick: (page: 'privacy' | 'terms' | 'cookies' | 'compliance') => void
}> = ({ onShowAuth, onGetStarted, onLegalClick }) => {
  const { user, loading: authLoading } = useAuth()
  const { hasActiveSubscription, loading: subLoading } = useSubscription()
  const location = useLocation()

  // Show loader during auth check to prevent premature redirects
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // If authenticated with subscription, redirect to dashboard
  if (user && hasActiveSubscription) {
    return <Navigate to="/dashboard" replace />
  }

  // Otherwise, show landing page
  return <Landing onShowAuth={onShowAuth} onGetStarted={onGetStarted} onLegalClick={onLegalClick} />
}

const AppContent: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
  const [legalPage, setLegalPage] = useState<LegalPageType>(null)

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode)
    setShowAuthModal(true)
  }

  const handleLegalClick = (page: 'privacy' | 'terms' | 'cookies' | 'compliance') => {
    setLegalPage(page)
    // Scroll to top when opening legal page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackFromLegal = () => {
    setLegalPage(null)
    // Scroll to top when returning
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Show legal pages if one is selected
  if (legalPage === 'privacy') {
    return <PrivacyPolicyPage onBack={handleBackFromLegal} />
  }
  if (legalPage === 'terms') {
    return <TermsOfServicePage onBack={handleBackFromLegal} />
  }
  if (legalPage === 'cookies') {
    return <CookiePolicyPage onBack={handleBackFromLegal} />
  }
  if (legalPage === 'compliance') {
    return <CompliancePage onBack={handleBackFromLegal} />
  }

  return (
    <Router>
      {/* ScrollToTop component triggers on every route change */}
      <ScrollToTop />
      
      <Routes>
        {/* Public Landing Page */}
        <Route 
          path="/" 
          element={
            <Landing 
              onShowAuth={() => openAuthModal('signin')} 
              onGetStarted={() => openAuthModal('signup')}
              onLegalClick={handleLegalClick}
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
          <Route path="/calling" element={<AutoCalling />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/billing" element={<Billing />} />
        </Route>
        
        {/* Catch all - waits for auth before redirecting */}
        <Route 
          path="*" 
          element={
            <CatchAll 
              onShowAuth={() => openAuthModal('signin')} 
              onGetStarted={() => openAuthModal('signup')}
              onLegalClick={handleLegalClick}
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