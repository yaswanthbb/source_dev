'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  HelpCircle,
  Send,
  CheckCircle2,
  BookOpen,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User, getUser } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';

interface ConceptSummary {
  id: string;
  title: string;
  authorId: string;
}

interface QaAnswer {
  id: string;
  questionId: string;
  instructorId: string;
  body: string;
  createdAt: string;
  instructor?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface QaQuestion {
  id: string;
  conceptId: string;
  userId: string;
  body: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
  answers?: QaAnswer[];
  conceptTitle?: string;
}

export default function InstructorQaPage() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    initialData: () => getUser() || undefined,
  });

  // 1. Fetch instructor's authored concepts
  const { data: concepts = [], isLoading: conceptsLoading } = useQuery<ConceptSummary[]>({
    queryKey: ['concepts'],
    queryFn: async () => (await apiClient.get<ConceptSummary[]>('/concepts')).data,
  });

  const myConcepts = React.useMemo(() => {
    if (!currentUser?.id) return concepts;
    return concepts.filter((c) => c.authorId === currentUser.id);
  }, [concepts, currentUser]);

  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>('all');

  // 2. Fetch Q&A questions for each authored concept (Client-side N+1 aggregation)
  const targetConceptIds = React.useMemo(() => {
    if (selectedConceptFilter !== 'all') return [selectedConceptFilter];
    return myConcepts.map((c) => c.id);
  }, [selectedConceptFilter, myConcepts]);

  const {
    data: allAggregatedQuestions = [],
    isLoading: questionsLoading,
    refetch,
  } = useQuery<QaQuestion[]>({
    queryKey: ['instructor', 'qa-aggregated', targetConceptIds],
    queryFn: async () => {
      if (targetConceptIds.length === 0) return [];
      const results = await Promise.all(
        targetConceptIds.map(async (cId) => {
          try {
            const conceptObj = myConcepts.find((c) => c.id === cId);
            const res = await apiClient.get<QaQuestion[]>(`/concepts/${cId}/qa-questions`);
            return res.data.map((q) => ({
              ...q,
              conceptTitle: conceptObj?.title || 'Concept',
            }));
          } catch {
            return [];
          }
        }),
      );

      // Sort: Unanswered first, then newest first
      const flat = results.flat();
      return flat.sort((a, b) => {
        const aAnswered = (a.answers?.length || 0) > 0;
        const bAnswered = (b.answers?.length || 0) > 0;

        if (aAnswered !== bAnswered) {
          return aAnswered ? 1 : -1; // Unanswered first
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    enabled: targetConceptIds.length > 0,
  });

  // Filter questions based on filterMode
  const filteredQuestions = React.useMemo(() => {
    return allAggregatedQuestions.filter((q) => {
      const isAnswered = (q.answers?.length || 0) > 0;
      if (filterMode === 'unanswered') return !isAnswered;
      if (filterMode === 'answered') return isAnswered;
      return true;
    });
  }, [allAggregatedQuestions, filterMode]);

  // Answer drafts state
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const { showSuccess, showError } = useSnackbar();

  const handlePostAnswer = async (questionId: string) => {
    const body = answerDrafts[questionId]?.trim();
    if (!body) return;

    setSubmittingIds((prev) => ({ ...prev, [questionId]: true }));
    try {
      await apiClient.post(`/qa-questions/${questionId}/answers`, { body });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
      showSuccess('Answer posted');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['instructor', 'analytics'] });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to post answer. Please try again.');
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const unansweredCount = allAggregatedQuestions.filter(
    (q) => !q.answers || q.answers.length === 0,
  ).length;

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Q&A Instructor Center
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Answer questions asked by students across your authored concepts.
          </p>
        </div>

        {/* Filter by Concept */}
        {myConcepts.length > 0 && (
          <select
            value={selectedConceptFilter}
            onChange={(e) => setSelectedConceptFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus:outline-none focus:border-accent self-start sm:self-auto"
          >
            <option value="all">All Concepts ({myConcepts.length})</option>
            {myConcepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterMode === 'all'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          All Questions ({allAggregatedQuestions.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('unanswered')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterMode === 'unanswered'
              ? 'bg-amber text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Unanswered</span>
          {unansweredCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterMode === 'unanswered' ? 'bg-white/20 text-white' : 'bg-amber-tint text-amber'
              }`}
            >
              {unansweredCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('answered')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterMode === 'answered'
              ? 'bg-green text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          Answered ({allAggregatedQuestions.length - unansweredCount})
        </button>
      </div>

      {/* Questions Threads */}
      {questionsLoading || conceptsLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-surface border border-border h-44" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-dashed border-border rounded-2xl space-y-3 shadow-sm">
          <HelpCircle className="w-12 h-12 text-text-secondary/40 mx-auto" />
          <h3 className="text-base font-bold font-display text-text-primary">
            {filterMode === 'unanswered'
              ? 'All Caught Up!'
              : 'No Questions Found'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {filterMode === 'unanswered'
              ? 'There are no pending unanswered questions on your concepts right now.'
              : 'Questions asked by learners on your concepts will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q) => {
            const hasAnswers = q.answers && q.answers.length > 0;
            const currentDraft = answerDrafts[q.id] || '';
            const isSubmitting = Boolean(submittingIds[q.id]);

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl bg-surface border shadow-xs space-y-5 transition-all ${
                  !hasAnswers ? 'border-amber/40 ring-1 ring-amber/20' : 'border-border'
                }`}
              >
                {/* Header Context Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-accent-tint text-accent font-bold flex items-center justify-center text-xs">
                      {q.user?.name ? q.user.name.charAt(0).toUpperCase() : 'S'}
                    </span>
                    <div>
                      <span className="font-bold text-text-primary">
                        {q.user?.name || 'Student'}
                      </span>
                      <span className="text-text-secondary text-[11px] ml-2">
                        {new Date(q.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {!hasAnswers ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-tint text-amber text-[10px] font-bold uppercase tracking-wider">
                        Pending Answer
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-green-tint text-green text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{q.answers!.length} Answer{q.answers!.length !== 1 ? 's' : ''}</span>
                      </span>
                    )}

                    <Link
                      href={`/student/concepts/${q.conceptId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{q.conceptTitle}</span>
                    </Link>
                  </div>
                </div>

                {/* Question Body */}
                <p className="text-xs sm:text-sm text-text-primary leading-relaxed font-medium">
                  {q.body}
                </p>

                {/* Existing Instructor Answers */}
                {hasAnswers && (
                  <div className="space-y-3 pl-4 border-l-2 border-accent/40 bg-accent-tint/10 p-3.5 rounded-r-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      Verified Responses
                    </span>
                    {q.answers!.map((a) => (
                      <div key={a.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-text-primary">
                            {a.instructor?.name || 'Instructor'}
                          </span>
                          <span className="text-text-secondary text-[10px]">
                            {new Date(a.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed">
                          {a.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write Answer Form */}
                <div className="pt-2 border-t border-border/80 space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    {hasAnswers ? 'Add Another Instructor Response' : 'Write an Answer'}
                  </label>
                  <textarea
                    rows={2}
                    value={currentDraft}
                    onChange={(e) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder="Provide a clear, detailed explanation..."
                    className="w-full p-3 rounded-xl border border-border bg-bg text-xs focus:outline-none focus:border-accent transition-all resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!currentDraft.trim() || isSubmitting}
                      onClick={() => handlePostAnswer(q.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Posting...</span>
                      ) : (
                        <>
                          <span>Submit Answer</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
