'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  X,
  AlertCircle,
  Mail,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';

interface InstructorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  instructorProfile?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    bio: string | null;
    createdAt: string;
    approvedAt: string | null;
  };
}

export default function AdminInstructorsApprovalPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Themed Confirmation Modal State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: () => {},
  });

  // 1. Fetch all instructors and applicants
  const {
    data: instructors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<InstructorUser[]>({
    queryKey: ['admin', 'users', 'instructors'],
    queryFn: async () => (await apiClient.get<InstructorUser[]>('/users/instructor-applications')).data,
  });

  // Categorize by status
  const pendingInstructors = React.useMemo(
    () => instructors.filter((i) => i.instructorProfile?.status === 'pending'),
    [instructors],
  );

  const approvedInstructors = React.useMemo(
    () => instructors.filter((i) => i.role === 'instructor' || i.instructorProfile?.status === 'approved'),
    [instructors],
  );

  const rejectedInstructors = React.useMemo(
    () => instructors.filter((i) => i.instructorProfile?.status === 'rejected' && i.role !== 'instructor'),
    [instructors],
  );

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/approve-instructor`)).data;
    },
    onSuccess: () => {
      showSuccess('Instructor approved');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to approve instructor.');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/reject-instructor`)).data;
    },
    onSuccess: () => {
      showSuccess('Instructor rejected');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to reject instructor.');
    },
  });

  // Demote / Degrade Mutation
  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/demote-to-student`)).data;
    },
    onSuccess: () => {
      showSuccess('Instructor degraded to student role');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to degrade instructor.');
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Application',
      message: `Are you sure you want to reject the instructor application for "${name}"? They will remain a student.`,
      confirmText: 'Reject Application',
      variant: 'danger',
      onConfirm: () => rejectMutation.mutate(id),
    });
  };

  const handleDemote = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Degrade to Student',
      message: `Are you sure you want to degrade "${name}" back to Student? Their instructor authoring privileges will be revoked immediately.`,
      confirmText: 'Degrade to Student',
      variant: 'danger',
      onConfirm: () => demoteMutation.mutate(id),
    });
  };

  return (
    <div className="space-y-10 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-bold uppercase tracking-wider mb-2">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Faculty Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          Instructor Approval Queue
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Review, approve, or reject educator applications to grant curriculum authoring access.
        </p>
      </div>

      {/* 1. PENDING APPROVAL QUEUE (Actionable) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-tint text-amber flex items-center justify-center font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary">
              Pending Applications ({pendingInstructors.length})
            </h2>
          </div>
          {pendingInstructors.length > 0 && (
            <span className="text-xs text-amber font-semibold bg-amber-tint px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-surface border border-border h-32" />
            ))}
          </div>
        ) : pendingInstructors.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-dashed border-border rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-green mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-text-primary">All caught up!</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              There are no pending instructor applications awaiting review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingInstructors.map((inst) => (
              <div
                key={inst.id}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-amber/30 ring-1 ring-amber/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-tint text-accent font-bold flex items-center justify-center text-sm">
                      {inst.name ? inst.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-text-primary">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5 font-mono">
                        <Mail className="w-3 h-3" />
                        <span>{inst.email}</span>
                      </p>
                    </div>
                  </div>

                  {inst.instructorProfile?.bio ? (
                    <div className="pl-13 text-xs text-text-secondary bg-bg p-3 rounded-xl border border-border/80 leading-relaxed">
                      <p className="font-semibold text-text-primary text-[10px] uppercase tracking-wider mb-1">
                        Application Bio:
                      </p>
                      {inst.instructorProfile.bio}
                    </div>
                  ) : (
                    <p className="pl-13 text-[11px] text-text-secondary/60 italic">
                      No bio provided.
                    </p>
                  )}

                  <div className="pl-13 text-[10px] text-text-secondary">
                    Applied on:{' '}
                    {new Date(
                      inst.instructorProfile?.createdAt || inst.createdAt,
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-stretch sm:self-end md:self-center justify-end flex-shrink-0">
                  <button
                    type="button"
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                    onClick={() => handleReject(inst.id, inst.name)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red/30 bg-red-tint/50 text-red hover:bg-red-tint text-xs font-semibold transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => handleApprove(inst.id)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-green text-white hover:bg-green/90 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. APPROVED INSTRUCTORS (Read-only) */}
      <section className="space-y-4 pt-4 border-t border-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-tint text-green flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary">
              Approved Faculty ({approvedInstructors.length})
            </h2>
          </div>
        </div>

        {approvedInstructors.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl text-xs text-text-secondary">
            No approved instructors yet.
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xs">
            {/* Desktop / Tablet Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-secondary font-semibold">
                    <th className="p-4 font-semibold">Instructor</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Approved Date</th>
                    <th className="p-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {approvedInstructors.map((inst) => (
                    <tr key={inst.id} className="hover:bg-bg/40 transition-colors">
                      <td className="p-4 font-bold text-text-primary">
                        {inst.name}
                      </td>
                      <td className="p-4 text-text-secondary font-mono text-[11px]">
                        {inst.email}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-tint text-green font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary text-[11px]">
                        {inst.instructorProfile?.approvedAt
                          ? new Date(inst.instructorProfile.approvedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={demoteMutation.isPending}
                          onClick={() => handleDemote(inst.id, inst.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red/30 bg-red-tint/50 text-red hover:bg-red-tint text-[11px] font-semibold transition-all cursor-pointer"
                          title="Revoke instructor status and degrade back to student"
                        >
                          <X className="w-3 h-3" />
                          <span>Degrade to Student</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack (< md) */}
            <div className="md:hidden divide-y divide-border/60">
              {approvedInstructors.map((inst) => (
                <div key={inst.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-text-primary truncate">{inst.name}</p>
                      <p className="text-[11px] font-mono text-text-secondary truncate">{inst.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-tint text-green font-bold text-[10px] uppercase tracking-wider flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approved</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1 border-t border-border/50">
                    <span>
                      Approved:{' '}
                      {inst.instructorProfile?.approvedAt
                        ? new Date(inst.instructorProfile.approvedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                    <button
                      type="button"
                      disabled={demoteMutation.isPending}
                      onClick={() => handleDemote(inst.id, inst.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red/30 bg-red-tint/50 text-red text-[11px] font-semibold"
                    >
                      <X className="w-3 h-3" />
                      <span>Degrade</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. REJECTED INSTRUCTORS (Read-only) */}
      {rejectedInstructors.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-tint text-red flex items-center justify-center font-bold text-xs">
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary">
              Rejected Applications ({rejectedInstructors.length})
            </h2>
          </div>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xs">
            {/* Desktop / Tablet Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-secondary font-semibold">
                    <th className="p-4 font-semibold">Instructor</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rejectedInstructors.map((inst) => (
                    <tr key={inst.id} className="hover:bg-bg/40 transition-colors">
                      <td className="p-4 font-medium text-text-primary">
                        {inst.name}
                      </td>
                      <td className="p-4 text-text-secondary font-mono text-[11px]">
                        {inst.email}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-tint text-red font-bold text-[10px] uppercase tracking-wider">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack (< md) */}
            <div className="md:hidden divide-y divide-border/60">
              {rejectedInstructors.map((inst) => (
                <div key={inst.id} className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-primary truncate">{inst.name}</p>
                    <p className="text-[11px] font-mono text-text-secondary truncate">{inst.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-tint text-red font-bold text-[10px] uppercase tracking-wider flex-shrink-0">
                    <XCircle className="w-3 h-3" />
                    <span>Rejected</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={rejectMutation.isPending || demoteMutation.isPending}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
