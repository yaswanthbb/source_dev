'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getToken, clearAuth, User } from '@/lib/auth';
import { LogoutConfirmationModal } from '@/components/logout-confirmation-modal';
import { ProfileActionsMenu } from '@/components/profile-actions-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { AiJobsProvider } from '@/providers/ai-jobs-provider';
import { AiJobsIndicator } from '@/components/ai-jobs-indicator';

interface FullUser extends User {
  instructorProfile?: {
    id?: string;
    status?: 'pending' | 'approved' | 'rejected';
    bio?: string;
    approvedAt?: string | null;
  };
}

const INSTRUCTOR_NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/instructor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Content',
    href: '/instructor/content',
    icon: FolderKanban,
  },
  {
    name: 'Q&A Discussions',
    href: '/instructor/qa',
    icon: MessageSquare,
  },
];

export default function InstructorAppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

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
  } = useQuery<FullUser>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<FullUser>('/users/me');
        return response.data;
      } catch (err) {
        console.error('Failed to fetch GET /users/me in instructor layout:', err);
        throw err;
      }
    },
    enabled: isTokenChecked,
    staleTime: 30000,
  });

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    router.replace('/login');
  };

  // Role Guard: Redirect non-instructors to /student/dashboard
  useEffect(() => {
    if (user && user.role !== 'instructor' && user.role !== 'admin') {
      router.replace('/student/dashboard');
    }
  }, [user, router]);

  // Loading state while checking token and fetching profile
  if (!isTokenChecked || userLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-text-secondary font-medium">Verifying instructor credentials...</p>
        </div>
      </div>
    );
  }

  // Error state if GET /users/me fails
  if (isError || !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-surface border border-border text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
              Unable to load instructor profile
            </h2>
            <p className="text-xs text-text-secondary">
              {(error as Error)?.message || 'An error occurred while communicating with the server.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold hover:bg-bg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approval Guard: If instructor is not approved yet, display pending notice
  const isApproved =
    user.role === 'admin' ||
    user.instructorProfile?.status === 'approved';

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6">
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="KIP Logo"
              width={105}
              height={33}
              className="h-[28px] sm:h-[30px] w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary text-xs font-medium cursor-pointer"
          >
            Sign out
          </button>
        </header>

        <main className="max-w-md w-full mx-auto p-6 sm:p-8 bg-surface border border-border rounded-2xl shadow-sm text-center space-y-6 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-tint text-amber flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-tint text-amber text-xs font-semibold uppercase tracking-wider">
              Pending Approval
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-text-primary tracking-tight">
              Instructor Account Under Review
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your instructor application has been submitted and is currently awaiting administrative review. You will gain access to the curriculum authoring tools once approved.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/student/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Explore Student Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>

        <footer className="text-center text-xs text-text-secondary py-4">
          &copy; {new Date().getFullYear()} KIP. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <AiJobsProvider>
      <div className="min-h-screen bg-bg flex flex-col lg:flex-row relative">
      {/* Ambient Dark Mode Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 hidden dark:block" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[90px]" />
      </div>

      {/* 1. Mobile Top Navigation Bar (< lg) */}
      <header className="lg:hidden h-14 px-4 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-30">
        <Link href="/instructor/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="KIP Logo"
            width={110}
            height={34}
            className="h-7 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>

        <div className="flex items-center gap-1.5">
          <AiJobsIndicator />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Mobile Slide-In Drawer Navigation (< lg) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-surface z-50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <Link
                  href="/instructor/dashboard"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src="/logo.png"
                    alt="KIP Logo"
                    width={110}
                    height={34}
                    className="h-7 w-auto object-contain"
                    priority
                    unoptimized
                  />
                </Link>

                <div className="flex items-center gap-1.5">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1.5" aria-label="Instructor Mobile Navigation">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
                  Instructor Portal
                </div>
                {INSTRUCTOR_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/instructor/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
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

            {/* Mobile Drawer Footer Profile Actions */}
            <div className="p-4 border-t border-border bg-surface">
              <ProfileActionsMenu
                user={user || undefined}
                onOpenLogoutModal={() => {
                  setIsMobileDrawerOpen(false);
                  setShowLogoutModal(true);
                }}
                currentView="instructor"
              />
            </div>
          </aside>
        </div>
      )}

      {/* 3. Desktop Collapsible Left Sidebar (lg+) */}
      <aside
        className={`hidden lg:flex w-[240px] flex-shrink-0 bg-surface border-r border-border min-h-screen flex-col justify-between sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${
          isSidebarHidden
            ? '-ml-[240px] opacity-0 pointer-events-none -translate-x-full'
            : 'ml-0 opacity-100 translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Top Brand Header with Theme Toggle & Collapse Button */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-border">
            <Link href="/instructor/dashboard" className="flex items-center">
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

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
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
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Instructor Navigation">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
              Instructor Portal
            </div>
            {INSTRUCTOR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/instructor/dashboard' && pathname.startsWith(item.href));

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

            <AiJobsIndicator />
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-border bg-surface">
          <ProfileActionsMenu
            user={user || undefined}
            onOpenLogoutModal={() => setShowLogoutModal(true)}
            currentView="instructor"
          />
        </div>
      </aside>

      {/* 4. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out">
        {/* Top Header Strip on Desktop when Sidebar is Collapsed */}
        {isSidebarHidden && (
          <div className="hidden lg:flex h-14 px-6 lg:px-10 items-center justify-between border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-30 animate-in fade-in duration-200">
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

            <div className="flex items-center gap-2">
              <AiJobsIndicator />
              <ThemeToggle />
            </div>
          </div>
        )}

        <main className="flex-1 py-5 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 w-full transition-all duration-300 ease-in-out">
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
    </AiJobsProvider>
  );
}
