'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getToken, getUser, setUser, AUTH_CHANGED_EVENT, User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';

const DASHBOARD_BY_ROLE: Record<User['role'], string> = {
  student: '/student/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Reactive "is there a session token?" flag. Reads localStorage on mount and
 * re-reads whenever auth changes in this tab (AUTH_CHANGED_EVENT, dispatched by
 * setToken/clearToken), in another tab ('storage'), or the tab regains focus.
 * Starts false so the server and first client render agree (no hydration gap).
 */
function useHasToken(): boolean {
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    const read = () => setHasToken(Boolean(getToken()));
    read();
    window.addEventListener(AUTH_CHANGED_EVENT, read);
    window.addEventListener('storage', read);
    window.addEventListener('focus', read);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, read);
      window.removeEventListener('storage', read);
      window.removeEventListener('focus', read);
    };
  }, []);
  return hasToken;
}

/**
 * Watches the server for role changes — e.g. an admin approving an instructor
 * application — and reflects them WITHOUT forcing a re-login.
 *
 * The backend already authorizes on the live DB role (JwtStrategy re-fetches the
 * user each request), so the only stale piece is the cached user in localStorage
 * that the UI reads to decide student-vs-instructor. This polls GET /users/me
 * while signed in; on a role transition it refreshes that cache, shows a toast,
 * and routes the user into the dashboard for their new role.
 *
 * Mounted once at the root so it covers every authenticated page, including the
 * profile page (which has no dedicated layout) where students apply from.
 */
export function SessionSync() {
  const router = useRouter();
  const { showSuccess } = useSnackbar();
  const hasToken = useHasToken();

  const { data: freshUser } = useQuery<User>({
    queryKey: ['session', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    enabled: hasToken,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // The role we've already reconciled, so each transition acts exactly once.
  const lastRoleRef = useRef<User['role'] | null>(null);

  useEffect(() => {
    if (!freshUser) return;

    // Seed the baseline from the currently-cached role on the first fetch, so a
    // mismatch with the server counts as a real transition to announce.
    if (lastRoleRef.current === null) {
      lastRoleRef.current = getUser()?.role ?? freshUser.role;
    }
    const previousRole = lastRoleRef.current;

    // Keep the cached user current regardless (name, avatar, instructorProfile…).
    setUser(freshUser);

    if (freshUser.role !== previousRole) {
      lastRoleRef.current = freshUser.role;

      if (freshUser.role === 'instructor' && previousRole === 'student') {
        showSuccess("🎉 You've been approved as an instructor!");
      } else if (freshUser.role === 'student' && previousRole === 'instructor') {
        showSuccess('Your instructor access has been updated.');
      }

      router.replace(DASHBOARD_BY_ROLE[freshUser.role]);
    }
  }, [freshUser, router, showSuccess]);

  return null;
}
