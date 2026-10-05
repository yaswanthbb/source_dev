import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   QA discussion (§12 contract) — the board speaks asker/responder,
   answers post publicly, and verify/unverify hit the moderation endpoints.

   Stubs serve one concept with one thread; the ask/answer/verify verbs are
   exercised for real while everything else fails loudly.
   ========================================================================== */

const loaded = new Map();

const THREAD = {
  id: "thread-1111aaaa",
  conceptId: "c1",
  askerId: "u1",
  askerName: "Sam",
  body: "Does SIP run over TCP?",
  createdAt: "2026-02-01T10:00:00.000Z",
  answers: [],
};

const calls = [];
const EXTERNAL = {
  "@/lib/api-client": {
    default: {
      get: async (url) => {
        calls.push(["GET", url]);
        if (url === "/concepts")
          return { data: [{ id: "c1", title: "VoIP", slug: "voip" }] };
        if (url === "/concepts/c1/qa-questions") return { data: [THREAD] };
        if (url === "/concepts/c1")
          return { data: { id: "c1", authorId: "author-9" } };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url, body) => {
        calls.push(["POST", url, body]);
        if (url === "/concepts/c1/qa-questions")
          return { data: { ...THREAD, id: "thread-9999zzzz" } };
        if (url === "/qa-questions/thread-1111aaaa/answers")
          return {
            data: {
              id: "a1",
              responderId: "u2",
              responderName: "Dev",
              isVerified: false,
              body: body.body,
            },
          };
        throw new Error(`unexpected POST ${url}`);
      },
      patch: async (url, body) => {
        calls.push(["PATCH", url, body]);
        if (url === "/answers/a1/verify") return { data: { id: "a1" } };
        if (url === "/answers/a1/unverify") return { data: { id: "a1" } };
        throw new Error(`unexpected PATCH ${url}`);
      },
      delete: async () => {
        throw new Error("must not delete");
      },
    },
  },
  "@/lib/image": {
    AVATAR_ACCEPT: "image/*",
    dataUrlSizeKb: () => 0,
    resizeImageToDataUrl: () => {
      throw new Error("must not pick files");
    },
  },
  "@/lib/timezone": {
    detectTimezone: () => "UTC",
    formatDate: (d) => String(d),
  },
  "@/lib/auth": {},
};

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
    return loadFile(path.resolve(path.dirname(filename), `${id}.ts`));
  };
  vm.runInThisContext(`(function(require, module, exports) {${js}\n})`, {
    filename,
  })(require, loadedModule, loadedModule.exports);
  loaded.set(filename, loadedModule.exports);
  return loadedModule.exports;
}

const commands = loadFile(path.join(__dirname, "commands.ts"));
const { runCommand } = commands;
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

function recorder(answers = []) {
  const lines = [];
  let asked = 0;
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
      clear: () => {},
      close: () => {},
      ask: async () => answers[asked++] ?? "",
      pickFile: async () => null,
    },
  };
}

const DEV = { id: "u2", role: "developer", timezone: "UTC" };

const ctx = (io) => ({
  io,
  user: DEV,
  cwd: { kind: "root" },
  setCwd: () => {},
  refreshUser: async () => {},
  isDark: true,
  setTheme: () => {},
  logout: () => {},
});

const text = (lines) => lines.map((l) => l.text).join("\n");

// ─── The contract ───────────────────────────────────────────────────────────

test("the board speaks asker names from the new contract", async () => {
  const host = recorder();
  await runCommand("qa", ctx(host.io));
  assert.match(text(host.lines), /Sam/);
});

test("qa answer posts publicly with target discussion semantics", async () => {
  const host = recorder(["A long enough answer body here."]);
  await runCommand("qa answer thread-1111aaaa", ctx(host.io));
  const posted = calls.find(
    ([m, u]) => m === "POST" && u === "/qa-questions/thread-1111aaaa/answers",
  );
  assert.ok(posted, "expected an answers POST");
  assert.equal(posted[2].body, "A long enough answer body here.");
  assert.ok(!("target" in posted[2]), "answers carry no target field");
  assert.match(text(host.lines), /Answer posted/);
});

test("qa verify and unverify hit the moderation endpoints", async () => {
  const v = recorder();
  await runCommand("qa verify a1", ctx(v.io));
  assert.match(text(v.lines), /verified/);
  assert.ok(
    calls.some(([m, u]) => m === "PATCH" && u === "/answers/a1/verify"),
  );

  const u = recorder();
  await runCommand("qa unverify a1", ctx(u.io));
  assert.match(text(u.lines), /unverified/);
  assert.ok(
    calls.some(([m, u2]) => m === "PATCH" && u2 === "/answers/a1/unverify"),
  );
});

test("the ask picker offers ai-private vs public discussion", async () => {
  const host = recorder();
  commands.setCurrentConcept({ id: "c1", title: "VoIP" });
  // Escape immediately at the picker: the rows are what this asserts.
  const picking = runCommand("qa ask", {
    ...ctx(host.io),
    io: {
      ...host.io,
      select: async (_prompt, rows) => {
        host.lines.push({ text: rows.join(" | "), kind: "out" });
        throw new Error("stop");
      },
    },
  });
  await picking.catch(() => {});
  assert.match(text(host.lines), /private/);
  assert.match(text(host.lines), /public/);
  commands.setCurrentConcept(null);
});
