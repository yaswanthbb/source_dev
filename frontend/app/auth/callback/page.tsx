'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { setToken, setUser, User } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const getDashboardRoute = (role: User['role']) => {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'instructor':
        return '/instructor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/student/dashboard';
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setIsProcessing(false);
      return;
    }

    if (!token) {
      setErrorMessage('No authentication token was received from the provider.');
      setIsProcessing(false);
      return;
    }

    const processAuth = async () => {
      try {
        setToken(token);
        // Fetch full self-profile using the new token
        const response = await apiClient.get<User>('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data;
        setUser(user);

        const targetRoute = getDashboardRoute(user.role);
        router.replace(targetRoute);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const backendMessage =
          axiosErr?.response?.data?.message || axiosErr?.message;
        setErrorMessage(
          backendMessage ||
            'Failed to complete authentication. Please try logging in again.',
        );
        setIsProcessing(false);
      }

    };

    processAuth();
  }, [searchParams, router]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-text-primary">
          Completing sign-in...
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Setting up your learning environment
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold font-display text-text-primary mb-2">
        Authentication Error
      </h2>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        {errorMessage}
      </p>

      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Sign in</span>
      </Link>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="w-full border-b border-border bg-surface px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center py-1">
          <Image
            src="/logo.png"
            alt="KIP Logo"
            width={130}
            height={40}
            className="h-8 sm:h-10 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <p className="text-sm text-text-secondary">Loading...</p>
            </div>
          }
        >
          <CallbackHandler />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} KIP. All rights reserved.
      </footer>
    </div>
  );
}
