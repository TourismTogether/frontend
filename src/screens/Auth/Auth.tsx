"use client";

import React, { useState } from "react";
import {
  Mountain,
  MapPin,
  Users,
  Wallet,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { LoginForm } from "../../components/Auth/LoginForm";
import { SignUpForm } from "../../components/Auth/SignUpForm";

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const features = [
    {
      icon: MapPin,
      text: "Create and share custom travel routes",
    },
    {
      icon: Users,
      text: "Find travel companions and join groups",
    },
    {
      icon: Wallet,
      text: "Track expenses and manage budgets",
    },
    {
      icon: BookOpen,
      text: "Create trip journals and share memories",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Features */}
        <div className="text-white space-y-8 hidden lg:block animate-fade-in">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Mountain className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold drop-shadow-lg">
              Journey Together
            </h1>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4 drop-shadow-md">
              Your Ultimate Travel Companion for Epic Journeys
            </h2>
            <p className="text-lg opacity-95 leading-relaxed">
              Connect with fellow travelers, discover amazing routes, plan your
              trips, and share your adventures with a global community of
              backpackers and explorers.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-base font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex justify-center lg:justify-end">
          {isLogin ? (
            <LoginForm onSwitch={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitch={() => setIsLogin(true)} />
          )}
        </div>

        {/* Mobile header */}
        <div className="lg:hidden text-white text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Mountain className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold drop-shadow-lg">
              Journey Together
            </span>
          </div>
          <p className="text-sm opacity-90">Your ultimate travel companion</p>
        </div>
      </div>
    </div>
  );
};
