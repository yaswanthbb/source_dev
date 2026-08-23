'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  BookOpen,
  MessageSquare,
  Users,
  Plus,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User, getUser } from '@/lib/auth';

interface InstructorOverview {
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
  studentsEngaged: number;
}

interface InstructorConceptMetric {
  conceptId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completionCount: number;
  startedButNotCompletedCount: number;
}

interface InstructorQuizQuestionMetric {
  questionId: string;
  questionText: string;
  conceptTitle: string;
  totalAttempts: number;
  correctRate: number;
  mostMissedOption: {
    optionText: string;
    selectedCount: number;
  } | null;
}

export default function InstructorDashboardPage() {
  const { data: currentUser } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    initialData: () => getUser() || undefined,
  });

  // 1. Overview Analytics
  const {
    data: overview,
    isLoading: overviewLoading,
  } = useQuery<InstructorOverview>({
    queryKey: ['instructor', 'analytics', 'overview'],
    queryFn: async () =>
      (await apiClient.get<InstructorOverview>('/instructor/my-analytics/overview')).data,
  });

  // 2. Concepts Performance Breakdown
  const {
    data: concepts = [],
    isLoading: conceptsLoading,
  } = useQuery<InstructorConceptMetric[]>({
    queryKey: ['instructor', 'analytics', 'concepts'],
    queryFn: async () =>
      (await apiClient.get<InstructorConceptMetric[]>('/instructor/my-analytics/concepts')).data,
  });

  // 3. Quiz Questions Diagnostic
  const {
    data: quizQuestions = [],
    isLoading: quizLoading,
  } = useQuery<InstructorQuizQuestionMetric[]>({
    queryKey: ['instructor', 'analytics', 'quiz-questions'],
    queryFn: async () =>
      (
        await apiClient.get<InstructorQuizQuestionMetric[]>(
          '/instructor/my-analytics/quiz-questions',
        )
      ).data,
  });

  const firstName = currentUser?.name?.split(' ')[0] || 'Instructor';

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instructor Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Monitor curriculum engagement, student progression, and quiz diagnostics.
          </p>
        </div>

        <Link
          href="/instructor/content/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Roadmap</span>
        </Link>
      </div>

      {/* Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Roadmaps Created */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Roadmaps
            </span>
            <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.roadmapsCreated ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Published learning paths</p>
        </div>

        {/* Concepts Authored */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Concepts Authored
            </span>
            <div className="w-9 h-9 rounded-xl bg-green-tint text-green flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.conceptsAuthored ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Articles & tutorials</p>
        </div>

        {/* Questions Answered */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Q&A Answered
            </span>
            <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>

          </div>
          <div className="text-3xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.questionsAnswered ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Student doubts resolved</p>
        </div>

        {/* Students Engaged */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Students Engaged
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-tint text-amber flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-text-primary">
            {overviewLoading ? '...' : overview?.studentsEngaged ?? 0}
          </div>
          <p className="text-[11px] text-text-secondary mt-1">Active learners on your content</p>
        </div>
      </div>

      {/* 2-Column Section: Concepts Breakdown & Quiz Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Concepts Performance Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold font-display text-text-primary">
                Your Concepts Performance
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Sorted by highest student completions
              </p>
            </div>
            <Link
              href="/instructor/content"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {conceptsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-border/40 rounded-xl" />
              ))}
            </div>
          ) : concepts.length === 0 ? (
            <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl space-y-2">
              <BookOpen className="w-8 h-8 text-text-secondary/50 mx-auto" />
              <p className="text-xs font-semibold text-text-primary">No student progress recorded yet</p>
              <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                Once students start and complete your authored concepts, their metrics will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-semibold">
                    <th className="pb-3 font-semibold">Concept</th>
                    <th className="pb-3 font-semibold">Difficulty</th>
                    <th className="pb-3 text-right font-semibold">Completed</th>
                    <th className="pb-3 text-right font-semibold">In Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {concepts.map((concept) => (
                    <tr key={concept.conceptId} className="hover:bg-bg/50 transition-colors">
                      <td className="py-3.5 pr-3 font-medium text-text-primary">
                        <Link
                          href={`/instructor/concepts/${concept.conceptId}/edit`}
                          className="hover:text-accent transition-colors block truncate max-w-[200px]"
                          title={concept.title}
                        >
                          {concept.title}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-3">
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
                      </td>
                      <td className="py-3.5 pr-3 text-right font-semibold text-green">
                        {concept.completionCount}
                      </td>
                      <td className="py-3.5 text-right font-medium text-text-secondary">
                        {concept.startedButNotCompletedCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Quiz Questions Diagnostic Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-text-primary">
                  Quiz Questions Needing Attention
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Questions with lowest accuracy rates and top student distractors
              </p>
            </div>
          </div>

          {quizLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-border/40 rounded-xl" />
              ))}
            </div>
          ) : quizQuestions.length === 0 ? (
            <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl space-y-2">
              <HelpCircle className="w-8 h-8 text-text-secondary/50 mx-auto" />
              <p className="text-xs font-semibold text-text-primary">No quiz attempts yet</p>
              <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                Student attempt accuracy and most-missed options will display here after learners take your quizzes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizQuestions.map((q) => (
                <div
                  key={q.questionId}
                  className="p-4 rounded-xl border border-border bg-bg space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary truncate">
                        Concept: {q.conceptTitle}
                      </p>
                      <h4 className="text-xs font-bold text-text-primary line-clamp-2">
                        {q.questionText}
                      </h4>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          q.correctRate < 50
                            ? 'bg-red-tint text-red border border-red/30'
                            : q.correctRate < 75
                            ? 'bg-amber-tint text-amber'
                            : 'bg-green-tint text-green'
                        }`}
                      >
                        {q.correctRate}% Correct
                      </span>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {q.totalAttempts} total attempt{q.totalAttempts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Most Missed Distractor signal */}
                  {q.mostMissedOption && (
                    <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber font-medium truncate max-w-[80%]">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          Top distractor: &ldquo;{q.mostMissedOption.optionText}&rdquo;
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary flex-shrink-0 font-medium">
                        Picked {q.mostMissedOption.selectedCount}x
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
