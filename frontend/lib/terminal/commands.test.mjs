import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Exercise the real registry without a DOM or network. TypeScript is already
// a project dependency; no test-only runtime or production package is needed.
function harness(responses = {}) {
  const writes = [];
  /** Requests that were begun. A test can assert a metered call never started,
   *  which is the whole point of validating before the generation. */
  const reads = [];
  const api = {
    get: async (url) => {
      reads.push(url);
      if (!(url in responses)) throw new Error(`Unexpected GET ${url}`);
      if (responses[url] instanceof Error) throw responses[url];
      if (typeof responses[url] === "function") return responses[url]();
      return { data: responses[url] };
    },
    post: async (url, body) => {
      writes.push({ url, body });
      if (typeof responses[url] === "function") return responses[url]();
      return { data: responses[url] };
    },
    patch: async (url, body) => {
      writes.push({ url, body, method: "patch" });
      return { data: responses[url] };
    },
    delete: async (url) => {
      writes.push({ url, method: "delete" });
      return { data: responses[url] };
    },
  };
  const cache = new Map();
  const root = path.resolve(__dirname, "../..");
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const localRequire = (name) => {
      if (name === "@/lib/api-client")
        return { __esModule: true, default: api };
      const resolved = name.startsWith("@/")
        ? path.join(root, name.slice(2))
        : path.resolve(path.dirname(filename), name);
      return load(`${resolved}.ts`);
    };
    vm.runInNewContext(
      `(function(require, module, exports) {${js}\n})`,
      { Intl, Date, console, Error, Promise },
      { filename },
    )(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  const registry = load(path.join(__dirname, "commands.ts"));
  const output = [];
  const docs = [];
  const navigation = [];
  const answers = [];
  /** Every prompt `ask` put up, in order — so a test can prove a rejected
   *  answer was re-asked rather than accepted. */
  const prompts = [];
  /** What the run indicator was told to say, in order. */
  const statuses = [];
  let logoutCount = 0;
  let refreshCount = 0;
  const ctx = {
    io: {
      // Everything is a line now: text, its kind, and the inline `[label]`
      // tokens printed at the end of it.
      print: (text, kind, actions) => output.push({ text, kind, actions }),
      // A sentence with runnable words inside it. Recorded as one line so the
      // text assertions below see it, with the runnable words also exposed as
      // `actions` — which is what the host turns them into.
      say: (segments, kind) =>
        output.push({
          text: segments
            .map((s) => (typeof s === "string" ? s : s.label))
            .join(""),
          kind,
          actions: segments.filter((s) => typeof s !== "string"),
          segments,
        }),
      status: (label) => statuses.push(label),
      doc: (markdown) => docs.push(markdown),
      clear() {},
      close() {},
      pickFile: async () => null,
      ask: async (label) => {
        prompts.push(label);
        return answers.shift() ?? "";
      },
    },
    isDark: true,
    setTheme() {},
    refreshUser: async () => {},
    logout: () => {
      logoutCount += 1;
    },
    confirmLogout: async () => false,
    navigate: (value) => navigation.push(value),
    refreshLearning: async () => {
      refreshCount += 1;
    },
  };
  /** Everything printed so far, as one string — for asserting that a phrase
   *  reached the screen without pinning it to a line index. */
  const say = () => output.map((line) => line.text).join("\n");
  const line = (pattern) => output.find((entry) => pattern.test(entry.text));
  /** The inline tokens on the first line matching `pattern`. Clicking one runs
   *  its `command`, so a test can follow the same path a student's pointer
   *  takes. */
  const tokens = (pattern) => line(pattern)?.actions ?? [];
  return {
    registry,
    ctx,
    output,
    docs,
    navigation,
    writes,
    reads,
    answers,
    prompts,
    statuses,
    say,
    line,
    tokens,
    run: (command) => registry.runCommand(command, ctx),
    get logoutCount() {
      return logoutCount;
    },
    get refreshCount() {
      return refreshCount;
    },
  };
}

/** An array built inside the vm carries that realm's `Array.prototype`, which
 *  `deepStrictEqual` treats as a mismatch even when every element agrees — and
 *  `.map`/`.slice` on one returns another of the same realm, so the boundary
 *  follows the value around. Copy into this realm before comparing shapes. */
const plain = (value) => (Array.isArray(value) ? [...value].map(plain) : value);

const roadmaps = [
  {
    id: "path-a",
    title: "Systems Programming",
    slug: "systems",
    description: "Understand the machine.",
  },
];
const concept = (id, status, prerequisites = []) => ({
  conceptId: id,
  conceptTitle: id,
  status,
  prerequisites,
  completedAt: null,
});
const progress = (concepts) => ({
  roadmapId: "path-a",
  totalConcepts: concepts.length,
  completedConcepts: 1,
  percentage: 25,
  concepts,
});

/** A lesson read costs three GETs and one start POST. Bundled so a test that
 *  only cares about the outcome does not have to restate the plumbing. The
 *  catalogue is included because `read <title>` resolves a name through it. */
const lesson = (id, extra = {}) => ({
  "/concepts": [{ id, title: id, slug: id }],
  [`/concepts/${id}`]: {
    id,
    title: id,
    content: `# ${id}\n\nBody copy.`,
    difficulty: "easy",
    appearsIn: [{ roadmapId: "path-a", roadmapTitle: "Systems Programming" }],
  },
  [`/concepts/${id}/quiz-status`]: {
    totalQuestions: 0,
    allQuestionsResolved: false,
    questions: [],
  },
  ...extra,
});

const student = {
  id: "user-1",
  name: "Ada",
  email: "ada@kip.dev",
  role: "student",
  timezone: "Asia/Kolkata",
};

test("the boot script types commands, then prints the mark", () => {
  const h = harness();
  const steps = h.registry.bootSequence(student);
  // Every step is a command the shell types at its own prompt, so the first
  // thing on screen is a prompt doing something rather than a wall of text.
  assert.ok(steps.length >= 2);
  assert.ok(steps.every((step) => step.command && step.lines.length));
  // The flattened form is what a skipped or reduced-motion boot prints in one
  // pass: each command as a `cmd` line, followed by that command's output.
  const flat = h.registry.bootLines(student);
  assert.equal(flat.filter((l) => l.kind === "cmd").length, steps.length);
  assert.equal(flat[0].kind, "cmd");
  assert.equal(flat[0].text, steps[0].command);
  // The mark arrives partway through, under a command — not before one.
  const banner = flat.findIndex((l) => l.kind === "banner");
  assert.ok(banner > 0);
  assert.ok(flat.some((l) => l.text.includes("ada@kip.dev")));
  assert.ok(flat.some((l) => l.text.includes("Asia/Kolkata")));
  // The last thing printed offers the two ways in and how to get help.
  const offered = flat.flatMap((l) => l.actions ?? []).map((a) => a.command);
  assert.deepEqual(plain(offered), ["continue", "roadmaps", "help"]);
});

test("logout waits for the modal decision; cancel preserves the session", async () => {
  const h = harness();
  await h.run("logout");
  assert.equal(h.logoutCount, 0);
  assert.ok(h.output.some((line) => line.text === "logout: cancelled"));
  h.ctx.confirmLogout = async () => true;
  await h.run("logout");
  assert.equal(h.logoutCount, 1);
});

test("inline tokens dispatch commands that work through the same registry", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    "/roadmaps/path-a/progress": progress([
      concept("intro", "completed"),
      concept("memory", "in_progress"),
    ]),
    ...lesson("memory"),
  });
  await h.run("roadmaps");
  const actions = h.tokens(/Systems Programming/);
  await h.run(actions.find((a) => a.label === "open").command);
  assert.ok(h.say().includes("memory"));
  await h.run(actions.find((a) => a.label === "continue").command);
  // The lesson is read in the terminal; nothing routes away.
  assert.match(h.docs.at(-1), /Body copy/);
  assert.ok(h.line(/^LESSON\(1\)\s+MEMORY/));
  assert.equal(h.navigation.length, 0);
});

test("failed progress is shown as unavailable, never zero or resumable", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    "/roadmaps/path-a/progress": new Error("offline"),
  });
  await h.run("roadmaps");
  // No progress bar is drawn, and the only offered verb is `open` — a path
  // whose progress failed must never look resumable. The row carries its
  // listing number between the state and the title: `[ERR]  [1] Systems …`.
  assert.ok(h.line(/\[ERR\]\s+\[1\]\s+Systems Programming/));
  assert.ok(h.say().includes("progress unavailable"));
  assert.ok(!h.say().includes("█"));
  assert.deepEqual(
    plain(h.tokens(/Systems Programming/).map((a) => a.label)),
    ["open"],
  );
});

test("continue skips locked concepts and reads the next available lesson", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    "/roadmaps/path-a/progress": progress([
      concept("locked", "in_progress", [
        { isCompletedByCurrentUser: false, title: "Prerequisite" },
      ]),
      concept("available", "not_started"),
    ]),
    ...lesson("available"),
  });
  await h.run("continue systems");
  assert.ok(h.line(/^LESSON\(1\)\s+AVAILABLE/));
  assert.equal(h.navigation.length, 0);
});

test("global continue resumes the most recently active unlocked concept", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    "/roadmaps/path-a/progress": progress([
      concept("older", "in_progress"),
      concept("latest", "in_progress"),
    ]),
    "/progress/me": [
      { conceptId: "older", status: "in_progress", updatedAt: "2026-01-01" },
      { conceptId: "latest", status: "in_progress", updatedAt: "2026-02-01" },
    ],
    ...lesson("latest"),
  });
  await h.run("continue");
  assert.ok(h.line(/^LESSON\(1\)\s+LATEST/));
  assert.ok(h.writes.some((w) => w.url === "/concepts/latest/start"));
});

test("a lesson offers its quiz and records the read without leaving the terminal", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    ...lesson("memory", {
      "/concepts/memory/quiz-status": {
        totalQuestions: 2,
        allQuestionsResolved: false,
        questions: [{ questionId: "q1", isResolved: true, isCorrect: true }],
      },
      "/roadmaps/path-a/progress": progress([concept("memory", "in_progress")]),
    }),
  });
  await h.run("read memory");
  assert.match(h.docs[0], /Body copy/);
  assert.ok(h.say().includes("knowledge check: 1/2 resolved"));
  const actions = h.tokens(/^→$/);
  assert.ok(actions.some((a) => a.command === "quiz memory"));
  // A lesson with a quiz is completed by answering it, never by hand.
  assert.ok(!actions.some((a) => a.label === "complete"));
  assert.equal(h.navigation.length, 0);
});

test("the quiz loop rejects bad input, spends attempts, and reveals the answer", async () => {
  const h = harness({
    "/concepts": [{ id: "concept-1", title: "Memory", slug: "memory" }],
    "/concepts/concept-1/questions": [
      {
        id: "q1",
        questionText: "Which value?",
        orderIndex: 1,
        options: [
          { id: "option-2", optionText: "Second", orderIndex: 2 },
          { id: "option-1", optionText: "First", orderIndex: 1 },
        ],
      },
    ],
    "/concepts/concept-1/quiz-status": {
      totalQuestions: 1,
      allQuestionsResolved: false,
      questions: [{ questionId: "q1", isResolved: false, attemptsRemaining: 1 }],
    },
    "/questions/q1/attempt": {
      isCorrect: false,
      attemptsRemaining: 0,
      correctOptionId: "option-1",
    },
  });
  h.answers.push("9", "2");
  await h.run("quiz memory");
  const attempts = h.writes.filter((w) => w.url === "/questions/q1/attempt");
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].body.selectedOptionId, "option-2");
  assert.ok(h.say().includes("Out of attempts"));
  assert.ok(h.say().includes("Correct answer: First"));
  assert.ok(h.line(/^quiz: complete — 0\/1 correct/));
});

test("asking the AI shows the answer in the terminal instead of a page", async () => {
  const h = harness({
    "/concepts": [{ id: "concept-1", title: "Memory", slug: "memory" }],
    "/concepts/concept-1/qa-questions": [
      {
        id: "thread-1",
        conceptId: "concept-1",
        userId: "user-1",
        body: "Why is the stack faster?",
        createdAt: "2026-03-01T10:00:00.000Z",
        answers: [
          {
            id: "answer-1",
            isAiAnswer: true,
            body: "Because **allocation is a pointer bump**.",
            createdAt: "2026-03-01T10:00:01.000Z",
          },
        ],
      },
    ],
  });
  h.ctx.user = { id: "user-1", name: "Student", role: "student" };
  h.answers.push("ai", "Why is the stack faster?");
  await h.run("qa ask memory");
  const posted = h.writes.find((w) => w.url.endsWith("/qa-questions"));
  assert.equal(posted.body.target, "ai");
  // The answer flows as markdown under an AI byline; the question itself
  // stays plain terminal text.
  assert.ok(h.line(/^AI\s{2}/));
  assert.match(h.docs.at(-1), /pointer bump/);
  assert.ok(h.say().includes("Why is the stack faster?"));
  assert.equal(h.navigation.length, 0);
});

test("an answered question can no longer be edited", async () => {
  const h = harness({
    "/concepts": [{ id: "concept-1", title: "Memory", slug: "memory" }],
    "/concepts/concept-1/qa-questions": [
      {
        id: "thread-1",
        conceptId: "concept-1",
        userId: "user-1",
        body: "Why is the stack faster?",
        createdAt: "2026-03-01T10:00:00.000Z",
        answers: [{ id: "a1", body: "Because.", createdAt: "2026-03-01" }],
      },
    ],
  });
  h.ctx.user = { id: "user-1", name: "Student", role: "student" };
  await h.run("qa edit thread-1");
  assert.ok(h.output.some((l) => l.kind === "err"));
  assert.equal(h.writes.length, 0);
});

test("review rejects invalid input, sends the chosen option once, and refreshes learning", async () => {
  const h = harness({
    "/review/due": [
      {
        id: "review-1",
        question: {
          conceptTitle: "Memory",
          questionText: "Which value?",
          options: [
            { id: "option-2", optionText: "Second", orderIndex: 2 },
            { id: "option-1", optionText: "First", orderIndex: 1 },
          ],
        },
      },
    ],
    "/review/review-1/answer": {
      isCorrect: true,
      xpAwarded: 2,
      newIntervalDays: 3,
    },
  });
  h.answers.push("0", "nonsense", "2");
  await h.run("review start");
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].body.selectedOptionId, "option-2");
  assert.equal(h.refreshCount, 1);
  assert.ok(h.say().includes("+2 XP"));
});

test("cancelling an interactive command performs no review write", async () => {
  const h = harness({
    "/review/due": [
      {
        id: "review-1",
        question: {
          conceptTitle: "Memory",
          questionText: "Which value?",
          options: [{ id: "option-1", optionText: "First", orderIndex: 1 }],
        },
      },
    ],
  });
  h.ctx.io.ask = async () => {
    throw new h.registry.CommandAborted();
  };
  await h.run("review start");
  assert.equal(h.writes.length, 0);
  assert.ok(h.output.some((line) => line.text === "^C"));
});

test("autocomplete discovers learning commands and unknown commands remain errors", async () => {
  const h = harness();
  assert.equal(h.registry.completeCommand("road"), "roadmaps ");
  await h.run("something-unknown");
  assert.ok(h.output.some((line) => line.kind === "err"));
  assert.equal(h.navigation.length, 0);
});

test("subcommands complete one word at a time and stop at the argument", async () => {
  const h = harness();
  const { completeCommand, subHints } = h.registry;
  // A phrase that takes no argument completes without a trailing space.
  assert.equal(completeCommand("qa unans"), "qa unanswered");
  // `open` takes an id, so completion stops there rather than inventing one.
  assert.equal(completeCommand("qa op"), "qa open ");
  assert.equal(completeCommand("profile set n"), "profile set name ");
  // A shared branch still completes: both `set` phrases agree on this word.
  assert.equal(completeCommand("profile s"), "profile set ");
  assert.equal(completeCommand("profile avatar c"), "profile avatar clear");
  // Ambiguous prefixes wait for another keystroke.
  assert.equal(completeCommand("qa a"), null);
  // Already inside an argument: nothing to complete or suggest.
  assert.equal(completeCommand("qa open thread-1"), null);
  assert.deepEqual(plain(subHints("qa open thread-1")), []);
  assert.ok(subHints("qa ").includes("qa unanswered"));
  assert.deepEqual(plain(subHints("qa m")), ["qa mine"]);
});

// ─── The five states a student actually gets stuck in ───────────────────────

/** `qa ask` up to the point of the question, with one lesson to ask about. */
const askable = {
  "/concepts": [{ id: "concept-1", title: "Memory", slug: "memory" }],
  "/concepts/concept-1/qa-questions": [],
};

test("an unrecognised answer target re-asks and never falls through to the AI", async () => {
  const h = harness(askable);
  h.ctx.user = { id: "user-1", name: "Student", role: "student" };
  // Two answers that mean nothing here, then the one that does.
  h.answers.push("maybe", "3", "instructor", "Why is the stack faster?");
  await h.run("qa ask memory");

  // Asked three times: twice rejected, once accepted.
  assert.equal(
    h.prompts.filter((p) => /Who should answer/.test(p)).length,
    3,
  );
  const refusals = h.output.filter(
    (l) => l.kind === "err" && /^invalid: enter "ai" or "instructor"/.test(l.text),
  );
  assert.equal(refusals.length, 2);

  // The decisive assertion: exactly one post, and it went where the student
  // said — an unrecognised reply must never be treated as "ai".
  const posted = h.writes.filter((w) => w.url.endsWith("/qa-questions"));
  assert.equal(posted.length, 1);
  assert.equal(posted[0].body.target, "instructor");
  assert.ok(!h.statuses.includes("asking the AI"));
});

test("a too-short question is refused before any generation is spent", async () => {
  const h = harness(askable);
  h.ctx.user = { id: "user-1", name: "Student", role: "student" };
  //          target  blank  too short  digits only    the real question
  h.answers.push("ai", "", "why?", "1234567890", "Why is the stack faster?");
  await h.run("qa ask memory");

  assert.equal(h.prompts.filter((p) => /Your question/.test(p)).length, 4);
  assert.ok(h.say().includes("nothing entered"));
  assert.ok(h.say().includes("too short"));

  // Three rejected drafts, one request. The metered call is reached once, and
  // only with the question that passed — validating after the fact would have
  // spent four of a shared daily quota.
  const posted = h.writes.filter((w) => w.url.endsWith("/qa-questions"));
  assert.equal(posted.length, 1);
  assert.equal(posted[0].body.body, "Why is the stack faster?");
  // `1234567890` clears the length bar but carries no letters, so it is held
  // back by the alphabetic check rather than slipping through on length.
  assert.ok(!h.writes.some((w) => w.body?.body === "1234567890"));
});

test("^C mid-request prints the interrupt, not a failure", async () => {
  // What axios raises when the armed signal aborts: the command unwinds
  // through the same catch as any other rejection, and must be read as the
  // user stopping it rather than the network breaking.
  const canceled = new Error("canceled");
  canceled.name = "CanceledError";
  canceled.code = "ERR_CANCELED";
  const h = harness({ "/roadmaps": canceled });
  await h.run("roadmaps");

  assert.ok(h.output.some((l) => l.text === "^C"));
  // No red line and no "that did not go through" suggestion: an interrupt is
  // not an error, and offering to retry what the user just stopped is noise.
  assert.ok(!h.output.some((l) => l.kind === "err"));
  assert.ok(!h.say().includes("did not go through"));
});

test("a cleared review queue suggests what to do instead of ending", async () => {
  const h = harness({ "/review/due-count": { dueCount: 0 } });
  await h.run("review");
  assert.ok(h.say().includes("nothing due"));
  // The dead end is a sentence with runnable verbs in it, not a bare prompt.
  const suggestion = h.output.find((l) => /Nothing to recall yet/.test(l.text));
  assert.ok(suggestion);
  assert.deepEqual(
    plain(suggestion.actions.map((a) => a.command)),
    ["continue", "roadmaps", "qa"],
  );
  // The verbs sit inside the sentence rather than in a row beneath it.
  assert.ok(suggestion.segments.some((s) => typeof s === "string"));
});

test("continue with nothing unlocked suggests the ways out", async () => {
  const h = harness({
    "/roadmaps": roadmaps,
    "/roadmaps/path-a/progress": progress([concept("done", "completed")]),
    "/progress/me": [],
  });
  await h.run("continue");
  // The lead says what happened; the sentence after it is what carries the
  // runnable verbs, so that is the line worth asserting on.
  assert.ok(h.say().includes("No unfinished, unlocked lessons"));
  const suggestion = h.output.find((l) => /Try browsing your paths/.test(l.text));
  assert.ok(suggestion);
  assert.deepEqual(
    plain(suggestion.actions.map((a) => a.command)),
    ["roadmaps", "review", "qa"],
  );
  assert.equal(h.navigation.length, 0);
});

test("TAB completes a lesson name against what has been listed", async () => {
  const h = harness();
  const { completions, indexListing } = h.registry;
  // Completion offers what the student has actually been shown, so seed the
  // index the way a listing would.
  indexListing("concept", [
    { id: "c1", title: "Memory Model" },
    { id: "c2", title: "Memory Safety" },
    { id: "c3", title: "Networking" },
  ]);

  // Zero matches: nothing is invented, and the line is left as typed.
  assert.deepEqual(plain(completions("read zzz")), []);
  // One match: the whole name, unquoted because it has no space in it.
  assert.deepEqual(plain(completions("read net")), ["read Networking"]);
  // Several: both offered, each quoted so the title survives tokenising.
  assert.deepEqual(plain(completions("read mem")), [
    'read "Memory Model"',
    'read "Memory Safety"',
  ]);
  // A bare verb and a space offers everything of that kind.
  assert.equal(plain(completions("read ")).length, 3);
  // Kinds do not cross: `open` takes a roadmap, and none has been listed.
  assert.deepEqual(plain(completions("open mem")), []);
  // A command that takes no id completes nothing here.
  assert.deepEqual(plain(completions("status mem")), []);
});
