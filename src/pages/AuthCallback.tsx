// src/pages/AuthCallback.tsx - Fixed to properly detect new users
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying email...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Getting session...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          navigate('/?error=auth_callback_failed')
          return
        }

        if (data.session) {
          const user = data.session.user
          console.log('Auth callback for user:', user.id)
          
          setStatus('Checking account status...')
          
          // Check if user has a profile (indicates if they've been through onboarding)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('has_seen_welcome')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile check error:', profileError)
          }

          // Determine if this is a new user based on profile welcome status
          const isNewUser = !profile || !profile.has_seen_welcome

          if (isNewUser) {
            console.log('New user detected - redirecting to billing onboarding')
            
            // Mark that they've seen the welcome (so they don't see it again)
            await supabase
              .from('profiles')
              .update({ has_seen_welcome: true })
              .eq('id', user.id)
            
            // Redirect to onboarding billing experience
            navigate('/billing?onboarding=true')
          } else {
            console.log('Existing user - redirecting to dashboard')
            navigate('/dashboard')
          }
        } else {
          // No session, redirect to home
          navigate('/')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/?error=auth_callback_failed')
      }
    }

    // Small delay to ensure Supabase auth state is ready
    const timer = setTimeout(handleAuthCallback, 1000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Setting Up Your Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {status}
        </p>
      </div>
    </div>
  )
}