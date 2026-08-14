'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  LogOut,
  User as UserIcon,
  Shield,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getToken, clearAuth, User } from '@/lib/auth';

const ADMIN_NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Instructors',
    href: '/admin/instructors',
    icon: UserCheck,
  },
  {
    name: 'Users Directory',
    href: '/admin/users',
    icon: Users,
  },
];

export default function AdminAppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setIsTokenChecked(true);
    }
  }, [router]);

  // Live user profile fetch from GET /users/me
  const {
    data: user,
    isLoading: userLoading,
    isError,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
    enabled: isTokenChecked,
    staleTime: 30000,
  });

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    router.replace('/login');
  };

  // Role Guard: Redirect non-admins to /student/dashboard
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/student/dashboard');
    }
  }, [user, router]);

  if (!isTokenChecked || userLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-text-secondary font-medium">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (isError || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-border text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold font-display text-text-primary">
              Administrator Access Required
            </h2>
            <p className="text-xs text-text-secondary">
              {(error as Error)?.message || 'You do not have permission to view administrative controls.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold hover:bg-bg cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Fixed Left Sidebar (240px) */}
      <aside className="w-[240px] flex-shrink-0 bg-surface border-r border-border min-h-screen flex flex-col justify-between sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          {/* Top Brand Header */}
          <div className="h-20 px-6 flex items-center border-b border-border">
            <Link href="/admin/dashboard" className="flex items-center">
              <Image
                src="/logo.png?v=2"
                alt="KIS Logo"
                width={160}
                height={52}
                className="h-11 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Admin Navigation">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
              Admin Console
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-tint text-accent font-semibold'
                      : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-text-secondary'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="p-3 rounded-xl bg-bg border border-border/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider truncate">
                  Admin
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
