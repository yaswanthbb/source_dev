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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { User, clearAuth } from "@/lib/auth";
import { useTheme } from "@/providers/theme-provider";
import { useAllRoadmapsProgress } from "@/lib/hooks/use-roadmap-progress";
import {
  CommandAborted,
  LineKind,
  bootLines,
  completeCommand,
  matchCommands,
  runCommand,
  subHints,
} from "@/lib/terminal/commands";
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

// ─── Profile shell types ────────────────────────────────────────────────────

/** One rendered row of the shell buffer. `delay` staggers the boot banner. */
interface ShellLine {
  id: number;
  kind: LineKind;
  text: string;
  delay?: number;
}

/** An in-flight `io.ask`: the question on screen and the promise waiting on
 *  the next submit. `mask` swaps the input to a password field. */
interface PendingAsk {
  prompt: string;
  mask: boolean;
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}

// ─── Theme palettes ─────────────────────────────────────────────────────────
// Dark values are verbatim from the Stitch export. Light values are login's
// palette (app/(auth)/login/page.tsx) — the light export drifted to a green
// accent (#15803d / #16a34a), which is not in the terminal theme. Two sets sit
// outside login and say so where they are defined: the reviews-due wash, taken
// from the export, and `alert`, which login has no equivalent for.

const DARK = {
  base: "#0a0c0e",
  panel: "#111417",
  head: "#171a1d",
  hover: "#202327",
  ink: "#ffffff",
  text: "#e2e4e8",
  dim: "#949aa2",
  faint: "#656a73",
  line: "#34383f",
  primary: "#38ef7d",
  alert: "#f59e0b",
  // Reviews-due card, applied only while the queue is non-empty so the card
  // reads as the action card exactly when there is an action. Mirrors the light
  // export's amber wash, swapped to the dark accent.
  dueWash: "#0d1f16",
  dueChipBg: "#123524",
  dueChipInk: "#38ef7d",
  dueChipLine: "#1f7a4d",
  dueSub: "#7ad9a3",
  dueRule: "#1f7a4d",
  shadow: "#000000",
  shadowStrong: "#000000",
};

const LIGHT = {
  base: "#faf9f4",
  panel: "#ffffff",
  head: "#f5f4ef",
  hover: "#e9e8e3",
  ink: "#1b1c19",
  text: "#1b1c19",
  dim: "#45474a",
  faint: "#75777b",
  line: "#c5c6cb",
  primary: "#b45309",
  // `alert` is the second accent, not an error colour: badge stars, the [BADGE]
  // and [CLI] tags, and the sync state. Dark splits these off from `primary`
  // and light has to do the same, or [BADGE] and [CONCEPT] collapse into one
  // colour on this side only.
  //
  // Login's light palette carries no second hue to borrow, and every other
  // light value here is amber-family, so this is the one deliberate addition:
  // deep teal, 5.2:1 on the panel. Amber/cyan is the terminal pairing, and a
  // cool hue is what keeps it legible beside `primary` — a green would read as
  // "ok" and invert dark's meaning, where [SYS: SYNC] is the amber one and
  // [SYS: OK] the accent. Red stays reserved for real errors, as in login.
  alert: "#0f766e",
  // Reviews-due card, applied only while the queue is non-empty so the card
  // reads as the action card exactly when there is an action. Values are the
  // export's amber wash verbatim.
  dueWash: "#fffbeb",
  dueChipBg: "#fef3c7",
  dueChipInk: "#92400e",
  dueChipLine: "#f59e0b",
  dueSub: "#92400e",
  dueRule: "#fde68a",
  // Every panel casts the same soft shadow, mission_control included.
  // `shadowStrong` is only for the inverted resume/start buttons, which sit on
  // a filled accent and need the harder edge. In dark both are black.
  shadow: "#c5c6cb",
  shadowStrong: "#1b1c19",
};

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

export default function StudentDashboardPage() {
  const { isDark, toggleTheme, setTheme } = useTheme();
  const { motionEnabled, reducedMotion, toggleMotion } = useTerminalMotion();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();
  const queryClient = useQueryClient();

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

  // ── Interactive prompt / profile shell ──────────────────────────────────
  // The footer prompt is the only input surface. Running a command grows the
  // panel above it upward into a full terminal; `exit` collapses it again.
  const [cmd, setCmd] = useState("");
  const [cliLog, setCliLog] = useState<
    Array<{ id: number; text: string; at: string }>
  >([]);
  const cliSeq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [shellOpen, setShellOpen] = useState(false);
  const [shellLines, setShellLines] = useState<ShellLine[]>([]);
  const [shellBusy, setShellBusy] = useState(false);
  // Set while the navbar glyph is typing a command in, so the input is
  // read-only for those few hundred milliseconds.
  const [autoTyping, setAutoTyping] = useState(false);
  // Non-null while a command is waiting on `io.ask` — the prompt label swaps
  // to the question and the submit resolves the promise instead of dispatching.
  const [pending, setPending] = useState<PendingAsk | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  // Bumped on each open so the scanline sweep remounts and replays.
  const [sweepKey, setSweepKey] = useState(0);

  const lineSeq = useRef(0);
  const bufferRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The OS file picker behind `profile avatar set`. The command module asks
  // for a file through `io.pickFile` and stays free of DOM work; this input
  // and the parked resolver are the host's whole side of that bargain.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePick = useRef<((file: File | null) => void) | null>(null);

  const pushLines = useCallback((rows: Array<{ text: string; kind: LineKind; delay?: number }>) => {
    setShellLines((prev) => {
      const next = [...prev];
      for (const r of rows) {
        lineSeq.current += 1;
        next.push({
          id: lineSeq.current,
          kind: r.kind,
          text: r.text,
          delay: r.delay,
        });
      }
      // Cap the buffer so a long session cannot grow without bound.
      return next.slice(-300);
    });
  }, []);

  // Press "/" anywhere to focus the prompt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep the newest line in view as output streams in.
  useEffect(() => {
    const el = bufferRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shellLines, pending]);

  // A question needs the caret back in the input.
  useEffect(() => {
    if (pending) inputRef.current?.focus();
  }, [pending]);

  // Drop the auto-type interval if the component goes away mid-animation.
  useEffect(
    () => () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    [],
  );

  /** Hand the chosen file — or null, on cancel — back to the waiting command. */
  const settleFilePick = useCallback((file: File | null) => {
    const resolve = filePick.current;
    filePick.current = null;
    // Clear the value so picking the *same* file twice still fires `change`.
    if (fileInputRef.current) fileInputRef.current.value = "";
    resolve?.(file);
  }, []);

  // `cancel` does not bubble, so it is bound to the element directly. Without
  // it, dismissing the OS dialog would leave the command awaiting a promise
  // that never settles, and the shell would sit busy forever.
  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    const onCancel = () => settleFilePick(null);
    el.addEventListener("cancel", onCancel);
    return () => {
      el.removeEventListener("cancel", onCancel);
      // Unmounting mid-pick releases the command rather than stranding it.
      filePick.current?.(null);
      filePick.current = null;
    };
  }, [settleFilePick]);

  // ── Data ────────────────────────────────────────────────────────────────

  const { data: user } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => (await apiClient.get<User>("/users/me")).data,
  });

  // Every timestamp on this page is rendered in the account's zone, not the
  // browser's — they agree for most people, but the account is the one the
  // backend buckets streaks and review dates by, so it is the honest one.
  const tz = user?.timezone;
  const tzLabel = useMemo(() => zoneAbbrev(tz), [tz]);
  const clock = nowMs === null ? "--:--:--" : formatClock(nowMs, tz);

  // ── Shell plumbing ──────────────────────────────────────────────────────
  // Declared after the `user` query because the command context closes over it.

  const closeShell = useCallback(() => {
    // The buffer survives a collapse, so reopening shows the earlier session.
    setShellOpen(false);
    setPending(null);
  }, []);

  /** Print the banner once per page load, however the shell was opened. */
  const boot = useCallback(() => {
    // Held back until `user` resolves, so the identity line is never "...".
    if (bootedRef.current || !user) return;
    bootedRef.current = true;
    pushLines(bootLines(user).map((l, i) => ({ ...l, delay: i * 45 })));
  }, [pushLines, user]);

  const openShell = useCallback(() => {
    setShellOpen((wasOpen) => {
      if (!wasOpen) setSweepKey((k) => k + 1);
      return true;
    });
    boot();
  }, [boot]);

  // If the shell was opened before /users/me resolved, `boot` deferred — print
  // the banner as soon as the identity lands.
  useEffect(() => {
    if (shellOpen) boot();
  }, [shellOpen, boot]);

  const logout = useCallback(() => {
    clearAuth();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
  }, [queryClient]);

  /** The surface handed to every command. */
  const io = useMemo(
    () => ({
      print: (text: string, kind: LineKind = "out") =>
        pushLines([{ text, kind }]),
      clear: () => setShellLines([]),
      close: closeShell,
      ask: (prompt: string, opts?: { mask?: boolean }) =>
        new Promise<string>((resolve, reject) => {
          setPending({
            prompt,
            mask: Boolean(opts?.mask),
            resolve,
            reject,
          });
        }),
      pickFile: (accept: string) =>
        new Promise<File | null>((resolve) => {
          const el = fileInputRef.current;
          if (!el) {
            resolve(null);
            return;
          }
          // A second pick abandons the first rather than queueing behind it.
          filePick.current?.(null);
          filePick.current = resolve;
          el.accept = accept;
          el.value = "";
          el.click();
        }),
    }),
    [pushLines, closeShell],
  );

  /** Echo a line, then dispatch it. Also mirrors into activity.stdout. */
  const exec = useCallback(
    async (entered: string) => {
      const line = entered.trim();
      if (!line) return;

      openShell();
      pushLines([{ text: `student@kip:~$ ${line}`, kind: "cmd" }]);

      cliSeq.current += 1;
      const id = cliSeq.current;
      // Stamp the time here, at execution. Reading the live `clock` at render
      // time instead would make every row show "now" on each tick.
      const at = new Date().toISOString();
      setCliLog((prev) => [{ id, text: line, at }, ...prev].slice(0, 3));

      setHistory((prev) =>
        prev[0] === line ? prev : [line, ...prev].slice(0, 50),
      );
      setHistIdx(-1);

      setShellBusy(true);
      try {
        await runCommand(line, {
          io,
          user,
          refreshUser,
          isDark,
          setTheme,
          logout,
        });
      } finally {
        setShellBusy(false);
      }
    },
    [openShell, pushLines, io, user, refreshUser, isDark, setTheme, logout],
  );

  const submitCmd = (e: React.FormEvent) => {
    e.preventDefault();

    // A command is waiting on an answer — hand it over instead of dispatching.
    if (pending) {
      const answer = cmd;
      setCmd("");
      setPending(null);
      pushLines([
        {
          text: `${pending.prompt}: ${pending.mask ? "••••••" : answer}`,
          kind: "dim",
        },
      ]);
      pending.resolve(answer);
      return;
    }

    const entered = cmd.trim();
    if (!entered) return;
    // Nothing new while a command is still working — one at a time, as in a
    // real shell where the prompt does not come back until the job returns.
    if (shellBusy || autoTyping) return;
    setCmd("");
    void exec(entered);
  };

  /** Type a command in character by character, then run it. Used by the
   *  navbar glyph so the command visibly arrives at the prompt rather than
   *  bypassing it. */
  const typeAndRun = useCallback(
    (text: string) => {
      if (autoTyping || shellBusy || pending) return;
      openShell();
      inputRef.current?.focus();

      if (!motionEnabled) {
        setCmd("");
        void exec(text);
        return;
      }

      if (typeTimer.current) clearInterval(typeTimer.current);
      setAutoTyping(true);
      setCmd("");

      let i = 0;
      typeTimer.current = setInterval(() => {
        i += 1;
        setCmd(text.slice(0, i));
        if (i >= text.length) {
          if (typeTimer.current) clearInterval(typeTimer.current);
          typeTimer.current = null;
          // A beat on the full line before it submits, so it reads as typed.
          submitTimer.current = setTimeout(() => {
            submitTimer.current = null;
            setAutoTyping(false);
            setCmd("");
            void exec(text);
          }, 220);
        }
      }, 45);
    },
    [autoTyping, shellBusy, pending, openShell, exec, motionEnabled],
  );

  /** Tab completion, history, and Esc/Ctrl-C cancellation. */
  const onPromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (autoTyping) {
      e.preventDefault();
      return;
    }

    // Ctrl-C aborts whatever is waiting, exactly like a real shell.
    if (e.key === "c" && (e.ctrlKey || e.metaKey) && pending) {
      e.preventDefault();
      pending.reject(new CommandAborted());
      setPending(null);
      setCmd("");
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      if (pending) {
        pending.reject(new CommandAborted());
        setPending(null);
        setCmd("");
        return;
      }
      if (cmd) {
        setCmd("");
        return;
      }
      if (shellOpen) closeShell();
      return;
    }

    // Answers to a question are free text — no completion or history.
    if (pending) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const completed = completeCommand(cmd);
      if (completed) setCmd(completed);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setCmd(history[next]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx <= 0) {
        setHistIdx(-1);
        setCmd("");
        return;
      }
      const next = histIdx - 1;
      setHistIdx(next);
      setCmd(history[next]);
    }
  };

  /** Commands offered by the hint strip for what is currently typed. */
  const hints = useMemo(() => matchCommands(cmd), [cmd]);
  // Once a command with subcommands is typed, the strip switches to listing
  // those instead — `profile` alone would otherwise dead-end at its usage line.
  const subs = useMemo(() => subHints(cmd), [cmd]);

  /** Buffer row colour. `err` is the only red, matching login. */
  const lineColor = (kind: LineKind): string => {
    if (kind === "cmd") return c.ink;
    if (kind === "ok") return c.primary;
    // Login's error text is `text-red-300` on dark / `text-red-700` on light.
    // These are those two Tailwind v4 tokens verbatim, so no new hue enters
    // the palette — red still appears only on real errors.
    if (kind === "err")
      return isDark
        ? "oklch(80.8% 0.114 19.571)"
        : "oklch(50.5% 0.213 27.518)";
    if (kind === "dim") return c.dim;
    if (kind === "head") return c.primary;
    return c.text;
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

  const seed = user?.id ?? "kip";
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
      className={`kip-dash ${isDark ? "" : "kip-dash-light"} min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative`}
      data-motion={motionEnabled ? "on" : "off"}
      style={{
        backgroundColor: c.base,
        color: c.text,
        "--kip-accent": c.primary,
      } as React.CSSProperties}
    >
      <div className="kip-boot-sweep" aria-hidden="true" />
      {/* CRT overlay */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none ${
          isDark ? "kip-dash-scanlines opacity-40" : "kip-dash-scanlines-light"
        }`}
        aria-hidden="true"
      />

      {/* ══ TOP BAR ═══════════════════════════════════════════════════════
          Phone: brand shortens to "KIP", telemetry hides, tabs stay. Nothing
          in here may grow the page wider than the viewport. */}
      <header
        className="w-full h-11 px-2 sm:px-3 md:px-4 flex items-center justify-between gap-2 z-30 shrink-0 select-none"
        style={{
          backgroundColor: c.panel,
          borderBottom: `1px solid ${c.line}`,
        }}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <span
            className="font-bold tracking-tight flex items-center gap-1.5 min-w-0"
            style={{ color: c.ink }}
          >
            <span style={{ color: c.primary }} className="text-[14px] shrink-0">
              ■
            </span>
            <span className="truncate">
              KIP
              <span className="hidden sm:inline">
                {" // KNOWLEDGE IS POWER"}
              </span>
            </span>
          </span>
          <span
            className="hidden md:inline text-[11px] font-semibold tracking-wider whitespace-nowrap"
            style={{ color: isSyncing ? c.alert : c.primary }}
          >
            {isSyncing ? "[SYS: SYNC]" : "[SYS: OK]"}
          </span>
          <span
            className="hidden xl:inline text-[11px] whitespace-nowrap"
            style={{ color: c.dim }}
          >
            [UPTIME: {mounted ? uptime : "00:00:00"}]
          </span>
        </div>

        {/* Exactly two tabs */}
        <nav
          aria-label="Dashboard views"
          className="flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <span
            className="px-1.5 sm:px-2.5 py-1 font-bold text-[11px] sm:text-[12px] whitespace-nowrap"
            style={{ backgroundColor: c.ink, color: c.base }}
          >
            [1:<span className="hidden sm:inline"> DASHBOARD</span>
            <span className="sm:hidden">DASH</span>]
          </span>
          <button
            type="button"
            className="kip-terminal-tab px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-[12px] cursor-pointer whitespace-nowrap"
            style={{ color: shellOpen ? c.primary : c.dim }}
            aria-expanded={shellOpen}
            aria-controls="dashboard-shell"
            onClick={() => {
              if (shellOpen) closeShell();
              else openShell();
              inputRef.current?.focus();
            }}
            title="Toggle terminal"
          >
            [2:<span className="hidden sm:inline"> TERMINAL</span> CLI]
          </button>
        </nav>

        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 justify-end">
          <div
            className="hidden lg:flex items-center gap-1 text-[12px] min-w-0"
            style={{ color: c.dim }}
          >
            <span className="truncate">
              {user?.name ?? "..."}
              <span className="hidden xl:inline">
                {" "}
                &lt;{user?.email ?? "..."}&gt;
              </span>
            </span>
            <span className="font-bold shrink-0" style={{ color: c.primary }}>
              [{(user?.role ?? "student").toUpperCase()}]
            </span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-1.5 sm:px-2 py-0.5 text-[11px] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            style={{
              border: `1px solid ${c.line}`,
              color: c.dim,
              backgroundColor: c.head,
            }}
          >
            [<span className="hidden sm:inline">MODE: </span>
            {isDark ? "DK" : "LT"}]
          </button>
          {/* Profile shell. Clicking types `profile` at the prompt below and
              lets the shell run it, so the terminal stays the way in. */}
          <button
            type="button"
            onClick={() => typeAndRun("profile")}
            disabled={autoTyping || shellBusy || Boolean(pending)}
            aria-label="Open profile shell"
            title="Profile — runs `profile` at the prompt"
            className="px-1.5 py-1 transition-colors cursor-pointer shrink-0 flex items-center gap-1 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${shellOpen ? c.primary : c.line}`,
              color: shellOpen ? c.primary : c.dim,
              backgroundColor: shellOpen ? `${c.primary}1a` : c.head,
            }}
          >
            {/* Pixel user glyph — drawn rather than imported so it keeps the
                hard-edged terminal look at every size. */}
            <svg
              width="9"
              height="10"
              viewBox="0 0 9 10"
              fill="currentColor"
              aria-hidden="true"
              shapeRendering="crispEdges"
            >
              <rect x="3" y="0" width="3" height="1" />
              <rect x="2" y="1" width="5" height="3" />
              <rect x="3" y="4" width="3" height="1" />
              <rect x="1" y="6" width="7" height="1" />
              <rect x="0" y="7" width="9" height="3" />
            </svg>
            <span className="hidden sm:inline text-[11px]">[USR]</span>
          </button>
        </div>
      </header>

      {/* ══ MAIN — edge to edge; fills height only once the shell is fixed ═ */}
      <main className="w-full lg:flex-1 lg:min-h-0 px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3">
        {/* ── BAND 1: mission control + 4 gauges ───────────────────────── */}
        <section className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Current focus */}
          <div
            className="kip-panel kip-mission lg:col-span-7 flex flex-col relative overflow-hidden"
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
                  className="kip-pulse font-bold text-[11px] px-1.5"
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
                  LOADING SESSION<span className="kip-cursor">_</span>
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
                    href={`/student/concepts/${currentFocus.conceptId}`}
                    className="kip-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
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
                        ? `/student/concepts/${nextUpConcept.conceptId}`
                        : "/student/roadmaps"
                    }
                    className="kip-launch w-full py-2 px-4 font-bold text-[13px] flex items-center justify-center gap-2 tracking-wider transition-colors cursor-pointer"
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
          <div className="kip-gauges lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Streak */}
            <div
              className="kip-panel px-3 py-2.5 flex flex-col justify-between"
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
              className="kip-panel px-3 py-2.5 flex flex-col justify-between"
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
              className="kip-panel px-3 py-2.5 flex flex-col justify-between"
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
              href="/student/review"
              className="kip-panel kip-review px-3 py-2.5 flex flex-col justify-between relative overflow-hidden cursor-pointer"
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
                    className="kip-pulse inline-flex items-center px-1 text-[9px] font-bold"
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
            <div className="kip-panel kip-activity shrink-0 flex flex-col" style={panel}>
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
                  className="kip-gh select-none"
                  style={
                    {
                      "--gh-cols": activityWeeks.length,
                      "--gh-edge": `color-mix(in srgb, ${c.line} 55%, transparent)`,
                    } as React.CSSProperties
                  }
                >
                  <div className="kip-gh-months" style={{ color: c.faint }}>
                    {activityWeeks.map((w, i) => (
                      <span key={`m-${i}`}>{w.label}</span>
                    ))}
                  </div>

                  <div className="kip-gh-body">
                    <div className="kip-gh-days" style={{ color: c.faint }}>
                      <span />
                      <span>Mon</span>
                      <span />
                      <span>Wed</span>
                      <span />
                      <span>Fri</span>
                      <span />
                    </div>

                    <div className="kip-gh-grid">
                      {activityWeeks.map((w, wi) =>
                        w.cells.map((d, di) => (
                          <span
                            key={`c-${wi}-${di}`}
                            className="kip-gh-cell"
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
                                    "--kip-cell-delay": `${wi * 12 + di * 18}ms`,
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
                        className="kip-gh-key"
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
            <div className="kip-panel kip-roadmaps lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
              <div
                className="px-3 py-1.5 flex items-center justify-between gap-2 text-[12px] shrink-0"
                style={headStrip}
              >
                <span className="font-bold truncate" style={{ color: c.ink }}>
                  ┌─[ roadmap_progress ]
                </span>
                <span
                  className="text-[11px] shrink-0 whitespace-nowrap"
                  style={{ color: c.faint }}
                >
                  TRACKS: {roadmapsLoading ? "--" : rankedRoadmaps.length}
                  <span className="hidden sm:inline"> TOTAL</span>
                </span>
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-3 flex flex-col gap-3 lg:overflow-y-auto">
                  {roadmapsLoading || roadmapProgressLoading ? (
                    <div className="text-[12px]" style={{ color: c.dim }}>
                      SCANNING TRACKS<span className="kip-cursor">_</span>
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
                          href={`/student/roadmaps/${rm.id}`}
                          className="kip-track flex flex-col gap-0.5 cursor-pointer"
                          style={{ "--kip-delay": `${Math.min(index, 10) * 65}ms` } as React.CSSProperties}
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
                              className="kip-bar flex-1 min-w-0"
                              style={
                                {
                                  "--kip-bar-pct": `${rm.pct}%`,
                                  "--kip-bar-fill": barColor,
                                  "--kip-bar-track": c.line,
                                } as React.CSSProperties
                              }
                            >
                              <span className="kip-bar-progress" />
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
            <div className="kip-panel kip-badges lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
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
                      LOADING<span className="kip-cursor">_</span>
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
                          className="kip-badge-row flex items-center justify-between px-1 py-0.5"
                          data-earned={has}
                          style={{ "--kip-delay": `${Math.min(index, 10) * 55}ms` } as React.CSSProperties}
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
            <div className="kip-panel kip-events lg:flex-1 lg:min-h-0 flex flex-col" style={panel}>
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
                    className="kip-pulse w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: c.primary }}
                  />
                  <span className="font-bold" style={{ color: c.primary }}>
                    LIVE
                  </span>
                </div>
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col">
                <div className="px-3 sm:px-4 py-2 flex flex-col gap-1 text-[12px] leading-relaxed lg:overflow-y-auto">
                  {/* Echoes of anything typed at the prompt below */}
                  {cliLog.map((l) => (
                    <div
                      key={l.id}
                      className="kip-line-in flex items-baseline gap-2"
                      style={{ color: c.text }}
                    >
                      <span className="text-[11px]" style={{ color: c.faint }}>
                        [{formatClock(l.at, tz)}]
                      </span>
                      <span
                        className="font-bold shrink-0"
                        style={{ color: c.alert }}
                      >
                        [CLI]
                      </span>
                      <span className="truncate">{l.text}</span>
                    </div>
                  ))}

                  {progressLoading ? (
                    <div style={{ color: c.dim }}>
                      TAILING<span className="kip-cursor">_</span>
                    </div>
                  ) : eventLog.length === 0 ? (
                    <div style={{ color: c.dim }}>
                      NO EVENTS YET — your activity will stream here.
                    </div>
                  ) : (
                    eventLog.map((e, i) => (
                      <div
                        key={`${e.at}-${i}`}
                        className="kip-line-in flex items-baseline gap-2"
                        style={{ color: c.text, "--kip-delay": `${i * 55}ms` } as React.CSSProperties}
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
                  {eventLog.length + cliLog.length}{" "}
                  {plural(eventLog.length + cliLog.length, "EVENT", "EVENTS")}
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
        {/* ── Profile shell — grows upward out of the prompt ─────────────── */}
        <div
          id="dashboard-shell"
          className={`kip-shell ${shellOpen ? "kip-shell-open" : ""}`}
          aria-hidden={!shellOpen}
          inert={!shellOpen}
        >
          <div
            className="relative overflow-hidden"
            style={{
              backgroundColor: c.base,
              borderBottom: `1px solid ${c.line}`,
            }}
          >
            {/* One-shot CRT sweep, replayed on every open */}
            {shellOpen && (
              <div
                key={sweepKey}
                className="kip-sweep absolute inset-x-0 top-0 h-16 z-10"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${c.primary}14, transparent)`,
                }}
                aria-hidden="true"
              />
            )}

            <div
              className="px-2 sm:px-3 md:px-4 py-1 flex items-center justify-between gap-2 text-[11px]"
              style={{
                backgroundColor: c.head,
                borderBottom: `1px solid ${c.line}`,
              }}
            >
              <span className="font-bold truncate" style={{ color: c.ink }}>
                ┌─[ profile.sh
                <span className="hidden sm:inline"> :: /dev/pts/{tty}</span> ]
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {shellBusy && (
                  <span className="kip-pulse" style={{ color: c.primary }}>
                    WORKING
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeShell}
                  className="cursor-pointer"
                  style={{ color: c.faint }}
                >
                  [ESC: CLOSE]
                </button>
              </div>
            </div>

            <div
              ref={bufferRef}
              className="px-2 sm:px-3 md:px-4 py-2 overflow-y-auto text-[12px] sm:text-[13px] leading-relaxed"
              style={{ maxHeight: "min(46vh, 24rem)" }}
            >
              {shellLines.map((l) => (
                <div
                  key={l.id}
                  className="kip-line-in whitespace-pre-wrap break-words"
                  style={
                    {
                      color: lineColor(l.kind),
                      fontWeight: l.kind === "head" ? 700 : 400,
                      "--kip-delay": `${l.delay ?? 0}ms`,
                    } as React.CSSProperties
                  }
                >
                  {/* A blank line still needs to occupy a row */}
                  {l.text || " "}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Command hints — stay put while typing, so a half-written line
               never has to be cleared just to remember the syntax ───────── */}
        {(shellOpen || cmd.length > 0) && !pending && (
          <div
            className="px-2 sm:px-3 md:px-4 py-1 flex items-center gap-2 text-[11px] overflow-x-auto"
            style={{
              backgroundColor: c.panel,
              borderBottom: `1px solid ${c.line}`,
            }}
          >
            <span className="shrink-0 font-bold" style={{ color: c.faint }}>
              CMD:
            </span>
            {hints.length === 0 ? (
              <span style={{ color: c.faint }}>
                no match — type help to list everything
              </span>
            ) : subs.length > 0 ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {subs.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setCmd(`${s} `);
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 whitespace-nowrap cursor-pointer px-1 transition-colors"
                    style={{
                      color: c.primary,
                      border: `1px solid ${c.primary}66`,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {hints.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      setCmd(h.name === "help" ? "help" : `${h.name} `);
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 whitespace-nowrap cursor-pointer px-1 transition-colors"
                    style={{
                      color: hints.length === 1 ? c.primary : c.dim,
                      border: `1px solid ${
                        hints.length === 1 ? `${c.primary}66` : c.line
                      }`,
                    }}
                    title={h.summary}
                  >
                    {hints.length === 1 ? h.usage : h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={submitCmd}
          className="kip-prompt px-2 sm:px-3 md:px-4 py-1.5 flex items-center gap-2 text-[13px] cursor-text"
          style={{
            backgroundColor: c.head,
            borderBottom: `1px solid ${c.line}`,
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <span
            className="font-bold shrink-0 truncate max-w-[45%] sm:max-w-none"
            style={{ color: pending ? c.alert : c.primary }}
          >
            {pending ? `${pending.prompt}:` : "student@kip:~$"}
          </span>
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              ref={inputRef}
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={onPromptKeyDown}
              // `readOnly` rather than `disabled` during auto-type: the value
              // must keep rendering as the characters land.
              readOnly={autoTyping}
              type={pending?.mask ? "password" : "text"}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label={pending ? pending.prompt : "Terminal prompt"}
              className="w-full bg-transparent outline-none border-none text-[13px] caret-transparent"
              style={{ color: c.text, font: "inherit", fontSize: "13px" }}
            />
            {/* Block caret parked after the typed text */}
            <span
              className="kip-cursor pointer-events-none absolute top-1/2 -translate-y-1/2 w-2.5 h-4"
              style={{
                left: `min(${cmd.length}ch, calc(100% - 0.625rem))`,
                backgroundColor: pending ? c.alert : c.primary,
              }}
              aria-hidden="true"
            />
          </div>
          <span
            className="text-[11px] shrink-0 hidden lg:inline"
            style={{ color: c.faint }}
          >
            {pending
              ? "[ENTER] SUBMIT · [ESC] CANCEL"
              : shellOpen
                ? "[TAB] COMPLETE · [↑] HISTORY · [ESC] CLOSE"
                : "[/] FOCUS · type help"}
          </span>
        </form>

        {/* Driven entirely by `io.pickFile` — never focusable, never shown. */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => settleFilePick(e.target.files?.[0] ?? null)}
        />

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
              className="kip-motion-toggle cursor-pointer disabled:cursor-default"
              style={{ color: motionEnabled ? c.primary : c.dim }}
            >
              [FX: {motionEnabled ? "ON" : "OFF"}]
            </button>
            <div
              className="flex items-center gap-1.5 font-semibold whitespace-nowrap"
              style={{ color: isSyncing ? c.alert : c.primary }}
            >
              <span className={isSyncing ? "kip-pulse" : ""} aria-hidden="true">●</span>
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
