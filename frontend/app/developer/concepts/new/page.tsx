'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
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

export default function NewConceptPage() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetModuleId = searchParams.get('moduleId');
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>('medium');
  const [content, setContent] = useState('');

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: created } = await apiClient.post<{ id: string }>('/concepts', {
        title: title.trim(),
        content,
        difficulty,
      });
      if (presetModuleId) {
        await apiClient.post(`/modules/${presetModuleId}/concepts`, {
          conceptId: created.id,
        });
      }
      return created;
    },
    onSuccess: (created) => {
      showSuccess('Lesson created — private until published.');
      router.push(`/developer/concepts/${created.id}/edit`);
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(Array.isArray(m) ? m.join('; ') : m || 'Failed to create lesson.');
    },
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };
  const valid = title.trim().length > 0 && content.trim().length >= 20;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-4xl mx-auto">
        <div className="sd-panel flex flex-col" style={panel}>
          <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
            ┌─[ new_lesson{presetModuleId ? ' → attached on save' : ''} ]
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title..."
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
              placeholder="Write the lesson body (Markdown, min 20 characters)..."
              rows={16}
              className="px-3 py-2 rounded-lg text-[13px] leading-relaxed focus:outline-none resize-y font-mono"
              style={inputStyle}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px]" style={{ color: content.trim().length >= 20 ? c.primary : c.faint }}>
                {content.trim().length} chars {content.trim().length >= 20 ? '[OK]' : '[MIN 20]'}
              </span>
              <button
                type="button"
                disabled={!valid || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="py-2 px-5 font-bold text-[13px] tracking-wider cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
              >
                {createMutation.isPending ? 'SAVING…' : '[ENTER] SAVE PRIVATE LESSON'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
