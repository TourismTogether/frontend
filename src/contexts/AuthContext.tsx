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

// Default coordinates (Ho Chi Minh City)
const DEFAULT_LATITUDE = 10.762892238148003;
const DEFAULT_LONGITUDE = 106.68248479264726;

// Helper function to get user location with fallback
const getUserLocation = async (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
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
          resolve({
            lat: DEFAULT_LATITUDE,
            lng: DEFAULT_LONGITUDE,
          });
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    } else {
      // Geolocation not supported - use default
      resolve({
        lat: DEFAULT_LATITUDE,
        lng: DEFAULT_LONGITUDE,
      });
    }
  });
};

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

      // Get user location
      let userLat = DEFAULT_LATITUDE;
      let userLng = DEFAULT_LONGITUDE;
      try {
        const location = await getUserLocation();
        userLat = location.lat;
        userLng = location.lng;
      } catch {
        // Use default coordinates if location retrieval fails
      }

      // Fetch traveller data but don't block on failure
      try {
        const travellerRes = await fetch(`${beApi}/travellers/${data.user.id}`, {
          credentials: "include",
        });

        if (travellerRes.ok) {
          const travellerResult = await travellerRes.json();
          if (travellerResult.status === 200) {
            // Update traveller with current location
            try {
              await fetch(`${beApi}/travellers/${data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  latitude: userLat, 
                  longitude: userLng 
                }),
              });
            } catch {
              // Location update failed, continue with existing data
            }
            
            setProfile({
              ...data.user,
              ...travellerResult.data,
              email,
              latitude: userLat,
              longitude: userLng,
            });
          } else {
            // Create traveller if not found
            try {
              await fetch(`${beApi}/travellers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: data.user.id,
                  bio: "",
                  is_shared_location: false,
                  latitude: userLat,
                  longitude: userLng,
                  is_safe: true,
                  emergency_contacts: [],
                }),
              });
            } catch {
              // Traveller creation failed, continue without it
            }
            setProfile({ ...data.user, email, latitude: userLat, longitude: userLng });
          }
        } else {
          // Create traveller if fetch failed
          try {
            await fetch(`${beApi}/travellers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                user_id: data.user.id,
                bio: "",
                is_shared_location: false,
                latitude: userLat,
                longitude: userLng,
                is_safe: true,
                emergency_contacts: [],
              }),
            });
          } catch {
            // Traveller creation failed, continue without it
          }
          setProfile({ ...data.user, email, latitude: userLat, longitude: userLng });
        }
      } catch {
        setProfile({ ...data.user, email, latitude: userLat, longitude: userLng });
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
        
        // Get user location
        let userLat = DEFAULT_LATITUDE;
        let userLng = DEFAULT_LONGITUDE;
        try {
          const location = await getUserLocation();
          userLat = location.lat;
          userLng = location.lng;
        } catch {
          // Use default coordinates if location retrieval fails
        }

        // Update or create traveller with location
        try {
          const travellerRes = await fetch(`${beApi}/travellers/${result.data.user.id}`, {
            credentials: "include",
          });
          
          if (travellerRes.ok) {
            const travellerResult = await travellerRes.json();
            if (travellerResult.status === 200) {
              // Update existing traveller with location
              await fetch(`${beApi}/travellers/${result.data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  latitude: userLat, 
                  longitude: userLng 
                }),
              });
              setProfile({
                ...result.data.user,
                ...travellerResult.data,
                email: result.data.account?.email,
                latitude: userLat,
                longitude: userLng,
              });
            } else {
              // Create new traveller
              await fetch(`${beApi}/travellers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: result.data.user.id,
                  bio: "",
                  is_shared_location: false,
                  latitude: userLat,
                  longitude: userLng,
                  is_safe: true,
                  emergency_contacts: [],
                }),
              });
              setProfile({
                ...result.data.user,
                email: result.data.account?.email,
                latitude: userLat,
                longitude: userLng,
              });
            }
          } else {
            // Create new traveller if fetch failed
            await fetch(`${beApi}/travellers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                user_id: result.data.user.id,
                bio: "",
                is_shared_location: false,
                latitude: userLat,
                longitude: userLng,
                is_safe: true,
                emergency_contacts: [],
              }),
            });
            setProfile({
              ...result.data.user,
              email: result.data.account?.email,
              latitude: userLat,
              longitude: userLng,
            });
          }
        } catch {
          // Fallback if traveller operations fail
          setProfile({
            ...result.data.user,
            email: result.data.account?.email,
            latitude: userLat,
            longitude: userLng,
          });
        }
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
        
        // Get user location
        let userLat = DEFAULT_LATITUDE;
        let userLng = DEFAULT_LONGITUDE;
        try {
          const location = await getUserLocation();
          userLat = location.lat;
          userLng = location.lng;
        } catch {
          // Use default coordinates if location retrieval fails
        }

        // Update or create traveller with location
        try {
          const travellerRes = await fetch(`${beApi}/travellers/${result.data.user.id}`, {
            credentials: "include",
          });
          
          if (travellerRes.ok) {
            const travellerResult = await travellerRes.json();
            if (travellerResult.status === 200) {
              // Update existing traveller with location
              await fetch(`${beApi}/travellers/${result.data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  latitude: userLat, 
                  longitude: userLng 
                }),
              });
              setProfile({
                ...result.data.user,
                ...travellerResult.data,
                email: result.data.account?.email,
                latitude: userLat,
                longitude: userLng,
              });
            } else {
              // Create new traveller
              await fetch(`${beApi}/travellers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: result.data.user.id,
                  bio: "",
                  is_shared_location: false,
                  latitude: userLat,
                  longitude: userLng,
                  is_safe: true,
                  emergency_contacts: [],
                }),
              });
              setProfile({
                ...result.data.user,
                email: result.data.account?.email,
                latitude: userLat,
                longitude: userLng,
              });
            }
          } else {
            // Create new traveller if fetch failed
            await fetch(`${beApi}/travellers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                user_id: result.data.user.id,
                bio: "",
                is_shared_location: false,
                latitude: userLat,
                longitude: userLng,
                is_safe: true,
                emergency_contacts: [],
              }),
            });
            setProfile({
              ...result.data.user,
              email: result.data.account?.email,
              latitude: userLat,
              longitude: userLng,
            });
          }
        } catch {
          // Fallback if traveller operations fail
          setProfile({
            ...result.data.user,
            email: result.data.account?.email,
            latitude: userLat,
            longitude: userLng,
          });
        }
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
