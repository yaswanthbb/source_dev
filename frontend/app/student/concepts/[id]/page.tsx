'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  Info,
  Layers,
  MessageSquare,
  Sparkles,
  Send,
  AlertCircle,
  Check,
  Award,
  Code2,
  BookOpen,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import {
  useRoadmapDetail,
  useRoadmapProgress,
} from '@/lib/hooks/use-roadmap-progress';
import { useSnackbar } from '@/providers/snackbar-provider';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ConceptDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  authorId?: string;
  appearsIn?: Array<{
    moduleConceptId?: string;
    moduleId: string;
    moduleTitle: string;
    roadmapId: string;
    roadmapTitle: string;
    orderIndex: number;
    prerequisites?: Array<{
      prerequisiteConceptId: string;
      title: string;
      slug?: string;
      orderIndex?: number;
    }>;
  }>;
}

interface McqOption {
  id: string;
  questionId: string;
  optionText: string;
  orderIndex: number;
}

interface McqQuestion {
  id: string;
  conceptId: string;
  questionText: string;
  orderIndex: number;
  options: McqOption[];
}

interface QuestionStatus {
  questionId: string;
  questionText: string;
  orderIndex: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  isCorrect: boolean;
  isResolved: boolean;
  correctOptionId?: string;
}

interface QuizStatusResponse {
  conceptId: string;
  totalQuestions: number;
  allQuestionsResolved: boolean;
  questions: QuestionStatus[];
}

interface AttemptResponse {
  isCorrect: boolean;
  attemptNumber: number;
  attemptsRemaining: number;
  correctOptionId?: string;
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
    email: string;
    role: string;
    instructorProfile?: { bio?: string; status?: string };
  };
}

interface QaQuestion {
  id: string;
  conceptId: string;
  userId: string;
  body: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string };
  answers?: QaAnswer[];
}

interface ParsedHeading {
  id: string;
  text: string;
  level: number;
}

function slugifyHeadingText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractHeadings(markdown: string): ParsedHeading[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings: ParsedHeading[] = [];
  const slugCounts = new Map<string, number>();

  for (const line of lines) {
    // Match only main headings (# and ##), omitting subheadings (###)
    const match = line.match(/^(#{1,2})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].replace(/[*_`#]/g, '').trim();
      if (!rawText) continue;

      let baseSlug = slugifyHeadingText(rawText);
      if (!baseSlug) baseSlug = `heading-${headings.length + 1}`;

      const count = slugCounts.get(baseSlug) || 0;
      slugCounts.set(baseSlug, count + 1);
      const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;

      headings.push({
        id: slug,
        text: rawText,
        level,
      });
    }
  }

  return headings;
}

function getNodeText(node: React.ReactNode): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement(node) && node.props && (node.props as { children?: React.ReactNode }).children) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

export default function ConceptReadingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const conceptId = resolvedParams.id;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlRoadmapId = searchParams.get('roadmapId');
  const urlModuleId = searchParams.get('moduleId');

  const hasStartedRef = useRef(false);

  // 1. Concept Details
  const {
    data: concept,
    isLoading: conceptLoading,
    isError: conceptError,
  } = useQuery<ConceptDetail>({
    queryKey: ['concepts', conceptId],
    queryFn: async () => (await apiClient.get<ConceptDetail>(`/concepts/${conceptId}`)).data,
  });

  // Effective Roadmap & Module IDs
  const effectiveRoadmapId =
    urlRoadmapId || concept?.appearsIn?.[0]?.roadmapId || undefined;
  const effectiveModuleId =
    urlModuleId || concept?.appearsIn?.[0]?.moduleId || undefined;

  // 2. Roadmap Tree & Progress for Curriculum Sidebar
  const { data: roadmap } = useRoadmapDetail(effectiveRoadmapId);
  const { data: roadmapProgress } = useRoadmapProgress(effectiveRoadmapId);

  // Unmet module-scoped prerequisites for current student from roadmap progress
  const unmetPrerequisites = useMemo(() => {
    if (!roadmapProgress?.concepts) return [];
    const currentProgress = roadmapProgress.concepts.find(
      (c) => c.conceptId === conceptId,
    );
    if (!currentProgress || !currentProgress.prerequisites) return [];
    return currentProgress.prerequisites.filter(
      (p) => !p.isCompletedByCurrentUser,
    );
  }, [roadmapProgress, conceptId]);

  // 3. Quiz Questions
  const {
    data: quizQuestions = [],
    isLoading: questionsLoading,
  } = useQuery<McqQuestion[]>({
    queryKey: ['concepts', conceptId, 'questions'],
    queryFn: async () => {
      try {
        return (await apiClient.get<McqQuestion[]>(`/concepts/${conceptId}/questions`)).data;
      } catch {
        return [];
      }
    },
  });

  // 4. Quiz Status (Resolved attempts, remaining tries, correct answers)
  const {
    data: quizStatus,
    refetch: refetchQuizStatus,
  } = useQuery<QuizStatusResponse>({
    queryKey: ['concepts', conceptId, 'quiz-status'],
    queryFn: async () => {
      try {
        return (await apiClient.get<QuizStatusResponse>(`/concepts/${conceptId}/quiz-status`)).data;
      } catch {
        return {
          conceptId,
          totalQuestions: 0,
          allQuestionsResolved: false,
          questions: [],
        };
      }
    },
  });

  // 5. Q&A Threads
  const {
    data: qaQuestions = [],
    isLoading: qaLoading,
    refetch: refetchQa,
  } = useQuery<QaQuestion[]>({
    queryKey: ['concepts', conceptId, 'qa-questions'],
    queryFn: async () => (await apiClient.get<QaQuestion[]>(`/concepts/${conceptId}/qa-questions`)).data,
  });

  // 6. User Concept Progress
  const { data: userProgressList = [] } = useQuery<Array<{ conceptId: string; status: string }>>({
    queryKey: ['progress', 'me'],
    queryFn: async () => (await apiClient.get<Array<{ conceptId: string; status: string }>>('/progress/me')).data,
  });

  // Check if current concept is completed
  const isCurrentConceptCompleted = useMemo(() => {
    const p = userProgressList.find((item) => item.conceptId === conceptId);
    return p?.status === 'completed';
  }, [userProgressList, conceptId]);

  // Fire POST /concepts/:id/start once on page mount
  useEffect(() => {
    if (!hasStartedRef.current && conceptId) {
      hasStartedRef.current = true;
      apiClient.post(`/concepts/${conceptId}/start`).catch(() => {
        // Silently ignore if already started
      });
    }
  }, [conceptId]);

  // Quiz Interaction State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [attemptFeedback, setAttemptFeedback] = useState<Record<string, AttemptResponse>>({});
  const [submittingQuestions, setSubmittingQuestions] = useState<Record<string, boolean>>({});

  // Question status map
  const questionStatusMap = useMemo(() => {
    const map = new Map<string, QuestionStatus>();
    if (quizStatus?.questions) {
      quizStatus.questions.forEach((qs) => map.set(qs.questionId, qs));
    }
    return map;
  }, [quizStatus]);

  const { showSuccess, showError } = useSnackbar();

  // Handle MCQ Option Attempt Submission
  const handleAttemptSubmit = async (questionId: string) => {
    const selectedOptionId = selectedOptions[questionId];
    if (!selectedOptionId) return;

    setSubmittingQuestions((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await apiClient.post<AttemptResponse>(
        `/questions/${questionId}/attempt`,
        { selectedOptionId },
      );

      const result = response.data;
      setAttemptFeedback((prev) => ({ ...prev, [questionId]: result }));

      if (result.isCorrect) {
        showSuccess('Correct answer!');
      } else {
        showError(`Incorrect. ${result.attemptsRemaining} attempt(s) remaining.`);
      }

      // Refetch quiz status
      const updatedStatus = await refetchQuizStatus();

      // If all questions resolved, invalidate progress queries for auto-completion
      if (updatedStatus.data?.allQuestionsResolved) {
        showSuccess('Concept mastered! XP awarded.');
        queryClient.invalidateQueries({ queryKey: ['progress'] });
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
        queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };
      const msg = axiosError.response?.data?.message || 'Attempt failed. Please try again.';
      showError(msg);
    } finally {
      setSubmittingQuestions((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Manual Complete Action (only if questions.length === 0)
  const [isCompletingManually, setIsCompletingManually] = useState(false);
  const handleManualComplete = async () => {
    setIsCompletingManually(true);
    try {
      await apiClient.post(`/concepts/${conceptId}/complete`);
      showSuccess('Concept completed!');
      await queryClient.invalidateQueries({ queryKey: ['progress'] });
      await queryClient.invalidateQueries({ queryKey: ['gamification'] });
      await queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showError(axiosError.response?.data?.message || 'Failed to mark concept completed.');
    } finally {
      setIsCompletingManually(false);
    }
  };

  // Q&A Question Creation
  const [qaInputBody, setQaInputBody] = useState('');
  const [isPostingQa, setIsPostingQa] = useState(false);

  const handlePostQaQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInputBody.trim()) return;

    setIsPostingQa(true);
    try {
      await apiClient.post(`/concepts/${conceptId}/qa-questions`, {
        body: qaInputBody.trim(),
      });
      showSuccess('Question posted');
      setQaInputBody('');
      refetchQa();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showError(axiosError.response?.data?.message || 'Failed to post question.');
    } finally {
      setIsPostingQa(false);
    }
  };

  // Sibling Concepts in Current Module
  const currentModule = useMemo(() => {
    if (!roadmap?.modules) return null;
    if (effectiveModuleId) {
      return roadmap.modules.find((m) => m.id === effectiveModuleId) || roadmap.modules[0];
    }
    return (
      roadmap.modules.find((m) =>
        (m.moduleConcepts || []).some((mc) => mc.conceptId === conceptId),
      ) || roadmap.modules[0]
    );
  }, [roadmap, effectiveModuleId, conceptId]);

  const moduleConcepts = useMemo(() => {
    return currentModule?.moduleConcepts?.map((mc) => mc.concept).filter(Boolean) || [];
  }, [currentModule]);

  // Module Progress Calculation
  const moduleProgress = useMemo(() => {
    if (!moduleConcepts.length || !roadmapProgress?.concepts) return { completed: 0, total: 0, percentage: 0 };
    const progressMap = new Map(roadmapProgress.concepts.map((c) => [c.conceptId, c.status]));
    const total = moduleConcepts.length;
    const completed = moduleConcepts.filter((c) => progressMap.get(c.id) === 'completed').length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [moduleConcepts, roadmapProgress]);

  // Code Block detection for Table of Contents
  const hasCodeBlock = useMemo(() => {
    return Boolean(concept?.content && (concept.content.includes('```') || concept.content.includes('<code>')));
  }, [concept?.content]);

  // Dynamic Main Headings for Lesson Contents
  const parsedHeadings = useMemo(() => {
    return extractHeadings(concept?.content || '');
  }, [concept?.content]);

  // Active Section ID for Lesson Contents Tree Highlight
  const [activeSectionId, setActiveSectionId] = useState<string>('introduction');

  useEffect(() => {
    if (!concept?.content) return;

    const handleScroll = () => {
      const headingIds = [
        'introduction',
        ...parsedHeadings.map((h) => h.id),
        ...(quizQuestions.length > 0 ? ['quiz'] : []),
        'qa',
      ];

      const scrollPosition = window.scrollY + 140;

      let currentId = 'introduction';
      for (const id of headingIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            currentId = id;
          }
        }
      }

      setActiveSectionId(currentId);
    };

    // Check initial position and listen on scroll
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [concept?.content, parsedHeadings, quizQuestions.length]);

  if (conceptLoading) {
    return (
      <div className="space-y-6 max-w-5xl py-8 animate-pulse">
        <div className="w-1/3 h-8 bg-border/60 rounded" />
        <div className="w-full h-96 bg-border/30 rounded-2xl" />
      </div>
    );
  }

  if (conceptError || !concept) {
    return (
      <div className="space-y-6 max-w-3xl py-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber mx-auto mb-3" />
        <h2 className="text-xl font-bold font-display text-text-primary">Concept Not Found</h2>
        <p className="text-sm text-text-secondary">The requested article could not be loaded.</p>
        <Link
          href="/student/roadmaps"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Roadmaps</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 xl:gap-12 relative pb-16 w-full max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* MAIN CONCEPT CANVAS (CENTERED) */}
      {/* ========================================================================= */}
      <div className="w-full flex-1 max-w-[780px] xl:max-w-[840px] 2xl:max-w-[880px] mx-auto min-w-0 space-y-10">
        {/* Concept Article Header */}
        <section id="introduction" className="space-y-4">
          {effectiveRoadmapId && (
            <Link
              href={`/student/roadmaps/${effectiveRoadmapId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{roadmap?.title || 'Back to Roadmap'}</span>
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {concept.difficulty && (
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
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
            {isCurrentConceptCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-tint text-green text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold font-display text-text-primary tracking-tight leading-tight">
            {concept.title}
          </h1>

          {/* Unmet Module Prerequisites Warning Callout */}
          {unmetPrerequisites.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Recommended module prerequisites before studying this concept:</span>
              </div>
              <ul className="list-disc list-inside pl-1 space-y-0.5 text-text-secondary">
                {unmetPrerequisites.map((prereq) => (
                  <li key={prereq.prerequisiteConceptId}>
                    <Link
                      href={`/student/concepts/${prereq.prerequisiteConceptId}${effectiveRoadmapId ? `?roadmapId=${effectiveRoadmapId}` : ''}`}
                      className="text-accent hover:underline font-medium"
                    >
                      {prereq.title || 'Prerequisite concept'}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Markdown Article Body */}
        <article className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm prose prose-neutral max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => {
                const text = getNodeText(children);
                const id = slugifyHeadingText(text) || 'section';
                return (
                  <h1
                    id={id}
                    className="scroll-mt-24 text-2xl font-bold font-display text-text-primary mt-8 mb-4 border-b border-border pb-2"
                  >
                    {children}
                  </h1>
                );
              },
              h2: ({ children }) => {
                const text = getNodeText(children);
                const id = slugifyHeadingText(text) || 'section';
                return (
                  <h2
                    id={id}
                    className="scroll-mt-24 text-xl font-bold font-display text-text-primary mt-8 mb-3"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = getNodeText(children);
                const id = slugifyHeadingText(text) || 'section';
                return (
                  <h3
                    id={id}
                    className="scroll-mt-24 text-lg font-bold font-display text-text-primary mt-6 mb-2"
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="text-sm sm:text-base text-text-primary leading-relaxed my-3 font-sans">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside my-3 space-y-1 text-sm sm:text-base text-text-primary">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside my-3 space-y-1 text-sm sm:text-base text-text-primary">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-accent pl-4 my-4 italic text-text-secondary bg-accent-tint/30 py-2 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className && typeof children === 'string' && !children.includes('\n');
                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-bg border border-border text-accent font-mono text-xs">
                      {children}
                    </code>
                  );
                }
                return (
                  <div id="code-example" className="my-4 rounded-xl overflow-hidden border border-border bg-[#1E222B] text-slate-100 p-4 font-mono text-xs sm:text-sm overflow-x-auto shadow-xs">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </div>
                );
              },
            }}
          >
            {concept.content || 'No content provided for this concept yet.'}
          </ReactMarkdown>
        </article>

        {/* Manual Complete Button (ONLY IF questions.length === 0) */}
        {quizQuestions.length === 0 && (
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold font-display text-text-primary text-sm sm:text-base">
                {isCurrentConceptCompleted ? 'Concept Mastered 🎉' : 'Finished Reading?'}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {isCurrentConceptCompleted
                  ? 'You have completed this concept and earned XP.'
                  : 'Mark this concept complete to update your learning progress and maintain your streak.'}
              </p>
            </div>

            {isCurrentConceptCompleted ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-tint text-green text-xs font-semibold flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleManualComplete}
                disabled={isCompletingManually}
                className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer flex-shrink-0"
              >
                {isCompletingManually ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Mark as Complete</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* QUIZ SECTION (id="quiz") - Rendered only if questions.length > 0 */}
        {/* ========================================================================= */}
        {quizQuestions.length > 0 && (
          <section id="quiz" className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
            <div className="border-b border-border/80 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Knowledge Check</span>
              </div>
              <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
                Check your understanding
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Answer all questions to complete this concept automatically (max 3 attempts per question).
              </p>
            </div>

            <div className="space-y-8">
              {quizQuestions.map((question, qIdx) => {
                const statusInfo = questionStatusMap.get(question.id);
                const feedback = attemptFeedback[question.id];

                const isResolved =
                  statusInfo?.isResolved ||
                  statusInfo?.isCorrect ||
                  feedback?.isCorrect ||
                  (feedback?.attemptsRemaining === 0);

                const correctOptionId =
                  statusInfo?.correctOptionId ||
                  feedback?.correctOptionId;

                const attemptsRemaining =
                  feedback?.attemptsRemaining ??
                  statusInfo?.attemptsRemaining ??
                  3;

                const currentSelected = selectedOptions[question.id];
                const isSubmitting = Boolean(submittingQuestions[question.id]);

                return (
                  <div
                    key={question.id}
                    className="p-5 sm:p-6 rounded-xl border border-border bg-bg space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Question {qIdx + 1} of {quizQuestions.length}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-text-primary">
                          {question.questionText}
                        </h3>
                      </div>

                      {isResolved ? (
                        <span className="px-2.5 py-1 rounded-lg bg-green-tint text-green text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary text-[11px] font-medium flex-shrink-0">
                          {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>

                    {/* Radio Options */}
                    <div className="space-y-2.5 pt-1">
                      {question.options.map((option) => {
                        const isChosen = currentSelected === option.id;
                        const isCorrectOption = correctOptionId === option.id;

                        let optionStyle = 'border-border bg-surface text-text-primary hover:border-accent/40';

                        if (isResolved) {
                          if (isCorrectOption) {
                            optionStyle = 'border-green bg-green-tint text-green font-semibold ring-1 ring-green';
                          } else if (isChosen && !isCorrectOption) {
                            optionStyle = 'border-red-300 bg-red-50 text-red-700 opacity-80';
                          } else {
                            optionStyle = 'border-border bg-surface opacity-60';
                          }
                        } else if (isChosen) {
                          optionStyle = 'border-accent bg-accent-tint text-accent font-semibold ring-1 ring-accent';
                        }

                        return (
                          <label
                            key={option.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${optionStyle} ${
                              isResolved ? 'cursor-default pointer-events-none' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              disabled={isResolved}
                              checked={isChosen || isCorrectOption}
                              onChange={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [question.id]: option.id,
                                }))
                              }
                              className="w-4 h-4 text-accent border-border focus:ring-accent accent-accent"
                            />
                            <span className="flex-1">{option.optionText}</span>
                            {isResolved && isCorrectOption && (
                              <Check className="w-4 h-4 text-green stroke-[3]" />
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Submission / Feedback Controls */}
                    <div className="pt-2 flex items-center justify-between">
                      {isResolved ? (
                        <p className="text-xs text-green font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Question resolved and credited towards completion.</span>
                        </p>
                      ) : (
                        <>
                          <div className="text-xs text-text-secondary">
                            {feedback && !feedback.isCorrect && (
                              <span className="text-amber font-medium">
                                Incorrect. {feedback.attemptsRemaining} attempt(s) remaining.
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!currentSelected || isSubmitting}
                            onClick={() => handleAttemptSubmit(question.id)}
                            className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                          >
                            {isSubmitting ? 'Checking...' : 'Submit Answer'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* Q&A SECTION (id="qa") */}
        {/* ========================================================================= */}
        <section id="qa" className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
          <div className="border-b border-border/80 pb-4 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion</span>
              </div>
              <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
                Questions & Answers
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Ask questions about this concept and get explanations from instructors.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-bg border border-border text-xs font-semibold text-text-secondary">
              {qaQuestions.length} thread{qaQuestions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Ask Question Form */}
          <form onSubmit={handlePostQaQuestion} className="space-y-3">
            <textarea
              required
              rows={3}
              value={qaInputBody}
              onChange={(e) => setQaInputBody(e.target.value)}
              placeholder="Have a question or need clarification on this concept? Ask here..."
              className="w-full p-4 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!qaInputBody.trim() || isPostingQa}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                {isPostingQa ? (
                  <span>Posting...</span>
                ) : (
                  <>
                    <span>Post Question</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Existing Questions List */}
          <div className="space-y-4 pt-4 border-t border-border/80">
            {qaLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-bg space-y-2">
                    <div className="w-1/4 h-4 bg-border/60 rounded" />
                    <div className="w-full h-8 bg-border/40 rounded" />
                  </div>
                ))}
              </div>
            ) : qaQuestions.length === 0 ? (
              <div className="p-8 text-center bg-bg border border-dashed border-border rounded-xl">
                <HelpCircle className="w-8 h-8 text-text-secondary/50 mx-auto mb-2" />
                <p className="text-xs font-semibold text-text-primary">No questions yet</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Be the first to start a discussion on this concept!
                </p>
              </div>
            ) : (
              qaQuestions.map((q) => (
                <div key={q.id} className="p-5 rounded-xl border border-border bg-bg space-y-3">
                  {/* Question Asker & Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-tint text-accent font-bold text-xs flex items-center justify-center">
                        {q.user?.name ? q.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {q.user?.name || 'Student'}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          {new Date(q.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question Body */}
                  <p className="text-xs sm:text-sm text-text-primary leading-relaxed pl-9">
                    {q.body}
                  </p>

                  {/* Nested Instructor Answers */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="mt-3 pl-9 space-y-3 border-l-2 border-accent/30 ml-4">
                      {q.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="p-3.5 rounded-xl bg-surface border border-accent/20 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-accent-tint text-accent text-[10px] font-bold uppercase tracking-wider">
                                Instructor
                              </span>
                              <span className="text-xs font-bold text-text-primary">
                                {answer.instructor?.name || 'Instructor'}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-secondary">
                              {new Date(answer.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-text-primary leading-relaxed">
                            {answer.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDEBAR (LESSON CONTENTS) */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-[260px] xl:w-[280px] flex-shrink-0 space-y-4 lg:sticky lg:top-8 self-start">
        {/* CARD: LESSON CONTENTS */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-bold font-display text-text-primary tracking-tight">
            Lesson contents
          </h4>

          <nav className="border-l-2 border-border/80 relative flex flex-col py-0.5" aria-label="Lesson contents">
            {parsedHeadings.length > 0 ? (
              parsedHeadings.map((heading) => {
                const isActive = activeSectionId === heading.id;
                return (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={() => setActiveSectionId(heading.id)}
                    className={`block py-2.5 px-4 text-xs transition-all -ml-[2px] truncate ${
                      isActive
                        ? 'border-l-2 border-accent bg-accent-tint/60 text-accent font-semibold'
                        : 'border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/60 font-medium'
                    }`}
                    title={heading.text}
                  >
                    {heading.text}
                  </a>
                );
              })
            ) : (
              <a
                href="#introduction"
                onClick={() => setActiveSectionId('introduction')}
                className={`block py-2.5 px-4 text-xs transition-all -ml-[2px] truncate ${
                  activeSectionId === 'introduction'
                    ? 'border-l-2 border-accent bg-accent-tint/60 text-accent font-semibold'
                    : 'border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/60 font-medium'
                }`}
              >
                Introduction
              </a>
            )}

            {quizQuestions.length > 0 && (
              <a
                href="#quiz"
                onClick={() => setActiveSectionId('quiz')}
                className={`block py-2.5 px-4 text-xs transition-all -ml-[2px] truncate ${
                  activeSectionId === 'quiz'
                    ? 'border-l-2 border-accent bg-accent-tint/60 text-accent font-semibold'
                    : 'border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/60 font-medium'
                }`}
              >
                Knowledge check
              </a>
            )}

            <a
              href="#qa"
              onClick={() => setActiveSectionId('qa')}
              className={`block py-2.5 px-4 text-xs transition-all -ml-[2px] truncate ${
                activeSectionId === 'qa'
                  ? 'border-l-2 border-accent bg-accent-tint/60 text-accent font-semibold'
                  : 'border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/60 font-medium'
              }`}
            >
              Questions & answers
            </a>
          </nav>

          {/* Quick Difficulty / XP Info */}
          <div className="pt-3 border-t border-border/80 space-y-2 text-xs text-text-secondary">
            <div className="flex items-center justify-between">
              <span>Difficulty</span>
              <span className="font-semibold capitalize text-text-primary">
                {concept.difficulty || 'Medium'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>XP Reward</span>
              <span className="font-semibold text-accent flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>
                  {concept.difficulty === 'easy'
                    ? '10 XP'
                    : concept.difficulty === 'hard'
                    ? '35 XP'
                    : '20 XP'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
