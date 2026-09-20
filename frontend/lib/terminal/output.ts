/* ==========================================================================
   source:dev terminal — output vocabulary
   --------------------------------------------------------------------------
   Three things every command shares, kept here so none of them is re-invented
   per command:

   1. `LineSegment` — a line as alternating prose and runnable words, so a
      suggestion can read as a sentence with its commands *inside* it rather
      than as a row of buttons underneath.
   2. `stuck()` — the one way a command ends a dead end. No result, nothing
      due, an error: the reader never gets a bare prompt and has to guess.
   3. The current concept — the lesson on screen, so a bare `quiz` means
      "this one" the way `cd` alone means home.

   Imports here are type-only, so this module sits under both `commands.ts`
   and `learning-commands.ts` without a cycle between them.
   ========================================================================== */

/** A clickable `[label]` token. Clicking one types its command and runs it, so
 *  the keyboard and the pointer take exactly the same path through the
 *  registry. */
export interface TerminalAction {
  /** Rendered inside the brackets: `read` shows as `[read]`. */
  label: string;
  command: string;
}

// A command writes lines, and `kind` is all it says about how one looks — the
// host owns the palette. `err` is the only kind that renders red, same rule as
// login. `rule` is a divider whose text is ignored, so it is always exactly as
// wide as the terminal rather than a run of dashes that wraps on a phone.
// `banner` is ASCII art: it must never wrap, so the host lets it scroll.
export type LineKind =
  | "cmd"
  | "out"
  | "ok"
  | "err"
  | "dim"
  | "head"
  | "rule"
  | "banner";

/** A run of a line: plain prose, or a word that runs something. A line built
 *  from segments is how a command speaks a whole sentence with the verbs
 *  embedded in it. */
export type LineSegment = string | TerminalAction;

/** `{continue}` becomes the runnable word `continue`; `{here:cat intro}`
 *  runs `cat intro` but reads as “here”. Everything outside the braces is
 *  prose. */
const TOKEN = /\{([^}]+)\}/g;

/** Split a sentence into prose and runnable words. The braces are the only
 *  markup: a template with none is simply one string, which is what makes
 *  this safe to use for every line a command prints. */
export function segmentsOf(template: string): LineSegment[] {
  const segments: LineSegment[] = [];
  let at = 0;
  for (const match of template.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > at) segments.push(template.slice(at, index));
    const inner = match[1];
    const split = inner.indexOf(":");
    const label = split === -1 ? inner : inner.slice(0, split);
    const command = split === -1 ? inner : inner.slice(split + 1);
    segments.push({ label: label.trim(), command: command.trim() });
    at = index + match[0].length;
  }
  if (at < template.length) segments.push(template.slice(at));
  return segments;
}

// ─── The fetch report ───────────────────────────────────────────────────────
// `neofetch` prints facts about a machine beside its logo. Ours prints facts
// about the account beside the product mark, and the shape is the same one: an
// identity line, a rule the width of it, then aligned label/value rows.
//
// A command gathers the facts and stops there. Two columns or one, how wide
// the rule runs, which swatches the palette shows, and what any of it does on
// a phone are all layout — so none of them appear in this type. It carries no
// widths, no glyphs and no colours, only what is true.

/** One row of the block. `label` prints as written; the column it is padded
 *  into is the renderer's business, because only the renderer knows how much
 *  room there is. */
export interface FetchRow {
  label: string;
  value: string;
}

/** Everything `neofetch` has to say.
 *
 *  `user` and `host` stay apart rather than arriving pre-joined as `user@host`
 *  because a theme may well colour the two halves differently — real neofetch
 *  does — and a command that had already glued them together would have taken
 *  that decision away from the only layer entitled to make it. */
export interface FetchReport {
  user: string;
  host: string;
  rows: FetchRow[];
}

/** The block as one line of text.
 *
 *  A report renders as layout, and an entry whose text is empty is an entry
 *  that nothing reading the buffer as text can do anything with. This is the
 *  linear reading kept beside it, and it lives here rather than in the renderer
 *  because it is pure composition — no glyph, no width, nothing a theme has a
 *  view on. What is drawn on screen carries its own labels. */
export function fetchText(report: FetchReport): string {
  const facts = report.rows.map((r) => `${r.label}: ${r.value}`).join(", ");
  return `${report.user}@${report.host} — ${facts}`;
}

// ─── Command help ───────────────────────────────────────────────────────────
// Every command answers `<command> help` and `<command> --help` with the same
// block: what to type, what it does, what each argument and option means, and
// examples that would actually work. It is the one piece of documentation a
// shell has, so no command is allowed to be missing it — `COMMAND_LIST` is
// checked, not trusted.
//
// The shape is data rather than pre-formatted text on purpose. Column widths,
// indentation and which heading is drawn how are all rendering, and keeping
// them out of here is what lets `man` print the same facts in a different
// arrangement without a second copy of the content.

/** One row of a help section: the thing, then what it means. */
export interface HelpRow {
  /** `-r, --recursive`, `<path>`, `add <text>` — printed as written. */
  name: string;
  text: string;
}

/** What `<command> --help` prints.
 *
 *  `usage` and `examples` are required because they are the two parts a reader
 *  actually uses; the middle sections appear only when the command has any. A
 *  command with no options prints no `Options:` heading rather than an empty
 *  one. */
export interface CommandHelp {
  /** The synopsis, without the leading `Usage:` — `cat <path>...`. */
  usage: string;
  /** One or two lines. Sentences, not a restatement of the name. */
  description: string[];
  /** Subcommands, for a command that dispatches on its first word. */
  commands?: HelpRow[];
  /** Positional arguments. */
  args?: HelpRow[];
  /** Flags. */
  options?: HelpRow[];
  /** Lines a reader could type as they stand. At least one. */
  examples: string[];
}

// ─── The current concept ──────────────────────────────────────────────────
// The lesson on screen: the last one `cat`, `less` or `continue` showed, or
// the last one `quiz`, `complete` or `qa ask` named. Bare verbs resolve
// against it, so `quiz` alone means "this lesson" the way `cd` alone means
// home — while every named form keeps working exactly as before. Memory only,
// cleared on sign-out beside the history below.

export interface CurrentConcept {
  id: string;
  title?: string;
}

let current: CurrentConcept | null = null;

/** Remember the lesson on screen. */
export function setCurrentConcept(concept: CurrentConcept | null) {
  current = concept;
}

/** The lesson on screen, if any has been shown this session. */
export function currentConcept(): CurrentConcept | null {
  return current;
}

export function clearCurrentConcept() {
  current = null;
}

/** The closing line under a lesson, as a `stuck`-style template whose verbs
 *  carry the lesson's id — so a token runs the right lesson even when the
 *  reader has since moved on, while a *typed* bare verb resolves through the
 *  memory above. Pure composition, like `fetchText`: no glyph, no width. */
export function conceptFooter(id: string, totalQuestions: number): string {
  return totalQuestions > 0
    ? `This lesson has a knowledge check — start it with {quiz:quiz ${id}}, or bring questions to {qa ask:qa ask ${id}}.`
    : `No knowledge check on this lesson — mark it done with {complete:complete ${id}}, or move on with {continue}.`;
}

// ─── The command history ────────────────────────────────────────────────────
// `history` needs a record of what was typed, and the dispatcher is the only
// place every command passes through — so it records, and this is the store.
// It lives beside the listing index because it is the same kind of thing:
// session state that belongs to no single command, and that must not outlive
// the sign-out it was typed in.

const HISTORY_LIMIT = 500;

let history: string[] = [];

/** Record one executed line. Called by the dispatcher, not by commands.
 *
 *  Consecutive duplicates collapse, the way bash does with `ignoredups`: three
 *  `ls` in a row while reading a listing is one thing the user did, and three
 *  identical rows makes the history harder to read rather than more accurate. */
export function recordHistory(line: string) {
  const entry = line.trim();
  if (!entry) return;
  if (history[history.length - 1] === entry) return;
  history.push(entry);
  // Bounded so a long session cannot grow this without limit.
  if (history.length > HISTORY_LIMIT) {
    history = history.slice(-HISTORY_LIMIT);
  }
}

/** The history, oldest first. A copy, so a command cannot mutate the store. */
export function readHistory(): string[] {
  return [...history];
}

export function clearHistory() {
  history = [];
}

// ─── Dead ends ──────────────────────────────────────────────────────────────

/** The part of `TerminalIO` a dead end needs. Kept structural so `stuck` can be
 *  called with the full io from either command module without either importing
 *  the other. */
interface Sink {
  print: (text: string, kind?: LineKind, actions?: TerminalAction[]) => void;
  say?: (segments: LineSegment[], kind?: LineKind) => void;
}

/** The one way a command ends with nothing to show. A dead end never leaves a
 *  bare prompt: it says what happened, then what to do about it in a sentence
 *  whose verbs are runnable.
 *
 *  `lead` is the situation, in the command's own words. `options` is the
 *  sentence after it, written as a template — `{roadmaps}` is a word the
 *  reader can click, and everything else is prose. */
export function stuck(io: Sink, lead: string, options: string) {
  // An empty lead means the line above already said what happened — the error
  // the dispatcher just printed — so this adds the way forward and no blank.
  if (lead) io.print(lead, "dim");
  const segments = segmentsOf(options);
  // A host that speaks segments renders the verbs inside the sentence. One
  // that does not — the dashboard's single-line prompt — still gets the
  // sentence, with the commands as tokens after it.
  if (io.say) io.say(segments, "dim");
  else
    io.print(
      segments.map((s) => (typeof s === "string" ? s : s.label)).join(""),
      "dim",
      segments.filter((s): s is TerminalAction => typeof s !== "string"),
    );
}
