'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUser, clearAuth, User } from '@/lib/auth';

export default function StudentDashboardPlaceholder() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
    } else {
      setCurrentUser(user);
      setIsLoaded(true);
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navigation Header */}
      <header className="w-full border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center py-1">
          <Image
            src="/logo.png?v=2"
            alt="KIS Logo"
            width={200}
            height={64}
            className="h-12 sm:h-14 w-auto object-contain"
            priority
            unoptimized
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">{currentUser?.name}</p>
            <p className="text-xs text-text-secondary capitalize">{currentUser?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-bg text-text-secondary hover:text-text-primary hover:bg-border/40 text-xs font-medium transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-tint text-green text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            Auth Flow Verified
          </div>

          <h1 className="text-3xl font-bold font-display text-text-primary tracking-tight">
            Welcome, {currentUser?.name}!
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Logged in as <span className="font-semibold text-text-primary">{currentUser?.email}</span> (Role: <span className="font-semibold capitalize text-accent">{currentUser?.role}</span>).
          </p>

          <div className="mt-8 p-6 rounded-xl border border-border bg-bg">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Phase 1 Placeholder
            </h2>
            <p className="text-sm text-text-primary mt-2 leading-relaxed">
              Full student dashboard UI, active roadmaps, and gamification metrics will be built in Phase 2. Authentication, JWT session persistence, and role-based routing are operating successfully.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
