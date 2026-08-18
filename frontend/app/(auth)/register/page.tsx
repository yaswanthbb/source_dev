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

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { showSuccess, showError } = useSnackbar();

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      const response = await apiClient.post<{ accessToken: string; user: User }>(
        '/auth/register',
        data,
      );

      const { accessToken, user } = response.data;
      setToken(accessToken);
      setUser(user);

      showSuccess('Account created successfully!');
      router.replace('/student/dashboard');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const backendMessage = axiosError.response?.data?.message;
      let errorText = 'Failed to create account. Please check your information and try again.';

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
            <span className="hidden xs:inline">Already have an account?</span>
            <Link
              href="/login"
              className="text-accent font-medium hover:underline transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
              Create an account
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Start your personalized learning path today
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                autoFocus
                autoComplete="name"
                placeholder="Jane Doe"
                {...register('name')}
                className={`w-full px-4 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.name.message}
                </p>
              )}
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
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
        &copy; {new Date().getFullYear()} KIP. All rights reserved.
      </footer>
    </div>
  );
}
