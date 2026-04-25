"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Layout/Navbar";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Bạn cần quyền admin để truy cập trang này.
          </p>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            ← Quay lại Dashboard
          </Link>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
