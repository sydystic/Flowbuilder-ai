import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync profile logic
  const fetchProfile = async (authId, userEmail, userMetadata) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }

      if (!data) {
        // User sync on first login
        const fullName = userMetadata?.full_name || userEmail.split('@')[0];
        const avatarUrl = userMetadata?.avatar_url || null;

        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            auth_id: authId,
            email: userEmail,
            full_name: fullName,
            avatar_url: avatarUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting user profile:', insertError.message);
          return null;
        }
        return newProfile;
      }
      return data;
    } catch (err) {
      console.error('User profile sync exception:', err.message);
      return null;
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        const prof = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        const prof = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const updateProfile = async (fullName, avatarUrl) => {
    try {
      const res = await axios.put('/api/users/profile', { fullName, avatarUrl });
      setProfile(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
