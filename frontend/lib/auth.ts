export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  timezone?: string;
  profilePicture?: string | null;
  authProvider?: string | null;
  authProviderId?: string | null;
  hasPassword?: boolean;
  createdAt?: string;
  instructorProfile?: {
    id?: string;
    status?: 'pending' | 'approved' | 'rejected';
    bio?: string | null;
    createdAt?: string;
    approvedAt?: string | null;
  };
}


const TOKEN_KEY = 'kip_token';
const USER_KEY = 'kip_user';

/** Dispatched on this tab whenever the auth token is set or cleared, so
 *  listeners (e.g. SessionSync) can react to login/logout without a reload. */
export const AUTH_CHANGED_EVENT = 'kip-auth-changed';

const notifyAuthChanged = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  notifyAuthChanged();
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = (): void => {
  clearToken();
  clearUser();
};
