'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-sm">Sign in to continue your adventure</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-foreground text-sm font-semibold">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 text-base"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-foreground text-sm font-semibold">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 text-base"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-8 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="text-green-600 hover:text-green-700 font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
