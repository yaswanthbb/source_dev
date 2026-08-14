'use client';

import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  let iconContainerClass = 'bg-red-50 text-red';
  let IconComponent = AlertCircle;
  let confirmBtnClass = 'bg-red text-white hover:bg-red/90';

  if (variant === 'warning') {
    iconContainerClass = 'bg-amber-tint text-amber';
    IconComponent = AlertTriangle;
    confirmBtnClass = 'bg-amber text-white hover:bg-amber/90';
  } else if (variant === 'primary') {
    iconContainerClass = 'bg-accent-tint text-accent';
    IconComponent = Info;
    confirmBtnClass = 'bg-accent text-white hover:bg-accent/90';
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconContainerClass}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-base font-bold font-display text-text-primary tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${confirmBtnClass} disabled:opacity-50`}
          >
            {isLoading ? <span>Processing...</span> : <span>{confirmText}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
