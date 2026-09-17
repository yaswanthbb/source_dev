/* ==========================================================================
   source:dev — filesystem commands
   --------------------------------------------------------------------------
   pwd, ls, cd, cat, less, find, grep, history.

   These behave like their Unix namesakes rather than merely borrowing the
   names, which is a claim worth being precise about, because the differences
   are where a shell normally feels fake:

     - `ls file` prints the file, it does not error. `cd file` is the one that
       says `Not a directory`.
     - `..` at the root stays at the root. It is not an error.
     - `grep pattern dir` refuses without `-r`, exactly as GNU grep does.
     - Every path argument resolves through one function, so
       `cat /roadmaps/a/b/c` from anywhere and `cd a; cd b; cat c` are the
       same operation — not two code paths that happen to agree today.

   Nothing here draws anything. Status markers come from the active theme's
   glyphs, and the pager's viewport, keys and status line belong to the host.
   What this file owns is *which* text is shown and what the errors say.
   ========================================================================== */

import type { CommandCtx, CommandSpec } from "./commands";
// `stuck` and the history store both live in `output.ts` because it imports
// only types from the command modules, so this file can reach it from either
// side of the registry without a cycle.
import { stuck, readHistory, clearHistory } from "./output";
import {
  basename,
  childKindOf,
  formatPath,
  fromSegments,
  resolvePath,
  segmentsOf as pathSegments,
  type Location,
} from "./location";
import {
  listChildren,
  readConcept,
  resolveLocation,
  vfsErrorText,
  VfsError,
  type VfsEntry,
} from "./resolve-location";
import { activeGlyphs } from "./theme-contract";

// ─── Shared argument handling ───────────────────────────────────────────────

/** Split argv into flags and operands, honouring `--` and bundled short flags
 *  (`-in` is `-i -n`) the way a real utility does. */
function parseArgs(args: string[]): { flags: Set<string>; operands: string[] } {
  const flags = new Set<string>();
  const operands: string[] = [];
  let literal = false;
  for (const arg of args) {
    if (literal || !arg.startsWith("-") || arg === "-") {
      operands.push(arg);
      continue;
    }
    if (arg === "--") {
      literal = true;
      continue;
    }
    if (arg.startsWith("--")) {
      flags.add(arg.slice(2));
      continue;
    }
    for (const letter of arg.slice(1)) flags.add(letter);
  }
  return { flags, operands };
}

/** Reject anything we do not implement, in the shape a utility reports it.
 *  Returns the offending flag, or null when every flag is understood. */
function unknownFlag(flags: Set<string>, allowed: string): string | null {
  for (const flag of flags) {
    if (flag.length === 1 && allowed.includes(flag)) continue;
    return flag;
  }
  return null;
}

function badOption(ctx: CommandCtx, command: string, flag: string, usage: string) {
  const shown = flag.length === 1 ? `-- '${flag}'` : `'--${flag}'`;
  ctx.io.print(`${command}: invalid option ${shown}`, "err");
  ctx.io.print(`usage: ${usage}`, "dim");
}

/** Resolve one path argument against the current directory.
 *
 *  This is the single seam behind absolute paths and step-by-step navigation.
 *  A null from `resolvePath` means the *shape* is impossible — a fourth level,
 *  a bad character — which a shell reports the same way it reports a name that
 *  is merely absent.
 *
 *  No argument means *here*. `ls`, `find` and `grep` with no path all work on
 *  the current directory, while `resolvePath` reads an absent argument as home,
 *  because that is what bare `cd` means. The two senses part company here
 *  rather than in each caller, so `cd` is the one command that asks for home. */
function targetOf(ctx: CommandCtx, arg?: string): Location {
  if (arg === undefined) return ctx.cwd;

  const loc = resolvePath(ctx.cwd, arg);
  if (!loc) {
    const shown = (arg ?? "").trim() || formatPath(ctx.cwd);
    throw new VfsError(shown, "missing");
  }
  return loc;
}

/** Turn a listing entry into the location it names. */
function childOf(parent: Location, entry: VfsEntry): Location {
  return (
    fromSegments([...pathSegments(parent), entry.name]) ?? parent
  );
}

/** The marker `ls` prints for a concept, straight from the theme. Directories
 *  have no completion state of their own, so they get a blank of the same
 *  width and the names still line up. */
function marker(entry: VfsEntry): string {
  const glyphs = activeGlyphs();
  switch (entry.status) {
    case "completed":
      return glyphs.done;
    case "in_progress":
      return glyphs.active;
    case "not_started":
      return glyphs.todo;
    default:
      return " ".repeat(glyphs.todo.length);
  }
}

/** Is this location a directory? Anything that can contain something. */
function isDirectory(loc: Location): boolean {
  return childKindOf(loc) !== null;
}

// ─── Walking, for find and grep ─────────────────────────────────────────────

interface Found {
  loc: Location;
  entry: VfsEntry;
  isDir: boolean;
}

/** Every location under `root`, breadth-first, to `maxDepth` levels below it.
 *
 *  Reports progress through `io.status` because a full walk is several requests
 *  and a silent pause reads as a hang. It is interruptible: every request goes
 *  through `api`, which carries the host's abort signal, so ^C stops the walk
 *  rather than letting it finish into a screen nobody is watching. */
async function walk(
  ctx: CommandCtx,
  root: Location,
  maxDepth: number,
): Promise<Found[]> {
  const out: Found[] = [];
  let frontier: Location[] = [root];
  let depth = 0;

  while (frontier.length && depth < maxDepth) {
    const next: Location[] = [];
    for (const dir of frontier) {
      if (!isDirectory(dir)) continue;
      ctx.io.status?.(`searching ${formatPath(dir)}`);
      // A directory that cannot be read is skipped, not fatal — `find` reports
      // what it could reach rather than abandoning the whole walk.
      const entries = await listChildren(dir).catch(() => [] as VfsEntry[]);
      for (const entry of entries) {
        const loc = childOf(dir, entry);
        const dir_ = isDirectory(loc);
        out.push({ loc, entry, isDir: dir_ });
        if (dir_) next.push(loc);
      }
    }
    frontier = next;
    depth += 1;
  }
  return out;
}

/** `*` and `?` as a shell glob, anchored, case-insensitive — matching how
 *  `find -name` is used in practice on a curriculum full of prose titles. */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

// ─── pwd ────────────────────────────────────────────────────────────────────

const pwd: CommandSpec = {
  name: "pwd",
  usage: "pwd",
  summary: "print the current directory",
  group: "filesystem",
  run: ({ io, cwd }) => {
    io.print(formatPath(cwd));
  },
};

// ─── ls ─────────────────────────────────────────────────────────────────────

const ls: CommandSpec = {
  name: "ls",
  usage: "ls [-l] [path]",
  summary: "list directory contents",
  group: "filesystem",
  run: async (ctx) => {
    const { flags, operands } = parseArgs(ctx.args);
    const bad = unknownFlag(flags, "la1");
    if (bad) return badOption(ctx, "ls", bad, "ls [-l] [path]");
    const long = flags.has("l");

    // Multiple operands are each labelled, as `ls a b` does. One operand — the
    // common case — prints bare, with no header.
    const targets = operands.length ? operands : [undefined];
    let first = true;

    for (const arg of targets) {
      let loc: Location;
      try {
        loc = targetOf(ctx, arg);
      } catch (error) {
        ctx.io.print(vfsErrorText("ls", error), "err");
        continue;
      }

      if (!first) ctx.io.print("");
      if (targets.length > 1) ctx.io.print(`${formatPath(loc)}:`, "head");
      first = false;

      // `ls <file>` prints the file. It is `cd` that refuses a file, not `ls` —
      // getting this backwards is the usual tell that a shell is a costume.
      if (!isDirectory(loc)) {
        try {
          const { entry } = await resolveLocation(loc);
          if (entry) printEntry(ctx, entry, formatPath(loc), long);
        } catch (error) {
          ctx.io.print(vfsErrorText("ls", error), "err");
        }
        continue;
      }

      try {
        const entries = await listChildren(loc);
        if (!entries.length) {
          // An empty directory prints nothing in Unix. Here that would read as
          // a broken command, so say so dimly — and say what to do next.
          stuck(
            ctx.io,
            `${formatPath(loc)} is empty.`,
            "Go up with {cd ..} or start from the top with {cd ~}.",
          );
          continue;
        }
        for (const entry of entries) {
          printEntry(ctx, entry, entry.name, long);
        }
      } catch (error) {
        ctx.io.print(vfsErrorText("ls", error), "err");
      }
    }
  },
};

/** One listing row: marker, name, and — with `-l` — the human title.
 *
 *  Directories carry a trailing slash, which is what tells them apart from
 *  concepts at a glance and is also exactly what a shell does. */
function printEntry(
  ctx: CommandCtx,
  entry: VfsEntry,
  name: string,
  long: boolean,
) {
  const isDir = entry.status === undefined;
  const shown = isDir ? `${name}/` : name;
  const left = `${marker(entry)} ${shown}`;
  if (!long) {
    // The name is runnable, so a listing is navigable by pointer as well as by
    // keyboard — both go through the same command, which is the point.
    ctx.io.print(left, "out", [
      { label: isDir ? "cd" : "read", command: isDir ? `cd ${name}` : `cat ${name}` },
    ]);
    return;
  }
  ctx.io.print(`${left.padEnd(38)} ${entry.title}`, "out");
}

// ─── cd ─────────────────────────────────────────────────────────────────────

const cd: CommandSpec = {
  name: "cd",
  usage: "cd [path]",
  summary: "change the current directory",
  group: "filesystem",
  run: async (ctx) => {
    const { operands } = parseArgs(ctx.args);
    if (operands.length > 1) {
      ctx.io.print("cd: too many arguments", "err");
      return;
    }

    let loc: Location;
    try {
      // Bare `cd` and `cd ~` both go home; `..` clamps at the root. `~` and
      // `..` are `resolvePath`'s rules, not re-decided here — the bare form is
      // spelled as `~` because to every *other* command a missing argument
      // means the current directory, which `targetOf` answers first.
      loc = targetOf(ctx, operands[0] ?? "~");
    } catch (error) {
      ctx.io.print(vfsErrorText("cd", error), "err");
      return;
    }

    // A concept is a file. This is the refusal `ls` does not make.
    if (!isDirectory(loc)) {
      ctx.io.print(`cd: ${formatPath(loc)}: Not a directory`, "err");
      stuck(
        ctx.io,
        "",
        `That is a lesson, not a directory. Read it with {cat ${basename(loc)}} or page it with {less ${basename(loc)}}.`,
      );
      return;
    }

    // Confirm it exists before moving. Without this, `cd nowhere` would appear
    // to succeed and only fail on the next `ls`, which is the kind of lag that
    // makes a shell feel unreliable.
    try {
      await resolveLocation(loc);
    } catch (error) {
      ctx.io.print(vfsErrorText("cd", error), "err");
      return;
    }

    ctx.setCwd(loc);
  },
};

// ─── cat and less ───────────────────────────────────────────────────────────

/** Fetch the text behind a path, refusing directories the way `cat` does. */
async function contentOf(
  ctx: CommandCtx,
  command: string,
  arg?: string,
): Promise<{ title: string; text: string; loc: Location } | null> {
  if (!arg) {
    // Real `cat` with no operand reads stdin. There is no stdin here, and
    // hanging would be a worse imitation than saying so.
    ctx.io.print(`${command}: missing operand`, "err");
    ctx.io.print(`usage: ${command} <lesson>`, "dim");
    return null;
  }

  let loc: Location;
  try {
    loc = targetOf(ctx, arg);
  } catch (error) {
    ctx.io.print(vfsErrorText(command, error), "err");
    return null;
  }

  if (isDirectory(loc)) {
    ctx.io.print(`${command}: ${formatPath(loc)}: Is a directory`, "err");
    stuck(ctx.io, "", `List what is inside it with {ls ${arg}}.`);
    return null;
  }

  try {
    const { conceptId, entry } = await resolveLocation(loc);
    if (!conceptId) throw new VfsError(formatPath(loc), "missing");
    ctx.io.status?.("reading");
    const concept = await readConcept(conceptId);
    return {
      title: concept.title || entry?.title || basename(loc),
      text: concept.content || "",
      loc,
    };
  } catch (error) {
    ctx.io.print(vfsErrorText(command, error), "err");
    return null;
  }
}

const cat: CommandSpec = {
  name: "cat",
  usage: "cat <lesson>",
  summary: "print a lesson in full",
  group: "filesystem",
  run: async (ctx) => {
    const { operands } = parseArgs(ctx.args);
    // `cat a b` concatenates, which is the whole point of the name.
    const targets = operands.length ? operands : [undefined];
    for (const arg of targets) {
      const found = await contentOf(ctx, "cat", arg);
      if (!found) continue;
      if (!found.text) {
        ctx.io.print(`${basename(found.loc)}: no content published yet`, "dim");
        continue;
      }
      if (ctx.io.doc) ctx.io.doc(found.text);
      else ctx.io.print(found.text);
    }
  },
};

const less: CommandSpec = {
  name: "less",
  usage: "less <lesson>",
  summary: "page through a lesson one screen at a time",
  group: "filesystem",
  aliases: ["more"],
  run: async (ctx) => {
    const { operands } = parseArgs(ctx.args);
    const found = await contentOf(ctx, "less", operands[0]);
    if (!found) return;
    if (!found.text) {
      ctx.io.print(`${basename(found.loc)}: no content published yet`, "dim");
      return;
    }

    // A host with a viewport pages properly: it owns the screen height, the
    // keys and the status line, none of which this layer can know. A host
    // without one — the dashboard's single-line prompt — still shows the
    // lesson rather than refusing, which is the better failure.
    if (ctx.io.page) {
      await ctx.io.page(found.text, { title: found.title });
      return;
    }
    if (ctx.io.doc) ctx.io.doc(found.text);
    else ctx.io.print(found.text);
  },
};

// ─── find ───────────────────────────────────────────────────────────────────

const find: CommandSpec = {
  name: "find",
  usage: "find [path] [-name pattern] [-type f|d]",
  summary: "search the tree by name",
  group: "filesystem",
  run: async (ctx) => {
    // `find` takes `-name x` and `-type f` as word-plus-value pairs rather than
    // getopt-style flags, so it is parsed on its own terms.
    const args = [...ctx.args];
    let start: string | undefined;
    let name: string | undefined;
    let type: "f" | "d" | undefined;
    let maxDepth = 3;

    while (args.length) {
      const arg = args.shift() as string;
      if (arg === "-name" || arg === "-iname") {
        name = args.shift();
        if (!name) {
          ctx.io.print(`find: missing argument to \`${arg}'`, "err");
          return;
        }
        continue;
      }
      if (arg === "-type") {
        const value = args.shift();
        if (value !== "f" && value !== "d") {
          ctx.io.print("find: -type must be 'f' or 'd'", "err");
          return;
        }
        type = value;
        continue;
      }
      if (arg === "-maxdepth") {
        const value = Number(args.shift());
        if (!Number.isInteger(value) || value < 0) {
          ctx.io.print("find: -maxdepth expects a whole number", "err");
          return;
        }
        maxDepth = Math.min(value, 3);
        continue;
      }
      if (arg.startsWith("-")) {
        ctx.io.print(`find: unknown predicate \`${arg}'`, "err");
        ctx.io.print("usage: find [path] [-name pattern] [-type f|d]", "dim");
        return;
      }
      if (start === undefined) {
        start = arg;
        continue;
      }
      ctx.io.print(`find: paths must precede expression: \`${arg}'`, "err");
      return;
    }

    let root: Location;
    try {
      root = targetOf(ctx, start);
    } catch (error) {
      ctx.io.print(vfsErrorText("find", error), "err");
      return;
    }

    // `find file` prints the file. Same rule as `ls`.
    if (!isDirectory(root)) {
      ctx.io.print(formatPath(root));
      return;
    }

    const matcher = name ? globToRegExp(name) : null;
    const found = await walk(ctx, root, maxDepth);

    // The starting point is itself a result in real find, when it matches.
    const rows = found.filter((item) => {
      if (type === "f" && item.isDir) return false;
      if (type === "d" && !item.isDir) return false;
      if (matcher && !matcher.test(item.entry.name) && !matcher.test(item.entry.title))
        return false;
      return true;
    });

    if (!rows.length) {
      stuck(
        ctx.io,
        `No match under ${formatPath(root)}.`,
        "Try a wider pattern, or list what is there with {ls}.",
      );
      return;
    }
    for (const row of rows) ctx.io.print(formatPath(row.loc));
    ctx.io.print(
      `${rows.length} ${rows.length === 1 ? "match" : "matches"}`,
      "dim",
    );
  },
};

// ─── grep ───────────────────────────────────────────────────────────────────

const grep: CommandSpec = {
  name: "grep",
  usage: "grep [-i] [-n] [-r] <pattern> [path]",
  summary: "search lesson text for a pattern",
  group: "filesystem",
  run: async (ctx) => {
    const { flags, operands } = parseArgs(ctx.args);
    const bad = unknownFlag(flags, "inrl");
    if (bad)
      return badOption(ctx, "grep", bad, "grep [-i] [-n] [-r] <pattern> [path]");

    const [pattern, where] = operands;
    if (!pattern) {
      ctx.io.print("grep: missing pattern", "err");
      ctx.io.print("usage: grep [-i] [-n] [-r] <pattern> [path]", "dim");
      return;
    }

    let re: RegExp;
    try {
      re = new RegExp(pattern, flags.has("i") ? "i" : "");
    } catch {
      ctx.io.print(`grep: ${pattern}: invalid regular expression`, "err");
      return;
    }

    let root: Location;
    try {
      root = targetOf(ctx, where);
    } catch (error) {
      ctx.io.print(vfsErrorText("grep", error), "err");
      return;
    }

    // GNU grep refuses a directory without -r rather than silently recursing.
    // Keeping that refusal is the difference between a command that behaves
    // like grep and one that is merely called grep.
    const recursive = flags.has("r");
    if (isDirectory(root) && !recursive) {
      ctx.io.print(`grep: ${formatPath(root)}: Is a directory`, "err");
      stuck(ctx.io, "", `Search the whole subtree with {grep -r ${pattern} .}.`);
      return;
    }

    const files: Array<{ loc: Location; id: string }> = [];
    if (isDirectory(root)) {
      for (const item of await walk(ctx, root, 3)) {
        if (!item.isDir) files.push({ loc: item.loc, id: item.entry.id });
      }
    } else {
      try {
        const { conceptId } = await resolveLocation(root);
        if (conceptId) files.push({ loc: root, id: conceptId });
      } catch (error) {
        ctx.io.print(vfsErrorText("grep", error), "err");
        return;
      }
    }

    const namesOnly = flags.has("l");
    const numbered = flags.has("n");
    let hits = 0;

    for (const file of files) {
      ctx.io.status?.(`searching ${basename(file.loc)}`);
      const concept = await readConcept(file.id).catch(() => null);
      if (!concept?.content) continue;

      const lines = concept.content.split("\n");
      let matchedHere = false;
      for (let i = 0; i < lines.length; i += 1) {
        if (!re.test(lines[i])) continue;
        matchedHere = true;
        hits += 1;
        if (namesOnly) break;
        // `path:line:text` when several files are in play, `line:text` for one —
        // grep's own rule, and the reason its output pipes so well.
        const prefix = files.length > 1 ? `${formatPath(file.loc)}:` : "";
        const lineNo = numbered ? `${i + 1}:` : "";
        ctx.io.print(`${prefix}${lineNo}${lines[i].trim()}`);
      }
      if (namesOnly && matchedHere) ctx.io.print(formatPath(file.loc));
    }

    if (!hits) {
      // grep exits 1 in silence. Silence here would be indistinguishable from a
      // broken command, so it says so — and offers the wider search.
      stuck(
        ctx.io,
        `No match for ${pattern}.`,
        "Widen it with {grep -i} for any case, or search names instead with {find -name}.",
      );
    }
  },
};

// ─── history ────────────────────────────────────────────────────────────────

const history: CommandSpec = {
  name: "history",
  usage: "history [-c] [n]",
  summary: "list the commands run this session",
  group: "shell",
  run: (ctx) => {
    const { flags, operands } = parseArgs(ctx.args);
    const bad = unknownFlag(flags, "c");
    if (bad) return badOption(ctx, "history", bad, "history [-c] [n]");

    if (flags.has("c")) {
      clearHistory();
      ctx.io.print("history cleared", "dim");
      return;
    }

    const all = readHistory();
    if (!all.length) {
      // Only reachable before the dispatcher has recorded anything.
      ctx.io.print("history is empty", "dim");
      return;
    }

    let shown = all;
    if (operands[0] !== undefined) {
      const count = Number(operands[0]);
      if (!Number.isInteger(count) || count <= 0) {
        ctx.io.print(`history: ${operands[0]}: numeric argument required`, "err");
        return;
      }
      shown = all.slice(-count);
    }

    // Numbering counts from one across the whole history, so the number beside
    // a line is stable whether or not the list was truncated.
    const offset = all.length - shown.length;
    const width = String(all.length).length;
    shown.forEach((line, i) => {
      ctx.io.print(
        `  ${String(offset + i + 1).padStart(width)}  ${line}`,
        "out",
        [{ label: "run", command: line }],
      );
    });
  },
};

// Re-exported so the dispatcher can record every line it runs without this
// module's internals being reachable from there.
export { recordHistory } from "./output";

export const FS_COMMANDS: CommandSpec[] = [
  pwd,
  ls,
  cd,
  cat,
  less,
  find,
  grep,
  history,
];
