'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SupporterDashboard } from '@/screens/Supporter/SupporterDashboard';
import { Navbar } from '@/components/Layout/Navbar';
import Link from 'next/link';

export default function SupporterPage() {
  const router = useRouter();
  const { user, loading, isSupporter } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
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

  if (!isSupporter) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Bạn cần quyền supporter để truy cập trang này.</p>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            ← Quay lại Dashboard
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SupporterDashboard />
    </div>
  );
}
