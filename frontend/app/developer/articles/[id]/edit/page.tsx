'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { useTheme } from '@/providers/theme-provider';
import { DARK, LIGHT } from '@/components/terminal/themes';
import { TerminalHeader } from '@/components/terminal/terminal-chrome';
import { useTerminalLogout } from '@/components/terminal/logout-dialog';

const DEV_ROUTES = {
  dashboard: '/developer/dashboard',
  terminal: '/developer/terminal',
};

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  authorId?: string | null;
  roadmapId?: string | null;
  conceptId?: string | null;
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [roadmapId, setRoadmapId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [seeded, setSeeded] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: article, isLoading } = useQuery<ArticleDetail>({
    queryKey: ['articles', id],
    queryFn: async () => (await apiClient.get<ArticleDetail>(`/articles/${id}`)).data,
  });

  useEffect(() => {
    if (article && !seeded) {
      setTitle(article.title);
      setContent(article.content);
      setRoadmapId(article.roadmapId || '');
      setConceptId(article.conceptId || '');
      setSeeded(true);
    }
  }, [article, seeded]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.patch<ArticleDetail>(`/articles/${id}`, {
          title: title.trim() || undefined,
          content,
          roadmapId: roadmapId.trim() === '' ? null : roadmapId.trim(),
          conceptId: conceptId.trim() === '' ? null : conceptId.trim(),
        })
      ).data,
    onSuccess: () => {
      showSuccess('Article updated — live immediately.');
      queryClient.invalidateQueries({ queryKey: ['articles', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(Array.isArray(m) ? m.join('; ') : m || 'Failed to save article.');
    },
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };

  const isOwner = !!user && !!article?.authorId && user.id === article.authorId;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-4xl mx-auto">
        {isLoading || !article ? (
          <div className="text-[12px] p-6" style={{ color: c.dim }}>
            LOADING ARTICLE<span className="sd-cursor">_</span>
          </div>
        ) : !isOwner && user?.role !== 'admin' ? (
          <div className="sd-panel p-6 text-center text-[13px]" style={{ ...panel, color: c.dim }}>
            Only the author can edit this article.
          </div>
        ) : (
          <div className="sd-panel flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ edit_article :: {article.title} ]
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="px-3 py-2 rounded-lg text-[14px] font-bold focus:outline-none"
                style={inputStyle}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="px-3 py-2 rounded-lg text-[13px] leading-relaxed focus:outline-none resize-y font-mono"
                style={inputStyle}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={roadmapId}
                  onChange={(e) => setRoadmapId(e.target.value)}
                  placeholder="Roadmap id (empty clears)"
                  className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                  style={inputStyle}
                />
                <input
                  value={conceptId}
                  onChange={(e) => setConceptId(e.target.value)}
                  placeholder="Lesson id (empty clears)"
                  className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/articles/${id}`} className="text-[11px] font-bold" style={{ color: c.primary }}>
                  VIEW PUBLIC ⇠
                </Link>
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="py-2 px-5 font-bold text-[13px] tracking-wider cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
                >
                  {saveMutation.isPending ? 'SAVING…' : '[ENTER] SAVE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
