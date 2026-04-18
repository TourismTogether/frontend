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
  isSupporter: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName?: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

import { API_ENDPOINTS } from "../constants/api";

type ApiErrorDetail = {
  field?: string;
  message?: string;
};

const getAuthErrorMessage = (result: any, fallback: string): string => {
  const baseMessage =
    typeof result?.message === "string" && result.message.trim()
      ? result.message.trim()
      : fallback;

  if (Array.isArray(result?.details) && result.details.length > 0) {
    const detailsText = (result.details as ApiErrorDetail[])
      .map((d) => (d?.field && d?.message ? `${d.field}: ${d.message}` : d?.message))
      .filter((text): text is string => Boolean(text))
      .join("; ");

    if (detailsText) {
      return detailsText;
    }
  }

  return baseMessage;
};

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
  const [isSupporter, setIsSupporter] = useState<boolean>(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.ME, {
        credentials: "include",
        cache: "no-store",
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
        setIsSupporter(false);
        return;
      }

      setUser(data.user);
      setAccount(data.account ?? null);

      // Check if user is supporter
      try {
        if (!data.user.id || data.user.id === "NaN" || data.user.id === "undefined") {
          setIsSupporter(false);
        } else {
          const supporterRes = await fetch(API_ENDPOINTS.SUPPORTERS.BY_ID(String(data.user.id)), {
            credentials: "include",
          });
          if (supporterRes.ok) {
            const supporterResult = await supporterRes.json();
            setIsSupporter(supporterResult.status === 200 && supporterResult.data !== null);
          } else {
            setIsSupporter(false);
          }
        }
      } catch {
        setIsSupporter(false);
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
        if (!data.user.id || data.user.id === "NaN" || data.user.id === "undefined") {
          // Skip traveller fetch if invalid ID
        } else {
          const travellerRes = await fetch(
            API_ENDPOINTS.TRAVELLERS.BY_ID(String(data.user.id)),
            {
              credentials: "include",
            }
          );

          if (travellerRes.ok) {
            const travellerResult = await travellerRes.json();
            if (travellerResult.status === 200) {
              // Update traveller with current location
              try {
                await fetch(API_ENDPOINTS.TRAVELLERS.UPDATE(String(data.user.id)), {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    latitude: userLat,
                    longitude: userLng,
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
                await fetch(API_ENDPOINTS.TRAVELLERS.CREATE, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
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
              setProfile({
                ...data.user,
                email,
                latitude: userLat,
                longitude: userLng,
              });
            }
          } else {
            // Create traveller if fetch failed
            try {
              await fetch(API_ENDPOINTS.TRAVELLERS.CREATE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
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
            setProfile({
              ...data.user,
              email,
              latitude: userLat,
              longitude: userLng,
            });
          }
        }
      } catch {
        setProfile({
          ...data.user,
          email,
          latitude: userLat,
          longitude: userLng,
        });
      }
    } catch {
      setUser(null);
      setAccount(null);
      setProfile(null);
      setIsSupporter(false);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          username,
          full_name: fullName || username,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            result.message || "Too many attempts. Please wait a few minutes and try again."
          );
        }
        const msg = getAuthErrorMessage(
          result,
          "Sign up failed. Please check your details and try again."
        );
        throw new Error(msg);
      }

      await fetchUser();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            result.message || "Too many attempts. Please wait a few minutes and try again."
          );
        }
        throw new Error(
          getAuthErrorMessage(
            result,
            "Email/username or password is incorrect. Please try again."
          )
        );
      }

      await fetchUser();
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setAccount(null);
      setProfile(null);
      setIsSupporter(false);
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
    isSupporter,
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
