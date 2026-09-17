"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import {
  matchCommands,
  subHints,
  type LineSegment,
  type TerminalAction,
} from "@/lib/terminal/commands";
import type { ConsoleEntry } from "@/lib/terminal/session";
import { displayPath } from "@/lib/terminal/location";
import { getTheme, DEFAULT_THEME_ID } from "./themes";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  TerminalCommandBar,
  TerminalHeader,
  TerminalSurface,
} from "./terminal-chrome";
import { useTerminalSession } from "./use-terminal-session";

/** The page already owns an h1, so a lesson's own headings start below it and
 *  the outline stays readable to a screen reader. */
const DOC_HEADINGS = {
  h1: "h3",
  h2: "h4",
  h3: "h5",
  h4: "h6",
  h5: "h6",
  h6: "h6",
} as const;

/** The frames of a braille spinner, the one every CLI tool draws. */
const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

/** Whether the reader has asked for less movement. Everything animated here
 *  checks it: the reveal falls back to printing at once, and the spinner holds
 *  one frame while only its elapsed count keeps moving. */
function usePrefersReducedMotion() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return still;
}

/** `[command]` tokens, printed inline at the end of the line they belong to.
 *  They are text that happens to be clickable — not buttons — so output reads
 *  as output. Clicking one types its command and runs it, which is the same
 *  path a typed line takes. */
function InlineActions({
  actions,
  busy,
  run,
}: {
  actions: TerminalAction[];
  busy: boolean;
  run: (command: string) => void;
}) {
  return (
    <>
      {actions.map((action) => (
        <button
          type="button"
          key={action.command}
          className="kip-token"
          disabled={busy}
          onClick={() => run(action.command)}
          title={action.command}
          aria-label={`Run ${action.command}`}
        >
          [{action.label}]
        </button>
      ))}
    </>
  );
}

/** A sentence with its verbs inside it — `catching up on review (review)`,
 *  where `review` runs. The words carry no brackets: the prose around them is
 *  already doing that work, and a suggestion should read as a sentence rather
 *  than as a row of controls. */
function Sentence({
  segments,
  busy,
  run,
}: {
  segments: LineSegment[];
  busy: boolean;
  run: (command: string) => void;
}) {
  return (
    <>
      {segments.map((segment, index) =>
        typeof segment === "string" ? (
          <span key={index}>{segment}</span>
        ) : (
          <button
            type="button"
            key={index}
            className="kip-word"
            disabled={busy}
            onClick={() => run(segment.command)}
            title={segment.command}
            aria-label={`Run ${segment.command}`}
          >
            {segment.label}
          </button>
        ),
      )}
    </>
  );
}

/** One line of output. A `banner` is ASCII art and must not wrap, so it gets
 *  a pre that scrolls; a `rule` is a divider whose width is the terminal's,
 *  not a run of dashes; a `cmd` line is echoed under its own prompt the way a
 *  shell does, and carries the caret while the boot script is still typing it;
 *  markdown is flowed. Everything else is text. */
function Line({
  entry,
  busy,
  run,
}: {
  entry: ConsoleEntry;
  busy: boolean;
  run: (command: string) => void;
}) {
  if (entry.kind === "rule")
    return <div className="kip-rule" role="separator" />;

  if (entry.kind === "banner")
    return (
      <pre className="kip-banner" aria-label="KIP">
        {entry.text}
      </pre>
    );

  if (entry.markdown)
    return (
      <div className="kip-flow">
        {/* Markdown only — `rehype-raw` is deliberately absent, so authored
            HTML inside a lesson or an answer is escaped, never executed. */}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={DOC_HEADINGS}>
          {entry.text}
        </ReactMarkdown>
      </div>
    );

  if (entry.kind === "cmd")
    return (
      <div className="kip-line" data-kind="cmd">
        <span className="kip-prompt-user">student@source-dev</span>
        <span className="kip-prompt-path">:{entry.path ?? "~"}$</span>{" "}
        {entry.text}
        {entry.typing && <span className="kip-caret" aria-hidden="true" />}
      </div>
    );

  if (entry.segments)
    return (
      <div className="kip-line" data-kind={entry.kind}>
        <Sentence segments={entry.segments} busy={busy} run={run} />
      </div>
    );

  return (
    <div className="kip-line" data-kind={entry.kind}>
      {entry.text || " "}
      {Boolean(entry.actions?.length) && (
        <>
          {entry.text ? " " : ""}
          <InlineActions actions={entry.actions ?? []} busy={busy} run={run} />
        </>
      )}
    </div>
  );
}

/** What the shell is doing, while it is doing it. It stands where the prompt
 *  would be — the prompt is gone for as long as this is up, because a caret
 *  that cannot be typed into is a lie — and it says three things: what is being
 *  waited on, that it is still going, and how to stop it.
 *
 *  It keeps its own clock so the ticking frame re-renders this line alone and
 *  not the whole screen of output above it. */
function RunIndicator({
  label,
  onCancel,
}: {
  label: string | null;
  onCancel: () => void;
}) {
  const still = usePrefersReducedMotion();
  // The elapsed count is state, not a value read at render time: the start
  // instant is captured once inside the effect and each tick publishes a new
  // number, so rendering stays pure and a re-render for any other reason can
  // never restart or jump the clock.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    setSeconds(0);
    // Reduced motion keeps the count honest without the frames moving.
    const id = setInterval(
      () => setSeconds((Date.now() - started) / 1000),
      still ? 1000 : 80,
    );
    return () => clearInterval(id);
  }, [still]);
  const frame = still
    ? SPINNER[0]
    : SPINNER[Math.floor(seconds * 12.5) % SPINNER.length];
  const said = label ?? "working";
  return (
    <div className="kip-line kip-run" data-kind="dim" role="status">
      {/* The count changes ten times a second: announcing it would be noise,
          so the spoken version says what is happening, once. */}
      <span className="sr-only">{said}, in progress. Press control C to stop.</span>
      <span aria-hidden="true">
        {said}… <span className="kip-spin">{frame}</span> {seconds.toFixed(1)}s{" "}
      </span>
      <button
        type="button"
        className="kip-token"
        onClick={onCancel}
        aria-label="Stop the running command"
      >
        [^C stop]
      </button>
    </div>
  );
}

function Console({
  user,
  initialCommand,
}: {
  user: User;
  initialCommand?: string;
}) {
  const session = useTerminalSession(user, initialCommand);
  const {
    screen,
    booting,
    position,
    total,
    canBack,
    canNext,
    back,
    forward,
    cmd,
    setCmd,
    busy,
    status,
    pending,
    pagerAt,
    matches,
    matchAt,
    chooseCompletion,
    execute,
    account,
    inputRef,
    fileRef,
    onKeyDown,
    cancel,
    answer,
    settleFile,
  } = session;
  // The prompt shows where the user actually is. It reads the same location the
  // commands do, so `cd` moves the prompt, `pwd` agrees with it, and the address
  // bar agrees with both — one value, three views.
  const { location } = useUiMode();
  const promptPath = displayPath(location);
  const view = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  /** The block caret only stands in for the real one while the caret is at the
   *  end of the line — move it into the middle of a command and the native
   *  caret takes over, so what you see is always where you are typing. */
  const [atEnd, setAtEnd] = useState(true);
  const syncCaret = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    setAtEnd(
      input.selectionStart === null ||
        input.selectionStart >= input.value.length,
    );
  }, [inputRef]);
  // ↑ recall and TAB completion set the value without a keystroke, so the
  // caret has to be re-checked after any change, not just after typing.
  useEffect(() => {
    syncCaret();
  }, [cmd, syncCaret]);
  const suggestions = useMemo(() => {
    if (!cmd.trim()) return [];
    const subs = subHints(cmd);
    return subs.length ? subs : matchCommands(cmd).map((c) => c.name);
  }, [cmd]);
  // A paging `less` is technically still running, but it is waiting on a
  // keypress, not on work — so the spinner would be claiming something untrue.
  // The pager's own status line stands in its place, exactly as it does for a
  // question waiting on an answer.
  const running = busy && !pending && !pagerAt;
  const showCaret = atEnd && !running;

  // ─── Streaming reveal ─────────────────────────────────────────────────────
  // A command prints its whole screen in one pass, which arrives as a wall of
  // text. Each line carries the offset it was printed with — one step after the
  // line above it, within a burst — so output types itself on rather than
  // landing at once, and a line the reader has already seen keeps the offset it
  // was born with instead of re-animating.

  // The prompt is unmounted while a command runs, so the caret comes back to
  // it when the command ends — unless the reader has moved on to something
  // else, in which case taking focus back would be rude.
  const wasRunning = useRef(false);
  useEffect(() => {
    const ended = wasRunning.current && !running;
    wasRunning.current = running;
    if (!ended || booting) return;
    const active = document.activeElement;
    if (active?.closest("dialog")) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [running, booting, inputRef]);

  // A screen change starts at the top — it is a new page of output, not more
  // of the last one. Lines appended to the screen you are already on don't
  // move you, so a long lesson stays where you were reading.
  useEffect(() => {
    view.current?.scrollTo({ top: 0 });
  }, [screen.id]);

  // The start-up script is the exception: it is typing at the bottom, and the
  // caret has to stay in sight the way it would in a real terminal. On a short
  // screen the mark alone fills it, so this follows the output down until the
  // ready prompt lands.
  useEffect(() => {
    if (!booting) return;
    const el = view.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [booting, screen.lines.length]);

  const run = (command: string) => void execute(command);

  return (
    <TerminalSurface className="kip-console">
      <TerminalHeader
        user={user}
        active="terminal"
        onLogout={account.requestLogout}
        onProfile={() => run("profile")}
      />
      <TerminalCommandBar onCommand={run} busy={busy} />
      <main className="kip-console-main" aria-label="Terminal">
        <h1 className="sr-only">KIP learning shell</h1>
        {/* The whole screen is one click target: clicking anywhere in the
            output focuses the prompt, the way a terminal emulator does. */}
        <div
          ref={view}
          className="kip-screen"
          onMouseUp={() => {
            if (!window.getSelection()?.toString())
              inputRef.current?.focus({ preventScroll: true });
          }}
        >
          <div
            className="kip-screen-lines"
            role="log"
            aria-label="Terminal output"
            aria-live="polite"
            aria-relevant="additions"
          >
            {/* The command that produced this screen, echoed above its own
                output the way it would sit above it in a transcript. */}
            {screen.command && (
              <div className="kip-reveal">
                <Line
                  entry={{
                    id: 0,
                    kind: "cmd",
                    text: screen.command,
                    path: screen.path,
                  }}
                  busy={busy}
                  run={run}
                />
              </div>
            )}
            {screen.lines.map((entry) => (
              <div
                key={entry.id}
                className="kip-reveal"
                style={
                  { "--kip-delay": `${entry.delay ?? 0}ms` } as CSSProperties
                }
              >
                <Line entry={entry} busy={busy} run={run} />
              </div>
            ))}
            {running && <RunIndicator label={status} onCancel={cancel} />}
          </div>

          {/* An `ask` with choices lists them as output the way a shell
              prompt does — pick one by clicking or by typing it. */}
          {pending?.options?.choices && (
            <div className="kip-choices">
              {pending.options.choices.map((choice) => (
                <button
                  type="button"
                  key={choice.value}
                  className="kip-choice"
                  onClick={() => answer(choice.value)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}

          {/* The pager's status line, where the prompt would be — the prompt is
              gone while `less` has the keyboard. The text comes from the active
              theme (`glyphs.more`), not from here and not from the command:
              `--More--(45%)` is this theme's idiom, and another theme is free to
              say it differently. */}
          {pagerAt && (
            <div className="kip-line" data-kind="head" aria-live="polite">
              {getTheme(DEFAULT_THEME_ID).glyphs.more(
                Math.round((pagerAt.shown / pagerAt.total) * 100),
              )}
              <span className="kip-prompt-hint">
                {" "}
                space = page · enter = line · G = end · q = quit
              </span>
            </div>
          )}

          {/* The prompt lives at the end of the output, not in a bar below
              it — so the caret sits exactly where the next line would be
              printed, which is what makes this read as a terminal. It has no
              frame of its own: the input is only as wide as what is typed, so
              the block caret lands in the next cell instead of at the far edge
              of a box. While the boot script types, there is no prompt at all
              — the caret is up there with it, and the same is true while a
              command runs: a prompt that silently drops what you type is worse
              than no prompt, so the spinner takes its place. */}
          {!booting && !running && !pagerAt && (
            <form
              className="kip-prompt"
              data-focused={focused ? "" : undefined}
              data-caret={atEnd ? "block" : "line"}
              onSubmit={(event) => {
                event.preventDefault();
                if (pending) answer(cmd);
                else run(cmd);
              }}
            >
              <label htmlFor="terminal-input" className="kip-prompt-label">
                {pending ? (
                  <span className="kip-prompt-ask">{pending.prompt}:</span>
                ) : (
                  <>
                    <span className="kip-prompt-user">student@source-dev</span>
                    <span className="kip-prompt-path">:{promptPath}$</span>
                  </>
                )}
              </label>
              <span className="kip-prompt-entry">
                <input
                  ref={inputRef}
                  id="terminal-input"
                  value={cmd}
                  size={1}
                  style={{ width: `${Math.max(cmd.length, 1)}ch` }}
                  onChange={(event) => setCmd(event.target.value)}
                  onKeyDown={onKeyDown}
                  onKeyUp={syncCaret}
                  onSelect={syncCaret}
                  onFocus={() => {
                    setFocused(true);
                    syncCaret();
                  }}
                  onBlur={() => setFocused(false)}
                  type={pending?.options?.mask ? "password" : "text"}
                  aria-label={pending ? pending.prompt : "Terminal command"}
                  placeholder=""
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {showCaret && <span className="kip-caret" aria-hidden="true" />}
              </span>
            </form>
          )}

          {/* What TAB is cycling through, directly under the line it is
              completing — the way a shell lists its matches, not off in a
              panel somewhere else on screen. The line already shows the
              highlighted one, so Enter runs it without touching this list. */}
          {matches.length > 1 && !running && (
            <div className="kip-matches" role="listbox" aria-label="Completions">
              {matches.map((match, index) => (
                <button
                  type="button"
                  key={match}
                  role="option"
                  aria-selected={index === matchAt}
                  className="kip-match"
                  data-active={index === matchAt ? "" : undefined}
                  onClick={() => chooseCompletion(match)}
                >
                  {match.slice(match.indexOf(" ") + 1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* One status line: where you are in the stack, and what TAB would
            complete. `[back]` / `[next]` are the same inline tokens the
            output uses, so the foot reads as terminal text too. */}
        <div className="kip-hintbar">
          <span className="kip-hintbar-nav">
            <button
              type="button"
              className="kip-token"
              onClick={back}
              disabled={!canBack || busy}
              aria-label="Previous screen"
            >
              [back]
            </button>
            <button
              type="button"
              className="kip-token"
              onClick={forward}
              disabled={!canNext || busy}
              aria-label="Next screen"
            >
              [next]
            </button>
            <span aria-hidden="true">
              {position}/{total}
            </span>
          </span>
          {running ? (
            // [back], [next] and the command strip are all disabled while a
            // command runs. Saying so here is the difference between "disabled"
            // and "broken" — and it says how to get them back.
            <span className="kip-hintbar-note">
              running — ^C stops it and returns the prompt
            </span>
          ) : pending ? (
            <span>
              answer above ·{" "}
              <button type="button" className="kip-token" onClick={cancel}>
                [^C cancel]
              </button>
            </span>
          ) : suggestions.length ? (
            <span className="kip-hintbar-hints">
              <span aria-hidden="true">TAB:</span>
              {suggestions.slice(0, 8).map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="kip-token"
                  aria-label={`Complete ${suggestion}`}
                  onClick={() => {
                    setCmd(`${suggestion} `);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </span>
          ) : (
            <span className="kip-hintbar-note">
              {cmd
                ? "no matching command — try help"
                : `${user.name} · ${user.role.toUpperCase()} · ↑ recalls · ^L clears · exit leaves`}
            </span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          hidden
          tabIndex={-1}
          onChange={(event) => settleFile(event.target.files?.[0] ?? null)}
        />
      </main>
      {account.dialog}
    </TerminalSurface>
  );
}

export function TerminalWorkspace({
  initialCommand,
}: {
  initialCommand?: string;
}) {
  const {
    data: user,
    isError,
    refetch,
  } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => (await apiClient.get<User>("/users/me")).data,
  });
  if (!user)
    return (
      <TerminalSurface className="kip-console">
        <div className="kip-boot" role="status">
          {isError ? (
            <>
              <p className="kip-line" data-kind="err">
                [ERR] Could not resolve session.
              </p>
              <p className="kip-line" data-kind="dim">
                retry{" "}
                <button
                  type="button"
                  className="kip-token"
                  onClick={() => void refetch()}
                >
                  [reconnect]
                </button>
              </p>
            </>
          ) : (
            <p className="kip-line" data-kind="dim">
              resolving session
              <span className="kip-caret" aria-hidden="true" />
            </p>
          )}
        </div>
      </TerminalSurface>
    );
  return <Console key={user.id} user={user} initialCommand={initialCommand} />;
}
