/* ==========================================================================
   source:dev — filesystem commands
   --------------------------------------------------------------------------
   pwd, ls, cd, cat, less, history.

   These behave like their Unix namesakes rather than merely borrowing the
   names, which is a claim worth being precise about, because the differences
   are where a shell normally feels fake:

     - `ls file` prints the file, it does not error. `cd file` is the one that
       says `Not a directory`.
     - `..` at the root stays at the root. It is not an error.
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
import {
  stuck,
  readHistory,
  clearHistory,
  setCurrentConcept,
  conceptFooter,
} from "./output";
import {
  childKindOf,
  basename,
  formatPath,
  resolvePath,
  ROOT,
  type Location,
} from "./location";
import {
  listChildren,
  readConcept,
  resolveLocation,
  conceptQuizTotal,
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
 *  No argument means *here*. `resolvePath` reads an absent argument as home,
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


// ─── pwd ────────────────────────────────────────────────────────────────────

const pwd: CommandSpec = {
  name: "pwd",
  usage: "pwd",
  help: {
    usage: "pwd",
    description: [
      "Print the working directory — where in the curriculum you are now.",
      "The output is a path you can paste straight back into cd, and it is the",
      "same value the address bar shows, because there is only one.",
    ],
    examples: ["pwd", "cd /roadmaps/voip-basics", "pwd"],
  },
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
  completes: "path",
  help: {
    usage: "ls [-l] [path]...",
    description: [
      "List what is here: roadmaps at the top level, modules inside a roadmap,",
      "lessons inside a module.",
      "Each row opens with its progress marker — [x] done, [~] in progress,",
      "[ ] not started — so a listing doubles as a progress report.",
    ],
    args: [
      {
        name: "[path]",
        text: "What to list; the current directory when omitted",
      },
    ],
    options: [
      { name: "-l", text: "Long form: the human title beside each name" },
      { name: "--", text: "End of options, so a path may start with a dash" },
    ],
    examples: [
      "ls",
      "ls -l",
      "ls voip-basics",
      "ls /roadmaps/voip-basics/introduction",
      "ls ~",
    ],
  },
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
      { label: isDir ? "cd" : "cat", command: isDir ? `cd ${name}` : `cat ${name}` },
    ]);
    return;
  }
  ctx.io.print(`${left.padEnd(38)} ${entry.title}`, "out");
}

// ─── cd ─────────────────────────────────────────────────────────────────────

const cd: CommandSpec = {
  name: "cd",
  usage: "cd [path]",
  completes: "path",
  help: {
    usage: "cd [path]",
    description: [
      "Change the working directory. Steps one level at a time, or jumps",
      "anywhere with an absolute path — both reach the same places.",
      "With no argument, goes home to /roadmaps.",
    ],
    args: [
      { name: "[path]", text: "Where to go; home when omitted" },
      { name: "..", text: "Up one level; stays put at the top" },
      { name: "~", text: "Home, the same as no argument" },
    ],    examples: [
      "cd voip-basics",
      "cd introduction",
      "cd ..",
      "cd /roadmaps/voip-basics/introduction",
      "cd",
    ],
  },
  summary: "change the current directory",
  group: "filesystem",
  run: async (ctx) => {
    const { operands } = parseArgs(ctx.args);
    if (operands.length > 1) {
      ctx.io.print("cd: too many arguments", "err");
      return;
    }

    // A roadmap id, as a link spells it. `?roadmap=<id>` opens as `cd <id>`,
    // and the id is translated to the directory name here — before a Location
    // is built — so a stored location is still made of names only, which is
    // the invariant every path rule in `location.ts` rests on.
    let operand = operands[0];
    if (operand && CONCEPT_ID.test(operand)) {
      const named = await listChildren(ROOT)
        .then((entries) => entries.find((e) => e.id === operand))
        .catch(() => undefined);
      if (named) operand = named.name;
    }

    let loc: Location;
    try {
      // Bare `cd` and `cd ~` both go home; `..` clamps at the root. `~` and
      // `..` are `resolvePath`'s rules, not re-decided here — the bare form is
      // spelled as `~` because to every *other* command a missing argument
      // means the current directory, which `targetOf` answers first.
      loc = targetOf(ctx, operand ?? "~");
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
/** A concept id, as a link hands one over. */
const CONCEPT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function contentOf(
  ctx: CommandCtx,
  command: string,
  arg?: string,
): Promise<{ id: string; title: string; text: string } | null> {
  if (!arg) {
    // Real `cat` with no operand reads stdin. There is no stdin here, and
    // hanging would be a worse imitation than saying so.
    ctx.io.print(`${command}: missing operand`, "err");
    ctx.io.print(`usage: ${command} <lesson>`, "dim");
    return null;
  }

  // An id rather than a path. The GUI links into the shell by id — a
  // `?concept=<id>` link opens as `cat <id>` — and an id names exactly one
  // lesson from anywhere, so there is nothing to resolve it against. A path is
  // what a person types; this is what a link passes.
  if (CONCEPT_ID.test(arg)) {
    try {
      ctx.io.status?.("reading");
      const concept = await readConcept(arg);
      return {
        id: arg,
        title: concept.title || arg,
        text: concept.content || "",
      };
    } catch (error) {
      ctx.io.print(vfsErrorText(command, error), "err");
      return null;
    }
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
      id: conceptId,
      title: concept.title || entry?.title || basename(loc),
      text: concept.content || "",
    };
  } catch (error) {
    ctx.io.print(vfsErrorText(command, error), "err");
    return null;
  }
}

/** Remember the lesson on screen, then close it with the line that says what
 *  follows it — whether it carries a knowledge check or is finished by hand.
 *  The quiz state is best-effort: unreachable means the footer is skipped, and
 *  the lesson is still remembered, because a lesson worth printing is a lesson
 *  worth quizzing bare-handed. */
async function closeConcept(
  ctx: CommandCtx,
  found: { id: string; title: string },
): Promise<void> {
  setCurrentConcept({ id: found.id, title: found.title });
  const total = await conceptQuizTotal(found.id);
  if (total === null) return;
  stuck(ctx.io, "", conceptFooter(found.id, total));
}

const cat: CommandSpec = {
  name: "cat",
  usage: "cat <lesson>",
  completes: "path",
  help: {
    usage: "cat <lesson>...",
    description: [
      "Print a lesson in full, without paging. More than one operand prints",
      "them one after another, which is what the name means.",
      "Reading a lesson marks it started, exactly as opening it used to.",
    ],
    args: [
      {
        name: "<lesson>",
        text: "A lesson name, a path ending in one, or an id",
      },
    ],
    examples: [
      "cat what-is-voip",
      "cat /roadmaps/voip-basics/introduction/what-is-voip",
      "cat what-is-voip sip-basics",
    ],
  },
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
        ctx.io.print(`${found.title}: no content published yet`, "dim");
        await closeConcept(ctx, found);
        continue;
      }
      if (ctx.io.doc) ctx.io.doc(found.text);
      else ctx.io.print(found.text);
      await closeConcept(ctx, found);
    }
  },
};

const less: CommandSpec = {
  name: "less",
  usage: "less <lesson>",
  completes: "path",
  help: {
    usage: "less <lesson>",
    description: [
      "Read a lesson one screenful at a time. Space pages on, Enter moves one",
      "line, G jumps to the end, q stops — the keys less itself uses.",
      "A lesson that already fits is simply printed, as less does with a short",
      "file.",
    ],
    args: [
      {
        name: "<lesson>",
        text: "A lesson name, a path ending in one, or an id",
      },
    ],
    examples: [
      "less what-is-voip",
      "less /roadmaps/voip-basics/introduction/what-is-voip",
    ],
  },
  summary: "page through a lesson one screen at a time",
  group: "filesystem",
  aliases: ["more"],
  run: async (ctx) => {
    const { operands } = parseArgs(ctx.args);
    const found = await contentOf(ctx, "less", operands[0]);
    if (!found) return;
    // Remembered before paging: quitting early still leaves the lesson on
    // screen, while the footer waits until the reading is done.
    setCurrentConcept({ id: found.id, title: found.title });
    if (!found.text) {
      ctx.io.print(`${found.title}: no content published yet`, "dim");
      await closeConcept(ctx, found);
      return;
    }

    // A host with a viewport pages properly: it owns the screen height, the
    // keys and the status line, none of which this layer can know. A host
    // without one — the dashboard's single-line prompt — still shows the
    // lesson rather than refusing, which is the better failure.
    if (ctx.io.page) {
      await ctx.io.page(found.text, { title: found.title });
      await closeConcept(ctx, found);
      return;
    }
    if (ctx.io.doc) ctx.io.doc(found.text);
    else ctx.io.print(found.text);
    await closeConcept(ctx, found);
  },
};


// ─── history ────────────────────────────────────────────────────────────────

const history: CommandSpec = {
  name: "history",
  usage: "history [-c] [n]",
  help: {
    usage: "history [-c] [n]",
    description: [
      "Print the commands typed this session, oldest first and numbered from",
      "one. Consecutive duplicates collapse, the way bash does with ignoredups.",
      "↑ walks this same list, and clear does not empty it.",
    ],
    args: [{ name: "[n]", text: "Print only the last n lines" }],
    options: [{ name: "-c", text: "Clear the history" }],
    examples: ["history", "history 20", "history -c"],
  },
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
  history,
];
