"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/lib/auth";
import {
  bootSequence,
  CommandAborted,
  completeCommand,
  completions,
  runCommand,
  type AskOptions,
  type LineKind,
  type LineSegment,
  type TerminalAction,
  type TerminalIO,
} from "@/lib/terminal/commands";
import {
  queueTerminalCommand,
  takeTerminalCommand,
  type ConsoleEntry,
  type Screen,
} from "@/lib/terminal/session";
import { readHistory } from "@/lib/terminal/output";
import { displayPath } from "@/lib/terminal/location";
import { armRequests } from "@/lib/terminal/request";
import { useTheme } from "@/providers/theme-provider";
import { useUiMode } from "@/providers/ui-mode-provider";
import { useTerminalLogout } from "./logout-dialog";

interface PendingQuestion {
  prompt: string;
  options?: AskOptions;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

/** A `less` session in progress.
 *
 *  The paged text is revealed into the ordinary screen buffer a chunk at a time
 *  rather than into a viewport of its own, which is both simpler and closer to
 *  how a pager behaves in a terminal that scrolls: what you have already read
 *  stays above you. This state is only what is not yet revealed, plus the
 *  promise `less` is waiting on. */
interface PagerState {
  screenId: number;
  lines: string[];
  /** How many lines have been revealed so far. */
  shown: number;
  /** Lines per keypress, measured from the viewport when paging began. */
  rows: number;
  resolve: () => void;
}

/** How many screens [back] can walk. Deep enough to retrace a lesson you just
 *  left, shallow enough that the shell never becomes a transcript again. */
const MAX_SCREENS = 20;
/** A runaway command can't push the screen past this. */
const MAX_LINES = 400;

/** Streaming reveal pacing. Lines printed in one burst stagger on; a pause of
 *  this long between prints means the command moved on, so the next line starts
 *  a fresh burst and appears immediately rather than after the whole stagger. */
const REVEAL_MS = 22;
const REVEAL_DEPTH = 12;
const BURST_GAP_MS = 120;

/** Boot animation pacing. Fast enough that nobody waits on it — the whole
 *  script runs in about two seconds — and any key or click skips the rest. */
const TYPE_MS = 22;
const LINE_MS = 45;
const STEP_MS = 170;

/** How many lines one `less` keypress reveals.
 *
 *  Measured rather than fixed, because a page has to be a page: twenty lines is
 *  a comfortable screenful on a laptop and roughly three screenfuls on a 360px
 *  phone, which would defeat the point of paging. The floor keeps it useful on
 *  the shortest viewport, and this is a rendering measurement made in the
 *  rendering layer — the command only ever says *what* to page. */
const PAGER_LINE_PX = 22;
function pageRows(): number {
  if (typeof window === "undefined") return 16;
  return Math.max(6, Math.floor((window.innerHeight * 0.62) / PAGER_LINE_PX));
}

/** Where to end a chunk that starts at `from`.
 *
 *  Prefers a blank line just short of the target so a paragraph is not sliced
 *  mid-sentence, and never stops inside a fenced code block — a chunk ending
 *  between the two fences would render as an unterminated block and the rest of
 *  the lesson would come out as code. */
function chunkEnd(lines: string[], from: number, rows: number): number {
  const target = Math.min(lines.length, from + rows);
  let end = target;
  for (let i = target; i > from + Math.floor(rows / 2); i -= 1) {
    if (lines[i - 1]?.trim() === "") {
      end = i;
      break;
    }
  }
  // Balance the fences: an odd count means the chunk opened one it did not
  // close, so extend to the line that closes it.
  const fences = (from: number, to: number) =>
    lines.slice(from, to).filter((line) => line.trimStart().startsWith("```"))
      .length;
  while (end < lines.length && fences(from, end) % 2 === 1) end += 1;
  return end;
}

/** Screens plus the one being looked at. They move together — a push trims the
 *  oldest and the cursor has to land on the new last index — so they are one
 *  piece of state, never two that can disagree. */
interface View {
  screens: Screen[];
  cursor: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useTerminalSession(user: User, initialCommand?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isDark, setTheme } = useTheme();
  const account = useTerminalLogout();
  // The shell's working directory is not the shell's own state. It is the one
  // location both modes render off, so it is read from — and written back to —
  // the provider that owns it. `pwd`, the address bar and a GUI switch are then
  // three views of one value rather than three copies to keep in step.
  const { location, setLocation } = useUiMode();
  const screenSeq = useRef(1);
  const sequence = useRef(0);
  /** When the last line was printed and how many have come in this run, so a
   *  burst of output can be staggered and a lone line cannot. */
  const burst = useRef({ at: 0, count: 0 });
  // Every mount boots, and the boot screen starts empty: the start-up script
  // types itself in below. Nothing is carried over from a previous visit —
  // the shell holds no transcript, so there is nothing to restore.
  const [view, setView] = useState<View>(() => ({
    screens: [{ id: 1, command: "", lines: [] }],
    cursor: 0,
  }));
  /** True while the start-up script is still printing. The prompt stays out of
   *  the way until it finishes, so the caret is only ever in one place. */
  const [booting, setBooting] = useState(true);
  const skipBoot = useRef(false);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  /** What the running command says it is waiting on — shown beside the spinner.
   *  Null while nothing is running, or while it has not said. */
  const [status, setStatus] = useState<string | null>(null);
  /** Aborts the in-flight request of the command that is running. ^C calls it,
   *  so an interrupt stops the work rather than only hiding it. */
  const runAbort = useRef<AbortController | null>(null);
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const question = useRef<PendingQuestion | null>(null);
  const filePick = useRef<((file: File | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const active = useRef(true);
  const generation = useRef(0);
  /** The screen the running command prints into — `answer` echoes there too,
   *  so a quiz reply lands under the question that asked for it. */
  const runningScreen = useRef(0);
  const recallIndex = useRef(-1);
  const draft = useRef("");
  /** The `less` session in progress, if any. Held in a ref because the key
   *  handler reads it imperatively, and mirrored into state so the status line
   *  — `--More--(45%)` — re-renders as the reader advances. */
  const pagerRef = useRef<PagerState | null>(null);
  const [pagerAt, setPagerAt] = useState<{ shown: number; total: number } | null>(
    null,
  );
  /** TAB over titles: the lines TAB is cycling through and where in them the
   *  line currently sits, so a second TAB moves on instead of restarting. */
  const [matches, setMatches] = useState<string[]>([]);
  const [matchAt, setMatchAt] = useState(-1);
  const cycle = useRef<{ items: string[]; at: number } | null>(null);

  const screen = view.screens[view.cursor];
  const canBack = view.cursor > 0;
  const canNext = view.cursor < view.screens.length - 1;

  // ↑ walks the same list `history` prints. There is still no second store —
  // it simply moved to `output.ts`, where the dispatcher records every line and
  // where a command can read it without reaching into host state.
  //
  // Two things improve by sharing it. `clear` no longer wipes what ↑ remembers,
  // which no real shell does; and recall is no longer capped at the twenty
  // screens [back] keeps, so a command from earlier in the session is still
  // reachable. Newest first, because ↑ walks backwards.
  const recallList = () => readHistory().reverse();

  useEffect(() => {
    active.current = true;
    return () => {
      busyRef.current = false;
      active.current = false;
      generation.current += 1;
      // Leaving the page is an interrupt too: nothing should still be in flight
      // for a screen that no longer exists.
      runAbort.current?.abort();
      runAbort.current = null;
      // A pager left open holds the promise `less` is awaiting. Unmounting
      // without settling it would leave that command suspended for good, so it
      // is resolved here rather than abandoned.
      const pager = pagerRef.current;
      if (pager) {
        pagerRef.current = null;
        pager.resolve();
      }
      armRequests(undefined);
      question.current?.reject(new CommandAborted());
      question.current = null;
      filePick.current?.(null);
      filePick.current = null;
    };
  }, []);

  /** Print into the screen a command owns, wherever it currently sits, and
   *  hand back the line's id so a caller that keeps writing to the same line —
   *  the boot script typing a command out — can find it again. */
  const pushEntry = useCallback(
    (screenId: number, entry: Omit<ConsoleEntry, "id">) => {
      if (!active.current) return 0;
      const id = ++sequence.current;
      // Each line of one burst starts a step after the line above it, so output
      // types itself on rather than landing whole. The offset is decided here,
      // where the burst is actually happening, and travels with the line — a
      // later re-render for any other reason must not re-animate it.
      const now = Date.now();
      const run = burst.current;
      const consecutive = now - run.at < BURST_GAP_MS ? run.count : 0;
      burst.current = { at: now, count: consecutive + 1 };
      const delay = Math.min(consecutive, REVEAL_DEPTH) * REVEAL_MS;
      setView((previous) => ({
        ...previous,
        screens: previous.screens.map((screenEntry) =>
          screenEntry.id === screenId
            ? {
                ...screenEntry,
                lines: [...screenEntry.lines, { ...entry, id, delay }].slice(
                  -MAX_LINES,
                ),
              }
            : screenEntry,
        ),
      }));
      return id;
    },
    [],
  );

  const append = useCallback(
    (
      screenId: number,
      text: string,
      kind: LineKind = "out",
      actions?: TerminalAction[],
      markdown?: boolean,
    ) => pushEntry(screenId, { text, kind, actions, markdown }),
    [pushEntry],
  );

  /** A line whose runnable words sit inside the sentence — `io.say`. The plain
   *  text is kept alongside so a screen reader and the log's aria-live read the
   *  whole sentence, not a gap where each word would be. */
  const speak = useCallback(
    (screenId: number, segments: LineSegment[], kind: LineKind = "out") =>
      pushEntry(screenId, {
        text: segments
          .map((s) => (typeof s === "string" ? s : s.label))
          .join(""),
        kind,
        segments,
      }),
    [pushEntry],
  );

  /** Rewrite a line already on screen — how the boot script types: one line,
   *  one character longer each tick. */
  const amend = useCallback(
    (screenId: number, lineId: number, text: string, typing = true) => {
      if (!active.current) return;
      setView((previous) => ({
        ...previous,
        screens: previous.screens.map((screenEntry) =>
          screenEntry.id === screenId
            ? {
                ...screenEntry,
                lines: screenEntry.lines.map((line) =>
                  line.id === lineId ? { ...line, text, typing } : line,
                ),
              }
            : screenEntry,
        ),
      }));
    },
    [],
  );

  const settleFile = useCallback((file: File | null) => {
    const resolve = filePick.current;
    filePick.current = null;
    if (fileRef.current) fileRef.current.value = "";
    resolve?.(file);
  }, []);

  useEffect(() => {
    const input = fileRef.current;
    const cancel = () => settleFile(null);
    input?.addEventListener("cancel", cancel);
    return () => input?.removeEventListener("cancel", cancel);
  }, [settleFile]);

  const back = useCallback(() => {
    if (busyRef.current) return;
    setView((previous) => ({
      ...previous,
      cursor: Math.max(0, previous.cursor - 1),
    }));
  }, []);

  const forward = useCallback(() => {
    if (busyRef.current) return;
    setView((previous) => ({
      ...previous,
      cursor: Math.min(previous.screens.length - 1, previous.cursor + 1),
    }));
  }, []);

  /** Collapse the stack to a single screen — that is what `clear` means now
   *  that [back] exists: it drops the history, not just the visible lines.
   *  `keepId` preserves the identity of a screen a command is still printing
   *  into, so output that arrives after the clear still lands somewhere. */
  const reset = useCallback((keepId?: number) => {
    setView({
      screens: [
        { id: keepId ?? ++screenSeq.current, command: "", lines: [] },
      ],
      cursor: 0,
    });
  }, []);

  const execute = useCallback(
    async (input: string) => {
      const line = input.trim();
      if (!line || busyRef.current) return;
      // A command means the boot script has been overtaken: let it dump the
      // rest of its output at once rather than type on underneath.
      skipBoot.current = true;
      busyRef.current = true;
      setBusy(true);
      setCmd("");
      setStatus(null);
      setMatches([]);
      cycle.current = null;
      recallIndex.current = -1;
      // One controller for this command, armed for the request layer, so ^C
      // aborts whatever it is waiting on rather than leaving it to land later.
      const abort = new AbortController();
      runAbort.current = abort;
      armRequests(abort.signal);
      // A new command from an older screen drops whatever [next] led to, the
      // way stepping off a browser's back stack does.
      const screenId = ++screenSeq.current;
      runningScreen.current = screenId;
      setView((previous) => {
        const screens = [
          ...previous.screens.slice(0, previous.cursor + 1),
          {
            id: screenId,
            command: line,
            // Stamped now, so the echo keeps the directory the command was typed
            // in even when the command is the `cd` that leaves it.
            path: displayPath(location),
            lines: [],
          },
        ].slice(-MAX_SCREENS);
        return { screens, cursor: screens.length - 1 };
      });
      const run = generation.current;
      const isCurrent = () => active.current && generation.current === run;
      const io: TerminalIO = {
        print: (text, kind, actions) => {
          if (isCurrent()) append(screenId, text, kind, actions);
        },
        say: (segments, kind) => {
          if (isCurrent()) speak(screenId, segments, kind);
        },
        status: (text) => {
          if (isCurrent()) setStatus(text);
        },
        doc: (markdown) => {
          if (isCurrent()) append(screenId, markdown, "out", undefined, true);
        },
        page: (text, opts) =>
          new Promise<void>((resolve) => {
            if (!isCurrent()) {
              resolve();
              return;
            }
            if (opts?.title) append(screenId, opts.title, "head");
            const lines = text.split("\n");
            const rows = pageRows();
            // A lesson that already fits needs no pager, and `less` on a short
            // file behaves the same way: it prints it and returns.
            if (lines.length <= rows) {
              append(screenId, text, "out", undefined, true);
              resolve();
              return;
            }
            pagerRef.current = { screenId, lines, shown: 0, rows, resolve };
            advancePager();
          }),
        clear: () => {
          if (isCurrent()) reset(screenId);
        },
        close: () => {
          if (isCurrent()) router.push("/student/dashboard");
        },
        ask: (prompt, options) =>
          new Promise((resolve, reject) => {
            if (!isCurrent()) {
              reject(new CommandAborted());
              return;
            }
            // Waiting on a person is not waiting on the network: the spinner
            // comes down so the question is the only thing asking for input.
            setStatus(null);
            const next = { prompt, options, resolve, reject };
            question.current = next;
            setCmd("");
            setPending(next);
          }),
        pickFile: (accept) =>
          new Promise((resolve) => {
            if (!isCurrent() || !fileRef.current) {
              resolve(null);
              return;
            }
            filePick.current?.(null);
            filePick.current = resolve;
            fileRef.current.accept = accept;
            fileRef.current.value = "";
            fileRef.current.click();
          }),
      };
      try {
        await runCommand(line, {
          io,
          user,
          cwd: location,
          setCwd: setLocation,
          isDark,
          setTheme,
          logout: account.logout,
          confirmLogout: account.confirmLogout,
          navigate: (path) => {
            if (isCurrent()) router.push(path);
          },
          refreshUser: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
          },
          refreshLearning: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["review"] }),
              queryClient.invalidateQueries({ queryKey: ["gamification"] }),
              queryClient.invalidateQueries({ queryKey: ["progress"] }),
            ]);
          },
        });
      } finally {
        // A command interrupted by ^C has already handed the prompt back and a
        // newer one may be running by now, so only the current run unlocks.
        if (isCurrent()) {
          busyRef.current = false;
          setBusy(false);
          setStatus(null);
          runAbort.current = null;
          armRequests(undefined);
          inputRef.current?.focus({ preventScroll: true });
        }
      }
    },
    [
      user,
      append,
      speak,
      reset,
      router,
      isDark,
      setTheme,
      queryClient,
      account.logout,
      account.confirmLogout,
      location,
      setLocation,
    ],
  );

  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const startup = useRef(initialCommand);
  const bootUser = useRef(user);
  useEffect(() => {
    // The start-up script types itself out at the prompt: a command, then what
    // it printed, then the next one. Any key or click skips the rest — nobody
    // should have to sit through an animation to type, so this is impatient by
    // design rather than something to wait out.
    let cancelled = false;
    const skip = () => {
      skipBoot.current = true;
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    // A handoff from the dashboard, or a `?view=` deep link, is what the user
    // actually asked for: print the boot output at once and get out of the way.
    // The route builds `initialCommand` from an allowlist; never run arbitrary
    // URL input.
    // Read once, outside the closure the cleanup captures: the value is set at
    // construction and never reassigned, and comparing against a snapshot makes
    // that independence obvious rather than incidental.
    const startupCommand = startup.current;
    const queued = takeTerminalCommand() ?? startupCommand ?? null;
    let executed = false;
    if (
      queued ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      skipBoot.current = true;

    void (async () => {
      // Start from an empty screen every run, so React's development
      // double-invoke restarts the script instead of typing it out twice.
      setView({ screens: [{ id: 1, command: "", lines: [] }], cursor: 0 });
      for (const step of bootSequence(bootUser.current)) {
        if (cancelled) return;
        const typing = !skipBoot.current;
        const lineId = pushEntry(1, {
          text: typing ? "" : step.command,
          kind: "cmd",
          typing,
        });
        for (let at = 1; at <= step.command.length && typing; at += 1) {
          await sleep(TYPE_MS);
          if (cancelled) return;
          if (skipBoot.current) break;
          amend(1, lineId, step.command.slice(0, at));
        }
        // Whether it was typed or skipped, the line ends up whole and the caret
        // leaves it.
        amend(1, lineId, step.command, false);
        for (const line of step.lines) {
          if (cancelled) return;
          if (!skipBoot.current) await sleep(LINE_MS);
          if (cancelled) return;
          pushEntry(1, line);
        }
        if (!skipBoot.current) await sleep(STEP_MS);
      }
      if (cancelled) return;
      setBooting(false);
      if (queued) {
        executed = true;
        void executeRef.current(queued);
      } else if (window.matchMedia("(pointer: fine)").matches)
        inputRef.current?.focus({ preventScroll: true });
    })();

    return () => {
      cancelled = true;
      // Put an unconsumed handoff back. A run that is torn down before it gets
      // there — React's development double-invoke, or leaving mid-boot — must
      // not be the reason a command the user asked for never runs.
      if (queued && !executed && queued !== startupCommand)
        queueTerminalCommand(queued);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [pushEntry, amend]);

  const answer = useCallback(
    (value: string) => {
      const current = question.current;
      if (!current) return;
      question.current = null;
      setPending(null);
      setCmd("");
      // Echo the reply into the running command's screen, the way a terminal
      // shows what you typed at a prompt.
      append(
        runningScreen.current,
        `${current.prompt}: ${current.options?.mask ? "••••••" : value}`,
        "dim",
      );
      current.resolve(value);
    },
    [append],
  );

  /** ^C. Whatever the shell is doing, this ends it and hands the prompt back:
   *  a parked question is rejected, and a command waiting on the network has
   *  its request aborted — the point of an interrupt is that the work stops,
   *  not that the spinner goes away while it finishes unwatched.
   *
   *  The generation is bumped so the command being interrupted can no longer
   *  print into this screen as it unwinds, which is also why the `^C` is
   *  printed here rather than left to the dispatcher's own handler. */
  const cancel = useCallback(() => {
    const current = question.current;
    if (current) {
      question.current = null;
      setPending(null);
      setCmd("");
      current.reject(new CommandAborted());
      return;
    }
    if (!busyRef.current) return;
    // ^C out of a pager closes it. Resolving rather than rejecting is right:
    // `less` was interrupted, but it had already printed what the reader saw,
    // and the dispatcher prints the `^C` below.
    if (pagerRef.current) {
      const pager = pagerRef.current;
      pagerRef.current = null;
      setPagerAt(null);
      pager.resolve();
    }
    append(runningScreen.current, "^C", "dim");
    generation.current += 1;
    runAbort.current?.abort();
    runAbort.current = null;
    armRequests(undefined);
    busyRef.current = false;
    setBusy(false);
    setStatus(null);
    inputRef.current?.focus({ preventScroll: true });
  }, [append]);

  useEffect(() => {
    if (pending) inputRef.current?.focus({ preventScroll: true });
  }, [pending]);

  /** Reveal the next chunk. Resolves `less` once the last line is out and the
   *  reader acknowledges it, which is what `(END)` is waiting for. */
  const advancePager = useCallback(
    (rows?: number) => {
      const pager = pagerRef.current;
      if (!pager) return;
      if (pager.shown >= pager.lines.length) {
        // Already at the end: the next keypress closes the pager.
        pagerRef.current = null;
        setPagerAt(null);
        pager.resolve();
        return;
      }
      const end = chunkEnd(pager.lines, pager.shown, rows ?? pager.rows);
      append(
        pager.screenId,
        pager.lines.slice(pager.shown, end).join("\n"),
        "out",
        undefined,
        true,
      );
      pager.shown = end;
      setPagerAt({ shown: end, total: pager.lines.length });
    },
    [append],
  );

  /** Stop paging where the reader stopped. What was already revealed stays on
   *  screen — this is `q`, not an undo. */
  const quitPager = useCallback(() => {
    const pager = pagerRef.current;
    if (!pager) return;
    pagerRef.current = null;
    setPagerAt(null);
    pager.resolve();
  }, []);
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest(
        "input, textarea, select, [contenteditable=true], dialog",
      );
      // While `less` is paging, the keyboard belongs to the pager. This comes
      // first so `q` quits instead of reaching the prompt, and it swallows the
      // keys it uses so space does not also scroll the page.
      if (pagerRef.current) {
        // ^C still interrupts, and is left to the handler below.
        if (event.ctrlKey || event.metaKey || event.altKey) {
          // fall through
        } else if (event.key === " " || event.key === "PageDown") {
          event.preventDefault();
          advancePager();
          return;
        } else if (
          event.key === "Enter" ||
          event.key === "ArrowDown" ||
          event.key === "j"
        ) {
          // One line at a time, as `less` does with Enter.
          event.preventDefault();
          advancePager(1);
          return;
        } else if (event.key === "G") {
          // Straight to the end.
          event.preventDefault();
          advancePager(pagerRef.current.lines.length);
          return;
        } else if (event.key === "q" || event.key === "Q" || event.key === "Escape") {
          event.preventDefault();
          quitPager();
          return;
        }
      }
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !typing
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      // ^C while a command runs: the prompt is gone then, so its own handler
      // cannot catch this — the interrupt has to be caught here. A live text
      // selection means the user is copying, so that keeps its usual meaning.
      if (
        event.ctrlKey &&
        (event.key === "c" || event.key === "C") &&
        (busyRef.current || question.current) &&
        !window.getSelection()?.toString()
      ) {
        event.preventDefault();
        cancel();
        return;
      }
      if (
        event.key === "Escape" &&
        question.current &&
        !target?.closest("dialog")
      ) {
        event.preventDefault();
        cancel();
      }
      // Alt+←/→ moves screens from anywhere, the way a browser's own do.
      if (event.altKey && !typing && event.key === "ArrowLeft") back();
      if (event.altKey && !typing && event.key === "ArrowRight") forward();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cancel, back, forward, advancePager, quitPager]);

  /** Put one completion on the line and stop offering the rest. */
  const chooseCompletion = useCallback((line: string) => {
    cycle.current = null;
    setMatches([]);
    setMatchAt(-1);
    setCmd(line);
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (
      (event.key === "Escape" || (event.ctrlKey && event.key === "c")) &&
      pending
    ) {
      event.preventDefault();
      cancel();
      return;
    }
    if (pending || busy) return;
    // Anything other than another TAB ends the cycle — the list under the line
    // describes what TAB is walking, so it goes as soon as it stops walking.
    if (event.key !== "Tab" && event.key !== "Shift" && cycle.current) {
      cycle.current = null;
      setMatches([]);
      setMatchAt(-1);
    }
    if (event.ctrlKey && event.key === "l") {
      event.preventDefault();
      reset();
      return;
    }
    if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      back();
      return;
    }
    if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      forward();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      // Already cycling: TAB steps on, Shift+TAB steps back. The line follows
      // the highlight, so Enter runs whichever is showing.
      if (cycle.current) {
        const { items } = cycle.current;
        const at =
          (cycle.current.at + (event.shiftKey ? -1 : 1) + items.length) %
          items.length;
        cycle.current = { items, at };
        setMatchAt(at);
        setCmd(items[at]);
        return;
      }
      if (event.shiftKey) return;
      // Verbs and subcommands first — they come from the static tables and are
      // unambiguous when they match at all.
      const completed = completeCommand(cmd);
      if (completed) {
        setCmd(completed);
        return;
      }
      // Then the data: lessons and paths already listed on screen.
      const items = completions(cmd);
      if (!items.length) return;
      if (items.length === 1) {
        setCmd(items[0]);
        return;
      }
      cycle.current = { items, at: 0 };
      setMatches(items);
      setMatchAt(0);
      setCmd(items[0]);
      return;
    }
    if (event.key === "ArrowUp") {
      const recall = recallList();
      if (!recall.length) return;
      event.preventDefault();
      if (recallIndex.current === -1) draft.current = cmd;
      recallIndex.current = Math.min(recallIndex.current + 1, recall.length - 1);
      setCmd(recall[recallIndex.current]);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const recall = recallList();
      recallIndex.current = Math.max(-1, recallIndex.current - 1);
      setCmd(
        recallIndex.current === -1 ? draft.current : recall[recallIndex.current],
      );
    }
    if (event.key === "Escape") setCmd("");
  };

  return {
    screen,
    booting,
    position: view.cursor + 1,
    total: view.screens.length,
    canBack,
    canNext,
    back,
    forward,
    cmd,
    setCmd,
    busy,
    status,
    pending,
    /** Non-null while `less` is paging: how far through the text the reader is,
     *  for the renderer to draw the theme's `--More--` line. */
    pagerAt,
    matches,
    matchAt,
    chooseCompletion,
    execute,
    answer,
    cancel,
    onKeyDown,
    inputRef,
    fileRef,
    settleFile,
    account,
  };
}
