import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   The admin shell — same contract as the student registry, plus composition.

   1. Every admin command has a real help block (usage naming the command,
      sentences for description, typeable examples) and answers --help
      without running.
   2. Every admin command carries role "admin".
   3. commandsFor composes per shell: developers get exactly COMMAND_LIST
      (the student surface, unchanged); admins get the shared entries plus
      the admin set, with no duplicate names.
   ========================================================================== */

const loaded = new Map();

const EXTERNAL = {
  "@/lib/api-client": {
    default: {
      get: fail,
      post: fail,
      patch: fail,
      delete: fail,
    },
  },
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
const { COMMAND_LIST, runCommand, commandsFor } = commands;
const admin = loadFile(path.join(__dirname, "admin-commands.ts"));
const { ADMIN_COMMANDS } = admin;
const { installGlyphs } = loadFile(path.join(__dirname, "theme-contract.ts"));

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

const ctx = (io, list) => ({
  io,
  commands: list,
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

const ADMIN_LIST = commandsFor("admin", ADMIN_COMMANDS);

// ─── The contract ───────────────────────────────────────────────────────────

test("every admin command has a help block with a usage line and examples", () => {
  const missing = [];
  for (const spec of ADMIN_COMMANDS) {
    const help = spec.help;
    if (!help) {
      missing.push(`${spec.name}: no help at all`);
      continue;
    }
    if (!help.usage?.trim()) missing.push(`${spec.name}: empty usage`);
    if (!help.usage.startsWith(spec.name))
      missing.push(`${spec.name}: usage does not start with the command name`);
    if (!help.description?.length)
      missing.push(`${spec.name}: no description`);
    if (!help.examples?.length) missing.push(`${spec.name}: no examples`);
  }
  assert.deepEqual(missing, []);
});

test("every admin command carries role admin", () => {
  const bad = ADMIN_COMMANDS.filter((s) => s.role !== "admin").map(
    (s) => s.name,
  );
  assert.deepEqual(bad, []);
});

test("--help never runs an admin command", async () => {
  for (const spec of ADMIN_COMMANDS) {
    const host = recorder();
    await runCommand(
      `${spec.name} --help`,
      ctx(host.io, ADMIN_LIST),
      ADMIN_LIST,
    );
    assert.ok(
      host.lines.length > 0,
      `${spec.name}: --help printed nothing`,
    );
  }
});

test("every admin example is a line you could actually type", () => {
  const names = new Set(ADMIN_LIST.map((s) => s.name));
  for (const spec of ADMIN_COMMANDS) {
    for (const alias of spec.aliases ?? []) names.add(alias);
  }
  const bad = [];
  for (const spec of ADMIN_COMMANDS) {
    for (const example of spec.help.examples) {
      const verb = example.trim().split(/\s+/)[0].toLowerCase();
      if (!names.has(verb))
        bad.push(`${spec.name}: "${example}" starts with no admin command`);
    }
  }
  assert.deepEqual(bad, []);
});

// ─── Composition ────────────────────────────────────────────────────────────

test("developers get exactly the student surface, unchanged", () => {
  const names = commandsFor("developer").map((s) => s.name);
  assert.deepEqual(names, COMMAND_LIST.map((s) => s.name));
});

test("the admin shell has the admin set and none of the curriculum set", () => {
  const names = ADMIN_LIST.map((s) => s.name);
  for (const want of ["review", "roadmap", "qa", "users", "notifications", "articles", "jobs", "keys", "quota", "overview"]) {
    assert.ok(names.includes(want), `admin shell missing ${want}`);
  }
  for (const gone of ["ls", "cd", "cat", "quiz", "continue", "complete"]) {
    assert.ok(!names.includes(gone), `admin shell leaks curriculum command ${gone}`);
  }
  // "qa" exists in both shells by design: the student board vs admin moderation.
  assert.ok(names.includes("qa"));
});

test("no duplicate names inside the composed admin shell", () => {
  const seen = new Set();
  const dupes = [];
  for (const spec of ADMIN_LIST) {
    const names = [spec.name, ...(spec.aliases ?? [])];
    for (const n of names) {
      if (seen.has(n)) dupes.push(n);
      seen.add(n);
    }
  }
  assert.deepEqual(dupes, []);
});

test("help inside the admin shell lists the admin set", async () => {
  const host = recorder();
  await runCommand("help", ctx(host.io, ADMIN_LIST), ADMIN_LIST);
  const text = host.lines.map((l) => l.text).join("\n");
  assert.ok(text.includes("review"));
  assert.ok(text.includes("qa"));
  assert.ok(!text.includes("quiz"));
});

test("--help never runs the qa moderator", async () => {
  const host = recorder();
  await runCommand("qa --help", ctx(host.io, ADMIN_LIST), ADMIN_LIST);
  assert.ok(host.lines.length > 0);
});
