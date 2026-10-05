'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';
import { useTheme } from '@/providers/theme-provider';
import { DARK, LIGHT } from '@/components/terminal/themes';
import { ConfirmModal } from '@/components/confirm-modal';

interface Placement {
  roadmapId?: string;
  roadmapTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  orderIndex?: number;
}

interface McqQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  options: Array<{ id: string; optionText: string; isCorrect: boolean; orderIndex: number }>;
}

interface PendingConcept {
  id: string;
  title: string;
  slug: string;
  content: string;
  draftContent?: string | null;
  difficulty: string;
  reviewStatus: string;
  isAiGenerated: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; email: string } | null;
  placements: Placement[];
  questions: McqQuestion[];
}

interface RoadmapRow {
  id: string;
  title: string;
  reviewStatus: 'draft' | 'submitted' | 'published';
  rejectionReason?: string | null;
  unpublishStatus?: string;
  unpublishEffectiveAt?: string | null;
  deleteEffectiveAt?: string | null;
  createdById?: string | null;
}

interface ReviewModule {
  moduleId: string;
  title: string;
  approved: boolean;
  originLabel?: string | null;
  concepts: Array<{
    id: string;
    title: string;
    reviewStatus: string;
    rejectionReason?: string | null;
    hasPendingDraft?: boolean;
    originLabel?: string;
  }>;
}

interface ReviewStatus {
  roadmapId: string;
  title: string;
  reviewStatus: string;
  rejectionReason?: string | null;
  modules: ReviewModule[];
  pendingCount: number;
  rejectedCount: number;
  canPublish: boolean;
}

export default function AdminContentReviewPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'manual'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);
  const [rejectingConcept, setRejectingConcept] = useState<PendingConcept | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingRoadmap, setRejectingRoadmap] = useState<RoadmapRow | null>(null);
  const [roadmapRejectReason, setRoadmapRejectReason] = useState('');
  const [confirm, setConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = {
    backgroundColor: c.head,
    borderBottom: `1px solid ${c.line}`,
  };

  const {
    data: pendingConcepts = [],
    isLoading,
    refetch,
  } = useQuery<PendingConcept[]>({
    queryKey: ['admin', 'content-review', 'pending'],
    queryFn: async () => {
      const response = await apiClient.get<PendingConcept[]>('/admin/content-review/pending');
      return response.data;
    },
    staleTime: 10000,
  });

  const { data: roadmaps = [] } = useQuery<RoadmapRow[]>({
    queryKey: ['admin', 'review', 'roadmaps'],
    queryFn: async () => (await apiClient.get<RoadmapRow[]>('/roadmaps')).data,
  });

  const { data: reviewDetail } = useQuery<ReviewStatus | null>({
    queryKey: ['admin', 'review', 'detail', expandedRoadmapId],
    queryFn: async () => {
      if (!expandedRoadmapId) return null;
      return (await apiClient.get<ReviewStatus>(`/roadmaps/${expandedRoadmapId}/review`)).data;
    },
    enabled: !!expandedRoadmapId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'content-review', 'pending'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'review'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
  };

  const errMsg = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

  const approveMutation = useMutation({
    mutationFn: async (conceptId: string) =>
      (await apiClient.patch(`/admin/content-review/${conceptId}/approve`)).data,
    onSuccess: (_, conceptId) => {
      const concept = pendingConcepts.find((x) => x.id === conceptId);
      showSuccess(`Approved "${concept?.title || 'Concept'}"${concept?.draftContent ? ' — draft published live' : ''}.`);
      invalidateAll();
    },
    onError: (err: unknown) => showError(errMsg(err, 'Failed to approve concept')),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ conceptId, reason }: { conceptId: string; reason: string }) =>
      (await apiClient.patch(`/admin/content-review/${conceptId}/reject`, { reason })).data,
    onSuccess: () => {
      showSuccess('Concept rejected with feedback provided to author.');
      setRejectingConcept(null);
      setRejectionReason('');
      invalidateAll();
    },
    onError: (err: unknown) => showError(errMsg(err, 'Failed to reject concept')),
  });

  const roadmapOp = (
    label: string,
    fn: (id: string) => Promise<unknown>,
    ok: string,
  ) => ({
    mutationFn: fn,
    onSuccess: () => {
      showSuccess(ok);
      setConfirm((p) => ({ ...p, isOpen: false }));
      invalidateAll();
    },
    onError: (err: unknown) => showError(errMsg(err, `Failed: ${label}`)),
  });

  const publishMutation = useMutation(
    roadmapOp('publish', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/publish`)).data,
    'Roadmap published.'),
  );
  const rejectRoadmapMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/reject`, { reason })).data,
    onSuccess: () => {
      showSuccess('Roadmap rejected back to draft.');
      setRejectingRoadmap(null);
      setRoadmapRejectReason('');
      invalidateAll();
    },
    onError: (err: unknown) => showError(errMsg(err, 'Failed to reject roadmap')),
  });
  const unpublishMutation = useMutation(
    roadmapOp('unpublish', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/unpublish`)).data,
    'Roadmap unpublished.'),
  );
  const approveUnpublishMutation = useMutation(
    roadmapOp('approve takedown', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/approve-unpublish`)).data,
    'Takedown approved — 30-day countdown started.'),
  );
  const denyUnpublishMutation = useMutation(
    roadmapOp('deny takedown', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/deny-unpublish`)).data,
    'Takedown request denied.'),
  );
  const scheduleDeleteMutation = useMutation(
    roadmapOp('schedule delete', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/schedule-delete`)).data,
    'Deletion scheduled (30 days).'),
  );
  const cancelDeleteMutation = useMutation(
    roadmapOp('cancel delete', async (id: string) =>
      (await apiClient.patch(`/admin/content-review/roadmaps/${id}/cancel-scheduled-delete`)).data,
    'Scheduled deletion cancelled.'),
  );
  const purgeMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.delete<{ purged: number }>('/admin/content-review/roadmaps/purge-deleted')).data,
    onSuccess: (res) => {
      showSuccess(`Purged ${res.purged} roadmap(s).`);
      setConfirm((p) => ({ ...p, isOpen: false }));
      invalidateAll();
    },
    onError: (err: unknown) => showError(errMsg(err, 'Failed to purge')),
  });

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filteredConcepts = pendingConcepts.filter((con) => {
    const matchesSearch =
      con.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (con.author?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'ai') return matchesSearch && con.isAiGenerated;
    if (filterType === 'manual') return matchesSearch && !con.isAiGenerated;
    return matchesSearch;
  });

  const submittedRoadmaps = roadmaps.filter((r) => r.reviewStatus === 'submitted');
  const liveRoadmaps = roadmaps.filter((r) => r.reviewStatus === 'published');

  const btn = "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer";
  const dangerBtn = `${btn} bg-red text-white hover:bg-red/90`;
  const accentBtn = `${btn} bg-accent text-white hover:bg-accent/90`;
  const ghostBtn = `${btn} border border-border bg-surface text-text-secondary hover:text-text-primary`;

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
            style={{ backgroundColor: `${c.primary}1a`, color: c.primary, border: `1px solid ${c.primary}66` }}>
            <span>◈ review_console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight" style={{ color: c.ink }}>
            Content Review
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: c.dim }}>
            {pendingConcepts.length} awaiting · {submittedRoadmaps.length} roadmaps in review ·{' '}
            <Link href="/admin/terminal?view=review" className="font-bold" style={{ color: c.primary }}>
              open in shell ➔
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="filter queue..."
            className="px-3 py-1.5 rounded-lg text-xs border bg-transparent focus:outline-none"
            style={{ borderColor: c.line, color: c.text, backgroundColor: c.panel }}
          />
          {(['all', 'ai', 'manual'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${filterType === f ? '' : 'opacity-60'}`}
              style={filterType === f
                ? { backgroundColor: c.primary, color: c.base }
                : { border: `1px solid ${c.line}`, color: c.dim, backgroundColor: c.panel }}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={{ border: `1px solid ${c.line}`, color: c.dim, backgroundColor: c.panel }}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Queue */}
      <div className="sd-panel flex flex-col" style={panel}>
        <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
          ┌─[ queue :: {filteredConcepts.length} SHOWN ]
        </div>
        <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
          {isLoading ? (
            <div className="text-[12px]" style={{ color: c.dim }}>SCANNING QUEUE<span className="sd-cursor">_</span></div>
          ) : filteredConcepts.length === 0 ? (
            <div className="text-[12px] p-4 text-center" style={{ color: c.dim }}>QUEUE CLEAR — nothing awaiting review.</div>
          ) : (
            filteredConcepts.map((con) => {
              const open = expandedIds.has(con.id);
              return (
                <div key={con.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: c.line, backgroundColor: c.base }}>
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" onClick={() => toggleExpand(con.id)}
                      className="text-left font-bold text-[13px] truncate cursor-pointer hover:underline" style={{ color: c.ink }}>
                      {open ? '▾' : '▸'} {con.title}
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: c.primary, border: `1px solid ${c.primary}66` }}>
                        {con.isAiGenerated ? 'AI' : 'HAND'}
                      </span>
                      {con.draftContent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: c.primary, color: c.base }}>DRAFT</span>
                      )}
                      <button type="button" disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(con.id)} className={accentBtn}>
                        Approve
                      </button>
                      <button type="button"
                        onClick={() => { setRejectingConcept(con); setRejectionReason(''); }} className={ghostBtn}>
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] truncate" style={{ color: c.faint }}>
                    {con.author?.name ?? '?'} · {(con.placements ?? []).map((p) => p.roadmapTitle).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'unplaced'}
                  </div>
                  {open && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[12px] rounded-lg p-3 whitespace-pre-wrap max-h-64 overflow-y-auto"
                        style={{ backgroundColor: c.hover, color: c.text }}>
                        {con.content.slice(0, 3000)}
                      </div>
                      {con.draftContent && (
                        <div className="rounded-lg p-3 border" style={{ borderColor: c.primary }}>
                          <div className="text-[10px] font-bold mb-1" style={{ color: c.primary }}>
                            STAGED DRAFT — approving publishes this:
                          </div>
                          <div className="text-[12px] whitespace-pre-wrap max-h-64 overflow-y-auto" style={{ color: c.text }}>
                            {con.draftContent.slice(0, 3000)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Roadmaps in review */}
      <div className="sd-panel flex flex-col" style={panel}>
        <div className="px-3 py-1.5 text-[12px] font-bold flex items-center justify-between" style={{ ...headStrip, color: c.ink }}>
          <span>┌─[ roadmaps_in_review :: {submittedRoadmaps.length} ]</span>
          <button type="button"
            onClick={() => setConfirm({
              isOpen: true, title: 'Purge overdue deletions',
              message: 'Hard-delete every roadmap past its scheduled deletion date?',
              confirmText: 'Purge now', onConfirm: () => purgeMutation.mutate(),
            })}
            className={ghostBtn}>
            Purge overdue
          </button>
        </div>
        <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
          {submittedRoadmaps.length === 0 ? (
            <div className="text-[12px] p-4 text-center" style={{ color: c.dim }}>No roadmaps submitted right now.</div>
          ) : (
            submittedRoadmaps.map((r) => {
              const open = expandedRoadmapId === r.id;
              return (
                <div key={r.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: c.line, backgroundColor: c.base }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button type="button"
                      onClick={() => setExpandedRoadmapId(open ? null : r.id)}
                      className="font-bold text-[13px] truncate cursor-pointer hover:underline" style={{ color: c.ink }}>
                      {open ? '▾' : '▸'} {r.title}
                    </button>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r.unpublishStatus && r.unpublishStatus !== 'none' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: c.alert, border: `1px solid ${c.alert}66` }}>
                          UNPUBLISH:{r.unpublishStatus.toUpperCase()}
                        </span>
                      )}
                      {r.deleteEffectiveAt && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: c.alert, border: `1px solid ${c.alert}66` }}>
                          DELETE:{r.deleteEffectiveAt.slice(0, 10)}
                        </span>
                      )}
                      <button type="button" onClick={() => publishMutation.mutate(r.id)} className={accentBtn}>Publish</button>
                      <button type="button" onClick={() => { setRejectingRoadmap(r); setRoadmapRejectReason(''); }} className={ghostBtn}>Reject</button>
                      <button type="button"
                        onClick={() => setConfirm({
                          isOpen: true, title: 'Unpublish roadmap',
                          message: `Take down "${r.title}" now? Approvals stay intact.`,
                          confirmText: 'Unpublish', onConfirm: () => unpublishMutation.mutate(r.id),
                        })} className={ghostBtn}>
                        Unpublish
                      </button>
                      <button type="button"
                        onClick={() => setConfirm({
                          isOpen: true, title: 'Schedule deletion',
                          message: `Schedule deletion of "${r.title}" (30-day delay)?`,
                          confirmText: 'Schedule', onConfirm: () => scheduleDeleteMutation.mutate(r.id),
                        })} className={ghostBtn}>
                        Schedule delete
                      </button>
                      {r.unpublishStatus === 'requested' && (
                        <>
                          <button type="button" onClick={() => approveUnpublishMutation.mutate(r.id)} className={accentBtn}>
                            Takedown ✓
                          </button>
                          <button type="button" onClick={() => denyUnpublishMutation.mutate(r.id)} className={ghostBtn}>
                            Takedown ✗
                          </button>
                        </>
                      )}
                      {r.deleteEffectiveAt && (
                        <button type="button" onClick={() => cancelDeleteMutation.mutate(r.id)} className={ghostBtn}>
                          Cancel delete
                        </button>
                      )}
                    </div>
                  </div>
                  {open && reviewDetail && reviewDetail.roadmapId === r.id && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold" style={{ color: reviewDetail.canPublish ? c.primary : c.dim }}>
                        PUBLISHABLE: {reviewDetail.canPublish ? 'YES' : 'NO'} · {reviewDetail.pendingCount} pending · {reviewDetail.rejectedCount} rejected
                      </div>
                      {reviewDetail.modules.map((m) => (
                        <div key={m.moduleId} className="text-[12px]">
                          <span className="font-bold" style={{ color: m.approved ? c.primary : c.dim }}>
                            [{m.approved ? 'OK' : '..'}]
                          </span>{' '}
                          <span style={{ color: c.ink }}>{m.title}</span>{' '}
                          <span style={{ color: c.faint }}>{m.originLabel ? `{${m.originLabel}}` : ''}</span>
                          {m.concepts.map((cc) => (
                            <div key={cc.id} className="pl-6 truncate" style={{ color: c.text }}>
                              {cc.title} &lt;{cc.reviewStatus}&gt;{cc.hasPendingDraft ? ' [DRAFT]' : ''}{cc.rejectionReason ? ` — ${cc.rejectionReason.slice(0, 80)}` : ''}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Published with countdowns */}
      {liveRoadmaps.filter((r) => (r.unpublishStatus && r.unpublishStatus !== 'none') || r.deleteEffectiveAt).length > 0 && (
        <div className="sd-panel flex flex-col" style={panel}>
          <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
            ┌─[ live_countdowns ]
          </div>
          <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
            {liveRoadmaps
              .filter((r) => (r.unpublishStatus && r.unpublishStatus !== 'none') || r.deleteEffectiveAt)
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-bold truncate" style={{ color: c.ink }}>{r.title}</span>
                  <span className="text-[11px] shrink-0" style={{ color: c.alert }}>
                    {r.unpublishStatus !== 'none' ? `UNPUBLISH:${r.unpublishStatus}→${(r.unpublishEffectiveAt || '').slice(0, 10)}` : ''}
                    {r.deleteEffectiveAt ? ` DELETE:${r.deleteEffectiveAt.slice(0, 10)}` : ''}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reject-concept dialog */}
      {rejectingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={panel}>
            <h3 className="font-bold text-sm" style={{ color: c.ink }}>
              Reject &ldquo;{rejectingConcept.title}&rdquo;?
            </h3>
            <p className="text-xs" style={{ color: c.dim }}>
              {rejectingConcept.draftContent
                ? 'Only the staged draft is discarded — the live body stays.'
                : 'The author gets your reason and can fix + resubmit.'}
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Specific feedback for the author..."
              className="w-full px-3 py-2 rounded-xl border text-sm bg-transparent focus:outline-none"
              style={{ borderColor: c.line, color: c.text }}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingConcept(null)} className={ghostBtn}>Cancel</button>
              <button type="button" disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ conceptId: rejectingConcept.id, reason: rejectionReason.trim() })}
                className={dangerBtn} style={{ backgroundColor: c.alert }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject-roadmap dialog */}
      {rejectingRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={panel}>
            <h3 className="font-bold text-sm" style={{ color: c.ink }}>
              Reject roadmap &ldquo;{rejectingRoadmap.title}&rdquo; outright?
            </h3>
            <p className="text-xs" style={{ color: c.dim }}>
              Back to draft with your reason. Per-concept marks stay untouched.
            </p>
            <textarea
              rows={3}
              value={roadmapRejectReason}
              onChange={(e) => setRoadmapRejectReason(e.target.value)}
              placeholder="Reason (spam, off-topic, ...)"
              className="w-full px-3 py-2 rounded-xl border text-sm bg-transparent focus:outline-none"
              style={{ borderColor: c.line, color: c.text }}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingRoadmap(null)} className={ghostBtn}>Cancel</button>
              <button type="button" disabled={!roadmapRejectReason.trim() || rejectRoadmapMutation.isPending}
                onClick={() => rejectRoadmapMutation.mutate({ id: rejectingRoadmap.id, reason: roadmapRejectReason.trim() })}
                className={dangerBtn} style={{ backgroundColor: c.alert }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

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
