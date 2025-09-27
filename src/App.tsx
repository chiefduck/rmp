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

const AppContent: React.FC = () => {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage 
                onLogin={() => setShowAuthModal(true)}
                onGetStarted={() => setShowAuthModal(true)}
              />
            )
          } 
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
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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