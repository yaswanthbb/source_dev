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
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeftRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getToken, clearAuth, User } from '@/lib/auth';
import { LogoutConfirmationModal } from '@/components/logout-confirmation-modal';

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
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
              onClick={() => setShowLogoutModal(true)}
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
    <div className="min-h-screen bg-bg flex relative">
      {/* Smooth Collapsible Left Sidebar (240px) */}
      <aside
        className={`w-[240px] flex-shrink-0 bg-surface border-r border-border min-h-screen flex flex-col justify-between sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${
          isSidebarHidden
            ? '-ml-[240px] opacity-0 pointer-events-none -translate-x-full'
            : 'ml-0 opacity-100 translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Top Brand Header with Collapse Button */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-border">
            <Link href="/admin/dashboard" className="flex items-center">
              <Image
                src="/logo.png"
                alt="KIP Logo"
                width={120}
                height={39}
                className="h-[33px] w-auto object-contain"
                priority
                unoptimized
              />
            </Link>

            <button
              type="button"
              onClick={() => setIsSidebarHidden(true)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
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
        <div className="p-4 border-t border-border bg-surface space-y-3">
          {/* Switch to Student View Button */}
          <Link
            href="/student/dashboard"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg hover:border-accent/40 hover:bg-accent-tint/50 text-text-primary hover:text-accent text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs group cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-accent transition-transform group-hover:rotate-180" />
            <span>Switch to Student View</span>
          </Link>

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
              onClick={() => setShowLogoutModal(true)}
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
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Top Header Strip when Sidebar is Collapsed */}
        {isSidebarHidden && (
          <div className="h-14 px-6 lg:px-10 flex items-center border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-30 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setIsSidebarHidden(false)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border shadow-2xs hover:bg-bg text-text-primary text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer group"
              title="Show sidebar"
              aria-label="Show sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-accent transition-transform group-hover:translate-x-0.5" />
              <span className="font-display">Sidebar</span>
            </button>
          </div>
        )}

        <main className="flex-1 py-6 lg:py-8 px-6 lg:px-8 xl:px-10 w-full transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
