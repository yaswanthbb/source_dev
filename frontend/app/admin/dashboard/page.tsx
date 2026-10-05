"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { User } from "@/lib/auth";
import { useTheme } from "@/providers/theme-provider";
import { DARK, LIGHT } from "@/components/terminal/themes";
import { TerminalHeader } from "@/components/terminal/terminal-chrome";
import { useTerminalLogout } from "@/components/terminal/logout-dialog";
import { TerminalReadout, useTerminalMotion } from "@/app/developer/dashboard/terminal-motion";

// ─── Types matching backend responses ───────────────────────────────────────

interface OverviewAnalytics {
  totalDevelopers: number;
  totalAdmins: number;
  totalRoadmaps: number;
  totalModules: number;
  totalConcepts: number;
  totalConceptCompletions: number;
  activeDevelopers: number;
  totalXpAwarded: number;
}

interface RoadmapAnalytics {
  roadmapId: string;
  title: string;
  totalConcepts: number;
  totalEnrolledDevelopers: number;
  averageCompletionPercentage: number;
  totalCompletedConcepts: number;
}

interface ConceptAnalytics {
  conceptId: string;
  title: string;
  difficulty: string;
  completionCount: number;
  startedButNotCompletedCount: number;
}

interface DeveloperAnalytics {
  developerId: string;
  name: string;
  email: string;
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
}

interface PendingConcept {
  id: string;
  title: string;
  reviewStatus: string;
  draftContent?: string | null;
  author?: { id: string; name: string; email: string } | null;
  placements?: Array<{ roadmapTitle?: string; moduleTitle?: string }>;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

const ADMIN_ROUTES = {
  dashboard: "/admin/dashboard",
  terminal: "/admin/terminal",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDay(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso.slice(0, 10)
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const { motionEnabled } = useTerminalMotion();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();

  const [mounted, setMounted] = useState(false);
  const [uptimeSec, setUptimeSec] = useState(0);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setUptimeSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: user } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => (await apiClient.get<User>("/users/me")).data,
  });

  const { data: overview, isLoading: overviewLoading } =
    useQuery<OverviewAnalytics>({
      queryKey: ["admin", "analytics", "overview"],
      queryFn: async () =>
        (await apiClient.get<OverviewAnalytics>("/admin/analytics/overview")).data,
    });

  const { data: roadmaps = [], isLoading: roadmapsLoading } = useQuery<
    RoadmapAnalytics[]
  >({
    queryKey: ["admin", "analytics", "roadmaps"],
    queryFn: async () =>
      (await apiClient.get<RoadmapAnalytics[]>("/admin/analytics/roadmaps")).data,
  });

  const { data: concepts = [], isLoading: conceptsLoading } = useQuery<
    ConceptAnalytics[]
  >({
    queryKey: ["admin", "analytics", "concepts"],
    queryFn: async () =>
      (await apiClient.get<ConceptAnalytics[]>("/admin/analytics/concepts")).data,
  });

  const { data: developers = [], isLoading: developersLoading } = useQuery<
    DeveloperAnalytics[]
  >({
    queryKey: ["admin", "analytics", "developers"],
    queryFn: async () =>
      (await apiClient.get<DeveloperAnalytics[]>("/admin/analytics/developers"))
        .data,
  });

  const { data: queue = [], isLoading: queueLoading } = useQuery<
    PendingConcept[]
  >({
    queryKey: ["admin", "review", "pending"],
    queryFn: async () =>
      (await apiClient.get<PendingConcept[]>("/admin/content-review/pending"))
        .data,
  });

  const { data: unread } = useQuery<{ unread: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () =>
      (await apiClient.get<{ unread: number }>("/notifications/unread-count"))
        .data,
  });

  const { data: feed = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", "feed"],
    queryFn: async () =>
      (await apiClient.get<NotificationItem[]>("/notifications")).data,
  });

  const isSyncing =
    overviewLoading || roadmapsLoading || conceptsLoading || developersLoading || queueLoading;

  // ── Derived ─────────────────────────────────────────────────────────────

  const queueDepth = queue.length;
  const oldestWaiting = useMemo(
    () =>
      [...queue]
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )[0] ?? null,
    [queue],
  );

  const topQueue = useMemo(() => [...queue]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(0, 8), [queue]);

  const topRoadmaps = useMemo(
    () => [...roadmaps].sort((a, b) => b.totalEnrolledDevelopers - a.totalEnrolledDevelopers).slice(0, 6),
    [roadmaps],
  );

  const topConcepts = useMemo(() => concepts.slice(0, 6), [concepts]);

  const topDevelopers = useMemo(
    () =>
      [...developers]
        .sort((a, b) => b.conceptsAuthored - a.conceptsAuthored)
        .slice(0, 6),
    [developers],
  );

  const eventLog = useMemo(() => feed.slice(0, 12), [feed]);

  // ── Decoration ──────────────────────────────────────────────────────────

  const uptime = `${pad(Math.floor(uptimeSec / 3600))}:${pad(
    Math.floor((uptimeSec % 3600) / 60),
  )}:${pad(uptimeSec % 60)}`;

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };

  const headStrip: React.CSSProperties = {
    backgroundColor: c.head,
    borderBottom: `1px solid ${c.line}`,
  };

  const num = (v: number | undefined, loading: boolean) =>
    loading || v === undefined ? "--" : v.toLocaleString();

  const queueAlert = queueDepth > 0;

  return (
    <div
      className={`sd-dash ${isDark ? "" : "sd-dash-light"} min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative`}
      style={{ backgroundColor: c.base, color: c.text, "--sd-accent": c.primary } as React.CSSProperties}
    >
      <div className="sd-boot-sweep" aria-hidden="true" />
      <div
        className={`fixed inset-0 z-50 pointer-events-none ${
          isDark ? "sd-dash-scanlines opacity-40" : "sd-dash-scanlines-light"
        }`}
        aria-hidden="true"
      />

      <TerminalHeader
        user={user}
        active="dashboard"
        syncing={isSyncing}
        uptime={mounted ? uptime : "00:00:00"}
        onLogout={requestLogout}
        routes={ADMIN_ROUTES}
        notificationsHref="/admin/terminal?view=notify"
      />
      {logoutDialog}

      <main className="w-full lg:flex-1 lg:min-h-0 px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3">
        {/* ── BAND 1: review control + gauges ─────────────────────────── */}
        <section className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div
            className="sd-panel sd-mission lg:col-span-7 flex flex-col relative overflow-hidden"
            style={{
              backgroundColor: queueAlert ? c.dueWash : c.panel,
              border: queueAlert ? `2px solid ${c.primary}` : `1px solid ${c.line}`,
              boxShadow: `3px 3px 0px 0px ${queueAlert ? c.primary : c.shadow}`,
            }}
          >
            <div className="px-3 py-1.5 flex items-center justify-between text-[12px] shrink-0" style={headStrip}>
              <div className="flex items-center gap-2 font-bold tracking-tight min-w-0" style={{ color: c.ink }}>
                <span style={{ color: c.primary }} className="shrink-0">▶</span>
                <span className="truncate">
                  ┌─[ review_control
                  <span className="hidden sm:inline"> :: moderation_queue</span> ]
                </span>
              </div>
              {queueAlert && (
                <span className="sd-pulse font-bold text-[11px] px-1.5" style={{ color: c.primary, backgroundColor: `${c.primary}1a`, border: `1px solid ${c.primary}66` }}>
                  [{queueDepth} PENDING]
                </span>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col justify-between gap-3 flex-1">
              {queueLoading ? (
                <div className="text-[12px]" style={{ color: c.dim }}>
                  SCANNING QUEUE<span className="sd-cursor">_</span>
                </div>
              ) : oldestWaiting ? (
                <>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: c.faint }}>
                      <span>OLDEST WAITING</span>
                      <span style={{ color: c.primary }}>
                        {fmtDay(oldestWaiting.createdAt).toUpperCase()}
                      </span>
                    </div>
                    <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-snug truncate" style={{ color: c.ink }}>
                      {oldestWaiting.title}
                    </h1>
                    <div className="mt-2 py-1.5 text-[11px]" style={{ borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
                      <span style={{ color: c.faint }}>AUTHOR&nbsp;&nbsp;</span>
                      <span className="font-semibold" style={{ color: c.text }}>
                        {(oldestWaiting.author?.name ?? "?").toUpperCase()}
                      </span>
                      {oldestWaiting.draftContent && (
                        <span className="font-bold ml-2" style={{ color: c.primary }}>[DRAFT]</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/terminal?view=review&ref=${oldestWaiting.id}`}
                    className="sd-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
                    style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
                  >
                    [ENTER] OPEN QUEUE ➔
                  </Link>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: c.faint }}>
                      <span>QUEUE STATE</span>
                    </div>
                    <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-snug" style={{ color: c.ink }}>
                      QUEUE CLEAR
                    </h1>
                    <div className="mt-2 py-1.5 text-[11px]" style={{ borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
                      <span style={{ color: c.faint }}>NOTHING AWAITING REVIEW</span>
                    </div>
                  </div>
                  <Link
                    href="/admin/terminal?view=overview"
                    className="sd-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
                    style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
                  >
                    [ENTER] OPEN SHELL ➔
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Gauges */}
          <div className="sd-gauges lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="sd-panel px-3 py-2.5 flex flex-col justify-between" style={panel}>
              <div className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: c.dim }}>
                <span>QUEUE_DEPTH</span><span className="text-[9px]" style={{ color: c.faint }}>#01</span>
              </div>
              <div className="my-1 text-xl md:text-2xl font-bold tracking-tight" style={{ color: c.ink }}>
                <TerminalReadout text={queueLoading ? "--" : String(queueDepth)} enabled={motionEnabled} />
              </div>
              <div className="text-[10px] pt-1" style={{ color: c.faint, borderTop: `1px solid ${c.line}` }}>
                AWAITING REVIEW
              </div>
            </div>

            <div className="sd-panel px-3 py-2.5 flex flex-col justify-between" style={panel}>
              <div className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: c.dim }}>
                <span>DEVELOPERS</span><span className="text-[9px]" style={{ color: c.faint }}>#02</span>
              </div>
              <div className="my-1 text-xl md:text-2xl font-bold tracking-tight" style={{ color: c.ink }}>
                <TerminalReadout text={num(overview?.totalDevelopers, overviewLoading)} enabled={motionEnabled} />
              </div>
              <div className="text-[10px] pt-1" style={{ color: c.faint, borderTop: `1px solid ${c.line}` }}>
                {overviewLoading ? "--" : `${overview?.activeDevelopers ?? 0} ACTIVE 7D`}
              </div>
            </div>

            <Link
              href="/admin/terminal?view=notify"
              className="sd-panel sd-review px-3 py-2.5 flex flex-col justify-between relative overflow-hidden cursor-pointer"
              style={{
                backgroundColor: (unread?.unread ?? 0) > 0 ? c.dueWash : c.panel,
                border: (unread?.unread ?? 0) > 0 ? `2px solid ${c.primary}` : `1px solid ${c.line}`,
                boxShadow: `3px 3px 0px 0px ${(unread?.unread ?? 0) > 0 ? c.primary : c.shadow}`,
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: (unread?.unread ?? 0) > 0 ? c.primary : c.dim }}>
                <span>UNREAD</span>
                {(unread?.unread ?? 0) > 0 ? (
                  <span className="sd-pulse inline-flex items-center px-1 text-[9px] font-bold" style={{ backgroundColor: c.dueChipBg, color: c.dueChipInk, border: `1px solid ${c.dueChipLine}` }}>ALERT</span>
                ) : (
                  <span className="text-[9px]" style={{ color: c.faint }}>#03</span>
                )}
              </div>
              <div className="my-1 text-xl md:text-2xl font-bold tracking-tight" style={{ color: (unread?.unread ?? 0) > 0 ? c.primary : c.ink }}>
                {unread?.unread ?? 0} DUE
              </div>
              <div className="text-[10px] pt-1" style={{ color: c.dim, borderTop: `1px solid ${c.line}` }}>
                BELL QUEUE
              </div>
            </Link>

            <div className="sd-panel px-3 py-2.5 flex flex-col justify-between" style={panel}>
              <div className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: c.dim }}>
                <span>TOTAL_XP</span><span className="text-[9px]" style={{ color: c.faint }}>#04</span>
              </div>
              <div className="my-1 text-xl md:text-2xl font-bold tracking-tight" style={{ color: c.ink }}>
                <TerminalReadout text={num(overview?.totalXpAwarded, overviewLoading)} enabled={motionEnabled} />
              </div>
              <div className="text-[10px] pt-1" style={{ color: c.dim, borderTop: `1px solid ${c.line}` }}>
                {overviewLoading ? "--" : `${overview?.totalConcepts ?? 0} CONCEPTS · ${overview?.totalRoadmaps ?? 0} ROADMAPS`}
              </div>
            </div>
          </div>
        </section>

        {/* ── BAND 2 ─────────────────────────────────────────────────── */}
        <section className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 lg:min-h-0 flex flex-col gap-3">
            {/* Review queue */}
            <div className="sd-panel sd-roadmaps lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0" style={headStrip}>
                <span className="font-bold truncate" style={{ color: c.ink }}>┌─[ review_queue ]</span>
                <Link href="/admin/terminal?view=review" className="text-[11px] shrink-0 whitespace-nowrap font-bold" style={{ color: c.primary }}>
                  OPEN IN SHELL ➔
                </Link>
              </div>
              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-3 flex flex-col gap-3 lg:overflow-y-auto">
                  {queueLoading ? (
                    <div className="text-[12px]" style={{ color: c.dim }}>SCANNING QUEUE<span className="sd-cursor">_</span></div>
                  ) : topQueue.length === 0 ? (
                    <div className="text-[12px]" style={{ color: c.dim }}>QUEUE CLEAR — nothing awaiting review.</div>
                  ) : (
                    topQueue.map((q) => (
                      <Link
                        key={q.id}
                        href={`/admin/terminal?view=review&ref=${q.id}`}
                        className="sd-track flex flex-col gap-0.5 cursor-pointer"
                      >
                        <div className="flex justify-between items-center gap-2 text-[12px]">
                          <span className="font-semibold truncate min-w-0" style={{ color: c.ink }}>
                            {q.title.toUpperCase().replace(/\s+/g, "_")}
                          </span>
                          <span className="font-bold shrink-0 whitespace-nowrap" style={{ color: c.primary }}>
                            {q.draftContent ? "[DRAFT]" : `[${q.reviewStatus.toUpperCase()}]`}
                          </span>
                        </div>
                        <div className="text-[11px] truncate" style={{ color: c.faint }}>
                          {q.author?.name ?? "?"} · {fmtDay(q.createdAt)}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Roadmap tracks */}
            <div className="sd-panel shrink-0 flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0" style={headStrip}>
                <span className="font-bold truncate" style={{ color: c.ink }}>┌─[ roadmap_tracks ]</span>
                <span className="text-[11px] shrink-0 whitespace-nowrap" style={{ color: c.faint }}>
                  ENROLLED: {roadmapsLoading ? "--" : topRoadmaps.length}
                </span>
              </div>
              <div className="px-3 sm:px-4 py-3 flex flex-col gap-3">
                {roadmapsLoading ? (
                  <div className="text-[12px]" style={{ color: c.dim }}>SCANNING TRACKS<span className="sd-cursor">_</span></div>
                ) : topRoadmaps.length === 0 ? (
                  <div className="text-[12px]" style={{ color: c.dim }}>NO ROADMAPS WITH ENROLMENT YET.</div>
                ) : (
                  topRoadmaps.map((r) => (
                    <div key={r.roadmapId} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center gap-2 text-[12px]">
                        <span className="font-semibold truncate min-w-0" style={{ color: c.ink }}>
                          {r.title.toUpperCase().replace(/\s+/g, "_")}
                        </span>
                        <span className="font-bold shrink-0 whitespace-nowrap" style={{ color: c.primary }}>
                          {r.averageCompletionPercentage}% [{r.totalCompletedConcepts}/{r.totalConcepts}]
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] leading-none select-none" style={{ color: c.primary }}>
                        <span className="shrink-0">[</span>
                        <span className="sd-bar flex-1 min-w-0" style={{ "--sd-bar-pct": `${r.averageCompletionPercentage}%`, "--sd-bar-fill": c.primary, "--sd-bar-track": c.line } as React.CSSProperties}>
                          <span className="sd-bar-progress" />
                        </span>
                        <span className="shrink-0">]</span>
                      </div>
                      <div className="text-[11px]" style={{ color: c.faint }}>
                        {r.totalEnrolledDevelopers} ENROLLED
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 lg:min-h-0 flex flex-col gap-3">
            {/* Developers */}
            <div className="sd-panel sd-badges lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0" style={headStrip}>
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ developers :: {developersLoading ? "--" : developers.length} TOTAL ]
                </span>
                <Link href="/admin/terminal?view=users" className="text-[11px] shrink-0 whitespace-nowrap font-bold" style={{ color: c.primary }}>
                  MANAGE ➔
                </Link>
              </div>
              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 py-2 flex flex-col gap-1 lg:overflow-y-auto">
                  {developersLoading ? (
                    <div className="text-[12px] px-1" style={{ color: c.dim }}>LOADING<span className="sd-cursor">_</span></div>
                  ) : topDevelopers.length === 0 ? (
                    <div className="text-[12px] px-1" style={{ color: c.dim }}>NO DEVELOPERS YET.</div>
                  ) : (
                    topDevelopers.map((d) => (
                      <div key={d.developerId} className="flex items-center justify-between px-1 py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold shrink-0" style={{ color: c.primary }}>▸</span>
                          <span className="font-medium text-[12px] truncate" style={{ color: c.ink }}>
                            {d.name.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] shrink-0" style={{ color: c.faint }}>
                          {d.conceptsAuthored}C · {d.roadmapsCreated}R · {d.questionsAnswered}Q
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top concepts */}
            <div className="sd-panel shrink-0 flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0" style={headStrip}>
                <span className="font-bold truncate" style={{ color: c.ink }}>┌─[ top_concepts ]</span>
              </div>
              <div className="px-3 sm:px-4 py-2 flex flex-col gap-1 text-[12px]">
                {conceptsLoading ? (
                  <div style={{ color: c.dim }}>TAILING<span className="sd-cursor">_</span></div>
                ) : topConcepts.length === 0 ? (
                  <div style={{ color: c.dim }}>NO COMPLETIONS RECORDED YET.</div>
                ) : (
                  topConcepts.map((t) => (
                    <div key={t.conceptId} className="flex items-baseline gap-2" style={{ color: c.text }}>
                      <span className="font-bold shrink-0" style={{ color: c.primary }}>[{t.completionCount}]</span>
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* activity.stdout — the bell feed */}
            <div className="sd-panel sd-events lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0" style={headStrip}>
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ activity.stdout<span className="hidden sm:inline"> :: bell_feed</span> ]
                </span>
                <div className="flex items-center gap-1.5 text-[11px] shrink-0" style={{ color: c.faint }}>
                  <Link href="/admin/terminal?view=notify" className="font-bold" style={{ color: c.primary }}>OPEN ➔</Link>
                </div>
              </div>
              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-2 flex flex-col gap-1 text-[12px] leading-relaxed lg:overflow-y-auto">
                  {eventLog.length === 0 ? (
                    <div style={{ color: c.dim }}>NO EVENTS YET — submissions, decisions and jobs stream here.</div>
                  ) : (
                    eventLog.map((e) => (
                      <div key={e.id} className="sd-line-in flex items-baseline gap-2" style={{ color: c.text }}>
                        <span className="text-[11px]" style={{ color: c.faint }}>[{fmtDay(e.createdAt)}]</span>
                        <span className="font-bold shrink-0" style={{ color: e.isRead ? c.faint : c.primary }}>
                          [{e.isRead ? "SEEN" : "NEW"}]
                        </span>
                        <span className="truncate">
                          {(e.payload?.roadmapTitle as string) ||
                            (e.payload?.conceptTitle as string) ||
                            (e.payload?.targetLabel as string) ||
                            e.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
