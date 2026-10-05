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

interface RoadmapRow {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  reviewStatus: string;
  createdById?: string | null;
  modules?: Array<{ id: string }>;
  createdAt: string;
}

const DEV_ROUTES = {
  dashboard: '/developer/dashboard',
  terminal: '/developer/terminal',
};

export default function DeveloperContentPage() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: roadmaps = [], isLoading } = useQuery<RoadmapRow[]>({
    queryKey: ['roadmaps'],
    queryFn: async () => (await apiClient.get<RoadmapRow[]>('/roadmaps')).data,
  });

  const mine = roadmaps.filter((r) => r.createdById && r.createdById === user?.id);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { title: title.trim() };
      if (description.trim()) body.description = description.trim();
      return (await apiClient.post('/roadmaps', body)).data;
    },
    onSuccess: () => {
      showSuccess('Roadmap created — private until published.');
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(Array.isArray(msg) ? msg.join('; ') : msg || 'Failed to create roadmap.');
    },
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = {
    backgroundColor: c.head,
    borderBottom: `1px solid ${c.line}`,
  };
  const inputStyle: React.CSSProperties = {
    backgroundColor: c.base,
    border: `1px solid ${c.line}`,
    color: c.text,
  };

  const statusColor = (s: string) =>
    s === 'published' ? c.primary : s === 'submitted' ? c.alert : c.faint;

  return (
    <div
      className="sd-dash min-h-screen flex flex-col relative"
      style={{ backgroundColor: c.base, color: c.text }}
    >
      <div
        className={`fixed inset-0 z-50 pointer-events-none ${
          isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'
        }`}
        aria-hidden="true"
      />
      <TerminalHeader
        user={user}
        active="dashboard"
        uptime="--:--:--"
        onLogout={requestLogout}
        routes={DEV_ROUTES}
        notificationsHref="/developer/terminal?view=notify"
      />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-6xl mx-auto">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* New roadmap */}
          <div className="sd-panel lg:col-span-5 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ new_roadmap ]
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title — e.g. Async JS"
                maxLength={120}
                className="px-3 py-2 rounded-lg text-[13px] focus:outline-none"
                style={inputStyle}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                maxLength={2000}
                className="px-3 py-2 rounded-lg text-[13px] focus:outline-none resize-y"
                style={inputStyle}
              />
              <button
                type="button"
                disabled={!title.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="py-2 px-4 font-bold text-[13px] tracking-wider cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
              >
                {createMutation.isPending ? 'CREATING…' : '[ENTER] CREATE PRIVATE ROADMAP'}
              </button>
              <p className="text-[11px]" style={{ color: c.faint }}>
                {/* stays visible only to you until reviewed + published */}
              </p>
            </div>
          </div>

          {/* Mine */}
          <div className="sd-panel lg:col-span-7 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 flex items-center justify-between text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              <span>┌─[ my_roadmaps :: {isLoading ? '--' : mine.length} ]</span>
              <Link href="/developer/terminal" className="text-[11px]" style={{ color: c.primary }}>
                SHELL ➔
              </Link>
            </div>
            <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
              {isLoading ? (
                <div className="text-[12px]" style={{ color: c.dim }}>SCANNING<span className="sd-cursor">_</span></div>
              ) : mine.length === 0 ? (
                <div className="text-[12px]" style={{ color: c.dim }}>
                  NO ROADMAPS YET — create one, or run <span style={{ color: c.primary }}>roadmap new</span> in the shell.
                </div>
              ) : (
                mine.map((r) => (
                  <Link
                    key={r.id}
                    href={`/developer/content/${r.id}`}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg cursor-pointer"
                    style={{ border: `1px solid transparent` }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.line)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <span className="font-semibold text-[13px] truncate" style={{ color: c.ink }}>
                      {r.title}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px]" style={{ color: c.faint }}>
                        {r.modules?.length ?? 0} MOD
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: statusColor(r.reviewStatus), border: `1px solid ${statusColor(r.reviewStatus)}66` }}>
                        [{r.reviewStatus.toUpperCase()}]
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
