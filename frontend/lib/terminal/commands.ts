/* ==========================================================================
   KIP Terminal — shared command registry
   --------------------------------------------------------------------------
   One source of truth for the interactive shell. The dashboard footer prompt
   and the full-screen CLI tab both dispatch through `runCommand`, so a command
   added here is immediately available in both places.

   Commands never touch React state directly: everything they need is handed
   to them on the `CommandCtx` (io, user, logout, theme). That keeps this file
   testable and free of component imports.
   ========================================================================== */

import apiClient from "@/lib/api-client";
import { User } from "@/lib/auth";
import {
  AVATAR_ACCEPT,
  dataUrlSizeKb,
  resizeImageToDataUrl,
} from "@/lib/image";
import { detectTimezone, formatDate } from "@/lib/timezone";

// ─── Output model ───────────────────────────────────────────────────────────
// `kind` maps to a colour in the host component, which owns the palette.
// `err` is the only kind that renders red — same rule as login.

export type LineKind = "cmd" | "out" | "ok" | "err" | "dim" | "head";

export interface TerminalLine {
  id: number;
  kind: LineKind;
  text: string;
}

/** Raised when the user aborts an `ask` with Esc. The dispatcher catches it
 *  centrally so no individual command has to check for it. */
export class CommandAborted extends Error {
  constructor() {
    super("aborted");
    this.name = "CommandAborted";
  }
}

/** The shell surface a command is allowed to drive. */
export interface TerminalIO {
  /** Append one line to the buffer. */
  print: (text: string, kind?: LineKind) => void;
  /** Wipe the buffer. */
  clear: () => void;
  /** Park the prompt and wait for one line of input. `mask` hides it. */
  ask: (prompt: string, opts?: { mask?: boolean }) => Promise<string>;
  /** Open the OS file picker. Resolves null if the user cancels. The host
   *  owns the input element, so this module stays free of DOM work. */
  pickFile: (accept: string) => Promise<File | null>;
  /** Collapse the shell back down to the one-line prompt. */
  close: () => void;
}

export interface CommandCtx {
  /** Argv after the command name, already tokenised. */
  args: string[];
  /** The full line as typed, for commands that want it verbatim. */
  raw: string;
  io: TerminalIO;
  user?: User;
  /** Re-fetch the cached user so the navbar reflects an edit immediately. */
  refreshUser: () => Promise<void>;
  isDark: boolean;
  setTheme: (theme: "light" | "dark") => void;
  logout: () => void;
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
  run: (ctx: CommandCtx) => void | Promise<void>;
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
  aliases: ["?", "--help"],
  run: ({ args, io }) => {
    const [target] = args;
    if (target) {
      const spec = resolve(target);
      if (!spec) {
        io.print(`help: no such command: ${target}`, "err");
        return;
      }
      io.print(spec.usage, "head");
      io.print(`  ${spec.summary}`, "dim");
      return;
    }

    io.print("AVAILABLE COMMANDS", "head");
    const groups = [...new Set(COMMAND_LIST.map((s) => s.group))];
    for (const group of groups) {
      io.print(`  ${group}/`, "dim");
      for (const spec of COMMAND_LIST.filter((s) => s.group === group)) {
        io.print(`    ${spec.usage.padEnd(28)} ${spec.summary}`);
      }
    }
    io.print("");
    io.print(
      "  [TAB] complete · [↑/↓] history · [ESC] cancel · exit to collapse",
      "dim",
    );
  },
};

const whoami: CommandSpec = {
  name: "whoami",
  usage: "whoami",
  summary: "print the signed-in identity",
  group: "profile",
  run: ({ io, user }) => {
    if (!user) {
      io.print("whoami: session not loaded yet", "err");
      return;
    }
    io.print(`${user.name} <${user.email}> [${user.role.toUpperCase()}]`);
  },
};

const profile: CommandSpec = {
  name: "profile",
  usage: "profile [set name|set tz|avatar set|avatar clear]",
  summary: "show or edit your profile",
  group: "profile",
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
    if (data.instructorProfile?.status) {
      io.print(row("instructor", data.instructorProfile.status.toUpperCase()));
    }
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
    } catch (e) {
      io.print(`passwd: ${errText(e)}`, "err");
    }
  },
};

const applyInstructor: CommandSpec = {
  name: "apply-instructor",
  usage: "apply-instructor",
  summary: "submit an instructor application",
  group: "profile",
  run: async ({ io, user, refreshUser }) => {
    if (user && (user.role === "instructor" || user.role === "admin")) {
      io.print(`apply-instructor: you are already ${user.role}`, "err");
      return;
    }
    io.print("Describe your background and teaching experience.", "dim");
    io.print("Leave blank to apply without a bio.", "dim");
    const bio = (await io.ask("bio")).trim();
    try {
      await apiClient.post("/users/apply-instructor", bio ? { bio } : {});
      await refreshUser();
      io.print("[OK] application submitted — status PENDING", "ok");
      io.print("  an admin reviews it; check with instructor-status", "dim");
    } catch (e) {
      io.print(`apply-instructor: ${errText(e)}`, "err");
    }
  },
};

const instructorStatus: CommandSpec = {
  name: "instructor-status",
  usage: "instructor-status",
  summary: "check your instructor application",
  group: "profile",
  run: async ({ io }) => {
    try {
      const { data } = await apiClient.get<User>("/users/me");
      const p = data.instructorProfile;
      if (!p || !p.status) {
        io.print("no instructor application on file", "dim");
        io.print("  apply-instructor   start one", "dim");
        return;
      }
      io.print("INSTRUCTOR APPLICATION", "head");
      io.print(row("status", p.status.toUpperCase()));
      io.print(row("submitted", fmtDate(p.createdAt, data.timezone)));
      io.print(row("approved", fmtDate(p.approvedAt, data.timezone)));
      if (p.bio) io.print(row("bio", p.bio));
    } catch (e) {
      io.print(`instructor-status: ${errText(e)}`, "err");
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
  run: async ({ io, logout }) => {
    if (!(await confirm(io, "end session?"))) {
      io.print("logout: cancelled", "dim");
      return;
    }
    io.print("clearing credentials ...", "dim");
    logout();
  },
};

const theme: CommandSpec = {
  name: "theme",
  usage: "theme [dark|light]",
  summary: "switch the colour scheme",
  group: "session",
  run: ({ args, io, isDark, setTheme }) => {
    const [want] = args;
    if (!want) {
      setTheme(isDark ? "light" : "dark");
      io.print(`[OK] theme → ${isDark ? "light" : "dark"}`, "ok");
      return;
    }
    if (want !== "dark" && want !== "light") {
      io.print("theme: expected dark or light", "err");
      return;
    }
    setTheme(want);
    io.print(`[OK] theme → ${want}`, "ok");
  },
};

const clear: CommandSpec = {
  name: "clear",
  usage: "clear",
  summary: "empty the screen buffer",
  group: "shell",
  aliases: ["cls"],
  run: ({ io }) => io.clear(),
};

const exit: CommandSpec = {
  name: "exit",
  usage: "exit",
  summary: "collapse the terminal",
  group: "shell",
  aliases: ["quit", "q"],
  run: ({ io }) => io.close(),
};

// ─── Registry ───────────────────────────────────────────────────────────────

/** Display order for `help` and the hint strip. */
export const COMMAND_LIST: CommandSpec[] = [
  help,
  whoami,
  profile,
  timezone,
  passwd,
  applyInstructor,
  instructorStatus,
  deletionStatus,
  deleteAccount,
  theme,
  clear,
  exit,
  logoutCmd,
];

export const COMMANDS: Record<string, CommandSpec> = (() => {
  const map: Record<string, CommandSpec> = {};
  for (const spec of COMMAND_LIST) {
    map[spec.name] = spec;
    for (const alias of spec.aliases ?? []) map[alias] = spec;
  }
  return map;
})();

function resolve(name: string): CommandSpec | undefined {
  return COMMANDS[name.toLowerCase()];
}

/** Opening banner. Exported so the CLI tab can boot with the same text. */
export function bootLines(user?: User): Array<{ text: string; kind: LineKind }> {
  return [
    { text: "KIP profile shell — session 0x01", kind: "head" },
    {
      text: `authenticated as ${user?.name ?? "..."} <${user?.email ?? "..."}>`,
      kind: "dim",
    },
    { text: "", kind: "out" },
    { text: "  profile                 show your record", kind: "out" },
    { text: "  profile set name <name> rename the account", kind: "out" },
    { text: "  profile avatar set      upload a picture", kind: "out" },
    { text: "  timezone auto           adopt the browser zone", kind: "out" },
    { text: "  passwd                  change password", kind: "out" },
    { text: "  apply-instructor        apply to teach", kind: "out" },
    { text: "  logout                  end the session", kind: "out" },
    { text: "", kind: "out" },
    { text: "type help for everything · exit to collapse", kind: "dim" },
  ];
}

/** Tab-completion. Returns the completed line, or null if there is nothing
 *  unambiguous to add. Handles `profile set <field>` as a second level. */
export function completeCommand(input: string): string | null {
  const trailingSpace = /\s$/.test(input);
  const parts = tokenise(input);

  if (parts.length === 0) return null;

  // Completing the command name itself.
  if (parts.length === 1 && !trailingSpace) {
    const matches = COMMAND_LIST.filter((s) => s.name.startsWith(parts[0]));
    if (matches.length === 1) return `${matches[0].name} `;
    return null;
  }

  // Second level: only `profile` has subcommands worth completing.
  if (parts[0] === "profile") {
    const subs = ["set", "avatar"];
    if (parts.length === 2 && !trailingSpace) {
      const m = subs.filter((s) => s.startsWith(parts[1]));
      if (m.length === 1) return `profile ${m[0]} `;
      return null;
    }
    if (parts[1] === "set" && parts.length === 3 && !trailingSpace) {
      const m = ["name", "tz"].filter((f) => f.startsWith(parts[2]));
      if (m.length === 1) return `profile set ${m[0]} `;
      return null;
    }
    if (parts[1] === "avatar" && parts.length === 3 && !trailingSpace) {
      const m = ["set", "clear"].filter((f) => f.startsWith(parts[2]));
      if (m.length === 1) return `profile avatar ${m[0]}`;
      return null;
    }
  }

  return null;
}

/** Second-level suggestions for the hint strip, so `profile set tz` and
 *  `profile avatar set` are discoverable without reading `help` first.
 *  Empty once the user is past the subcommand and into its argument — at
 *  that point the usage line is the more useful thing to show. */
export function subHints(input: string): string[] {
  const parts = tokenise(input);
  if (parts[0] !== "profile") return [];
  const trailingSpace = /\s$/.test(input);

  // `profile ` — offer every leaf.
  if (parts.length === 1) {
    if (!trailingSpace) return [];
    return ["profile set name", "profile set tz", "profile avatar set"];
  }

  // `profile set` / `profile se` — narrow to that branch.
  if (parts.length === 2) {
    if (parts[1] === "set" || "set".startsWith(parts[1]))
      return ["profile set name", "profile set tz"];
    if (parts[1] === "avatar" || "avatar".startsWith(parts[1]))
      return ["profile avatar set", "profile avatar clear"];
    return [];
  }

  // `profile set name` with nothing after it yet.
  if (parts.length === 3 && !trailingSpace) {
    if (parts[1] === "set")
      return ["profile set name", "profile set tz"].filter((s) =>
        s.startsWith(`profile set ${parts[2]}`),
      );
    if (parts[1] === "avatar")
      return ["profile avatar set", "profile avatar clear"].filter((s) =>
        s.startsWith(`profile avatar ${parts[2]}`),
      );
  }

  return [];
}

/** Commands whose names start with the word being typed — drives the hint
 *  strip so the user never has to clear the line to remember a command. */
export function matchCommands(input: string): CommandSpec[] {
  const visible = COMMAND_LIST.filter((s) => !s.hidden);
  const first = tokenise(input)[0] ?? "";
  if (!first) return visible;

  // Once the name is complete and a space typed, narrow to that one command
  // so the strip turns into a usage reminder for what is being written.
  const exact = resolve(first);
  if (exact && /\s/.test(input)) return [exact];

  return visible.filter((s) => s.name.startsWith(first.toLowerCase()));
}

/** Execute one line. Unknown commands get a nearest-match hint. */
export async function runCommand(
  input: string,
  base: Omit<CommandCtx, "args" | "raw">,
): Promise<void> {
  const raw = input.trim();
  if (!raw) return;

  const parts = tokenise(raw);
  const name = parts[0].toLowerCase();
  const spec = resolve(name);

  if (!spec) {
    base.io.print(`${name}: command not found`, "err");
    const near = COMMAND_LIST.find(
      (s) => s.name.startsWith(name[0]) || s.name.includes(name),
    );
    base.io.print(
      near ? `  did you mean ${near.name}? · help lists all` : "  type help",
      "dim",
    );
    return;
  }

  try {
    await spec.run({ ...base, args: parts.slice(1), raw });
  } catch (e) {
    if (e instanceof CommandAborted) {
      base.io.print("^C", "dim");
      return;
    }
    base.io.print(`${spec.name}: ${errText(e)}`, "err");
  }
}
