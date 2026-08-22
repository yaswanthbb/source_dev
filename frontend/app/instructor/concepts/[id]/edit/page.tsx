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
  Copy,
  Sparkles,
  FileJson,
  UploadCloud,
  Terminal,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import {
  AiGeneratingModal,
  AiGenerationContextType,
} from '@/components/ai-generating-modal';
import { AiQuotaBadge } from '@/components/ai-quota-badge';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';
import { hasSignificantContentChange } from '@/lib/content-diff';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ConceptAppearsIn {
  moduleConceptId: string;
  moduleId: string;
  moduleTitle?: string;
  roadmapId?: string;
  roadmapTitle?: string;
  orderIndex: number;
}

interface ConceptDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  authorId: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  appearsIn?: ConceptAppearsIn[];
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

const SAMPLE_QUIZ_JSON = JSON.stringify(
  [
    {
      questionText: 'Which Git command is used to save staged changes permanently in the local repository history?',
      options: [
        { optionText: 'git commit -m "feat: add user authentication"', isCorrect: true },
        { optionText: 'git add .', isCorrect: false },
        { optionText: 'git push origin main', isCorrect: false },
        { optionText: 'git status', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the primary role of version control systems in modern software engineering?',
      options: [
        { optionText: 'Tracking change history and facilitating team collaboration safely', isCorrect: true },
        { optionText: 'Compiling source code directly into executable machine code', isCorrect: false },
        { optionText: 'Automating remote production server hosting only', isCorrect: false },
      ],
    },
  ],
  null,
  2,
);

interface ParsedImportQuestion {
  questionText: string;
  orderIndex: number;
  options: Array<{
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
}

interface ValidationReport {
  isValid: boolean;
  questions: ParsedImportQuestion[];
  errors: string[];
  syntaxError: string | null;
  totalParsed: number;
  totalValid: number;
}

function validateAndParseQuizText(rawText: string, startingOrderIndex: number): ValidationReport {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      isValid: false,
      questions: [],
      errors: ['Text area is empty. Paste questions or click "Insert Template" to get started.'],
      syntaxError: null,
      totalParsed: 0,
      totalValid: 0,
    };
  }

  // 1. JSON parsing
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      const errors: string[] = [];
      const validatedList: ParsedImportQuestion[] = [];

      rawList.forEach((item, qIdx) => {
        const qNum = qIdx + 1;
        if (!item || typeof item !== 'object') {
          errors.push(`Question #${qNum}: Expected a JSON object, but received ${typeof item}.`);
          return;
        }

        const questionText = typeof item.questionText === 'string' ? item.questionText.trim() : '';
        if (!questionText) {
          errors.push(`Question #${qNum}: "questionText" is required and cannot be empty.`);
        }

        if (!Array.isArray(item.options)) {
          errors.push(`Question #${qNum}: "options" must be an array of option objects.`);
          return;
        }

        if (item.options.length < 2) {
          errors.push(`Question #${qNum}: Must have at least 2 options (found ${item.options.length}).`);
        }

        const parsedOptions: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }> = [];
        let correctCount = 0;

        item.options.forEach((opt: any, optIdx: number) => {
          const optNum = optIdx + 1;
          if (!opt || typeof opt !== 'object') {
            errors.push(`Question #${qNum}, Option #${optNum}: Expected an object with "optionText" and "isCorrect".`);
            return;
          }

          const optionText = typeof opt.optionText === 'string' ? opt.optionText.trim() : '';
          if (!optionText) {
            errors.push(`Question #${qNum}, Option #${optNum}: "optionText" is required and cannot be empty.`);
          }

          const isCorrect = Boolean(opt.isCorrect);
          if (isCorrect) correctCount++;

          parsedOptions.push({
            optionText,
            isCorrect,
            orderIndex: optIdx,
          });
        });

        if (correctCount === 0) {
          errors.push(`Question #${qNum}: No option is marked as correct. Exactly one option must have "isCorrect": true.`);
        } else if (correctCount > 1) {
          errors.push(`Question #${qNum}: ${correctCount} options marked as correct. Exactly one option must have "isCorrect": true.`);
        }

        if (questionText && parsedOptions.length >= 2 && correctCount === 1) {
          validatedList.push({
            questionText,
            orderIndex: startingOrderIndex + qIdx,
            options: parsedOptions,
          });
        }
      });

      return {
        isValid: errors.length === 0 && validatedList.length > 0,
        questions: validatedList,
        errors,
        syntaxError: null,
        totalParsed: rawList.length,
        totalValid: validatedList.length,
      };
    } catch (err: any) {
      return {
        isValid: false,
        questions: [],
        errors: [`Invalid JSON Syntax: ${err?.message || 'Check for missing commas, quotes, or unclosed braces.'}`],
        syntaxError: err?.message || 'JSON Syntax Error',
        totalParsed: 0,
        totalValid: 0,
      };
    }
  }

  // 2. Structured text / Markdown fallback parsing
  const blocks = trimmed.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const errors: string[] = [];
  const validatedList: ParsedImportQuestion[] = [];

  blocks.forEach((block, bIdx) => {
    const qNum = bIdx + 1;
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) {
      errors.push(`Question #${qNum}: Must have at least 1 question title line and 2 option lines.`);
      return;
    }

    const questionLine = lines[0].replace(/^(Q\s*\d*[:.]|\d+[\).])\s*/i, '').trim();
    if (!questionLine) {
      errors.push(`Question #${qNum}: Question text is missing.`);
      return;
    }

    const optionLines = lines.slice(1);
    const parsedOptions: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }> = [];
    let correctCount = 0;

    optionLines.forEach((optLine, optIdx) => {
      const isMarkedCorrect =
        optLine.includes('(correct)') ||
        optLine.includes('[x]') ||
        optLine.includes('[X]') ||
        optLine.startsWith('*');

      const cleanText = optLine
        .replace(/^(-\s*\[[ xX]\]|\*\s*|[a-dA-D][\).]|-\s*)/, '')
        .replace(/\(correct\)/i, '')
        .trim();

      if (!cleanText) {
        errors.push(`Question #${qNum}, Option #${optIdx + 1}: Option text is empty.`);
        return;
      }

      if (isMarkedCorrect) correctCount++;

      parsedOptions.push({
        optionText: cleanText,
        isCorrect: isMarkedCorrect,
        orderIndex: optIdx,
      });
    });

    if (parsedOptions.length < 2) {
      errors.push(`Question #${qNum}: Must have at least 2 options.`);
    }

    if (correctCount === 0) {
      errors.push(`Question #${qNum}: No option is marked as correct (use [x], * or '(correct)' to mark).`);
    } else if (correctCount > 1) {
      errors.push(`Question #${qNum}: ${correctCount} options marked as correct. Only 1 can be correct.`);
    }

    if (questionLine && parsedOptions.length >= 2 && correctCount === 1) {
      validatedList.push({
        questionText: questionLine,
        orderIndex: startingOrderIndex + bIdx,
        options: parsedOptions,
      });
    }
  });

  return {
    isValid: errors.length === 0 && validatedList.length > 0,
    questions: validatedList,
    errors,
    syntaxError: null,
    totalParsed: blocks.length,
    totalValid: validatedList.length,
  };
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

  const firstAppearsIn = concept?.appearsIn?.[0];
  const parentRoadmapId = firstAppearsIn?.roadmapId;

  const { data: roadmapDetail } = useQuery<{
    id: string;
    title: string;
    description?: string | null;
    modules?: Array<{
      id: string;
      title: string;
      moduleConcepts?: Array<{
        conceptId: string;
        concept?: { title: string };
      }>;
    }>;
  }>({
    queryKey: ['roadmaps', parentRoadmapId, 'detail'],
    queryFn: async () => (await apiClient.get(`/roadmaps/${parentRoadmapId}`)).data,
    enabled: Boolean(parentRoadmapId),
  });

  const siblingConceptTitles = React.useMemo(() => {
    if (!roadmapDetail || !firstAppearsIn?.moduleId) return [];
    const currentMod = (roadmapDetail.modules || []).find(
      (m) => m.id === firstAppearsIn.moduleId,
    );
    if (!currentMod) return [];
    return (currentMod.moduleConcepts || [])
      .map((mc) => mc.concept?.title)
      .filter((t): t is string => Boolean(t) && t !== title);
  }, [roadmapDetail, firstAppearsIn?.moduleId, title]);

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

  const { showSuccess, showError } = useSnackbar();

  // Review confirmation modal state
  const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<{
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    content: string;
    willTriggerReview: boolean;
  } | null>(null);

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
      const triggeredReview =
        pendingSavePayload?.willTriggerReview ??
        (concept?.reviewStatus !== 'approved');

      if (triggeredReview) {
        showSuccess('Submitted for review.');
      } else {
        showSuccess('Concept updated');
      }

      queryClient.invalidateQueries({ queryKey: ['concepts'] });
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });

      // Bug 4 & 5: Redirect to the specific roadmap this concept belongs to
      if (parentRoadmapId) {
        router.push(`/instructor/content/${parentRoadmapId}`);
      } else {
        router.push('/instructor/content');
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const msg =
        axiosErr.response?.status === 403
          ? 'You do not have permission to edit this concept.'
          : axiosErr.response?.data?.message || 'Failed to update concept. Please try again.';
      setErrorMessage(msg);
      showError(msg);
    },
  });

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const willTriggerReview =
      concept?.reviewStatus !== 'approved' ||
      hasSignificantContentChange(concept?.content || '', content.trim(), 40);

    const payload = {
      title: title.trim(),
      difficulty,
      content: content.trim(),
      willTriggerReview,
    };

    if (willTriggerReview) {
      setPendingSavePayload(payload);
      setIsReviewConfirmOpen(true);
    } else {
      setPendingSavePayload(payload);
      updateConceptMutation.mutate({
        title: payload.title,
        difficulty: payload.difficulty,
        content: payload.content,
      });
    }
  };

  const handleConfirmReviewSubmit = () => {
    setIsReviewConfirmOpen(false);
    if (pendingSavePayload) {
      updateConceptMutation.mutate({
        title: pendingSavePayload.title,
        difficulty: pendingSavePayload.difficulty,
        content: pendingSavePayload.content,
      });
    }
  };

  const handleCancelReviewSubmit = () => {
    setIsReviewConfirmOpen(false);
    setPendingSavePayload(null);
  };

  // =========================================================================
  // MCQ QUIZ AUTHORING STATE & HANDLERS
  // =========================================================================
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [questionMode, setQuestionMode] = useState<'manual' | 'bulk_text'>('manual');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<Array<{ optionText: string; isCorrect: boolean }>>([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
  ]);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);

  // Bulk Text / JSON Auto-Mapper State
  const [bulkText, setBulkText] = useState(SAMPLE_QUIZ_JSON);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // AI Modal & Quota State
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    contextType: AiGenerationContextType;
    title?: string;
    subtitle?: string;
    error?: string | null;
  }>({
    isOpen: false,
    contextType: 'concept_content',
  });
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleCancelAiGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
  };

  const handleCloseAiError = () => {
    setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
  };

  const handleGenerateContent = async () => {
    if (!title.trim()) {
      showError('Please enter a concept title first.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAiModalState({
      isOpen: true,
      contextType: 'concept_content',
      title: 'Writing Concept Article',
      subtitle: `Drafting lesson for "${title.trim()}"`,
      error: null,
    });

    try {
      const res = await apiClient.post<{ content: string }>(
        '/ai-generate/concept-content',
        {
          title: title.trim(),
          difficulty,
          roadmapTitle: firstAppearsIn?.roadmapTitle || roadmapDetail?.title,
          roadmapDescription: roadmapDetail?.description || undefined,
          moduleTitle: firstAppearsIn?.moduleTitle,
          siblingConceptTitles,
        },
        { signal: controller.signal },
      );

      if (res.data?.content) {
        setContent(res.data.content);
        setQuotaRefreshKey((k) => k + 1);
        showSuccess('Concept article generated successfully!');
      }
      setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate concept article.';
      setAiModalState((prev) => ({ ...prev, error: msg }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleGenerateMcqs = async () => {
    const targetTitle = title.trim() || concept?.title;
    if (!targetTitle) {
      showError('Concept title is required.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAiModalState({
      isOpen: true,
      contextType: 'concept_mcqs',
      title: 'Generating Assessment MCQs',
      subtitle: `Formulating 5 questions for "${targetTitle}"`,
      error: null,
    });

    try {
      const res = await apiClient.post<{ rawText: string }>(
        '/ai-generate/concept-mcqs',
        {
          title: targetTitle,
          content: content.trim() || concept?.content || undefined,
        },
        { signal: controller.signal },
      );

      if (res.data?.rawText) {
        setBulkText(res.data.rawText);
        setQuotaRefreshKey((k) => k + 1);
        showSuccess('MCQs generated and loaded into Auto-Mapper!');
      }
      setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate MCQs.';
      setAiModalState((prev) => ({ ...prev, error: msg }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Live Swagger-style validation report
  const validationReport = React.useMemo(
    () => validateAndParseQuizText(bulkText, questions.length),
    [bulkText, questions.length],
  );

  // Copy sample template to clipboard
  const handleCopySampleFormat = () => {
    navigator.clipboard.writeText(SAMPLE_QUIZ_JSON);
    setIsCopied(true);
    showSuccess('Sample quiz JSON template copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Insert sample template into editor
  const handleLoadSampleTemplate = () => {
    setBulkText(SAMPLE_QUIZ_JSON);
    showSuccess('Sample template inserted.');
  };

  // Populate first question from bulk parser into manual builder
  const handleLoadIntoManualBuilder = (q: ParsedImportQuestion) => {
    setNewQuestionText(q.questionText);
    setNewOptions(q.options.map((o) => ({ optionText: o.optionText, isCorrect: o.isCorrect })));
    setQuestionMode('manual');
    showSuccess('Question loaded into manual builder!');
  };

  // Submit all valid parsed questions in one click
  const handleBulkImportSubmit = async () => {
    if (!validationReport.isValid || validationReport.questions.length === 0) {
      showError('Please resolve schema validation errors before importing.');
      return;
    }

    setIsSubmittingBulk(true);
    setBulkProgress({ current: 0, total: validationReport.questions.length });
    let createdCount = 0;

    try {
      for (let i = 0; i < validationReport.questions.length; i++) {
        const q = validationReport.questions[i];
        setBulkProgress({ current: i + 1, total: validationReport.questions.length });
        await apiClient.post(`/concepts/${conceptId}/questions`, q);
        createdCount++;
      }

      showSuccess(`Successfully imported and created ${createdCount} quiz questions!`);
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId, 'quiz-status'] });
      setIsAddingQuestion(false);
      setBulkText(SAMPLE_QUIZ_JSON);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to import some questions.';
      showError(msg);
      refetchQuestions();
    } finally {
      setIsSubmittingBulk(false);
      setBulkProgress(null);
    }
  };

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
      showSuccess('Quiz question created');
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId, 'quiz-status'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Failed to create question.';
      setQuizFormError(msg);
      showError(msg);
    },
  });

  const handleCreateQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);

    // Client-side Validation:
    if (!newQuestionText.trim()) {
      const msg = 'Question text cannot be empty.';
      setQuizFormError(msg);
      showError(msg);
      return;
    }
    if (newOptions.length < 2) {
      const msg = 'At least 2 options are required.';
      setQuizFormError(msg);
      showError(msg);
      return;
    }
    for (let i = 0; i < newOptions.length; i++) {
      if (!newOptions[i].optionText.trim()) {
        const msg = `Option ${i + 1} cannot be empty.`;
        setQuizFormError(msg);
        showError(msg);
        return;
      }
    }
    const correctCount = newOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      const msg = 'Exactly one option must be marked as the correct answer.';
      setQuizFormError(msg);
      showError(msg);
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
      showSuccess('Quiz question updated');
      refetchQuestions();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to update question text.');
    },
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
    onSuccess: () => {
      showSuccess('Correct answer updated');
      refetchQuestions();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to update option.');
    },
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/questions/${id}`)).data;
    },
    onSuccess: () => {
      showSuccess('Quiz question deleted');
      refetchQuestions();
      queryClient.invalidateQueries({ queryKey: ['concepts', conceptId, 'quiz-status'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete question.');
    },
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
      {/* Back Link & Student View Link & Quota */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={
            parentRoadmapId
              ? `/instructor/content/${parentRoadmapId}`
              : '/instructor/content'
          }
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {parentRoadmapId ? 'Back to Roadmap' : 'Back to Content Studio'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <AiQuotaBadge refreshTrigger={quotaRefreshKey} />
          <Link
            href={`/student/concepts/${conceptId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <span>Preview Student View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
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

      {/* Rejection Feedback Alert Banner */}
      {concept?.reviewStatus === 'rejected' && (
        <div className="p-4 rounded-2xl bg-red-tint border border-red/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-red">
            <AlertCircle className="w-4 h-4" />
            <span>Concept Rejected by Admin</span>
          </div>
          <p className="text-text-primary">
            <strong>Admin Feedback:</strong> {concept.rejectionReason || 'Please review and update the content before resubmitting.'}
          </p>
          <p className="text-text-secondary text-[11px]">
            Make your revisions below and submit to request admin re-review.
          </p>
        </div>
      )}

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
                className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition-all ${
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
            <div className="p-4 rounded-xl bg-red-tint border border-red/30 text-red text-xs font-medium flex items-center gap-2">
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
                  Concept Title <span className="text-red">*</span>
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Article Content (Markdown) <span className="text-red">*</span>
                </label>
                {content.trim() === '' && (
                  <button
                    type="button"
                    onClick={handleGenerateContent}
                    disabled={!title.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-tint text-accent border border-accent/20 hover:bg-accent hover:text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    title={
                      !title.trim()
                        ? 'Enter a concept title first'
                        : 'Generate concept article with AI'
                    }
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Generate Article</span>
                  </button>
                )}
              </div>

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
                          a: ({ href, children, ...props }) => {
                            const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
                            return (
                              <a
                                href={href}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                className="inline-flex items-center gap-1 font-semibold text-accent underline underline-offset-3 decoration-accent/50 hover:decoration-accent hover:text-accent/80 transition-colors"
                                {...props}
                              >
                                <span>{children}</span>
                                {isExternal && (
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                )}
                              </a>
                            );
                          },
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
            <div className="p-6 rounded-2xl bg-bg border border-accent/40 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">Add MCQ Questions</span>
                  <span className="text-xs text-text-secondary">
                    (Manual Builder or Swagger Text Auto-Mapper)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Tabs */}
                  <div className="flex items-center p-1 rounded-xl bg-surface border border-border">
                    <button
                      type="button"
                      onClick={() => setQuestionMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        questionMode === 'manual'
                          ? 'bg-accent text-white shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Manual Builder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionMode('bulk_text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        questionMode === 'bulk_text'
                          ? 'bg-accent text-white shadow-2xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Text / JSON Auto-Mapper</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MODE 1: MANUAL BUILDER */}
              {questionMode === 'manual' && (
                <form onSubmit={handleCreateQuestionSubmit} className="space-y-5">
                  {quizFormError && (
                    <div className="p-3.5 rounded-xl bg-red-tint border border-red/30 text-red text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{quizFormError}</span>
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                      Question Text <span className="text-red">*</span>
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
                              className="p-1 text-text-secondary hover:text-red rounded transition-colors cursor-pointer"
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
                      className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createQuestionMutation.isPending}
                      className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                    >
                      {createQuestionMutation.isPending ? 'Creating...' : 'Save Question'}
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: TEXT / JSON AUTO-MAPPER (SWAGGER-STYLE) */}
              {questionMode === 'bulk_text' && (
                <div className="space-y-5">
                  {/* Top Action Toolbar with Copy Sample */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-accent" />
                      <span className="text-xs font-semibold text-text-primary">
                        Auto-Mapper Schema Input (JSON or Plaintext QA)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Sample Button */}
                      <button
                        type="button"
                        onClick={handleCopySampleFormat}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg hover:bg-surface text-text-primary text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                        title="Copy sample JSON schema to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green" />
                            <span className="text-green">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-text-secondary" />
                            <span>Copy Sample Format</span>
                          </>
                        )}
                      </button>

                      {/* AI Generate MCQs Button */}
                      <button
                        type="button"
                        onClick={handleGenerateMcqs}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/30 bg-accent text-white hover:bg-accent/90 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                        title="Generate 5 assessment MCQs from concept article with AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Generate MCQs</span>
                      </button>

                      {/* Insert Template Button */}
                      <button
                        type="button"
                        onClick={handleLoadSampleTemplate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/30 bg-accent-tint/60 text-accent text-xs font-semibold transition-all cursor-pointer hover:bg-accent-tint"
                        title="Load sample template into editor"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Insert Template</span>
                      </button>

                      {/* Clear Button */}
                      <button
                        type="button"
                        onClick={() => setBulkText('')}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red hover:bg-red-tint/50 transition-colors cursor-pointer"
                        title="Clear input"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Text Editor + Swagger Schema Inspector */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Col: Code/Text Area */}
                    <div className="lg:col-span-7 space-y-2">
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Schema Definition Editor
                        </span>
                        <span>{bulkText.length} chars</span>
                      </div>

                      <textarea
                        rows={12}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Paste JSON array of questions, e.g.:\n[\n  {\n    "questionText": "What is Version Control?",\n    "options": [\n      { "optionText": "A change tracking system", "isCorrect": true },\n      { "optionText": "A compiler", "isCorrect": false }\n    ]\n  }\n]`}
                        className="w-full p-4 rounded-xl border border-border bg-surface font-mono text-xs text-text-primary leading-relaxed focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y shadow-2xs"
                      />
                    </div>

                    {/* Right Col: Swagger Live Schema Inspector & Status */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Swagger Schema Validation Box */}
                      <div className="p-4 rounded-xl bg-surface border border-border space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                            Swagger Schema Validator
                          </span>

                          {/* Status Badge */}
                          {validationReport.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-tint text-green text-xs font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Valid ({validationReport.totalValid} Ready)</span>
                            </span>
                          ) : validationReport.syntaxError ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-tint text-red text-xs font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Syntax Error</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-tint text-amber text-xs font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Schema Issues ({validationReport.errors.length})</span>
                            </span>
                          )}
                        </div>

                        {/* Error Messages List */}
                        {validationReport.errors.length > 0 ? (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {validationReport.errors.map((errStr, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2 rounded-lg bg-red-tint/50 border border-red/30 text-red text-xs flex items-start gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 flex-shrink-0" />
                                <span className="leading-tight">{errStr}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-green-tint/60 text-green text-xs flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>
                              All {validationReport.questions.length} question(s) strictly match the MCQ Swagger schema.
                            </span>
                          </div>
                        )}

                        {/* Expected Schema Constraints Summary */}
                        <div className="pt-2 border-t border-border/80 text-[11px] text-text-secondary space-y-1">
                          <p className="font-semibold text-text-primary text-xs">Schema Contract:</p>
                          <p>• <code>questionText</code>: required non-empty string</p>
                          <p>• <code>options</code>: minimum 2 options with <code>optionText</code></p>
                          <p>• <code>isCorrect</code>: exactly one option set to <code>true</code></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Visual Preview of Mapped Questions */}
                  {validationReport.questions.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Auto-Mapped Live Preview ({validationReport.questions.length} Questions)
                        </h4>
                        <span className="text-xs text-text-secondary">
                          Green badge indicates the correct answer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {validationReport.questions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-text-primary">
                                #{qIdx + 1}. {q.questionText}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleLoadIntoManualBuilder(q)}
                                className="text-[10px] font-semibold text-accent hover:underline flex-shrink-0 cursor-pointer"
                                title="Edit in manual builder"
                              >
                                Edit in Builder
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 ${
                                    opt.isCorrect
                                      ? 'bg-green-tint text-green font-semibold border border-green/30'
                                      : 'bg-bg text-text-secondary border border-border/60'
                                  }`}
                                >
                                  <span className="truncate">{opt.optionText}</span>
                                  {opt.isCorrect && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green text-white flex-shrink-0">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bulk Actions Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsAddingQuestion(false)}
                      className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!validationReport.isValid || isSubmittingBulk}
                        onClick={handleBulkImportSubmit}
                        className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          {isSubmittingBulk
                            ? `Saving Question ${bulkProgress?.current || 0}/${bulkProgress?.total || 0}...`
                            : `Import & Save All (${validationReport.questions.length} Questions)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                          className="p-1.5 text-text-secondary hover:text-red rounded-lg hover:bg-red-tint/50 transition-colors cursor-pointer"
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

      {/* AI Generating Modal */}
      <AiGeneratingModal
        isOpen={aiModalState.isOpen}
        contextType={aiModalState.contextType}
        title={aiModalState.title}
        subtitle={aiModalState.subtitle}
        error={aiModalState.error}
        onCancel={handleCancelAiGeneration}
        onCloseError={handleCloseAiError}
      />

      {/* Review Submission Confirmation Modal */}
      <ConfirmModal
        isOpen={isReviewConfirmOpen}
        title="Submit for Admin Review?"
        message="This concept will be submitted for admin review before it's visible to students. Continue?"
        confirmText="Continue & Submit"
        cancelText="Cancel"
        variant="primary"
        isLoading={updateConceptMutation.isPending}
        onConfirm={handleConfirmReviewSubmit}
        onCancel={handleCancelReviewSubmit}
      />
    </div>
  );
}
