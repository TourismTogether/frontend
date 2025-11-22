'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mountain, Map, Users, Wallet, BookOpen, MessageCircle, Trophy, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { path: '/dashboard', icon: Mountain, label: 'Dashboard' },
    { path: '/routes', icon: Map, label: 'Routes' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/destinations', icon: BookOpen, label: 'Destinations' },
    { path: '/trips', icon: Wallet, label: 'Trips' },
    { path: '/forum', icon: MessageCircle, label: 'Forum' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Mountain className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-800">AdventureMate</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive(link.path)
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">{profile.points}</span>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">
                    {profile.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
