import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, Building } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    company: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company: formData.company
        })
        if (error) throw error
        // Show success message for signup
        setError('Please check your email for verification link')
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        onClose()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '', company: '' })
    setError('')
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    resetForm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isSignUp 
            ? 'Start your free trial of Rate Monitor Pro' 
            : 'Sign in to your Rate Monitor Pro account'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
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

        <Input
          label="Password"
          type="password"
          icon={<Lock className="w-4 h-4" />}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        {error && (
          <div className={`text-sm p-3 rounded-lg ${
            error.includes('check your email') 
              ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}>
            {error}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={toggleMode}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          {isSignUp 
            ? 'Already have an account? Sign In' 
            : 'Need an account? Sign Up'
          }
        </button>
      </div>

      {isSignUp && (
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