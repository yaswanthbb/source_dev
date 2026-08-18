'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Eye,
  Edit3,
  Code2,
  AlertCircle,
  GitMerge,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { AiGeneratingModal } from '@/components/ai-generating-modal';
import { AiQuotaBadge } from '@/components/ai-quota-badge';
import { useSnackbar } from '@/providers/snackbar-provider';

interface ConceptSummary {
  id: string;
  title: string;
  slug?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ModuleConceptItem {
  id: string;
  moduleId: string;
  conceptId: string;
  orderIndex: number;
  concept: ConceptSummary;
}

interface RoadmapModuleItem {
  id: string;
  roadmapId: string;
  title: string;
  orderIndex: number;
  moduleConcepts?: ModuleConceptItem[];
}

interface RoadmapData {
  id: string;
  title: string;
  description?: string | null;
  modules?: RoadmapModuleItem[];
}

export default function CreateConceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const moduleId = searchParams.get('moduleId');
  const roadmapIdParam = searchParams.get('roadmapId');

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Modal & Quota State
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Module-Scoped Prerequisite State
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] = useState<string>('');
  const [hasInitializedAutoPrereq, setHasInitializedAutoPrereq] = useState(false);

  // 1. Resolve roadmapId: directly from query param or fallback lookup
  const [inferredRoadmapId, setInferredRoadmapId] = useState<string | null>(roadmapIdParam);

  useEffect(() => {
    if (roadmapIdParam) {
      setInferredRoadmapId(roadmapIdParam);
    } else if (moduleId && !inferredRoadmapId) {
      apiClient
        .get<RoadmapData[]>('/roadmaps')
        .then((res) => {
          const found = res.data.find((r) =>
            (r.modules || []).some((m) => m.id === moduleId),
          );
          if (found) {
            setInferredRoadmapId(found.id);
          }
        })
        .catch(() => {});
    }
  }, [roadmapIdParam, moduleId, inferredRoadmapId]);

  // 2. Fetch full Roadmap DETAIL directly by ID (GET /roadmaps/:id includes moduleConcepts and concepts)
  const { data: roadmapDetail } = useQuery<RoadmapData>({
    queryKey: ['roadmaps', inferredRoadmapId, 'detail'],
    queryFn: async () => {
      if (!inferredRoadmapId) throw new Error('No roadmap ID');
      return (await apiClient.get<RoadmapData>(`/roadmaps/${inferredRoadmapId}`)).data;
    },
    enabled: Boolean(inferredRoadmapId),
  });

  // Target module and its existing concepts (strictly in the same module)
  const { targetModule, conceptsInCurrentModule, targetModuleName, targetModuleOrderIndex } = useMemo(() => {
    if (!roadmapDetail || !moduleId) {
      return {
        targetModule: null,
        conceptsInCurrentModule: [],
        targetModuleName: '',
        targetModuleOrderIndex: 1,
      };
    }

    const mod = (roadmapDetail.modules || []).find((m) => m.id === moduleId);
    if (!mod) {
      return {
        targetModule: null,
        conceptsInCurrentModule: [],
        targetModuleName: '',
        targetModuleOrderIndex: 1,
      };
    }

    const concepts = [...(mod.moduleConcepts || [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((mc) => mc.concept)
      .filter(Boolean);

    return {
      targetModule: mod,
      conceptsInCurrentModule: concepts,
      targetModuleName: mod.title,
      targetModuleOrderIndex: concepts.length + 1,
    };
  }, [roadmapDetail, moduleId]);

  // Single immediately-preceding concept in this module
  const immediatelyPrecedingConcept = useMemo(() => {
    if (conceptsInCurrentModule.length === 0) return null;
    return conceptsInCurrentModule[conceptsInCurrentModule.length - 1];
  }, [conceptsInCurrentModule]);

  // Auto-suggest ONLY the single immediately-preceding concept by default
  useEffect(() => {
    if (!hasInitializedAutoPrereq && immediatelyPrecedingConcept) {
      setSelectedPrerequisiteId(immediatelyPrecedingConcept.id);
      setHasInitializedAutoPrereq(true);
    }
  }, [immediatelyPrecedingConcept, hasInitializedAutoPrereq]);

  const createConceptMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      content: string;
      difficulty: 'easy' | 'medium' | 'hard';
      prerequisiteConceptId: string | null;
    }) => {
      // 1. Create concept
      const res = await apiClient.post<{ id: string }>('/concepts', {
        title: payload.title,
        content: payload.content,
        difficulty: payload.difficulty,
      });
      const newConcept = res.data;

      // 2. Auto-attach to module if moduleId was passed
      if (moduleId) {
        await apiClient.post(`/modules/${moduleId}/concepts`, {
          conceptId: newConcept.id,
        });

        // 3. Link module-scoped prerequisite if selected
        if (payload.prerequisiteConceptId) {
          try {
            await apiClient.post(
              `/modules/${moduleId}/concepts/${newConcept.id}/prerequisites`,
              {
                prerequisiteConceptId: payload.prerequisiteConceptId,
              },
            );
          } catch {
            // Non-blocking if prerequisite linking encounters an issue
          }
        }
      }

      return newConcept;
    },
    onSuccess: (newConcept) => {
      showSuccess('Concept created and attached successfully');
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      if (inferredRoadmapId) {
        router.push(`/instructor/content/${inferredRoadmapId}`);
      } else {
        router.push(`/instructor/concepts/${newConcept.id}/edit`);
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Failed to create concept. Please try again.';
      setErrorMessage(msg);
      showError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);

    createConceptMutation.mutate({
      title: title.trim(),
      difficulty,
      content: content.trim(),
      prerequisiteConceptId: selectedPrerequisiteId ? selectedPrerequisiteId : null,
    });
  };

  const handleCancelAiGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAiModalOpen(false);
    setAiError(null);
  };

  const handleGenerateContent = async () => {
    if (!title.trim()) {
      showError('Please enter a concept title first.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsAiModalOpen(true);
    setAiError(null);

    try {
      const res = await apiClient.post<{ content: string }>(
        '/ai-generate/concept-content',
        {
          title: title.trim(),
          difficulty,
          roadmapTitle: roadmapDetail?.title,
          roadmapDescription: roadmapDetail?.description || undefined,
          moduleTitle: targetModuleName || undefined,
          siblingConceptTitles: conceptsInCurrentModule.map((c) => c.title),
        },
        { signal: controller.signal },
      );

      if (res.data?.content) {
        setContent(res.data.content);
        setQuotaRefreshKey((k) => k + 1);
        showSuccess('Concept article generated successfully!');
      }
      setIsAiModalOpen(false);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate concept article.';
      setAiError(msg);
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back Navigation & Quota Badge */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={
            inferredRoadmapId
              ? `/instructor/content/${inferredRoadmapId}`
              : '/instructor/content'
          }
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {inferredRoadmapId ? 'Back to Roadmap' : 'Back to Content Studio'}
          </span>
        </Link>

        <AiQuotaBadge refreshTrigger={quotaRefreshKey} />
      </div>

      {/* Editor Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Concept Authoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
              Create New Concept Article
            </h1>
            {targetModuleName && (
              <p className="text-xs text-accent font-medium mt-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  Adding concept #{targetModuleOrderIndex} into module &ldquo;{targetModuleName}&rdquo;
                </span>
              </p>
            )}
          </div>

          {/* View Tab Toggle */}
          <div className="flex items-center gap-1 p-1 bg-bg border border-border rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'write' ? 'bg-surface text-accent shadow-xs' : 'text-text-secondary'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'split' ? 'bg-surface text-accent shadow-xs' : 'text-text-secondary'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Controls */}
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
                placeholder="e.g., Working with Git Branches & Merge Workflows"
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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-accent transition-all cursor-pointer"
              >
                <option value="easy">Easy (10 XP)</option>
                <option value="medium">Medium (20 XP)</option>
                <option value="hard">Hard (35 XP)</option>
              </select>
            </div>
          </div>

          {/* Module-Scoped Prerequisite Configuration Section */}
          {moduleId && targetModule && (
            <div className="p-5 sm:p-6 rounded-2xl bg-bg border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Module Prerequisite
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Select an immediately preceding concept in &ldquo;{targetModuleName}&rdquo; that students should study before this one.
                  </p>
                </div>

                {immediatelyPrecedingConcept && selectedPrerequisiteId === immediatelyPrecedingConcept.id && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-tint/50 text-amber border border-amber/30 text-[11px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber" />
                    <span>Auto-suggested Preceding Concept</span>
                  </div>
                )}
              </div>

              {conceptsInCurrentModule.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-surface text-center">
                  <p className="text-xs text-text-secondary">
                    This is the 1st concept in module &ldquo;{targetModuleName}&rdquo;. No prerequisite is needed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedPrerequisiteId}
                    onChange={(e) => setSelectedPrerequisiteId(e.target.value)}
                    className="w-full max-w-lg px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="">None (No prerequisite for this concept)</option>
                    {conceptsInCurrentModule.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        Concept #{idx + 1}: {c.title} ({c.difficulty})
                        {c.id === immediatelyPrecedingConcept?.id ? ' — [Suggested]' : ''}
                      </option>
                    ))}
                  </select>

                  {selectedPrerequisiteId && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-green" />
                      <span>
                        Students will be advised to complete{' '}
                        <strong className="text-text-primary">
                          {conceptsInCurrentModule.find((c) => c.id === selectedPrerequisiteId)?.title}
                        </strong>{' '}
                        first within this module.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Markdown Content Area */}
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
              {/* Markdown Editor Input */}
              {(activeTab === 'write' || activeTab === 'split') && (
                <div className="space-y-1">
                  <textarea
                    required
                    rows={18}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`## Introduction\nExplain the concept here...\n\n### Code Example\n\`\`\`bash\ngit checkout -b feature/login\n\`\`\`\n\n### Key Takeaways\n- Point 1\n- Point 2`}
                    className="w-full p-4 rounded-xl border border-border bg-bg font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-all resize-y"
                  />
                </div>
              )}

              {/* Live Preview Container */}
              {(activeTab === 'preview' || activeTab === 'split') && (
                <div className="p-5 rounded-xl border border-border bg-surface/50 overflow-y-auto max-h-[480px] prose prose-neutral text-xs sm:text-sm">
                  {content.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
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

          {/* Form Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Link
              href={
                inferredRoadmapId
                  ? `/instructor/content/${inferredRoadmapId}`
                  : '/instructor/content'
              }
              className="px-5 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-semibold text-xs hover:bg-bg transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || createConceptMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {createConceptMutation.isPending ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish Concept</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Generating Loading Modal */}
      <AiGeneratingModal
        isOpen={isAiModalOpen}
        contextType="concept_content"
        title="Writing Concept Article"
        subtitle={title ? `Drafting lesson for "${title}"` : undefined}
        error={aiError}
        onCancel={handleCancelAiGeneration}
        onCloseError={() => {
          setIsAiModalOpen(false);
          setAiError(null);
        }}
      />
    </div>
  );
}
