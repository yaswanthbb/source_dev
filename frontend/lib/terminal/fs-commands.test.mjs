import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   fs-commands.ts — the filesystem commands, run against a fake backend.

   `location.test.mjs` proves the path *rules*. This proves the *commands*:
   that `ls file` prints the file while `cd file` refuses it, that `..` clamps
   at the root, that path traversal and lesson reading share one resolver, and — the claim the whole
   architecture rests on — that an absolute path and a sequence of `cd`s are
   literally the same operation rather than two code paths that agree today.

   Two things are worth saying about the harness, because they are the reason
   this file can exist at all:

   1. The only thing stubbed is `./request`. `location.ts`, `output.ts`,
      `resolve-location.ts` and `theme-contract.ts` are the real modules. If
      any of them ever reached for React or the router, the loader below would
      throw on the require — so this doubles as a purity check on the command
      layer, the same way `location.test.mjs` does for its one file.
   2. No glyphs are hardcoded here either. The test installs its own marker set
      through `installGlyphs` and asserts `ls` prints *those*. A `[x]` in an
      assertion would mean the test had learned the theme, and a test that
      knows the theme cannot notice a command that does.
   ========================================================================== */

// ─── The loader ─────────────────────────────────────────────────────────────

const stubs = new Map();
const loaded = new Map();

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
  // Registered before evaluating, so an import cycle resolves to a partial
  // module rather than recursing forever — and a cycle that actually mattered
  // would surface here as an undefined import instead of a stack overflow.
  loaded.set(filename, loadedModule.exports);

  const require = (id) => {
    if (!id.startsWith(".")) {
      throw new Error(`${path.basename(filename)} must not import ${id}`);
    }
    const abs = path.resolve(path.dirname(filename), `${id}.ts`);
    if (stubs.has(abs)) return stubs.get(abs);
    return loadFile(abs);
  };

  // runInThisContext, not runInNewContext — see location.test.mjs: a separate
  // realm gives every value its own Object.prototype, and deepStrictEqual then
  // fails on fixtures that are structurally identical.
  vm.runInThisContext(`(function(require, module, exports) {${js}\n})`, {
    filename,
  })(require, loadedModule, loadedModule.exports);

  loaded.set(filename, loadedModule.exports);
  return loadedModule.exports;
}

const here = (name) => path.join(__dirname, name);

// ─── The fake backend ───────────────────────────────────────────────────────
// The four endpoints `resolve-location.ts` actually calls, with fixtures shaped
// for the awkward cases rather than the happy one: a roadmap with no slug (so
// its directory name has to be derived), two module titles that slugify alike,
// an empty module, and a roadmap nobody has started whose progress request
// 404s.

const ROADMAPS = [
  { id: "r1", title: "VoIP Basics", slug: "voip-basics", description: null },
  { id: "r2", title: "Networking 101", slug: "", description: null },
];

const DETAIL = {
  r1: {
    id: "r1",
    title: "VoIP Basics",
    modules: [
      {
        id: "m1",
        title: "Introduction",
        orderIndex: 0,
        moduleConcepts: [
          {
            orderIndex: 0,
            concept: { id: "c1", title: "What is VoIP", slug: "what-is-voip" },
          },
          { orderIndex: 1, concept: { id: "c2", title: "SIP Basics", slug: "" } },
        ],
      },
      { id: "m2", title: "Deep Dive", orderIndex: 1, moduleConcepts: [] },
      { id: "m3", title: "Deep  dive!", orderIndex: 2, moduleConcepts: [] },
    ],
  },
  r2: {
    id: "r2",
    title: "Networking 101",
    modules: [
      {
        id: "m9",
        title: "Basics",
        orderIndex: 0,
        moduleConcepts: [
          {
            orderIndex: 0,
            concept: { id: "c9", title: "Packets", slug: "packets" },
          },
        ],
      },
    ],
  },
};

const PROGRESS = {
  r1: {
    concepts: [
      { conceptId: "c1", status: "completed" },
      { conceptId: "c2", status: "in_progress" },
    ],
  },
  // r2 deliberately absent: an unstarted roadmap has no progress record.
};

const CONCEPTS = {
  c1: {
    id: "c1",
    title: "What is VoIP",
    content: [
      "# What is VoIP",
      "",
      "Voice over IP sends audio as packets.",
      "SIP sets up the call.",
      "RTP carries the audio.",
    ].join("\n"),
  },
  c2: {
    id: "c2",
    title: "SIP Basics",
    content: ["# SIP Basics", "", "SIP is a signalling protocol."].join("\n"),
  },
  c9: {
    id: "c9",
    title: "Packets",
    content: ["# Packets", "", "A packet has a header and a payload."].join("\n"),
  },
};

/** URLs to fail exactly once, for the "a failure must not cache" test. */
const failOnce = new Set();

function notFound(url) {
  return Object.assign(new Error(`Request failed with status code 404: ${url}`), {
    response: { status: 404 },
  });
}

function respond(url) {
  if (failOnce.has(url)) {
    failOnce.delete(url);
    throw new Error("Network Error");
  }
  if (url === "/roadmaps") return ROADMAPS;

  const detail = /^\/roadmaps\/([^/]+)$/.exec(url);
  if (detail) {
    const found = DETAIL[detail[1]];
    if (!found) throw notFound(url);
    return found;
  }

  const progress = /^\/roadmaps\/([^/]+)\/progress$/.exec(url);
  if (progress) {
    const found = PROGRESS[progress[1]];
    if (!found) throw notFound(url);
    return found;
  }

  const concept = /^\/concepts\/([^/]+)$/.exec(url);
  if (concept) {
    const found = CONCEPTS[concept[1]];
    if (!found) throw notFound(url);
    return found;
  }

  throw new Error(`unstubbed request: ${url}`);
}

stubs.set(here("request.ts"), {
  api: { get: async (url) => ({ data: respond(url) }) },
});

// ─── The modules under test ─────────────────────────────────────────────────

const L = loadFile(here("location.ts"));
const R = loadFile(here("resolve-location.ts"));
const T = loadFile(here("theme-contract.ts"));
const FS = loadFile(here("fs-commands.ts"));

/** Deliberately unlike any real theme's markers, so an assertion below can
 *  only pass if `ls` read them from here rather than knowing its own. */
const GLYPHS = {
  prompt: ">>",
  caret: "#",
  rule: "=",
  done: "<D>",
  active: "<A>",
  todo: "<T>",
  tokenOpen: "<<",
  tokenClose: ">>",
  more: (percent) => `MORE ${percent}`,
  banner: "SOURCE:DEV",
  meter: (percent) => `${percent}%`,
};

const BY_NAME = new Map();
for (const spec of FS.FS_COMMANDS) {
  BY_NAME.set(spec.name, spec);
  for (const alias of spec.aliases ?? []) BY_NAME.set(alias, spec);
}

/** A shell: one cwd that commands move, and one transcript they write to. */
function shell(start = L.ROOT) {
  let cwd = start;
  const lines = [];
  const paged = [];

  const io = {
    print: (text, kind = "out", actions) => lines.push({ text, kind, actions }),
    say: (segments, kind = "out") =>
      lines.push({
        kind,
        text: segments.map((s) => (typeof s === "string" ? s : s.label)).join(""),
        segments,
      }),
    doc: (text) => lines.push({ text, kind: "doc" }),
    status: () => {},
  };

  const sh = {
    lines,
    paged,
    get cwd() {
      return cwd;
    },
    get path() {
      return L.formatPath(cwd);
    },
    text: () => lines.map((line) => line.text),
    kinds: () => lines.map((line) => line.kind),
    only: (kind) => lines.filter((line) => line.kind === kind).map((l) => l.text),
    clear: () => {
      lines.length = 0;
      paged.length = 0;
    },
    /** Run one command. Arguments arrive already split, because splitting the
     *  line is the dispatcher's job and is tested with the dispatcher. */
    run: async (name, ...args) => {
      const spec = BY_NAME.get(name);
      assert.ok(spec, `no such command: ${name}`);
      await spec.run({
        args,
        io,
        cwd,
        setCwd: (next) => {
          cwd = next;
        },
      });
      return sh;
    },
  };

  /** Opted into per test, because half the point of `less` is that a host with
   *  no viewport still shows the lesson instead of refusing. */
  sh.withPager = () => {
    io.page = async (text, opts) => {
      paged.push({ text, title: opts?.title });
    };
    return sh;
  };

  return sh;
}

const VOIP = "/roadmaps/voip-basics";
const NET = "/roadmaps/networking-101";
const INTRO = `${VOIP}/introduction`;
const WHAT = `${INTRO}/what-is-voip`;
const SIP = `${INTRO}/sip-basics`;

beforeEach(() => {
  // Every test gets a cold cache: the fixtures never change, so a warm one
  // would quietly let a test pass on another test's requests.
  R.clearVfsCache();
  failOnce.clear();
});

// ─── The theme seam ─────────────────────────────────────────────────────────
// First, and in this order deliberately: the throw is only observable before a
// theme is installed, and every test after this one needs one installed.

test("the command layer has no glyphs of its own until one is installed", () => {
  assert.throws(() => T.activeGlyphs(), /No theme glyphs installed/);
  T.installGlyphs(GLYPHS);
  assert.equal(T.activeGlyphs().done, "<D>");
});

test("ls prints the markers the theme installed, not markers of its own", async () => {
  const sh = await shell(L.parsePath(INTRO)).run("ls");
  assert.deepEqual(sh.text(), ["<D> what-is-voip", "<A> sip-basics"]);

  // A directory has no completion state of its own, so it gets a blank of the
  // same width and the names still line up — and that width comes from the
  // theme too, not from a hardcoded three spaces in the command.
  sh.clear();
  await sh.run("ls", "/roadmaps");
  assert.deepEqual(sh.text(), ["    voip-basics/", "    networking-101/"]);
});

// ─── Names ──────────────────────────────────────────────────────────────────

test("a directory name is derived when the API has no slug for it", async () => {
  // Roadmap r2 has an empty slug and modules never have one at all, so both
  // names below had to be computed from a human title.
  const sh = await shell().run("ls", NET);
  assert.deepEqual(sh.text(), ["    basics/"]);
  assert.equal(L.isValidSegment("networking-101"), true);
});

test("slugify produces something a path will accept, always", () => {
  assert.equal(R.slugify("What is VoIP?"), "what-is-voip");
  assert.equal(R.slugify("  Deep  Dive!  "), "deep-dive");
  assert.equal(R.slugify("Café Réseau"), "cafe-reseau");
  assert.equal(R.slugify("!!!"), "untitled", "a name is never empty");
  const long = R.slugify("a".repeat(200));
  assert.equal(long.length, 64);
  // The point of all of the above: whatever a title looks like, the segment
  // derived from it is one `location.ts` will parse back.
  for (const title of ["What is VoIP?", "  Deep  Dive!  ", "Café Réseau", "!!!", "a".repeat(200)]) {
    assert.equal(L.isValidSegment(R.slugify(title)), true, title);
  }
});

test("two module titles that slugify alike get stable, distinct names", async () => {
  const first = await shell(L.parsePath(VOIP)).run("ls");
  assert.deepEqual(first.text(), [
    "    introduction/",
    "    deep-dive/",
    "    deep-dive-2/",
  ]);

  // Stable across requests: the suffix follows `orderIndex`, not whichever
  // response happened to arrive first.
  R.clearVfsCache();
  const second = await shell(L.parsePath(VOIP)).run("ls");
  assert.deepEqual(second.text(), first.text());
});

// ─── ls ─────────────────────────────────────────────────────────────────────

test("ls file prints the file — it is cd that refuses one", async () => {
  const sh = await shell(L.parsePath(INTRO)).run("ls", "what-is-voip");
  assert.deepEqual(sh.text(), [`<D> ${WHAT}`]);
  assert.deepEqual(sh.kinds(), ["out"]);
});

test("every listing row carries the command that opens it", async () => {
  const dirs = await shell(L.parsePath(VOIP)).run("ls");
  assert.deepEqual(dirs.lines[0].actions, [
    { label: "cd", command: "cd introduction" },
  ]);

  const files = await shell(L.parsePath(INTRO)).run("ls");
  assert.deepEqual(files.lines[0].actions, [
    { label: "cat", command: "cat what-is-voip" },
  ]);
});

test("an empty directory says so rather than printing nothing", async () => {
  const sh = await shell().run("ls", `${VOIP}/deep-dive`);
  assert.match(sh.text().join("\n"), /deep-dive is empty/);
  assert.deepEqual(new Set(sh.kinds()), new Set(["dim"]));
});

test("ls -l adds the human title beside the name, and drops the action", async () => {
  const sh = await shell(L.parsePath(INTRO)).run("ls", "-l");
  assert.match(sh.text()[0], /^<D> what-is-voip {2,}What is VoIP$/);
  assert.equal(sh.lines[0].actions, undefined);
});

test("ls labels each operand when there is more than one", async () => {
  const sh = await shell().run("ls", VOIP, NET);
  assert.deepEqual(sh.text(), [
    `${VOIP}:`,
    "    introduction/",
    "    deep-dive/",
    "    deep-dive-2/",
    "",
    `${NET}:`,
    "    basics/",
  ]);
});

test("an unknown option is reported the way a utility reports one", async () => {
  const short = await shell().run("ls", "-z");
  assert.deepEqual(short.text(), [
    "ls: invalid option -- 'z'",
    "usage: ls [-l] [path]",
  ]);
  assert.deepEqual(short.kinds(), ["err", "dim"]);

  const long = await shell().run("ls", "--bogus");
  assert.equal(long.text()[0], "ls: invalid option '--bogus'");
});

test("-- ends the options, so what follows is a path however it is spelled", async () => {
  const sh = await shell().run("ls", "--", "-l");
  assert.deepEqual(sh.text(), ["ls: /roadmaps/-l: No such file or directory"]);
});

test("an error blames the prefix that failed, not the whole argument", async () => {
  // `nope` is the part that does not exist. A shell says so about `nope`, not
  // about the three-segment path the user typed.
  const sh = await shell().run("ls", "voip-basics/nope/deeper");
  assert.deepEqual(sh.text(), [
    `ls: ${VOIP}/nope: No such file or directory`,
  ]);
});

// ─── cd ─────────────────────────────────────────────────────────────────────

test("cd descends, and cd .. comes back", async () => {
  const sh = shell();
  await sh.run("cd", "voip-basics");
  assert.equal(sh.path, VOIP);
  await sh.run("cd", "introduction");
  assert.equal(sh.path, INTRO);
  await sh.run("cd", "..");
  assert.equal(sh.path, VOIP);
  assert.deepEqual(sh.text(), [], "a successful cd prints nothing");
});

test("cd .. at the root stays at the root and is not an error", async () => {
  const sh = shell();
  await sh.run("cd", "..");
  await sh.run("cd", "../../..");
  assert.equal(sh.path, "/roadmaps");
  assert.deepEqual(sh.text(), []);
});

test("bare cd and cd ~ both go home from anywhere", async () => {
  const bare = shell(L.parsePath(WHAT));
  await bare.run("cd");
  assert.equal(bare.path, "/roadmaps");

  const home = shell(L.parsePath(WHAT));
  await home.run("cd", "~");
  assert.equal(home.path, "/roadmaps");
});

test("a relative path may walk up as well as down", async () => {
  const sh = await shell(L.parsePath(INTRO)).run("ls", "../..");
  assert.deepEqual(sh.text(), ["    voip-basics/", "    networking-101/"]);

  // And from a lesson, whose parent is the module containing it.
  const up = shell(L.parsePath(WHAT));
  await up.run("cd", "..");
  assert.equal(up.path, INTRO);
});

test("cd refuses a lesson with Not a directory, and does not move", async () => {
  const sh = shell(L.parsePath(INTRO));
  await sh.run("cd", "what-is-voip");
  assert.equal(sh.path, INTRO, "a refused cd leaves the user where they were");
  assert.equal(sh.text()[0], `cd: ${WHAT}: Not a directory`);
  // A dead end never leaves a bare prompt: it says what to do instead.
  assert.match(sh.text().join("\n"), /cat what-is-voip/);
});

test("cd checks the directory exists before moving, not on the next command", async () => {
  const missing = shell();
  await missing.run("cd", "nowhere");
  assert.equal(missing.path, "/roadmaps");
  assert.deepEqual(missing.text(), [
    "cd: /roadmaps/nowhere: No such file or directory",
  ]);

  const deeper = shell();
  await deeper.run("cd", "voip-basics/nope");
  assert.equal(deeper.path, "/roadmaps");
  assert.deepEqual(deeper.text(), [
    `cd: ${VOIP}/nope: No such file or directory`,
  ]);
});

test("there is no fourth level, and asking for one is an ordinary error", async () => {
  const sh = shell();
  await sh.run("cd", "voip-basics/introduction/what-is-voip/extra");
  assert.equal(sh.path, "/roadmaps");
  assert.deepEqual(sh.text(), [
    "cd: voip-basics/introduction/what-is-voip/extra: No such file or directory",
  ]);
});

test("cd takes one path", async () => {
  const sh = await shell().run("cd", "voip-basics", "networking-101");
  assert.deepEqual(sh.text(), ["cd: too many arguments"]);
  assert.equal(sh.path, "/roadmaps");
});

test("pwd prints a path that can be pasted straight back into cd", async () => {
  const walked = shell();
  await walked.run("cd", "voip-basics");
  await walked.run("cd", "introduction");
  await walked.run("pwd");
  assert.deepEqual(walked.text(), [INTRO]);

  const pasted = shell();
  await pasted.run("cd", walked.text()[0]);
  assert.deepEqual(pasted.cwd, walked.cwd);
});

// ─── The claim the architecture rests on ────────────────────────────────────

test("an absolute path from anywhere is the same operation as cd-then-act", async () => {
  const stepped = shell();
  await stepped.run("cd", "voip-basics");
  await stepped.run("cd", "introduction");
  await stepped.run("cat", "what-is-voip");
  assert.deepEqual(stepped.text(), [CONCEPTS.c1.content]);

  const direct = shell();
  await direct.run("cat", WHAT);
  assert.deepEqual(direct.text(), stepped.text());

  // And from *inside* an unrelated directory, which is the case a shell that
  // only pretends to support absolute paths gets wrong.
  const elsewhere = shell(L.parsePath(`${NET}/basics`));
  await elsewhere.run("cat", WHAT);
  assert.deepEqual(elsewhere.text(), stepped.text());
});

test("~/ is an absolute path written from home", async () => {
  const sh = await shell(L.parsePath(WHAT)).run(
    "ls",
    "~/voip-basics/introduction",
  );
  assert.deepEqual(sh.text(), ["<D> what-is-voip", "<A> sip-basics"]);
});

// ─── cat and less ───────────────────────────────────────────────────────────

test("cat concatenates, which is the whole point of the name", async () => {
  const sh = await shell(L.parsePath(INTRO)).run(
    "cat",
    "what-is-voip",
    "sip-basics",
  );
  assert.deepEqual(sh.text(), [CONCEPTS.c1.content, CONCEPTS.c2.content]);
  assert.deepEqual(sh.kinds(), ["doc", "doc"]);
});

test("cat refuses a directory and says what to use instead", async () => {
  const sh = await shell().run("cat", VOIP);
  assert.equal(sh.text()[0], `cat: ${VOIP}: Is a directory`);
  assert.match(sh.text().join("\n"), /ls /);
});

test("cat with no operand says so rather than waiting on a stdin that cannot come", async () => {
  const sh = await shell().run("cat");
  assert.deepEqual(sh.text(), ["cat: missing operand", "usage: cat <lesson>"]);
});

test("less pages through the host's viewport when it has one", async () => {
  const sh = await shell(L.parsePath(INTRO))
    .withPager()
    .run("less", "what-is-voip");
  assert.deepEqual(sh.paged, [
    { text: CONCEPTS.c1.content, title: "What is VoIP" },
  ]);
  assert.deepEqual(sh.text(), [], "the pager owns the screen, not print");
});

test("less without a viewport still shows the lesson rather than refusing", async () => {
  const sh = await shell(L.parsePath(INTRO)).run("more", "what-is-voip");
  assert.deepEqual(sh.text(), [CONCEPTS.c1.content]);
  assert.deepEqual(sh.kinds(), ["doc"]);
});


// ─── history ────────────────────────────────────────────────────────────────

test("history numbers every line from one, whether or not the list is trimmed", async () => {
  FS.recordHistory("ls");
  FS.recordHistory("cd voip-basics");
  FS.recordHistory("ls");
  FS.recordHistory("pwd");

  const all = await shell().run("history");
  assert.deepEqual(all.text(), [
    "  1  ls",
    "  2  cd voip-basics",
    "  3  ls",
    "  4  pwd",
  ]);

  // The numbers do not restart when the list is truncated: `3` is the third
  // thing typed whichever way it is asked for.
  const tail = await shell().run("history", "2");
  assert.deepEqual(tail.text(), ["  3  ls", "  4  pwd"]);
  assert.deepEqual(tail.lines[0].actions, [{ label: "run", command: "ls" }]);
});

test("consecutive duplicates collapse, the way bash ignoredups does", async () => {
  const cleared = await shell().run("history", "-c");
  assert.deepEqual(cleared.text(), ["history cleared"]);

  FS.recordHistory("ls");
  FS.recordHistory("ls");
  FS.recordHistory("  ls  ");
  FS.recordHistory("");
  FS.recordHistory("pwd");
  FS.recordHistory("ls");

  const after = await shell().run("history");
  assert.deepEqual(after.text(), ["  1  ls", "  2  pwd", "  3  ls"]);
});

test("history rejects a count that is not a count", async () => {
  const sh = await shell().run("history", "abc");
  assert.deepEqual(sh.text(), ["history: abc: numeric argument required"]);
});

test("an empty history says so", async () => {
  await shell().run("history", "-c");
  const sh = await shell().run("history");
  assert.deepEqual(sh.text(), ["history is empty"]);
});

// ─── The resolver's own edges ───────────────────────────────────────────────

test("a roadmap nobody has started lists its lessons as not started", async () => {
  // Its progress request 404s. That is a roadmap with no progress, not a
  // failure — every lesson in it is simply not started.
  const sh = await shell().run("ls", `${NET}/basics`);
  assert.deepEqual(sh.text(), ["<T> packets"]);
});

test("a failed request does not cache as a permanently empty directory", async () => {
  failOnce.add("/roadmaps");
  const failed = await shell().run("ls");
  assert.deepEqual(failed.kinds(), ["err"]);
  assert.equal(failed.text()[0], "ls: Network Error");

  // Same cache, same command, nothing cleared in between: the rejected promise
  // has to have been evicted, or this listing would be empty forever.
  const retried = await shell().run("ls");
  assert.deepEqual(retried.text(), ["    voip-basics/", "    networking-101/"]);
});

test("every filesystem command is registered once, with a usage line", () => {
  assert.deepEqual(
    FS.FS_COMMANDS.map((spec) => spec.name),
    ["pwd", "ls", "cd", "cat", "less", "history"],
  );
  for (const spec of FS.FS_COMMANDS) {
    assert.ok(spec.usage?.startsWith(spec.name), `${spec.name} usage`);
    assert.ok(spec.summary, `${spec.name} summary`);
    assert.ok(spec.group, `${spec.name} group`);
  }
});
