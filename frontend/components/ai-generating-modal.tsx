'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, AlertCircle, X, Loader2 } from 'lucide-react';

export type AiGenerationContextType =
  | 'modules'
  | 'concepts'
  | 'mcqs'
  | 'concept_content'
  | 'concept_mcqs';

const CONTEXT_MESSAGES: Record<AiGenerationContextType, string[]> = {
  modules: [
    'Analyzing roadmap scope and learning objectives...',
    'Structuring logical milestones and prerequisite flows...',
    'Designing modular topic boundaries...',
    'Pacing curriculum progression from fundamentals to advanced...',
    'Refining module titles for clarity and instructor voice...',
    'Creating modules in curriculum...',
    'Almost there...',
  ],
  concepts: [
    'Surveying module requirements and sibling topics...',
    'Generating structured concept breakdown...',
    'Drafting deep-dive technical explanations...',
    'Injecting practical code patterns and architecture mental models...',
    'Ensuring zero overlap with existing lessons in this module...',
    'Formatting Markdown and pedagogical callouts...',
    'Attaching concepts to curriculum module...',
    'Finalizing lesson materials...',
  ],
  mcqs: [
    'Reviewing lesson content and learning outcomes...',
    'Formulating rigorous conceptual questions...',
    'Designing plausible, educational distractors...',
    'Verifying single-correct-answer accuracy...',
    'Eliminating ambiguous phrasing and AI clichés...',
    'Attaching validated quiz questions and options...',
    'Almost done...',
  ],
  concept_content: [
    'Reading curriculum context and lesson objectives...',
    'Structuring sections, mental models, and headings...',
    'Drafting explanations in natural instructor voice...',
    'Adding real-world code examples and edge cases...',
    'Refining technical clarity and formatting...',
    'Polishing final Markdown article...',
  ],
  concept_mcqs: [
    'Analyzing lesson text for key assessment targets...',
    'Writing 5 multiple-choice questions...',
    'Designing educational distractor options...',
    'Formatting and validating JSON for Auto-Mapper...',
    'Finalizing quiz questions...',
  ],
};

const CONTEXT_TITLES: Record<AiGenerationContextType, string> = {
  modules: 'Generating Curriculum Modules',
  concepts: 'Generating Concepts with Full Content',
  mcqs: 'Generating Concept Assessment MCQs',
  concept_content: 'Writing Concept Article',
  concept_mcqs: 'Generating Quiz MCQs',
};

export interface AiGeneratingModalProps {
  isOpen: boolean;
  contextType: AiGenerationContextType;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  error?: string | null;
  onCloseError?: () => void;
}

export function AiGeneratingModal({
  isOpen,
  contextType,
  title,
  subtitle,
  onCancel,
  error,
  onCloseError,
}: AiGeneratingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const messages = CONTEXT_MESSAGES[contextType] || CONTEXT_MESSAGES.modules;

  // Cycle status messages every 2.5 seconds
  useEffect(() => {
    if (!isOpen || error) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, error, messages.length]);

  if (!isOpen || !mounted) return null;

  const displayTitle = title || CONTEXT_TITLES[contextType] || 'AI is generating...';
  const currentMessage = messages[messageIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div
        className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-accent/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber/10 rounded-full blur-2xl pointer-events-none" />

        {error ? (
          /* Error State */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-tint text-red flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={onCloseError || onCancel}
                className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                aria-label="Close error"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3
                id="ai-modal-title"
                className="text-base font-bold font-display text-text-primary"
              >
                Generation Encountered an Issue
              </h3>
              <div className="p-3.5 rounded-xl bg-red-tint/50 border border-red/20 text-xs text-red leading-relaxed font-medium">
                {error}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onCloseError || onCancel}
                className="px-5 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-text-primary hover:bg-bg transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* In-Flight Generation State */
          <div className="space-y-6 text-center">
            {/* Animated Pulsing Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-3xl bg-accent/20 animate-ping opacity-30" />
              {/* Spinning gradient border container */}
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-accent/70 text-white flex items-center justify-center shadow-lg shadow-accent/25">
                <Sparkles className="w-8 h-8 animate-pulse text-white" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h3
                id="ai-modal-title"
                className="text-lg font-bold font-display text-text-primary tracking-tight"
              >
                {displayTitle}
              </h3>
              {subtitle && (
                <p className="text-xs text-text-secondary font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Dynamic Rotating Message Box */}
            <div className="min-h-[52px] flex items-center justify-center px-4 py-3 rounded-2xl bg-bg/80 border border-border/80 text-xs font-medium text-text-secondary leading-relaxed shadow-inner">
              <div className="flex items-center gap-2.5 transition-all duration-300">
                <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
                <span className="animate-fade-in key={messageIndex}">
                  {currentMessage}
                </span>
              </div>
            </div>

            {/* Persistent Processing Notice */}
            <p className="text-[11px] text-text-secondary/70 font-medium">
              This can take a few minutes, especially for larger batches.
            </p>

            {/* Cancel Action */}
            {onCancel && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg border border-transparent hover:border-border transition-colors cursor-pointer"
                >
                  Cancel Generation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
