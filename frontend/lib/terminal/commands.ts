/* ==========================================================================
   source:dev terminal — shared command registry
   --------------------------------------------------------------------------
   One source of truth for the interactive shell. The dashboard footer prompt
   and the full-screen CLI tab both dispatch through `runCommand`, so a command
   added here is immediately available in both places.

   Commands never touch React state directly: everything they need is handed
   to them on the `CommandCtx` (io, user, logout, theme). That keeps this file
   testable and free of component imports.
   ========================================================================== */

import { LEARNING_COMMANDS } from "./learning-commands";
import { FS_COMMANDS } from "./fs-commands";
import { isAbortError } from "./request";
import { completeAdminValues } from "./admin-complete";
import { stuck, recordHistory, fetchText, clearCurrentConcept } from "./output";
import type { Location } from "./location";
import { childKindOf, resolvePath } from "./location";
import type { ChildKind } from "./location";
import { listChildren, type VfsEntry } from "./resolve-location";
import apiClient from "@/lib/api-client";
import { User } from "@/lib/auth";
import {
  AVATAR_ACCEPT,
  dataUrlSizeKb,
  resizeImageToDataUrl,
} from "@/lib/image";
import { detectTimezone, formatDate } from "@/lib/timezone";

// ─── Output model ───────────────────────────────────────────────────────────
// A command writes lines. That is the whole surface: no panels, no cards, no
// button bars — the same contract a program has with a real shell, which is
// why output here reads like output there.
//
// The vocabulary itself — `LineKind`, `TerminalAction`, the sentence builder
// and the listing index — lives in `output.ts`, which imports nothing, so both
// this file and `learning-commands.ts` can share it without a cycle. It is
// re-exported here so consumers keep importing the shell from one place.
export {
  segmentsOf,
  stuck,
  currentConcept,
  setCurrentConcept,
  clearCurrentConcept,
  conceptFooter,
  fetchText,
  type LineKind,
  type TerminalAction,
  type LineSegment,
  type FetchRow,
  type FetchReport,
  type CommandHelp,
  type HelpRow,
  type CurrentConcept,
} from "./output";
import type {
  CommandHelp,
  FetchReport,
  FetchRow,
  HelpRow,
  LineKind,
  LineSegment,
  TerminalAction,
} from "./output";

export interface TerminalLine {
  id: number;
  kind: LineKind;
  text: string;
  actions?: TerminalAction[];
}

/** Raised when the user aborts an `ask` with Esc. The dispatcher catches it
 *  centrally so no individual command has to check for it. */
export class CommandAborted extends Error {
  constructor() {
    super("aborted");
    this.name = "CommandAborted";
  }
}

export interface AskOptions {
  mask?: boolean;
  /** Extra replies offered beside whatever the command already printed —
   *  `[skip this question]`, `[stop for now]`. These are *not* a copy of the
   *  options on screen: a question that has printed its own numbered list
   *  passes only the escapes, so nothing is listed twice. */
  choices?: Array<{ label: string; value: string }>;
}

/** The shell surface a command is allowed to drive. */
export interface TerminalIO {
  /** Append one line to the buffer. `actions` become inline `[label]` tokens
   *  at the end of that line. */
  print: (text: string, kind?: LineKind, actions?: TerminalAction[]) => void;
  /** Append one line built from segments, so a runnable word can sit inside a
   *  sentence instead of in a row beneath it. Optional: a host without it
   *  still gets the sentence through `print`. */
  say?: (segments: LineSegment[], kind?: LineKind) => void;
  /** Name what the shell is waiting on, shown beside the spinner while the
   *  command runs: `asking the AI… ⠹ 2.3s`. */
  status?: (text: string) => void;
  /** Wipe the buffer. */
  clear: () => void;
  /** Park the prompt and wait for one line of input. `mask` hides it. */
  ask: (prompt: string, opts?: AskOptions) => Promise<string>;
  /** Open the OS file picker. Resolves null if the user cancels. The host
   *  owns the input element, so this module stays free of DOM work. */
  pickFile: (accept: string) => Promise<File | null>;
  /** Pick one row by arrow keys, resolving its index. Esc rejects with
   *  `CommandAborted`, the same as ^C — every caller treats "no choice" as
   *  "stop everything". The host owns the cursor, the keys and the highlight,
   *  none of which this layer can know; a host without them prints the rows
   *  numbered and asks instead, which is the better failure. */
  select?: (prompt: string, rows: string[]) => Promise<number>;
  /** Flow one markdown block — a lesson, an answer — as terminal text:
   *  headings, lists and code, with no frame of its own. The caller prints
   *  the header and footer lines around it, the way `man` or `glow` do. */
  doc?: (markdown: string) => void;
  /** Page a long text one screen at a time, resolving when the reader quits.
   *
   *  The host implements this, not the command, because everything a pager
   *  needs to decide is the host's: how tall the viewport is, what a keypress
   *  means, and how the status line is drawn (from `glyphs.more`). `less` here
   *  only says *what* to page. A host with no viewport — the dashboard's
   *  single-line prompt — omits this, and `less` prints the lesson instead of
   *  refusing to work. */
  page?: (text: string, opts?: { title?: string }) => Promise<void>;
  /** Draw a fetch report: the mark, the identity line, and the facts under it.
   *
   *  Here for the same reason `page` is. Everything still undecided once the
   *  facts are gathered belongs to the host — whether there is room beside the
   *  art for a second column, how wide the rule under the identity runs, and
   *  what the palette actually is — and none of it is anything `neofetch`
   *  could answer from where it stands. A host with no such layout, the
   *  dashboard's single-line prompt, omits this and gets the same facts as
   *  plain rows rather than nothing. */
  fetch?: (report: FetchReport) => void;
  /** Leave the terminal and return to the dashboard. */
  close: () => void;
}

export interface CommandCtx {
  /** Argv after the command name, already tokenised. */
  args: string[];
  /** The full line as typed, for commands that want it verbatim. */
  raw: string;
  io: TerminalIO;
  user?: User;
  /** Where the user is in the virtual filesystem.
   *
   *  This is the shared location both modes render off — the same value behind
   *  the browser route and `pwd` — so it is passed in by the host rather than
   *  kept here. A command reads it; only `setCwd` changes it. */
  cwd: Location;
  /** Move the user. The host updates the URL as well as the state, so the
   *  address bar and `pwd` cannot disagree. */
  setCwd: (loc: Location) => void;
  /** Re-fetch the cached user so the navbar reflects an edit immediately. */
  refreshUser: () => Promise<void>;
  isDark: boolean;
  setTheme: (theme: "light" | "dark") => void;
  logout: () => void;
  confirmLogout?: () => Promise<boolean>;
  navigate?: (path: string) => void;
  refreshLearning?: () => Promise<void>;
  /** The registry this run resolves against — set by `runCommand` from the
   *  active shell's list, so `help`/`man` document the shell you are in. */
  commands?: CommandSpec[];
}

export interface CommandSpec {
  name: string;
  /** Shown by `help`; keep it short enough for a 360px viewport. */
  usage: string;
  summary: string;
  group: string;
  /** Aliases resolve to this command but are not listed by `help`. */
  aliases?: string[];
  /** Kept out of `help` and the hint strip. */
  hidden?: boolean;
  /** Which of this command's operands name a place in the tree, so TAB can
   *  complete them against what is actually there. Absent means the command
   *  takes no path — `theme`, `history`, `whoami`. */
  completes?: PathArity;
  /** With `completes`, the first operands that are verbs rather than places —
   *  `qa`'s subcommands. Paths complete only past them, and only when the
   *  first one names a subcommand that takes a place (`ask`, `concept`):
   *  `qa ask voi⇥` completes lessons, `qa open ⇥` completes nothing, because
   *  a thread id is not a path. */
  completesAfter?: string[];
  /** What `<command> help` and `<command> --help` print. Required — a command
   *  with no help is a command nobody can learn, and `commands.test.mjs`
   *  asserts every entry in `COMMAND_LIST` has one. */
  help: CommandHelp;
  run: (ctx: CommandCtx) => void | Promise<void>;
  /** Shells this command belongs to. Absent means both. Admin-only and
   *  developer-only entries are composed per role by `commandsFor`. */
  role?: "developer" | "admin";
}

// ─── Help rendering ─────────────────────────────────────────────────────────
// Two arrangements of one set of facts. `--help` prints the shape a modern CLI
// prints — Usage, Description, then the tables, then examples. `man` prints the
// same content under the headings a man page uses. Neither is allowed to hold
// content the other does not, because there is only one `CommandHelp` behind
// both of them.

/** The gutter every help table aligns its second column to. Wide enough for
 *  `-r, --recursive` and short enough that a 360px screen still has room for
 *  the text beside it; a name longer than this pushes its own text along
 *  rather than truncating, the way `--help` output does everywhere. */
const HELP_GUTTER = 18;

function helpRows(io: TerminalIO, title: string, rows?: HelpRow[]) {
  if (!rows?.length) return;
  io.print("");
  io.print(`${title}:`, "head");
  for (const entry of rows) {
    const pad = entry.name.padEnd(HELP_GUTTER);
    io.print(`  ${pad} ${entry.text}`);
  }
}

/** `<command> --help`. */
function printHelp(io: TerminalIO, name: string, help: CommandHelp) {
  io.print(`Usage: ${help.usage}`, "head");
  io.print("");
  io.print("Description:", "head");
  for (const line of help.description) io.print(`  ${line}`);
  helpRows(io, "Commands", help.commands);
  helpRows(io, "Arguments", help.args);
  helpRows(io, "Options", help.options);
  io.print("");
  io.print("Examples:", "head");
  for (const example of help.examples) io.print(`  ${example}`);
  io.print("");
  io.print(`Run ${name} with no arguments to see its default output.`, "dim");
}

/** `man <command>`. The same facts, under the headings a man page uses. */
export function printMan(io: TerminalIO, spec: CommandSpec) {
  const { help } = spec;
  io.print(`${spec.name.toUpperCase()}(1)`, "head");
  io.print("");
  io.print("NAME", "head");
  io.print(`  ${spec.name} — ${spec.summary}`);
  io.print("");
  io.print("SYNOPSIS", "head");
  io.print(`  ${help.usage}`);
  io.print("");
  io.print("DESCRIPTION", "head");
  for (const line of help.description) io.print(`  ${line}`);
  helpRows(io, "COMMANDS", help.commands);
  helpRows(io, "ARGUMENTS", help.args);
  helpRows(io, "OPTIONS", help.options);
  helpRows(
    io,
    "SEE ALSO",
    spec.aliases?.length
      ? [{ name: "aliases", text: spec.aliases.join(", ") }]
      : undefined,
  );
  io.print("");
  io.print("EXAMPLES", "head");
  for (const example of help.examples) io.print(`  ${example}`);
}

/** Whether this argument list is asking for the help block rather than for the
 *  command's own work.
 *
 *  `help`, `--help` and `-h` all mean the same thing, and they only count as
 *  the first argument.
 */
function wantsHelp(args: string[]): boolean {
  const first = args[0]?.toLowerCase();
  return args.length === 1 && (first === "help" || first === "--help" || first === "-h");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Split a line into tokens, honouring "quoted strings" so names with spaces
 *  survive as one argument. */
export function tokenise(input: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    out.push(m[1] ?? m[2] ?? m[3] ?? "");
  }
  return out;
}

/** Pull a human-readable message out of an axios error. Nest sends `message`
 *  as either a string or an array of validation failures. */
function errText(e: unknown): string {
  const res = (e as { response?: { data?: { message?: unknown } } })?.response;
  const msg = res?.data?.message;
  if (Array.isArray(msg)) return msg.join("; ");
  if (typeof msg === "string") return msg;
  if (e instanceof Error && e.message) return e.message;
  return "request failed";
}

/** `label` padded to a fixed gutter so values line up like a real table. */
function row(label: string, value: string): string {
  return `  ${label.padEnd(14)} ${value}`;
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Render a timestamp as a date in the account's zone. Slicing the ISO string
 *  instead would print the UTC date, which is the wrong day for much of the
 *  world for part of every day. */
function fmtDate(value?: string | null, tz?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDate(d, tz);
}

/** Ask a yes/no question; anything other than y/yes is a no. */
async function confirm(io: TerminalIO, prompt: string): Promise<boolean> {
  const answer = (await io.ask(`${prompt} [y/N]`)).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

// ─── Commands ───────────────────────────────────────────────────────────────

const help: CommandSpec = {
  name: "help",
  usage: "help [command]",
  summary: "list commands, or explain one",
  group: "shell",
  aliases: ["?"],
  help: {
    usage: "help [command]",
    description: [
      "List every command, grouped by what it is for.",
      "With a command name, print that command's full help block — the same",
      "thing `<command> --help` prints.",
    ],
    args: [{ name: "[command]", text: "Print this command's help instead of the list" }],
    examples: ["help", "help ls", "help quiz", "ls --help"],
  },
  run: ({ args, io, commands }) => {
    const [target] = args;
    if (target) {
      const spec = resolve(target, commands);
      if (!spec) {
        io.print(`help: no such command: ${target}`, "err");
        stuck(io, "", "Run {help} with no arguments to see the full list.");
        return;
      }
      printHelp(io, spec.name, spec.help);
      return;
    }

    io.print("AVAILABLE COMMANDS", "head");
    const list = commands ?? COMMAND_LIST;
    const groups = [...new Set(list.map((s) => s.group))];
    for (const group of groups) {
      io.print("");
      io.print(`  ${group}/`, "dim");
      for (const spec of list.filter((s) => s.group === group)) {
        io.print(`    ${spec.usage.padEnd(28)} ${spec.summary}`);
      }
    }
    io.print("");
    io.print("  [TAB] completes · [↑/↓] history · [^C] interrupt · [^L] clear", "dim");
    io.print("");
    // The closing line of the list, and the only place the two spellings are
    // named together — every command answers both.
    io.print('Type "[command] help" or "[command] --help" for more info.');
  },
};

const whoami: CommandSpec = {
  name: "whoami",
  usage: "whoami",
  summary: "print the signed-in identity",
  group: "profile",
  help: {
    usage: "whoami",
    description: [
      "Print who this session belongs to: name, email address and role.",
      "Answered from the session itself, so nothing is fetched.",
    ],
    examples: ["whoami"],
  },
  run: ({ io, user }) => {
    if (!user) {
      io.print("whoami: session not loaded yet", "err");
      return;
    }
    io.print(`${user.name} <${user.email}> [${user.role.toUpperCase()}]`);
    stuck(
      io,
      "",
      "That is this session. {profile} shows the full record · {passwd} changes the secret.",
    );
  },
};

const profile: CommandSpec = {
  name: "profile",
  usage: "profile [set name|set tz|avatar set|avatar clear]",
  summary: "show or edit your profile",
  group: "profile",
  help: {
    usage: "profile [set name <value>] [set tz <zone>] [avatar set|clear]",
    description: [
      "Show your account record, or change part of it.",
      "With no arguments it fetches and prints the record as it stands.",
    ],
    commands: [
      {
        name: "set name <value>",
        text: "Rename the account; the rest of the line is the name",
      },
      {
        name: "set tz <zone>",
        text: "Set the timezone to an IANA zone, e.g. Asia/Kolkata",
      },
      { name: "avatar set", text: "Upload a picture, cropped to 256x256" },
      { name: "avatar clear", text: "Remove the current picture" },
    ],
    examples: [
      "profile",
      "profile set name Yaswanth K",
      "profile set tz Asia/Kolkata",
      "profile avatar set",
      "profile avatar clear",
    ],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub] = args;

    if (!sub) return showProfile(ctx);
    if (sub === "set") return setField(ctx, args.slice(1));
    if (sub === "avatar") return avatar(ctx, args.slice(1));

    io.print(`profile: unknown subcommand: ${sub}`, "err");
    io.print(
      "  try: profile · profile set name · profile set tz · profile avatar set",
      "dim",
    );
  },
};

async function showProfile({ io }: CommandCtx): Promise<void> {
  io.print("resolving identity ...", "dim");
  try {
    const { data } = await apiClient.get<User>("/users/me");
    io.print("USER RECORD", "head");
    io.print(row("name", data.name));
    io.print(row("email", data.email));
    io.print(row("role", data.role.toUpperCase()));
    io.print(row("timezone", data.timezone || "UTC"));
    io.print(row("avatar", data.profilePicture ? "set" : "none"));
    io.print(row("auth", data.authProvider || "password"));
    io.print(row("member_since", fmtDate(data.createdAt, data.timezone)));
    io.print("");
    io.print("  profile set name <new name>   rename the account", "dim");
    io.print("  timezone auto                 adopt the browser zone", "dim");
    io.print("  profile avatar set            upload a picture", "dim");
    io.print("  passwd                        change password", "dim");
  } catch (e) {
    io.print(`profile: ${errText(e)}`, "err");
  }
}

async function setField(ctx: CommandCtx, rest: string[]): Promise<void> {
  const { io, refreshUser } = ctx;
  const [field, ...valueParts] = rest;

  if (field !== "name" && field !== "tz" && field !== "timezone") {
    io.print("profile set: field must be name or tz", "err");
    return;
  }

  // Everything after the field is the value, so unquoted multi-word names work.
  let value = valueParts.join(" ").trim();
  if (!value) {
    value = (
      await io.ask(field === "name" ? "new name" : "new timezone")
    ).trim();
  }
  if (!value) {
    io.print("profile set: value cannot be empty", "err");
    return;
  }

  const isName = field === "name";
  if (!isName && !isValidTimezone(value)) {
    io.print(`profile set: not a valid IANA timezone: ${value}`, "err");
    io.print("  e.g. Asia/Kolkata, Europe/Berlin, America/New_York", "dim");
    return;
  }

  try {
    await apiClient.patch(
      "/users/me",
      isName ? { name: value } : { timezone: value },
    );
    await refreshUser();
    io.print(`[OK] ${isName ? "name" : "timezone"} updated → ${value}`, "ok");
  } catch (e) {
    io.print(`profile set: ${errText(e)}`, "err");
  }
}

async function avatar(ctx: CommandCtx, rest: string[]): Promise<void> {
  const { io, refreshUser } = ctx;
  const action = rest[0];

  if (action === "clear") {
    try {
      await apiClient.patch("/users/me", { profilePicture: null });
      await refreshUser();
      io.print("[OK] avatar removed", "ok");
    } catch (e) {
      io.print(`profile avatar: ${errText(e)}`, "err");
    }
    return;
  }

  if (action !== "set") {
    io.print("usage: profile avatar set|clear", "err");
    return;
  }

  io.print("opening file picker ...", "dim");
  const file = await io.pickFile(AVATAR_ACCEPT);
  if (!file) {
    io.print("profile avatar: no file selected", "dim");
    return;
  }

  io.print(`read ${file.name} (${Math.round(file.size / 1024)}KB)`, "dim");
  io.print("cropping to 256x256 ...", "dim");

  let dataUrl: string;
  try {
    dataUrl = await resizeImageToDataUrl(file);
  } catch (e) {
    io.print(
      `profile avatar: ${e instanceof Error ? e.message : "could not read image"}`,
      "err",
    );
    return;
  }

  io.print(`encoded ${dataUrlSizeKb(dataUrl)}KB`, "dim");
  try {
    await apiClient.patch("/users/me", { profilePicture: dataUrl });
    await refreshUser();
    io.print("[OK] avatar updated", "ok");
  } catch (e) {
    io.print(`profile avatar: ${errText(e)}`, "err");
  }
}

const timezone: CommandSpec = {
  name: "timezone",
  usage: "timezone [zone|auto]",
  summary: "show or change your timezone",
  group: "profile",
  aliases: ["tz"],
  help: {
    usage: "timezone [zone|auto]",
    description: [
      "Show the timezone every date in the shell is printed in, or change it.",
      "Dates are stored in UTC and rendered in this zone, so changing it never",
      "alters a record — only how it reads.",
    ],
    args: [
      { name: "<zone>", text: "An IANA zone name, e.g. Europe/Berlin" },
      { name: "auto", text: "Adopt the zone this browser reports" },
    ],
    examples: [
      "timezone",
      "timezone auto",
      "timezone Asia/Kolkata",
      "tz America/New_York",
    ],
  },
  run: async ({ args, io, user, refreshUser }) => {
    const [arg] = args;
    const detected = detectTimezone();

    // No argument: report both, and say whether they disagree.
    if (!arg) {
      io.print(row("account", user?.timezone || "UTC"));
      io.print(row("browser", detected || "unavailable"));
      if (detected && user?.timezone && detected !== user.timezone) {
        io.print("");
        io.print("these differ — timezone auto adopts the browser zone", "dim");
      }
      stuck(
        io,
        "",
        "Change it with timezone <zone> · timezone auto follows this browser.",
      );
      return;
    }

    const target = arg === "auto" ? detected : arg;
    if (!target) {
      io.print("timezone: this browser will not report a zone", "err");
      return;
    }
    if (!isValidTimezone(target)) {
      io.print(`timezone: not a valid IANA zone: ${target}`, "err");
      io.print("  e.g. Asia/Kolkata, Europe/Berlin, America/New_York", "dim");
      return;
    }

    try {
      await apiClient.patch("/users/me", { timezone: target });
      await refreshUser();
      io.print(`[OK] timezone → ${target}`, "ok");
    } catch (e) {
      io.print(`timezone: ${errText(e)}`, "err");
    }
  },
};

const passwd: CommandSpec = {
  name: "passwd",
  usage: "passwd",
  summary: "change your password",
  group: "profile",
  help: {
    usage: "passwd",
    description: [
      "Change the account password. Prompts for the current one, then the new",
      "one twice; nothing is echoed as you type it.",
    ],
    examples: ["passwd"],
  },
  run: async ({ io }) => {
    const current = await io.ask("current password", { mask: true });
    if (!current) {
      io.print("passwd: aborted — current password required", "err");
      return;
    }
    const next = await io.ask("new password (min 8)", { mask: true });
    if (next.length < 8) {
      io.print("passwd: new password must be at least 8 characters", "err");
      return;
    }
    const again = await io.ask("retype new password", { mask: true });
    if (next !== again) {
      io.print("passwd: passwords do not match", "err");
      return;
    }
    try {
      await apiClient.patch("/users/me/password", {
        currentPassword: current,
        newPassword: next,
      });
      io.print("[OK] password changed", "ok");
      stuck(io, "", "Takes effect on next sign-in · nothing else changes.");
    } catch (e) {
      io.print(`passwd: ${errText(e)}`, "err");
    }
  },
};


interface DeletionRequest {
  id: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt?: string;
}

const deletionStatus: CommandSpec = {
  name: "deletion-status",
  usage: "deletion-status",
  summary: "check an account deletion request",
  group: "danger",
  help: {
    usage: "deletion-status",
    description: [
      "Print the state of an account deletion request, if one is open.",
      "Says so plainly when nothing has been requested.",
    ],
    examples: ["deletion-status"],
  },
  run: async ({ io, user }) => {
    try {
      const { data } = await apiClient.get<DeletionRequest | null>(
        "/users/me/deletion-request",
      );
      if (!data) {
        io.print("no deletion request on file", "dim");
        return;
      }
      io.print("DELETION REQUEST", "head");
      io.print(row("status", data.status.toUpperCase()));
      io.print(row("submitted", fmtDate(data.createdAt, user?.timezone)));
      io.print(row("reviewed", fmtDate(data.reviewedAt, user?.timezone)));
      io.print(row("reason", data.reason || "—"));
    } catch (e) {
      io.print(`deletion-status: ${errText(e)}`, "err");
    }
  },
};

const deleteAccount: CommandSpec = {
  name: "delete-account",
  usage: "delete-account",
  summary: "request permanent account deletion",
  group: "danger",
  help: {
    usage: "delete-account",
    description: [
      "Submit a request for an admin to delete this account permanently.",
      "Requires typing DELETE to confirm, and takes an optional reason.",
      "Approval erases progress, XP and badges; it cannot be undone.",
    ],
    examples: ["delete-account", "deletion-status"],
  },
  run: async ({ io, user }) => {
    if (user?.role === "admin") {
      io.print("delete-account: administrators cannot self-delete", "err");
      return;
    }
    io.print("This submits a deletion request to an admin.", "dim");
    io.print("Approval erases your progress, XP and badges.", "dim");
    const typed = await io.ask("type DELETE to continue");
    if (typed.trim() !== "DELETE") {
      io.print("delete-account: cancelled", "dim");
      return;
    }
    const reason = (await io.ask("reason (optional)")).trim();
    if (reason.length > 1000) {
      io.print("delete-account: reason must be under 1000 characters", "err");
      return;
    }
    try {
      await apiClient.post("/users/request-deletion", reason ? { reason } : {});
      io.print("[OK] deletion request submitted — status PENDING", "ok");
      io.print("  track it with deletion-status", "dim");
    } catch (e) {
      io.print(`delete-account: ${errText(e)}`, "err");
    }
  },
};

const logoutCmd: CommandSpec = {
  name: "logout",
  usage: "logout",
  summary: "end the session and return to login",
  group: "session",
  help: {
    usage: "logout",
    description: [
      "End the session, clear the stored credentials and return to the login",
      "screen. Asks for confirmation first.",
      "exit is the other one: it leaves the shell but stays signed in.",
    ],
    examples: ["logout", "exit"],
  },
  run: async ({ io, logout, confirmLogout }) => {
    if (!(await (confirmLogout ? confirmLogout() : confirm(io, "end session?")))) {
      io.print("logout: cancelled", "dim");
      return;
    }
    io.print("clearing credentials ...", "dim");
    logout();
  },
};

// ─── Notifications (both shells) ───────────────────────────────────────────
// The bell lives here, not in either role file: developers and admins read
// the same endpoints, and one implementation cannot drift from itself.

interface BellItem {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

function bellTitle(n: BellItem): string {
  const p = n.payload ?? {};
  return (
    (p.roadmapTitle as string) ||
    (p.conceptTitle as string) ||
    (p.title as string) ||
    (p.targetLabel as string) ||
    ""
  );
}

const notifications: CommandSpec = {
  name: "notifications",
  usage: "notifications [read|clear] ...",
  summary: "read the bell",
  group: "notify",
  help: {
    usage: "notifications [type] [--unread] | notifications read <id> | notifications clear",
    description: [
      "Newest first. Filter by type, or to unread only.",
      "Read one or clear the bell in one move.",
    ],
    args: [
      { name: "[type]", text: "e.g. roadmap_submitted, ai_job_failed" },
      { name: "--unread", text: "Unread only" },
      { name: "read <id>", text: "Mark one notification read" },
      { name: "clear", text: "Mark every notification read" },
    ],
    examples: ["notifications", "notifications roadmap_submitted --unread", "notifications clear"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    if (args[0] === "read") {
      if (!args[1]) {
        io.print("usage: notifications read <id>", "err");
        return;
      }
      try {
        await apiClient.patch(`/notifications/${args[1]}/read`);
        io.print("[OK] marked read", "ok");
      } catch (e) {
        io.print(`notifications read: ${errText(e)}`, "err");
      }
      return;
    }
    if (args[0] === "clear") {
      try {
        const { data } = await apiClient.post<{ marked: number }>("/notifications/read-all");
        io.print(`[OK] marked ${data.marked} read`, "ok");
      } catch (e) {
        io.print(`notifications clear: ${errText(e)}`, "err");
      }
      return;
    }
    let type = "";
    let unreadOnly = false;
    for (const a of args) {
      if (a === "--unread") unreadOnly = true;
      else if (!a.startsWith("-")) type = a;
    }
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (unreadOnly) params.set("unreadOnly", "true");
    const qs = params.toString();
    try {
      const [{ data: list }, { data: count }] = await Promise.all([
        apiClient.get<BellItem[]>(`/notifications${qs ? `?${qs}` : ""}`),
        apiClient.get<{ unread: number }>("/notifications/unread-count"),
      ]);
      io.print(`NOTIFICATIONS · ${count.unread} unread`, "head");
      if (list.length === 0) {
        io.print("nothing here", "dim");
        return;
      }
      for (const n of list) {
        const mark = n.isRead ? " " : "*";
        io.print(` ${mark}${n.id.slice(0, 8)}  [${n.type}] ${bellTitle(n)}`);
      }
      io.print("", "dim");
      io.print("notifications read <id> to mark one · notifications clear to clear", "dim");
    } catch (e) {
      io.print(`notifications: ${errText(e)}`, "err");
    }
  },
};

const theme: CommandSpec = {
  name: "theme",
  usage: "theme [dark|light]",
  summary: "switch the colour scheme",
  group: "session",
  help: {
    usage: "theme [dark|light]",
    description: [
      "Switch the colour scheme. With no argument it toggles to the other one.",
      "The choice is remembered for this browser.",
    ],
    args: [
      { name: "dark", text: "Force the dark scheme" },
      { name: "light", text: "Force the light scheme" },
    ],
    examples: ["theme", "theme dark", "theme light"],
  },
  run: ({ args, io, isDark, setTheme }) => {
    const [want] = args;
    const apply = (mode: "dark" | "light") => {
      setTheme(mode);
      io.print(`[OK] theme → ${mode}`, "ok");
      stuck(io, "", "Applies at once and is kept for this browser.");
    };
    if (!want) {
      apply(isDark ? "light" : "dark");
      return;
    }
    if (want !== "dark" && want !== "light") {
      io.print("theme: expected dark or light", "err");
      return;
    }
    apply(want);
  },
};

// ─── neofetch ───────────────────────────────────────────────────────────────
// The screenshot-on-a-forum command: the mark, `user@host`, and a column of
// facts about what you are running. Ours answers the same question about a
// different kind of machine, so the fields are mapped rather than invented.
//
// Mapped honestly, which is the part worth being strict about. `Uptime` is the
// streak because that is the same fact — how long this has been running
// without going down. `Packages` counts what is installed to learn from.
// `Shell` and `Terminal` name what is actually interpreting the line. The
// fields with no truthful analogue here — Kernel, CPU, GPU, Memory,
// Resolution — are absent rather than filled with a joke, because a fetch
// block that lies about one row is not worth reading for the others.

const SHELL_VERSION = "1.0";

/** The whole block, in order.
 *
 *  `extra` is whatever had to be asked for — the streak, the package count, the
 *  XP, the queue — and it sits directly under `OS`, the way neofetch puts what
 *  the machine is doing right now above what it was set up as. Boot passes
 *  nothing and gets the same block without those rows, because a start-up that
 *  waits on four requests before drawing its first screen is not a boot.
 *
 *  One function rather than two so the order is decided once. A caller can add
 *  rows; it cannot reorder the ones it did not supply. */
function factsFor(user: User | undefined, extra: FetchRow[] = []): FetchRow[] {
  return [
    { label: "OS", value: `source:dev ${SHELL_VERSION}` },
    ...extra,
    { label: "Shell", value: `sd-sh ${SHELL_VERSION}` },
    { label: "Terminal", value: "web console" },
    { label: "Role", value: (user?.role ?? "developer").toUpperCase() },
    { label: "Account", value: user?.email ?? "—" },
    { label: "Timezone", value: user?.timezone || "UTC" },
    { label: "Joined", value: fmtDate(user?.createdAt, user?.timezone) },
  ];
}

/** The identity line. The user half is the role because that is what the
 *  prompt says too — `developer@source-dev` — and two names for the same account
 *  in the same window would be one name too many. */
function reportFor(user: User | undefined, rows: FetchRow[]): FetchReport {
  return {
    user: (user?.role ?? "developer").toLowerCase(),
    host: "source-dev",
    rows,
  };
}

const neofetch: CommandSpec = {
  name: "neofetch",
  usage: "neofetch",
  summary: "print the mark and what this account is running",
  group: "shell",
  aliases: ["fetch", "sysinfo"],
  help: {
    usage: "neofetch",
    description: [
      "Print the product mark beside what this account is running: the shell",
      "version, how long the streak has held, how much is installed to learn",
      "from, the XP, the review queue, and the account's own settings.",
    ],
    examples: ["neofetch", "fetch", "sysinfo"],
  },
  run: async (ctx) => {
    const { io, user, isDark } = ctx;
    io.status?.("probing");

    // Every probe is allowed to come back empty. neofetch prints what it can
    // read and omits what it cannot; it does not fail the whole block because
    // one number was unavailable.
    const [stats, due, roadmaps, lessons] = await Promise.all([
      apiClient
        .get<{ totalXp: number; currentStreak: number }>("/gamification/me")
        .then((r) => r.data)
        .catch(() => undefined),
      apiClient
        .get<{ count?: number; dueCount?: number }>("/review/due-count")
        .then((r) => r.data.dueCount ?? r.data.count ?? 0)
        .catch(() => undefined),
      apiClient
        .get<unknown[]>("/roadmaps")
        .then((r) => r.data.length)
        .catch(() => undefined),
      apiClient
        .get<unknown[]>("/concepts")
        .then((r) => r.data.length)
        .catch(() => undefined),
    ]);

    const count = (n: number, one: string) =>
      `${n} ${n === 1 ? one : `${one}s`}`;

    const live: FetchRow[] = [];
    if (stats)
      live.push({ label: "Uptime", value: count(stats.currentStreak, "day") });
    if (roadmaps !== undefined && lessons !== undefined)
      live.push({
        label: "Packages",
        value: `${count(roadmaps, "roadmap")}, ${count(lessons, "lesson")}`,
      });
    if (stats) live.push({ label: "XP", value: String(stats.totalXp) });
    if (due !== undefined)
      live.push({
        label: "Reviews",
        value: due ? `${count(due, "review")} due` : "none due",
      });
    live.push({ label: "Theme", value: isDark ? "dark" : "light" });

    const report = reportFor(user, factsFor(user, live));

    if (io.fetch) {
      io.fetch(report);
    } else {
      // A host with no room for the block still gets the facts — the same
      // reasoning `less` follows when there is no pager.
      io.print(`${report.user}@${report.host}`, "head");
      for (const fact of report.rows) io.print(row(fact.label, fact.value));
    }
    stuck(
      io,
      "",
      "Today in numbers: {status} · pick up learning with {continue}.",
    );
  },
};

const man: CommandSpec = {
  name: "man",
  usage: "man <command>",
  summary: "read a command's manual page",
  group: "shell",
  help: {
    usage: "man <command>",
    description: [
      "Print the manual page for a command: NAME, SYNOPSIS, DESCRIPTION, the",
      "argument and option tables, and examples.",
      "Same content as <command> --help, under the headings a man page uses.",
    ],
    args: [{ name: "<command>", text: "The command to document" }],
    examples: ["man ls", "man quiz", "man qa"],
  },
  run: ({ args, io, commands }) => {
    const [target] = args;
    if (!target) {
      io.print("What manual page do you want?", "err");
      stuck(io, "", "Try {man ls}, or {help} for the list of commands.");
      return;
    }
    const spec = resolve(target, commands);
    if (!spec) {
      io.print(`No manual entry for ${target}`, "err");
      stuck(io, "", "Run {help} to see every command that has one.");
      return;
    }
    printMan(io, spec);
    stuck(
      io,
      "",
      `Type {${spec.name}} to run it · {${spec.name} --help} prints the short version.`,
    );
  },
};

const clear: CommandSpec = {
  name: "clear",
  usage: "clear",
  summary: "empty the screen buffer",
  group: "shell",
  aliases: ["cls"],
  help: {
    usage: "clear",
    description: [
      "Empty the scrollback. What ↑ remembers is untouched, the same way a",
      "real shell behaves — clear hides the output, not the history.",
      "The lesson on screen is forgotten with it, so a bare quiz afterwards",
      "asks which lesson instead of answering for one you cannot see.",
    ],
    examples: ["clear", "cls"],
  },
  run: ({ io }) => {
    // The screen is the context: with the lesson that set it scrolled away,
    // a bare `quiz` would aim somewhere the reader cannot see. History is
    // untouched — clear hides the output, not what ↑ remembers.
    clearCurrentConcept();
    io.clear();
  },
};

const exit: CommandSpec = {
  name: "exit",
  usage: "exit",
  summary: "return to the dashboard",
  group: "shell",
  aliases: ["quit", "q"],
  help: {
    usage: "exit",
    description: [
      "Leave the shell and return to the dashboard. The session stays open.",
      "logout is the other one: it ends the session.",
    ],
    examples: ["exit", "quit", "q"],
  },
  run: ({ io }) => io.close(),
};

// ─── Registry ───────────────────────────────────────────────────────────────

/** Tag a command file's exports for one shell without touching the specs. */
const forRole = (
  role: "developer" | "admin",
  specs: CommandSpec[],
): CommandSpec[] => specs.map((s) => ({ ...s, role }));

/** Display order for `help` and the hint strip. */
export const COMMAND_LIST: CommandSpec[] = [
  help,
  man,
  // Navigation comes first because it is how everything else is reached: you
  // locate a lesson with `ls` and `cd` before you `read` or `quiz` it.
  ...forRole("developer", FS_COMMANDS),
  ...forRole("developer", LEARNING_COMMANDS),
  whoami,
  profile,
  timezone,
  passwd,
  deletionStatus,
  deleteAccount,
  theme,
  neofetch,
  clear,
  exit,
  logoutCmd,
  notifications,
];

/**
 * The command set for a shell. Developers get exactly COMMAND_LIST (the
 * developer surface, unchanged); admins get the shared shell/profile/session
 * entries plus the admin set. Unknown roles fall back to the shared entries.
 */
export function commandsFor(
  role: "developer" | "admin" | undefined,
  adminCommands: CommandSpec[] = [],
): CommandSpec[] {
  if (role === "admin") {
    const shared = COMMAND_LIST.filter((s) => s.role !== "developer");
    return [...shared, ...adminCommands];
  }
  return COMMAND_LIST;
}

export const COMMANDS: Record<string, CommandSpec> = (() => {
  const map: Record<string, CommandSpec> = {};
  for (const spec of COMMAND_LIST) {
    map[spec.name] = spec;
    for (const alias of spec.aliases ?? []) map[alias] = spec;
  }
  return map;
})();

function resolve(name: string, list: CommandSpec[] = COMMAND_LIST): CommandSpec | undefined {
  if (list === COMMAND_LIST) return COMMANDS[name.toLowerCase()];
  const lower = name.toLowerCase();
  return list.find(
    (s) => s.name.toLowerCase() === lower || (s.aliases ?? []).some((a) => a.toLowerCase() === lower),
  );
}

// The boot mark used to live here as a `LOGO` constant — six lines of slant
// ASCII. It now comes from the active theme, because the letterform, its width,
// and the fact that it has to survive a narrow viewport without the letters
// coming apart are all rendering decisions. This layer still decides *that* a
// mark is printed, and when — it does so by asking for a fetch report, which
// is the block the mark belongs to.

type BootLine = {
  text: string;
  kind: LineKind;
  actions?: TerminalAction[];
  /** Set when this line is a `neofetch` block rather than text. `text` stays
   *  filled in as the plain reading of it, for a host that cannot draw one. */
  report?: FetchReport;
};

/** One start-up step: a command the shell types out at its own prompt, then
 *  what that command printed. The host animates this, so the first thing on
 *  screen is a prompt doing something — not a page of text that was already
 *  sitting there when you arrived. */
export interface BootStep {
  command: string;
  lines: BootLine[];
}

/** The `neofetch` block boot prints: the facts that cost no request. */
function bootFetch(user?: User): BootLine {
  const report = reportFor(user, factsFor(user));
  return { text: fetchText(report), kind: "out", report };
}

/** The start-up script: print the mark, then say what to type. Exported so any
 *  host boots with identical output. */
export function bootSequence(user?: User): BootStep[] {
  return [
    {
      command: "neofetch",
      lines: [
        bootFetch(user),
        { text: "", kind: "out" },
        // The one line every shell opens with. It is the last thing printed
        // before the prompt arrives, because it is the answer to the question
        // an empty prompt asks.
        {
          text: "Type 'help' to see list of available commands.",
          kind: "out",
        },
        {
          text: "TAB completes · ↑↓ recalls · ^C stops · ^L clears",
          kind: "dim",
        },
        {
          text: "^Y searches history · ^S stashes the line · ? lists every key",
          kind: "dim",
        },
      ],
    },
  ];
}

/** The same output with nothing left to animate — what a skipped boot, or one
 *  under `prefers-reduced-motion`, prints in a single pass. */
export function bootLines(user?: User): BootLine[] {
  return bootSequence(user).flatMap<BootLine>((step) => [
    { text: step.command, kind: "cmd" },
    ...step.lines,
  ]);
}

/** Every multi-word form worth completing or suggesting, longest branch last.
 *  One table drives both tab-completion and the hint strip, so a subcommand
 *  added to a command only has to be listed here once to become discoverable.
 *  A trailing space means "an argument follows". */
const PHRASES = [
  "profile set name ",
  "profile set tz ",
  "profile avatar set",
  "profile avatar clear",
  "qa ask ",
  "qa open ",
  "qa edit ",
  "qa delete ",
  "qa concept ",
  "qa mine",
  "qa unanswered",
  "qa answered",
  "review start",
  "theme dark",
  "theme light",
];

/** The words of a phrase, without the argument-follows marker. */
const wordsOf = (phrase: string) => phrase.trim().split(" ");

/** Phrases the typed line is still a prefix of, comparing word by word so
 *  `qa op` narrows to `qa open` but `qa open 3f2` — already into the
 *  argument — matches nothing. */
function matchingPhrases(input: string): string[] {
  const trailingSpace = /\s$/.test(input);
  const parts = tokenise(input);
  if (!parts.length) return [];
  return PHRASES.filter((phrase) => {
    const words = wordsOf(phrase);
    if (parts.length > words.length) return false;
    if (parts.length === words.length && trailingSpace) return false;
    return parts.every((part, index) =>
      index === parts.length - 1 && !trailingSpace
        ? words[index].startsWith(part)
        : words[index] === part,
    );
  });
}

/** Tab-completion. Returns the completed line, or null if there is nothing
 *  unambiguous to add. */
export function completeCommand(input: string, list: CommandSpec[] = COMMAND_LIST): string | null {
  const trailingSpace = /\s$/.test(input);
  const parts = tokenise(input);

  if (parts.length === 0) return null;

  // Completing the command name itself.
  if (parts.length === 1 && !trailingSpace) {
    const matches = list.filter((s) => s.name.startsWith(parts[0]));
    if (matches.length === 1) return `${matches[0].name} `;
    return null;
  }

  // Second level and beyond, from the phrase table. Only the word being
  // typed is filled in, so `qa o` stops at `qa open ` rather than inventing
  // the argument that follows, and `profile s` still resolves to `profile
  // set ` even though two phrases share that branch.
  const matches = matchingPhrases(input);
  if (!matches.length) return null;
  const index = trailingSpace ? parts.length : parts.length - 1;
  const candidates = new Set(matches.map((phrase) => wordsOf(phrase)[index]));
  if (candidates.size !== 1) return null;
  const [word] = candidates;
  // A space follows unless every match ends here and takes no argument.
  const ends = matches.every((phrase) => {
    const words = wordsOf(phrase);
    return words.length === index + 1 && !/\s$/.test(phrase);
  });
  return `${[...parts.slice(0, index), word].join(" ")}${ends ? "" : " "}`;
}

// ─── Value completion ───────────────────────────────────────────────────────
// The data no static table can know: lessons and roadmaps from the catalogue,
// timezones from the runtime, command names for `help` and `man`. Each source
// answers only the verbs it belongs to, and every one fails soft —
// completion is a convenience, and the command the reader goes on to run is
// what reports a real problem.

/** A value with a space has to come back quoted, so it survives `tokenise`
 *  as one argument the lookup can match whole. */
function quoteValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

interface CatalogueEntry {
  id: string;
  title: string;
  slug?: string;
}

async function catalogue(path: string): Promise<CatalogueEntry[]> {
  try {
    const { data } = await apiClient.get<CatalogueEntry[]>(path);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Lessons for `qa ask` / `qa concept`, matched the way `findConceptId`
 *  reads them — slug or title, prefix first, then substring — so whatever TAB
 *  fills in is something the command will accept. Slugs win over titles:
 *  they never need quoting. */
async function completeLessons(head: string, typed: string): Promise<string[]> {
  const concepts = await catalogue("/concepts");
  const needle = typed.toLowerCase();
  const nameOf = (c: CatalogueEntry) => c.slug || c.title;
  const starts = concepts.filter(
    (c) =>
      nameOf(c).toLowerCase().startsWith(needle) ||
      c.title.toLowerCase().startsWith(needle),
  );
  const hits = (
    starts.length
      ? starts
      : concepts.filter(
          (c) =>
            nameOf(c).toLowerCase().includes(needle) ||
            c.title.toLowerCase().includes(needle),
        )
  ).slice(0, 12);
  return hits.map((c) => `${head} ${quoteValue(nameOf(c))}`);
}

/** Roadmaps for `continue`, completed to the slug — the same name `ls`
 *  prints and `cd` accepts. */
async function completeRoadmaps(
  verb: string,
  typed: string,
): Promise<string[]> {
  const roadmaps = await catalogue("/roadmaps");
  const needle = typed.toLowerCase();
  const starts = roadmaps.filter((r) =>
    (r.slug || r.title).toLowerCase().startsWith(needle),
  );
  const hits = (
    starts.length
      ? starts
      : roadmaps.filter((r) =>
          (r.slug || r.title).toLowerCase().includes(needle),
        )
  ).slice(0, 12);
  return hits.map((r) => `${verb} ${quoteValue(r.slug || r.title)}`);
}

/** IANA zones for `timezone` and `profile set tz`, straight from the
 *  runtime — the same list the command validates against, so a completion
 *  can never propose a zone the command would refuse. */
function completeZones(head: string, typed: string): string[] {
  let zones: string[];
  try {
    const supported = (
      Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf;
    zones = typeof supported === "function" ? supported("timeZone") : [];
  } catch {
    return [];
  }
  const needle = typed.toLowerCase();
  return zones
    .filter((zone) => zone.toLowerCase().startsWith(needle))
    .slice(0, 24)
    .map((zone) => `${head} ${zone}`);
}

/** Command names for `help` and `man`, aliases included — completing to the
 *  canonical name, so `help f⇥` becomes `help neofetch`. One argument only:
 *  past it there is nothing left to complete. */
function completeCommandName(verb: string, typed: string, list: CommandSpec[] = COMMAND_LIST): string[] {
  const needle = typed.toLowerCase();
  const hits = list.filter(
    (s) =>
      !s.hidden &&
      (s.name.toLowerCase().startsWith(needle) ||
        (s.aliases ?? []).some((a) => a.toLowerCase().startsWith(needle))),
  ).slice(0, 12);
  return hits.map((s) => `${verb} ${s.name}`);
}

/** Static subcommand keywords (`roadmap submit`, `module new`) — the same
 *  starts-then-contains shape as the catalogue completers. Exported for the
 *  `ls --label` branch below, which completes option values the same way. */
export function matchWords(head: string, words: string[], typed: string): string[] {
  const needle = typed.toLowerCase();
  const starts = words.filter((w) => w.toLowerCase().startsWith(needle));
  const hits = (
    starts.length
      ? starts
      : words.filter((w) => w.toLowerCase().includes(needle))
  ).slice(0, 12);
  return hits.map((w) => `${head} ${w}`);
}

/** Value completion for the argument being typed. The head is everything up
 *  to that argument, so a multi-word fragment completes whole — `qa ask sip
 *  ba⇥` becomes `qa ask "SIP Basics"`, not `qa ask sip sip-basics`. */
export async function completeValues(input: string, list: CommandSpec[] = COMMAND_LIST): Promise<string[]> {
  const trailingSpace = /\s$/.test(input);
  const parts = tokenise(input);
  if (parts.length < 1) return [];
  const verb = parts[0].toLowerCase();
  const operands = parts.slice(1, trailingSpace ? undefined : -1);
  const fragment = trailingSpace ? "" : (parts[parts.length - 1] ?? "");
  if (fragment.startsWith("-")) return [];

  // `qa`'s first operand is a subcommand; a lesson follows only `ask` and
  // `concept`, and it names a lesson from anywhere — not a path from here.
  // Every word past the subcommand counts, so a half-typed title completes
  // whole rather than word by word.
  if (verb === "qa") {
    const after = parts.slice(1, trailingSpace ? undefined : -1);
    const [sub, ...words] = after;
    const spec = resolve("qa", list);
    if (!sub || !spec?.completesAfter?.includes(sub.toLowerCase())) return [];
    const typed = [...words, ...(trailingSpace ? [] : [fragment])].join(" ");
    return completeLessons(parts.slice(0, 2).join(" "), typed);
  }

  if (verb === "help" || verb === "man" || verb === "?") {
    if (operands.length !== 0) return [];
    return completeCommandName(parts[0], fragment, list);
  }

  if (verb === "continue" || verb === "resume") {
    if (operands.length !== 0) return [];
    return completeRoadmaps(parts[0], fragment);
  }

  if (verb === "roadmap") {
    const [sub, ...words] = operands;
    if (!sub) {
      return matchWords(parts[0], ["new", "edit", "submit", "status"], fragment);
    }
    if (
      ["submit", "status", "edit"].includes(sub.toLowerCase()) &&
      words.length === 0
    ) {
      return completeRoadmaps([parts[0], sub].join(" "), fragment);
    }
    return [];
  }

  if (verb === "module") {
    const [sub] = operands;
    if (!sub) return matchWords(parts[0], ["new"], fragment);
    return [];
  }

  if (verb === "concept") {
    const [sub] = operands;
    if (!sub) return matchWords(parts[0], ["new"], fragment);
    return [];
  }

  if (verb === "ls") {
    const LABELS = ["ai", "handwritten", "partial"];
    const prev = operands[operands.length - 1];
    // `ls --label <TAB>`: complete the value.
    if (prev === "--label") {
      return matchWords([parts[0], ...operands].join(" "), LABELS, fragment);
    }
    // `ls --lab<TAB>`: complete the flag itself.
    if (operands.length === 0 && fragment.startsWith("--")) {
      return matchWords(parts[0], ["--label"], fragment);
    }
    return [];
  }

  if (verb === "attach" || verb === "detach") {
    if (operands.length !== 0) return [];
    return completeLessons(parts[0], fragment);
  }

  if (verb === "articles") {
    return [];
  }

  if (verb === "article") {
    const [sub] = operands;
    if (!sub) return matchWords(parts[0], ["read", "new"], fragment);
    return [];
  }

  if (verb === "timezone" || verb === "tz") {
    if (operands.length !== 0) return [];
    return completeZones(parts[0], fragment);
  }

  if (
    verb === "profile" &&
    operands.length === 2 &&
    operands[0].toLowerCase() === "set" &&
    operands[1].toLowerCase() === "tz"
  ) {
    return completeZones(parts.slice(0, 3).join(" "), fragment);
  }

  // Admin-shell verbs (subcommand keywords, then live ids). Null means the
  // verb is not an admin verb and completion stays empty.
  const adminHits = await completeAdminValues(
    verb,
    operands,
    fragment,
    [parts[0], ...operands].join(" "),
  );
  if (adminHits) return adminHits;

  return [];
}

// ─── Path completion ────────────────────────────────────────────────────────
// The other half of the data: not what has been listed on screen, but what is
// actually addressable from where the user is standing. `cat voip⇥` at the root
// completes against the roadmaps; the same keystroke inside a module completes
// against that module's lessons. It is the same rule a shell follows, and it
// reads the same listing `ls` does, through the same cache — so the first TAB
// in a directory costs one request and every TAB after it costs nothing.

/** Where in a command's operands a path may appear. */
export type PathArity = "path";
/** The operand being typed, and which operand it is.
 *
 * Options are skipped rather than counted. */
function operandUnderCursor(
  parts: string[],
  trailingSpace: boolean,
): { fragment: string; position: number } | null {
  const fragment = trailingSpace ? "" : (parts[parts.length - 1] ?? "");
  // A half-typed option is an option, not a path.
  if (fragment.startsWith("-")) return null;
  const before = parts.slice(1, trailingSpace ? undefined : -1);
  return { fragment, position: before.filter((p) => !p.startsWith("-")).length };
}

/** Whether a verb wants children of this kind completed. `cd` descends, so
 *  lessons are never candidates — offering one only walks the reader into a
 *  `Not a directory` refusal. `cat` and friends print lessons, so a bare
 *  name where directories live would end in `Is a directory`; mid-path
 *  segments still complete directories for every verb, because
 *  `cat voip-basics/intro⇥` has to pass through one to get anywhere. */
export function completableKind(
  verb: string,
  child: Exclude<ChildKind, null>,
  final: boolean,
): boolean {
  if (verb === "cd") return child !== "concept";
  if (verb === "cat" || verb === "less" || verb === "quiz" || verb === "complete")
    return !final || child === "concept";
  return true;
}

/** Complete the operand being typed against what is really there.
 *
 *  Prefix first, the way a shell matches, then a substring pass — because the
 *  names here are generated from lesson titles and can run to fifty characters,
 *  and the part a reader remembers is rarely the start of one. */
export async function completePath(
  input: string,
  cwd: Location,
): Promise<string[]> {
  const trailingSpace = /\s$/.test(input);
  const parts = tokenise(input);
  if (!parts.length) return [];
  const spec = resolve(parts[0]);
  if (!spec?.completes) return [];
  // Nothing to complete for a command that is still being named.
  if (parts.length === 1 && !trailingSpace) return [];

  const operand = operandUnderCursor(parts, trailingSpace);
  if (!operand) return [];
  // A command whose first operands are verbs (`qa`'s subcommands) never
  // completes the tree here: its places come from the catalogue, one function
  // down, where a lesson can be named from anywhere rather than only from
  // where the reader is standing.
  if (spec.completesAfter) return [];

  // Split what has been typed into the directory it names and the prefix still
  // being written — `voip-basics/intro` looks in `voip-basics` for `intro`.
  const cut = operand.fragment.lastIndexOf("/");
  const dir = cut === -1 ? "" : operand.fragment.slice(0, cut + 1);
  const prefix = cut === -1 ? operand.fragment : operand.fragment.slice(cut + 1);

  const base = dir ? resolvePath(cwd, dir) : cwd;
  if (!base) return [];
  const kind = childKindOf(base);
  if (!kind) return [];
  // Never offer what the verb cannot take: lessons to `cd`, directories to
  // `cat` at the final position. See `completableKind`.
  if (!completableKind(spec.name, kind, cut === -1)) return [];

  let entries: VfsEntry[];
  try {
    entries = await listChildren(base);
  } catch {
    // Completion is a convenience; it never reports an error of its own. The
    // command the reader goes on to run will say what went wrong.
    return [];
  }

  const needle = prefix.toLowerCase();
  const starts = entries.filter((e) => e.name.toLowerCase().startsWith(needle));
  const hits = starts.length
    ? starts
    : entries.filter((e) => e.name.toLowerCase().includes(needle));
  if (!hits.length) return [];

  // A directory ends in `/` so the next TAB descends into it; a lesson ends in
  // a space, because there is nothing below it to type.
  const tail = kind === "concept" ? " " : "/";
  const head = trailingSpace ? parts : parts.slice(0, -1);
  return hits
    .slice(0, 24)
    .map((entry) => [...head, `${dir}${entry.name}`].join(" ") + tail);
}

/** Everything TAB can offer for the argument being typed: what is addressable
 *  from here first, then the catalogue values behind the verb — lessons for
 *  `qa ask`, roadmaps for `continue`, zones for `timezone`, names for `help`
 *  and `man`. */
export async function completeArgument(
  input: string,
  cwd: Location,
  list: CommandSpec[] = COMMAND_LIST,
): Promise<string[]> {
  // Option values complete from their own tables, never the tree: `ls --label`
  // wants ai/handwritten/partial, not a path that happens to start with "a".
  // Covers both `--label <TAB>` (value missing) and `--label a<TAB>`.
  const tokens = input.trim().split(/\s+/);
  const last = tokens[tokens.length - 1];
  const prev = tokens[tokens.length - 2];
  if (
    tokens[0]?.toLowerCase() === "ls" &&
    (last === "--label" || prev === "--label")
  ) {
    return completeValues(input, list);
  }
  const paths = await completePath(input, cwd);
  if (paths.length) return paths;
  return completeValues(input, list);
}

/** Second-level suggestions for the hint strip, so `profile set tz` and
 *  `qa unanswered` are discoverable without reading `help` first. Empty once
 *  the user is past the subcommand and into its argument — at that point the
 *  usage line is the more useful thing to show. */
export function subHints(input: string): string[] {
  const parts = tokenise(input);
  // The top level is already covered by `matchCommands`.
  if (parts.length < 2 && !/\s$/.test(input)) return [];
  return matchingPhrases(input)
    .map((phrase) => phrase.trim())
    .slice(0, 8);
}

/** Commands whose names start with the word being typed — drives the hint
 *  strip so the user never has to clear the line to remember a command. */
export function matchCommands(input: string, list: CommandSpec[] = COMMAND_LIST): CommandSpec[] {
  const visible = list.filter((s) => !s.hidden);
  const first = tokenise(input)[0] ?? "";
  if (!first) return visible;

  // Once the name is complete and a space typed, narrow to that one command
  // so the strip turns into a usage reminder for what is being written.
  const exact = resolve(first, list);
  if (exact && /\s/.test(input)) return [exact];

  return visible.filter((s) => s.name.startsWith(first.toLowerCase()));
}

/** Execute one line. Unknown commands get a nearest-match hint. */
export async function runCommand(
  input: string,
  base: Omit<CommandCtx, "args" | "raw">,
  list: CommandSpec[] = COMMAND_LIST,
): Promise<void> {
  const raw = input.trim();
  if (!raw) return;

  // Recorded as typed, before anything is resolved — a mistyped command is
  // still something the user did, and being able to recall and fix it is half
  // of what a history is for. This is the only choke point every command
  // passes through, which is why it belongs here and not in any command.
  recordHistory(raw);

  const parts = tokenise(raw);
  const name = parts[0].toLowerCase();
  // A bare number is the section you just saw numbered under a lesson header.
  // `jump` says something useful when no lesson is open, so this never becomes
  // a dead end. Nothing numeric is a command, so the rewrite costs nothing.
  const bare = /^\d+$/.test(name) && !!resolve("jump", list);
  const spec = resolve(bare ? "jump" : name, list);

  if (!spec) {
    base.io.print(`${name}: command not found`, "err");
    const near = list.find(
      (s) => s.name.startsWith(name[0]) || s.name.includes(name),
    );
    stuck(
      base.io,
      "",
      near
        ? `Did you mean {${near.name}}? {help} lists everything, or pick up where you left off with {continue}.`
        : "Try {help} for the full list, {ls} to browse your paths, or {continue} to resume a lesson.",
    );
    return;
  }

  try {
    const args = bare ? [name] : parts.slice(1);
    // Documentation before work, for every command without exception. One
    // interception rather than a branch inside each `run`, so a command cannot
    // be added that forgets to answer `--help`.
    if (!bare && wantsHelp(args)) {
      printHelp(base.io, spec.name, spec.help);
      return;
    }
    await spec.run({ ...base, args, raw, commands: list });
  } catch (e) {
    // An aborted request is the user pressing ^C, not a failure: the command
    // stopped because they asked it to.
    if (e instanceof CommandAborted || isAbortError(e)) {
      base.io.print("^C", "dim");
      return;
    }
    base.io.print(`${spec.name}: ${errText(e)}`, "err");
    stuck(
      base.io,
      "",
      `That did not go through. Run {${spec.name}} again, check {status}, or see {help} for the usage.`,
    );
  }
}
