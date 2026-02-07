'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Mail, Lock, User, UserCircle, Loader2, AlertCircle } from 'lucide-react';
import { COLORS, GRADIENTS } from '../../constants/colors';

export const SignUpForm: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, username, fullName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <form onSubmit={handleSubmit} className={`${COLORS.AUTH.CARD} ${COLORS.AUTH.CARD_BLUR} rounded-2xl shadow-2xl p-8 ${COLORS.AUTH.BORDER_CARD} transition-all duration-300 ${COLORS.AUTH.BORDER_HOVER}`}>
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold ${GRADIENTS.AUTH_HEADING} mb-2 drop-shadow-sm`}>
            Join Tourism Together
          </h2>
          <p className={`${COLORS.AUTH.TEXT_MUTED} text-sm`}>Create an account and start your journey</p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className={`mb-6 p-4 ${COLORS.DESTRUCTIVE.BACKGROUND_HOVER} border ${COLORS.DESTRUCTIVE.BORDER}/30 ${COLORS.DESTRUCTIVE.TEXT} rounded-lg text-sm flex items-center gap-2 animate-fade-in backdrop-blur-sm`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="signup-fullname" className={`block ${COLORS.AUTH.TEXT_LABEL} text-sm font-semibold`}>Full Name</label>
            <div className="relative">
              <UserCircle className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.AUTH.ICON_MUTED}`} aria-hidden />
              <Input
                id="signup-fullname"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`pl-10 h-12 text-base ${COLORS.AUTH.INPUT_BG} ${COLORS.AUTH.BORDER_INPUT} ${COLORS.AUTH.INPUT_TEXT} ${COLORS.AUTH.INPUT_PLACEHOLDER} ${COLORS.AUTH.BORDER_FOCUS} ${COLORS.AUTH.INPUT_FOCUS_RING}`}
                placeholder="e.g. Nguyen Van A"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-username" className={`block ${COLORS.AUTH.TEXT_LABEL} text-sm font-semibold`}>Username</label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.AUTH.ICON_MUTED}`} aria-hidden />
              <Input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`pl-10 h-12 text-base ${COLORS.AUTH.INPUT_BG} ${COLORS.AUTH.BORDER_INPUT} ${COLORS.AUTH.INPUT_TEXT} ${COLORS.AUTH.INPUT_PLACEHOLDER} ${COLORS.AUTH.BORDER_FOCUS} ${COLORS.AUTH.INPUT_FOCUS_RING}`}
                placeholder="Letters, numbers, underscores only"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className={`block ${COLORS.AUTH.TEXT_LABEL} text-sm font-semibold`}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.AUTH.ICON_MUTED}`} aria-hidden />
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 h-12 text-base ${COLORS.AUTH.INPUT_BG} ${COLORS.AUTH.BORDER_INPUT} ${COLORS.AUTH.INPUT_TEXT} ${COLORS.AUTH.INPUT_PLACEHOLDER} ${COLORS.AUTH.BORDER_FOCUS} ${COLORS.AUTH.INPUT_FOCUS_RING}`}
                placeholder="e.g. you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className={`block ${COLORS.AUTH.TEXT_LABEL} text-sm font-semibold`}>Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.AUTH.ICON_MUTED}`} aria-hidden />
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 h-12 text-base ${COLORS.AUTH.INPUT_BG} ${COLORS.AUTH.BORDER_INPUT} ${COLORS.AUTH.INPUT_TEXT} ${COLORS.AUTH.INPUT_PLACEHOLDER} ${COLORS.AUTH.BORDER_FOCUS} ${COLORS.AUTH.INPUT_FOCUS_RING}`}
                placeholder="Min. 6 characters, include upper, lower & number"
                required
                minLength={6}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full mt-8 h-12 text-base font-semibold ${GRADIENTS.AUTH_BUTTON} ${GRADIENTS.AUTH_BUTTON_HOVER} text-white shadow-lg hover:shadow-xl dark:hover:shadow-emerald-400/25 transition-all duration-300`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>

        <div className="mt-6 text-center">
          <p className={`text-sm ${COLORS.AUTH.TEXT_MUTED}`}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className={`${COLORS.AUTH.LINK} ${COLORS.AUTH.LINK_HOVER} font-semibold transition-colors duration-200 underline-offset-4 hover:underline`}
              aria-label="Switch to sign in form"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
