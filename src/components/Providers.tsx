"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import CursorTrail from "./CursorTrail/CursorTrail";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      themes={["light", "dark", "modern", "history"]}
      enableSystem={false}
    >
      <AuthProvider>
        <CursorTrail />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
