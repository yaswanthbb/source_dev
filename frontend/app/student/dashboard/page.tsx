'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Flame,
  Trophy,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
  AlertCircle,
  Clock,
  Layers,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User } from '@/lib/auth';
import {
  useAllRoadmapsProgress,
  RoadmapProgressData,
} from '@/lib/hooks/use-roadmap-progress';

// ─── Types matching backend models ──────────────────────────────────────────

interface EarnedBadgeItem {
  id: string;
  name: string;
  description: string;
  criteriaKey: string;
  earnedAt: string;
}

interface GamificationData {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  earnedBadges?: EarnedBadgeItem[];
  userBadges?: Array<{
    userId?: string;
    badgeId?: string;
    earnedAt: string;
    badge?: Badge;
  }>;
}

const BADGE_IMAGE_MAP: Record<string, string> = {
  first_concept: '/badges/first_concept.png',
  five_concepts: '/badges/five_concepts.png',
  twenty_concepts: '/badges/twenty_concepts.png',
  three_day_streak: '/badges/three_day_streak.png',
  seven_day_streak: '/badges/seven_day_streak.png',
  hundred_xp: '/badges/hundred_xp.png',
  five_hundred_xp: '/badges/five_hundred_xp.png',
};

const BADGE_NAME_MAP: Record<string, string> = {
  'first steps': '/badges/first_concept.png',
  'getting serious': '/badges/five_concepts.png',
  'dedicated learner': '/badges/twenty_concepts.png',
  '3-day streak': '/badges/three_day_streak.png',
  'week warrior': '/badges/seven_day_streak.png',
  'xp rookie': '/badges/hundred_xp.png',
  'xp grinder': '/badges/five_hundred_xp.png',
};

function getBadgeImage(badge: Badge): string {
  if (badge.iconUrl && badge.iconUrl.trim()) return badge.iconUrl;
  if (badge.criteriaKey && BADGE_IMAGE_MAP[badge.criteriaKey]) {
    return BADGE_IMAGE_MAP[badge.criteriaKey];
  }
  const nameKey = badge.name?.toLowerCase().trim();
  if (nameKey && BADGE_NAME_MAP[nameKey]) {
    return BADGE_NAME_MAP[nameKey];
  }
  return '/badges/first_concept.png';
}

interface UserConceptProgress {
  id: string;
  userId: string;
  conceptId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  concept?: {
    id: string;
    title: string;
    slug: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  moduleCount?: number;
  modules?: Array<{
    id: string;
    title: string;
    orderIndex: number;
    moduleConcepts?: Array<{
      id: string;
      conceptId: string;
      orderIndex: number;
      concept?: { id: string; title: string };
    }>;
  }>;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  criteriaKey: string;
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-tint text-green ring-1 ring-green/30',
  medium: 'bg-amber-tint text-amber ring-1 ring-amber/30',
  hard: 'bg-red-tint text-red ring-1 ring-red/30',
};

export default function StudentDashboardPage() {
  // 1. Current User
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  // 2. Gamification Stats (XP, Streaks, Earned Badges)
  const {
    data: gamification,
    isLoading: gamificationLoading,
    isError: gamificationError,
  } = useQuery<GamificationData>({
    queryKey: ['gamification', 'me'],
    queryFn: async () =>
      (await apiClient.get<GamificationData>('/gamification/me')).data,
  });

  // 2.1 Activity Heatmap (Source of truth from /gamification/activity)
  const { data: rawActivityList = [], isLoading: activityLoading } = useQuery<
    Array<{ date: string; active: boolean }>
  >({
    queryKey: ['gamification', 'activity', 14],
    queryFn: async () =>
      (
        await apiClient.get<Array<{ date: string; active: boolean }>>(
          '/gamification/activity?days=14',
        )
      ).data,
  });

  // 3. User Concept Progress List
  const {
    data: progressList = [],
    isLoading: progressLoading,
    isError: progressError,
  } = useQuery<UserConceptProgress[]>({
    queryKey: ['progress', 'me'],
    queryFn: async () =>
      (await apiClient.get<UserConceptProgress[]>('/progress/me')).data,
  });

  // 4. All Roadmaps
  const {
    data: roadmaps = [],
    isLoading: roadmapsLoading,
    isError: roadmapsError,
  } = useQuery<Roadmap[]>({
    queryKey: ['roadmaps'],
    queryFn: async () => (await apiClient.get<Roadmap[]>('/roadmaps')).data,
  });

  // 5. Progress per Roadmap (using bulk hook)
  const roadmapIds = useMemo(() => roadmaps.map((r) => r.id), [roadmaps]);
  const { data: roadmapsProgressMap = {}, isLoading: roadmapsProgressLoading } =
    useAllRoadmapsProgress(roadmapIds);

  // 6. All System Badges
  const {
    data: allBadges = [],
    isLoading: badgesLoading,
    isError: badgesError,
  } = useQuery<Badge[]>({
    queryKey: ['badges'],
    queryFn: async () => (await apiClient.get<Badge[]>('/badges')).data,
  });

  // 7. Spaced Repetition Due Count
  const { data: reviewDueData, isLoading: reviewDueLoading } = useQuery<{
    count: number;
    dueCount: number;
  }>({
    queryKey: ['review', 'due-count'],
    queryFn: async () =>
      (await apiClient.get<{ count: number; dueCount: number }>('/review/due-count')).data,
  });

  // Derived Calculations
  const completedConceptsCount = useMemo(() => {
    return progressList.filter((p) => p.status === 'completed').length;
  }, [progressList]);

  const mostRecentInProgress = useMemo(() => {
    const inProgressItems = progressList.filter(
      (p) => p.status === 'in_progress',
    );
    if (inProgressItems.length === 0) return null;

    return [...inProgressItems].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    })[0];
  }, [progressList]);

  const activityHeatmap = useMemo(() => {
    if (rawActivityList && rawActivityList.length > 0) {
      return rawActivityList.map((item, index) => {
        const parts = item.date.split('-').map(Number);
        const dayNumber = parts.length === 3 ? parts[2] : index + 1;
        return {
          isoDate: item.date,
          dayNumber,
          hasActivity: item.active,
          isToday: index === rawActivityList.length - 1,
        };
      });
    }

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoStr = d.toISOString().slice(0, 10);
      days.push({
        isoDate: isoStr,
        dayNumber: d.getDate(),
        hasActivity: false,
        isToday: i === 0,
      });
    }
    return days;
  }, [rawActivityList]);

  const earnedBadgeMap = useMemo(() => {
    const map = new Map<string, { earnedAt: string }>();
    if (gamification?.earnedBadges && Array.isArray(gamification.earnedBadges)) {
      gamification.earnedBadges.forEach((eb) => {
        if (eb.id) map.set(eb.id, { earnedAt: eb.earnedAt });
        if (eb.criteriaKey) map.set(eb.criteriaKey, { earnedAt: eb.earnedAt });
        if (eb.name) map.set(eb.name.toLowerCase().trim(), { earnedAt: eb.earnedAt });
      });
    }
    if (gamification?.userBadges && Array.isArray(gamification.userBadges)) {
      gamification.userBadges.forEach((ub) => {
        const id = ub.badgeId || ub.badge?.id;
        const criteriaKey = ub.badge?.criteriaKey;
        const name = ub.badge?.name;
        if (id) map.set(id, { earnedAt: ub.earnedAt });
        if (criteriaKey) map.set(criteriaKey, { earnedAt: ub.earnedAt });
        if (name) map.set(name.toLowerCase().trim(), { earnedAt: ub.earnedAt });
      });
    }
    return map;
  }, [gamification]);

  const unlockedBadgesCount = useMemo(() => {
    return allBadges.filter(
      (b) =>
        earnedBadgeMap.has(b.id) ||
        earnedBadgeMap.has(b.criteriaKey) ||
        earnedBadgeMap.has(b.name.toLowerCase().trim()),
    ).length;
  }, [allBadges, earnedBadgeMap]);

  const reviewDueCount = reviewDueData?.dueCount ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Header Welcome Section ─────────────────────────────────── */}
      <div className="stagger-item flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            {userLoading ? (
              <span className="inline-block w-48 h-8 bg-border/50 rounded-lg animate-pulse" />
            ) : (
              `Welcome back, ${user?.name || 'Learner'}!`
            )}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track your roadmaps, maintain your daily streak, and master new concepts.
          </p>
        </div>

        <Link
          href="/student/roadmaps"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors duration-150 shadow-sm self-start sm:self-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>Explore Roadmaps</span>
        </Link>
      </div>

      {/* ── 2. Stats Grid (5 Cards) ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total XP */}
        <div className="stagger-item p-5 rounded-2xl bg-surface border border-border shadow-xs flex items-center gap-4 hover:border-accent/40 dark:hover:shadow-[0_0_24px_rgba(99,102,241,0.18)] transition-all duration-200 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-accent-tint text-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Total XP
            </p>
            <p className="text-2xl font-bold font-display text-text-primary mt-0.5">
              {gamificationLoading ? (
                <span className="inline-block w-16 h-7 bg-border/40 rounded animate-pulse" />
              ) : (
                gamification?.totalXp ?? 0
              )}
            </p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="stagger-item p-5 rounded-2xl bg-surface border border-border shadow-xs flex items-center gap-4 hover:border-amber/40 dark:hover:shadow-[0_0_24px_rgba(251,191,36,0.18)] transition-all duration-200 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-amber-tint text-amber flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Current Streak
            </p>
            <p className="text-2xl font-bold font-display text-text-primary mt-0.5">
              {gamificationLoading ? (
                <span className="inline-block w-16 h-7 bg-border/40 rounded animate-pulse" />
              ) : (
                `${gamification?.currentStreak ?? 0} days`
              )}
            </p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="stagger-item p-5 rounded-2xl bg-surface border border-border shadow-xs flex items-center gap-4 hover:border-amber/40 dark:hover:shadow-[0_0_24px_rgba(251,191,36,0.18)] transition-all duration-200 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-amber-tint text-amber flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Longest Streak
            </p>
            <p className="text-2xl font-bold font-display text-text-primary mt-0.5">
              {gamificationLoading ? (
                <span className="inline-block w-16 h-7 bg-border/40 rounded animate-pulse" />
              ) : (
                `${gamification?.longestStreak ?? 0} days`
              )}
            </p>
          </div>
        </div>

        {/* Concepts Completed */}
        <div className="stagger-item p-5 rounded-2xl bg-surface border border-border shadow-xs flex items-center gap-4 hover:border-green/40 dark:hover:shadow-[0_0_24px_rgba(52,211,153,0.18)] transition-all duration-200 cursor-default">
          <div className="w-12 h-12 rounded-xl bg-green-tint text-green flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-bold font-display text-text-primary mt-0.5">
              {progressLoading ? (
                <span className="inline-block w-16 h-7 bg-border/40 rounded animate-pulse" />
              ) : (
                `${completedConceptsCount} concepts`
              )}
            </p>
          </div>
        </div>

        {/* Spaced Reviews Due Card */}
        <Link
          href="/student/review"
          aria-label={`Reviews Due: ${reviewDueCount > 0 ? `${reviewDueCount} reviews due` : 'All caught up'}. Go to review queue.`}
          className={`stagger-item p-5 rounded-2xl bg-surface border shadow-xs flex items-center gap-4 transition-all duration-200 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            reviewDueCount > 0
              ? 'border-amber/50 hover:border-amber dark:hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]'
              : 'border-border hover:border-accent/60 dark:hover:shadow-[0_0_24px_rgba(99,102,241,0.18)]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
              reviewDueCount > 0
                ? 'bg-amber-tint text-amber ring-2 ring-amber/20'
                : 'bg-accent-tint text-accent'
            }`}
          >
            <RotateCcw className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
              Reviews Due
            </p>
            <div className="mt-0.5 flex items-center justify-between gap-1">
              <p className="text-lg font-bold font-display text-text-primary truncate">
                {reviewDueLoading ? (
                  <span className="inline-block w-12 h-6 bg-border/40 rounded animate-pulse" />
                ) : reviewDueCount > 0 ? (
                  <span className="text-amber">
                    {reviewDueCount} due
                  </span>
                ) : (
                  <span className="text-text-secondary text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green" aria-hidden="true" />
                    <span>Caught up</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. Middle Section: Continue Learning & 14-Day Heatmap ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning Banner (2 Cols) */}
        <div className="stagger-item lg:col-span-2 rounded-2xl bg-accent dark:bg-gradient-to-br dark:from-indigo-600 dark:via-indigo-700 dark:to-violet-800 text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Ambient light source inside card */}
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />

          {progressLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-24 h-5 bg-white/20 rounded-full" />
              <div className="w-3/4 h-8 bg-white/20 rounded-lg" />
              <div className="w-1/2 h-4 bg-white/20 rounded" />
            </div>
          ) : mostRecentInProgress ? (
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Continue Learning</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white mt-1">
                {mostRecentInProgress.concept?.title || 'In-Progress Concept'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Pick up right where you left off and keep your momentum going.
              </p>

              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <Link
                  href={`/student/concepts/${mostRecentInProgress.conceptId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-accent dark:text-indigo-700 font-bold text-sm hover:bg-white/95 transition-all shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Resume Concept</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                {mostRecentInProgress.concept?.difficulty && (
                  <span className="px-3 py-1 rounded-lg bg-black/20 text-white/90 text-xs font-medium capitalize">
                    {mostRecentInProgress.concept.difficulty}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Get Started</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white mt-1">
                Start your first learning roadmap
              </h2>
              <p className="text-white/80 text-sm mt-1 max-w-lg">
                Choose a structured curriculum from our catalog and master core concepts step-by-step.
              </p>

              <div className="mt-6">
                <Link
                  href="/student/roadmaps"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-accent dark:text-indigo-700 font-bold text-sm hover:bg-white/95 transition-all shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Browse Roadmaps</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 4. Last 14 Days Activity Heatmap (1 Col) */}
        <div className="stagger-item p-6 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">
                Last 14 Days Activity
              </h3>
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                {gamification?.currentStreak ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber" aria-hidden="true" />
                    <span>{gamification.currentStreak}d Streak</span>
                  </>
                ) : (
                  <span>Daily Streak</span>
                )}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Consistent daily practice drives deeper understanding.
            </p>
          </div>

          <div className="my-5 overflow-x-auto pb-1">
            {activityLoading || progressLoading ? (
              <div className="grid grid-cols-7 gap-2 min-w-[240px] animate-pulse">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-border/40" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 min-w-[240px]">
                {activityHeatmap.map((item) => {
                  let boxStyle = 'bg-bg border border-border text-text-secondary/70';
                  if (item.hasActivity) {
                    boxStyle = 'bg-accent text-white font-bold shadow-xs dark:shadow-lg dark:shadow-accent/30';
                  } else if (item.isToday) {
                    boxStyle = 'bg-accent-tint/50 text-accent font-semibold border border-accent/30 dark:ring-1 dark:ring-accent/50';
                  }

                  return (
                    <div
                      key={item.isoDate}
                      title={`${item.isoDate}: ${item.hasActivity ? 'Active' : 'No activity'}`}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all ${boxStyle}`}
                    >
                      <span>{item.dayNumber}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-2 min-w-[240px]">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-accent inline-block" /> Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-bg border border-border inline-block" /> Inactive
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. Your Roadmaps Section ──────────────────────────────────── */}
      <div className="stagger-item p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-text-primary tracking-tight">
              Your Roadmaps
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Structured learning tracks and curriculum completion rates
            </p>
          </div>

          <Link
            href="/student/roadmaps"
            className="text-xs sm:text-sm font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {roadmapsLoading || roadmapsProgressLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-bg animate-pulse space-y-3"
              >
                <div className="w-1/3 h-5 bg-border/60 rounded" />
                <div className="w-full h-2 bg-border/40 rounded-full" />
              </div>
            ))}
          </div>
        ) : roadmapsError ? (
          <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Unable to load roadmaps. Please refresh the page.</span>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl bg-bg">
            <Layers className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-semibold text-text-primary">
              No roadmaps available yet
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Instructors are currently preparing new roadmaps.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {roadmaps.map((roadmap) => {
              const progress = roadmapsProgressMap[roadmap.id] || {
                totalConcepts: 0,
                completedConceptsCount: 0,
                completionPercentage: 0,
              };

              const completedCount =
                progress.completedConceptsCount ?? (progress as any).completedConcepts ?? 0;
              const totalCount = progress.totalConcepts ?? 0;
              const completionPct =
                progress.completionPercentage ?? (progress as any).percentage ?? 0;

              return (
                <div
                  key={roadmap.id}
                  className="p-4 sm:p-5 rounded-xl border border-border bg-bg/50 hover:bg-surface-hover hover:border-accent/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/roadmaps/${roadmap.id}`}
                        className="font-bold text-text-primary text-sm sm:text-base hover:text-accent transition-colors"
                      >
                        {roadmap.title}
                      </Link>
                    </div>
                    {roadmap.description && (
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {roadmap.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-accent-tint overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, completionPct))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
                        {Math.round(completionPct)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                    <span className="text-xs text-text-secondary font-medium">
                      {completedCount} / {totalCount} concepts
                    </span>
                    <Link
                      href={`/student/roadmaps/${roadmap.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary hover:bg-accent hover:text-white hover:border-accent text-xs font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 6. Badges & Achievements Gallery ──────────────────────────── */}
      <div className="stagger-item p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-text-primary tracking-tight">
              Badges & Achievements
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Earn badges by completing concepts and maintaining consistent streaks
            </p>
          </div>
          <div className="text-xs font-semibold text-accent bg-accent-tint px-3 py-1 rounded-full border border-accent/20">
            {unlockedBadgesCount} of {allBadges.length} unlocked
          </div>
        </div>

        {badgesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl border border-border bg-bg animate-pulse space-y-3 flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-border/60" />
                <div className="w-3/4 h-4 bg-border/50 rounded" />
                <div className="w-1/2 h-3 bg-border/40 rounded" />
              </div>
            ))}
          </div>
        ) : badgesError ? (
          <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Unable to load achievements. Please refresh the page.</span>
          </div>
        ) : allBadges.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-6">
            No system badges configured yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {allBadges.map((badge) => {
              const earnedInfo =
                earnedBadgeMap.get(badge.id) ||
                earnedBadgeMap.get(badge.criteriaKey) ||
                earnedBadgeMap.get(badge.name.toLowerCase().trim());
              const isEarned = Boolean(earnedInfo);
              const badgeImgSrc = getBadgeImage(badge);

              return (
                <div
                  key={badge.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center justify-between group ${
                    isEarned
                      ? 'bg-surface border-amber/40 shadow-xs hover:border-amber/70 dark:bg-amber-500/5 dark:border-amber-500/30 dark:hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]'
                      : 'bg-bg/40 border-border/70 opacity-70 hover:opacity-90 dark:bg-surface/20 dark:border-border/40'
                  }`}
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Badge Icon / Image */}
                    <div className="relative mb-3 flex items-center justify-center">
                      <div
                        className={`w-16 h-18 sm:w-20 sm:h-22 relative transition-all duration-300 flex items-center justify-center ${
                          isEarned
                            ? 'drop-shadow-[0_4px_14px_rgba(245,158,11,0.25)] group-hover:scale-105'
                            : 'grayscale contrast-75 opacity-40 group-hover:opacity-60'
                        }`}
                      >
                        <Image
                          src={badgeImgSrc}
                          alt={badge.name}
                          width={160}
                          height={180}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>

                      {/* Locked Overlay */}
                      {!isEarned && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                          <div className="w-7 h-7 rounded-full bg-surface/90 dark:bg-black/60 border border-border shadow-xs flex items-center justify-center text-text-secondary">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-text-primary tracking-tight">
                      {badge.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 w-full text-center">
                    {isEarned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green dark:text-amber-300">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          Earned{' '}
                          {new Date(earnedInfo!.earnedAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' },
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-secondary/70">
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
