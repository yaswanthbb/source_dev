'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  User as UserIcon,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Briefcase,
  Shield,
  UploadCloud,
  Clock,
  Sparkles,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getToken, setUser, User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ThemeToggle } from '@/components/theme-toggle';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const basicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  timezone: z.string().min(1, 'Timezone is required'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Auth Guard
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Fetch Current User
  const { data: profileUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<User>('/users/me');
      setUser(res.data);
      return res.data;
    },
    enabled: isAuthenticated === true,
  });

  const role = profileUser?.role || 'student';
  const isInstructorOrAdmin = role === 'instructor' || role === 'admin';
  const dashboardHref =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'instructor'
      ? '/instructor/dashboard'
      : '/student/dashboard';

  // -------------------------------------------------------------------------
  // CONSOLIDATED PROFILE STATE (Picture + Basic Info + Bio)
  // -------------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [bioText, setBioText] = useState('');

  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    reset: resetBasic,
    formState: { errors: basicErrors },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      timezone: 'UTC',
    },
  });

  // Sync profile data to form and state on load
  useEffect(() => {
    if (profileUser) {
      resetBasic({
        name: profileUser.name || '',
        timezone: profileUser.timezone || 'UTC',
      });
      setPreviewImage(profileUser.profilePicture || null);
      if (profileUser.instructorProfile?.bio !== undefined) {
        setBioText(profileUser.instructorProfile.bio || '');
      }
    }
  }, [profileUser, resetBasic]);

  const resizeImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
        reject(new Error('Please select a valid image file (JPEG, PNG, or WebP).'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to process image canvas.'));
            return;
          }

          // Center crop to 256x256
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);

          // Export as compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to render selected image.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read selected image file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const resizedDataUrl = await resizeImageToDataUrl(file);
      const base64Data = resizedDataUrl.split(',')[1] || '';
      const bytes = Math.round((base64Data.length * 3) / 4);
      setImageSizeKb(Math.round(bytes / 1024));
      setPreviewImage(resizedDataUrl);
    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemovePicture = () => {
    setPreviewImage(null);
    setImageSizeKb(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Single Consolidated Save Mutation (Profile Picture + Name + Timezone + Instructor Bio)
  const saveProfileMutation = useMutation({
    mutationFn: async (data: BasicInfoFormData) => {
      // 1. Update basic profile info & profile picture
      const userRes = await apiClient.patch<User>('/users/me', {
        name: data.name,
        timezone: data.timezone,
        profilePicture: previewImage,
      });

      // 2. If instructor or admin, update bio
      if (isInstructorOrAdmin) {
        await apiClient.patch<{ message: string; bio: string | null }>(
          '/users/me/instructor-bio',
          { bio: bioText },
        );
      }

      return userRes.data;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      showSuccess('Profile updated.');
      router.push(dashboardHref);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message || 'Failed to update profile.';
      showError(msg);
    },
  });

  const onProfileSubmit = (data: BasicInfoFormData) => {
    saveProfileMutation.mutate(data);
  };

  // -------------------------------------------------------------------------
  // SECTION: CHANGE PASSWORD (INDEPENDENT)
  // -------------------------------------------------------------------------
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const res = await apiClient.patch<{ message: string }>(
        '/users/me/password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      );
      return res.data;
    },
    onSuccess: (res) => {
      showSuccess(res.message || 'Password changed successfully.');
      resetPassword();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        'Failed to change password. Please check your current password.';
      showError(msg);
    },
  });

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!isAuthenticated || isUserLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-text-secondary text-sm font-medium animate-pulse">
          <Clock className="w-4 h-4 animate-spin text-accent" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      {/* Header Bar */}
      <header className="w-full border-b border-border bg-surface px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-4">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <Link href="/" className="hidden sm:flex items-center py-1">
            <Image
              src="/logo.png"
              alt="KIP Logo"
              width={110}
              height={32}
              className="h-7 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              role === 'instructor'
                ? 'bg-amber-tint text-amber border border-amber/30'
                : 'bg-accent-tint text-accent border border-accent/20'
            }`}
          >
            {role}
          </span>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Account Settings & Profile
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage your personal profile, credentials, and teaching biography.
          </p>
        </div>

        {/* =================================================================== */}
        {/* CONSOLIDATED FORM: PROFILE PICTURE + BASIC INFO + INSTRUCTOR BIO */}
        {/* =================================================================== */}
        <form
          onSubmit={handleSubmitBasic(onProfileSubmit)}
          className="space-y-6"
        >
          {/* Card 1: Profile Picture */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                  Profile Picture
                </h2>
                <p className="text-xs text-text-secondary">
                  Upload a personalized avatar (automatically compressed to 256×256).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-border bg-bg flex items-center justify-center shadow-inner">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={profileUser?.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-accent-tint text-accent">
                      {profileUser?.name ? (
                        profileUser.name.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon className="w-10 h-10" />
                      )}
                    </div>
                  )}
                </div>

                {isProcessingImage && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              {/* Picture File Controls */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-picture-upload"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="px-4 py-2 rounded-xl bg-surface border border-border hover:bg-bg text-text-primary text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-accent" />
                    <span>Choose Photo</span>
                  </button>

                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="px-3 py-2 rounded-xl text-red hover:bg-red-tint/50 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {imageSizeKb && (
                  <p className="text-[11px] text-green font-medium">
                    ✓ Optimized size: ~{imageSizeKb} KB (will save on submit)
                  </p>
                )}
                <p className="text-[11px] text-text-secondary">
                  Supported formats: JPEG, PNG, WebP (Max size after compression &le; 500KB).
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Basic Account Details */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                  Basic Information
                </h2>
                <p className="text-xs text-text-secondary">
                  Update your display name and localized timezone.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
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
                    placeholder="Your full name"
                    {...registerBasic('name')}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                      basicErrors.name
                        ? 'border-red focus:ring-red/20 focus:border-red'
                        : 'border-border focus:ring-accent/20 focus:border-accent'
                    }`}
                  />
                  {basicErrors.name && (
                    <p className="mt-1 text-xs text-red font-medium">
                      {basicErrors.name.message}
                    </p>
                  )}
                </div>

                {/* Timezone */}
                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
                  >
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    {...registerBasic('timezone')}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-bg text-text-primary focus:outline-none focus:ring-2 text-sm transition-all ${
                      basicErrors.timezone
                        ? 'border-red focus:ring-red/20 focus:border-red'
                        : 'border-border focus:ring-accent/20 focus:border-accent'
                    }`}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  {basicErrors.timezone && (
                    <p className="mt-1 text-xs text-red font-medium">
                      {basicErrors.timezone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email (Read-Only) & Role (Read-Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-text-secondary uppercase tracking-wider"
                    >
                      Email Address
                    </label>
                    <span className="text-[10px] text-text-secondary/80 font-medium">
                      Cannot be changed
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      disabled
                      value={profileUser?.email || ''}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-bg/60 text-text-secondary cursor-not-allowed text-sm select-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-text-secondary/60 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Account Role
                  </label>
                  <div className="py-2.5 px-4 rounded-xl border border-border bg-bg/60 text-text-secondary text-sm flex items-center justify-between">
                    <span className="capitalize font-semibold text-text-primary">
                      {role}
                    </span>
                    <Shield className="w-4 h-4 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Instructor Bio (Only rendered for Instructor / Admin) */}
          {isInstructorOrAdmin && (
            <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                    Instructor Biography
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Displayed on roadmaps and author profiles across the platform.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="bio"
                    className="block text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >
                    About You
                  </label>
                  <span className="text-[11px] text-text-secondary">
                    {bioText.length} / 2000 characters
                  </span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={2000}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Share your technical experience, industry background, and what students will learn from your roadmaps..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Single Consolidated "Save Profile" Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveProfileMutation.isPending}
              className="w-full sm:w-auto px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saveProfileMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* =================================================================== */}
        {/* SECTION: CONNECTED ACCOUNTS / SIGN-IN METHOD */}
        {/* =================================================================== */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
            <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                Connected Accounts
              </h2>
              <p className="text-xs text-text-secondary">
                Manage your external authentication and social sign-in methods.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Google Status */}
            <div className="p-4 rounded-xl border border-border bg-bg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center border border-border">
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
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Google</h4>
                  <p className="text-xs text-text-secondary">
                    {profileUser?.authProvider === 'google'
                      ? 'Connected as primary sign-in'
                      : 'Not connected'}
                  </p>
                </div>
              </div>

              {profileUser?.authProvider === 'google' ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Connected
                </span>
              ) : (
                <span className="text-xs text-text-secondary">Disabled</span>
              )}
            </div>

            {/* GitHub Status */}
            <div className="p-4 rounded-xl border border-border bg-bg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center border border-border">
                  <svg className="w-5 h-5 fill-current text-text-primary" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">GitHub</h4>
                  <p className="text-xs text-text-secondary">
                    {profileUser?.authProvider === 'github'
                      ? 'Connected as primary sign-in'
                      : 'Not connected'}
                  </p>
                </div>
              </div>

              {profileUser?.authProvider === 'github' ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Connected
                </span>
              ) : (
                <span className="text-xs text-text-secondary">Disabled</span>
              )}
            </div>
          </div>
        </div>


        {/* =================================================================== */}
        {/* SECTION: CHANGE PASSWORD (ONLY RENDERED IF USER HAS A PASSWORD SET) */}
        {/* =================================================================== */}
        {Boolean(profileUser?.hasPassword) && (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                  Change Password
                </h2>
                <p className="text-xs text-text-secondary">
                  Ensure your account is using a long, secure password.
                </p>
              </div>
            </div>


          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-2"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  {...registerPassword('currentPassword')}
                  className={`w-full pl-4 pr-11 py-2.5 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
                    passwordErrors.currentPassword
                      ? 'border-red focus:ring-red/20 focus:border-red'
                      : 'border-border focus:ring-accent/20 focus:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((p) => !p)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-red font-medium">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
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
                  <p className="mt-1 text-xs text-red font-medium">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
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
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border bg-bg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 text-sm transition-all ${
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
                  <p className="mt-1 text-xs text-red font-medium">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {changePasswordMutation.isPending ? (
                  <span>Updating password...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}
      </main>


      {/* Footer */}
      <footer className="py-6 text-center text-xs text-text-secondary border-t border-border/60">
        &copy; {new Date().getFullYear()} Knowledge is Power. All rights reserved.
      </footer>
    </div>
  );
}
