'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  Layers,
  Activity,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface OverviewAnalytics {
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalRoadmaps: number;
  totalModules: number;
  totalConcepts: number;
  totalConceptCompletions: number;
  activeStudents: number;
  totalXpAwarded: number;
}

interface RoadmapAnalytics {
  roadmapId: string;
  title: string;
  totalConcepts: number;
  totalEnrolledStudents: number;
  averageCompletionPercentage: number;
  totalCompletedConcepts: number;
}

interface ConceptAnalytics {
  conceptId: string;
  title: string;
  difficulty: string;
  completionCount: number;
  startedButNotCompletedCount: number;
}

interface InstructorAnalytics {
  instructorId: string;
  name: string;
  email: string;
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
}

export default function AdminDashboardPage() {
  // 1. Overview
  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewAnalytics>({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: async () => (await apiClient.get<OverviewAnalytics>('/admin/analytics/overview')).data,
  });

  // 2. Roadmaps Analytics
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useQuery<RoadmapAnalytics[]>({
    queryKey: ['admin', 'analytics', 'roadmaps'],
    queryFn: async () => (await apiClient.get<RoadmapAnalytics[]>('/admin/analytics/roadmaps')).data,
  });

  // 3. Concepts Analytics
  const { data: concepts = [], isLoading: conceptsLoading } = useQuery<ConceptAnalytics[]>({
    queryKey: ['admin', 'analytics', 'concepts'],
    queryFn: async () => (await apiClient.get<ConceptAnalytics[]>('/admin/analytics/concepts')).data,
  });

  // 4. Instructors Analytics
  const { data: instructors = [], isLoading: instructorsLoading } = useQuery<InstructorAnalytics[]>({
    queryKey: ['admin', 'analytics', 'instructors'],
    queryFn: async () => (await apiClient.get<InstructorAnalytics[]>('/admin/analytics/instructors')).data,
  });

  const topConcepts = concepts.slice(0, 10);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>System Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          Platform Overview
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Real-time metrics, curriculum adoption, student completion velocity, and faculty activity.
        </p>
      </div>

      {/* Top Stats Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.totalStudents ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Registered learners</p>
        </div>

        {/* Total Instructors */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Instructors
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.totalInstructors ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Approved educators</p>
        </div>

        {/* Total Roadmaps */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Roadmaps
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.totalRoadmaps ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Published paths</p>
        </div>

        {/* Active Students */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              7d Active
            </span>
            <div className="w-8 h-8 rounded-xl bg-green-tint text-green flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.activeStudents ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Active learners this week</p>
        </div>

        {/* Total XP Awarded */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Total XP
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-tint text-amber flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : (overview?.totalXpAwarded ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Gamification points</p>
        </div>
      </div>

      {/* Grid: Roadmaps & Top Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roadmaps Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold font-display text-text-primary">
                Roadmap Enrolment & Completion
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Curriculum engagement across all published paths
              </p>
            </div>
          </div>

          {roadmapsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-bg border border-border rounded-xl" />
              ))}
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-secondary">No roadmaps available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-semibold">
                    <th className="pb-3 font-semibold">Roadmap</th>
                    <th className="pb-3 text-center font-semibold">Concepts</th>
                    <th className="pb-3 text-center font-semibold">Enrolled</th>
                    <th className="pb-3 text-right font-semibold">Avg. Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {roadmaps.map((r) => (
                    <tr key={r.roadmapId} className="hover:bg-bg/50 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-text-primary">
                        <Link
                          href={`/student/roadmaps/${r.roadmapId}`}
                          target="_blank"
                          className="hover:text-accent transition-colors block truncate max-w-[180px]"
                          title={r.title}
                        >
                          {r.title}
                        </Link>
                      </td>
                      <td className="py-3.5 text-center text-text-secondary">
                        {r.totalConcepts}
                      </td>
                      <td className="py-3.5 text-center font-semibold text-text-primary">
                        {r.totalEnrolledStudents}
                      </td>
                      <td className="py-3.5 text-right font-bold text-accent">
                        {r.averageCompletionPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Concepts Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold font-display text-text-primary">
                Top Completed Concepts
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Most mastered topics across the student body
              </p>
            </div>
          </div>

          {conceptsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-bg border border-border rounded-xl" />
              ))}
            </div>
          ) : topConcepts.length === 0 ? (
            <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-secondary">No concept completions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-semibold">
                    <th className="pb-3 font-semibold">Concept</th>
                    <th className="pb-3 font-semibold">Difficulty</th>
                    <th className="pb-3 text-right font-semibold">Completions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topConcepts.map((c) => (
                    <tr key={c.conceptId} className="hover:bg-bg/50 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-text-primary">
                        <Link
                          href={`/student/concepts/${c.conceptId}`}
                          target="_blank"
                          className="hover:text-accent transition-colors block truncate max-w-[220px]"
                          title={c.title}
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.difficulty === 'easy'
                              ? 'bg-green-tint text-green'
                              : c.difficulty === 'medium'
                              ? 'bg-amber-tint text-amber'
                              : 'bg-accent-tint text-accent'
                          }`}
                        >
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-green">
                        {c.completionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Instructors Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-text-primary">
              Instructor Activity & Contributions
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Content authoring and community support metrics per faculty member
            </p>
          </div>
          <Link
            href="/admin/instructors"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <span>Approval Queue</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {instructorsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-bg border border-border rounded-xl" />
            ))}
          </div>
        ) : instructors.length === 0 ? (
          <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl">
            <p className="text-xs text-text-secondary">No approved instructors found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary font-semibold">
                  <th className="pb-3 font-semibold">Instructor</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 text-center font-semibold">Roadmaps</th>
                  <th className="pb-3 text-center font-semibold">Concepts</th>
                  <th className="pb-3 text-center font-semibold">Q&A Answered</th>
                  <th className="pb-3 text-center font-semibold">MCQs Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {instructors.map((inst) => (
                  <tr key={inst.instructorId} className="hover:bg-bg/50 transition-colors">
                    <td className="py-3.5 pr-2 font-bold text-text-primary">
                      {inst.name}
                    </td>
                    <td className="py-3.5 pr-2 text-text-secondary font-mono text-[11px]">
                      {inst.email}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-text-primary">
                      {inst.roadmapsCreated}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-text-primary">
                      {inst.conceptsAuthored}
                    </td>
                    <td className="py-3.5 text-center font-bold text-accent">
                      {inst.questionsAnswered}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-text-primary">
                      {inst.mcqQuestionsCreated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
