import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Mail, Lock, User, Building } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Update mode when defaultMode changes
  useEffect(() => {
    setIsSignUp(defaultMode === 'signup')
  }, [defaultMode, isOpen])
  
  const passwordRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    company: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const password = passwordRef.current?.value || ''
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }



    try {
      if (isSignUp) {
        console.log('Starting signup...')
        const { error } = await signUp(formData.email, password, {
          full_name: formData.fullName,
          company: formData.company
        })
        if (error) throw error
        
        console.log('Signup successful')
        setSuccessMessage('Success! Please check your email for a verification link to complete your signup.')
        clearForm()
        
        setTimeout(() => {
          setSuccessMessage('')
          onClose()
        }, 5000)
        
      } else {
        console.log('Starting signin...')
        const { data, error } = await signIn(formData.email, password)
        
        console.log('Signin response:', { 
          hasData: !!data, 
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: error?.message 
        })
        
        if (error) throw error
        
        console.log('Signin successful, closing modal')
        clearForm()
        onClose()
        
        // Force a small delay to let auth state update
        setTimeout(() => {
          console.log('Auth state should be updated now')
        }, 100)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setFormData({ email: '', fullName: '', company: '' })
    if (passwordRef.current) {
      passwordRef.current.value = ''
    }
    setError('')
  }

  const resetForm = () => {
    clearForm()
    setSuccessMessage('')
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setIsForgotPassword(false)
    resetForm()
  }

  const showForgotPassword = () => {
    setIsForgotPassword(true)
    setIsSignUp(false)
    resetForm()
  }

  const backToSignIn = () => {
    setIsForgotPassword(false)
    resetForm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isForgotPassword 
            ? 'Enter your email to receive a password reset link'
            : isSignUp 
              ? 'Start your free trial of Rate Monitor Pro' 
              : 'Sign in to your Rate Monitor Pro account'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && !isForgotPassword && (
          <>
            <Input
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input
              label="Company"
              icon={<Building className="w-4 h-4" />}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </>
        )}

        <Input
          label="Email"
          type="email"
          icon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        {!isForgotPassword && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                ref={passwordRef}
                type="password"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="
                  block w-full rounded-xl border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 
                  text-gray-900 dark:text-gray-100
                  shadow-sm focus:border-blue-500 focus:ring-blue-500
                  transition-colors duration-200
                  pl-10 pr-4 py-2.5
                "
                placeholder="Enter your password"
              />
            </div>
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>
        )}

        {!isSignUp && !isForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={showForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </button>
          </div>
        )}

        {successMessage && (
          <div className="text-sm p-3 rounded-lg bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {error}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          disabled={loading || !!successMessage}
        >
          {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        {isForgotPassword ? (
          <button
            onClick={backToSignIn}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            disabled={loading || !!successMessage}
          >
            Back to Sign In
          </button>
        ) : (
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            disabled={loading || !!successMessage}
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : 'Need an account? Sign Up'
            }
          </button>
        )}
      </div>

      {isSignUp && !successMessage && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            What you get with Rate Monitor Pro:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Real-time mortgage rate monitoring</li>
            <li>• AI-powered client insights</li>
            <li>• Automated client calling</li>
            <li>• Complete CRM system</li>
            <li>• 14-day free trial</li>
          </ul>
        </div>
      )}
    </Modal>
  )
}