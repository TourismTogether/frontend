'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col justify-center items-center gap-6 h-screen bg-background">
      <div
        className="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-primary"
        aria-hidden
      />
      <p className="text-muted-foreground text-sm animate-pulse-soft">
        Taking you to your dashboard...
      </p>
    </div>
  );
}
