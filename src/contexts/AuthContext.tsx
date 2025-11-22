'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Sign up with username in metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Try to create profile immediately using RPC function with user_id
      // The function uses SECURITY DEFINER to bypass RLS
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id_param: data.user.id,
        username_param: username,
        full_name_param: '',
      });

      if (profileError) {
        // If RPC function doesn't exist or fails, wait for session and try direct insert
        // Wait for session to be established after signup
        let sessionEstablished = false;
        let retries = 10;
        let delay = 200;

        while (retries > 0 && !sessionEstablished) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user) {
            sessionEstablished = true;
            
            // Try direct insert (should work now that we have session)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.user.id,
                  username,
                  full_name: '',
                },
              ]);

            if (insertError) {
              throw new Error(`Failed to create profile: ${insertError.message}`);
            }
            
            return; // Success
          }

          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 2000); // Exponential backoff, max 2s
        }

        // If we couldn't establish session, throw error
        if (!sessionEstablished) {
          throw new Error('Failed to create profile. Please try signing in after email confirmation.');
        }
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
