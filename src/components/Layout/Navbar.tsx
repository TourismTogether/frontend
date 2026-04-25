"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Mountain,
  Users,
  Map,
  Wallet,
  BookOpen,
  MessageCircle,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  Cloud,
  Shield,
  Sun,
  Moon,
  Palette,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyModal } from "../Emergency/EmergencyModal";
import { SOSNotification } from "../Emergency/SOSNotification";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, account, signOut, isSupporter, isAdmin } = useAuth(); // Lấy user, profile, account, signOut, isSupporter từ useAuth
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State cho Mobile Menu
  const [showEmergency, setShowEmergency] = useState(false); // State cho Emergency Modal
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false); // State cho Theme Menu
  const [mounted] = useState(() => typeof window !== "undefined"); // Prevent hydration mismatch

  const isActive = (path: string) => pathname === path;

  // Supporter: chỉ hiện 1 trang Supporter Dashboard. Traveller: hiện các trang thường
  const navLinks = isAdmin
    ? [
        { path: "/admin/dashboard", icon: Mountain, label: "Dashboard" },
        { path: "/admin/accounts", icon: Users, label: "Manage Account" },
        { path: "/admin/users", icon: Users, label: "Manage User" },
        { path: "/admin/supporters", icon: Shield, label: "Manage Supporter" },
        { path: "/admin/regions", icon: Map, label: "Manage Region" },
        { path: "/admin/destinations", icon: BookOpen, label: "Manage Destination" },
      ]
    : isSupporter
    ? [{ path: "/supporter", icon: Shield, label: "Supporter Dashboard" }]
    : [
        { path: "/dashboard", icon: Mountain, label: "Dashboard" },
        { path: "/trips", icon: Wallet, label: "Trips" },
        { path: "/destinations", icon: BookOpen, label: "Destinations" },
        { path: "/forum", icon: MessageCircle, label: "Forum" },
        { path: "/diaries", icon: BookOpen, label: "Diaries" },
      ];

  const handleSignOut = () => {
    signOut();
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
        // Đóng menu khi nhấp vào liên kết trên mobile
        onClick={() => isMobile && setIsMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isMobile ? "w-full text-lg justify-start" : "hover:bg-secondary/70"
        } ${
          isActive(link.path)
            ? "bg-linear-to-r from-primary/15 to-accent/20 text-foreground font-semibold border border-primary/30"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="w-4 h-4 transition-colors duration-200" />
        <span className="text-sm font-medium transition-colors duration-200">
          {link.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-screen mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo và Tên Ứng dụng */}
          <Link
            href={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="flex items-center gap-2 transition-all duration-200 hover:opacity-90 z-50"
          >
            <div className="rounded-xl bg-linear-to-r from-primary to-accent p-1.5 shadow-md">
              <Mountain className="w-6 h-6 text-white transition-colors duration-200" />
            </div>
            <span className="text-lg md:text-xl font-extrabold text-foreground transition-colors duration-200">
              Tourism Together
            </span>
          </Link>

          {/* Liên kết điều hướng (Màn hình lớn) */}
          <div className="hidden md:flex items-center grow">
            {/* Canh giữa các liên kết trên màn hình lớn */}
            <div className="flex items-center justify-center gap-3 w-full">
              {navLinks
                .filter((link) => link.path !== "/profile") // Di chuyển Profile ra khỏi thanh nav chính trên desktop
                .map((link) => (
                  <NavItem key={link.path} link={link} />
                ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher - 4 Modes */}
            {mounted && (
              <div className="relative">
                <button
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  onBlur={() =>
                    setTimeout(() => setIsThemeMenuOpen(false), 200)
                  }
                  className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all duration-200"
                  title="Change Theme"
                  aria-label="Theme switcher"
                >
                  {theme === "light" ? (
                    <Sun className="w-5 h-5 transition-colors duration-200" />
                  ) : theme === "dark" ? (
                    <Moon className="w-5 h-5 transition-colors duration-200" />
                  ) : theme === "modern" ? (
                    <Sparkles className="w-5 h-5 transition-colors duration-200" />
                  ) : (
                    <Palette className="w-5 h-5 transition-colors duration-200" />
                  )}
                </button>

                {/* Theme Dropdown Menu */}
                {isThemeMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50">
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setTheme("light");
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          theme === "light"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme("dark");
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          theme === "dark"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme("modern");
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          theme === "modern"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Modern</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme("history");
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          theme === "history"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        <Palette className="w-4 h-4" />
                        <span>History</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weather Icon Button */}
            {!isAdmin && (
              <Link
                href="/weather"
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                title="Weather"
              >
                <Cloud className="w-5 h-5 transition-colors duration-200" />
              </Link>
            )}

            {/* SOS Notification for Supporters */}
            {isSupporter && (
              <SOSNotification
                currentUserId={user?.id}
                isSupporter={isSupporter}
              />
            )}

            {/* Nút Khẩn cấp/SOS (Thêm từ phiên bản 1) */}
            {!isAdmin && (
              <button
                onClick={() => setShowEmergency(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 bg-linear-to-r from-red-500 to-orange-500 hover:brightness-110 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group"
                title="Emergency SOS"
              >
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                <AlertTriangle className="w-4 h-4 group-hover:animate-pulse transition-transform duration-200" />
                <span className="text-sm font-bold hidden sm:inline transition-colors duration-200">
                  SOS
                </span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3">
                {/* Avatar / Hồ sơ */}
                <Link
                  href="/profile"
                  title={`View profile of ${
                    user.full_name ||
                    profile?.username ||
                    account?.username ||
                    "User"
                  }`}
                  aria-label={`View your profile, ${user.full_name || account?.username || "User"}`}
                  className="w-9 h-9 bg-linear-to-r from-primary/25 to-accent/30 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary transition-colors duration-200">
                      {(
                        user.full_name ||
                        profile?.username ||
                        account?.username ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </Link>

                {/* Đăng xuất (Màn hình lớn) */}
                <button
                  onClick={handleSignOut}
                  className="hidden md:block p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary/70 transition-all duration-200"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5 transition-colors duration-200" />
                </button>
              </div>
            )}

            {/* Hamburger Menu Icon (Màn hình nhỏ) */}
            <button
              className="md:hidden text-foreground p-2 rounded-md hover:bg-secondary/70 transition-all duration-200 z-50"
              onClick={handleToggleMenu}
              title={isMenuOpen ? "Close menu" : "Open menu"}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 transition-colors duration-200" />
              ) : (
                <Menu className="w-6 h-6 transition-colors duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Sử dụng logic từ phiên bản 2) */}
      <div
        className={`md:hidden absolute top-16 left-0 w-full bg-card/95 backdrop-blur-xl shadow-lg border-t border-border transition-all duration-300 ease-in-out transform ${
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-3 pb-4 space-y-3">
          {navLinks.map((link) => (
            <NavItem key={link.path} link={link} isMobile />
          ))}

          {user && profile && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full text-lg justify-start text-muted-foreground hover:bg-secondary/70 hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 transition-colors duration-200" />
              <span className="text-sm font-medium transition-colors duration-200">
                Sign out
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Emergency Modal (Thêm từ phiên bản 1) */}
      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
      />
    </nav>
  );
};
