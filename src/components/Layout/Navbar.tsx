"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountain,
  BookOpen,
  Wallet,
  MessageCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isActive = (path: string) => pathname === path;
  const navLinks = [
    { path: "/dashboard", icon: Mountain, label: "Dashboard" },
    { path: "/destinations", icon: BookOpen, label: "Destinations" },
    { path: "/trips", icon: Wallet, label: "Trips" },
    { path: "/forum", icon: MessageCircle, label: "Forum" },
    { path: "/diary", icon: BookOpen, label: "Diary" },
  ];
  const handleSignOut = () => {
    signOut();
    setIsMenuOpen(false);
  };
  const NavItem: React.FC<{
    link: (typeof navLinks)[0];
    isMobile?: boolean;
  }> = ({ link, isMobile }) => {
    const Icon = link.icon;
    return (
      <Link
        key={link.path}
        href={link.path}
        onClick={() => isMobile && setIsMenuOpen(false)}
        className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 ${
          isMobile ? "w-full text-lg justify-start" : "hover:bg-muted"
        } ${
          isActive(link.path)
            ? "bg-traveller/10 text-traveller font-semibold"
            : "text-muted-foreground"
        } hover:bg-muted`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{link.label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-card shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 z-50"
          >
            <Mountain className="w-8 h-8 text-traveller" />
            <span className="text-xl font-bold text-foreground">
              AdventureMate
            </span>
          </Link>
          <div className="hidden md:flex items-center grow">
            <div className="flex items-center justify-center space-x-8 w-full">
              {navLinks.map((link) => (
                <NavItem key={link.path} link={link} />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  title="Xem hồ sơ cá nhân"
                  className="w-8 h-8 bg-traveller/20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                  <span className="text-sm font-bold text-traveller">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden md:block p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition-colors duration-200"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Hamburger Menu Icon (Màn hình nhỏ) */}
            <button
              className="md:hidden text-foreground p-2 rounded-md hover:bg-muted transition-colors z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Mở/Đóng menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden absolute top-16 left-0 w-full bg-card shadow-lg transition-all duration-300 ease-in-out transform ${
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <NavItem key={link.path} link={link} isMobile />
          ))}

          {profile && (
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-3 py-2 rounded-md transition-colors w-full text-lg justify-start text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
