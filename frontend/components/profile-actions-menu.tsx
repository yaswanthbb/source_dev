'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  User as UserIcon,
  GraduationCap,
  ArrowLeftRight,
  Trash2,
  LogOut,
  Clock,
  Shield,
} from 'lucide-react';
import { User } from '@/lib/auth';
import { RequestDeletionModal } from './request-deletion-modal';

interface ProfileActionsMenuProps {
  user?: User;
  onOpenApplyModal?: () => void;
  isPendingInstructor?: boolean;
  isRejectedInstructor?: boolean;
  onOpenLogoutModal: () => void;
  currentView?: 'student' | 'instructor' | 'admin';
}

export function ProfileActionsMenu({
  user,
  onOpenApplyModal,
  isPendingInstructor,
  isRejectedInstructor,
  onOpenLogoutModal,
  currentView = 'student',
}: ProfileActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Card Container */}
      <div className="p-3 rounded-xl bg-bg border border-border/80 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 bg-accent-tint text-accent">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-accent stroke-[2.5]" />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-text-secondary capitalize truncate">
              {user?.role || 'Student'}
            </p>
          </div>
        </div>

        {/* Three Dots Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="Account options"
          aria-label="Account options"
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-all cursor-pointer ${
            isMenuOpen ? 'bg-surface text-text-primary shadow-2xs' : ''
          }`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Dropdown Popover (Opens Upward from Sidebar Footer) */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-2xl shadow-xl p-1.5 z-50 space-y-1 animate-in zoom-in-95 fade-in duration-150 backdrop-blur-xl">
          {/* Header Info */}
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-xs font-bold text-text-primary truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-text-secondary truncate">
              {user?.email}
            </p>
          </div>

          {/* Edit Profile Link */}
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-primary hover:bg-bg hover:text-accent flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4 text-accent" />
            <span>Edit Profile</span>
          </Link>

          {/* Option 1: Student Application to Instructor */}
          {isStudent && onOpenApplyModal && (
            <div>
              {isPendingInstructor ? (
                <div className="px-3 py-2 rounded-xl bg-amber-tint/70 text-amber flex items-center gap-2 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                  <span className="truncate">Instructor Pending</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenApplyModal();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-primary hover:bg-bg hover:text-accent flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-accent" />
                  <span>
                    {isRejectedInstructor
                      ? 'Re-apply to Teach'
                      : 'Apply as Instructor'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Option 2: View Switchers for Instructors & Admins */}
          {isAdmin && currentView !== 'admin' && (
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-primary hover:bg-bg hover:text-accent flex items-center gap-2.5 transition-colors cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-accent stroke-[2.5]" />
              <span>Switch to Admin Console</span>
            </Link>
          )}


          {(isInstructor || isAdmin) && currentView !== 'instructor' && (
            <Link
              href="/instructor/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-primary hover:bg-bg hover:text-accent flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-accent" />
              <span>Switch to Instructor Studio</span>
            </Link>
          )}

          {(isInstructor || isAdmin) && currentView !== 'student' && (
            <Link
              href="/student/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-primary hover:bg-bg hover:text-accent flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-accent" />
              <span>Switch to Student View</span>
            </Link>
          )}

          {/* Option 3: Request Account Deletion (Non-admin users) */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setShowDeletionModal(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-red hover:bg-red-tint/50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red" />
              <span>Request Account Deletion</span>
            </button>
          )}

          <div className="border-t border-border/60 my-1" />

          {/* Option 4: Sign Out */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onOpenLogoutModal();
            }}
            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-text-secondary hover:text-red hover:bg-red-tint/50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Account Deletion Request Modal */}
      <RequestDeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
      />
    </div>
  );
}
