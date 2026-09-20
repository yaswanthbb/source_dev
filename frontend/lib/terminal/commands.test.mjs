import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   The command registry — the contract every command has to satisfy.

   `fs-commands.test.mjs` proves the filesystem commands behave like their Unix
   namesakes. This proves the things that must be true of *all* of them at
   once, because those are exactly the properties that rot one command at a
   time:

   1. Every command has a help block, and a real one — a usage line that names
      the command, a description in sentences, and examples a reader could
      actually type. TypeScript already makes `help` mandatory; it cannot tell
      a written one from a placeholder, which is what this is for.
   2. `--help`, `help` and `-h` all reach it, for every command, including the
      domain ones with no Unix equivalent.
   3. Asking for help never runs the command. A `--help` that deleted your
      account would be a memorable bug.
   4. Names and aliases are unique across the whole registry.

   The loader is `fs-commands.test.mjs`'s, widened to stub the handful of
   non-relative imports `commands.ts` reaches for. Everything under
   `lib/terminal` is still the real module.
   ========================================================================== */

// ─── The loader ─────────────────────────────────────────────────────────────

const loaded = new Map();

/** The modules outside `lib/terminal` that the command layer imports. Kept
 *  explicit: a new one appearing here is a new dependency for the command
 *  layer, which is worth noticing rather than resolving silently. */
const EXTERNAL = {
  "@/lib/api-client": { default: { get: fail, post: fail, patch: fail } },
  "@/lib/image": {
    AVATAR_ACCEPT: "image/*",
    dataUrlSizeKb: () => 0,
    resizeImageToDataUrl: fail,
  },
  "@/lib/timezone": {
    detectTimezone: () => "UTC",
    formatDate: (d) => String(d),
  },
  "@/lib/auth": {},
};

function fail() {
  throw new Error("a --help must not reach the network");
}

function loadFile(filename) {
  const hit = loaded.get(filename);
  if (hit) return hit;

  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const loadedModule = { exports: {} };
  // Registered before evaluating, so the commands/learning-commands cycle
  // resolves to a partial module rather than recursing forever.
  loaded.set(filename, loadedModule.exports);

  const require = (id) => {
    if (!id.startsWith(".")) {
      const stub = EXTERNAL[id];
      if (stub) return stub;
      throw new Error(`${path.basename(filename)} must not import ${id}`);
    }
    const abs = path.resolve(path.dirname(filename), `${id}.ts`);
    return loadFile(abs);
  };

  vm.runInThisContext(`(function(require, module, exports) {${js}\n})`, {
    filename,
  })(require, loadedModule, loadedModule.exports);

  loaded.set(filename, loadedModule.exports);
  return loadedModule.exports;
}

const commands = loadFile(path.join(__dirname, "commands.ts"));
const { COMMAND_LIST, COMMANDS, runCommand } = commands;
const { installGlyphs } = loadFile(path.join(__dirname, "theme-contract.ts"));

// A marker set of this test's own. Nothing here asserts on a glyph, but the
// registry cannot be built without one installed.
installGlyphs({
  prompt: ">",
  caret: "_",
  rule: "-",
  done: "<D>",
  active: "<A>",
  todo: "<->",
  tokenOpen: "(",
  tokenClose: ")",
  more: (p) => `more ${p}`,
  banner: "banner",
  meter: (p) => `${p}%`,
});

/** A host that records what was printed and refuses everything else, so a
 *  command that tried to do work during `--help` fails loudly. */
function recorder() {
  const lines = [];
  return {
    lines,
    io: {
      print: (text, kind) => lines.push({ text, kind }),
      say: (segments) =>
        lines.push({
          text: segments
            .map((s) => (typeof s === "string" ? s : s.label))
            .join(""),
          kind: "out",
        }),
      clear: () => {
        throw new Error("--help must not clear the screen");
      },
      close: () => {
        throw new Error("--help must not leave the terminal");
      },
      ask: () => {
        throw new Error("--help must not ask a question");
      },
      pickFile: () => {
        throw new Error("--help must not open a file picker");
      },
    },
  };
}

const ctx = (io) => ({
  io,
  cwd: { kind: "root" },
  setCwd: () => {
    throw new Error("--help must not move the user");
  },
  refreshUser: async () => {},
  isDark: true,
  setTheme: () => {
    throw new Error("--help must not change the theme");
  },
  logout: () => {
    throw new Error("--help must not end the session");
  },
});

const text = (lines) => lines.map((l) => l.text).join("\n");

// ─── The contract ───────────────────────────────────────────────────────────

test("every command has a help block with a usage line and examples", () => {
  const missing = [];
  for (const spec of COMMAND_LIST) {
    const help = spec.help;
    if (!help) {
      missing.push(`${spec.name}: no help at all`);
      continue;
    }
    if (!help.usage?.trim()) missing.push(`${spec.name}: empty usage`);
    // The synopsis has to be about this command, not a copy of another's.
    if (!help.usage.startsWith(spec.name))
      missing.push(`${spec.name}: usage does not start with the command name`);
    if (!help.description?.length)
      missing.push(`${spec.name}: no description`);
    if (!help.examples?.length) missing.push(`${spec.name}: no examples`);
  }
  assert.deepEqual(missing, []);
});

test("a description is sentences, not a restated name", () => {
  const thin = COMMAND_LIST.filter((spec) =>
    spec.help.description.every((line) => line.trim().split(/\s+/).length < 4),
  ).map((s) => s.name);
  assert.deepEqual(thin, []);
});

test("every example is a line you could actually type", () => {
  const bad = [];
  for (const spec of COMMAND_LIST) {
    const names = [spec.name, ...(spec.aliases ?? [])];
    for (const example of spec.help.examples) {
      const verb = example.trim().split(/\s+/)[0];
      // A bare number is a line the dispatcher rewrites to `jump`, so it is a
      // real thing to type even though no command answers to it.
      if (/^\d+$/.test(verb)) continue;
      // An example may reference a neighbouring command — `status` suggests
      // `review` — so the test is that the verb is a real command, not that it
      // is this one.
      if (!COMMANDS[verb.toLowerCase()])
        bad.push(`${spec.name}: "${example}" starts with no known command`);
      else if (
        spec.help.examples.length === 1 &&
        !names.includes(verb.toLowerCase())
      )
        bad.push(`${spec.name}: its only example is for another command`);
    }
  }
  assert.deepEqual(bad, []);
});

test("a bare number really does reach jump", async () => {
  const host = recorder();
  await runCommand("7", ctx(host.io));
  // Whatever `jump` says with no lesson open, the point is that something
  // answered: a bare number must not fall through to "command not found".
  const printed = text(host.lines);
  assert.ok(printed.length > 0, "a bare number printed nothing at all");
  assert.doesNotMatch(printed, /command not found/);
});

test("help, --help and -h all reach the same block, for every command", async () => {
  for (const spec of COMMAND_LIST) {
    const outputs = [];
    for (const flag of ["help", "--help", "-h"]) {
      const host = recorder();
      await runCommand(`${spec.name} ${flag}`, ctx(host.io));
      outputs.push(text(host.lines));
    }
    assert.equal(
      outputs[0],
      outputs[1],
      `${spec.name}: help and --help disagree`,
    );
    assert.equal(outputs[1], outputs[2], `${spec.name}: --help and -h disagree`);
    assert.match(
      outputs[0],
      /^Usage: /,
      `${spec.name}: --help does not open with a usage line`,
    );
    assert.match(
      outputs[0],
      /\nExamples:\n/,
      `${spec.name}: --help prints no examples`,
    );
  }
});

test("--help never runs the command", async () => {
  // The recorder throws on every side effect a command could have — asking,
  // clearing, navigating, logging out, or touching the network. Reaching any
  // of them fails the run, and `runCommand` catches errors rather than
  // rethrowing, so the assertion is on the output rather than on a throw.
  for (const spec of COMMAND_LIST) {
    const host = recorder();
    await runCommand(`${spec.name} --help`, ctx(host.io));
    const printed = text(host.lines);
    assert.ok(
      !/must not/.test(printed),
      `${spec.name}: --help reached a side effect — ${printed}`,
    );
  }
});

test("an alias answers --help the same way its command does", async () => {
  for (const spec of COMMAND_LIST) {
    for (const alias of spec.aliases ?? []) {
      const viaName = recorder();
      const viaAlias = recorder();
      await runCommand(`${spec.name} --help`, ctx(viaName.io));
      await runCommand(`${alias} --help`, ctx(viaAlias.io));
      assert.equal(
        text(viaAlias.lines),
        text(viaName.lines),
        `${alias}: does not resolve to ${spec.name}'s help`,
      );
    }
  }
});


test("man prints the same facts under man's headings", async () => {
  const host = recorder();
  await runCommand("man ls", ctx(host.io));
  const printed = text(host.lines);
  for (const heading of ["LS(1)", "NAME", "SYNOPSIS", "DESCRIPTION", "EXAMPLES"])
    assert.ok(printed.includes(heading), `man ls is missing ${heading}`);
  // Same source, so the synopsis cannot drift from the one `--help` prints.
  assert.ok(printed.includes(COMMANDS["ls"].help.usage));
});

test("man says so when there is no such page", async () => {
  const host = recorder();
  await runCommand("man nosuchthing", ctx(host.io));
  assert.match(text(host.lines), /No manual entry for nosuchthing/);
});

test("the bare help listing ends with the line that teaches --help", async () => {
  const host = recorder();
  await runCommand("help", ctx(host.io));
  const lines = host.lines.map((l) => l.text);
  assert.equal(
    lines[lines.length - 1],
    'Type "[command] help" or "[command] --help" for more info.',
  );
  // And it actually lists the commands, grouped.
  const printed = lines.join("\n");
  for (const spec of COMMAND_LIST.filter((s) => !s.hidden))
    assert.ok(printed.includes(spec.usage), `help omits ${spec.name}`);
});

test("no two commands answer to the same word", () => {
  const seen = new Map();
  const clashes = [];
  for (const spec of COMMAND_LIST) {
    for (const word of [spec.name, ...(spec.aliases ?? [])]) {
      if (seen.has(word)) clashes.push(`${word}: ${seen.get(word)} and ${spec.name}`);
      seen.set(word, spec.name);
    }
  }
  assert.deepEqual(clashes, []);
});

test("a command that takes a path says so, and only those do", () => {
  const completing = COMMAND_LIST.filter((s) => s.completes).map((s) => s.name);
  // The full list, written out rather than derived: if a command gains or
  // loses a path argument, that is a decision someone should have to record
  // here rather than something the test quietly agrees with.
  assert.deepEqual(completing.sort(), [
    "cat",
    "cd",
    "complete",
    "less",
    "ls",
    "quiz",
  ]);
});

test("the removed commands are gone, not hidden", () => {
  // Removed commands must not resolve at all; a hidden entry would leave a second path to the old action.
  for (const word of ["roadmaps", "open", "read", "lesson", "find", "grep", "apply-instructor", "instructor-status"]) {
    assert.equal(
      COMMANDS[word],
      undefined,
      `${word} still resolves to a command`,
    );
    assert.ok(
      !COMMAND_LIST.some((s) => s.name === word),
      `${word} is still in COMMAND_LIST`,
    );
  }
});

test("the learn group is exactly what survived", () => {
  const learn = COMMAND_LIST.filter((s) => s.group === "learn").map(
    (s) => s.name,
  );
  assert.deepEqual(learn.sort(), [
    "complete",
    "continue",
    "jump",
    "qa",
    "quiz",
    "review",
    "status",
  ]);
});

test("no output template still invokes a removed command", () => {
  // The words themselves are still ordinary English — `ls` lists "roadmaps",
  // every path starts `/roadmaps`, and lessons are things you "read" — so
  // scanning prose would drown in false positives. What must not survive is an
  // *invocation*: a `{verb}` token the reader can run, or an action wired to
  // one. That is the form a dead verb actually hides in.
  const offenders = [];
  for (const name of ["commands.ts", "learning-commands.ts", "fs-commands.ts"]) {
    const text = fs.readFileSync(path.join(__dirname, name), "utf8");
    text.split("\n").forEach((line, index) => {
      // `qa open <id>` is a subcommand of `qa`, not the removed `open`.
      const stripped = line.replace(/\{(here:)?qa open [^}]*\}/g, "");
      if (
        /\{(roadmaps|read|open)[\s}:]/.test(stripped) ||
        /command: [`"](roadmaps|read |open )/.test(stripped)
      )
        offenders.push(`${name}:${index + 1}  ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(offenders, []);
});
