import axios from 'axios';
import { getToken, clearAuth } from './auth';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // An old-session preference request must not interrupt provider verification
    // or clear a newly verified session. The callback owns its error/retry UI.
    const completingOAuth =
      typeof window !== 'undefined' &&
      window.location.pathname === '/auth/callback';
    if (error.response && error.response.status === 401 && !completingOAuth) {
      clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
