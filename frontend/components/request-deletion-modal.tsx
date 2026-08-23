'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  X,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';

interface RequestDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeletionRequestInfo {
  id: string;
  userId: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const REQUIRED_CONFIRMATION_TEXT = 'delete my account';

export function RequestDeletionModal({
  isOpen,
  onClose,
}: RequestDeletionModalProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [reason, setReason] = useState('');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset inputs whenever modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setConfirmationInput('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setReason('');
    setConfirmationInput('');
    onClose();
  };

  // Fetch current user's existing request
  const { data: existingRequest } = useQuery<DeletionRequestInfo | null>({
    queryKey: ['users', 'me', 'deletion-request'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<DeletionRequestInfo>(
          '/users/me/deletion-request',
        );
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: isOpen,
  });

  const isPending = existingRequest?.status === 'pending';
  const isConfirmationMatched =
    confirmationInput.trim().toLowerCase() === REQUIRED_CONFIRMATION_TEXT;

  const requestMutation = useMutation({
    mutationFn: async (reasonText: string) => {
      const res = await apiClient.post('/users/request-deletion', {
        reason: reasonText.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      showSuccess(
        'Account deletion request submitted for administrative review',
      );
      queryClient.invalidateQueries({
        queryKey: ['users', 'me', 'deletion-request'],
      });
      handleClose();
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to submit account deletion request.';
      showError(errorMsg);
    },
  });

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmationMatched) return;
    requestMutation.mutate(reason);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-tint text-red flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Delete Account Request
              </h3>
              <p className="text-xs text-text-secondary">
                Submit an account deletion request for administrative review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Already Pending */}
        {isPending ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-tint border border-amber/30 text-amber space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Deletion Request Under Review</span>
              </div>
              <p className="text-xs leading-relaxed text-amber/90">
                You already have an active account deletion request submitted on{' '}
                {existingRequest?.createdAt
                  ? new Date(existingRequest.createdAt).toLocaleDateString()
                  : 'recently'}
                . Administrators will review and process the removal.
              </p>
              {existingRequest?.reason && (
                <div className="mt-2 pt-2 border-t border-amber/20 text-xs italic">
                  &ldquo;{existingRequest.reason}&rdquo;
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-bg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* State 2: GitHub-Style Confirmation Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Warning Callout Box */}
            <div className="p-4 rounded-xl bg-red-tint/40 border border-red/30 text-text-primary text-xs space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-2 text-red">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>This action cannot be undone</span>
              </div>
              <p className="text-text-secondary text-xs">
                Once an administrator approves your request, all personal data
                associated with this account will be permanently erased:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-text-secondary font-medium pl-1">
                <li>Your enrolled roadmaps and concept reading progress</li>
                <li>Your MCQ quiz submission history and scores</li>
                <li>Your earned XP, badges, and learning streaks</li>
                <li>
                  If you are an instructor, your authored roadmaps and lessons
                  will remain safely preserved on the platform
                </li>
              </ul>
            </div>

            {/* Optional Reason Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-primary">
                Reason for deletion (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you would like to delete your account..."
                rows={2}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-hidden focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all placeholder:text-text-secondary/50"
              />
              <div className="text-right text-[10px] text-text-secondary">
                {reason.length}/500
              </div>
            </div>

            {/* GitHub-Style Exact Verification Field */}
            <div className="space-y-2 pt-1 border-t border-border/80">
              <label className="block text-xs text-text-primary font-medium">
                To confirm, please type{' '}
                <span className="font-mono font-bold text-red bg-red-tint border border-red/30 px-1.5 py-0.5 rounded text-[11px]">
                  {REQUIRED_CONFIRMATION_TEXT}
                </span>{' '}
                in the box below:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={REQUIRED_CONFIRMATION_TEXT}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-bg text-text-primary text-xs font-mono transition-all focus:outline-hidden focus:ring-2 ${
                  isConfirmationMatched
                    ? 'border-green ring-green/20'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConfirmationMatched || requestMutation.isPending}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                  isConfirmationMatched
                    ? 'bg-red hover:bg-red/90 text-white cursor-pointer'
                    : 'bg-red-tint/50 text-red/60 border border-red/20 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {requestMutation.isPending
                    ? 'Submitting...'
                    : 'I understand the consequences, request deletion'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
