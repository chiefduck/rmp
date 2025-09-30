import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updateEmail: (newEmail: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchProfile(session.user.id)
        
        // Handle email confirmation events
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          syncEmailWithProfile(session.user)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const syncEmailWithProfile = async (user: User) => {
    if (!user) return
    
    try {
      // Update profile email to match auth email
      const { error } = await supabase
        .from('profiles')
        .update({ email: user.email })
        .eq('id', user.id)
      
      if (!error) {
        console.log('Profile email synced with auth email:', user.email)
        // Refresh profile data
        await fetchProfile(user.id)
      }
    } catch (error) {
      console.error('Error syncing email with profile:', error)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const newProfile = {
            id: userData.user.id,
            email: userData.user.email, // Add email to new profile
            full_name: userData.user.user_metadata?.full_name || null,
            company: null,
            phone: null
          }
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()
            
          if (createdProfile && !createError) {
            setProfile(createdProfile)
          } else {
            console.error('Error creating profile:', createError)
          }
        }
      } else {
        console.error('Error fetching profile:', error)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectTo = import.meta.env.VITE_APP_ENV === 'development' 
      ? 'http://localhost:5173/auth/callback'
      : `${window.location.origin}/auth/callback`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: redirectTo
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      console.error('No user found for profile update')
      return
    }

    try {
      console.log('Updating profile with:', updates)
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      if (data) {
        console.log('Profile updated successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in updateProfile:', error)
      throw error
    }
  }

  const updateEmail = async (newEmail: string) => {
    try {
      console.log('Updating email to:', newEmail)
      
      // Configure redirect URL for email confirmation
      const redirectTo = import.meta.env.VITE_APP_ENV === 'development' 
        ? 'http://localhost:5173/auth/callback'
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.updateUser({
        email: newEmail
      }, {
        emailRedirectTo: redirectTo
      })

      if (error) {
        console.error('Error updating email:', error)
      }

      return { error }
    } catch (error) {
      console.error('Error in updateEmail:', error)
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}