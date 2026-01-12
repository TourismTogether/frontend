"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import CursorTrail from "./CursorTrail/CursorTrail";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Kiểm tra touch support
      const hasTouchSupport =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Kiểm tra user agent cho mobile/tablet devices (bao gồm iPad)
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet/i.test(
          navigator.userAgent
        );

      // Kiểm tra kích thước màn hình (tablet như iPad thường < 1024px khi portrait)
      const isSmallScreen = window.innerWidth < 1024;

      // Ẩn CursorTrail nếu:
      // 1. Có touch support VÀ (là mobile user agent HOẶC màn hình nhỏ) - bao gồm iPad
      // 2. HOẶC chỉ là mobile user agent (để chắc chắn bắt được các thiết bị)
      const isMobileDevice =
        (hasTouchSupport && (isMobileUserAgent || isSmallScreen)) ||
        isMobileUserAgent;

      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark", "modern", "history"]}
      enableSystem={false}
    >
      <AuthProvider>
        {!isMobile && <CursorTrail />}
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
