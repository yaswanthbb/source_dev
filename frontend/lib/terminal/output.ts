/* ==========================================================================
   KIP Terminal — output vocabulary
   --------------------------------------------------------------------------
   Three things every command shares, kept here so none of them is re-invented
   per command:

   1. `LineSegment` — a line as alternating prose and runnable words, so a
      suggestion can read as a sentence with its commands *inside* it rather
      than as a row of buttons underneath.
   2. `stuck()` — the one way a command ends a dead end. No result, nothing
      due, an error: the reader never gets a bare prompt and has to guess.
   3. The listing index — what `[1]` meant in the output still on screen, so
      `open 1` works, plus the titles TAB completes against.

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

/** `{roadmaps}` becomes the runnable word `roadmaps`; `{here:qa open 7}` runs
 *  `qa open 7` but reads as “here”. Everything outside the braces is prose. */
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

// ─── The listing index ──────────────────────────────────────────────────────
// A UUID is unreadable and unguessable, so a listing prints `[1] VOIP Basics`
// and the next command may say `open 1`. The numbering belongs to whichever
// listing is currently on screen: printing a new one replaces it, exactly as
// the numbers on screen are replaced.

export type IndexKind = "roadmap" | "concept" | "thread";

export interface IndexItem {
  id: string;
  title: string;
}

let listing: { kind: IndexKind; items: IndexItem[] } | null = null;

/** Titles seen in any listing this session, per kind. TAB completes against
 *  these, so `read voip<TAB>` finishes a lesson the student has actually been
 *  shown rather than guessing at the catalogue. */
const known = new Map<IndexKind, Map<string, string>>();

/** Record what was just printed, in the order it was printed. Call this as the
 *  listing is built — the numbers handed back are the ones to print. */
export function indexListing(kind: IndexKind, items: IndexItem[]) {
  listing = { kind, items };
  const seen = known.get(kind) ?? new Map<string, string>();
  for (const item of items) seen.set(item.id, item.title);
  known.set(kind, seen);
}

/** Resolve `2` against the listing on screen. Anything that is not a plain
 *  number, or is out of range, resolves to nothing and falls through to the
 *  usual title/id lookup. */
export function resolveIndex(kind: IndexKind, token: string): string | undefined {
  if (!listing || listing.kind !== kind) return undefined;
  if (!/^\d+$/.test(token.trim())) return undefined;
  return listing.items[Number(token.trim()) - 1]?.id;
}

/** Titles worth completing for a kind, longest-seen first. */
export function knownTitles(kind: IndexKind): string[] {
  return [...(known.get(kind)?.values() ?? [])];
}

export function clearListings() {
  listing = null;
  known.clear();
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
