'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Map, ArrowRight, Layers, BookOpen, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAllRoadmapsProgress } from '@/lib/hooks/use-roadmap-progress';

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
    }>;
  }>;
}

export default function StudentRoadmapsBrowsePage() {
  // Fetch all roadmaps
  const {
    data: roadmaps = [],
    isLoading: roadmapsLoading,
    isError: roadmapsError,
  } = useQuery<Roadmap[]>({
    queryKey: ['roadmaps'],
    queryFn: async () => (await apiClient.get<Roadmap[]>('/roadmaps')).data,
  });

  // Reusable bulk progress hook
  const roadmapIds = React.useMemo(() => roadmaps.map((r) => r.id), [roadmaps]);
  const { data: progressMap = {}, isLoading: progressLoading } =
    useAllRoadmapsProgress(roadmapIds);

  const isLoading = roadmapsLoading || (roadmaps.length > 0 && progressLoading);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          Roadmaps
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Structured learning paths to guide your journey from fundamentals to mastery.
        </p>
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-surface border border-border animate-pulse space-y-4 flex flex-col justify-between h-64"
            >
              <div className="space-y-3">
                <div className="w-1/3 h-4 bg-border/60 rounded" />
                <div className="w-3/4 h-6 bg-border/70 rounded-lg" />
                <div className="w-full h-12 bg-border/40 rounded" />
              </div>
              <div className="pt-4 border-t border-border space-y-3">
                <div className="w-1/2 h-3 bg-border/50 rounded" />
                <div className="w-full h-9 bg-border/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : roadmapsError ? (
        <div className="p-6 rounded-2xl bg-amber-tint border border-amber/30 text-amber text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Failed to load roadmaps. Please check your connection and refresh.</span>
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-dashed border-border rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 opacity-70" />
          </div>
          <h2 className="text-lg font-bold font-display text-text-primary">
            No Roadmaps Available Yet
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto mt-1.5 leading-relaxed">
            Instructors are currently authoring new learning tracks. Check back soon for updated curricula!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {roadmaps.map((roadmap) => {
            const progress = progressMap[roadmap.id] || {
              totalConcepts: 0,
              completedConceptsCount: 0,
              completionPercentage: 0,
            };

            const percentage = Math.round(progress.completionPercentage || 0);
            const totalConcepts = progress.totalConcepts ?? 0;
            const moduleCount =
              roadmap.modules?.length ?? roadmap.moduleCount ?? 0;

            const isStarted = percentage > 0;

            return (
              <div
                key={roadmap.id}
                className="p-6 rounded-2xl bg-surface border border-border hover:border-accent/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Curriculum</span>
                  </div>

                  <h2 className="text-lg font-bold font-display text-text-primary tracking-tight group-hover:text-accent transition-colors">
                    <Link href={`/student/roadmaps/${roadmap.id}`}>
                      {roadmap.title}
                    </Link>
                  </h2>

                  {roadmap.description ? (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-3 leading-relaxed">
                      {roadmap.description}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary/70 italic mt-2">
                      No description provided for this roadmap.
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-border/80 space-y-4">
                  {/* Meta Line */}
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-text-secondary/80" />
                      <span>
                        {totalConcepts} concepts · {moduleCount} modules
                      </span>
                    </span>
                    {isStarted && (
                      <span className="font-semibold text-text-primary">
                        {percentage}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (only if percentage > 0) */}
                  {isStarted && (
                    <div className="w-full h-2 rounded-full bg-accent-tint overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/student/roadmaps/${roadmap.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isStarted
                        ? 'bg-accent text-white hover:bg-accent/90 shadow-xs'
                        : 'bg-accent-tint text-accent hover:bg-accent-tint/80'
                    }`}
                  >
                    <span>{isStarted ? `Continue · ${percentage}%` : 'Start roadmap'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
