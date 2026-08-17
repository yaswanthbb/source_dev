"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Map,
  MessageSquare,
  LogOut,
  User as UserIcon,
  GraduationCap,
  Sparkles,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { getToken, clearAuth, getUser, User } from "@/lib/auth";
import { useSnackbar } from "@/providers/snackbar-provider";
import { ConceptSyllabusSidebar } from "@/components/concept-syllabus-sidebar";
import { LogoutConfirmationModal } from "@/components/logout-confirmation-modal";
import { ProfileActionsMenu } from "@/components/profile-actions-menu";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Roadmaps",
    href: "/student/roadmaps",
    icon: Map,
  },
  {
    name: "Review",
    href: "/student/review",
    icon: RotateCcw,
  },
  {
    name: "Q&A",
    href: "/student/qa",
    icon: MessageSquare,
  },
];

export default function StudentAppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Modal & Drawer States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applicationBio, setApplicationBio] = useState("");
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthChecked(true);
    }
  }, [router]);

  // Live user profile fetch from GET /users/me
  const { data: user, refetch: refetchUser } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const response = await apiClient.get<User>("/users/me");
      return response.data;
    },
    enabled: isAuthChecked,
    initialData: () => getUser() || undefined,
  });

  // Apply for Instructor Mutation
  const applyMutation = useMutation({
    mutationFn: async (bio: string) => {
      return (
        await apiClient.post("/users/apply-instructor", {
          bio: bio.trim() || undefined,
        })
      ).data;
    },
    onSuccess: () => {
      showSuccess("Instructor application submitted for review!");
      setShowApplyModal(false);
      setApplicationBio("");
      refetchUser();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(
        axiosErr.response?.data?.message ||
          "Failed to submit application. Please try again.",
      );
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(applicationBio);
  };

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    router.replace("/login");
  };

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const isPendingInstructor = user?.instructorProfile?.status === "pending";
  const isRejectedInstructor = user?.instructorProfile?.status === "rejected";

  // Detect if current page is a concept reading page
  const conceptIdMatch = pathname.match(/\/student\/concepts\/([a-zA-Z0-9_-]+)/);
  const activeConceptId = conceptIdMatch ? conceptIdMatch[1] : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row relative">
      {/* 1. Mobile Top Navigation Bar (< lg) */}
      <header className="lg:hidden h-14 px-4 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-30">
        <Link href="/student/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="KIP Logo"
            width={110}
            height={34}
            className="h-7 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Mobile Slide-In Drawer Navigation (< lg) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-surface z-50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {activeConceptId ? (
              <ConceptSyllabusSidebar
                conceptId={activeConceptId}
                onHideSidebar={() => setIsMobileDrawerOpen(false)}
                user={user || undefined}
                onOpenLogoutModal={() => {
                  setIsMobileDrawerOpen(false);
                  setShowLogoutModal(true);
                }}
              />
            ) : (
              <>
                <div className="flex flex-col">
                  {/* Top Brand Header in Drawer */}
                  <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                    <Link
                      href="/student/dashboard"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="flex items-center"
                    >
                      <Image
                        src="/logo.png"
                        alt="KIP Logo"
                        width={110}
                        height={34}
                        className="h-7 w-auto object-contain"
                        priority
                        unoptimized
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                      aria-label="Close navigation"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="p-4 space-y-1.5" aria-label="Mobile Navigation">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/student/dashboard" &&
                          pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-accent-tint text-accent font-semibold"
                              : "text-text-secondary hover:bg-bg hover:text-text-primary"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isActive ? "text-accent" : "text-text-secondary"
                            }`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Mobile Drawer Footer Profile Actions */}
                <div className="p-4 border-t border-border bg-surface">
                  <ProfileActionsMenu
                    user={user || undefined}
                    onOpenApplyModal={() => {
                      setIsMobileDrawerOpen(false);
                      setShowApplyModal(true);
                    }}
                    isPendingInstructor={isPendingInstructor}
                    isRejectedInstructor={isRejectedInstructor}
                    onOpenLogoutModal={() => {
                      setIsMobileDrawerOpen(false);
                      setShowLogoutModal(true);
                    }}
                    currentView="student"
                  />
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* 3. Desktop Collapsible Left Sidebar (lg+) */}
      <aside
        className={`hidden lg:flex ${
          activeConceptId ? "w-[270px]" : "w-[240px]"
        } flex-shrink-0 bg-surface border-r border-border min-h-screen flex-col justify-between sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${
          isSidebarHidden
            ? `${activeConceptId ? "-ml-[270px]" : "-ml-[240px]"} opacity-0 pointer-events-none -translate-x-full`
            : "ml-0 opacity-100 translate-x-0"
        }`}
      >
        {activeConceptId ? (
          <ConceptSyllabusSidebar
            conceptId={activeConceptId}
            onHideSidebar={() => setIsSidebarHidden(true)}
            user={user || undefined}
            onOpenLogoutModal={() => setShowLogoutModal(true)}
          />
        ) : (
          <>
            <div className="flex flex-col">
              {/* Top Brand Header with Collapse Button */}
              <div className="h-20 px-6 flex items-center justify-between border-b border-border">
                <Link href="/student/dashboard" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="KIP Logo"
                    width={120}
                    height={39}
                    className="h-[33px] w-auto object-contain"
                    priority
                    unoptimized
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSidebarHidden(true)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Hide sidebar"
                  aria-label="Hide sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/student/dashboard" &&
                      pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-accent-tint text-accent font-semibold"
                          : "text-text-secondary hover:bg-bg hover:text-text-primary"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-accent" : "text-text-secondary"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer Section (Profile Actions Menu) */}
            <div className="p-4 border-t border-border bg-surface">
              <ProfileActionsMenu
                user={user || undefined}
                onOpenApplyModal={() => setShowApplyModal(true)}
                isPendingInstructor={isPendingInstructor}
                isRejectedInstructor={isRejectedInstructor}
                onOpenLogoutModal={() => setShowLogoutModal(true)}
                currentView="student"
              />
            </div>
          </>
        )}
      </aside>

      {/* 4. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out">
        {/* Top Header Strip on Desktop when Sidebar is Collapsed */}
        {isSidebarHidden && (
          <div className="hidden lg:flex h-14 px-6 lg:px-10 items-center border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-30 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setIsSidebarHidden(false)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border shadow-2xs hover:bg-bg text-text-primary text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer group"
              title="Show sidebar"
              aria-label="Show sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-accent transition-transform group-hover:translate-x-0.5" />
              <span className="font-display">Sidebar</span>
            </button>
          </div>
        )}

        <main className="flex-1 py-5 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 w-full transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>

      {/* 5. Instructor Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-text-primary">
                    Apply to Become an Instructor
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Create roadmaps, publish concepts, and guide students on KIP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Teaching Experience & Background (Bio)
                </label>
                <textarea
                  rows={4}
                  required
                  value={applicationBio}
                  onChange={(e) => setApplicationBio(e.target.value)}
                  placeholder="Tell us about your background, industry experience, and what topics you plan to teach..."
                  className="w-full p-3 rounded-xl border border-border bg-bg text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-all resize-y"
                />
              </div>

              <div className="p-3 rounded-xl bg-bg border border-border/80 text-xs text-text-secondary space-y-1">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Application Review Process</span>
                </div>
                <p>
                  Once submitted, administrators will review your application. Upon approval, your account will immediately gain access to the Instructor Studio.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!applicationBio.trim() || applyMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 disabled:opacity-50 shadow-xs"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
