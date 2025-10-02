import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

// Interface and Context setup remain the same
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function now handles both initial load and auth state changes.
    const handleAuthChange = async (event: string, session: any) => {
      console.log(`Auth event: ${event}`);
      setLoading(true);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        // Sync email on sign-in or token refresh
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncEmailWithProfile(currentUser);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    };

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // REMOVED: The custom setInterval for proactive refresh is no longer needed.
    // Supabase's client library handles this automatically.

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // All other functions (fetchProfile, signUp, signIn, etc.) remain functionally identical.
  // I've included them here for a complete, copy-paste-ready file.

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found, which is okay.
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const syncEmailWithProfile = async (user: User) => {
    if (!profile || profile.email !== user.email) {
      try {
        const { error } = await supabase.from('profiles').update({ email: user.email }).eq('id', user.id);
        if (error) throw error;
        // Re-fetch profile to get the latest data after sync
        await fetchProfile(user.id);
      } catch (error) {
        console.error('Error syncing email with profile:', error);
      }
    }
  };
  
  const signUp = async (email: string, password: string, userData: any) => {
    const redirectTo = window.location.origin + '/auth/callback';
    return await supabase.auth.signUp({ email, password, options: { data: userData, emailRedirectTo: redirectTo } });
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user is signed in to update profile.");
    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    const redirectTo = window.location.origin + '/auth/callback';
    return await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: redirectTo });
  };

  const value: AuthContextType = { user, profile, loading, signUp, signIn, signOut, updateProfile, updateEmail };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};