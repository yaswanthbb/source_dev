import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   Authoring (D3) — roadmaps, modules and concepts from the shell.

   Stubs serve one roadmap with one module; the verbs are exercised for real:
   scope errors without a location, create+attach flows, submit refusal text,
   draft-vs-live edit reporting, and backend refusals surfacing verbatim.
   ========================================================================== */

const loaded = new Map();
const calls = [];

const EXTERNAL = {
  "@/lib/api-client": { default: {} },
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

const DB = {
  roadmaps: [{ id: "r1", title: "JS", slug: "js", description: null }],
  detail: {
    id: "r1",
    title: "JS",
    modules: [
      { id: "m1", title: "Scope" },
      { id: "m2", title: "VOIP Basics" },
    ],
  },
  concepts: [{ id: "c1", title: "Closures", slug: "closures" }],
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
loadFile(path.join(__dirname, "learning-commands.ts"));
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

// The request layer is reached through ./request — point it at the fake DB.
const request = loadFile(path.join(__dirname, "request.ts"));
request.api.get = async (url) => {
  calls.push(["GET", url]);
  if (url === "/roadmaps") return { data: DB.roadmaps };
  if (url === "/roadmaps/r1") return { data: DB.detail };
  if (url === "/concepts") return { data: DB.concepts };
  if (url === "/roadmaps/r1/review")
    return {
      data: {
        roadmapId: "r1",
        title: "JS",
        reviewStatus: "submitted",
        modules: [],
        pendingCount: 1,
        rejectedCount: 0,
        canPublish: false,
      },
    };
  if (url === "/articles") return { data: [] };
  throw new Error(`unexpected GET ${url}`);
};
request.api.post = async (url, body) => {
  calls.push(["POST", url, body]);
  if (url === "/roadmaps") return { data: { id: "r9", slug: "new-road" } };
  if (url === "/roadmaps/r1/modules") return { data: { id: "m9" } };
  if (url === "/concepts") return { data: { id: "c9" } };
  if (url === "/modules/m1/concepts") return { data: { id: "mc9" } };
  if (url === "/modules/m2/concepts") return { data: { id: "mc8" } };
  if (url === "/ai-generate/concept-content")
    return { data: { content: "AI wrote this lesson body for you here." } };
  if (url === "/articles") return { data: { id: "art9" } };
  if (url === "/roadmaps/r1/submit")
    return { data: { id: "r1", reviewStatus: "submitted" } };
  throw new Error(`unexpected POST ${url}`);
};
request.api.patch = async (url, body) => {
  calls.push(["PATCH", url, body]);
  if (url === "/concepts/c1")
    return { data: { reviewStatus: "pending", draftContent: null } };
  if (url === "/roadmaps/r1" || url === "/modules/m1") return { data: {} };
  throw new Error(`unexpected PATCH ${url}`);
};
request.api.delete = async (url) => {
  calls.push(["DELETE", url]);
  const err = new Error("refused");
  err.response = { data: { message: "Concepts cannot be detached from a published roadmap." } };
  throw err;
};

function recorder(answers = [], cwd = { kind: "root" }) {
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
      select: async () => 1,
      pickFile: async () => null,
      select: async () => 1,
    },
    cwd,
  };
}

const ctx = (host) => ({
  io: host.io,
  user: { id: "u1", role: "developer", timezone: "UTC" },
  cwd: host.cwd,
  setCwd: () => {},
  refreshUser: async () => {},
  isDark: true,
  setTheme: () => {},
  logout: () => {},
});

const text = (lines) => lines.map((l) => l.text).join("\n");
const MOD = { kind: "module", roadmap: "js", module: "scope" };
const CON = { kind: "concept", roadmap: "js", module: "scope", concept: "closures" };

// ─── The contract ───────────────────────────────────────────────────────────

test("roadmap new creates privately and points inward", async () => {
  const host = recorder([""]);
  await runCommand("roadmap new Async JS", ctx(host));
  const posted = calls.find(([m, u]) => m === "POST" && u === "/roadmaps");
  assert.ok(posted, "expected POST /roadmaps");
  assert.equal(posted[2].title, "Async JS");
  assert.match(text(host.lines), /private until published/);
});

test("module new needs a roadmap on screen", async () => {
  const host = recorder([]);
  await runCommand("module new Scope", ctx(host));
  assert.match(text(host.lines), /No roadmap on screen/);
  assert.ok(!calls.some(([m, u]) => m === "POST" && u.includes("/modules")));
});

test("concept new writes with difficulty and attaches", async () => {
  const host = recorder(["the event loop processes callbacks", "timers run first", "."], MOD);
  await runCommand("concept new Event Loop", ctx(host));
  const created = calls.find(([m, u]) => m === "POST" && u === "/concepts");
  assert.ok(created, "expected POST /concepts");
  assert.equal(created[2].difficulty, "medium");
  assert.ok(created[2].content.includes("event loop"));
  const attached = calls.find(([m, u]) => m === "POST" && u === "/modules/m1/concepts");
  assert.ok(attached, "expected attach to current module");
  assert.equal(attached[2].conceptId, "c9");
});

test("concept new resolves a slugified module dir (multi-word title)", async () => {
  // Regression: VFS dirs are slugify(title) ("VOIP Basics" -> "voip-basics")
  // but cwdModuleId compared the slug against the raw title and found
  // nothing, printing "No module on screen" from inside a module.
  const host = recorder(
    ["voip transmits voice over networks", "sip handles the signaling", "."],
    { kind: "module", roadmap: "js", module: "voip-basics" },
  );
  await runCommand("concept new Learn VOIP Basics", ctx(host));
  const attached = calls.find(([m, u]) => m === "POST" && u === "/modules/m2/concepts");
  assert.ok(attached, "expected attach to the slugified module m2");
  assert.equal(attached[2].conceptId, "c9");
});

test("concept ai generates the body and attaches", async () => {
  const host = recorder(
    [],
    { kind: "module", roadmap: "js", module: "voip-basics" },
  );
  await runCommand("concept ai Learn VOIP Basics", ctx(host));
  const generated = calls.find(
    ([m, u]) => m === "POST" && u === "/ai-generate/concept-content",
  );
  assert.ok(generated, "expected POST /ai-generate/concept-content");
  assert.equal(generated[2].title, "Learn VOIP Basics");
  assert.equal(generated[2].difficulty, "medium");
  assert.equal(generated[2].roadmapId, "r1");
  const created = calls
    .filter(([m, u]) => m === "POST" && u === "/concepts")
    .at(-1);
  assert.ok(created, "expected POST /concepts");
  assert.match(created[2].content, /AI wrote this lesson body/);
  const attachedAi = calls.find(
    ([m, u]) => m === "POST" && u === "/modules/m2/concepts",
  );
  assert.ok(attachedAi, "expected attach of the AI lesson to m2");
  assert.match(text(host.lines), /private until published/);
});

test("concept ai surfaces quota refusal without creating", async () => {
  const before = calls.filter(([m, u]) => m === "POST" && u === "/concepts").length;
  const origPost = request.api.post;
  const err = new Error("refused");
  err.response = { data: { message: "Daily AI generation limit reached." } };
  request.api.post = async (url, body) => {
    calls.push(["POST", url, body]);
    if (url === "/ai-generate/concept-content") throw err;
    return origPost(url, body);
  };
  try {
    const host = recorder(
      [],
      { kind: "module", roadmap: "js", module: "voip-basics" },
    );
    await runCommand("concept ai Learn VOIP Basics", ctx(host));
    assert.match(text(host.lines), /AI generation refused.*limit reached/);
    assert.equal(
      calls.filter(([m, u]) => m === "POST" && u === "/concepts").length,
      before,
    );
  } finally {
    request.api.post = origPost;
  }
});

test("concept new refuses a stub body", async () => {
  const before = calls.filter(([m, u]) => m === "POST" && u === "/concepts").length;
  const host = recorder(["too short", "."], MOD);
  await runCommand("concept new Event Loop", ctx(host));
  assert.match(text(host.lines), /at least 20 characters/);
  assert.equal(
    calls.filter(([m, u]) => m === "POST" && u === "/concepts").length,
    before,
  );
});

test("submit refusal text names the structural rule", async () => {
  const err = new Error("refused");
  err.response = { data: { message: "Submission requires at least 3 modules (found 1)." } };
  const origPost = request.api.post;
  request.api.post = async (url, body) => {
    calls.push(["POST", url, body]);
    if (url === "/roadmaps/r1/submit") throw err;
    return origPost(url, body);
  };
  try {
    const host = recorder([], { kind: "roadmap", roadmap: "js" });
    await runCommand("roadmap submit", ctx(host));
    assert.match(text(host.lines), /at least 3 modules/);
  } finally {
    request.api.post = origPost;
  }
});

test("edit on a pending lesson reports back-to-review", async () => {
  const host = recorder(["new body text here", "."], CON);
  await runCommand("edit", ctx(host));
  assert.match(text(host.lines), /back to pending review/);
});

test("detach refusal surfaces the backend message verbatim", async () => {
  const host = recorder([], MOD);
  await runCommand("detach closures", ctx(host));
  assert.match(text(host.lines), /published roadmap/);
});

test("article new publishes hand-written posts immediately", async () => {
  const host = recorder(["Why Closures Clicked", "a real article body here", ".", "", ""]);
  await runCommand("article new", ctx(host));
  const posted = calls.find(([m, u]) => m === "POST" && u === "/articles");
  assert.ok(posted, "expected POST /articles");
  assert.equal(posted[2].title, "Why Closures Clicked");
  assert.ok(!("roadmapId" in posted[2]), "empty links omitted");
  assert.match(text(host.lines), /live immediately/);
});

test("articles lists the public board", async () => {
  const host = recorder([]);
  await runCommand("articles", ctx(host));
  assert.match(text(host.lines), /ARTICLES|no articles/i);
});
