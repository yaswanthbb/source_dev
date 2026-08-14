'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CreateRoadmapPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      const response = await apiClient.post<{ id: string }>('/roadmaps', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      router.push(`/instructor/content/${data.id}`);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        axiosErr.response?.data?.message || 'Failed to create roadmap. Please try again.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setErrorMessage(null);
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Back Link */}
      <div>
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Content</span>
        </Link>
      </div>

      {/* Form Container Card */}
      <div className="p-8 rounded-2xl bg-surface border border-border shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Curriculum Creator</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
            Create New Roadmap
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Establish a top-level curriculum path. You can attach modules and ordered concepts on the next step.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Roadmap Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Backend Engineering in NestJS & PostgreSQL"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide an overview of the curriculum, prerequisites, and learning objectives..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/instructor/content"
              className="px-5 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-semibold text-xs hover:bg-bg transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
