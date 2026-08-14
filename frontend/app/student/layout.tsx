'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Map,
  MessageSquare,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getToken, clearAuth, getUser, User } from '@/lib/auth';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Roadmaps',
    href: '/student/roadmaps',
    icon: Map,
  },
  {
    name: 'Q&A',
    href: '/student/qa',
    icon: MessageSquare,
  },
];

export default function StudentAppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthChecked(true);
    }
  }, [router]);

  // Live user profile fetch from GET /users/me
  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
    enabled: isAuthChecked,
    initialData: () => getUser() || undefined,
  });

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    router.replace('/login');
  };

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
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
            <Link href="/student/dashboard" className="flex items-center">
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
          <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/student/dashboard' && pathname.startsWith(item.href));

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
              <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center font-semibold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || 'Loading...'}
                </p>
                <p className="text-[10px] text-text-secondary capitalize truncate">
                  {user?.role || 'Student'}
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
