'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { RetroHomepage } from '@/components/home/retro-homepage';
import { CenteredTerminalLoader } from '@/components/loaders/centered-terminal-loader';

export default function RootPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsRedirecting(true);
      router.replace('/developer/dashboard');
    }
  }, [router]);

  if (isRedirecting) {
    return null;
  }

  if (!isLoaded) {
    return (
      <CenteredTerminalLoader
        portal="homepage"
        minDuration={5000}
        onComplete={() => setIsLoaded(true)}
      />
    );
  }

  return <RetroHomepage />;
}

