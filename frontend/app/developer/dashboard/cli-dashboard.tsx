"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { User } from "@/lib/auth";
import { useTheme } from "@/providers/theme-provider";
import { useAllRoadmapsProgress } from "@/lib/hooks/use-roadmap-progress";
import { DARK, LIGHT } from "@/components/terminal/themes";
import { TerminalHeader } from "@/components/terminal/terminal-chrome";
import { useTerminalLogout } from "@/components/terminal/logout-dialog";
import { queueTerminalCommand } from "@/lib/terminal/session";
import { formatClock, formatDate, zoneAbbrev } from "@/lib/timezone";
import { TerminalReadout, useTerminalMotion } from "./terminal-motion";
import "./terminal-dashboard.css";

// ─── Types matching backend responses ───────────────────────────────────────

interface EarnedBadgeItem {
  id: string;
  name: string;
  description: string;
  criteriaKey: string;
  earnedAt: string;
}

interface GamificationData {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  earnedBadges?: EarnedBadgeItem[];
}

interface UserConceptProgress {
  id: string;
  userId: string;
  conceptId: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  concept?: {
    id: string;
    title: string;
    slug: string;
    difficulty?: "easy" | "medium" | "hard";
  };
}

interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  criteriaKey: string;
}

const XP_BY_DIFFICULTY: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

// A year, which is exactly what makes the graph read like GitHub's: 365 days
// plus a lead-pad of 0–6 always rounds to 53 week-columns, whatever weekday
// today falls on. Anything shorter leaves the panel mostly empty.
const ACTIVITY_DAYS = 365;

// Uppercased to sit in the terminal type register with the rest of the UI.
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Title case, for the hover tooltip — "120 XP on July 12th" reads as a
// sentence, so it doesn't want the axis labels' shouting caps.
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * The graph's intensity scale — the knobs for how dark a day gets.
 *
 * `minXp` is the floor for each step; `mix` is how much accent is blended into
 * the panel colour at that step, as a percentage. Raise the `minXp` values to
 * make dark cells harder to earn, raise the `mix` values to make every step
 * bolder. Steps are ordered lightest → darkest and matched from the top down,
 * so they must stay sorted by `minXp`.
 *
 * Defaults are anchored to real XP: a concept is 10/20/35 by difficulty and a
 * correct review is 2, so ~1 concept lands on step 1, a solid session on
 * step 2, and only a genuinely heavy day reaches step 4.
 */
const ACTIVITY_SCALE = [
  { minXp: 1, mix: 26 },
  { minXp: 25, mix: 48 },
  { minXp: 60, mix: 72 },
  { minXp: 110, mix: 100 },
];

interface ActivityDay {
  date: string;
  active: boolean;
  xp: number;
}

/** 1 → "1st", 2 → "2nd", 12 → "12th", 23 → "23rd". */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Stable pseudo-id from a string — keeps TTY/PID decoration hydration-safe. */
function stableNumber(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

/** Badge category from criteriaKey — real grouping, not an invented rarity. */
function badgeTag(criteriaKey: string | undefined, name: string): string {
  const key = `${criteriaKey || ""} ${name}`.toLowerCase();
  if (key.includes("streak")) return "STREAK";
  if (key.includes("xp")) return "XP";
  if (key.includes("concept")) return "CONCEPT";
  return "BADGE";
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Fills a panel's leftover vertical space with faint empty-buffer rules —
 * the vim/less convention for "nothing below here". Keeps panels visually
 * full without fabricating data rows. Desktop only: on phones the shell
 * scrolls naturally, so there is no leftover space to fill.
 */
function BufferFill({ line }: { line: string }) {
  return (
    <div
      className="hidden lg:block lg:flex-1 lg:min-h-0"
      aria-hidden="true"
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 19px, ${line} 19px 20px)`,
        opacity: 0.35,
      }}
    />
  );
}

export default function CliDeveloperDashboard() {
  const { isDark } = useTheme();
  const { motionEnabled, reducedMotion, toggleMotion } = useTerminalMotion();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();

  // Client-only gate for time-derived decoration (avoids hydration mismatch)
  const [mounted, setMounted] = useState(false);
  const [uptimeSec, setUptimeSec] = useState(0);
  // The instant, not a formatted string — the account's zone isn't known until
  // the user query resolves below, so formatting happens at render.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setUptimeSec((s) => s + 1);
      setNowMs(Date.now());
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const [cmd, setCmd] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: user } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => (await apiClient.get<User>("/users/me")).data,
  });
  const tz = user?.timezone;
  const tzLabel = useMemo(() => zoneAbbrev(tz), [tz]);
  const clock = nowMs === null ? "--:--:--" : formatClock(nowMs, tz);

  useEffect(() => {
    const focusPrompt = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey ||
          target?.closest("input, textarea, select, [contenteditable=true], dialog")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", focusPrompt);
    return () => window.removeEventListener("keydown", focusPrompt);
  }, []);

  const submitCmd = (event: React.FormEvent) => {
    event.preventDefault();
    if (cmd.trim()) queueTerminalCommand(cmd.trim());
    router.push("/developer/terminal");
  };

  const { data: gamification, isLoading: gamificationLoading } =
    useQuery<GamificationData>({
      queryKey: ["gamification", "me"],
      queryFn: async () =>
        (await apiClient.get<GamificationData>("/gamification/me")).data,
    });

  const { data: activityList = [], isLoading: activityLoading } = useQuery<
    ActivityDay[]
  >({
    queryKey: ["gamification", "activity", ACTIVITY_DAYS],
    queryFn: async () =>
      (
        await apiClient.get<ActivityDay[]>(
          `/gamification/activity?days=${ACTIVITY_DAYS}`,
        )
      ).data,
  });

  const { data: progressList = [], isLoading: progressLoading } = useQuery<
    UserConceptProgress[]
  >({
    queryKey: ["progress", "me"],
    queryFn: async () =>
      (await apiClient.get<UserConceptProgress[]>("/progress/me")).data,
  });

  const { data: roadmaps = [], isLoading: roadmapsLoading } = useQuery<
    Roadmap[]
  >({
    queryKey: ["roadmaps"],
    queryFn: async () => (await apiClient.get<Roadmap[]>("/roadmaps")).data,
  });

  const roadmapIds = useMemo(() => roadmaps.map((r) => r.id), [roadmaps]);
  const { data: roadmapsProgressMap = {}, isLoading: roadmapProgressLoading } =
    useAllRoadmapsProgress(roadmapIds);

  const { data: allBadges = [], isLoading: badgesLoading } = useQuery<
    BadgeDef[]
  >({
    queryKey: ["badges"],
    queryFn: async () => (await apiClient.get<BadgeDef[]>("/badges")).data,
  });

  const { data: reviewDueData, isLoading: reviewLoading } = useQuery<{
    count: number;
    dueCount: number;
  }>({
    queryKey: ["review", "due-count"],
    queryFn: async () =>
      (
        await apiClient.get<{ count: number; dueCount: number }>(
          "/review/due-count",
        )
      ).data,
  });

  const isSyncing =
    gamificationLoading ||
    activityLoading ||
    progressLoading ||
    roadmapsLoading ||
    roadmapProgressLoading ||
    badgesLoading ||
    reviewLoading;

  // ── Derived ─────────────────────────────────────────────────────────────

  const completedCount = useMemo(
    () => progressList.filter((p) => p.status === "completed").length,
    [progressList],
  );

  const totalCatalogued = useMemo(
    () =>
      Object.values(roadmapsProgressMap).reduce(
        (sum, r) => sum + (r.totalConcepts ?? 0),
        0,
      ),
    [roadmapsProgressMap],
  );

  const currentFocus = useMemo(() => {
    const inProgress = progressList.filter((p) => p.status === "in_progress");
    if (inProgress.length === 0) return null;
    return [...inProgress].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )[0];
  }, [progressList]);

  // Which roadmap contains the in-flight concept (real lookup, no invention)
  const focusRoadmapTitle = useMemo(() => {
    if (!currentFocus) return null;
    for (const rm of roadmaps) {
      const prog = roadmapsProgressMap[rm.id];
      if (prog?.concepts?.some((x) => x.conceptId === currentFocus.conceptId)) {
        return rm.title;
      }
    }
    return null;
  }, [currentFocus, roadmaps, roadmapsProgressMap]);

  // Next unstarted concept, so the empty state can point somewhere real
  const nextUpConcept = useMemo(() => {
    const hits = roadmaps
      .map((rm) => {
        const next = roadmapsProgressMap[rm.id]?.concepts?.find(
          (x) => x.status === "not_started",
        );
        return next ? { ...next, roadmapTitle: rm.title } : null;
      })
      .filter(Boolean);
    return hits.length > 0 ? hits[0] : null;
  }, [roadmaps, roadmapsProgressMap]);

  const activeDays = useMemo(
    () => activityList.filter((d) => d.active).length,
    [activityList],
  );

  const activePct =
    activityList.length > 0
      ? ((activeDays / activityList.length) * 100).toFixed(1)
      : "0.0";

  /**
   * Reshape the flat day list into GitHub's contribution-graph geometry: one
   * column per calendar week, seven rows Sun→Sat. The first column is
   * lead-padded with nulls so every row lands on its real weekday, and the
   * last is tail-padded so the grid stays rectangular.
   *
   * Dates are parsed as UTC (`T00:00:00Z`) purely to read a weekday off a
   * `YYYY-MM-DD` string — the backend has already bucketed these into the
   * user's own timezone, so no zone maths happens here.
   */
  const activityWeeks = useMemo(() => {
    const source: Array<ActivityDay | null> =
      activityList.length > 0
        ? activityList
        : Array.from({ length: ACTIVITY_DAYS }, () => null);

    const first = source.find((d): d is ActivityDay => d !== null);
    const leadPad = first
      ? new Date(`${first.date}T00:00:00Z`).getUTCDay()
      : new Date().getUTCDay();

    const cells: Array<ActivityDay | null> = [
      ...Array.from({ length: leadPad }, () => null),
      ...source,
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: Array<{ label: string; cells: Array<ActivityDay | null> }> = [];
    let lastMonth = -1;

    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7);
      const marker = week.find((d): d is ActivityDay => d !== null);
      let label = "";

      if (marker) {
        const month = new Date(`${marker.date}T00:00:00Z`).getUTCMonth();
        // Label only where the month turns over, and never in two adjacent
        // columns — the text is wider than the column it marks.
        if (month !== lastMonth) {
          const prev = weeks[weeks.length - 1];
          if (!prev || !prev.label) label = MONTHS[month];
          lastMonth = month;
        }
      }

      weeks.push({ label, cells: week });
    }

    return weeks;
  }, [activityList]);

  /**
   * Cell shade for a day, graded by XP through ACTIVITY_SCALE. Every step is a
   * mix of the accent into the panel colour rather than a new hue, so dark
   * stays green and light stays amber with no hex outside the palette.
   */
  const ghColor = useCallback(
    (day: ActivityDay | null): string => {
      if (!day) return "transparent";
      if (day.xp <= 0) return c.hover;

      let mix = ACTIVITY_SCALE[0].mix;
      for (const step of ACTIVITY_SCALE) {
        if (day.xp >= step.minXp) mix = step.mix;
      }
      return `color-mix(in srgb, ${c.primary} ${mix}%, ${c.panel})`;
    },
    [c],
  );

  /** "120 XP on July 12th" / "No XP on July 12th" — GitHub's phrasing. */
  const ghTipText = useCallback((day: ActivityDay): string => {
    const [y, m, d] = day.date.split("-").map(Number);
    const when = `${MONTHS_LONG[m - 1]} ${ordinal(d)}`;
    // The graph spans two calendar years, so name the year on older cells.
    const suffix = y === new Date().getFullYear() ? "" : `, ${y}`;
    const amount = day.xp > 0 ? `${day.xp} XP` : "No XP";
    return `${amount} on ${when}${suffix}`;
  }, []);

  // Hover tooltip. Positioned from the cell's viewport rect and portalled to
  // <body>, so it can't be clipped by the graph's own horizontal scroll.
  const [ghTip, setGhTip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const showGhTip = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>, day: ActivityDay) => {
      const r = e.currentTarget.getBoundingClientRect();
      setGhTip({
        text: ghTipText(day),
        x: r.left + r.width / 2,
        y: r.top,
      });
    },
    [ghTipText],
  );

  // Phones scroll the graph sideways; open it on today rather than a year ago.
  // Guarded on the computed overflow: on desktop the graph is `hidden`, but
  // that still permits *programmatic* scrolling (only `clip` doesn't), and the
  // last month label overhangs by a few px — enough to shunt the grid left and
  // shave the Mon/Wed/Fri labels off their gutter.
  const activityScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = activityScrollRef.current;
    if (!el) return;
    const scrollable = getComputedStyle(el).overflowX === "auto";
    if (scrollable) el.scrollLeft = el.scrollWidth;
  }, [activityWeeks]);

  const rankedRoadmaps = useMemo(() => {
    return roadmaps
      .map((rm) => {
        const p = roadmapsProgressMap[rm.id];
        return {
          id: rm.id,
          title: rm.title,
          total: p?.totalConcepts ?? 0,
          done: p?.completedConceptsCount ?? p?.completedConcepts ?? 0,
          pct: Math.round(p?.completionPercentage ?? p?.percentage ?? 0),
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [roadmaps, roadmapsProgressMap]);

  const earnedMap = useMemo(() => {
    const m = new Map<string, EarnedBadgeItem>();
    (gamification?.earnedBadges ?? []).forEach((b) => {
      m.set(b.id, b);
      if (b.criteriaKey) m.set(b.criteriaKey, b);
      m.set(b.name.toLowerCase(), b);
    });
    return m;
  }, [gamification]);

  /** All catalogued badges, earned first — fills the panel with real rows. */
  const badgeRows = useMemo(() => {
    const rows = allBadges.map((b) => {
      const earned =
        earnedMap.get(b.id) ??
        earnedMap.get(b.criteriaKey) ??
        earnedMap.get(b.name.toLowerCase()) ??
        null;
      return { ...b, earnedAt: earned?.earnedAt ?? null };
    });
    return rows.sort((a, b) => {
      if (!!a.earnedAt !== !!b.earnedAt) return a.earnedAt ? -1 : 1;
      if (a.earnedAt && b.earnedAt) {
        return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [allBadges, earnedMap]);

  const earnedCount = useMemo(
    () => badgeRows.filter((b) => b.earnedAt).length,
    [badgeRows],
  );

  /** Event log built from real timestamps: concept completions + badges. */
  const eventLog = useMemo(() => {
    const events: Array<{
      at: number;
      kind: "CONCEPT" | "BADGE";
      text: string;
      xp: number | null;
    }> = [];

    progressList.forEach((p) => {
      if (p.status === "completed" && p.completedAt) {
        events.push({
          at: new Date(p.completedAt).getTime(),
          kind: "CONCEPT",
          text: `completed ${p.concept?.title ?? p.conceptId.slice(0, 8)}`,
          xp: XP_BY_DIFFICULTY[p.concept?.difficulty ?? "medium"] ?? 20,
        });
      }
    });

    (gamification?.earnedBadges ?? []).forEach((b) => {
      events.push({
        at: new Date(b.earnedAt).getTime(),
        kind: "BADGE",
        text: `earned "${b.name}"`,
        xp: null,
      });
    });

    return events.sort((a, b) => b.at - a.at).slice(0, 12);
  }, [progressList, gamification]);

  const reviewDue = reviewDueData?.dueCount ?? 0;

  // ── Decoration ──────────────────────────────────────────────────────────

  const uptime = `${pad(Math.floor(uptimeSec / 3600))}:${pad(
    Math.floor((uptimeSec % 3600) / 60),
  )}:${pad(uptimeSec % 60)}`;

  const seed = user?.id ?? "source-dev";
  const tty = stableNumber(seed, 8);
  const pid = 10000 + stableNumber(seed, 79999);

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

  const streak = gamification?.currentStreak ?? 0;
  const longest = gamification?.longestStreak ?? 0;

  return (
    // Responsive shell. Phone/tablet: normal page scroll, panels take their
    // natural height. Desktop (lg+): fixed viewport frame — nothing scrolls
    // the page, individual panels scroll, footer welded to the bottom edge.
    <div
      className={`sd-dash ${isDark ? "" : "sd-dash-light"} min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative`}
      data-motion={motionEnabled ? "on" : "off"}
      style={{
        backgroundColor: c.base,
        color: c.text,
        "--sd-accent": c.primary,
      } as React.CSSProperties}
    >
      <div className="sd-boot-sweep" aria-hidden="true" />
      {/* CRT overlay */}
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
        notificationsHref="/developer/terminal?view=notify"
      />
      {logoutDialog}

      {/* ══ MAIN — edge to edge; fills height only once the shell is fixed ═ */}
      <main className="w-full lg:flex-1 lg:min-h-0 px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3">
        {/* ── BAND 1: mission control + 4 gauges ───────────────────────── */}
        <section className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Current focus */}
          <div
            className="sd-panel sd-mission lg:col-span-7 flex flex-col relative overflow-hidden"
            style={{
              backgroundColor: c.panel,
              border: `1px solid ${currentFocus ? `${c.primary}66` : c.line}`,
              boxShadow: `3px 3px 0px 0px ${c.shadow}`,
            }}
          >
            <div
              className="px-3 py-1.5 flex items-center justify-between text-[12px] shrink-0"
              style={headStrip}
            >
              <div
                className="flex items-center gap-2 font-bold tracking-tight min-w-0"
                style={{ color: c.ink }}
              >
                <span style={{ color: c.primary }} className="shrink-0">
                  ▶
                </span>
                <span className="truncate">
                  ┌─[ mission_control
                  <span className="hidden sm:inline"> :: active_session</span> ]
                </span>
              </div>
              {currentFocus && (
                <span
                  className="sd-pulse font-bold text-[11px] px-1.5"
                  style={{
                    color: c.primary,
                    backgroundColor: `${c.primary}1a`,
                    border: `1px solid ${c.primary}66`,
                  }}
                >
                  [ACTIVE RUNTIME]
                </span>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col justify-between gap-3 flex-1">
              {progressLoading ? (
                <div className="text-[12px]" style={{ color: c.dim }}>
                  LOADING SESSION<span className="sd-cursor">_</span>
                </div>
              ) : currentFocus ? (
                <>
                  <div>
                    <div
                      className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: c.faint }}
                    >
                      <span>CURRENT CONCEPT IN FLIGHT</span>
                      {focusRoadmapTitle && (
                        <span style={{ color: c.primary }}>
                          {focusRoadmapTitle.toUpperCase().replace(/\s+/g, "_")}
                        </span>
                      )}
                    </div>
                    <h1
                      className="font-display text-xl md:text-2xl font-bold tracking-tight leading-snug truncate"
                      style={{ color: c.ink }}
                    >
                      {currentFocus.concept?.title ?? "In-progress concept"}
                    </h1>

                    <div
                      className="mt-2 grid grid-cols-2 gap-3 py-1.5 text-[11px]"
                      style={{
                        borderTop: `1px solid ${c.line}`,
                        borderBottom: `1px solid ${c.line}`,
                      }}
                    >
                      <div>
                        <span className="block" style={{ color: c.faint }}>
                          STATUS
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: c.primary }}
                        >
                          [IN_PROGRESS]
                        </span>
                      </div>
                      <div>
                        <span className="block" style={{ color: c.faint }}>
                          DIFFICULTY
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: c.text }}
                        >
                          {(
                            currentFocus.concept?.difficulty ?? "unrated"
                          ).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/developer/terminal?concept=${currentFocus.conceptId}`}
                    className="sd-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
                    style={{
                      backgroundColor: c.primary,
                      color: c.base,
                      boxShadow: `2px 2px 0px 0px ${c.shadowStrong}`,
                    }}
                  >
                    [ENTER] RESUME CONCEPT ➔
                  </Link>
                </>
              ) : (
                <>
                  <div>
                    <div
                      className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: c.faint }}
                    >
                      <span>NEXT UP</span>
                      {nextUpConcept?.roadmapTitle && (
                        <span style={{ color: c.primary }}>
                          {nextUpConcept.roadmapTitle
                            .toUpperCase()
                            .replace(/\s+/g, "_")}
                        </span>
                      )}
                    </div>
                    <h1
                      className="font-display text-xl md:text-2xl font-bold tracking-tight leading-snug truncate"
                      style={{ color: c.ink }}
                    >
                      {nextUpConcept?.conceptTitle ?? "NO ACTIVE CONCEPT"}
                    </h1>

                    <div
                      className="mt-2 grid grid-cols-2 gap-3 py-1.5 text-[11px]"
                      style={{
                        borderTop: `1px solid ${c.line}`,
                        borderBottom: `1px solid ${c.line}`,
                      }}
                    >
                      <div>
                        <span className="block" style={{ color: c.faint }}>
                          QUEUE_STATE
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: c.dim }}
                        >
                          [{nextUpConcept ? "AWAITING_START" : "IDLE"}]
                        </span>
                      </div>
                      <div>
                        <span className="block" style={{ color: c.faint }}>
                          COMPLETED
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: c.text }}
                        >
                          {completedCount}/{totalCatalogued || "--"} CONCEPTS
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={
                      nextUpConcept
                        ? `/developer/terminal?concept=${nextUpConcept.conceptId}`
                        : "/developer/terminal?view=roadmaps"
                    }
                    className="sd-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
                    style={{
                      backgroundColor: c.primary,
                      color: c.base,
                      boxShadow: `2px 2px 0px 0px ${c.shadowStrong}`,
                    }}
                  >
                    {nextUpConcept
                      ? "[ENTER] START CONCEPT ➔"
                      : "[ENTER] BROWSE ROADMAPS ➔"}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 2x2 gauge cluster */}
          <div className="sd-gauges lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Streak */}
            <div
              className="sd-panel px-3 py-2.5 flex flex-col justify-between"
              style={panel}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between"
                style={{ color: c.dim }}
              >
                <span>CURRENT_STREAK</span>
                <span className="text-[9px]" style={{ color: c.faint }}>
                  #01
                </span>
              </div>
              <div
                className="my-1 text-xl md:text-2xl font-bold tracking-tight"
                style={{ color: c.ink }}
              >
                <TerminalReadout
                  text={gamificationLoading
                    ? "--"
                    : `${streak} ${plural(streak, "DAY", "DAYS")}`}
                  enabled={motionEnabled}
                />
              </div>
              <div
                className="text-[10px] pt-1"
                style={{ color: c.faint, borderTop: `1px solid ${c.line}` }}
              >
                LONGEST:{" "}
                {gamificationLoading
                  ? "--"
                  : `${longest} ${plural(longest, "DAY", "DAYS")}`}
              </div>
            </div>

            {/* XP */}
            <div
              className="sd-panel px-3 py-2.5 flex flex-col justify-between"
              style={panel}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between"
                style={{ color: c.dim }}
              >
                <span>TOTAL_XP</span>
                <span className="text-[9px]" style={{ color: c.faint }}>
                  #02
                </span>
              </div>
              <div
                className="my-1 text-xl md:text-2xl font-bold tracking-tight"
                style={{ color: c.ink }}
              >
                <TerminalReadout
                  text={num(gamification?.totalXp, gamificationLoading)}
                  enabled={motionEnabled}
                />
              </div>
              <div
                className="text-[10px] pt-1"
                style={{ color: c.dim, borderTop: `1px solid ${c.line}` }}
              >
                RUNNING TOTAL
              </div>
            </div>

            {/* Concepts */}
            <div
              className="sd-panel px-3 py-2.5 flex flex-col justify-between"
              style={panel}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between"
                style={{ color: c.dim }}
              >
                <span>CONCEPTS_DONE</span>
                <span className="text-[9px]" style={{ color: c.faint }}>
                  #03
                </span>
              </div>
              <div
                className="my-1 text-xl md:text-2xl font-bold tracking-tight"
                style={{ color: c.ink }}
              >
                <TerminalReadout
                  text={progressLoading ? "--" : String(completedCount)}
                  enabled={motionEnabled}
                />
              </div>
              <div
                className="text-[10px] pt-1"
                style={{ color: c.dim, borderTop: `1px solid ${c.line}` }}
              >
                OF {roadmapProgressLoading ? "--" : totalCatalogued} CATALOGUED
              </div>
            </div>

            {/* Reviews due — the action card of the four, but only when there
                is something to act on. With a non-empty queue it wears the full
                accent treatment (washed background, 2px accent border, accent
                shadow and type, pulsing ALERT chip); at 0 DUE it falls back to
                exactly its neighbours' styling. Green in dark, amber in light. */}
            <Link
              href="/developer/terminal?view=review"
              className="sd-panel sd-review px-3 py-2.5 flex flex-col justify-between relative overflow-hidden cursor-pointer"
              style={{
                backgroundColor: reviewDue > 0 ? c.dueWash : c.panel,
                border:
                  reviewDue > 0
                    ? `2px solid ${c.primary}`
                    : `1px solid ${c.line}`,
                boxShadow: `3px 3px 0px 0px ${reviewDue > 0 ? c.primary : c.shadow}`,
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
                style={{ color: reviewDue > 0 ? c.primary : c.dim }}
              >
                <span>REVIEWS_DUE</span>
                {reviewDue > 0 ? (
                  <span
                    className="sd-pulse inline-flex items-center px-1 text-[9px] font-bold"
                    style={{
                      backgroundColor: c.dueChipBg,
                      color: c.dueChipInk,
                      border: `1px solid ${c.dueChipLine}`,
                    }}
                  >
                    ALERT
                  </span>
                ) : (
                  <span className="text-[9px]" style={{ color: c.faint }}>
                    #04
                  </span>
                )}
              </div>
              <div
                className="my-1 text-xl md:text-2xl font-bold tracking-tight flex items-baseline gap-1"
                style={{ color: reviewDue > 0 ? c.primary : c.ink }}
              >
                <span>
                  <TerminalReadout
                    text={reviewLoading ? "--" : String(reviewDue)}
                    enabled={motionEnabled}
                  /> DUE
                </span>
                {reviewDue > 0 && (
                  <span
                    className="text-[10px] font-normal"
                    style={{ color: c.dueSub }}
                  >
                    [ACTION]
                  </span>
                )}
              </div>
              <div
                className="text-[10px] pt-1"
                style={{
                  color: reviewDue > 0 ? c.dueSub : c.dim,
                  borderTop: `1px solid ${reviewDue > 0 ? c.dueRule : c.line}`,
                }}
              >
                SRS FLASHCARD QUEUE
              </div>
            </Link>
          </div>
        </section>

        {/* ── BAND 2: absorbs remaining height on desktop only ─────────── */}
        <section className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* LEFT */}
          <div className="lg:col-span-7 lg:min-h-0 flex flex-col gap-3">
            {/* Study activity — GitHub-style contribution graph, fixed height */}
            <div className="sd-panel sd-activity shrink-0 flex flex-col" style={panel}>
              <div
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0"
                style={headStrip}
              >
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ study_activity
                  <span className="hidden sm:inline"> :: 1y_consistency</span>{" "}
                  ]
                </span>
                <span
                  className="text-[11px] font-medium shrink-0 whitespace-nowrap"
                  style={{ color: c.dim }}
                >
                  {activityLoading
                    ? "LOADING..."
                    : `${activeDays}/${activityList.length} ACTIVE`}{" "}
                  {!activityLoading && (
                    <span className="font-bold" style={{ color: c.primary }}>
                      ({activePct}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
                {/* GitHub's contribution graph: 53 week-columns, Sun→Sat rows.
                    From `md` up the columns are fluid, so the graph spans the
                    whole panel; phones keep readable cells and scroll instead.
                    Accent is the green in dark, amber in light. */}
                <div
                  ref={activityScrollRef}
                  className="sd-gh select-none"
                  style={
                    {
                      "--gh-cols": activityWeeks.length,
                      "--gh-edge": `color-mix(in srgb, ${c.line} 55%, transparent)`,
                    } as React.CSSProperties
                  }
                >
                  <div className="sd-gh-months" style={{ color: c.faint }}>
                    {activityWeeks.map((w, i) => (
                      <span key={`m-${i}`}>{w.label}</span>
                    ))}
                  </div>

                  <div className="sd-gh-body">
                    <div className="sd-gh-days" style={{ color: c.faint }}>
                      <span />
                      <span>Mon</span>
                      <span />
                      <span>Wed</span>
                      <span />
                      <span>Fri</span>
                      <span />
                    </div>

                    <div className="sd-gh-grid">
                      {activityWeeks.map((w, wi) =>
                        w.cells.map((d, di) => (
                          <span
                            key={`c-${wi}-${di}`}
                            className="sd-gh-cell"
                            data-active={Boolean(d && d.xp > 0)}
                            onMouseEnter={
                              d ? (e) => showGhTip(e, d) : undefined
                            }
                            onMouseLeave={d ? () => setGhTip(null) : undefined}
                            style={
                              d
                                ? {
                                    background: ghColor(d),
                                    boxShadow: "inset 0 0 0 1px var(--gh-edge)",
                                    "--sd-cell-delay": `${wi * 12 + di * 18}ms`,
                                  } as React.CSSProperties
                                : { background: "transparent" }
                            }
                          />
                        )),
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="pt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]"
                  style={{ color: c.dim, borderTop: `1px solid ${c.line}` }}
                >
                  <div className="hidden lg:inline" style={{ color: c.faint }}>
                    {`// DAY BOUNDARIES: ${tzLabel}`}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span style={{ color: c.faint }}>LESS</span>
                    {[0, ...ACTIVITY_SCALE.map((s) => s.minXp)].map((xp) => (
                      <span
                        key={`k-${xp}`}
                        className="sd-gh-key"
                        title={xp > 0 ? `${xp}+ XP` : "No XP"}
                        style={{
                          background: ghColor({
                            date: "",
                            active: xp > 0,
                            xp,
                          }),
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c.line} 55%, transparent)`,
                        }}
                      />
                    ))}
                    <span style={{ color: c.faint }}>MORE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roadmap progress — flexes to fill on desktop, scrolls if needed */}
            <div className="sd-panel sd-roadmaps lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0"
                style={headStrip}
              >
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ roadmap_progress ]
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/developer/content"
                    className="text-[11px] font-bold whitespace-nowrap"
                    style={{ color: c.primary }}
                  >
                    AUTHOR ➔
                  </Link>
                  <span
                    className="text-[11px] whitespace-nowrap"
                    style={{ color: c.faint }}
                  >
                    TRACKS: {roadmapsLoading ? "--" : rankedRoadmaps.length}
                    <span className="hidden sm:inline"> TOTAL</span>
                  </span>
                </span>
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-3 flex flex-col gap-3 lg:overflow-y-auto">
                  {roadmapsLoading || roadmapProgressLoading ? (
                    <div className="text-[12px]" style={{ color: c.dim }}>
                      SCANNING TRACKS<span className="sd-cursor">_</span>
                    </div>
                  ) : rankedRoadmaps.length === 0 ? (
                    <div className="text-[12px]" style={{ color: c.dim }}>
                      NO ROADMAPS AVAILABLE — instructors are still publishing.
                    </div>
                  ) : (
                    rankedRoadmaps.map((rm, index) => {
                      // Flat accent at every level: progress reads from how far
                      // the bar fills, never from a hue shift. Same rule as the
                      // entropy meter on the reset-password page.
                      const barColor = c.primary;

                      return (
                        <Link
                          key={rm.id}
                          href={`/developer/terminal?roadmap=${rm.id}`}
                          className="sd-track flex flex-col gap-0.5 cursor-pointer"
                          style={{ "--sd-delay": `${Math.min(index, 10) * 65}ms` } as React.CSSProperties}
                        >
                          <div className="flex justify-between items-center gap-2 text-[12px]">
                            <span
                              className="font-semibold truncate min-w-0"
                              style={{ color: c.ink }}
                            >
                              {rm.title.toUpperCase().replace(/\s+/g, "_")}
                            </span>
                            <span
                              className="font-bold shrink-0 whitespace-nowrap"
                              style={{ color: barColor }}
                            >
                              {rm.pct}% [{rm.done}/{rm.total}]
                            </span>
                          </div>
                          {/* Fluid bar: keeps the bracketed block-glyph look
                              but scales to any width instead of a fixed
                              character count that overflows on phones. */}
                          <div
                            className="flex items-center gap-1 text-[11px] leading-none select-none"
                            style={{ color: barColor }}
                          >
                            <span className="shrink-0">[</span>
                            <span
                              className="sd-bar flex-1 min-w-0"
                              style={
                                {
                                  "--sd-bar-pct": `${rm.pct}%`,
                                  "--sd-bar-fill": barColor,
                                  "--sd-bar-track": c.line,
                                } as React.CSSProperties
                              }
                            >
                              <span className="sd-bar-progress" />
                            </span>
                            <span className="shrink-0">]</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
                <BufferFill line={c.line} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 lg:min-h-0 flex flex-col gap-3">
            {/* Badges — every catalogued badge, earned first then locked */}
            <div className="sd-panel sd-badges lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0"
                style={headStrip}
              >
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ badges :: {badgesLoading ? "--" : earnedCount}/
                  {badgesLoading ? "--" : badgeRows.length} EARNED ]
                </span>
                <span
                  className="text-[11px] shrink-0 whitespace-nowrap hidden sm:inline"
                  style={{ color: c.faint }}
                >
                  ALL-TIME
                </span>
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 py-2 flex flex-col gap-1 lg:overflow-y-auto">
                  {badgesLoading || gamificationLoading ? (
                    <div className="text-[12px] px-1" style={{ color: c.dim }}>
                      LOADING<span className="sd-cursor">_</span>
                    </div>
                  ) : badgeRows.length === 0 ? (
                    <div className="text-[12px] px-1" style={{ color: c.dim }}>
                      NO BADGES CATALOGUED YET.
                    </div>
                  ) : (
                    badgeRows.map((b, index) => {
                      const has = Boolean(b.earnedAt);
                      return (
                        <div
                          key={b.id}
                          className="sd-badge-row flex items-center justify-between px-1 py-0.5"
                          data-earned={has}
                          style={{ "--sd-delay": `${Math.min(index, 10) * 55}ms` } as React.CSSProperties}
                          title={b.description}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="font-bold shrink-0"
                              style={{ color: has ? c.alert : c.line }}
                            >
                              {has ? "★" : "☆"}
                            </span>
                            <span
                              className="font-medium text-[12px] truncate"
                              style={{ color: has ? c.ink : c.faint }}
                            >
                              {b.name.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[11px]"
                              style={{ color: has ? c.faint : c.line }}
                            >
                              {has ? formatDate(b.earnedAt!, tz) : "[LOCKED]"}
                            </span>
                            <span
                              className="text-[10px] font-bold px-1.5"
                              style={{
                                color: has ? c.dim : c.line,
                                border: `1px solid ${c.line}`,
                                backgroundColor: has ? c.hover : "transparent",
                              }}
                            >
                              [{badgeTag(b.criteriaKey, b.name)}]
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <BufferFill line={c.line} />
              </div>
            </div>

            {/* activity.stdout */}
            <div className="sd-panel sd-events lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0"
                style={headStrip}
              >
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ activity.stdout
                  <span className="hidden sm:inline">
                    {" "}
                    :: client_event_log
                  </span>{" "}
                  ]
                </span>
                <div
                  className="flex items-center gap-1.5 text-[11px] shrink-0"
                  style={{ color: c.faint }}
                >
                  <span
                    className="sd-pulse w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: c.primary }}
                  />
                  <span className="font-bold" style={{ color: c.primary }}>
                    LIVE
                  </span>
                </div>
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-2 flex flex-col gap-1 text-[12px] leading-relaxed lg:overflow-y-auto">
                  {progressLoading ? (
                    <div style={{ color: c.dim }}>
                      TAILING<span className="sd-cursor">_</span>
                    </div>
                  ) : eventLog.length === 0 ? (
                    <div style={{ color: c.dim }}>
                      NO EVENTS YET — your activity will stream here.
                    </div>
                  ) : (
                    eventLog.map((e, i) => (
                      <div
                        key={`${e.at}-${i}`}
                        className="sd-line-in flex items-baseline gap-2"
                        style={{ color: c.text, "--sd-delay": `${i * 55}ms` } as React.CSSProperties}
                      >
                        <span
                          className="text-[11px]"
                          style={{ color: c.faint }}
                        >
                          [{formatClock(e.at, tz)}]
                        </span>
                        <span
                          className="font-bold shrink-0"
                          style={{
                            color: e.kind === "BADGE" ? c.alert : c.primary,
                          }}
                        >
                          [{e.kind}]
                        </span>
                        <span className="truncate">
                          {e.text}
                          {e.xp !== null && (
                            <span style={{ color: c.primary }}>
                              {" "}
                              (+{e.xp} XP)
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <BufferFill line={c.line} />
              </div>

              <div
                className="px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] flex items-center justify-between gap-2 shrink-0"
                style={{ color: c.faint, borderTop: `1px solid ${c.line}` }}
              >
                <span className="truncate min-w-0">
                  <span className="hidden sm:inline">EVENT_</span>BUF:{" "}
                  {eventLog.length}{" "}
                  {plural(eventLog.length, "EVENT", "EVENTS")}
                </span>
                <span
                  className="shrink-0 whitespace-nowrap"
                  style={{ color: c.dim }}
                >
                  {isSyncing ? "SYNCING" : "0 ERRORS"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER — live prompt, welded to the bottom edge ═══════════════ */}
      <footer
        className="w-full shrink-0 z-30"
        style={{ backgroundColor: c.panel, borderTop: `1px solid ${c.line}` }}
      >
        <form onSubmit={submitCmd} className="sd-prompt px-2 sm:px-3 md:px-4 py-2 flex items-center gap-2 text-[13px]" style={{ backgroundColor: c.head, borderBottom: `1px solid ${c.line}` }}>
          <label htmlFor="dashboard-command" className="font-bold shrink-0" style={{ color: c.primary }}>developer@source-dev:~$</label>
          <input id="dashboard-command" ref={inputRef} value={cmd} onChange={e => setCmd(e.target.value)} aria-label="Terminal command" placeholder="Open terminal or type a command…" autoComplete="off" spellCheck={false} className="min-w-0 flex-1 bg-transparent outline-none" style={{ color: c.text, caretColor: c.primary }} />
          <button type="submit" className="shrink-0 cursor-pointer text-[11px] font-bold py-1" style={{ color: c.primary }}>[<span className="hidden sm:inline">OPEN </span>CLI ↵]</button>
        </form>

        <div
          className="px-2 sm:px-3 md:px-4 py-1 flex items-center justify-between gap-2 text-[11px]"
          style={{ color: c.dim }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="whitespace-nowrap">[TTY: /dev/pts/{tty}]</span>
            <span className="hidden sm:inline whitespace-nowrap">
              [PID: {pid}]
            </span>
            <span className="hidden lg:inline whitespace-nowrap">
              [SESSION_ENCODING: UTF-8]
            </span>
            <span className="hidden xl:inline whitespace-nowrap">
              [{clock}]
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleMotion}
              disabled={reducedMotion}
              aria-label={reducedMotion ? "Animations disabled by system preference" : "Dashboard animations"}
              aria-pressed={motionEnabled}
              title={reducedMotion ? "Reduced motion is enabled in your system settings" : "Toggle terminal animations"}
              className="sd-motion-toggle cursor-pointer disabled:cursor-default"
              style={{ color: motionEnabled ? c.primary : c.dim }}
            >
              [FX: {motionEnabled ? "ON" : "OFF"}]
            </button>
            <div
              className="flex items-center gap-1.5 font-semibold whitespace-nowrap"
              style={{ color: isSyncing ? c.alert : c.primary }}
            >
              <span className={isSyncing ? "sd-pulse" : ""} aria-hidden="true">●</span>
              <span>[SYNC: {isSyncing ? "FETCHING" : "STABLE"}]</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Activity-graph hover tooltip. Portalled to <body> and positioned from
          the cell's viewport rect, so the graph's own horizontal scroll on
          phones can't clip it. Instant, unlike a native `title`. */}
      {mounted &&
        ghTip &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[60] px-2 py-1 text-[11px] font-medium rounded pointer-events-none whitespace-nowrap"
            style={{
              left: Math.min(Math.max(ghTip.x, 76), window.innerWidth - 76),
              top: ghTip.y - 8,
              transform: "translate(-50%, -100%)",
              background: c.head,
              color: c.text,
              border: `1px solid ${c.line}`,
              boxShadow: `2px 2px 0px 0px ${c.shadow}`,
            }}
          >
            {ghTip.text}
          </div>,
          document.body,
        )}
    </div>
  );
}
