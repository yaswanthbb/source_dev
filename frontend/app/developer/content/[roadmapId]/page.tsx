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

interface ConceptRef {
  id: string;
  title: string;
  slug: string;
  reviewStatus: string;
  difficulty?: string;
  draftContent?: string | null;
  authorId?: string | null;
  originLabel?: 'ai' | 'handwritten' | null;
}

interface ModuleRow {
  id: string;
  title: string;
  orderIndex: number;
  moduleConcepts?: Array<{ id: string; conceptId: string; orderIndex: number; concept?: ConceptRef }>;
}

interface RoadmapDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  reviewStatus: 'draft' | 'submitted' | 'published';
  rejectionReason?: string | null;
  unpublishStatus?: string;
  unpublishEffectiveAt?: string | null;
  createdById?: string | null;
  modules?: ModuleRow[];
}

interface ReviewState {
  pendingCount: number;
  rejectedCount: number;
  canPublish: boolean;
  modules: Array<{ moduleId: string; title: string; approved: boolean; concepts: Array<{ id: string; title: string; reviewStatus: string; hasPendingDraft?: boolean }> }>;
}

const DEV_ROUTES = {
  dashboard: '/developer/dashboard',
  terminal: '/developer/terminal',
};

export default function DeveloperRoadmapPage({ params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = React.use(params);
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [moduleTitle, setModuleTitle] = useState('');
  const [attachSearch, setAttachSearch] = useState('');
  const [attachModuleId, setAttachModuleId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; confirmText: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: roadmap, isLoading } = useQuery<RoadmapDetail>({
    queryKey: ['roadmaps', roadmapId],
    queryFn: async () => (await apiClient.get<RoadmapDetail>(`/roadmaps/${roadmapId}`)).data,
  });

  const { data: review } = useQuery<ReviewState>({
    queryKey: ['roadmaps', roadmapId, 'review'],
    queryFn: async () => (await apiClient.get<ReviewState>(`/roadmaps/${roadmapId}/review`)).data,
  });

  const { data: searchHits = [] } = useQuery<ConceptRef[]>({
    queryKey: ['concepts', 'search', attachSearch],
    queryFn: async () =>
      (await apiClient.get<ConceptRef[]>(`/concepts?search=${encodeURIComponent(attachSearch)}`)).data,
    enabled: attachSearch.trim().length > 1,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roadmaps', roadmapId] });
    queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
  };
  const errMsg = (err: unknown, fallback: string) => {
    const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return Array.isArray(m) ? m.join('; ') : m || fallback;
  };

  const createModuleMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`/roadmaps/${roadmapId}/modules`, { title: moduleTitle.trim(), orderIndex: 0 })).data,
    onSuccess: () => {
      showSuccess('Module appended.');
      setModuleTitle('');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to create module.')),
  });

  const attachMutation = useMutation({
    mutationFn: async ({ moduleId, conceptId }: { moduleId: string; conceptId: string }) =>
      (await apiClient.post(`/modules/${moduleId}/concepts`, { conceptId })).data,
    onSuccess: () => {
      showSuccess('Lesson attached.');
      setAttachModuleId(null);
      setAttachSearch('');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to attach. Own lessons only.')),
  });

  const detachMutation = useMutation({
    mutationFn: async ({ moduleId, conceptId }: { moduleId: string; conceptId: string }) =>
      (await apiClient.delete(`/modules/${moduleId}/concepts/${conceptId}`)).data,
    onSuccess: () => {
      showSuccess('Detached — the lesson itself is kept.');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to detach.')),
  });

  const submitMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/roadmaps/${roadmapId}/submit`)).data,
    onSuccess: () => {
      showSuccess('Submitted for review.');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Submit refused.')),
  });

  const requestUnpublishMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/roadmaps/${roadmapId}/request-unpublish`)).data,
    onSuccess: () => {
      showSuccess('Takedown requested.');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to request takedown.')),
  });

  const cancelUnpublishMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/roadmaps/${roadmapId}/cancel-unpublish`)).data,
    onSuccess: () => {
      showSuccess('Takedown request withdrawn.');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to cancel.')),
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };
  const btn = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer';
  const accentBtn = `${btn} bg-accent text-white hover:bg-accent/90`;
  const ghostBtn = `${btn} border hover:text-text-primary`;
  const isOwner = !!user && !!roadmap?.createdById && user.id === roadmap.createdById;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-6xl mx-auto">
        {isLoading || !roadmap ? (
          <div className="text-[12px] p-6" style={{ color: c.dim }}>
            LOADING ROADMAP<span className="sd-cursor">_</span>
          </div>
        ) : (
          <>
            {/* Header + lifecycle */}
            <div className="sd-panel flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px]" style={headStrip}>
                <Link href="/developer/content" className="font-bold truncate" style={{ color: c.primary }}>
                  ⇠ MY_ROADMAPS
                </Link>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: c.primary, border: `1px solid ${c.primary}66` }}>
                  [{roadmap.reviewStatus.toUpperCase()}]
                </span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight" style={{ color: c.ink }}>
                  {roadmap.title}
                </h1>
                {roadmap.description && (
                  <p className="text-[13px]" style={{ color: c.dim }}>{roadmap.description}</p>
                )}
                {roadmap.rejectionReason && (
                  <p className="text-[12px] rounded-lg p-2" style={{ backgroundColor: `${c.alert}14`, color: c.alert }}>
                    REJECTED: {roadmap.rejectionReason}
                  </p>
                )}
                {roadmap.unpublishStatus && roadmap.unpublishStatus !== 'none' && (
                  <p className="text-[12px]" style={{ color: c.alert }}>
                    TAKEDOWN:{roadmap.unpublishStatus.toUpperCase()}
                    {roadmap.unpublishEffectiveAt ? ` → effective ${roadmap.unpublishEffectiveAt.slice(0, 10)}` : ''}
                  </p>
                )}
                {isOwner && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {roadmap.reviewStatus === 'draft' && (
                      <button type="button" onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending} className={accentBtn}>
                        {submitMutation.isPending ? 'SUBMITTING…' : 'SUBMIT FOR REVIEW'}
                      </button>
                    )}
                    {roadmap.reviewStatus === 'published' && (
                      <>
                        {(!roadmap.unpublishStatus || roadmap.unpublishStatus === 'none') && (
                          <button type="button" onClick={() => requestUnpublishMutation.mutate()} className={ghostBtn}
                            style={{ borderColor: c.line, color: c.dim }}>
                            Request takedown
                          </button>
                        )}
                        {roadmap.unpublishStatus === 'requested' ||
                        (roadmap.unpublishStatus === 'approved' && roadmap.unpublishEffectiveAt) ? (
                          <button type="button" onClick={() => cancelUnpublishMutation.mutate()} className={ghostBtn}
                            style={{ borderColor: c.line, color: c.dim }}>
                            Withdraw takedown
                          </button>
                        ) : null}
                      </>
                    )}
                    <Link href={`/developer/terminal?view=roadmaps`} className="text-[11px] font-bold"
                      style={{ color: c.primary }}>
                      SHELL ➔
                    </Link>
                  </div>
                )}
                {review && (
                  <p className="text-[11px]" style={{ color: c.faint }}>
                    {review.pendingCount} pending · {review.rejectedCount} rejected · publishable:{' '}
                    {review.canPublish ? 'YES' : 'NO'}
                  </p>
                )}
              </div>
            </div>

            {/* Modules */}
            {(roadmap.modules ?? []).map((m) => (
              <div key={m.id} className="sd-panel flex flex-col" style={panel}>
                <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px]" style={headStrip}>
                  <span className="font-bold truncate" style={{ color: c.ink }}>┌─[ {m.title} ]</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const label = (m as { originLabel?: string | null }).originLabel;
                      if (!label) return null;
                      return (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: c.primary, border: `1px solid ${c.primary}66` }}>
                          {label === 'handwritten' ? '{hand}' : `{${label}}`}
                        </span>
                      );
                    })()}
                  </span>
                  {isOwner && (
                    <button type="button" onClick={() => setAttachModuleId(attachModuleId === m.id ? null : m.id)}
                      className="text-[11px] font-bold cursor-pointer" style={{ color: c.primary }}>
                      {attachModuleId === m.id ? 'CLOSE x' : '+ ATTACH'}
                    </button>
                  )}
                </div>
                <div className="px-3 sm:px-4 py-2 flex flex-col gap-1">
                  {(m.moduleConcepts ?? []).length === 0 && (
                    <div className="text-[12px] px-1" style={{ color: c.faint }}>— empty —</div>
                  )}
                  {(m.moduleConcepts ?? []).map((mc) => (
                    <div key={mc.id} className="flex items-center justify-between gap-2 px-1 py-0.5">
                      <Link
                        href={mc.concept ? `/developer/concepts/${mc.concept.id}/edit` : '#'}
                        className="text-[13px] font-medium truncate hover:underline"
                        style={{ color: mc.concept ? c.ink : c.faint }}
                      >
                        {mc.concept?.title ?? mc.conceptId.slice(0, 8)}
                      </Link>
                      <span className="flex items-center gap-2 shrink-0">
                        {mc.concept && (
                          <span className="text-[10px] font-bold" style={{ color: c.faint }}>
                            [{mc.concept.reviewStatus.toUpperCase()}]{mc.concept.draftContent ? '[DRAFT]' : ''}{mc.concept.originLabel ? `{${mc.concept.originLabel === 'handwritten' ? 'hand' : mc.concept.originLabel}}` : ''}
                          </span>
                        )}
                        {isOwner && mc.concept && (
                          <button
                            type="button"
                            onClick={() => setConfirm({
                              isOpen: true, title: 'Detach lesson',
                              message: `Remove "${mc.concept?.title}" from "${m.title}"? The lesson itself is kept.`,
                              confirmText: 'Detach',
                              onConfirm: () => detachMutation.mutate({ moduleId: m.id, conceptId: mc.conceptId }),
                            })}
                            className="text-[11px] cursor-pointer hover:underline"
                            style={{ color: c.dim }}
                          >
                            detach ×
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                  {isOwner && attachModuleId === m.id && (
                    <div className="mt-1 rounded-lg p-2 space-y-2" style={{ backgroundColor: c.hover }}>
                      <input
                        value={attachSearch}
                        onChange={(e) => setAttachSearch(e.target.value)}
                        placeholder="search your lessons..."
                        className="w-full px-3 py-1.5 rounded-lg text-[12px] focus:outline-none"
                        style={inputStyle}
                      />
                      {searchHits.slice(0, 6).map((h) => (
                        <div key={h.id} className="flex items-center justify-between gap-2 text-[12px]">
                          <span className="truncate" style={{ color: c.text }}>{h.title}</span>
                          <button
                            type="button"
                            onClick={() => attachMutation.mutate({ moduleId: m.id, conceptId: h.id })}
                            className={accentBtn}
                          >
                            Attach
                          </button>
                        </div>
                      ))}
                      <Link href="/developer/concepts/new" className="text-[11px] font-bold"
                        style={{ color: c.primary }}>
                        + write a new lesson instead ➔
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* New module */}
            {isOwner && (
              <div className="sd-panel flex flex-col" style={panel}>
                <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
                  ┌─[ new_module ]
                </div>
                <div className="px-4 py-3 flex gap-2">
                  <input
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Module title..."
                    maxLength={120}
                    className="flex-1 px-3 py-2 rounded-lg text-[13px] focus:outline-none"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    disabled={!moduleTitle.trim() || createModuleMutation.isPending}
                    onClick={() => createModuleMutation.mutate()}
                    className="py-2 px-4 font-bold text-[13px] cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: c.primary, color: c.base }}
                  >
                    ADD
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
