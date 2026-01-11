"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Mountain,
  MapPin,
  Users,
  Wallet,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { LoginForm } from "../../components/Auth/LoginForm";
import { SignUpForm } from "../../components/Auth/SignUpForm";
import { GRADIENTS, COLORS } from "../../constants/colors";

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isDark = mounted && theme === "dark";

  return (
    <div
      className={`min-h-screen ${GRADIENTS.AUTH_BACKGROUND} flex items-center justify-center px-4 py-12 relative overflow-hidden`}
    >
      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`absolute top-4 right-4 z-20 flex items-center justify-center p-3 ${COLORS.AUTH.GLASS_BG} backdrop-blur-md rounded-xl ${COLORS.AUTH.GLASS_BORDER} ${COLORS.AUTH.TEXT_WHITE} hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200 shadow-lg hover:shadow-xl`}
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 transition-colors duration-200" />
          ) : (
            <Moon className="w-5 h-5 transition-colors duration-200" />
          )}
        </button>
      )}

      {/* Enhanced animated background elements for dark mode */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs with better dark mode colors */}
        <div
          className={`absolute -top-40 -right-40 w-96 h-96 ${GRADIENTS.AUTH_ORB_EMERALD} rounded-full blur-3xl animate-pulse`}
        ></div>
        <div
          className={`absolute -bottom-40 -left-40 w-96 h-96 ${GRADIENTS.AUTH_ORB_TEAL} rounded-full blur-3xl animate-pulse`}
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${GRADIENTS.AUTH_ORB_GREEN} rounded-full blur-3xl`}
        ></div>
        {/* Additional subtle orbs */}
        <div
          className={`absolute top-20 left-20 w-64 h-64 ${GRADIENTS.AUTH_ORB_CYAN} rounded-full blur-2xl animate-pulse`}
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className={`absolute bottom-20 right-20 w-64 h-64 ${GRADIENTS.AUTH_ORB_EMERALD} rounded-full blur-2xl animate-pulse`}
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>

      {/* Grid pattern overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Features */}
        <div
          className={`${COLORS.AUTH.TEXT_WHITE} space-y-8 hidden lg:block animate-fade-in`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className={`p-3 ${COLORS.AUTH.GLASS_BG} backdrop-blur-md rounded-xl ${COLORS.AUTH.GLASS_BORDER} shadow-lg`}
            >
              <Mountain className={`w-8 h-8 ${COLORS.AUTH.ICON_WHITE}`} />
            </div>
            <h1
              className={`text-5xl font-bold drop-shadow-lg ${GRADIENTS.AUTH_TITLE}`}
            >
              Journey Together
            </h1>
          </div>

          <div>
            <h2
              className={`text-4xl font-bold leading-tight mb-4 drop-shadow-md ${COLORS.AUTH.TEXT_WHITE} dark:text-slate-100`}
            >
              Your Ultimate Travel Companion for Epic Journeys
            </h2>
            <p
              className={`text-lg opacity-95 dark:opacity-80 leading-relaxed ${COLORS.AUTH.TEXT_WHITE} dark:text-slate-200`}
            >
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
                  className={`flex items-center space-x-4 p-4 ${COLORS.AUTH.GLASS_BG} backdrop-blur-md rounded-xl ${COLORS.AUTH.GLASS_BORDER} ${COLORS.AUTH.GLASS_HOVER} ${COLORS.EMERALD.BORDER_400_30} transition-all duration-300 group shadow-lg hover:shadow-xl`}
                >
                  <div
                    className={`w-12 h-12 ${GRADIENTS.AUTH_FEATURE_ICON} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${COLORS.EMERALD.BORDER_400_20}`}
                  >
                    <Icon className={`w-6 h-6 ${COLORS.AUTH.ICON_WHITE}`} />
                  </div>
                  <span
                    className={`text-base font-medium ${COLORS.AUTH.TEXT_WHITE} dark:text-slate-100`}
                  >
                    {feature.text}
                  </span>
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
        <div
          className={`lg:hidden ${COLORS.AUTH.TEXT_WHITE} text-center mb-8 animate-fade-in`}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div
              className={`p-2 ${COLORS.AUTH.GLASS_BG} backdrop-blur-md rounded-lg ${COLORS.AUTH.GLASS_BORDER}`}
            >
              <Mountain className={`w-6 h-6 ${COLORS.AUTH.ICON_WHITE}`} />
            </div>
            <span
              className={`text-3xl font-bold drop-shadow-lg ${GRADIENTS.AUTH_TITLE}`}
            >
              Journey Together
            </span>
          </div>
          <p
            className={`text-sm opacity-90 dark:opacity-80 ${COLORS.AUTH.TEXT_WHITE} dark:text-slate-100`}
          >
            Your ultimate travel companion
          </p>
        </div>
      </div>
    </div>
  );
};
