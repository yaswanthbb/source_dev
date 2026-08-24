'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListChecks,
} from 'lucide-react';
import {
  useAiJobs,
  buildCompletionMessage,
  type AiGenerationJob,
} from '@/providers/ai-jobs-provider';
import { AiJobResultModal } from '@/components/ai-job-result-modal';

function jobVisual(job: AiGenerationJob): {
  Icon: typeof CheckCircle2;
  className: string;
} {
  if (job.status === 'failed') {
    return { Icon: XCircle, className: 'text-red' };
  }
  if ((job.resultSummary?.failedCount ?? 0) > 0) {
    return { Icon: AlertTriangle, className: 'text-amber' };
  }
  return { Icon: CheckCircle2, className: 'text-green' };
}

function jobSummaryLine(job: AiGenerationJob): string {
  if (job.status === 'failed') {
    return job.errorMessage || 'AI generation failed.';
  }
  return buildCompletionMessage(job);
}

/**
 * Persistent, dismissible banner of unread finished AI generation results.
 * Re-shows completed/failed outcomes on every visit until the instructor
 * dismisses them (server-persisted acknowledged flag), so a result is never
 * missed just because the tab was closed while the background job ran.
 */
export function AiJobResultsBanner() {
  const { finishedResults, acknowledge } = useAiJobs();
  const [detailJob, setDetailJob] = useState<AiGenerationJob | null>(null);

  if (finishedResults.length === 0) return null;

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border bg-bg/50">
          <div className="flex items-center gap-2 min-w-0">
            <ListChecks className="w-4 h-4 text-accent flex-shrink-0" />
            <h2 className="text-sm font-bold font-display text-text-primary truncate">
              Generation results ({finishedResults.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void acknowledge()}
            className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
          >
            Dismiss all
          </button>
        </div>

        {/* One card per finished job */}
        <ul className="divide-y divide-border">
          {finishedResults.map((job) => {
            const { Icon, className } = jobVisual(job);
            const showDetails =
              job.status === 'failed' ||
              (job.resultSummary?.failedCount ?? 0) > 0;

            return (
              <li
                key={job.id}
                className="flex items-start gap-3 px-4 sm:px-5 py-3"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${className}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-text-primary leading-relaxed break-words">
                    {jobSummaryLine(job)}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {showDetails && (
                      <button
                        type="button"
                        onClick={() => setDetailJob(job)}
                        className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        View details
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void acknowledge([job.id])}
                      className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <AiJobResultModal job={detailJob} onClose={() => setDetailJob(null)} />
    </>
  );
}
