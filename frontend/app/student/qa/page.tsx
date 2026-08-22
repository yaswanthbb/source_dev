'use client';

import React, { useState, useMemo } from 'react';
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
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  ChevronDown,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import apiClient from '@/lib/api-client';

import { User, getUser } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';

interface ConceptSummary {
  id: string;
  title: string;
  slug?: string;
}

interface QaAnswer {
  id: string;
  questionId: string;
  instructorId: string;
  instructorName?: string | null;
  isAiAnswer?: boolean;
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
  studentId?: string;
  userId?: string;
  studentName?: string | null;
  body: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
  };
  student?: {
    id: string;
    name: string;
  };
  answers?: QaAnswer[];
  conceptTitle?: string;
}

export default function StudentQaPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // 1. Current User
  const { data: currentUser } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    initialData: () => getUser() || undefined,
  });

  // 2. Fetch all concepts for selection & titles
  const { data: concepts = [], isLoading: conceptsLoading } = useQuery<ConceptSummary[]>({
    queryKey: ['concepts'],
    queryFn: async () => (await apiClient.get<ConceptSummary[]>('/concepts')).data,
  });

  // Filters & Search State
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'answered' | 'unanswered'>('all');
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ask Question Drawer / Form State
  const [isAskModalOpen, setIsAskModalOpen] = useState<boolean>(false);
  const [askConceptId, setAskConceptId] = useState<string>('');
  const [askQuestionBody, setAskQuestionBody] = useState<string>('');
  const [askTarget, setAskTarget] = useState<'instructor' | 'ai'>('ai');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState<boolean>(false);


  // Edit Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Delete Confirm Modal State
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState<boolean>(false);

  // 3. Fetch Q&A questions across concepts
  const targetConceptIds = useMemo(() => {
    if (selectedConceptFilter !== 'all') return [selectedConceptFilter];
    return concepts.map((c) => c.id);
  }, [selectedConceptFilter, concepts]);

  const {
    data: allQuestions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useQuery<QaQuestion[]>({
    queryKey: ['student', 'qa-aggregated', targetConceptIds],
    queryFn: async () => {
      if (targetConceptIds.length === 0) return [];
      const results = await Promise.all(
        targetConceptIds.map(async (cId) => {
          try {
            const conceptObj = concepts.find((c) => c.id === cId);
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

      const flat = results.flat();
      return flat.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    enabled: targetConceptIds.length > 0,
  });

  // Filter & Search Logic
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const isAnswered = (q.answers?.length || 0) > 0;
      const isMine =
        Boolean(currentUser?.id) &&
        (q.studentId === currentUser?.id || q.userId === currentUser?.id);

      // Filter Mode
      if (filterMode === 'mine' && !isMine) return false;
      if (filterMode === 'answered' && !isAnswered) return false;
      if (filterMode === 'unanswered' && isAnswered) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const bodyMatch = q.body.toLowerCase().includes(query);
        const conceptMatch = q.conceptTitle?.toLowerCase().includes(query);
        const askerMatch =
          q.studentName?.toLowerCase().includes(query) ||
          q.user?.name?.toLowerCase().includes(query) ||
          q.student?.name?.toLowerCase().includes(query);
        const answerMatch = q.answers?.some(
          (a) =>
            a.body.toLowerCase().includes(query) ||
            a.instructorName?.toLowerCase().includes(query) ||
            a.instructor?.name?.toLowerCase().includes(query),
        );
        return bodyMatch || conceptMatch || askerMatch || answerMatch;
      }

      return true;
    });
  }, [allQuestions, filterMode, searchQuery, currentUser]);

  // Counts
  const myQuestionsCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return allQuestions.filter(
      (q) => q.studentId === currentUser.id || q.userId === currentUser.id,
    ).length;
  }, [allQuestions, currentUser]);

  const answeredCount = useMemo(() => {
    return allQuestions.filter((q) => (q.answers?.length || 0) > 0).length;
  }, [allQuestions]);

  const unansweredCount = useMemo(() => {
    return allQuestions.filter((q) => !q.answers || q.answers.length === 0).length;
  }, [allQuestions]);

  // Handle Post New Question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askConceptId) {
      showError('Please select a concept for your question.');
      return;
    }
    if (!askQuestionBody.trim()) {
      showError('Please enter your question.');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      await apiClient.post(`/concepts/${askConceptId}/qa-questions`, {
        body: askQuestionBody.trim(),
        target: askTarget,
      });
      showSuccess(
        askTarget === 'ai'
          ? 'Your question has been answered by AI!'
          : 'Your question has been posted to instructors!',
      );
      setAskQuestionBody('');
      setAskConceptId('');
      setIsAskModalOpen(false);
      refetchQuestions();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to post question. Please try again.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };


  // Handle Save Edit
  const handleSaveEdit = async (questionId: string) => {
    if (!editBody.trim()) return;

    setIsSubmittingEdit(true);
    try {
      await apiClient.patch(`/qa-questions/${questionId}`, {
        body: editBody.trim(),
      });
      showSuccess('Question updated successfully.');
      setEditingQuestionId(null);
      setEditBody('');
      refetchQuestions();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to update question.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Question
  const handleDeleteConfirm = async () => {
    if (!deleteQuestionId) return;

    setIsDeletingQuestion(true);
    try {
      await apiClient.delete(`/qa-questions/${deleteQuestionId}`);
      showSuccess('Question deleted.');
      setDeleteQuestionId(null);
      refetchQuestions();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete question.');
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Discussions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Q&A Discussions Hub
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Ask questions on any concept and get verified answers from instructors.
          </p>
        </div>

        {/* Primary Action: Ask Question Button */}
        <button
          type="button"
          onClick={() => setIsAskModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* 2. Quick Question Form (Collapsible Card or Modal) */}
      {isAskModalOpen && (
        <div className="p-6 rounded-2xl bg-surface border border-accent/30 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary font-display">
                Ask a New Question
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAskModalOpen(false);
                setAskQuestionBody('');
              }}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAskQuestion} className="space-y-3">
            {/* Target Choice Segmented Control */}
            <div className="flex items-center gap-2 p-1 bg-bg rounded-xl border border-border w-fit text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAskTarget('ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  askTarget === 'ai'
                    ? 'bg-accent text-white shadow-2xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI (Instant)</span>
              </button>
              <button
                type="button"
                onClick={() => setAskTarget('instructor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  askTarget === 'instructor'
                    ? 'bg-accent text-white shadow-2xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Ask an Instructor</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Select Concept:
              </label>
              <select
                value={askConceptId}
                onChange={(e) => setAskConceptId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-border bg-bg text-xs font-medium text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">-- Choose a concept to ask about --</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Your Question:
              </label>
              <textarea
                rows={3}
                required
                value={askQuestionBody}
                onChange={(e) => setAskQuestionBody(e.target.value)}
                placeholder={
                  askTarget === 'ai'
                    ? 'Ask anything about this concept to get an immediate AI explanation...'
                    : 'What part of this concept is unclear? Be specific to get the best explanation from an instructor...'
                }
                className="w-full p-3.5 rounded-xl border border-border bg-bg text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-text-secondary">
                {askTarget === 'ai'
                  ? '⚡ Immediate answer generated via AI (counts against 20 daily AI quota)'
                  : '⏳ Question will be posted for instructors to review and answer'}
              </span>
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAskModalOpen(false);
                    setAskQuestionBody('');
                  }}
                  className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuestion || !askConceptId || !askQuestionBody.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                >
                  {isSubmittingQuestion ? (
                    <span>{askTarget === 'ai' ? 'Generating AI Answer...' : 'Posting...'}</span>
                  ) : (
                    <>
                      <span>{askTarget === 'ai' ? 'Ask AI' : 'Post Question'}</span>
                      {askTarget === 'ai' ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

        </div>
      )}

      {/* 3. Search & Concept Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, concept or author..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-accent text-text-primary placeholder:text-text-secondary/60 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 text-text-secondary hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Concept Filter Dropdown */}
        {concepts.length > 0 && (
          <div className="relative sm:w-64 flex-shrink-0">
            <select
              value={selectedConceptFilter}
              onChange={(e) => setSelectedConceptFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus:outline-none focus:border-accent shadow-2xs cursor-pointer"
            >
              <option value="all">All Concepts ({concepts.length})</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Filter Tabs */}
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
          All Discussions ({allQuestions.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('mine')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterMode === 'mine'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>My Questions</span>
          {myQuestionsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterMode === 'mine' ? 'bg-white/20 text-white' : 'bg-accent-tint text-accent'
              }`}
            >
              {myQuestionsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('answered')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterMode === 'answered'
              ? 'bg-green text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Answered</span>
          {answeredCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterMode === 'answered' ? 'bg-white/20 text-white' : 'bg-green-tint text-green'
              }`}
            >
              {answeredCount}
            </span>
          )}
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
          <span>Awaiting Answer</span>
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
      </div>

      {/* 5. Questions Feed */}
      {questionsLoading || conceptsLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-surface border border-border h-40" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-dashed border-border rounded-2xl space-y-3 shadow-sm">
          <HelpCircle className="w-12 h-12 text-text-secondary/40 mx-auto" />
          <h3 className="text-base font-bold font-display text-text-primary">
            {filterMode === 'mine'
              ? "You haven't asked any questions yet"
              : filterMode === 'unanswered'
              ? 'All Questions Have Been Answered!'
              : 'No Questions Found'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {filterMode === 'mine'
              ? 'Have doubts on any concept? Click "Ask a Question" above to start a discussion.'
              : 'Try selecting a different filter or search term.'}
          </p>
          {filterMode !== 'mine' && (
            <button
              type="button"
              onClick={() => setIsAskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ask First Question</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const hasAnswers = q.answers && q.answers.length > 0;
            const isMyQuestion =
              Boolean(currentUser?.id) &&
              (q.studentId === currentUser?.id || q.userId === currentUser?.id);
            const isEditing = editingQuestionId === q.id;
            const isEdited = Boolean(
              q.updatedAt &&
                new Date(q.updatedAt).getTime() - new Date(q.createdAt).getTime() > 1000,
            );
            const askerName =
              q.studentName || q.user?.name || q.student?.name || (isMyQuestion ? 'You' : 'Student');

            return (
              <div
                key={q.id}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-4 transition-all hover:border-border/90"
              >
                {/* Top Meta: Concept Pill + Status + Study Link */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/student/concepts/${q.conceptId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg border border-border text-xs font-semibold text-text-primary hover:border-accent hover:text-accent transition-colors truncate"
                      title="Study concept"
                    >
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
                      <span className="truncate">{q.conceptTitle}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60 ml-0.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasAnswers ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-tint text-green">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Answered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-tint text-amber">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting Answer</span>
                      </span>
                    )}

                    {/* Own Question Actions - Edit only allowed if question is NOT answered */}
                    {isMyQuestion && !isEditing && (
                      <div className="flex items-center gap-1 pl-2 border-l border-border/80">
                        {!hasAnswers && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setEditBody(q.body);
                            }}
                            className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg rounded-md transition-colors"
                            title="Edit your question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteQuestionId(q.id)}
                          className="p-1 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete your question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Author & Body */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accent-tint text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {askerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span>{askerName}</span>
                        {isMyQuestion && (
                          <span className="px-1.5 py-0.2 rounded bg-accent-tint text-accent text-[9px] font-bold">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-text-secondary flex items-center gap-1.5 flex-wrap">
                        <span>
                          Asked on{' '}
                          {new Date(q.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isEdited && (
                          <span
                            className="text-text-secondary/70 italic text-[9px] bg-bg px-1.5 py-0.5 rounded border border-border/60"
                            title={`Edited on ${new Date(q.updatedAt!).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                          >
                            (edited)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 pl-9">
                      <textarea
                        rows={3}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full p-3 rounded-xl border border-accent bg-bg text-xs text-text-primary focus:outline-none resize-y"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(null);
                            setEditBody('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingEdit || !editBody.trim()}
                          onClick={() => handleSaveEdit(q.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50"
                        >
                          {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed pl-9">
                      {q.body}
                    </p>
                  )}
                </div>

                {/* Instructor Answers */}
                {hasAnswers && (
                  <div className="pt-2 pl-4 sm:pl-9 space-y-3">
                    {q.answers!.map((ans) => {
                      const instructorName =
                        ans.instructorName || ans.instructor?.name || 'Verified Instructor';

                      return (
                        <div
                          key={ans.id}
                          className={`p-4 rounded-xl space-y-2 shadow-2xs ${
                            ans.isAiAnswer
                              ? 'bg-accent-tint/40 border border-accent/30'
                              : 'bg-bg border border-accent/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {ans.isAiAnswer ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  AI Answer
                                </span>
                              ) : (
                                <>
                                  <span className="px-2 py-0.5 rounded-md bg-accent-tint text-accent text-[10px] font-bold uppercase tracking-wider">
                                    Instructor
                                  </span>
                                  <span className="text-xs font-bold text-text-primary">
                                    {instructorName}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="text-[10px] text-text-secondary">
                              {new Date(ans.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm text-text-primary leading-relaxed pl-1">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h4 className="text-xs sm:text-sm font-bold font-display text-text-primary mt-2.5 mb-1">{children}</h4>
                                ),
                                h2: ({ children }) => (
                                  <h5 className="text-xs sm:text-sm font-bold font-display text-text-primary mt-2 mb-1">{children}</h5>
                                ),
                                h3: ({ children }) => (
                                  <h6 className="text-xs font-bold font-display text-text-primary mt-1.5 mb-0.5">{children}</h6>
                                ),
                                h4: ({ children }) => (
                                  <h6 className="text-xs font-bold font-display text-text-primary mt-1.5 mb-0.5">{children}</h6>
                                ),
                                p: ({ children }) => (
                                  <p className="text-xs sm:text-sm text-text-primary leading-relaxed my-1">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-outside ml-4 my-1 space-y-0.5 text-xs sm:text-sm text-text-primary">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-outside ml-4 my-1 space-y-0.5 text-xs sm:text-sm text-text-primary">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed">{children}</li>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-3 border-accent/60 pl-3 my-1.5 italic text-text-secondary bg-accent-tint/20 py-1 rounded-r-md text-xs">{children}</blockquote>
                                ),
                                code: ({ className, children, ...props }) => {
                                  const isInline = !className && typeof children === 'string' && !children.includes('\n');
                                  if (isInline) {
                                    return (
                                      <code className="px-1.5 py-0.5 rounded bg-bg border border-border text-accent font-mono text-[11px]">
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <div className="my-2 rounded-lg overflow-hidden border border-border bg-[#1E222B] text-slate-100 p-3 font-mono text-xs overflow-x-auto shadow-2xs">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </div>
                                  );
                                },
                                strong: ({ children }) => (
                                  <strong className="font-bold text-text-primary">{children}</strong>
                                ),
                                a: ({ href, children, ...props }) => {
                                  const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
                                  return (
                                    <a
                                      href={href}
                                      target={isExternal ? '_blank' : undefined}
                                      rel={isExternal ? 'noopener noreferrer' : undefined}
                                      className="inline-flex items-center gap-1 font-semibold text-accent underline underline-offset-2 decoration-accent/50 hover:decoration-accent hover:text-accent/80 transition-colors"
                                      {...props}
                                    >
                                      <span>{children}</span>
                                      {isExternal && (
                                        <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                                      )}
                                    </a>
                                  );
                                },
                              }}
                            >
                              {ans.body}
                            </ReactMarkdown>

                          </div>
                        </div>


                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Themed Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteQuestionId)}
        title="Delete Question"
        message="Are you sure you want to delete this question? Any instructor answers attached to it will also be removed."
        confirmText="Delete Question"
        variant="danger"
        isLoading={isDeletingQuestion}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteQuestionId(null)}
      />
    </div>
  );
}
