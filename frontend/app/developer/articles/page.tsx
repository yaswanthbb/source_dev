'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { useTheme } from '@/providers/theme-provider';
import { DARK, LIGHT } from '@/components/terminal/themes';
import { TerminalHeader } from '@/components/terminal/terminal-chrome';
import { useTerminalLogout } from '@/components/terminal/logout-dialog';
import { ConfirmModal } from '@/components/confirm-modal';

const DEV_ROUTES = {
  dashboard: '/developer/dashboard',
  terminal: '/developer/terminal',
};

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  authorId?: string | null;
  roadmapId?: string | null;
  conceptId?: string | null;
  createdAt: string;
}

export default function DeveloperArticlesPage() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [roadmapId, setRoadmapId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; confirmText: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: articles = [], isLoading } = useQuery<ArticleRow[]>({
    queryKey: ['articles'],
    queryFn: async () => (await apiClient.get<ArticleRow[]>('/articles')).data,
  });

  const mine = articles.filter((a) => a.authorId && a.authorId === user?.id);

  const errMsg = (err: unknown, fallback: string) => {
    const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return Array.isArray(m) ? m.join('; ') : m || fallback;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { title: title.trim(), content };
      if (roadmapId.trim()) body.roadmapId = roadmapId.trim();
      if (conceptId.trim()) body.conceptId = conceptId.trim();
      return (await apiClient.post('/articles', body)).data;
    },
    onSuccess: () => {
      showSuccess('Article published — live immediately, no review gate.');
      setTitle('');
      setContent('');
      setRoadmapId('');
      setConceptId('');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to publish article.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/articles/${id}`)).data,
    onSuccess: () => {
      showSuccess('Article deleted.');
      setConfirm((p) => ({ ...p, isOpen: false }));
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to delete article.')),
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };
  const valid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-6xl mx-auto">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Write */}
          <div className="sd-panel lg:col-span-7 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ write :: hand-written only ]
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                maxLength={200}
                className="px-3 py-2 rounded-lg text-[14px] font-bold focus:outline-none"
                style={inputStyle}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write it (Markdown)..."
                rows={12}
                className="px-3 py-2 rounded-lg text-[13px] leading-relaxed focus:outline-none resize-y font-mono"
                style={inputStyle}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={roadmapId}
                  onChange={(e) => setRoadmapId(e.target.value)}
                  placeholder="Further reading: roadmap id (optional)"
                  className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                  style={inputStyle}
                />
                <input
                  value={conceptId}
                  onChange={(e) => setConceptId(e.target.value)}
                  placeholder="Further reading: lesson id (optional)"
                  className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                disabled={!valid || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="py-2 px-4 font-bold text-[13px] tracking-wider cursor-pointer disabled:opacity-50 self-start"
                style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
              >
                {createMutation.isPending ? 'PUBLISHING…' : '[ENTER] PUBLISH NOW'}
              </button>
            </div>
          </div>

          {/* Mine */}
          <div className="sd-panel lg:col-span-5 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ my_articles :: {isLoading ? '--' : mine.length} ]
            </div>
            <div className="px-3 sm:px-4 py-3 flex flex-col gap-1">
              {isLoading ? (
                <div className="text-[12px]" style={{ color: c.dim }}>LOADING<span className="sd-cursor">_</span></div>
              ) : mine.length === 0 ? (
                <div className="text-[12px]" style={{ color: c.dim }}>NOTHING PUBLISHED YET.</div>
              ) : (
                mine.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 px-1 py-1">
                    <Link
                      href={`/articles/${a.id}`}
                      className="text-[13px] font-semibold truncate hover:underline"
                      style={{ color: c.ink }}
                    >
                      {a.title}
                    </Link>
                    <span className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/developer/articles/${a.id}/edit`}
                        className="text-[11px] font-bold"
                        style={{ color: c.primary }}
                      >
                        EDIT
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirm({
                          isOpen: true, title: 'Delete article',
                          message: `Delete "${a.title}"? This is permanent.`,
                          confirmText: 'Delete',
                          onConfirm: () => deleteMutation.mutate(a.id),
                        })}
                        className="text-[11px] cursor-pointer hover:underline"
                        style={{ color: c.dim }}
                      >
                        del ×
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        variant="danger"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
