'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  useAiJobs,
  type AiGenerationJobType,
} from '@/providers/ai-jobs-provider';

const JOB_TYPE_LABELS: Record<AiGenerationJobType, string> = {
  roadmap_modules: 'Generating modules',
  module_concepts: 'Generating concepts',
  module_mcqs: 'Generating MCQs',
};

/**
 * Persistent instructor-portal indicator. Reads the shared AiJobsProvider context
 * and renders a small spinning pill with the active background-job count whenever
 * one or more AI generations are in progress; renders nothing otherwise.
 */
export function AiJobsIndicator() {
  const { activeJobs } = useAiJobs();

  if (activeJobs.length === 0) return null;

  const count = activeJobs.length;
  const title = activeJobs
    .map((job) => {
      const label = JOB_TYPE_LABELS[job.jobType] ?? 'Generating';
      const progress =
        job.progressTotal > 0
          ? ` (${job.progressCurrent} of ${job.progressTotal})`
          : '';
      return `${label}${progress}`;
    })
    .join(', ');

  return (
    <span
      title={title}
      aria-label={`${count} AI generation${count > 1 ? 's' : ''} in progress`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-tint text-accent border border-accent/20 text-xs font-semibold whitespace-nowrap"
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>{count} running</span>
    </span>
  );
}
