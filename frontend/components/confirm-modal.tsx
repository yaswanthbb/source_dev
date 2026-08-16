'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconContainerClass}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold font-display text-text-primary">
            {title}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs ${confirmBtnClass}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
