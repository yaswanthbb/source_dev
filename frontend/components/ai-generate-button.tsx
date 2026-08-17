'use client';

import React from 'react';
import { Sparkles, Square, Loader2 } from 'lucide-react';

interface AiGenerateButtonProps {
  onClick: () => void;
  isStreaming: boolean;
  onAbort?: () => void;
  disabled?: boolean;
  label?: string;
  streamingLabel?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  title?: string;
}

export function AiGenerateButton({
  onClick,
  isStreaming,
  onAbort,
  disabled = false,
  label = 'AI Generate',
  streamingLabel = 'Generating...',
  size = 'xs',
  className = '',
  title,
}: AiGenerateButtonProps) {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px] gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
  }[size];

  if (isStreaming) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          disabled
          className={`inline-flex items-center ${sizeClasses} rounded-lg bg-accent-tint text-accent font-semibold border border-accent/30 shadow-xs animate-pulse cursor-not-allowed`}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{streamingLabel}</span>
        </button>
        {onAbort && (
          <button
            type="button"
            onClick={onAbort}
            title="Stop generating"
            className="p-1 rounded-md text-red hover:bg-red-tint transition-colors cursor-pointer border border-red/20"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center ${sizeClasses} rounded-lg bg-accent-tint text-accent font-semibold border border-accent/25 hover:bg-accent hover:text-white transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-tint disabled:hover:text-accent cursor-pointer active:scale-95 ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
