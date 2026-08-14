'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { setToken, setUser, User } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post<{ accessToken: string; user: User }>(
        '/auth/register',
        { name, email, password },
      );

      const { accessToken, user } = response.data;
      setToken(accessToken);
      setUser(user);

      router.push('/student/dashboard');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const backendMessage = axiosError.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setErrorMessage(backendMessage.join(', '));
      } else if (typeof backendMessage === 'string') {
        setErrorMessage(backendMessage);
      } else {
        setErrorMessage('Failed to create account. Please check your information and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="w-full border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold font-display text-lg">
            K
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-text-primary">
            Knowledge Is Power
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Already have an account?</span>
          <Link
            href="/login"
            className="text-accent font-medium hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Start your personalized learning path today
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-sm font-medium flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-all duration-150 shadow-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-4 text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} Knowledge Is Power. All rights reserved.
      </footer>
    </div>
  );
}
