"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check,
  PanelLeftClose,
  AlertCircle,
  User as UserIcon,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { User } from "@/lib/auth";
import {
  useRoadmapDetail,
  useRoadmapProgress,
} from "@/lib/hooks/use-roadmap-progress";
import { ProfileActionsMenu } from "./profile-actions-menu";
import { ThemeToggle } from "./theme-toggle";

interface ConceptSyllabusSidebarProps {
  conceptId: string;
  onHideSidebar?: () => void;
  user?: User;
  onOpenLogoutModal?: () => void;
}

interface ConceptDetailSummary {
  id: string;
  title: string;
  appearsIn?: Array<{
    moduleId: string;
    roadmapId: string;
  }>;
}

export function ConceptSyllabusSidebar({
  conceptId,
  onHideSidebar,
  user,
  onOpenLogoutModal,
}: ConceptSyllabusSidebarProps) {
  const searchParams = useSearchParams();
  const urlRoadmapId = searchParams.get("roadmapId");

  // 1. Fetch current concept details to discover which roadmap/module it belongs to
  const { data: concept } = useQuery<ConceptDetailSummary>({
    queryKey: ["concepts", conceptId],
    queryFn: async () =>
      (await apiClient.get<ConceptDetailSummary>(`/concepts/${conceptId}`))
        .data,
  });

  const effectiveRoadmapId =
    urlRoadmapId || concept?.appearsIn?.[0]?.roadmapId || undefined;

  // 2. Fetch full roadmap structure and user's progress
  const { data: roadmap, isLoading: roadmapLoading } =
    useRoadmapDetail(effectiveRoadmapId);
  const { data: roadmapProgress } = useRoadmapProgress(effectiveRoadmapId);

  // Map progress statuses by conceptId
  const progressMap = useMemo(() => {
    const map = new Map<string, string>();
    if (roadmapProgress?.concepts) {
      roadmapProgress.concepts.forEach((c) => {
        map.set(c.conceptId, c.status);
      });
    }
    return map;
  }, [roadmapProgress]);

  // Overall Roadmap Progress Calculation
  const completionPercentage = Math.round(
    roadmapProgress?.completionPercentage ?? 0,
  );

  // Accordion state: which module IDs are expanded
  const [expandedModuleIds, setExpandedModuleIds] = useState<
    Record<string, boolean>
  >({});

  // Auto-expand the module containing the current concept when roadmap loads
  useEffect(() => {
    if (roadmap?.modules) {
      const initialMap: Record<string, boolean> = {};
      roadmap.modules.forEach((mod, idx) => {
        const containsCurrentConcept = mod.moduleConcepts?.some(
          (mc) => mc.concept?.id === conceptId,
        );
        // Expand if it contains current concept, or expand first module by default
        initialMap[mod.id] = containsCurrentConcept || idx === 0;
      });
      setExpandedModuleIds((prev) => ({ ...initialMap, ...prev }));
    }
  }, [roadmap?.modules, conceptId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  return (
    <div className="flex flex-col h-full justify-between bg-surface min-h-screen">
      <div className="flex flex-col">
        {/* Top Header: Back to Course & Collapse Button */}
        <div className="p-6 border-b border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href={
                effectiveRoadmapId
                  ? `/student/roadmaps/${effectiveRoadmapId}`
                  : "/student/roadmaps"
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent transition-colors group cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to course</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              {onHideSidebar && (
                <button
                  type="button"
                  onClick={onHideSidebar}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Hide sidebar"
                  aria-label="Hide sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Course / Roadmap Title */}
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-text-primary leading-snug">
              {roadmap?.title || "Loading Course..."}
            </h2>

            {/* Course Progress Bar */}
            <div className="space-y-1.5 pt-2.5">
              <div className="w-full h-1.5 rounded-full bg-green-tint overflow-hidden">
                <div
                  className="h-full bg-green transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">
                  Course Progress
                </span>
                <span className="font-semibold text-green">
                  {completionPercentage}% complete
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Accordion List */}
        <div className="py-2 overflow-y-auto flex-1 min-h-0">
          {roadmapLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-border/60 rounded w-3/4" />
              <div className="h-4 bg-border/40 rounded w-1/2" />
              <div className="h-5 bg-border/60 rounded w-2/3" />
            </div>
          ) : !roadmap?.modules || roadmap.modules.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-secondary">
              <AlertCircle className="w-6 h-6 text-text-secondary/40 mx-auto mb-2" />
              <span>No modules in this curriculum.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {roadmap.modules.map((moduleItem) => {
                const isExpanded = expandedModuleIds[moduleItem.id] ?? false;
                const conceptsInModule = (moduleItem.moduleConcepts || [])
                  .map((mc) => mc.concept)
                  .filter(Boolean);

                const hasActiveConcept = conceptsInModule.some(
                  (c) => c.id === conceptId,
                );

                return (
                  <div key={moduleItem.id} className="py-2 px-3">
                    {/* Module Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(moduleItem.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-bg transition-colors cursor-pointer group ${
                        hasActiveConcept ? "bg-bg/50" : ""
                      }`}
                    >
                      <span
                        className={`text-xs sm:text-sm font-bold font-display transition-colors truncate pr-2 ${
                          hasActiveConcept
                            ? "text-text-primary"
                            : "text-text-secondary group-hover:text-text-primary"
                        }`}
                      >
                        {moduleItem.title}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      )}
                    </button>

                    {/* Sibling Concepts in Expanded Module */}
                    {isExpanded && (
                      <div className="mt-1 space-y-0.5 pl-1">
                        {conceptsInModule.length === 0 ? (
                          <p className="text-[11px] text-text-secondary italic py-1.5 px-3">
                            No concepts in module.
                          </p>
                        ) : (
                          conceptsInModule.map((item) => {
                            const isCurrent = item.id === conceptId;
                            const status =
                              progressMap.get(item.id) || "not_started";
                            const isCompleted = status === "completed";

                            return (
                              <Link
                                key={item.id}
                                href={`/student/concepts/${item.id}?roadmapId=${effectiveRoadmapId || ""}&moduleId=${moduleItem.id}`}
                                className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-xs transition-all group ${
                                  isCurrent
                                    ? "bg-accent-tint text-accent font-semibold shadow-2xs"
                                    : "text-text-secondary hover:bg-bg hover:text-text-primary font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <BookOpen
                                    className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                                      isCurrent
                                        ? "text-accent"
                                        : "text-text-secondary/70 group-hover:text-text-primary"
                                    }`}
                                  />
                                  <span className="truncate">{item.title}</span>
                                </div>

                                {isCompleted ? (
                                  <div className="w-4 h-4 rounded-full bg-green text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                ) : isCurrent ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                                ) : null}
                              </Link>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer Section (Profile Actions Menu with Integrated Theme Toggle) */}
      <div className="p-4 border-t border-border bg-surface">
        <ProfileActionsMenu
          user={user}
          onOpenLogoutModal={onOpenLogoutModal || (() => {})}
          currentView="student"
        />
      </div>
    </div>
  );
}
