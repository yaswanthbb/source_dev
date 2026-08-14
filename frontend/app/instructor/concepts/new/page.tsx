'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';

export default function CreateConceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const moduleId = searchParams.get('moduleId');
  const roadmapId = searchParams.get('roadmapId');

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createConceptMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      content: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }) => {
      // 1. Create concept
      const res = await apiClient.post<{ id: string }>('/concepts', payload);
      const newConcept = res.data;

      // 2. Auto-attach to module if moduleId was passed
      if (moduleId) {
        try {
          await apiClient.post(`/modules/${moduleId}/concepts`, {
            conceptId: newConcept.id,
            orderIndex: 99,
          });
        } catch {
          // If attachment fails, concept was still created
        }
      }

      return newConcept;
    },
    onSuccess: (newConcept) => {
      showSuccess('Concept created');
      queryClient.invalidateQueries({ queryKey: ['concepts'] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      if (roadmapId) {
        router.push(`/instructor/content/${roadmapId}`);
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
    });
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Back Navigation */}
      <div>
        <Link
          href={roadmapId ? `/instructor/content/${roadmapId}` : '/instructor/content'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{roadmapId ? 'Back to Roadmap' : 'Back to Content Studio'}</span>
        </Link>
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
            {moduleId && (
              <p className="text-xs text-accent font-medium mt-1">
                Will be attached to active module upon publishing.
              </p>
            )}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Controls */}
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
                placeholder="e.g., Dependency Injection & Lifecycle in NestJS"
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

          {/* Markdown Content Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
              Article Content (Markdown) <span className="text-red-500">*</span>
            </label>

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
                    placeholder={`## Introduction\nExplain the concept here...\n\n### Code Example\n\`\`\`typescript\n@Injectable()\nexport class ExampleService {\n  // your code\n}\n\`\`\`\n\n### Key Takeaways\n- Point 1\n- Point 2`}
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
              href={roadmapId ? `/instructor/content/${roadmapId}` : '/instructor/content'}
              className="px-5 py-2.5 rounded-xl border border-border bg-surface text-text-primary font-semibold text-xs hover:bg-bg transition-all"
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
    </div>
  );
}
