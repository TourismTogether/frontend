"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
// import { User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

import { User, Account, Profile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  account: Account | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const beApi = process.env.NEXT_PUBLIC_API_URL;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${beApi}/auth/user`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Unauthorized");
      }

      const result = await res.json();
      const data = result.data;

      if (!data?.isAuthenticated || !data.user) {
        setUser(null);
        setAccount(null);
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      setUser(data.user);
      setAccount(data.account ?? null);

      // Check if user is admin
      try {
        const adminRes = await fetch(`${beApi}/admins/${data.user.id}`, {
          credentials: "include",
        });
        if (adminRes.ok) {
          const adminResult = await adminRes.json();
          setIsAdmin(adminResult.status === 200 && adminResult.data !== null);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }

      const email = data.account?.email;

      // Get user location automatically
      const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve) => {
          const defaultLocation = {
            lat: 10.762855472351717,
            lng: 106.68247646794529,
          };

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              () => {
                // Location access denied or unavailable - use default
                resolve(defaultLocation);
              },
              {
                timeout: 5000,
                enableHighAccuracy: false,
              }
            );
          } else {
            // Geolocation not supported - use default
            resolve(defaultLocation);
          }
        });
      };

      // Fetch traveller data and update location
      try {
        // Get location first
        const location = await getUserLocation();

        const travellerRes = await fetch(`${beApi}/travellers/${data.user.id}`, {
          credentials: "include",
        });

        if (travellerRes.ok) {
          const travellerResult = await travellerRes.json();
          if (travellerResult.status === 200) {
            // Update location if traveller exists
            try {
              await fetch(`${beApi}/travellers/${data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  latitude: location.lat,
                  longitude: location.lng,
                }),
              });
            } catch {
              // Failed to update location, continue anyway
            }

            setProfile({
              ...data.user,
              ...travellerResult.data,
              email,
            });
          } else {
            // Traveller doesn't exist yet, create with location
            try {
              const createRes = await fetch(`${beApi}/travellers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: data.user.id,
                  bio: '',
                  is_shared_location: false,
                  latitude: location.lat,
                  longitude: location.lng,
                  is_safe: true,
                }),
              });
              
              if (createRes.ok) {
                const createResult = await createRes.json();
                if (createResult.status === 201) {
                  setProfile({
                    ...data.user,
                    ...createResult.data,
                    email,
                  });
                } else {
                  setProfile({ ...data.user, email });
                }
              } else {
                setProfile({ ...data.user, email });
              }
            } catch {
              setProfile({ ...data.user, email });
            }
          }
        } else {
          // Traveller doesn't exist, create with location
          try {
            const createRes = await fetch(`${beApi}/travellers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                user_id: data.user.id,
                bio: '',
                is_shared_location: false,
                latitude: location.lat,
                longitude: location.lng,
                is_safe: true,
              }),
            });
            
            if (createRes.ok) {
              const createResult = await createRes.json();
              if (createResult.status === 201) {
                setProfile({
                  ...data.user,
                  ...createResult.data,
                  email,
                });
              } else {
                setProfile({ ...data.user, email });
              }
            } else {
              setProfile({ ...data.user, email });
            }
          } catch {
            setProfile({ ...data.user, email });
          }
        }
      } catch {
        setProfile({ ...data.user, email });
      }
    } catch {
      setUser(null);
      setAccount(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    setLoading(true);

    try {
      const res = await fetch(`${beApi}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          email, 
          password, 
          username,
          full_name: fullName || username // Use username as fallback if full_name not provided
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Sign up failed");
      }

      // Directly set user from response instead of calling fetchUser
      if (result.data?.user) {
        setUser(result.data.user);
        setAccount(result.data.account ?? null);
        setProfile({
          ...result.data.user,
          email: result.data.account?.email,
        });
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const res = await fetch(`${beApi}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Sign in failed");
      }

      // Directly set user from response instead of calling fetchUser
      if (result.data?.user) {
        setUser(result.data.user);
        setAccount(result.data.account ?? null);
        setProfile({
          ...result.data.user,
          email: result.data.account?.email,
        });
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${beApi}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setAccount(null);
      setProfile(null);
      setIsAdmin(false);
    } catch {
      // Logout failed silently
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    account,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
