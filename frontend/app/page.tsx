'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace('/student/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}
