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
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // onAuthStateChange fires immediately with the initial session state,
    // so we don't need a separate getSession() call.
    // This establishes a single, reliable source of truth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false); // Only set loading to false after the true state is known
    });

    // The cleanup function unsubscribes from the listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
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
          full_name: userData.user.user_metadata?.full_name || null,
          company: null,
          phone: null
        }
        
        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()
          
        if (createdProfile) {
          setProfile(createdProfile)
        }
      }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    // Configure redirect URL based on environment
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
    if (!user || !initialized) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (data && !error) {
      setProfile(data)
    }
  }

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })
    return { error }
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