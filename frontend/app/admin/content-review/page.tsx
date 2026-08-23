'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ClipboardCheck,
  Check,
  X,
  Sparkles,
  User as UserIcon,
  BookOpen,
  HelpCircle,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';

interface Placement {
  roadmapId?: string;
  roadmapTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  orderIndex?: number;
}

interface McqOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface McqQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  options: McqOption[];
}

interface PendingConcept {
  id: string;
  title: string;
  slug: string;
  content: string;
  difficulty: string;
  reviewStatus: string;
  isAiGenerated: boolean;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
  placements: Placement[];
  questions: McqQuestion[];
}

export default function AdminContentReviewPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'manual'>('all');
  const [expandedContentIds, setExpandedContentIds] = useState<Set<string>>(new Set());
  const [expandedMcqIds, setExpandedMcqIds] = useState<Set<string>>(new Set());

  // Rejection dialog state
  const [rejectingConcept, setRejectingConcept] = useState<PendingConcept | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isManualRotating, setIsManualRotating] = useState(false);

  const {
    data: pendingConcepts = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<PendingConcept[]>({
    queryKey: ['admin', 'content-review', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get<PendingConcept[]>('/admin/content-review/pending');
      return response.data;
    },
    staleTime: 10000,
  });

  const handleRefreshQueue = async () => {
    setIsManualRotating(true);
    await refetch();
    setTimeout(() => setIsManualRotating(false), 650);
  };

  const approveMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      const res = await apiClient.patch(`/admin/content-review/${conceptId}/approve`);
      return res.data;
    },
    onSuccess: (_, conceptId) => {
      const concept = pendingConcepts.find((c) => c.id === conceptId);
      showSuccess(`Approved "${concept?.title || 'Concept'}" — now live for students.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-review', 'pending'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to approve concept');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ conceptId, reason }: { conceptId: string; reason: string }) => {
      const res = await apiClient.patch(`/admin/content-review/${conceptId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      showSuccess('Concept rejected with feedback provided to author.');
      setRejectingConcept(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-review', 'pending'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to reject concept');
    },
  });


  const toggleContentExpand = (id: string) => {
    setExpandedContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMcqExpand = (id: string) => {
    setExpandedMcqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredConcepts = pendingConcepts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.author?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.author?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.placements.some((p) => p.roadmapTitle?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'ai') return c.isAiGenerated;
    if (filterType === 'manual') return !c.isAiGenerated;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-text-primary">
              Content Review Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-tint text-amber border border-amber/30">
              {pendingConcepts.length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Review and approve instructor and AI-generated concepts and quizzes before they go live for students.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshQueue}
          disabled={isFetching || isManualRotating}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-bg text-xs font-semibold text-text-primary cursor-pointer transition-colors shadow-xs disabled:opacity-75"
          title="Reload pending review queue"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isFetching || isManualRotating ? 'animate-spin' : ''
            }`}
          />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by concept title, author, roadmap..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-bg text-xs sm:text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-bg text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            All ({pendingConcepts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ai')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'ai'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-bg text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Generated ({pendingConcepts.filter((c) => c.isAiGenerated).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('manual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'manual'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-bg text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            Manual ({pendingConcepts.filter((c) => !c.isAiGenerated).length})
          </button>
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-surface border border-border h-48" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl bg-surface border border-border text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber mx-auto" />
          <h3 className="text-sm font-bold text-text-primary">Failed to load review queue</h3>
          <p className="text-xs text-text-secondary">Please check your network connection and try again.</p>
        </div>
      ) : filteredConcepts.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-green-tint text-green flex items-center justify-center mx-auto border border-green/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">All Caught Up!</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            There are no concepts currently awaiting admin approval. New instructor edits or AI generations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredConcepts.map((concept) => {
            const isContentExpanded = expandedContentIds.has(concept.id);
            const isMcqExpanded = expandedMcqIds.has(concept.id);

            return (
              <div
                key={concept.id}
                className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-5 transition-all hover:border-border/80"
              >
                {/* Concept Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-4">
                  <div className="space-y-1.5">
                    {/* Breadcrumbs */}
                    {concept.placements.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary flex-wrap">
                        <FolderKanban className="w-3.5 h-3.5 text-accent" />
                        <span>{concept.placements[0].roadmapTitle || 'Roadmap'}</span>
                        <span>/</span>
                        <span>{concept.placements[0].moduleTitle || 'Module'}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        Standalone Concept
                      </span>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold font-display text-text-primary">
                        {concept.title}
                      </h3>

                      {/* AI vs Manual Badge */}
                      {concept.isAiGenerated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-tint text-accent border border-accent/20">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Generated</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface border border-border text-text-secondary">
                          <UserIcon className="w-3 h-3" />
                          <span>Manual Author</span>
                        </span>
                      )}

                      {/* Difficulty Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          concept.difficulty === 'easy'
                            ? 'bg-green-tint text-green border border-green/20'
                            : concept.difficulty === 'medium'
                            ? 'bg-amber-tint text-amber border border-amber/20'
                            : 'bg-accent-tint text-accent border border-accent/20'
                        }`}
                      >
                        {concept.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                      <span>Author: <strong className="text-text-primary">{concept.author?.name || 'Instructor'}</strong> ({concept.author?.email || 'N/A'})</span>
                      <span>•</span>
                      <span>Submitted: {new Date(concept.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setRejectingConcept(concept)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-tint text-red border border-red/30 hover:bg-red hover:text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(concept.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green text-white font-semibold text-xs hover:bg-green/90 transition-all shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                </div>

                {/* Article Content Preview */}
                <div className="rounded-xl border border-border/80 bg-bg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-bold text-text-primary">
                        Article Content ({concept.content?.length || 0} characters)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleContentExpand(concept.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      <span>{isContentExpanded ? 'Collapse' : 'Expand Full Article'}</span>
                      {isContentExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div
                    className={`prose prose-sm dark:prose-invert max-w-none text-text-primary overflow-hidden transition-all ${
                      isContentExpanded ? 'max-h-none' : 'max-h-36 relative'
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {concept.content || '*(No content provided)*'}
                    </ReactMarkdown>

                    {!isContentExpanded && (
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Assessment MCQs Preview */}
                <div className="rounded-xl border border-border/80 bg-bg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber" />
                      <h4 className="text-xs font-bold text-text-primary">
                        Assessment Quiz ({concept.questions?.length || 0} Questions)
                      </h4>
                    </div>
                    {concept.questions && concept.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleMcqExpand(concept.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <span>{isMcqExpanded ? 'Hide Questions' : 'View Questions & Answers'}</span>
                        {isMcqExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {(!concept.questions || concept.questions.length === 0) ? (
                    <p className="text-xs text-text-secondary/70 italic">
                      No MCQ questions attached to this concept yet.
                    </p>
                  ) : isMcqExpanded ? (
                    <div className="space-y-4 pt-2">
                      {concept.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3.5 rounded-xl border border-border bg-surface space-y-2.5">
                          <p className="text-xs font-bold text-text-primary">
                            <span className="text-accent mr-1">Q{qIdx + 1}:</span> {q.questionText}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={opt.id || oIdx}
                                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                                  opt.isCorrect
                                    ? 'bg-green-tint/60 border-green/40 text-green font-semibold'
                                    : 'bg-bg border-border text-text-secondary'
                                }`}
                              >
                                <span className="font-mono text-[10px] uppercase font-bold mt-0.5">
                                  {String.fromCharCode(65 + oIdx)})
                                </span>
                                <span className="flex-1">{opt.optionText}</span>
                                {opt.isCorrect && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green flex-shrink-0">
                                    <Check className="w-3 h-3" /> Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary">
                      {concept.questions.length} question{concept.questions.length > 1 ? 's' : ''} ready. Click &ldquo;View Questions & Answers&rdquo; to inspect options.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal / Dialog */}
      {rejectingConcept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red" />
                <h3 className="text-base font-bold text-text-primary">
                  Reject Concept
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingConcept(null)}
                className="p-1 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Provide specific feedback explaining why <strong>&ldquo;{rejectingConcept.title}&rdquo;</strong> was rejected. The instructor will see this feedback on their dashboard so they can revise and resubmit.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Rejection Reason / Feedback:
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Please add practical code snippets and verify that the macOS command flags match the current Homebrew version."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-xs sm:text-sm focus:outline-none focus:border-red resize-y"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingConcept(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold cursor-pointer hover:bg-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({
                    conceptId: rejectingConcept.id,
                    reason: rejectionReason.trim(),
                  })
                }
                className="px-4 py-2 rounded-xl bg-red text-white text-xs font-semibold hover:bg-red/90 cursor-pointer disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
