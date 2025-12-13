'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

import { User, Account, Profile } from "@/types/user";

interface AuthContextType {
    user: User | null;
    account: Account | null;
    profile: Profile | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const beApi = "http://localhost:8080"

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

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

            const { data } = await res.json();

            if (!data?.isAuthenticated || !data.user) {
                setUser(null);
                setAccount(null);
                setProfile(null);
                return;
            }

            setUser(data.user);
            setAccount(data.account ?? null);

            const email = data.account?.email;

            const travellerRes = await fetch(`${beApi}/travellers/${data.user.id}`);

            if (!travellerRes.ok) {
                setProfile(null);
                return;
            }

            const travellerResult = await travellerRes.json();

            if (travellerResult.status === 200) {
                setProfile({
                    ...data.user,
                    ...travellerResult.data,
                    email,
                });
            } else {
                setProfile(null);
            }

        } catch (error) {
            console.error("fetchUser error:", error);
            setUser(null);
            setAccount(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, username: string) => {
        setLoading(true);

        try {
            const res = await fetch(`${beApi}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password, username }),
            });

            if (!res.ok) {
                throw new Error("Sign up failed");
            }

            await fetchUser();

        } catch (error) {
            console.error("signUp error:", error);
            setLoading(false);
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

            if (!res.ok) {
                throw new Error("Sign in failed");
            }

            await fetchUser();

        } catch (error) {
            console.error("signIn error:", error);
            setLoading(false);
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

        } catch (error) {
            console.error("signOut error:", error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        account,
        profile,
        loading,
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
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
