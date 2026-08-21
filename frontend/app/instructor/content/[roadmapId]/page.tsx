'use client';

import React, { use, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Layers,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Search,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  FolderKanban,
  FilePlus,
  Link as LinkIcon,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User, getUser } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';
import { useAiStream } from '@/hooks/use-ai-stream';
import { AiGenerateButton } from '@/components/ai-generate-button';
import {
  AiGeneratingModal,
  AiGenerationContextType,
} from '@/components/ai-generating-modal';
import { AiQuotaBadge } from '@/components/ai-quota-badge';

interface PageProps {
  params: Promise<{ roadmapId: string }>;
}

interface ConceptSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  isAiGenerated?: boolean;
  rejectionReason?: string | null;
  questionCount?: number;
}

interface ModuleConcept {
  id: string;
  moduleId: string;
  conceptId: string;
  orderIndex: number;
  concept: ConceptSummary;
}

interface RoadmapModule {
  id: string;
  roadmapId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  moduleConcepts?: ModuleConcept[];
}

interface RoadmapDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdById: string | null;
  modules?: RoadmapModule[];
}

export default function RoadmapManagementPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roadmapId = resolvedParams.roadmapId;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { showSuccess, showError } = useSnackbar();

  // Current user query for role checks
  const { data: currentUser } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    initialData: () => getUser() || undefined,
  });

  const isAdmin = currentUser?.role === 'admin';

  // 1. Fetch full roadmap structure
  const {
    data: roadmap,
    isLoading,
    isError,
    refetch,
  } = useQuery<RoadDetailWithAuthor>({
    queryKey: ['roadmaps', roadmapId],
    queryFn: async () => (await apiClient.get<RoadDetailWithAuthor>(`/roadmaps/${roadmapId}`)).data,
  });

  type RoadDetailWithAuthor = RoadmapDetail;

  // Roadmap Edit State
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const {
    isStreaming: isStreamingRoadmapDesc,
    startStream: startRoadmapDescStream,
    abortStream: abortRoadmapDescStream,
  } = useAiStream();

  const handleGenerateEditDescription = () => {
    if (!editTitle.trim()) {
      showError('Please enter a roadmap title first.');
      return;
    }
    startRoadmapDescStream(
      '/ai-generate/roadmap-description',
      { title: editTitle.trim() },
      {
        onChunk: (_delta, accumulated) => {
          setEditDescription(accumulated);
        },
        onError: (err) => {
          showError(err);
        },
      },
    );
  };

  const updateRoadmapMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      return (await apiClient.patch(`/roadmaps/${roadmapId}`, payload)).data;
    },
    onSuccess: () => {
      setIsEditingDetails(false);
      showSuccess('Roadmap updated');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to update roadmap details.');
    },
  });

  // Delete Roadmap Mutation (Admin only)
  const [isDeleteRoadmapOpen, setIsDeleteRoadmapOpen] = useState(false);
  const deleteRoadmapMutation = useMutation({
    mutationFn: async () => {
      return (await apiClient.delete(`/roadmaps/${roadmapId}`)).data;
    },
    onSuccess: () => {
      showSuccess('Roadmap deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      router.push('/instructor/content');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete roadmap.');
    },
  });

  const handleStartEditDetails = () => {
    if (roadmap) {
      setEditTitle(roadmap.title);
      setEditDescription(roadmap.description || '');
      setIsEditingDetails(true);
    }
  };

  // Add Module State
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  const addModuleMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; orderIndex: number }) => {
      return (await apiClient.post(`/roadmaps/${roadmapId}/modules`, payload)).data;
    },
    onSuccess: () => {
      setIsAddingModule(false);
      setNewModuleTitle('');
      setNewModuleDesc('');
      showSuccess('Module added');
      refetch();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to add module.');
    },
  });

  // Module Edit State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [modEditTitle, setModEditTitle] = useState('');

  const editModuleMutation = useMutation({
    mutationFn: async ({ moduleId, title }: { moduleId: string; title: string }) => {
      return (await apiClient.patch(`/modules/${moduleId}`, { title })).data;
    },
    onSuccess: () => {
      setEditingModuleId(null);
      showSuccess('Module updated');
      refetch();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to rename module.');
    },
  });

  // Delete Module State & Mutation (Admin only)
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState<{
    isOpen: boolean;
    moduleId: string;
    title: string;
  }>({
    isOpen: false,
    moduleId: '',
    title: '',
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return (await apiClient.delete(`/modules/${moduleId}`)).data;
    },
    onSuccess: () => {
      showSuccess('Module deleted successfully');
      setDeleteModuleConfirm({ isOpen: false, moduleId: '', title: '' });
      refetch();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete module.');
    },
  });

  const handleDeleteModuleClick = (moduleItem: RoadmapModule) => {
    setDeleteModuleConfirm({
      isOpen: true,
      moduleId: moduleItem.id,
      title: moduleItem.title,
    });
  };

  // Detach Concept from Module State & Mutation
  const [detachConceptConfirm, setDetachConceptConfirm] = useState<{
    isOpen: boolean;
    moduleId: string;
    conceptId: string;
    conceptTitle: string;
  }>({
    isOpen: false,
    moduleId: '',
    conceptId: '',
    conceptTitle: '',
  });

  const removeConceptMutation = useMutation({
    mutationFn: async ({ moduleId, conceptId }: { moduleId: string; conceptId: string }) => {
      return (await apiClient.delete(`/modules/${moduleId}/concepts/${conceptId}`)).data;
    },
    onSuccess: () => {
      showSuccess('Concept detached from module');
      setDetachConceptConfirm({ isOpen: false, moduleId: '', conceptId: '', conceptTitle: '' });
      refetch();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to detach concept from module.');
    },
  });

  const handleDetachConceptClick = (moduleId: string, concept: ConceptSummary) => {
    setDetachConceptConfirm({
      isOpen: true,
      moduleId,
      conceptId: concept.id,
      conceptTitle: concept.title,
    });
  };

  // Search & Attach Existing Concept
  const [attachingModuleId, setAttachingModuleId] = useState<string | null>(null);
  const [conceptSearchQuery, setConceptSearchQuery] = useState('');
  const [selectedConceptId, setSelectedConceptId] = useState('');

  const { data: allConcepts = [] } = useQuery<ConceptSummary[]>({
    queryKey: ['concepts'],
    queryFn: async () => (await apiClient.get<ConceptSummary[]>('/concepts')).data,
    enabled: attachingModuleId !== null,
  });

  const attachConceptMutation = useMutation({
    mutationFn: async ({
      moduleId,
      conceptId,
      orderIndex,
    }: {
      moduleId: string;
      conceptId: string;
      orderIndex: number;
    }) => {
      return (
        await apiClient.post(`/modules/${moduleId}/concepts`, {
          conceptId,
          orderIndex,
        })
      ).data;
    },
    onSuccess: () => {
      setAttachingModuleId(null);
      setSelectedConceptId('');
      setConceptSearchQuery('');
      showSuccess('Concept attached to module');
      refetch();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to attach concept.');
    },
  });

  const searchResults = React.useMemo(() => {
    if (!conceptSearchQuery.trim()) return allConcepts.slice(0, 8);
    const q = conceptSearchQuery.toLowerCase();
    return allConcepts.filter((c) => c.title.toLowerCase().includes(q));
  }, [allConcepts, conceptSearchQuery]);

  // AI Cascading Generation & Modal State
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    contextType: AiGenerationContextType;
    title?: string;
    subtitle?: string;
    error?: string | null;
  }>({
    isOpen: false,
    contextType: 'modules',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleGenerateModules = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiModalState({
      isOpen: true,
      contextType: 'modules',
      title: 'Generating Curriculum Modules',
      subtitle: `Structuring modules for "${roadmap?.title}"`,
      error: null,
    });

    try {
      const res = await apiClient.post(
        '/ai-generate/roadmap-modules',
        { roadmapId },
        { signal: controller.signal },
      );
      setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
      setQuotaRefreshKey((k) => k + 1);
      const count = res.data?.count ?? 0;
      showSuccess(`Successfully generated ${count} modules!`);
      refetch();
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate modules.';
      setAiModalState((prev) => ({ ...prev, error: msg }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleGenerateConcepts = async (
    moduleId: string,
    moduleTitle: string,
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiModalState({
      isOpen: true,
      contextType: 'concepts',
      title: 'Generating Concepts & Full Content',
      subtitle: `Writing lessons for module "${moduleTitle}"`,
      error: null,
    });

    try {
      const res = await apiClient.post(
        '/ai-generate/module-concepts',
        { moduleId },
        { signal: controller.signal },
      );
      setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
      setQuotaRefreshKey((k) => k + 1);
      const count = res.data?.createdCount ?? 0;
      const skipped = res.data?.skippedCount ?? 0;
      showSuccess(
        `Generated ${count} concepts with full content${
          skipped > 0 ? ` (${skipped} skipped due to quota)` : ''
        }!`,
      );
      refetch();
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate concepts.';
      setAiModalState((prev) => ({ ...prev, error: msg }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleGenerateMcqs = async (moduleId: string, moduleTitle: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiModalState({
      isOpen: true,
      contextType: 'mcqs',
      title: 'Generating Assessment MCQs',
      subtitle: `Formulating quizzes for concepts in "${moduleTitle}"`,
      error: null,
    });

    try {
      const res = await apiClient.post(
        '/ai-generate/module-mcqs',
        { moduleId },
        { signal: controller.signal },
      );
      setAiModalState((prev) => ({ ...prev, isOpen: false, error: null }));
      setQuotaRefreshKey((k) => k + 1);
      const count = res.data?.generatedCount ?? 0;
      showSuccess(`Generated and attached MCQs for ${count} concepts!`);
      refetch();
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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-6 w-32 bg-surface rounded" />
        <div className="h-40 bg-surface rounded-2xl border border-border" />
        <div className="space-y-4">
          <div className="h-28 bg-surface rounded-2xl border border-border" />
          <div className="h-28 bg-surface rounded-2xl border border-border" />
        </div>
      </div>
    );
  }

  if (isError || !roadmap) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto bg-surface border border-border rounded-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-amber mx-auto" />
        <h2 className="text-lg font-bold font-display text-text-primary">Roadmap Not Found</h2>
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Content</span>
        </Link>
      </div>
    );
  }

  const modules = roadmap.modules || [];

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Back Link & Quota Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Content</span>
        </Link>

        <div className="flex items-center gap-3">
          <AiQuotaBadge refreshTrigger={quotaRefreshKey} />
          <Link
            href={`/student/roadmaps/${roadmap.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <span>Preview Student View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Roadmap Overview Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
        {isEditingDetails ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editTitle.trim()) {
                updateRoadmapMutation.mutate({
                  title: editTitle.trim(),
                  description: editDescription.trim() || undefined,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Description
                </label>
                {(editDescription.trim() === '' || isStreamingRoadmapDesc) && (
                  <AiGenerateButton
                    onClick={handleGenerateEditDescription}
                    isStreaming={isStreamingRoadmapDesc}
                    onAbort={abortRoadmapDescStream}
                    disabled={!editTitle.trim()}
                    title={
                      !editTitle.trim()
                        ? 'Enter a title first'
                        : 'Generate description with AI'
                    }
                    label="AI Generate"
                  />
                )}
              </div>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-accent resize-y"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={updateRoadmapMutation.isPending}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDetails(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Roadmap Syllabus</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
                {roadmap.title}
              </h1>
              {roadmap.description && (
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
                  {roadmap.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleStartEditDetails}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-text-primary hover:bg-bg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsDeleteRoadmapOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red/30 bg-surface text-red hover:bg-red-tint/50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Delete Roadmap (Admin only)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Roadmap</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modules Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-text-primary">
            Curriculum Modules ({modules.length})
          </h2>

          <div className="flex items-center gap-2">
            {modules.length >= 6 ? (
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border text-text-muted font-semibold text-xs opacity-60 cursor-not-allowed select-none"
                title="Module limit reached (6/6)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Module limit reached (6/6)</span>
              </span>
            ) : modules.length > 0 ? (
              <button
                type="button"
                onClick={handleGenerateModules}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-tint text-accent border border-accent/20 hover:bg-accent hover:text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                title={`Generate ${6 - modules.length} more curriculum module titles to reach the 6-module cap`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Generate {6 - modules.length} More Module{6 - modules.length > 1 ? 's' : ''} with AI
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateModules}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-tint text-accent border border-accent/20 hover:bg-accent hover:text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                title="Use AI to generate curriculum module titles for this roadmap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Modules with AI</span>
              </button>
            )}

            {modules.length < 6 && (
              <button
                onClick={() => setIsAddingModule(!isAddingModule)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Module Form Modal/Box */}
        {isAddingModule && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newModuleTitle.trim()) {
                addModuleMutation.mutate({
                  title: newModuleTitle.trim(),
                  description: newModuleDesc.trim() || undefined,
                  orderIndex: modules.length + 1,
                });
              }
            }}
            className="p-6 rounded-2xl bg-surface border border-accent/40 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">New Module</h3>
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="p-1 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                required
                placeholder="Module Title (e.g., Module 1: Foundations & Architecture)"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-xs sm:text-sm focus:outline-none focus:border-accent"
              />
              <textarea
                rows={2}
                placeholder="Module description or learning objectives (optional)..."
                value={newModuleDesc}
                onChange={(e) => setNewModuleDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-xs sm:text-sm focus:outline-none focus:border-accent resize-y"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newModuleTitle.trim() || addModuleMutation.isPending}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 cursor-pointer"
              >
                Save Module
              </button>
            </div>
          </form>
        )}

        {/* Modules List */}
        {modules.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-2xl space-y-2">
            <FolderKanban className="w-10 h-10 text-text-secondary/40 mx-auto" />
            <h3 className="font-bold text-text-primary">No Modules Yet</h3>
            <p className="text-xs text-text-secondary">
              Click &ldquo;Add Module&rdquo; above to structure your curriculum into units.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((moduleItem, modIdx) => {
              const conceptsInModule = (moduleItem.moduleConcepts || []).map((mc) => mc.concept).filter(Boolean);
              const hasConcepts = conceptsInModule.length > 0;
              const allHaveMcqs = hasConcepts && conceptsInModule.every((c) => (c.questionCount ?? 0) > 0);
              const needsMcqs = hasConcepts && !allHaveMcqs;
              const isEditingThisModule = editingModuleId === moduleItem.id;
              const isAttachingToThis = attachingModuleId === moduleItem.id;

              return (
                <div
                  key={moduleItem.id}
                  className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-4"
                >
                  {/* Module Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                    {isEditingThisModule ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (modEditTitle.trim()) {
                            editModuleMutation.mutate({
                              moduleId: moduleItem.id,
                              title: modEditTitle.trim(),
                            });
                          }
                        }}
                        className="flex items-center gap-2 flex-1"
                      >
                        <input
                          type="text"
                          required
                          value={modEditTitle}
                          onChange={(e) => setModEditTitle(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-sm flex-1 focus:outline-none focus:border-accent"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingModuleId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Module {modIdx + 1}
                        </span>
                        <h3 className="text-base font-bold font-display text-text-primary">
                          {moduleItem.title}
                        </h3>
                        {moduleItem.description && (
                          <p className="text-xs text-text-secondary">
                            {moduleItem.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions & Dynamic State Machine */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      {/* 0 Concepts */}
                      {!hasConcepts && (
                        <button
                          type="button"
                          onClick={() => handleGenerateConcepts(moduleItem.id, moduleItem.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                          title="Generate concept titles and full article content for this module"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Concepts with AI</span>
                        </button>
                      )}

                      {/* 1-5 Concepts (Under Cap) */}
                      {hasConcepts && conceptsInModule.length < 6 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleGenerateConcepts(moduleItem.id, moduleItem.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-tint text-accent border border-accent/20 hover:bg-accent hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                            title={`Generate ${6 - conceptsInModule.length} more concept articles to reach the 6-concept cap`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              Generate {6 - conceptsInModule.length} More Concept{6 - conceptsInModule.length > 1 ? 's' : ''} with AI
                            </span>
                          </button>

                          {needsMcqs ? (
                            <button
                              type="button"
                              onClick={() => handleGenerateMcqs(moduleItem.id, moduleItem.title)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-tint text-amber border border-amber/30 hover:bg-amber hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                              title="Generate assessment MCQs for concepts lacking quizzes"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Generate MCQs with AI</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-green bg-green-tint border border-green/20">
                              <Check className="w-3.5 h-3.5" />
                              <span>MCQs generated</span>
                            </span>
                          )}
                        </>
                      )}

                      {/* 6 Concepts (Cap Reached) */}
                      {conceptsInModule.length >= 6 && (
                        <>
                          {allHaveMcqs ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-green bg-green-tint border border-green/20">
                              <Check className="w-3.5 h-3.5" />
                              <span>Fully generated ✓</span>
                            </span>
                          ) : (
                            <>
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-text-muted bg-surface border border-border cursor-not-allowed opacity-75 select-none"
                                title="Concept limit reached (6/6)"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Concept limit reached (6/6)</span>
                              </span>

                              {needsMcqs && (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateMcqs(moduleItem.id, moduleItem.title)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-tint text-amber border border-amber/30 hover:bg-amber hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                  title="Generate assessment MCQs for concepts lacking quizzes"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Generate MCQs with AI</span>
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => {
                          setEditingModuleId(moduleItem.id);
                          setModEditTitle(moduleItem.title);
                        }}
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
                        title="Rename module"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteModuleClick(moduleItem)}
                          className="p-1.5 text-text-secondary hover:text-red hover:bg-red-tint/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete module (Admin only)"
                          aria-label="Delete module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attached Concepts List */}
                  <div className="space-y-2.5">
                    {conceptsInModule.length === 0 ? (
                      <p className="text-xs text-text-secondary/60 italic py-2">
                        No concepts attached to this module yet.
                      </p>
                    ) : (
                      conceptsInModule.map((c, cIdx) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl border border-border bg-bg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-surface border border-border text-[10px] font-bold text-text-secondary flex items-center justify-center flex-shrink-0">
                              {cIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-text-primary truncate">
                                  {c.title}
                                </h4>

                                {c.isAiGenerated && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-accent-tint text-accent border border-accent/20 flex-shrink-0"
                                    title="Generated with AI"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>AI</span>
                                  </span>
                                )}

                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                    c.difficulty === 'easy'
                                      ? 'bg-green-tint text-green'
                                      : c.difficulty === 'medium'
                                      ? 'bg-amber-tint text-amber'
                                      : 'bg-accent-tint text-accent'
                                  }`}
                                >
                                  {c.difficulty}
                                </span>

                                {/* Review Status Badge */}
                                {c.reviewStatus === 'approved' ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-tint text-green border border-green/20 flex-shrink-0"
                                    title="Approved & Live for students"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Approved</span>
                                  </span>
                                ) : c.reviewStatus === 'rejected' ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-tint text-red border border-red/30 flex-shrink-0 cursor-help"
                                    title={
                                      c.rejectionReason
                                        ? `Rejected by Admin: "${c.rejectionReason}"`
                                        : 'Rejected by Admin. Please update and resubmit.'
                                    }
                                  >
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    <span>Rejected</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-tint text-amber border border-amber/30 flex-shrink-0"
                                    title="Pending Admin Review before student publication"
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Pending Review</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                            {c.reviewStatus === 'rejected' ? (
                              <Link
                                href={`/instructor/concepts/${c.id}/edit`}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-tint text-red border border-red/30 hover:bg-red hover:text-white font-bold text-[11px] transition-all shadow-2xs cursor-pointer"
                                title="Edit concept and resubmit for admin review"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit &amp; Resubmit</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/instructor/concepts/${c.id}/edit`}
                                className="px-2.5 py-1 rounded-lg border border-border bg-surface text-text-primary hover:bg-bg font-semibold text-[11px]"
                              >
                                Edit Article
                              </Link>
                            )}
                            <button
                              onClick={() => handleDetachConceptClick(moduleItem.id, c)}
                              className="p-1 text-text-secondary hover:text-red rounded-md transition-colors cursor-pointer"
                              title="Detach concept from module"
                              aria-label="Detach concept"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Attach / Create Concept for this Module */}
                  {isAttachingToThis ? (
                    <div className="p-4 rounded-xl border border-accent/30 bg-accent-tint/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">
                          Attach Existing Concept
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachingModuleId(null);
                            setSelectedConceptId('');
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-3" />
                          <input
                            type="text"
                            value={conceptSearchQuery}
                            onChange={(e) => setConceptSearchQuery(e.target.value)}
                            placeholder="Search concepts by title..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-accent"
                          />
                        </div>

                        <select
                          value={selectedConceptId}
                          onChange={(e) => setSelectedConceptId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="">-- Choose a concept to attach --</option>
                          {searchResults.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.title} ({sc.difficulty})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAttachingModuleId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!selectedConceptId || attachConceptMutation.isPending}
                          onClick={() => {
                            if (selectedConceptId) {
                              attachConceptMutation.mutate({
                                moduleId: moduleItem.id,
                                conceptId: selectedConceptId,
                                orderIndex: conceptsInModule.length + 1,
                              });
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                        >
                          Attach Concept
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setAttachingModuleId(moduleItem.id);
                          setConceptSearchQuery('');
                          setSelectedConceptId('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Attach Existing Concept</span>
                      </button>

                      <span className="text-text-secondary text-xs">•</span>

                      <Link
                        href={`/instructor/concepts/new?moduleId=${moduleItem.id}&roadmapId=${roadmap.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Concept for this Module</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Roadmap Confirmation Modal (Admin only) */}
      <ConfirmModal
        isOpen={isDeleteRoadmapOpen}
        title="Delete Roadmap"
        message={`Are you sure you want to permanently delete roadmap "${roadmap.title}"? All its modules and structured syllabi will be removed.`}
        confirmText="Delete Roadmap"
        variant="danger"
        isLoading={deleteRoadmapMutation.isPending}
        onConfirm={() => deleteRoadmapMutation.mutate()}
        onCancel={() => setIsDeleteRoadmapOpen(false)}
      />

      {/* Delete Module Confirmation Modal (Admin only) */}
      <ConfirmModal
        isOpen={deleteModuleConfirm.isOpen}
        title="Delete Module"
        message={`Are you sure you want to permanently delete module "${deleteModuleConfirm.title}"? All concept attachments inside this module will be detached.`}
        confirmText="Delete Module"
        variant="danger"
        isLoading={deleteModuleMutation.isPending}
        onConfirm={() => deleteModuleMutation.mutate(deleteModuleConfirm.moduleId)}
        onCancel={() => setDeleteModuleConfirm({ isOpen: false, moduleId: '', title: '' })}
      />

      {/* Detach Concept Confirmation Modal */}
      <ConfirmModal
        isOpen={detachConceptConfirm.isOpen}
        title="Detach Concept from Module"
        message={`Are you sure you want to detach "${detachConceptConfirm.conceptTitle}" from this module? The concept itself will remain preserved in your content library.`}
        confirmText="Detach Concept"
        variant="warning"
        isLoading={removeConceptMutation.isPending}
        onConfirm={() =>
          removeConceptMutation.mutate({
            moduleId: detachConceptConfirm.moduleId,
            conceptId: detachConceptConfirm.conceptId,
          })
        }
        onCancel={() =>
          setDetachConceptConfirm({
            isOpen: false,
            moduleId: '',
            conceptId: '',
            conceptTitle: '',
          })
        }
      />

      {/* AI Cascading Generation Modal */}
      <AiGeneratingModal
        isOpen={aiModalState.isOpen}
        contextType={aiModalState.contextType}
        title={aiModalState.title}
        subtitle={aiModalState.subtitle}
        error={aiModalState.error}
        onCancel={handleCancelAiGeneration}
        onCloseError={handleCloseAiError}
      />
    </div>
  );
}
