"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import type {
  CommandSpec,
  FetchReport,
  LineSegment,
  TerminalAction,
} from "@/lib/terminal/commands";
import { commandsFor } from "@/lib/terminal/commands";
import { ADMIN_COMMANDS } from "@/lib/terminal/admin-commands";
import type { ConsoleEntry } from "@/lib/terminal/session";
import { displayPath } from "@/lib/terminal/location";
import { getTheme, DEFAULT_THEME_ID } from "./themes";
import { useUiMode } from "@/providers/ui-mode-provider";
import { TerminalHeader, TerminalSurface } from "./terminal-chrome";
import { useTerminalSession } from "./use-terminal-session";
import type { SuggestMenu } from "./use-terminal-session";

/** The suggestion menu: commands and completions as rows the arrows walk.
 *  Text, not controls — accepting a row types it, exactly as if it had been
 *  typed by hand, so pointer and keyboard stay on the same path by staying
 *  off it entirely. */
function SuggestPanel({ menu }: { menu: SuggestMenu }) {
  if (!menu.rows.length) return null;
  return (
    <div className="sd-menu" role="listbox" aria-label="Suggestions">
      {menu.rows.map((row, index) => (
        <div
          key={`${row.apply}-${index}`}
          role="option"
          aria-selected={index === menu.at}
          data-active={index === menu.at ? "" : undefined}
          className="sd-line"
        >
          <span className="sd-menu-cursor" aria-hidden="true">
            {index === menu.at ? "❯" : " "}
          </span>{" "}
          <span className="sd-word">{row.label}</span>{" "}
          <span className="sd-menu-detail">{row.detail}</span>
        </div>
      ))}
      <div className="sd-line" data-kind="dim">
        {menu.hint}
      </div>
    </div>
  );
}

/** An arrow-key choice: the rows with a cursor, and what the keys do. */
function SelectPanel({
  prompt,
  rows,
  at,
}: {
  prompt: string;
  rows: string[];
  at: number;
}) {
  return (
    <div className="sd-menu" role="listbox" aria-label={prompt}>
      {rows.map((row, index) => (
        <div
          key={index}
          role="option"
          aria-selected={index === at}
          data-active={index === at ? "" : undefined}
          className="sd-line"
        >
          <span className="sd-menu-cursor" aria-hidden="true">
            {index === at ? "❯" : " "}
          </span>{" "}
          {row}
        </div>
      ))}
      <div className="sd-line" data-kind="dim">
        ↑↓ move · enter picks · esc stops
      </div>
    </div>
  );
}

/** The shortcut panel (`?` on an empty line): every key the shell answers
 *  to, in one place. Closed by any key — it teaches, then gets out of the
 *  way. */
function KeysPanel() {
  const rows: Array<[string, string]> = [
    ["tab", "complete · accept suggestion"],
    ["↑ ↓", "history · walk suggestions"],
    ["enter", "run · accept highlighted"],
    ["esc", "close · stop · clear line"],
    ["ctrl+y", "search history"],
    ["ctrl+s", "stash / restore line"],
    ["ctrl+c", "stop command · clear line"],
    ["ctrl+l", "clear screen"],
    ["?", "this panel"],
  ];
  return (
    <div className="sd-menu" role="dialog" aria-label="Keyboard shortcuts">
      {rows.map(([keys, what]) => (
        <div key={keys} className="sd-line">
          <span className="sd-word">{keys}</span> {what}
        </div>
      ))}
      <div className="sd-line" data-kind="dim">
        any key closes
      </div>
    </div>
  );
}

/** A small syntax highlighter for fenced code blocks: keywords, strings,
 *  comments and numbers, four hues total. Regex-based rather than a grammar,
 *  which means it occasionally misreads exotic syntax — but it never changes
 *  the text, only wraps runs in spans, so the worst case is a plain block
 *  with one oddly coloured word. Unknown languages fall back to plain. */
const HIGHLIGHT_KEYWORDS: Record<string, string[]> = {
  js: "const let var function return if else for while import export from class new await async try catch throw switch case break continue typeof this null undefined true false".split(" "),
  py: "def return if elif else for while import from as class with try except raise lambda None True False and or not in is pass".split(" "),
  sh: "if then else elif fi for while do done case esac function select until".split(" "),
  json: ["true", "false", "null"],
};
HIGHLIGHT_KEYWORDS.ts = HIGHLIGHT_KEYWORDS.js;
HIGHLIGHT_KEYWORDS.tsx = HIGHLIGHT_KEYWORDS.js;
HIGHLIGHT_KEYWORDS.jsx = HIGHLIGHT_KEYWORDS.js;
HIGHLIGHT_KEYWORDS.bash = HIGHLIGHT_KEYWORDS.sh;
HIGHLIGHT_KEYWORDS.shell = HIGHLIGHT_KEYWORDS.sh;

function highlightCode(text: string, lang: string): ReactNode[] {
  const keywords = HIGHLIGHT_KEYWORDS[lang];
  if (!keywords) return [text];
  const comment =
    lang === "py" || lang === "sh" || lang === "bash" || lang === "shell"
      ? "#[^\\n]*"
      : "//[^\\n]*|/\\*[\\s\\S]*?\\*/";
  const pattern = new RegExp(
    `(${comment})|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|\\b(\\d[\\d_]*(?:\\.\\d+)?)\\b|\\b(${keywords.join("|")})\\b`,
    "g",
  );
  const out: ReactNode[] = [];
  let at = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > at) out.push(text.slice(at, index));
    const [whole, com, str, num] = match;
    const tone = com
      ? "sd-tok-com"
      : str
        ? "sd-tok-str"
        : num
          ? "sd-tok-num"
          : "sd-tok-kw";
    out.push(
      <span key={key++} className={tone}>
        {whole}
      </span>,
    );
    at = index + whole.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const lang =
    /language-([\w+-]+)/.exec(className ?? "")?.[1]?.toLowerCase() ?? "";
  // Inline code carries no language: it keeps the flat style, and only
  // fenced blocks get token colours.
  if (!lang) return <code>{children}</code>;
  const text = String(children ?? "").replace(/\n$/, "");
  return <code>{highlightCode(text, lang)}</code>;
}

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

/** A runnable word printed inside a line, as text.
 *
 *  It looks like `[read]` because that is how a shell writes a word you are
 *  meant to type, and it is a `<span>` rather than a `<button>` on purpose:
 *  nothing inside the terminal viewport is clickable. The brackets come from
 *  the theme's token glyphs, so a theme that marks a verb differently — angle
 *  brackets, a colour alone — changes them in one place.
 *
 *  The command layer still emits these as `TerminalAction`s. Saying *which*
 *  verbs follow an output is semantic and stays a command's job; whether they
 *  are text or controls is this layer's, and here they are text. */
function Token({ label }: { label: string }) {
  const { tokenOpen, tokenClose } = getTheme(DEFAULT_THEME_ID).glyphs;
  return (
    <span className="sd-word">
      {tokenOpen}
      {label}
      {tokenClose}
    </span>
  );
}

/** The verbs that follow a line, printed after it. */
function InlineActions({ actions }: { actions: TerminalAction[] }) {
  return (
    <>
      {actions.map((action, index) => (
        <span key={`${action.command}-${index}`}>
          {index > 0 ? " " : null}
          <Token label={action.label} />
        </span>
      ))}
    </>
  );
}

/** A sentence with its verbs inside it rather than in a row beneath. */
function Sentence({ segments }: { segments: LineSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        typeof segment === "string" ? (
          <span key={index}>{segment}</span>
        ) : (
          <Token key={index} label={segment.label} />
        ),
      )}
    </>
  );
}

/** The palette `neofetch` ends on. Real neofetch prints the sixteen colours
 *  the terminal is actually configured with; this prints the twelve this shell
 *  is actually painted with, read straight off the custom properties
 *  `TerminalSurface` sets — so a swatch cannot drift from the colour it claims
 *  to be, and a second theme changes the row by changing the theme. */
const SWATCHES = [
  "base",
  "panel",
  "head",
  "hover",
  "line",
  "faint",
  "dim",
  "text",
  "ink",
  "accent",
  "alert",
  "error",
];

/** The `neofetch` block: the mark on the left, the identity and the facts on
 *  the right, the palette underneath.
 *
 *  The command handed over nothing but strings, and everything still being
 *  decided here is the reason why. The rule under the identity is exactly as
 *  wide as the identity, the way neofetch draws it, built from the theme's
 *  rule glyph rather than a dash typed in place. The two columns become one
 *  under the layout's breakpoint: at 360px there is room for a logo or a
 *  column of facts beside it, not both, and a crushed mark reads as corruption
 *  rather than as a logo. */
function FetchBlock({ report }: { report: FetchReport }) {
  const theme = getTheme(DEFAULT_THEME_ID);
  const id = `${report.user}@${report.host}`;
  return (
    <div className="sd-fetch">
      {/* The emblem, one tone per row: dim tips, bright frame, accent heart.
          A pre of block spans rather than raw text, so each row carries its
          own hue the way a distro logo does — still no wider than 25 cells,
          still scrolling-proof on a phone. */}
      <pre className="sd-fetch-art" aria-hidden="true">
        {theme.banner.map((line, index) => (
          <span key={index} data-tone={line.tone}>
            {line.text}
          </span>
        ))}
      </pre>
      <div className="sd-fetch-facts">
        {/* One line, two halves, coloured apart — the only place in the shell
            where the prompt's own identity is restated, so it is worth
            reading as `user@host` and not as one grey run. */}
        <p className="sd-fetch-id">
          <span className="sd-fetch-user">{report.user}</span>
          <span className="sd-fetch-sep">@</span>
          <span className="sd-fetch-host">{report.host}</span>
        </p>
        <p className="sd-fetch-underline" aria-hidden="true">
          {theme.glyphs.rule.repeat(id.length)}
        </p>
        <dl className="sd-fetch-rows">
          {report.rows.map((fact) => (
            <div className="sd-fetch-row" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <p className="sd-fetch-palette" aria-hidden="true">
          {SWATCHES.map((name) => (
            <span
              key={name}
              className="sd-swatch"
              style={{ background: `var(--term-${name})` }}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

/** One line of output. A `report` is the `neofetch` block and gets its own
 *  layout; a `banner` is ASCII art and must not wrap, so it gets a pre that
 *  scrolls; a `rule` is a divider whose width is the terminal's, not a run of
 *  dashes; a `cmd` line is echoed under its own prompt the way a shell does,
 *  and carries the caret while the boot script is still typing it; markdown is
 *  flowed. Everything else is text. */
function Line({
  entry,
}: {
  entry: ConsoleEntry;
}) {
  if (entry.kind === "rule")
    return <div className="sd-rule" role="separator" />;

  if (entry.report) return <FetchBlock report={entry.report} />;

  // No command emits `banner` today — the mark now arrives inside a fetch
  // report, which is where it belongs. The kind stays because it is the
  // vocabulary's answer to "this is art, do not reflow it", and the next thing
  // that needs that answer should not have to reinvent it.
  if (entry.kind === "banner")
    return (
      <pre className="sd-banner" aria-label="source:dev">
        {entry.text}
      </pre>
    );

  if (entry.markdown)
    return (
      <div className="sd-flow">
        {/* Markdown only — `rehype-raw` is deliberately absent, so authored
            HTML inside a lesson or an answer is escaped, never executed. */}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...DOC_HEADINGS, code: CodeBlock }}>
          {entry.text}
        </ReactMarkdown>
      </div>
    );

  if (entry.kind === "cmd")
    return (
      <div className="sd-line" data-kind="cmd">
        <span className="sd-prompt-user">developer@source-dev</span>
        <span className="sd-prompt-path">:{entry.path ?? "~"}$</span>{" "}
        {entry.text}
        {entry.typing && <span className="sd-caret" aria-hidden="true" />}
      </div>
    );

  if (entry.segments)
    return (
      <div className="sd-line" data-kind={entry.kind}>
        <Sentence segments={entry.segments} />
      </div>
    );

  return (
    <div className="sd-line" data-kind={entry.kind}>
      {entry.text || " "}
      {Boolean(entry.actions?.length) && (
        <>
          {entry.text ? " " : ""}
          <InlineActions actions={entry.actions ?? []} />
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
 *  How to stop it is printed, not offered as a control: `^C` is a keystroke,
 *  and a button that says `^C` would be teaching the wrong thing about the
 *  thing it is a button for.
 *
 *  It keeps its own clock so the ticking frame re-renders this line alone and
 *  not the whole buffer of output above it. */
function RunIndicator({ label }: { label: string | null }) {
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
    <div className="sd-line sd-run" data-kind="dim" role="status">
      {/* The count changes ten times a second: announcing it would be noise,
          so the spoken version says what is happening, once. */}
      <span className="sr-only">
        {said}, in progress. Press control C to stop.
      </span>
      <span aria-hidden="true">
        {said}… <span className="sd-spin">{frame}</span> {seconds.toFixed(1)}s
        {"  ^C stops it"}
      </span>
    </div>
  );
}

function Console({
  user,
  initialCommand,
  commands,
  commandsRole,
}: {
  user: User;
  initialCommand?: string;
  commands?: CommandSpec[];
  commandsRole?: "developer" | "admin";
}) {
  // Functions never cross the server/client boundary: the page passes a role
  // string and the registry composes client-side.
  const list =
    commands ??
    (commandsRole === "admin" ? commandsFor("admin", ADMIN_COMMANDS) : undefined);
  const session = useTerminalSession(user, initialCommand, list);
  const {
    lines,
    booting,
    cmd,
    setCmd,
    busy,
    status,
    pending,
    selecting,
    menu,
    searchActive,
    keysOpen,
    pagerAt,
    execute,
    account,
    inputRef,
    fileRef,
    onKeyDown,
    answer,
    acceptSelect,
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
  // A paging `less` is technically still running, but it is waiting on a
  // keypress, not on work — so the spinner would be claiming something untrue.
  // The pager's own status line stands in its place, exactly as it does for a
  // question waiting on an answer. A choice in progress counts the same way.
  const running = busy && !pending && !selecting && !pagerAt;
  const showCaret = atEnd && !running;

  // ─── Streaming reveal ─────────────────────────────────────────────────────
  // A command prints its whole output in one pass, which arrives as a wall of
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

  // One continuous scrollback, so the view follows the newest line the way a
  // terminal does — except while the reader has scrolled up to read something,
  // when yanking them back to the bottom would be the rudest thing this
  // component could do. "At the bottom" is measured with a tolerance, because
  // fractional scroll heights never land exactly.
  const atBottom = useRef(true);
  const onScroll = useCallback(() => {
    const el = view.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);
  useEffect(() => {
    const el = view.current;
    if (!el) return;
    // Boot is the exception that is not an exception: it is printing at the
    // bottom too, so the same rule keeps its caret in sight.
    if (!atBottom.current && !booting) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, booting]);
  return (
    <TerminalSurface className="sd-console">
      {/* The only chrome left. It sits outside the terminal window, which is
          why it is allowed to have controls at all — everything inside the
          window below is text. */}
      <TerminalHeader
        user={user}
        active="terminal"
        onLogout={account.requestLogout}
      />
      <main className="sd-console-main" aria-label="Terminal">
        <h1 className="sr-only">source:dev learning shell</h1>
        {/* The whole screen is one click target: clicking anywhere in the
            output focuses the prompt, the way a terminal emulator does. */}
        <div
          ref={view}
          className="sd-screen"
          onScroll={onScroll}
          onMouseUp={() => {
            if (!window.getSelection()?.toString())
              inputRef.current?.focus({ preventScroll: true });
          }}
        >
          <div
            className="sd-screen-lines"
            role="log"
            aria-label="Terminal output"
            aria-live="polite"
            aria-relevant="additions"
          >
            {lines.map((entry) => (
              <div
                key={entry.id}
                className="sd-reveal"
                style={
                  { "--sd-delay": `${entry.delay ?? 0}ms` } as CSSProperties
                }
              >
                <Line entry={entry} />
              </div>
            ))}
            {running && <RunIndicator label={status} />}
          </div>

          {/* The pager's status line, where the prompt would be — the prompt is
              gone while `less` has the keyboard. The text comes from the active
              theme (`glyphs.more`), not from here and not from the command:
              `--More--(45%)` is this theme's idiom, and another theme is free to
              say it differently. */}
          {pagerAt && (
            <div className="sd-line" data-kind="head" aria-live="polite">
              {getTheme(DEFAULT_THEME_ID).glyphs.more(
                Math.round((pagerAt.shown / pagerAt.total) * 100),
              )}
            </div>
          )}

          {/* The choice panel and the suggestion menu stand where the prompt
              would be waiting — both borrow its keyboard, so the prompt
              stays mounted underneath and keeps the caret warm. */}
          {selecting && (
            <SelectPanel
              prompt={selecting.prompt}
              rows={selecting.rows}
              at={selecting.at}
            />
          )}
          {menu && !selecting && <SuggestPanel menu={menu} />}
          {keysOpen && !selecting && !menu && <KeysPanel />}

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
              className="sd-prompt"
              data-focused={focused ? "" : undefined}
              data-caret={atEnd ? "block" : "line"}
              onSubmit={(event) => {
                event.preventDefault();
                if (pending) answer(cmd);
                else if (selecting) acceptSelect();
                else if (!searchActive) void execute(cmd);
              }}
            >
              <label htmlFor="terminal-input" className="sd-prompt-label">
                {pending ? (
                  <span className="sd-prompt-ask">{pending.prompt}:</span>
                ) : selecting ? (
                  <span className="sd-prompt-ask">{selecting.prompt}:</span>
                ) : searchActive ? (
                  <span className="sd-prompt-ask">history:</span>
                ) : (
                  <>
                    <span className="sd-prompt-user">developer@source-dev</span>
                    <span className="sd-prompt-path">:{promptPath}$</span>
                  </>
                )}
              </label>
              <span className="sd-prompt-entry">
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
                  aria-label={
                    pending
                      ? pending.prompt
                      : selecting
                        ? selecting.prompt
                        : searchActive
                          ? "Search history"
                          : "Terminal command"
                  }
                  placeholder=""
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {showCaret && <span className="sd-caret" aria-hidden="true" />}
              </span>
            </form>
          )}
        </div>

        {/* Nothing else. The window holds scrolled output and one prompt line,
            which is the whole of a terminal — what used to sit below here was a
            status bar with `[back]`/`[next]` and a strip of command chips, and
            both were the old panelled dashboard showing through. Anything the
            reader needs to know now gets printed or panelled above the prompt:
            TAB lists suggestions, `less` prints `--More--`, a running command
            prints how to stop it, and `help` prints the rest. */}
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
  commands,
  commandsRole,
}: {
  initialCommand?: string;
  commands?: CommandSpec[];
  commandsRole?: "developer" | "admin";
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
      <TerminalSurface className="sd-console">
        <div className="sd-boot" role="status">
          {isError ? (
            <>
              <p className="sd-line" data-kind="err">
                [ERR] Could not resolve session.
              </p>
              <p className="sd-line" data-kind="dim">
                retry{" "}
                <button
                  type="button"
                  className="sd-token"
                  onClick={() => void refetch()}
                >
                  [reconnect]
                </button>
              </p>
            </>
          ) : (
            <p className="sd-line" data-kind="dim">
              resolving session
              <span className="sd-caret" aria-hidden="true" />
            </p>
          )}
        </div>
      </TerminalSurface>
    );
  return <Console key={user.id} user={user} initialCommand={initialCommand} commands={commands} commandsRole={commandsRole} />;
}
