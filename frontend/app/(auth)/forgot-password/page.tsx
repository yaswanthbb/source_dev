'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ThemeToggle } from '@/components/theme-toggle';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

const otpStepSchema = z.object({
  otp: z
    .string()
    .min(1, 'Verification code is required')
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only 6 digits'),
});

const passwordStepSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type EmailStepFormData = z.infer<typeof emailStepSchema>;
type OtpStepFormData = z.infer<typeof otpStepSchema>;
type PasswordStepFormData = z.infer<typeof passwordStepSchema>;

type ResetStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showSuccess, showError } = useSnackbar();

  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [genericMessage, setGenericMessage] = useState<string | null>(null);

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Email Form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: isSubmittingEmail },
  } = useForm<EmailStepFormData>({
    resolver: zodResolver(emailStepSchema),
    mode: 'onSubmit',
  });

  // Step 2: OTP Form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    setValue: setOtpValue,
    formState: { errors: otpErrors, isSubmitting: isSubmittingOtp },
  } = useForm<OtpStepFormData>({
    resolver: zodResolver(otpStepSchema),
    mode: 'onSubmit',
  });

  // Step 3: Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordStepFormData>({
    resolver: zodResolver(passwordStepSchema),
    mode: 'onSubmit',
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const onEmailSubmit = async (data: EmailStepFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/forgot-password',
        { email: data.email },
      );
      setTargetEmail(data.email);
      setGenericMessage(
        response.data?.message ||
          "If an account with this email exists, we've sent a reset code.",
      );
      setResendCooldown(60);
      setCurrentStep('otp');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        'Failed to process password reset request. Please try again.';
      setServerError(msg);
      showError(msg);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending || !targetEmail) return;
    setServerError(null);
    setIsResending(true);
    try {
      await apiClient.post<{ message: string }>('/auth/forgot-password', {
        email: targetEmail,
      });
      showSuccess('A new verification code has been sent to your email.');
      setResendCooldown(60);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message || 'Failed to resend reset code.';
      setServerError(msg);
      showError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const onOtpSubmit = async (data: OtpStepFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post<{ resetToken: string }>(
        '/auth/verify-otp',
        {
          email: targetEmail,
          otp: data.otp,
        },
      );
      setResetToken(response.data.resetToken);
      showSuccess('Code verified successfully.');
      setCurrentStep('password');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        'Invalid or expired verification code.';
      setServerError(msg);
      showError(msg);
    }
  };

  const onPasswordSubmit = async (data: PasswordStepFormData) => {
    if (!resetToken) {
      setServerError('Reset session expired. Please start over.');
      setCurrentStep('email');
      return;
    }

    setServerError(null);
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/reset-password',
        {
          resetToken,
          newPassword: data.newPassword,
        },
      );
      showSuccess(
        response.data?.message ||
          'Password reset successfully. You can now log in with your new password.',
      );
      router.push('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        'Failed to reset password. Token may have expired.';
      setServerError(msg);
      showError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      {/* Header Navigation */}
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
            <span className="hidden xs:inline">Remember your password?</span>
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
          {/* Step Progression Indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className={`w-8 h-1.5 rounded-full transition-all ${
                currentStep === 'email'
                  ? 'bg-accent w-10'
                  : 'bg-accent/40'
              }`}
            />
            <div
              className={`w-8 h-1.5 rounded-full transition-all ${
                currentStep === 'otp'
                  ? 'bg-accent w-10'
                  : currentStep === 'password'
                  ? 'bg-accent/40'
                  : 'bg-border'
              }`}
            />
            <div
              className={`w-8 h-1.5 rounded-full transition-all ${
                currentStep === 'password' ? 'bg-accent w-10' : 'bg-border'
              }`}
            />
          </div>

          {/* Server API Error Banner */}
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs sm:text-sm font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: REQUEST CODE (EMAIL) */}
          {/* ================================================================= */}
          {currentStep === 'email' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  Enter your registered email address and we&apos;ll send you a 6-digit verification code.
                </p>
              </div>

              <form
                onSubmit={handleSubmitEmail(onEmailSubmit)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="student@example.com"
                      {...registerEmail('email')}
                      className={`w-full px-4 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                        emailErrors.email
                          ? 'border-red focus:ring-red/20 focus:border-red'
                          : 'border-border focus:ring-accent/20 focus:border-accent'
                      }`}
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="mt-1.5 text-xs text-red font-medium">
                      {emailErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEmail}
                  className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingEmail ? (
                    <span>Sending code...</span>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: VERIFY OTP CODE */}
          {/* ================================================================= */}
          {currentStep === 'otp' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
                  Enter Reset Code
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  We&apos;ve sent a 6-digit code to{' '}
                  <strong className="text-text-primary">{targetEmail}</strong>.
                </p>
              </div>

              {genericMessage && (
                <div className="mb-5 p-3 rounded-xl bg-accent-tint/30 border border-accent/20 text-xs text-text-secondary flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{genericMessage}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmitOtp(onOtpSubmit)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 text-center"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    {...registerOtp('otp')}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      setOtpValue('otp', cleanVal, { shouldValidate: true });
                    }}
                    className={`w-full py-3 px-4 rounded-xl border bg-bg text-center font-mono text-2xl font-bold tracking-[8px] text-text-primary focus:outline-none focus:ring-2 transition-all ${
                      otpErrors.otp
                        ? 'border-red focus:ring-red/20 focus:border-red'
                        : 'border-border focus:ring-accent/20 focus:border-accent'
                    }`}
                  />
                  {otpErrors.otp && (
                    <p className="mt-1.5 text-xs text-red font-medium text-center">
                      {otpErrors.otp.message}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-text-secondary text-center">
                    ⏱ Code expires in 10 minutes (max 5 attempts).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOtp}
                  className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingOtp ? (
                    <span>Verifying code...</span>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend Code & Back actions */}
                <div className="pt-2 flex flex-col items-center gap-2 text-xs text-text-secondary">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="inline-flex items-center gap-1.5 text-accent hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : isResending
                        ? 'Sending...'
                        : 'Didn’t receive a code? Resend'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setServerError(null);
                      setCurrentStep('email');
                    }}
                    className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change email address</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: SET NEW PASSWORD */}
          {/* ================================================================= */}
          {currentStep === 'password' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
                  Set New Password
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  Create a new, strong password for your account.
                </p>
              </div>

              <form
                onSubmit={handleSubmitPassword(onPasswordSubmit)}
                className="space-y-4"
              >
                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      {...registerPassword('newPassword')}
                      className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                        passwordErrors.newPassword
                          ? 'border-red focus:ring-red/20 focus:border-red'
                          : 'border-border focus:ring-accent/20 focus:border-accent'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1.5 text-xs text-red font-medium">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      {...registerPassword('confirmPassword')}
                      className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                        passwordErrors.confirmPassword
                          ? 'border-red focus:ring-red/20 focus:border-red'
                          : 'border-border focus:ring-accent/20 focus:border-accent'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red font-medium">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingPassword ? (
                    <span>Updating password...</span>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Bottom Back to Login Link */}
          <div className="mt-6 pt-6 border-t border-border/60 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-text-secondary">
        &copy; {new Date().getFullYear()} Knowledge is Power. All rights reserved.
      </footer>
    </div>
  );
}
