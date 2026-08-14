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
  Check,
  X,
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

export default function AdminUsersDirectoryPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

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

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query users with search and role params
  const {
    data: users = [],
    isLoading,
    refetch,
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

  // Promote Mutation
  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await apiClient.patch(`/users/${userId}/promote-to-instructor`)).data;
    },
    onSuccess: () => {
      showSuccess('User directly promoted to instructor');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(axiosErr.response?.data?.message || 'Failed to promote user.');
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

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>User Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          Platform Accounts
        </h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Directory of all registered students, faculty members, and administrators with role management controls.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bg text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-text-secondary" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-border bg-bg text-xs font-semibold text-text-primary focus:outline-none focus:border-accent w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-bg border border-border/80 rounded-xl" />
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
                  <th className="p-4 text-right font-semibold">Role Actions</th>
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

                  const isPromoting = promoteMutation.isPending;
                  const isDemoting = demoteMutation.isPending;

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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider capitalize ${rolePillStyle}`}>
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
                        {u.role === 'student' && (
                          <button
                            type="button"
                            disabled={isPromoting}
                            onClick={() => handlePromote(u.id, u.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-accent/30 bg-accent-tint text-accent hover:bg-accent hover:text-white text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                            title="Directly promote to Instructor"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Promote to Instructor</span>
                          </button>
                        )}

                        {u.role === 'instructor' && (
                          <button
                            type="button"
                            disabled={isDemoting}
                            onClick={() => handleDemote(u.id, u.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold transition-all cursor-pointer"
                            title="Revoke instructor status and degrade back to student"
                          >
                            <ArrowDownRight className="w-3 h-3" />
                            <span>Degrade to Student</span>
                          </button>
                        )}

                        {u.role === 'admin' && (
                          <span className="text-text-secondary/40 text-[11px] italic">
                            Protected
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

      {/* Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={promoteMutation.isPending || demoteMutation.isPending}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
