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
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

interface ConceptDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  difficulty: string;
  reviewStatus: string;
  draftContent?: string | null;
  rejectionReason?: string | null;
  authorId?: string | null;
}

export default function EditConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [seeded, setSeeded] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: concept, isLoading } = useQuery<ConceptDetail>({
    queryKey: ['concepts', id],
    queryFn: async () => (await apiClient.get<ConceptDetail>(`/concepts/${id}`)).data,
  });

  useEffect(() => {
    if (concept && !seeded) {
      setTitle(concept.title);
      setContent(concept.content);
      setDifficulty(concept.difficulty);
      setSeeded(true);
    }
  }, [concept, seeded]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.patch<ConceptDetail>(`/concepts/${id}`, {
          title: title.trim() || undefined,
          content,
          difficulty,
        })
      ).data,
    onSuccess: (updated) => {
      if (updated.draftContent) {
        showSuccess('Big rewrite staged as a draft — live lesson unchanged until review.');
      } else if (updated.reviewStatus === 'pending') {
        showSuccess('Saved — back to pending review.');
      } else {
        showSuccess('Saved live.');
      }
      queryClient.invalidateQueries({ queryKey: ['concepts', id] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(Array.isArray(m) ? m.join('; ') : m || 'Failed to save lesson.');
    },
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };

  const isOwner = !!user && !!concept?.authorId && user.id === concept.authorId;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-4xl mx-auto">
        {isLoading || !concept ? (
          <div className="text-[12px] p-6" style={{ color: c.dim }}>
            LOADING LESSON<span className="sd-cursor">_</span>
          </div>
        ) : !isOwner && user?.role !== 'admin' ? (
          <div className="sd-panel p-6 text-center text-[13px]" style={{ ...panel, color: c.dim }}>
            Only the author can edit this lesson.
          </div>
        ) : (
          <div className="sd-panel flex flex-col" style={panel}>
            <div className="px-3 py-1.5 flex items-center justify-between text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              <span className="truncate">┌─[ edit :: {concept.title} ]</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ color: c.primary, border: `1px solid ${c.primary}66` }}>
                  [{concept.reviewStatus.toUpperCase()}]
                </span>
                {concept.draftContent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: c.primary, color: c.base }}>DRAFT PENDING</span>
                )}
              </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {concept.rejectionReason && (
                <p className="text-[12px] rounded-lg p-2" style={{ backgroundColor: `${c.alert}14`, color: c.alert }}>
                  REJECTED: {concept.rejectionReason}
                </p>
              )}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="px-3 py-2 rounded-lg text-[14px] font-bold focus:outline-none"
                style={inputStyle}
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold" style={{ color: c.faint }}>DIFFICULTY:</span>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                    style={difficulty === d
                      ? { backgroundColor: c.primary, color: c.base }
                      : { border: `1px solid ${c.line}`, color: c.dim, backgroundColor: 'transparent' }}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="px-3 py-2 rounded-lg text-[13px] leading-relaxed focus:outline-none resize-y font-mono"
                style={inputStyle}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px]" style={{ color: c.faint }}>
                  {/* big rewrites on live lessons stage as drafts */}
                </span>
                <div className="flex items-center gap-2">
                  <Link href="/developer/content" className="text-[11px] font-bold" style={{ color: c.primary }}>
                    MY_ROADMAPS ⇠
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
          </div>
        )}
      </main>
    </div>
  );
}
