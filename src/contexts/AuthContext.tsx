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
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen to auth changes and handle auto-refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchProfile(session.user.id)
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          syncEmailWithProfile(session.user)
        }
      } else {
        setProfile(null)
      }
      
      // Handle session expiration - try to refresh
      if (event === 'TOKEN_REFRESH_FAILED') {
        console.error('Session expired - signing out')
        await supabase.auth.signOut()
      }
      
      setLoading(false)
    })

    // Set up automatic session refresh check every 5 minutes
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        // Refresh if within 10 minutes of expiry
        if (expiresAt && (expiresAt - now) < 600) {
          await supabase.auth.refreshSession()
        }
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  const syncEmailWithProfile = async (user: User) => {
    if (!user) return
    try {
      const { error } = await supabase.from('profiles').update({ email: user.email }).eq('id', user.id)
      if (!error) {
        await fetchProfile(user.id)
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        setProfile(data)
      } else if (error && error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const newProfile = { 
            id: userData.user.id, 
            email: userData.user.email, 
            full_name: userData.user.user_metadata?.full_name || null, 
            company: null, 
            phone: null 
          }
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()
          if (createdProfile && !createError) setProfile(createdProfile)
        }
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectTo = import.meta.env.VITE_APP_ENV === 'development' 
      ? 'http://localhost:5173/auth/callback' 
      : `${window.location.origin}/auth/callback`
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: userData, emailRedirectTo: redirectTo } 
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      throw error
    }
  }

  const updateEmail = async (newEmail: string) => {
    try {
      const redirectTo = import.meta.env.VITE_APP_ENV === 'development' 
        ? 'http://localhost:5173/auth/callback' 
        : `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.updateUser(
        { email: newEmail }, 
        { emailRedirectTo: redirectTo }
      )
      return { error }
    } catch (error) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}