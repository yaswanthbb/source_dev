'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';

export type AiGenerationJobType =
  | 'roadmap_modules'
  | 'module_concepts'
  | 'module_mcqs';

export type AiGenerationJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export interface AiGenerationJobFailedItem {
  title: string;
  reason: string;
}

export interface AiGenerationJobResultSummary {
  createdCount: number;
  failedCount: number;
  skippedCount: number;
  failedItems: AiGenerationJobFailedItem[];
  targetLabel: string;
  itemNoun: string;
}

export interface AiGenerationJob {
  id: string;
  jobType: AiGenerationJobType;
  targetId: string;
  status: AiGenerationJobStatus;
  progressCurrent: number;
  progressTotal: number;
  resultSummary: AiGenerationJobResultSummary | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  failedCount?: number;
  acknowledgedAt?: string | null;
  retryOfJobId?: string | null;
}

export interface AiJobsContextValue {
  /** All pending/running jobs for the current instructor, newest first. */
  activeJobs: AiGenerationJob[];
  /** Returns the single active job targeting this roadmap/module id, if any. */
  getJobForTarget: (targetId: string) => AiGenerationJob | undefined;
  /** Force an immediate refetch of the active-jobs list (e.g. right after kicking off a job). */
  refresh: () => void;
  /** Unread finished (completed/failed) results for the persistent banner, newest first. */
  finishedResults: AiGenerationJob[];
  /** Mark finished results as read. With no ids, acknowledges all unread results. */
  acknowledge: (jobIds?: string[]) => Promise<void>;
}

const EMPTY_JOBS: AiGenerationJob[] = [];

const AiJobsContext = createContext<AiJobsContextValue | null>(null);

export function useAiJobs(): AiJobsContextValue {
  const context = useContext(AiJobsContext);
  if (!context) {
    throw new Error('useAiJobs must be used within an AiJobsProvider');
  }
  return context;
}

function pluralize(noun: string, count: number): string {
  return count === 1 ? noun : `${noun}s`;
}

export function buildCompletionMessage(job: AiGenerationJob): string {
  const summary = job.resultSummary;
  if (!summary) return 'AI generation completed.';

  const noun = pluralize(summary.itemNoun || 'item', summary.createdCount);
  let message = `Generated ${summary.createdCount} ${noun}`;
  if (summary.targetLabel) {
    message += ` for "${summary.targetLabel}"`;
  }

  const extras: string[] = [];
  if (summary.failedCount > 0) extras.push(`${summary.failedCount} failed`);
  if (summary.skippedCount > 0) extras.push(`${summary.skippedCount} skipped`);
  if (extras.length > 0) {
    message += ` — ${extras.join(', ')}`;
  }
  return message;
}

export function AiJobsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const { data, refetch } = useQuery<AiGenerationJob[]>({
    queryKey: ['ai-jobs', 'active'],
    queryFn: async () =>
      (await apiClient.get<AiGenerationJob[]>('/ai-generate/jobs/active')).data,
    // Poll every 5s only while at least one job is active; stop once the list is empty.
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const activeJobs = data ?? EMPTY_JOBS;

  // Unread finished results power the persistent banner. Poll while any job is
  // active (a fresh result may land any second) and re-fetch on window focus so
  // reopening the tab re-shows outcomes the user never saw.
  const { data: resultsData, refetch: refetchResultsQuery } = useQuery<
    AiGenerationJob[]
  >({
    queryKey: ['ai-jobs', 'results'],
    queryFn: async () =>
      (await apiClient.get<AiGenerationJob[]>('/ai-generate/jobs/results')).data,
    refetchInterval: activeJobs.length > 0 ? 5000 : false,
    refetchOnWindowFocus: true,
  });

  const finishedResults = resultsData ?? EMPTY_JOBS;

  const refetchResults = useCallback(() => {
    void refetchResultsQuery();
  }, [refetchResultsQuery]);

  // Track which job ids were active on the previous poll, and which we've already
  // announced, so a job disappearing from the active list fires exactly one toast.
  const prevActiveIdsRef = useRef<Set<string>>(new Set());
  const announcedIdsRef = useRef<Set<string>>(new Set());

  const announceFinished = useCallback(
    async (jobId: string) => {
      try {
        const job = (
          await apiClient.get<AiGenerationJob>(`/ai-generate/jobs/${jobId}`)
        ).data;

        if (job.status !== 'completed' && job.status !== 'failed') {
          // Not terminal yet (rare poll race) — allow a later poll to retry.
          announcedIdsRef.current.delete(jobId);
          return;
        }

        // Refresh any open roadmap/module or concept lists so new content appears.
        queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
        queryClient.invalidateQueries({ queryKey: ['concepts'] });

        // A job the backend already acknowledged is a superseded original whose
        // failed items are being retried. The retry produces the definitive
        // toast, so stay silent here — but content was still refreshed above.
        if (job.acknowledgedAt) return;

        if (job.status === 'completed') {
          showSuccess(buildCompletionMessage(job));
        } else {
          showError(job.errorMessage || 'AI generation failed.');
        }
      } catch {
        // Best-effort notification; allow a retry on the next poll if it failed.
        announcedIdsRef.current.delete(jobId);
      }
    },
    [queryClient, showSuccess, showError],
  );

  useEffect(() => {
    const currentIds = new Set(activeJobs.map((j) => j.id));
    const disappeared = [...prevActiveIdsRef.current].filter(
      (id) => !currentIds.has(id),
    );

    disappeared.forEach((id) => {
      if (announcedIdsRef.current.has(id)) return;
      announcedIdsRef.current.add(id);
      void announceFinished(id);
    });

    // A job that just left the active list may have produced a bannerable
    // result (or spawned a retry) — refresh the results list promptly.
    if (disappeared.length > 0) {
      refetchResults();
    }

    prevActiveIdsRef.current = currentIds;
  }, [activeJobs, announceFinished, refetchResults]);

  const getJobForTarget = useCallback(
    (targetId: string) => activeJobs.find((j) => j.targetId === targetId),
    [activeJobs],
  );

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const acknowledge = useCallback(
    async (jobIds?: string[]) => {
      const ids = jobIds && jobIds.length ? jobIds : undefined;
      // Optimistically drop the acknowledged cards so the banner updates instantly.
      queryClient.setQueryData<AiGenerationJob[]>(['ai-jobs', 'results'], (prev) =>
        prev ? (ids ? prev.filter((j) => !ids.includes(j.id)) : []) : prev,
      );
      try {
        await apiClient.post('/ai-generate/jobs/acknowledge', { jobIds: ids });
      } finally {
        refetchResults();
      }
    },
    [queryClient, refetchResults],
  );

  return (
    <AiJobsContext.Provider
      value={{
        activeJobs,
        getJobForTarget,
        refresh,
        finishedResults,
        acknowledge,
      }}
    >
      {children}
    </AiJobsContext.Provider>
  );
}
