"use client";

import { Navbar } from "@/components/Layout/Navbar";
import { AdminGuard } from "@/screens/Admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#111827]">
        <Navbar />
        {children}
      </div>
    </AdminGuard>
  );
}
