'use client';

import React, { use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Circle,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  useRoadmapDetail,
  useRoadmapProgress,
} from '@/lib/hooks/use-roadmap-progress';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentRoadmapDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roadmapId = resolvedParams.id;

  // 1. Fetch full roadmap structure (modules & concepts)
  const {
    data: roadmap,
    isLoading: roadmapLoading,
    isError: roadmapError,
  } = useRoadmapDetail(roadmapId);

  // 2. Fetch user's roadmap progress & prerequisite checks
  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
  } = useRoadmapProgress(roadmapId);

  // Map progress concept rows by conceptId
  const progressConceptMap = useMemo(() => {
    const map = new Map<
      string,
      {
        status: 'not_started' | 'in_progress' | 'completed';
        unmetPrereqs: string[];
      }
    >();

    if (progress?.concepts) {
      progress.concepts.forEach((c) => {
        const unmet = (c.prerequisites || [])
          .filter((p) => !p.isCompletedByCurrentUser)
          .map((p) => p.title || 'Prerequisite concept');

        map.set(c.conceptId, {
          status: c.status,
          unmetPrereqs: unmet,
        });
      });
    }

    return map;
  }, [progress]);

  // Derived overall completion math
  const totalConcepts = progress?.totalConcepts ?? 0;
  const completedConcepts = progress?.completedConceptsCount ?? 0;
  const completionPercentage = Math.round(progress?.completionPercentage ?? 0);

  const isLoading = roadmapLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl pb-16 animate-pulse">
        <div className="w-28 h-5 bg-border/60 rounded" />
        <div className="p-8 rounded-2xl bg-surface border border-border space-y-4">
          <div className="w-1/2 h-8 bg-border/70 rounded-lg" />
          <div className="w-3/4 h-4 bg-border/40 rounded" />
          <div className="w-full h-3 bg-border/50 rounded-full mt-4" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-surface border border-border space-y-4">
              <div className="w-1/4 h-6 bg-border/60 rounded" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="h-14 rounded-xl bg-border/30" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (roadmapError || !roadmap) {
    return (
      <div className="space-y-6 max-w-3xl py-12">
        <Link
          href="/student/roadmaps"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roadmaps</span>
        </Link>
        <div className="p-8 rounded-2xl bg-surface border border-border text-center">
          <AlertCircle className="w-10 h-10 text-amber mx-auto mb-3" />
          <h2 className="text-lg font-bold font-display text-text-primary">
            Roadmap Not Found
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            The requested curriculum could not be located or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          href="/student/roadmaps"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Roadmaps</span>
        </Link>
      </div>

      {/* Roadmap Overview Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Learning Roadmap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            {roadmap.title}
          </h1>
          {roadmap.description && (
            <p className="text-text-secondary text-sm sm:text-base mt-2 leading-relaxed max-w-2xl">
              {roadmap.description}
            </p>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="pt-2 border-t border-border/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="text-text-primary">
              {completedConcepts} of {totalConcepts} concepts complete
            </span>
            <span className="text-accent">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-accent-tint overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Modules & Concept Path */}
      <div className="space-y-6">
        {(!roadmap.modules || roadmap.modules.length === 0) ? (
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-2xl">
            <p className="text-sm font-semibold text-text-primary">
              No modules attached to this roadmap yet.
            </p>
          </div>
        ) : (
          roadmap.modules.map((moduleItem) => {
            const conceptsInModule = (moduleItem.moduleConcepts || [])
              .map((mc) => mc.concept)
              .filter(Boolean);

            return (
              <div
                key={moduleItem.id}
                className="p-6 sm:p-7 rounded-2xl bg-surface border border-border shadow-xs space-y-2"
              >
                {/* Module Heading */}
                <div className="border-b border-border pb-4">
                  <h2 className="text-base sm:text-lg font-bold font-display text-text-primary">
                    {moduleItem.title}
                  </h2>
                  {moduleItem.description && (
                    <p className="text-xs text-text-secondary mt-1">
                      {moduleItem.description}
                    </p>
                  )}
                </div>

                {/* Concepts List (Matching Reference Design) */}
                {conceptsInModule.length === 0 ? (
                  <p className="text-xs text-text-secondary italic py-3">
                    No concepts in this module yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {conceptsInModule.map((concept) => {
                      const conceptProgress = progressConceptMap.get(concept.id);
                      const status = conceptProgress?.status || 'not_started';
                      const isCompleted = status === 'completed';
                      const isInProgress = status === 'in_progress';

                      return (
                        <Link
                          key={concept.id}
                          href={`/student/concepts/${concept.id}?roadmapId=${roadmapId}&moduleId=${moduleItem.id}`}
                          className="flex items-center justify-between py-3.5 px-3 -mx-3 rounded-xl hover:bg-bg transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-4">
                            <BookOpen className="w-5 h-5 text-text-secondary/70 group-hover:text-accent transition-colors flex-shrink-0 stroke-[1.75]" />
                            <span className="text-sm sm:text-base font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                              {concept.title}
                            </span>
                          </div>

                          {/* Completion / Status Check Circle */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-full bg-[#0F8C52] text-white flex items-center justify-center shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : isInProgress ? (
                              <div className="w-6 h-6 rounded-full border-2 border-accent bg-accent-tint/60 flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-accent" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-border group-hover:border-text-secondary/50 transition-colors" />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
