'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { setToken, setUser, User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ThemeToggle } from '@/components/theme-toggle';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

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

  const { showError } = useSnackbar();

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await apiClient.post<{ accessToken: string; user: User }>(
        '/auth/login',
        data,
      );

      const { accessToken, user } = response.data;
      setToken(accessToken);
      setUser(user);

      const targetRoute = getDashboardRoute(user.role);
      router.replace(targetRoute);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const backendMessage = axiosError.response?.data?.message;
      let errorText = 'Invalid credentials. Please check your email and password.';

      if (Array.isArray(backendMessage)) {
        errorText = backendMessage.join(', ');
      } else if (typeof backendMessage === 'string') {
        errorText = backendMessage;
      }

      setServerError(errorText);
      showError(errorText);
    }
  };

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
        <div className="flex items-center gap-3 text-xs sm:text-sm text-text-secondary text-right">
          <ThemeToggle />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden xs:inline">Don&apos;t have an account?</span>
            <Link
              href="/register"
              className="text-accent font-medium hover:underline transition-colors whitespace-nowrap"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Sign in to your account to continue your learning path
            </p>
          </div>

          {/* Server API Error Banner */}
          {serverError && (
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
              <span>{serverError}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/google`}
              className="w-full py-3 px-4 bg-bg hover:bg-surface-hover text-text-primary border border-border rounded-xl text-sm font-medium transition-all duration-150 shadow-sm flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/github`}
              className="w-full py-3 px-4 bg-bg hover:bg-surface-hover text-text-primary border border-border rounded-xl text-sm font-medium transition-all duration-150 shadow-sm flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-3 text-text-secondary font-medium tracking-wider">
                Or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

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
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-text-primary uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent hover:underline font-medium transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Minimum 8 characters"
                  {...register('password')}
                  className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-border focus:ring-accent/20 focus:border-accent'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all duration-150 shadow-sm flex items-center justify-center cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-4 text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} KIP. All rights reserved.
      </footer>
    </div>
  );
}
