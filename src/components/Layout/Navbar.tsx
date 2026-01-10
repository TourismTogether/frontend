"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountain,
  Map,
  Users,
  Wallet,
  BookOpen,
  MessageCircle,
  Trophy,
  User,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  Cloud,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { EmergencyModal } from "../Emergency/EmergencyModal";
import { SOSNotification } from "../Emergency/SOSNotification";
import { API_ENDPOINTS } from "../../constants/api";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, account, signOut, isAdmin } = useAuth(); // Lấy user, profile, account, signOut, isAdmin từ useAuth
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State cho Mobile Menu
  const [showEmergency, setShowEmergency] = useState(false); // State cho Emergency Modal
  const [isSupporter, setIsSupporter] = useState(false); // State cho Supporter check

  // Check if current user is a supporter
  useEffect(() => {
    const checkSupporter = async () => {
      if (!user?.id) {
        setIsSupporter(false);
        return;
      }

      try {
        const res = await fetch(`${API_ENDPOINTS.USERS.BASE}/${user.id}/supporters`, {
          credentials: "include",
        });
        const result = await res.json();
        setIsSupporter(result.status === 200 && result.data !== null);
      } catch {
        setIsSupporter(false);
      }
    };

    checkSupporter();
  }, [user?.id]);

  const isActive = (path: string) => pathname === path;

  // Hợp nhất tất cả các liên kết điều hướng từ cả hai phiên bản
  const navLinks = [
    { path: "/dashboard", icon: Mountain, label: "Dashboard" },
    { path: "/trips", icon: Wallet, label: "Trips" },
    { path: "/destinations", icon: BookOpen, label: "Destinations" },
    { path: "/forum", icon: MessageCircle, label: "Forum" },
    { path: "/diaries", icon: BookOpen, label: "Diaries" }, // Giữ lại từ phiên bản 2
    // Admin Manager - chỉ hiển thị khi user là admin
    ...(isAdmin ? [{ path: "/admin", icon: Shield, label: "Admin Manager" }] : []),
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
          {/* Logo và Tên Ứng dụng */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 z-50"
          >
            <Mountain className="w-8 h-8 text-traveller" />
            <span className="text-xl font-bold text-foreground">
              Tourism Together
            </span>
          </Link>

          {/* Liên kết điều hướng (Màn hình lớn) */}
          <div className="hidden md:flex items-center grow">
            {/* Canh giữa các liên kết trên màn hình lớn */}
            <div className="flex items-center justify-center space-x-2 w-full">
              {navLinks
                .filter((link) => link.path !== "/profile") // Di chuyển Profile ra khỏi thanh nav chính trên desktop
                .map((link) => (
                  <NavItem key={link.path} link={link} />
                ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Weather Icon Button */}
            <Link
              href="/weather"
              className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10 transition-all duration-200"
              title="Weather"
            >
              <Cloud className="w-5 h-5" />
            </Link>

            {/* SOS Notification for Supporters */}
            {isSupporter && (
              <SOSNotification
                currentUserId={user?.id}
                isSupporter={isSupporter}
              />
            )}

            {/* Nút Khẩn cấp/SOS (Thêm từ phiên bản 1) */}
            <button
              onClick={() => setShowEmergency(true)}
              className="relative flex items-center space-x-1.5 px-3 py-2 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg group"
              title="Emergency SOS"
            >
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
              <AlertTriangle className="w-4 h-4 group-hover:animate-pulse" />
              <span className="text-sm font-bold hidden sm:inline">SOS</span>
            </button>

            {user && (
              <div className="flex items-center space-x-3">
                {/* Avatar / Hồ sơ */}
                <Link
                  href="/profile"
                  title={`Xem hồ sơ của ${
                    user.full_name ||
                    profile?.username ||
                    account?.username ||
                    "User"
                  }`}
                  className="w-8 h-8 bg-traveller/20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-traveller">
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
              onClick={handleToggleMenu}
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

      {/* Mobile Menu (Sử dụng logic từ phiên bản 2) */}
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

          {user && profile && (
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

      {/* Emergency Modal (Thêm từ phiên bản 1) */}
      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
      />
    </nav>
  );
};
