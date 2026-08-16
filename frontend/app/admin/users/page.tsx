'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  Shield,
  GraduationCap,
  BookOpen,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useSnackbar } from '@/providers/snackbar-provider';
import { ConfirmModal } from '@/components/confirm-modal';

interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: string;
  instructorProfile?: {
    status?: string;
  };
}

interface DeletionRequestItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  reviewedByAdmin?: {
    name: string;
  } | null;
}

export default function AdminUsersDirectoryPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [activeTab, setActiveTab] = useState<'directory' | 'requests'>('directory');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const [confirmModal, setConfirmModal] = useState<{
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

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query 1: Users Directory
  const {
    data: users = [],
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useQuery<UserDirectoryItem[]>({
    queryKey: ['admin', 'users', debouncedSearch, selectedRole],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      if (selectedRole !== 'all') {
        params.set('role', selectedRole);
      }
      const qs = params.toString();
      const response = await apiClient.get<UserDirectoryItem[]>(
        `/users${qs ? `?${qs}` : ''}`,
      );
      return response.data;
    },
  });

  // Query 2: Account Deletion Requests
  const {
    data: deletionRequests = [],
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery<DeletionRequestItem[]>({
    queryKey: ['admin', 'deletion-requests'],
    queryFn: async () => {
      const response = await apiClient.get<DeletionRequestItem[]>('/users/deletion-requests');
      return response.data;
    },
  });

  const pendingRequestsCount = deletionRequests.filter((r) => r.status === 'pending').length;

  // Mutation: Promote
  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/promote-to-instructor`)).data;
    },
    onSuccess: () => {
      showSuccess('User directly promoted to instructor');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to promote user.');
    },
  });

  // Mutation: Demote / Degrade
  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/demote-to-student`)).data;
    },
    onSuccess: () => {
      showSuccess('Instructor degraded to student role');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to degrade instructor.');
    },
  });

  // Mutation: Direct Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.delete(`/users/${userId}`)).data;
    },
    onSuccess: () => {
      showSuccess('User deleted successfully');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetchUsers();
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to delete user.');
    },
  });

  // Mutation: Approve Deletion Request
  const approveDeletionMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return (await apiClient.patch(`/users/deletion-requests/${requestId}/approve`)).data;
    },
    onSuccess: () => {
      showSuccess('Account deletion approved and user data deleted');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetchUsers();
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to approve deletion.');
    },
  });

  // Mutation: Reject Deletion Request
  const rejectDeletionMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return (await apiClient.patch(`/users/deletion-requests/${requestId}/reject`)).data;
    },
    onSuccess: () => {
      showSuccess('Account deletion request rejected');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetchRequests();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to reject deletion.');
    },
  });

  const handlePromote = (userId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote to Instructor',
      message: `Directly promote "${name}" to Instructor? They will gain immediate access to author roadmaps, modules, and concepts.`,
      confirmText: 'Promote User',
      variant: 'primary',
      onConfirm: () => promoteMutation.mutate(userId),
    });
  };

  const handleDemote = (userId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Degrade to Student',
      message: `Are you sure you want to degrade "${name}" back to Student? Their instructor authoring privileges will be revoked.`,
      confirmText: 'Degrade to Student',
      variant: 'danger',
      onConfirm: () => demoteMutation.mutate(userId),
    });
  };

  const handleDeleteUser = (u: UserDirectoryItem) => {
    const isInstructor = u.role === 'instructor';
    setConfirmModal({
      isOpen: true,
      title: `Delete ${isInstructor ? 'Instructor' : 'User'} Account`,
      message: isInstructor
        ? `Are you sure you want to permanently delete instructor "${u.name}" (${u.email})? Their user account will be deleted, but all created roadmaps, modules, concepts, and QA answers will remain safely preserved on the platform.`
        : `Are you sure you want to permanently delete student "${u.name}" (${u.email})? All student progress, quiz submissions, streaks, and badges will be permanently erased.`,
      confirmText: 'Delete User',
      variant: 'danger',
      onConfirm: () => deleteUserMutation.mutate(u.id),
    });
  };

  const handleApproveDeletion = (req: DeletionRequestItem) => {
    const userName = req.user?.name || 'User';
    setConfirmModal({
      isOpen: true,
      title: 'Approve Account Deletion',
      message: `Approve deletion request for "${userName}"? This will permanently delete the user account and wipe their personal progress data.`,
      confirmText: 'Approve & Delete',
      variant: 'danger',
      onConfirm: () => approveDeletionMutation.mutate(req.id),
    });
  };

  const handleRejectDeletion = (req: DeletionRequestItem) => {
    const userName = req.user?.name || 'User';
    setConfirmModal({
      isOpen: true,
      title: 'Reject Deletion Request',
      message: `Reject the deletion request submitted by "${userName}"? The user account will remain active.`,
      confirmText: 'Reject Request',
      variant: 'warning',
      onConfirm: () => rejectDeletionMutation.mutate(req.id),
    });
  };

  const isActionLoading =
    promoteMutation.isPending ||
    demoteMutation.isPending ||
    deleteUserMutation.isPending ||
    approveDeletionMutation.isPending ||
    rejectDeletionMutation.isPending;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
            Users Directory
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage system users, assign instructor roles, and review account deletion requests.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-surface border border-border self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-accent text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-accent text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            <span>Deletion Requests</span>
            {pendingRequestsCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'requests'
                    ? 'bg-white text-accent'
                    : 'bg-red-500 text-white animate-pulse'
                }`}
              >
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: ALL USERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Controls Bar: Search & Role Filter */}
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-bg text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-hidden focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-text-secondary font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
              </span>
              {(['all', 'student', 'instructor', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedRole === role
                      ? 'bg-accent text-white shadow-2xs'
                      : 'border border-border bg-bg text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
            {isUsersLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-bg animate-pulse rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-10 h-10 text-text-secondary/40 mx-auto mb-1" />
                <p className="text-xs font-bold text-text-primary">No users found</p>
                <p className="text-[11px] text-text-secondary">
                  Try adjusting your search query or role filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-secondary font-semibold">
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Joined Date</th>
                      <th className="p-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.map((u) => {
                      let rolePillStyle = 'bg-bg text-text-secondary border border-border';
                      if (u.role === 'admin') {
                        rolePillStyle = 'bg-purple-50 text-purple-700 font-bold border border-purple-200';
                      } else if (u.role === 'instructor') {
                        rolePillStyle = 'bg-accent-tint text-accent font-bold';
                      } else if (u.role === 'student') {
                        rolePillStyle = 'bg-green-tint text-green font-semibold';
                      }

                      return (
                        <tr key={u.id} className="hover:bg-bg/40 transition-colors">
                          <td className="p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-accent-tint text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="truncate max-w-[200px]">{u.name}</span>
                            </div>
                          </td>

                          <td className="p-4 text-text-secondary font-mono text-[11px]">
                            {u.email}
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider capitalize ${rolePillStyle}`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="p-4 text-text-secondary text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role === 'student' && (
                                <button
                                  type="button"
                                  onClick={() => handlePromote(u.id, u.name)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-accent/30 bg-accent-tint text-accent hover:bg-accent hover:text-white text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                                  title="Directly promote to Instructor"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>Promote</span>
                                </button>
                              )}

                              {u.role === 'instructor' && (
                                <button
                                  type="button"
                                  onClick={() => handleDemote(u.id, u.name)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Revoke instructor status and degrade back to student"
                                >
                                  <ArrowDownRight className="w-3 h-3" />
                                  <span>Degrade</span>
                                </button>
                              )}

                              {u.role !== 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Permanently Delete User"
                                  aria-label="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-text-secondary/40 text-[11px] italic px-2">
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT DELETION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
            {isRequestsLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-bg animate-pulse rounded-xl" />
                ))}
              </div>
            ) : deletionRequests.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green mx-auto mb-1 opacity-70" />
                <p className="text-xs font-bold text-text-primary">
                  No Deletion Requests
                </p>
                <p className="text-[11px] text-text-secondary">
                  There are no pending or past account deletion requests.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-secondary font-semibold">
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Email & Role</th>
                      <th className="p-4 font-semibold">Reason</th>
                      <th className="p-4 font-semibold">Requested At</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 text-right font-semibold">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {deletionRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr key={req.id} className="hover:bg-bg/40 transition-colors">
                          <td className="p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent-tint text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {req.user?.name ? req.user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="truncate max-w-[160px]">
                                {req.user?.name || 'Deleted Account'}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-text-secondary">
                            <div className="font-mono text-[11px]">
                              {req.user?.email || 'N/A'}
                            </div>
                            <div className="text-[10px] capitalize text-text-secondary/70">
                              {req.user?.role || 'User'}
                            </div>
                          </td>

                          <td className="p-4 text-text-secondary max-w-xs">
                            <p className="truncate text-xs text-text-primary">
                              {req.reason || <span className="italic text-text-secondary/50">No reason provided</span>}
                            </p>
                          </td>

                          <td className="p-4 text-text-secondary text-[11px]">
                            {new Date(req.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="p-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-tint text-amber">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved & Deleted</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-bg text-text-secondary border border-border">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRejectDeletion(req)}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveDeletion(req)}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                >
                                  Approve & Delete
                                </button>
                              </div>
                            ) : (
                              <span className="text-text-secondary/50 text-[11px]">
                                {req.reviewedAt
                                  ? `Reviewed ${new Date(req.reviewedAt).toLocaleDateString()}`
                                  : 'Reviewed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={isActionLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
