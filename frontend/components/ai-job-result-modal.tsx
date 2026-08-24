'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import type { AiGenerationJob } from '@/providers/ai-jobs-provider';

export interface AiJobResultModalProps {
  /** The finished job to inspect, or null when the modal is closed. */
  job: AiGenerationJob | null;
  onClose: () => void;
}

const JOB_TYPE_NOUN: Record<string, string> = {
  roadmap_modules: 'Modules',
  module_concepts: 'Concepts',
  module_mcqs: 'MCQs',
};

/**
 * Details modal for a finished AI generation job. Mirrors the app's confirm-modal
 * pattern (portal + mounted guard + Escape/backdrop close + scrollable body).
 * Lists exactly which items failed and the short reason for each, or the
 * catastrophic error message for a job that never produced any items.
 */
export function AiJobResultModal({ job, onClose }: AiJobResultModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && job) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [job, onClose]);

  if (!job || !mounted) return null;

  const summary = job.resultSummary;
  const failedItems = summary?.failedItems ?? [];
  const isFailure = job.status === 'failed';
  const isPartial = job.status === 'completed' && (summary?.failedCount ?? 0) > 0;

  let iconContainerClass = 'bg-green-tint text-green';
  let IconComponent = CheckCircle2;
  if (isFailure) {
    iconContainerClass = 'bg-red-tint text-red';
    IconComponent = XCircle;
  } else if (isPartial) {
    iconContainerClass = 'bg-amber-tint text-amber';
    IconComponent = AlertTriangle;
  }

  const typeNoun = JOB_TYPE_NOUN[job.jobType] ?? 'Items';
  const targetLabel = summary?.targetLabel;
  const headline = isFailure
    ? `${typeNoun} generation failed`
    : isPartial
      ? `${typeNoun} generation partially completed`
      : `${typeNoun} generation completed`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconContainerClass}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold font-display text-text-primary">
                {headline}
              </h3>
              {targetLabel && (
                <p className="text-xs text-text-secondary truncate">
                  {targetLabel}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Count chips */}
        {summary && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-tint text-green text-xs font-semibold">
              {summary.createdCount} created
            </span>
            {summary.failedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-tint text-red text-xs font-semibold">
                {summary.failedCount} failed
              </span>
            )}
            {summary.skippedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg text-text-secondary border border-border text-xs font-semibold">
                {summary.skippedCount} skipped
              </span>
            )}
          </div>
        )}

        {/* Failed item breakdown, or the catastrophic error message */}
        {failedItems.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              What failed
            </p>
            <ul className="space-y-2">
              {failedItems.map((item, idx) => (
                <li
                  key={`${item.title}-${idx}`}
                  className="p-3 rounded-xl bg-bg border border-border/80 space-y-1"
                >
                  <p className="text-xs font-semibold text-text-primary break-words">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed break-words">
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : isFailure ? (
          <div className="p-3 rounded-xl bg-red-tint border border-red/30">
            <p className="text-xs text-red font-medium leading-relaxed break-words">
              {job.errorMessage ||
                'The generation job failed before any items could be created.'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary leading-relaxed">
            Every item was generated successfully.
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
