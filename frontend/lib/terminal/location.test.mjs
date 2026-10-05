import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ==========================================================================
   location.ts — the virtual filesystem, tested on its own.

   This module is pure by design, so it needs none of the api/io harness the
   command tests build: transpile it, run it, assert on the values. That is
   the point of keeping it free of React and the router — the rules that stop
   the two modes drifting can be proven without mounting either of them.
   ========================================================================== */

function load(filename) {
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  // runInThisContext, deliberately, NOT runInNewContext: a fresh context has
  // its own Object.prototype, and deepStrictEqual compares prototypes — so
  // every location returned from the module fails against a fixture written
  // here with "same structure but not reference-equal", which reads like a
  // logic bug and is not one. The throwing `require` below is what enforces
  // purity; it does not need a separate realm to do it.
  vm.runInThisContext(
    `(function(require, module, exports) {${js}\n})`,
    { filename },
  )(() => {
    throw new Error("location.ts must not import anything");
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const L = load(path.join(__dirname, "location.ts"));

/** Every shape, as the fixtures the round-trip laws below are checked over. */
const ALL = [
  L.ROOT,
  { kind: "roadmap", roadmap: "voip-basics" },
  { kind: "module", roadmap: "voip-basics", module: "intro" },
  {
    kind: "concept",
    roadmap: "voip-basics",
    module: "intro",
    concept: "what-is-voip",
  },
];

// ─── Purity ─────────────────────────────────────────────────────────────────

test("location.ts imports nothing", () => {
  // The loader above throws on any require, so reaching here is the proof.
  // Asserted explicitly as well, because this is a property worth stating: a
  // location rule that needed React could not be tested like this.
  const source = fs.readFileSync(path.join(__dirname, "location.ts"), "utf8");
  assert.equal(/^\s*import\s/m.test(source), false);
});

// ─── Round trips ────────────────────────────────────────────────────────────

test("formatPath and parsePath round-trip every shape", () => {
  for (const loc of ALL) {
    const printed = L.formatPath(loc);
    const parsed = L.parsePath(printed);
    assert.deepEqual(parsed, loc, `round trip failed for ${printed}`);
  }
});

test("pwd output can be pasted back into cd", () => {
  for (const loc of ALL) {
    // The property a user actually relies on: what `pwd` prints is a valid
    // argument to `cd`, from anywhere.
    const printed = L.formatPath(loc);
    assert.deepEqual(L.resolvePath(L.ROOT, printed), loc);
    assert.deepEqual(L.resolvePath(ALL[3], printed), loc);
  }
});

test("root and /roadmaps are the same place", () => {
  assert.deepEqual(L.parsePath("/"), L.ROOT);
  assert.deepEqual(L.parsePath("/roadmaps"), L.ROOT);
  assert.equal(L.formatPath(L.ROOT), "/roadmaps");
});

test("trailing and repeated slashes are ignored, as in a shell", () => {
  const target = { kind: "module", roadmap: "voip-basics", module: "intro" };
  assert.deepEqual(L.parsePath("/roadmaps/voip-basics/intro/"), target);
  assert.deepEqual(L.parsePath("/roadmaps//voip-basics///intro"), target);
});

// ─── Rejection ──────────────────────────────────────────────────────────────

test("parsePath rejects what is not a location", () => {
  for (const bad of [
    "roadmaps/voip", // relative
    "/elsewhere/voip", // unknown top-level directory
    "/roadmaps/a/b/c/d", // no fourth level
    "/roadmaps/a b", // space
    '/roadmaps/a"b', // quote
    "/roadmaps/a/../../etc", // traversal, unresolved
    "", // not absolute
  ]) {
    assert.equal(L.parsePath(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
  assert.equal(L.parsePath(undefined), null);
  assert.equal(L.parsePath(42), null);
});

test("a path of only slashes is the root, as in a shell", () => {
  // Consistent with ignoring repeated slashes anywhere else in a path.
  assert.deepEqual(L.parsePath("//"), L.ROOT);
  assert.deepEqual(L.parsePath("///"), L.ROOT);
});

test("a dot segment is never a stored name", () => {
  assert.equal(L.isValidSegment("."), false);
  assert.equal(L.isValidSegment(".."), false);
  assert.equal(L.isValidSegment(""), false);
  assert.equal(L.isValidSegment("a".repeat(65)), false);
  assert.equal(L.isValidSegment("voip-basics"), true);
  assert.equal(L.isValidSegment("what_is_voip"), true);
});

// ─── Walking ────────────────────────────────────────────────────────────────

test("cd .. ascends one level from every depth", () => {
  assert.deepEqual(L.resolvePath(ALL[3], ".."), ALL[2]);
  assert.deepEqual(L.resolvePath(ALL[2], ".."), ALL[1]);
  assert.deepEqual(L.resolvePath(ALL[1], ".."), L.ROOT);
});

test("cd .. at root clamps rather than erroring", () => {
  assert.deepEqual(L.resolvePath(L.ROOT, ".."), L.ROOT);
  assert.deepEqual(L.resolvePath(L.ROOT, "../../.."), L.ROOT);
  // And a walk that ascends past root then descends again lands correctly,
  // which is the case a naive segment-count implementation gets wrong.
  assert.deepEqual(L.resolvePath(ALL[1], "../../voip-basics"), ALL[1]);
});

test("bare cd and cd ~ both go home", () => {
  for (const arg of ["", "   ", "~", undefined]) {
    assert.deepEqual(L.resolvePath(ALL[3], arg), L.ROOT);
  }
  assert.deepEqual(L.resolvePath(ALL[3], "~/voip-basics"), ALL[1]);
});

test("relative descent walks one level at a time", () => {
  assert.deepEqual(L.resolvePath(L.ROOT, "voip-basics"), ALL[1]);
  assert.deepEqual(L.resolvePath(ALL[1], "intro"), ALL[2]);
  assert.deepEqual(L.resolvePath(ALL[2], "what-is-voip"), ALL[3]);
  assert.deepEqual(L.resolvePath(L.ROOT, "voip-basics/intro/what-is-voip"), ALL[3]);
});

test("a dot segment stays put", () => {
  assert.deepEqual(L.resolvePath(ALL[2], "."), ALL[2]);
  assert.deepEqual(L.resolvePath(ALL[2], "./what-is-voip"), ALL[3]);
});

test("nothing exists below a concept", () => {
  assert.equal(L.resolvePath(ALL[3], "deeper"), null);
  assert.equal(L.childKindOf(ALL[3]), null);
  assert.equal(L.isReadable(ALL[3]), true);
  assert.equal(L.isReadable(ALL[2]), false);
});

test("an invalid segment fails the whole walk", () => {
  assert.equal(L.resolvePath(L.ROOT, 'a"b'), null);
  assert.equal(L.resolvePath(L.ROOT, "voip-basics/a b"), null);
});

// ─── Equivalence: the brief's core requirement ──────────────────────────────

test("an absolute path from anywhere equals cd-then-act", () => {
  // `cat /roadmaps/voip-basics/intro/what-is-voip` must mean the same thing
  // as three cds followed by `cat what-is-voip`, from any starting point.
  const absolute = "/roadmaps/voip-basics/intro/what-is-voip";

  const stepwise = ["voip-basics", "intro", "what-is-voip"].reduce(
    (at, step) => L.resolvePath(at, step),
    L.ROOT,
  );

  for (const start of ALL) {
    assert.deepEqual(
      L.resolvePath(start, absolute),
      stepwise,
      "absolute and step-by-step navigation must agree",
    );
  }
});

// ─── The GUI projection ─────────────────────────────────────────────────────

test("only the root has a GUI page in this build", () => {
  assert.equal(L.hasGuiPage(L.ROOT), true);
  assert.equal(L.hasGuiPage(ALL[1]), false);
  assert.equal(L.hasGuiPage(ALL[2]), false);
  assert.equal(L.hasGuiPage(ALL[3]), false);
});

test("guiFallback lands on a real page per role", () => {
  assert.equal(L.guiFallback(ALL[3], "developer"), "/developer/dashboard");
  assert.equal(L.guiFallback(ALL[3], "admin"), "/admin/dashboard");
  assert.equal(L.guiFallback(ALL[3]), "/developer/dashboard");
});

test("the projection is lossy, which is why it must not be written back", () => {
  // Every depth collapses onto one route. This test exists to document the
  // hazard: if a caller stored guiFallback's result as the user's position,
  // all three of these would become the dashboard and the concept would be
  // lost. The provider therefore leaves lastLocation untouched on a GUI
  // switch — see the round-trip test below.
  const projected = new Set(ALL.map((loc) => L.guiFallback(loc, "developer")));
  assert.equal(projected.size, 1);
});

test("a mode round-trip through GUI preserves the exact concept", () => {
  // The scenario from the brief: reading a concept, switch to GUI, switch
  // back. Nothing in this sequence may consult guiFallback for position.
  const wasAt = ALL[3];

  const stored = L.serializeLocation(wasAt);
  const shown = L.guiFallback(wasAt, "developer"); // what GUI renders
  assert.equal(shown, "/developer/dashboard");

  // Switching back reads the stored value, not the projection.
  const restored = L.deserializeLocation(stored);
  assert.deepEqual(restored, wasAt);
  assert.equal(L.sameLocation(restored, wasAt), true);
});

// ─── The CLI route ──────────────────────────────────────────────────────────

test("CLI routes round-trip through the path parameter", () => {
  for (const loc of ALL) {
    const url = L.toCliRoute(loc, "developer");
    const param = new URL(url, "http://x").searchParams.get(L.PATH_PARAM);
    assert.deepEqual(L.fromCliParam(param), loc);
  }
});

test("root is the bare terminal route, with no noise in the address bar", () => {
  assert.equal(L.toCliRoute(L.ROOT, "developer"), "/developer/terminal");
  assert.equal(L.toCliRoute(L.ROOT, "admin"), "/admin/terminal");
  assert.deepEqual(L.fromCliParam(null), L.ROOT);
  assert.deepEqual(L.fromCliParam(""), L.ROOT);
});

test("admin gets the admin terminal route at every depth", () => {
  assert.match(L.toCliRoute(ALL[3], "admin"), /^\/admin\/terminal\?/);
  assert.match(L.toCliRoute(ALL[3], "developer"), /^\/developer\/terminal\?/);
});

test("a malformed path parameter is reported, not silently rooted", () => {
  // Landing someone at the root because their link was bad is the kind of
  // quiet wrong answer this whole module exists to avoid.
  assert.equal(L.fromCliParam("%E0%A4%A"), null);
  assert.equal(L.fromCliParam("/etc/passwd"), null);
  assert.equal(L.fromCliParam("/roadmaps/a/b/c/d"), null);
});

// ─── Small helpers ──────────────────────────────────────────────────────────

test("parentOf, basename and depthOf agree with the path", () => {
  assert.deepEqual(L.parentOf(ALL[3]), ALL[2]);
  assert.deepEqual(L.parentOf(L.ROOT), L.ROOT);
  assert.equal(L.basename(ALL[3]), "what-is-voip");
  assert.equal(L.basename(L.ROOT), "/roadmaps");
  assert.deepEqual(ALL.map(L.depthOf), [0, 1, 2, 3]);
});

test("childKindOf says what ls is listing", () => {
  assert.equal(L.childKindOf(L.ROOT), "roadmap");
  assert.equal(L.childKindOf(ALL[1]), "module");
  assert.equal(L.childKindOf(ALL[2]), "concept");
});

test("isWithin recognises containment", () => {
  assert.equal(L.isWithin(ALL[3], ALL[1]), true);
  assert.equal(L.isWithin(ALL[3], L.ROOT), true);
  assert.equal(L.isWithin(ALL[1], ALL[3]), false);
  assert.equal(
    L.isWithin(ALL[3], { kind: "roadmap", roadmap: "other" }),
    false,
  );
});

test("a corrupt stored location falls back to root rather than throwing", () => {
  assert.deepEqual(L.deserializeLocation("/nonsense/x"), L.ROOT);
  assert.deepEqual(L.deserializeLocation(""), L.ROOT);
  assert.deepEqual(L.deserializeLocation(null), L.ROOT);
  assert.deepEqual(L.deserializeLocation(undefined), L.ROOT);
});
