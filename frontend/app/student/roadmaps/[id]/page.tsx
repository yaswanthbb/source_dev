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
          roadmap.modules.map((moduleItem, modIdx) => {
            const conceptsInModule = (moduleItem.moduleConcepts || [])
              .map((mc) => mc.concept)
              .filter(Boolean);

            // Determine "Current" Concept in this module:
            // First concept whose status is NOT 'completed',
            // preferring one with 'in_progress' if any exists, otherwise first 'not_started'
            const inProgressConcept = conceptsInModule.find((c) => {
              const status = progressConceptMap.get(c.id)?.status;
              return status === 'in_progress';
            });

            const currentConceptId =
              inProgressConcept?.id ||
              conceptsInModule.find((c) => {
                const status = progressConceptMap.get(c.id)?.status;
                return status !== 'completed';
              })?.id;

            return (
              <div
                key={moduleItem.id}
                className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6"
              >
                {/* Module Heading */}
                <div className="border-b border-border/80 pb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Module {modIdx + 1}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-display text-text-primary mt-0.5">
                    {moduleItem.title}
                  </h2>
                  {moduleItem.description && (
                    <p className="text-xs text-text-secondary mt-1">
                      {moduleItem.description}
                    </p>
                  )}
                </div>

                {/* Connected Vertical Concept Path */}
                {conceptsInModule.length === 0 ? (
                  <p className="text-xs text-text-secondary italic py-2">
                    No concepts in this module yet.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4">
                    {/* Vertical connecting line */}
                    <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-border -z-0" />

                    {conceptsInModule.map((concept, cIdx) => {
                      const conceptProgress = progressConceptMap.get(concept.id);
                      const status =
                        conceptProgress?.status || 'not_started';
                      const unmetPrereqs =
                        conceptProgress?.unmetPrereqs || [];

                      const isCompleted = status === 'completed';
                      const isCurrent = concept.id === currentConceptId;

                      // Dot marker calculation
                      // 1. Filled accent dot: completed
                      // 2. Accent-ringed dot: current
                      // 3. Gray-ringed dot: other not started
                      return (
                        <div key={concept.id} className="relative z-10">
                          {/* Dot Marker */}
                          <div
                            className={`absolute -left-[24px] top-4 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-accent text-white shadow-xs'
                                : isCurrent
                                ? 'border-2 border-accent bg-surface ring-4 ring-accent/15'
                                : 'border-2 border-border bg-bg text-text-secondary/40'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-accent" />
                            ) : (
                              <Circle className="w-2.5 h-2.5 fill-current opacity-30" />
                            )}
                          </div>

                          {/* Concept Row Card */}
                          <Link
                            href={`/student/concepts/${concept.id}?roadmapId=${roadmapId}&moduleId=${moduleItem.id}`}
                            className={`block p-4 sm:p-5 rounded-xl border transition-all hover:border-accent/40 group ${
                              isCurrent
                                ? 'bg-accent-tint/30 border-accent/30 shadow-xs'
                                : 'bg-bg border-border'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                                    {concept.title}
                                  </h3>
                                </div>

                                {/* Difficulty & Informational Prerequisite Note */}
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  {concept.difficulty && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                                        concept.difficulty === 'easy'
                                          ? 'bg-green-tint text-green'
                                          : concept.difficulty === 'medium'
                                          ? 'bg-amber-tint text-amber'
                                          : 'bg-accent-tint text-accent'
                                      }`}
                                    >
                                      {concept.difficulty}
                                    </span>
                                  )}

                                  {unmetPrereqs.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber font-medium bg-amber-tint/80 px-2 py-0.5 rounded-md">
                                      <Info className="w-3 h-3 flex-shrink-0" />
                                      <span>
                                        Recommended first: {unmetPrereqs[0]}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Status Badge & Arrow */}
                              <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 ${
                                    isCompleted
                                      ? 'bg-green-tint text-green'
                                      : status === 'in_progress'
                                      ? 'bg-accent-tint text-accent'
                                      : 'bg-surface border border-border text-text-secondary'
                                  }`}
                                >
                                  {isCompleted && (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  {status === 'in_progress' && (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                  <span>{status.replace('_', ' ')}</span>
                                </span>

                                <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </Link>
                        </div>
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
