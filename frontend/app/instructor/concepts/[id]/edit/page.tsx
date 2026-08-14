'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Edit3,
  Code2,
  AlertCircle,
  Save,
  ShieldAlert,
  ExternalLink,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  X,
  Edit2,
  HelpCircle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ConceptDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  authorId: string;
}

interface McqOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect?: boolean;
  orderIndex: number;
}

interface McqQuestion {
  id: string;
  conceptId: string;
  questionText: string;
  orderIndex: number;
  options: McqOption[];
}

export default function EditConceptPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const conceptId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Active top-level tab: 'content' | 'quiz'
  const [activeSection, setActiveSection] = useState<'content' | 'quiz'>('content');

  // Content form state
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Fetch concept data
  const {
    data: concept,
    isLoading: conceptLoading,
    isError,
    error,
  } = useQuery<ConceptDetail>({
    queryKey: ['concepts', conceptId],
    queryFn: async () => (await apiClient.get<ConceptDetail>(`/concepts/${conceptId}`)).data,
  });

  // Seed form state on fetch
  useEffect(() => {
    if (concept) {
      setTitle(concept.title);
      setDifficulty(concept.difficulty || 'medium');
      setContent(concept.content || '');
    }
  }, [concept]);

  // 2. Fetch quiz questions for this concept
  const {
    data: questions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useQuery<McqQuestion[]>({
    queryKey: ['concepts', conceptId, 'questions'],
    queryFn: async () => (await apiClient.get<McqQuestion[]>(`/concepts/${conceptId}/questions`)).data,
  });

  // Content Save mutation
  const updateConceptMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      content: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }) => {
      return (await apiClient.patch(`/concepts/${conceptId}`, payload)).data;
    },
    onSuccess: () => {
      setSuccessMessage('Concept article saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosErr.response?.status === 403) {
        setErrorMessage('You do not have permission to edit this concept.');
      } else {
        setErrorMessage(
          axiosErr.response?.data?.message || 'Failed to update concept. Please try again.',
        );
      }
    },
  });

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    updateConceptMutation.mutate({
      title: title.trim(),
      difficulty,
      content: content.trim(),
    });
  };

  // =========================================================================
  // MCQ QUIZ AUTHORING STATE & HANDLERS
  // =========================================================================
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<Array<{ optionText: string; isCorrect: boolean }>>([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
  ]);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);

  // Add Option to New Question Form
  const handleAddOptionField = () => {
    setNewOptions((prev) => [...prev, { optionText: '', isCorrect: false }]);
  };

  // Remove Option from New Question Form (min 2 required)
  const handleRemoveOptionField = (idx: number) => {
    if (newOptions.length <= 2) return;
    const removedWasCorrect = newOptions[idx].isCorrect;
    const updated = newOptions.filter((_, i) => i !== idx);
    if (removedWasCorrect && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setNewOptions(updated);
  };

  // Option text change
  const handleOptionTextChange = (idx: number, text: string) => {
    setNewOptions((prev) => {
      const copy = [...prev];
      copy[idx].optionText = text;
      return copy;
    });
  };

  // Option correct radio selection
  const handleSetCorrectOption = (idx: number) => {
    setNewOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === idx,
      })),
    );
  };

  // Create Question Mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (payload: {
      questionText: string;
      orderIndex: number;
      options: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }>;
    }) => {
      return (await apiClient.post(`/concepts/${conceptId}/questions`, payload)).data;
    },
    onSuccess: () => {
      setIsAddingQuestion(false);
      setNewQuestionText('');
      setNewOptions([
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
      ]);
      setQuizFormError(null);
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId, 'quiz-status'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setQuizFormError(axiosErr.response?.data?.message || 'Failed to create question.');
    },
  });

  const handleCreateQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);

    // Client-side Validation:
    if (!newQuestionText.trim()) {
      setQuizFormError('Question text cannot be empty.');
      return;
    }
    if (newOptions.length < 2) {
      setQuizFormError('At least 2 options are required.');
      return;
    }
    for (let i = 0; i < newOptions.length; i++) {
      if (!newOptions[i].optionText.trim()) {
        setQuizFormError(`Option ${i + 1} cannot be empty.`);
        return;
      }
    }
    const correctCount = newOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      setQuizFormError('Exactly one option must be marked as the correct answer.');
      return;
    }

    createQuestionMutation.mutate({
      questionText: newQuestionText.trim(),
      orderIndex: questions.length,
      options: newOptions.map((opt, idx) => ({
        optionText: opt.optionText.trim(),
        isCorrect: opt.isCorrect,
        orderIndex: idx,
      })),
    });
  };

  // Edit Question Inline State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');

  const updateQuestionTextMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      return (await apiClient.patch(`/questions/${id}`, { questionText: text })).data;
    },
    onSuccess: () => {
      setEditingQuestionId(null);
      refetchQuestions();
    },
    onError: () => alert('Failed to update question text.'),
  });

  // Edit Option Text / Correctness Mutation
  const updateOptionMutation = useMutation({
    mutationFn: async ({
      questionId,
      optionId,
      optionText,
      isCorrect,
    }: {
      questionId: string;
      optionId: string;
      optionText?: string;
      isCorrect?: boolean;
    }) => {
      return (
        await apiClient.patch(`/questions/${questionId}/options/${optionId}`, {
          optionText,
          isCorrect,
        })
      ).data;
    },
    onSuccess: () => refetchQuestions(),
    onError: () => alert('Failed to update option.'),
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/questions/${id}`)).data;
    },
    onSuccess: () => {
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId, 'quiz-status'] });
    },
    onError: () => alert('Failed to delete question.'),
  });

  const handleDeleteQuestion = (questionId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this question? This will also delete all student attempt history for this question.',
      )
    ) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  if (conceptLoading) {
    return (
      <div className="space-y-6 max-w-5xl py-8 animate-pulse">
        <div className="w-32 h-6 bg-border/60 rounded" />
        <div className="p-8 rounded-2xl bg-surface border border-border h-96" />
      </div>
    );
  }

  const axiosError = error as { response?: { status?: number } } | null;
  const isForbidden = isError && axiosError?.response?.status === 403;

  if (isForbidden) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-surface border border-border rounded-2xl space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber mx-auto" />
        <h2 className="text-lg font-bold font-display text-text-primary">Access Denied</h2>
        <p className="text-xs text-text-secondary">
          You do not have permission to edit this concept because you are not its author.
        </p>
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Content Studio</span>
        </Link>
      </div>
    );
  }

  if (isError || !concept) {
    return (
      <div className="p-12 text-center max-w-md mx-auto bg-surface border border-border rounded-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-amber mx-auto" />
        <h2 className="text-lg font-bold font-display text-text-primary">Concept Not Found</h2>
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Content Studio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Back Link & Student View Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Content</span>
        </Link>

        <Link
          href={`/student/concepts/${conceptId}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          <span>Preview Student View</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('content')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'content'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Article Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('quiz')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'quiz'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Quiz Questions ({questions.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ARTICLE CONTENT TAB */}
      {/* ========================================================================= */}
      {activeSection === 'content' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Article Editor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
                Edit Concept Content
              </h1>
            </div>

            {/* View Tab Toggle */}
            <div className="flex items-center gap-1 p-1 bg-bg border border-border rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'write' ? 'bg-surface text-accent shadow-xs' : 'text-text-secondary'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition-all ${
                  activeTab === 'split' ? 'bg-surface text-accent shadow-xs' : 'text-text-secondary'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview' ? 'bg-surface text-accent shadow-xs' : 'text-text-secondary'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-green-tint border border-green/30 text-green text-xs font-medium">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleContentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Concept Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-accent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Difficulty Tier
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-accent transition-all"
                >
                  <option value="easy">Easy (10 XP)</option>
                  <option value="medium">Medium (20 XP)</option>
                  <option value="hard">Hard (35 XP)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                Article Content (Markdown) <span className="text-red-500">*</span>
              </label>

              <div
                className={`grid gap-4 ${
                  activeTab === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {(activeTab === 'write' || activeTab === 'split') && (
                  <div className="space-y-1">
                    <textarea
                      required
                      rows={18}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-4 rounded-xl border border-border bg-bg font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-all resize-y"
                    />
                  </div>
                )}

                {(activeTab === 'preview' || activeTab === 'split') && (
                  <div className="p-5 rounded-xl border border-border bg-surface/50 overflow-y-auto max-h-[480px] prose prose-neutral text-xs sm:text-sm">
                    {content.trim() ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ className, children, ...props }) => {
                            const isInline =
                              !className && typeof children === 'string' && !children.includes('\n');
                            if (isInline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded bg-bg border border-border text-accent font-mono text-xs">
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <div className="my-2 rounded-lg bg-[#1E222B] text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          },
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-text-secondary/50 italic text-xs">
                        Live markdown preview will render here as you write.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Link
                href="/instructor/content"
                className="px-5 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-semibold text-xs hover:bg-bg transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || updateConceptMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {updateConceptMutation.isPending ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MCQ QUIZ QUESTIONS TAB */}
      {/* ========================================================================= */}
      {activeSection === 'quiz' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Knowledge Checks</span>
              </div>
              <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
                Concept Quiz Questions
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Author multiple-choice questions for students to test understanding (max 3 attempts per student).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingQuestion(!isAddingQuestion)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Add Question Form Card */}
          {isAddingQuestion && (
            <form
              onSubmit={handleCreateQuestionSubmit}
              className="p-6 rounded-2xl bg-bg border border-accent/40 space-y-5 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary">Create New MCQ Question</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quizFormError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{quizFormError}</span>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g., Which decorator defines a NestJS dependency injection provider?"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Options Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Options & Correct Answer (Select one correct)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add option</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {newOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        opt.isCorrect
                          ? 'border-green bg-green-tint/40 ring-1 ring-green/50'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {/* Radio to mark correct */}
                      <input
                        type="radio"
                        name="correct-option-group"
                        checked={opt.isCorrect}
                        onChange={() => handleSetCorrectOption(idx)}
                        className="w-4 h-4 text-green focus:ring-green accent-green cursor-pointer"
                        title="Mark as correct answer"
                      />

                      {/* Option Text Input */}
                      <input
                        type="text"
                        required
                        value={opt.optionText}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1} text...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border/80 bg-bg text-xs focus:outline-none focus:border-accent"
                      />

                      {opt.isCorrect && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-tint text-green">
                          Correct Answer
                        </span>
                      )}

                      {/* Remove Option Button (min 2) */}
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-1 text-text-secondary hover:text-red-500 rounded transition-colors"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50"
                >
                  {createQuestionMutation.isPending ? 'Creating...' : 'Save Question'}
                </button>
              </div>
            </form>
          )}

          {/* Existing Questions List */}
          {questionsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 bg-bg border border-border rounded-xl" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center bg-bg border border-dashed border-border rounded-xl space-y-2">
              <HelpCircle className="w-10 h-10 text-text-secondary/40 mx-auto" />
              <h3 className="text-sm font-bold text-text-primary">No Questions Authored Yet</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Adding quiz questions allows students to test their mastery and triggers automatic concept completion.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q, qIdx) => {
                const isEditingText = editingQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-xl border border-border bg-bg space-y-4 shadow-2xs"
                  >
                    {/* Question Header & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/70 pb-3">
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Question {qIdx + 1}
                        </span>

                        {isEditingText ? (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={editQuestionText}
                              onChange={(e) => setEditQuestionText(e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs sm:text-sm flex-1 focus:outline-none focus:border-accent"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editQuestionText.trim()) {
                                  updateQuestionTextMutation.mutate({
                                    id: q.id,
                                    text: editQuestionText.trim(),
                                  });
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingQuestionId(null)}
                              className="px-3 py-1.5 rounded-lg border border-border text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <h4 className="text-sm sm:text-base font-bold text-text-primary">
                            {q.questionText}
                          </h4>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(q.id);
                            setEditQuestionText(q.questionText);
                          }}
                          className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                          title="Edit question text"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        Options (Click radio to change correct answer)
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                              opt.isCorrect
                                ? 'border-green bg-green-tint/30 text-text-primary font-semibold ring-1 ring-green/40'
                                : 'border-border bg-surface text-text-primary'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-options-${q.id}`}
                                checked={Boolean(opt.isCorrect)}
                                onChange={() =>
                                  updateOptionMutation.mutate({
                                    questionId: q.id,
                                    optionId: opt.id,
                                    isCorrect: true,
                                  })
                                }
                                className="w-4 h-4 text-green focus:ring-green accent-green cursor-pointer"
                              />
                              <span>{opt.optionText}</span>
                            </label>

                            {opt.isCorrect && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-tint text-green uppercase tracking-wider">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
