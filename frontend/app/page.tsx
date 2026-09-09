'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { RetroHomepage } from '@/components/home/retro-homepage';

export default function RootPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace('/student/dashboard');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#faf9f4] dark:bg-[#111417] flex items-center justify-center font-mono text-sm">
        <div className="flex items-center gap-2 text-black dark:text-[#e6e8eb]">
          <span className="w-2.5 h-2.5 bg-black dark:bg-[#e6e8eb] animate-pulse" />
          <span>INITIALIZING KIP TERMINAL...</span>
        </div>
      </div>
    );
  }

  return <RetroHomepage />;
}
