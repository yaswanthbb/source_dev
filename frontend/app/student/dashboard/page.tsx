'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
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
  Award,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User } from '@/lib/auth';
import {
  useAllRoadmapsProgress,
  RoadmapProgressData,
} from '@/lib/hooks/use-roadmap-progress';

// Types matching backend models
interface GamificationData {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  userBadges: Array<{
    userId: string;
    badgeId: string;
    earnedAt: string;
    badge: Badge;
  }>;
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

interface RoadmapProgress {
  roadmapId: string;
  title: string;
  totalConcepts: number;
  completedConceptsCount: number;
  completionPercentage: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  criteriaKey: string;
}

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

  // 5. Progress per Roadmap (using normalized bulk progress hook)
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

  // Derived Calculations
  // Total Concepts Completed
  const completedConceptsCount = useMemo(() => {
    return progressList.filter((p) => p.status === 'completed').length;
  }, [progressList]);

  // Most recently updated in_progress concept
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

  // Last 14 Days Activity Heatmap
  const activityHeatmap = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build completion map by UTC/Local YYYY-MM-DD
    const completionDateMap = new Map<string, number>();
    progressList.forEach((p) => {
      if (p.status === 'completed' && p.completedAt) {
        const dateStr = p.completedAt.slice(0, 10);
        completionDateMap.set(
          dateStr,
          (completionDateMap.get(dateStr) || 0) + 1,
        );
      }
    });

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoStr = d.toISOString().slice(0, 10);
      const count = completionDateMap.get(isoStr) || 0;

      days.push({
        date: d,
        isoDate: isoStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        hasActivity: count > 0,
        count,
        isToday: i === 0,
      });
    }

    return days;
  }, [progressList]);

  // Set of Earned Badge IDs
  const earnedBadgeMap = useMemo(() => {
    const map = new Map<string, { earnedAt: string }>();
    if (gamification?.userBadges) {
      gamification.userBadges.forEach((ub) => {
        map.set(ub.badgeId, { earnedAt: ub.earnedAt });
      });
    }
    return map;
  }, [gamification]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explore Roadmaps</span>
        </Link>
      </div>

      {/* 2. Stats Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total XP */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-tint text-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
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
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-tint text-amber flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6" />
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
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-tint text-amber flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" />
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
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-tint text-green flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
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
      </div>

      {/* 3. Middle Section: Continue Learning & 14-Day Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning Banner (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-accent text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {progressLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-24 h-5 bg-white/20 rounded-full" />
              <div className="w-3/4 h-8 bg-white/20 rounded-lg" />
              <div className="w-1/2 h-4 bg-white/20 rounded" />
            </div>
          ) : mostRecentInProgress ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>Continue Learning</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white mt-1">
                {mostRecentInProgress.concept?.title || 'In-Progress Concept'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Pick up right where you left off and keep your momentum going.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/student/concepts/${mostRecentInProgress.conceptId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/95 transition-all shadow-sm cursor-pointer"
                >
                  <span>Resume Concept</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {mostRecentInProgress.concept?.difficulty && (
                  <span className="px-3 py-1 rounded-lg bg-black/20 text-white/90 text-xs font-medium capitalize">
                    {mostRecentInProgress.concept.difficulty}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Sparkles className="w-3.5 h-3.5" />
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-accent font-semibold text-sm hover:bg-white/95 transition-all shadow-sm cursor-pointer"
                >
                  <span>Browse Roadmaps</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 4. Last 14 Days Activity Heatmap (1 Col) */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">
                Last 14 Days Activity
              </h3>
              <span className="text-xs text-text-secondary font-medium">
                {gamification?.currentStreak ? `${gamification.currentStreak}d Streak 🔥` : 'Daily Streak'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Consistent daily practice drives deeper understanding.
            </p>
          </div>

          <div className="my-5">
            {progressLoading ? (
              <div className="grid grid-cols-7 gap-2 animate-pulse">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-border/40" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {activityHeatmap.map((item) => (
                  <div
                    key={item.isoDate}
                    title={`${item.isoDate}: ${item.count} concept(s) completed`}
                    className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold transition-all ${
                      item.hasActivity
                        ? 'bg-accent text-white shadow-xs'
                        : 'bg-bg border border-border text-text-secondary/70'
                    } ${item.isToday ? 'ring-2 ring-accent ring-offset-1' : ''}`}
                  >
                    <span>{item.dayNumber}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-2">
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

      {/* 5. Your Roadmaps Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm">
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
            className="text-xs sm:text-sm font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Unable to load roadmaps. Please refresh the page.</span>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl bg-bg">
            <Layers className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
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
                progress.completedConceptsCount ?? progress.completedConcepts ?? 0;
              const totalCount = progress.totalConcepts ?? 0;
              const completionPct =
                progress.completionPercentage ?? progress.percentage ?? 0;

              return (
                <div
                  key={roadmap.id}
                  className="p-4 sm:p-5 rounded-xl border border-border bg-bg hover:border-accent/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
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
                      className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary hover:bg-accent hover:text-white hover:border-accent text-xs font-semibold transition-all cursor-pointer"
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

      {/* 6. Badges & Achievements Gallery */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-text-primary tracking-tight">
              Badges & Achievements
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Earn badges by completing concepts and maintaining consistent streaks
            </p>
          </div>
          <div className="text-xs font-semibold text-text-secondary">
            {earnedBadgeMap.size} of {allBadges.length} unlocked
          </div>
        </div>

        {badgesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-bg animate-pulse space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-border/60 mx-auto" />
                <div className="w-3/4 h-4 bg-border/50 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : badgesError ? (
          <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Unable to load achievements. Please refresh the page.</span>
          </div>
        ) : allBadges.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-6">
            No system badges configured yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allBadges.map((badge) => {
              const earnedInfo = earnedBadgeMap.get(badge.id);
              const isEarned = Boolean(earnedInfo);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center justify-between ${
                    isEarned
                      ? 'bg-surface border-amber/40 shadow-xs'
                      : 'bg-bg/60 border-border/80 opacity-60'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                        isEarned
                          ? 'bg-amber-tint text-amber shadow-xs'
                          : 'bg-border/60 text-text-secondary/60'
                      }`}
                    >
                      {isEarned ? (
                        <Award className="w-6 h-6" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-text-primary">
                      {badge.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 w-full text-center">
                    {isEarned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Earned{' '}
                          {new Date(earnedInfo!.earnedAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' },
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-text-secondary/70">
                        Locked
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
