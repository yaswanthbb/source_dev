'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  ArrowRight,
  BookOpen,
  Edit,
  ExternalLink,
  FolderKanban,
  FileText,
  Trash2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { User, getUser } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';

interface RoadmapItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdById?: string;
  moduleCount?: number;
  modules?: Array<{
    id: string;
    title: string;
    moduleConcepts?: Array<{ id: string }>;
  }>;
}

interface ConceptItem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  authorId: string;
  createdAt: string;
}

export default function InstructorContentDirectoryPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
    initialData: () => getUser() || undefined,
  });

  const isAdmin = currentUser?.role === 'admin';

  // 1. Fetch all roadmaps & filter to current instructor
  const {
    data: allRoadmaps = [],
    isLoading: roadmapsLoading,
    refetch: refetchRoadmaps,
  } = useQuery<RoadmapItem[]>({
    queryKey: ['roadmaps'],
    queryFn: async () => (await apiClient.get<RoadmapItem[]>('/roadmaps')).data,
  });

  // Filter client-side by author ID (admin sees all)
  const myRoadmaps = React.useMemo(() => {
    if (!currentUser?.id) return allRoadmaps;
    if (currentUser.role === 'admin') return allRoadmaps;
    return allRoadmaps.filter((r) => r.createdById === currentUser.id);
  }, [allRoadmaps, currentUser]);

  // 2. Fetch all authored concepts
  const {
    data: allConcepts = [],
    isLoading: conceptsLoading,
    refetch: refetchConcepts,
  } = useQuery<ConceptItem[]>({
    queryKey: ['concepts'],
    queryFn: async () => (await apiClient.get<ConceptItem[]>('/concepts')).data,
  });

  const myConcepts = React.useMemo(() => {
    if (!currentUser?.id) return allConcepts;
    if (currentUser.role === 'admin') return allConcepts;
    return allConcepts.filter((c) => c.authorId === currentUser.id);
  }, [allConcepts, currentUser]);

  // Delete Roadmap (Admin only)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    roadmapId: string;
    title: string;
  }>({
    isOpen: false,
    roadmapId: '',
    title: '',
  });

  const deleteRoadmapMutation = useMutation({
    mutationFn: async (roadmapId: string) => {
      return (await apiClient.delete(`/roadmaps/${roadmapId}`)).data;
    },
    onSuccess: () => {
      showSuccess('Roadmap deleted successfully');
      setDeleteConfirm({ isOpen: false, roadmapId: '', title: '' });
      refetchRoadmaps();
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete roadmap.');
    },
  });

  const handleDeleteRoadmapClick = (roadmap: RoadmapItem) => {
    setDeleteConfirm({
      isOpen: true,
      roadmapId: roadmap.id,
      title: roadmap.title,
    });
  };

  // Delete Concept (Admin only)
  const [deleteConceptConfirm, setDeleteConceptConfirm] = useState<{
    isOpen: boolean;
    conceptId: string;
    title: string;
  }>({
    isOpen: false,
    conceptId: '',
    title: '',
  });

  const deleteConceptMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      return (await apiClient.delete(`/concepts/${conceptId}`)).data;
    },
    onSuccess: () => {
      showSuccess('Concept deleted successfully');
      setDeleteConceptConfirm({ isOpen: false, conceptId: '', title: '' });
      refetchConcepts();
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete concept.');
    },
  });

  const handleDeleteConceptClick = (concept: ConceptItem) => {
    setDeleteConceptConfirm({
      isOpen: true,
      conceptId: concept.id,
      title: concept.title,
    });
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Curriculum Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            My Content
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Manage your learning roadmaps, modular syllabi, and concept articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/instructor/concepts/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-semibold text-xs hover:bg-bg transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Concept</span>
          </Link>
          <Link
            href="/instructor/content/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Roadmaps Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <span>Authored Roadmaps</span>
          </h2>
          <span className="text-xs text-text-secondary">
            {myRoadmaps.length} roadmap{myRoadmaps.length !== 1 ? 's' : ''}
          </span>
        </div>

        {roadmapsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-surface border border-border animate-pulse h-48"
              />
            ))}
          </div>
        ) : myRoadmaps.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-2xl space-y-3">
            <Layers className="w-10 h-10 text-text-secondary/40 mx-auto" />
            <h3 className="font-bold text-text-primary">No Roadmaps Authored Yet</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Create your first structured curriculum to start adding modules and concepts for students.
            </p>
            <Link
              href="/instructor/content/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90"
            >
              <Plus className="w-4 h-4" />
              <span>Create Roadmap</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRoadmaps.map((roadmap) => {
              const moduleCount = roadmap.modules?.length ?? roadmap.moduleCount ?? 0;
              const totalConcepts = (roadmap.modules || []).reduce(
                (sum, m) => sum + (m.moduleConcepts?.length || 0),
                0,
              );

              return (
                <div
                  key={roadmap.id}
                  className="p-6 rounded-2xl bg-surface border border-border hover:border-accent/40 shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      Curriculum
                    </span>
                    <h3 className="text-lg font-bold font-display text-text-primary mt-1 group-hover:text-accent transition-colors">
                      {roadmap.title}
                    </h3>
                    {roadmap.description ? (
                      <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
                        {roadmap.description}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary/60 italic mt-2">
                        No description provided.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {moduleCount} modules · {totalConcepts} concepts
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/roadmaps/${roadmap.id}`}
                        target="_blank"
                        title="Preview student view"
                        className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/instructor/content/${roadmap.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-tint text-accent hover:bg-accent hover:text-white font-semibold text-xs transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoadmapClick(roadmap)}
                          className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Roadmap (Admin only)"
                          aria-label="Delete Roadmap"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Standalone Concepts Section */}
      <section className="space-y-6 pt-4 border-t border-border/80">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <span>Authored Concepts</span>
          </h2>
          <span className="text-xs text-text-secondary">
            {myConcepts.length} concept{myConcepts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {conceptsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
            ))}
          </div>
        ) : myConcepts.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-dashed border-border rounded-xl">
            <p className="text-xs text-text-secondary">No authored concepts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myConcepts.map((concept) => (
              <div
                key={concept.id}
                className="p-4 rounded-xl bg-surface border border-border hover:border-accent/40 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        concept.difficulty === 'easy'
                          ? 'bg-green-tint text-green'
                          : concept.difficulty === 'hard'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-tint text-amber'
                      }`}
                    >
                      {concept.difficulty}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {new Date(concept.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary line-clamp-1">
                    {concept.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/student/concepts/${concept.id}`}
                    target="_blank"
                    className="text-xs text-text-secondary hover:text-accent flex items-center gap-1"
                  >
                    <span>Read</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/instructor/concepts/${concept.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg text-text-primary hover:text-accent font-semibold text-xs border border-border"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteConceptClick(concept)}
                        className="p-1 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Concept (Admin only)"
                        aria-label="Delete Concept"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Roadmap Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Roadmap"
        message={`Are you sure you want to permanently delete "${deleteConfirm.title}"? All associated modules and learning pathways will be removed.`}
        confirmText="Delete Roadmap"
        variant="danger"
        isLoading={deleteRoadmapMutation.isPending}
        onConfirm={() => deleteRoadmapMutation.mutate(deleteConfirm.roadmapId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, roadmapId: '', title: '' })}
      />

      {/* Delete Concept Confirmation Modal (Admin only) */}
      <ConfirmModal
        isOpen={deleteConceptConfirm.isOpen}
        title="Delete Concept"
        message={`Are you sure you want to permanently delete concept "${deleteConceptConfirm.title}"? All associated MCQ questions and submissions will be removed.`}
        confirmText="Delete Concept"
        variant="danger"
        isLoading={deleteConceptMutation.isPending}
        onConfirm={() => deleteConceptMutation.mutate(deleteConceptConfirm.conceptId)}
        onCancel={() => setDeleteConceptConfirm({ isOpen: false, conceptId: '', title: '' })}
      />
    </div>
  );
}
