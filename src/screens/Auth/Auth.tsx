'use client';

import React, { useState } from 'react';
import { Mountain } from 'lucide-react';
import { LoginForm } from '../../components/Auth/LoginForm';
import { SignUpForm } from '../../components/Auth/SignUpForm';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6 hidden md:block">
          <div className="flex items-center space-x-3">
            <Mountain className="w-12 h-12" />
            <h1 className="text-4xl font-bold">AdventureMate</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Your Ultimate Travel Companion for Epic Adventures
          </h2>
          <p className="text-lg opacity-90">
            Connect with fellow travelers, discover amazing routes, plan your trips, and share your
            adventures with a global community of backpackers and explorers.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🗺️</span>
              </div>
              <span>Create and share custom travel routes</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <span>Find travel companions and join groups</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <span>Track expenses and manage budgets</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">📔</span>
              </div>
              <span>Create trip journals and share memories</span>
            </div>
          </div>
        </div>

        <div>
          {isLogin ? (
            <LoginForm onSwitch={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitch={() => setIsLogin(true)} />
          )}
        </div>

        <div className="md:hidden text-white text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mountain className="w-8 h-8" />
            <span className="text-2xl font-bold">AdventureMate</span>
          </div>
          <p className="text-sm opacity-90">Your ultimate travel companion</p>
        </div>
      </div>
    </div>
  );
};
