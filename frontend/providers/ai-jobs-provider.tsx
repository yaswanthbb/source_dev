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
}

export interface AiJobsContextValue {
  /** All pending/running jobs for the current instructor, newest first. */
  activeJobs: AiGenerationJob[];
  /** Returns the single active job targeting this roadmap/module id, if any. */
  getJobForTarget: (targetId: string) => AiGenerationJob | undefined;
  /** Force an immediate refetch of the active-jobs list (e.g. right after kicking off a job). */
  refresh: () => void;
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

function buildCompletionMessage(job: AiGenerationJob): string {
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

        if (job.status === 'completed') {
          showSuccess(buildCompletionMessage(job));
        } else if (job.status === 'failed') {
          showError(job.errorMessage || 'AI generation failed.');
        } else {
          // Not terminal yet (rare poll race) — allow a later poll to retry.
          announcedIdsRef.current.delete(jobId);
          return;
        }

        // Refresh any open roadmap/module or concept lists so new content appears.
        queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
        queryClient.invalidateQueries({ queryKey: ['concepts'] });
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

    prevActiveIdsRef.current = currentIds;
  }, [activeJobs, announceFinished]);

  const getJobForTarget = useCallback(
    (targetId: string) => activeJobs.find((j) => j.targetId === targetId),
    [activeJobs],
  );

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <AiJobsContext.Provider value={{ activeJobs, getJobForTarget, refresh }}>
      {children}
    </AiJobsContext.Provider>
  );
}
