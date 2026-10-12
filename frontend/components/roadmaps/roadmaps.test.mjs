import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const reviewRaw = {
  id: "review-1",
  dueDate: "2026-10-10",
  lastReviewedAt: null,
  intervalDays: 1,
  correctStreak: 0,
  isLeech: true,
  question: {
    id: "question-1",
    conceptId: "c2",
    conceptTitle: "Branches",
    questionText: "What does a branch point to?",
    orderIndex: 0,
    options: [
      {
        id: "o2",
        optionText: "A copied directory",
        orderIndex: 1,
        isCorrect: false,
      },
      { id: "o1", optionText: "A commit", orderIndex: 0, isCorrect: true },
    ],
  },
};
const reviewAck = {
  isCorrect: true,
  correctOptionId: "o1",
  newIntervalDays: 4,
  nextDueDate: "2026-10-14",
  xpAwarded: 2,
  isLeech: false,
};
function reviewSetup(options) {
  const h = roadmapHarness(options);
  const data = h.load(new URL("../review/review-data.ts", import.meta.url));
  const item = data.parseReviewItems([reviewRaw])[0];
  return {
    h,
    data,
    item,
    queue: {
      items: [item],
      counts: {
        count: 7,
        dueCount: 7,
        sessionCount: 1,
        heldBackCount: 4,
        unavailableCount: 2,
        leechCount: 1,
      },
    },
  };
}
test("review parsing projects learner fields and retains server order, civil dates and optional legacy counts", () => {
  const { data, item } = reviewSetup();
  assert.equal(item.question.options[0].id, "o1");
  assert.equal(item.question.options[0].isCorrect, undefined);
  assert.equal(item.question.correctOptionId, undefined);
  assert.equal(
    data.parseReviewCounts({ count: 7, dueCount: 7 }).sessionCount,
    undefined,
  );
  assert.equal(data.reviewDate("2026-10-10"), "Oct 10, 2026");
  assert.equal(
    data.parseReviewItems([
      { ...reviewRaw, question: { ...reviewRaw.question, options: [] } },
    ])[0].question.options.length,
    0,
  );
  assert.throws(
    () => data.parseReviewItems([reviewRaw, reviewRaw]),
    /incomplete/,
  );
  assert.throws(
    () => data.parseReviewItems([{ ...reviewRaw, dueDate: "2026-02-30" }]),
    /incomplete/,
  );
  assert.throws(
    () => data.parseReviewItems([{ ...reviewRaw, lastReviewedAt: "wrong" }]),
    /incomplete/,
  );
  assert.throws(
    () => data.parseReviewCounts({ count: 1, dueCount: -1 }),
    /incomplete/,
  );
});
test("review acknowledgements require actual schedule, XP and consistent answer key", () => {
  const { data, item } = reviewSetup();
  assert.equal(data.parseReviewResult(reviewAck, item, "o1").xpAwarded, 2);
  for (const patch of [
    { nextDueDate: "not-a-date" },
    { xpAwarded: undefined },
    { correctOptionId: "unknown" },
    { newIntervalDays: 0 },
    { isCorrect: false },
  ])
    assert.throws(
      () => data.parseReviewResult({ ...reviewAck, ...patch }, item, "o1"),
      /incomplete/,
    );
});
test("review queue reads are abortable, timed and never write on entry", async () => {
  const calls = [],
    signal = new AbortController().signal;
  const { h } = reviewSetup({
    api: {
      get: async (path, options) => {
        calls.push([path, options]);
        return {
          data: path.endsWith("due-count")
            ? { count: 1, dueCount: 1 }
            : [reviewRaw],
        };
      },
      post: () => assert.fail("no entry writes"),
    },
  });
  const client = h.load(new URL("../review/review-client.ts", import.meta.url));
  const queue = await client.loadReviewQueue(signal);
  assert.equal(queue.items.length, 1);
  assert.equal(calls.length, 2);
  for (const [, options] of calls) {
    assert.equal(options.signal, signal);
    assert.equal(options.timeout, 12000);
  }
});
test("review answer performs fresh due and visibility preflight before exactly one POST", async () => {
  const calls = [];
  const { h, item } = reviewSetup({
    api: {
      get: async (path) => {
        calls.push(["GET", path]);
        return { data: path === "/review/due" ? [reviewRaw] : { id: "c2" } };
      },
      post: async (path, body, options) => {
        calls.push(["POST", path, body, options]);
        return { data: reviewAck };
      },
    },
  });
  const client = h.load(new URL("../review/review-client.ts", import.meta.url));
  assert.equal(
    (await client.submitReviewAnswer(item, "o1")).result.nextDueDate,
    "2026-10-14",
  );
  assert.deepEqual(
    calls.map((c) => c.slice(0, 2)),
    [
      ["GET", "/review/due"],
      ["GET", "/concepts/c2"],
      ["POST", "/review/review-1/answer"],
    ],
  );
  assert.equal(calls[2][2].selectedOptionId, "o1");
  assert.equal(calls[2][3].timeout, 12000);
});
test("changed, missing, invalid-option or denied review sources cannot submit", async () => {
  for (const scenario of ["missing", "changed", "option", "denied"]) {
    let writes = 0;
    const { h, item } = reviewSetup({
      api: {
        get: async (path) => {
          if (path !== "/review/due" && scenario === "denied")
            throw { response: { status: 404 } };
          return {
            data:
              path === "/review/due"
                ? scenario === "missing"
                  ? []
                  : [
                      scenario === "changed"
                        ? { ...reviewRaw, intervalDays: 2 }
                        : reviewRaw,
                    ]
                : { id: "c2" },
          };
        },
        post: async () => {
          writes++;
          return { data: reviewAck };
        },
      },
    });
    const client = h.load(
      new URL("../review/review-client.ts", import.meta.url),
    );
    await assert.rejects(
      client.submitReviewAnswer(item, scenario === "option" ? "unknown" : "o1"),
    );
    assert.equal(writes, 0);
  }
});
test("uncertain review writes never retry or assume earned XP", async () => {
  for (const scenario of ["timeout", "invalid"]) {
    let writes = 0;
    const { h, item } = reviewSetup({
      api: {
        get: async (path) => ({
          data: path === "/review/due" ? [reviewRaw] : { id: "c2" },
        }),
        post: async () => {
          writes++;
          if (scenario === "timeout") throw new Error("network timeout");
          return { data: { isCorrect: true } };
        },
      },
    });
    const client = h.load(
      new URL("../review/review-client.ts", import.meta.url),
    );
    await assert.rejects(client.submitReviewAnswer(item, "o1"));
    assert.equal(writes, 1);
    assert.match(
      client.reviewError({ isAxiosError: true }),
      /may already have been saved/,
    );
  }
});
test("fresh review reconciliation never pulls held-back items into a frozen batch or counts missing as saved", () => {
  const { data, item } = reviewSetup();
  const second = { ...item, id: "review-2" },
    held = { ...item, id: "review-held" };
  const batch = data.reconcileReviewBatch([item, second], new Set([item.id]), [
    item,
    second,
    held,
  ]);
  assert.deepEqual(
    batch.map((i) => i.id),
    ["review-2"],
  );
  assert.equal(data.reconcileReviewBatch([item], new Set(), []).length, 0);
});
test("review lesson navigation uses a guarded visible placement and no progress writes", async () => {
  const calls = [];
  const { h } = reviewSetup({
    api: {
      get: async (path) => {
        calls.push(path);
        return {
          data:
            path === "/roadmaps"
              ? [sample]
              : path.startsWith("/roadmaps/")
                ? sample
                : { id: "c2" },
        };
      },
      post: () => assert.fail("no navigation writes"),
    },
  });
  const client = h.load(new URL("../review/review-client.ts", import.meta.url));
  const route = await client.reviewLessonRoute("c2");
  assert.match(route, /\/lessons\/branches$/);
  assert.equal(calls[0], "/concepts/c2");
});
test("review actual queue shows distinct server counts, remediation, honest empty and broken-option states", () => {
  const { h, queue, item } = reviewSetup();
  const View = h.load(
    new URL("../review/review-view.tsx", import.meta.url),
  ).ReviewView;
  const props = {
    queue,
    remaining: null,
    onStart() {},
    onFinish() {},
    onNext() {},
    onRefresh() {},
    onAnswer() {},
    onLesson() {},
  };
  const html = h.render(createElement(View, props));
  assert.match(html, /Total due/);
  assert.match(html, /4.*held for another session/);
  assert.match(html, /2.*unavailable/);
  assert.match(html, /Start review/);
  assert.match(html, /Revisit lesson/);
  const empty = h.render(
    createElement(View, {
      ...props,
      queue: { items: [], counts: { count: 0, dueCount: 0 } },
    }),
  );
  assert.match(empty, /Nothing is due/);
  assert.doesNotMatch(empty, /Start review/);
  const missing = h.render(
    createElement(View, { ...props, queue: { ...queue, items: [] } }),
  );
  assert.match(missing, /No answerable items/);
  assert.doesNotMatch(missing, /all caught up/);
  const broken = h.render(
    createElement(View, {
      ...props,
      queue: {
        ...queue,
        items: [{ ...item, question: { ...item.question, options: [] } }],
      },
    }),
  );
  assert.match(broken, /too few answer options/);
  assert.doesNotMatch(broken, /Start review/);
});
test("review question native controls, server-only feedback, uncertainty lock and summary are truthful", () => {
  const { h, queue, item } = reviewSetup();
  const View = h.load(
    new URL("../review/review-view.tsx", import.meta.url),
  ).ReviewView;
  const props = {
    queue,
    remaining: [item],
    onStart() {},
    onFinish() {},
    onNext() {},
    onRefresh() {},
    onAnswer() {},
    onLesson() {},
  };
  const html = h.render(createElement(View, props));
  assert.match(html, /type="radio"/);
  assert.match(html, /fieldset/);
  assert.doesNotMatch(html, /Correct answer|review saved/);
  const saved = { item, selectedOptionId: "o1", result: reviewAck };
  const confirmed = h.render(
    createElement(View, { ...props, outcome: saved, history: [saved] }),
  );
  assert.match(confirmed, /Correct answer/);
  assert.match(confirmed, /Oct 14, 2026/);
  assert.match(confirmed, /\+2 XP/);
  const failed = h.render(
    createElement(View, {
      ...props,
      error: "It may already have saved",
      blocked: true,
    }),
  );
  assert.match(failed, /fieldset disabled/);
  assert.match(failed, /Check saved queue/);
  assert.match(failed, /No result or XP has been assumed/);
  const pending = h.render(createElement(View, { ...props, pending: true }));
  assert.match(pending, /Saving answer/);
  assert.match(pending, /aria-busy="true"/);
  const summary = h.render(
    createElement(View, { ...props, remaining: [], history: [saved] }),
  );
  assert.match(summary, /not a claim that all due histories are cleared/);
});
test("review CLI handoff retains content path and direct CLI-mode route does not move location", () => {
  const mode = {
    ready: true,
    isCli: true,
    location: {
      kind: "concept",
      roadmap: "git",
      module: "basics",
      concept: "branches",
    },
  };
  const { h } = reviewSetup({
    mode,
    hooks: { useEffect: (fn) => fn(), useRef: (value) => ({ current: value }) },
  });
  const Page = h.load(
    new URL("../review/gui-review.tsx", import.meta.url),
  ).ReviewPage;
  Page();
  assert.match(
    h.calls.find((c) => c[0] === "replace")[1],
    /path=.*branches&view=review/,
  );
  assert.ok(!h.calls.some((c) => c[0] === "location"));
  const Link = h.load(
    new URL("../review/review-view.tsx", import.meta.url),
  ).ReviewCliLink;
  const link = Link();
  assert.match(link.props.href, /path=.*branches&view=review/);
  link.props.onClick();
  assert.equal(
    JSON.stringify(h.calls.at(-1)),
    JSON.stringify(["mode", "cli", { navigate: false }]),
  );
});
test("review controller reads only on mount and locks failed or pending answer mutations", () => {
  for (const mutationResult of [
    { isError: true, error: new Error("uncertain") },
    { isPending: true },
    {},
  ]) {
    const setters = [];
    let stateIndex = 0;
    const { h, queue, item } = reviewSetup();
    const controller = roadmapHarness({
      queries: {
        "review/queue": {
          data: queue,
          isPending: false,
          isFetching: false,
          isError: false,
          refetch: async () => ({ data: queue, isError: false }),
        },
      },
      mutationResult,
      hooks: {
        useState: () => {
          const index = stateIndex++;
          return [
            index === 0 ? [item] : index === 1 ? [] : undefined,
            (update) => setters.push([index, update]),
          ];
        },
        useEffect() {},
        useRef: (value) => ({ current: value }),
      },
    });
    const element = controller
      .load(new URL("../review/gui-review.tsx", import.meta.url))
      .GuiReview();
    const props = element.props.children.props.children.props;
    assert.equal(controller.calls.filter((c) => c[0] === "mutation").length, 0);
    props.onAnswer("o1");
    props.onAnswer("o1");
    const mutations = controller.calls.filter((c) => c[0] === "mutation");
    assert.equal(
      mutations.length,
      mutationResult.isError || mutationResult.isPending ? 0 : 1,
    );
    if (mutations.length) assert.equal(mutations[0][1].retry, false);
    assert.ok(!controller.calls.some((c) => c[0] === "location"));
  }
});
test("unconfirmed reviews unlock only after a successful fresh queue check", async () => {
  for (const failed of [true, false]) {
    const { queue, item } = reviewSetup();
    let stateIndex = 0;
    const updates = [];
    const h = roadmapHarness({
      queries: {
        "review/queue": {
          data: queue,
          isPending: false,
          isFetching: false,
          isError: false,
          refetch: async () => ({
            isError: failed,
            data: failed ? queue : { ...queue, items: [] },
          }),
        },
      },
      mutationResult: { isError: true, error: new Error("uncertain") },
      hooks: {
        useState: () => {
          const index = stateIndex++;
          return [
            index === 0 ? [item] : index === 1 ? [] : undefined,
            (value) => updates.push([index, value]),
          ];
        },
        useEffect() {},
        useRef: (value) => ({ current: value }),
      },
    });
    const props = h
      .load(new URL("../review/gui-review.tsx", import.meta.url))
      .GuiReview().props.children.props.children.props;
    props.onRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
    if (!failed) {
      const batch = updates.find((u) => u[0] === 0)[1];
      assert.equal(batch.length, 0);
      assert.equal(
        updates.find((u) => u[0] === 1),
        undefined,
      );
    }
  }
});
test("legacy review queues do not fabricate unavailable or difficult counts", () => {
  const { h, data, item } = reviewSetup();
  assert.equal(
    data.parseReviewItems([{ ...reviewRaw, isLeech: undefined }])[0].isLeech,
    undefined,
  );
  const View = h.load(
    new URL("../review/review-view.tsx", import.meta.url),
  ).ReviewView;
  const html = h.render(
    createElement(View, {
      queue: {
        items: [{ ...item, isLeech: undefined }],
        counts: { count: 3, dueCount: 3 },
      },
      remaining: null,
      onStart() {},
      onFinish() {},
      onNext() {},
      onRefresh() {},
      onAnswer() {},
      onLesson() {},
    }),
  );
  assert.match(html, /Not supplied by this scheduler/);
  assert.doesNotMatch(html, /held for another session|unavailable because/);
});
test("review GUI keeps orange tokens, finite motion and native focus; disabled options do not hover-highlight", () => {
  const css = readFileSync(
    new URL("../review/review.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /var\(--gui-accent\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /fieldset:not\(:disabled\) \.option:hover/);
  assert.doesNotMatch(css, /infinite/);
  const source = readFileSync(
    new URL("../review/review-view.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /preventScroll: true/);
});
test("dashboard and workspace navigation link to the guarded GUI review route", () => {
  const dashboard = readFileSync(
    new URL("../dashboard/dashboard-view.tsx", import.meta.url),
    "utf8",
  );
  assert.match(dashboard, /href="\/developer\/review"/);
  const shell = readFileSync(
    new URL("../gui/gui-workspace-shell.tsx", import.meta.url),
    "utf8",
  );
  assert.match(shell, /href: "\/developer\/review", title: "Reviews"/);
  const route = readFileSync(
    new URL("../../app/developer/review/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(route, /<ReviewPage/);
});

const requirePackage = createRequire(import.meta.url);
export const ready = (data) => ({
  data,
  pending: false,
  error: false,
  retry() {},
});
const discussionRaw = {
  id: "q-public",
  conceptId: "c2",
  askerId: "u1",
  askerName: "Sam",
  target: "discussion",
  body: "How does a branch move?",
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
  answers: [],
};
const discussionAnswer = {
  id: "a-public",
  questionId: "q-public",
  responderId: "u2",
  responderName: "Alex",
  body: "It moves to the new commit.",
  isAiAnswer: false,
  isVerified: false,
  createdAt: "2026-10-02T10:00:00Z",
  updatedAt: "2026-10-02T10:00:00Z",
};
function discussionSetup(options = {}) {
  const h = roadmapHarness(options),
    dataModule = h.load(new URL("./discussion-data.ts", import.meta.url)),
    client = h.load(new URL("./discussion-client.ts", import.meta.url));
  const snapshot = dataModule.parseDiscussion(
    { ...sampleLesson, authorId: "author" },
    { id: "u1", role: "developer" },
    [discussionRaw],
    "c2",
  );
  const entry = h.data.findModule(sample, "git", "m1"),
    lesson = h.data.findLesson(entry, "c2");
  return {
    h,
    dataModule,
    client,
    snapshot,
    entry,
    lesson,
    props: {
      roadmap: sample,
      entry,
      lesson,
      data: snapshot,
      onAction() {},
      onRefresh() {},
    },
  };
}
function discussionApi({
  questions = [discussionRaw],
  actor = { id: "u1", role: "developer" },
  parent = sample,
  write,
  reads,
} = {}) {
  return {
    get: async (path, options) => {
      reads?.push([path, options]);
      return {
        data:
          path === "/roadmaps/r1"
            ? parent
            : path === "/users/me"
              ? actor
              : path.endsWith("qa-questions")
                ? questions
                : { ...sampleLesson, authorId: "author" },
      };
    },
    post: write,
    patch: write,
    delete: write,
  };
}
test("discussion parser requires persisted privacy and rejects other users' private threads without leaking text", () => {
  const { dataModule } = discussionSetup();
  for (const patch of [
    { target: undefined },
    { target: "ai", askerId: "other" },
    { conceptId: "wrong" },
    { createdAt: "bad" },
  ])
    assert.throws(() =>
      dataModule.parseDiscussion(
        sampleLesson,
        { id: "u1", role: "developer" },
        [{ ...discussionRaw, ...patch }],
        "c2",
      ),
    );
  assert.throws(() =>
    dataModule.parseDiscussion(
      sampleLesson,
      { id: "u1", role: "developer" },
      [discussionRaw, discussionRaw],
      "c2",
    ),
  );
  const privateQ = {
    ...discussionRaw,
    target: "ai",
    answers: [
      {
        ...discussionAnswer,
        isAiAnswer: true,
        responderId: null,
        responderName: "AI Assistant",
      },
    ],
  };
  assert.equal(
    dataModule.parseDiscussion(
      sampleLesson,
      { id: "u1", role: "developer" },
      [privateQ],
      "c2",
    ).threads[0].target,
    "ai",
  );
  assert.equal(
    dataModule.parseDiscussion(
      sampleLesson,
      { id: "admin", role: "admin" },
      [privateQ],
      "c2",
    ).threads.length,
    1,
  );
});
test("discussion permissions mirror owner, answered lock, verifier and AI privacy rules", () => {
  const { snapshot, dataModule } = discussionSetup(),
    thread = snapshot.threads[0];
  assert.equal(
    dataModule.discussionPermissions(snapshot, thread).editQuestion,
    true,
  );
  assert.equal(
    dataModule.discussionPermissions(snapshot, {
      ...thread,
      answers: [discussionAnswer],
    }).editQuestion,
    false,
  );
  assert.equal(
    dataModule.discussionPermissions(snapshot, thread, discussionAnswer)
      .editAnswer,
    false,
  );
  const author = { ...snapshot, viewer: { id: "author", role: "developer" } };
  assert.equal(
    dataModule.discussionPermissions(author, thread, discussionAnswer).verify,
    true,
  );
  assert.equal(
    dataModule.discussionPermissions(
      author,
      { ...thread, target: "ai" },
      discussionAnswer,
    ).verify,
    false,
  );
  assert.equal(
    dataModule.discussionPermissions(
      { ...snapshot, viewer: { id: "admin", role: "admin" } },
      { ...thread, target: "ai" },
      { ...discussionAnswer, isAiAnswer: true },
    ).verify,
    false,
  );
});
test("discussion loading is guarded, abortable and never generates AI", async () => {
  const reads = [],
    signal = new AbortController().signal;
  const { client } = discussionSetup({
    api: discussionApi({ reads, write: () => assert.fail("no entry writes") }),
  });
  const result = await client.loadDiscussion("c2", signal);
  assert.equal(result.threads.length, 1);
  assert.equal(reads.length, 3);
  for (const [, options] of reads) {
    assert.equal(options.signal, signal);
    assert.equal(options.timeout, 12000);
  }
});
test("a new public or private question is saved once after fresh placement/account/thread checks", async () => {
  for (const target of ["discussion", "ai"]) {
    const reads = [],
      writes = [];
    const { client, snapshot, entry, lesson } = discussionSetup({
      api: discussionApi({
        reads,
        write: async (path, body, options) => {
          writes.push([path, body, options]);
          return {
            data: {
              ...discussionRaw,
              id: "q-new",
              body: body.body,
              target: body.target,
              answers:
                target === "ai"
                  ? [
                      {
                        id: "a-new",
                        questionId: "q-new",
                        responderId: null,
                        isAiAnswer: true,
                        body: "AI explanation",
                      },
                    ]
                  : [],
            },
          };
        },
      }),
    });
    const saved = await client.submitDiscussionAction(
      sample,
      "git",
      entry,
      lesson,
      snapshot,
      { kind: "ask", target, body: "  What is a branch?  " },
    );
    assert.equal(
      saved.message,
      target === "ai" ? "AI reply saved" : "Question posted",
    );
    assert.equal(writes.length, 1);
    assert.equal(reads.length, 4);
    assert.equal(writes[0][1].body, "What is a branch?");
    assert.equal(writes[0][2].timeout, target === "ai" ? 180000 : 12000);
  }
});
test("changed placement/account/privacy and blank text never perform a discussion write", async () => {
  for (const scenario of ["placement", "actor", "privacy", "blank"]) {
    const { client, snapshot, entry, lesson } = discussionSetup({
      api: discussionApi({
        parent: scenario === "placement" ? { ...sample, modules: [] } : sample,
        actor:
          scenario === "actor" ? { id: "other", role: "developer" } : undefined,
        questions:
          scenario === "privacy"
            ? [{ ...discussionRaw, target: undefined }]
            : undefined,
        write: () => assert.fail("no write before successful preflight"),
      }),
    });
    await assert.rejects(
      client.submitDiscussionAction(sample, "git", entry, lesson, snapshot, {
        kind: "ask",
        target: "discussion",
        body: scenario === "blank" ? " " : "Question",
      }),
    );
  }
});
test("discussion writes reconcile thread fingerprints and permission changes before posting", async () => {
  const { client, snapshot, entry, lesson, dataModule } = discussionSetup({
    api: discussionApi({
      questions: [{ ...discussionRaw, body: "Changed" }],
      write: () => assert.fail("no stale edit"),
    }),
  });
  await assert.rejects(
    client.submitDiscussionAction(sample, "git", entry, lesson, snapshot, {
      kind: "edit-question",
      questionId: discussionRaw.id,
      fingerprint: dataModule.threadFingerprint(snapshot.threads[0]),
      body: "Edited",
    }),
    /changed/,
  );
});
test("reply, edit, delete, verify and unverify use their exact guarded endpoints", async () => {
  for (const kind of [
    "reply",
    "edit-question",
    "delete-question",
    "edit-answer",
    "delete-answer",
    "verify",
    "unverify",
  ]) {
    const questions = [{ ...discussionRaw, answers: [discussionAnswer] }],
      writes = [];
    const { client, snapshot, entry, lesson, dataModule } = discussionSetup({
      api: discussionApi({
        questions,
        actor: { id: "admin", role: "admin" },
        write: async (path, body) => {
          writes.push(path);
          return {
            data:
              kind === "reply"
                ? { ...discussionAnswer, responderId: "admin", body: body.body }
                : kind === "edit-question"
                  ? { ...discussionRaw, body: body.body }
                  : {
                      ...discussionAnswer,
                      body: body?.body ?? discussionAnswer.body,
                      isVerified: kind === "verify",
                    },
          };
        },
      }),
    });
    const adminSnapshot = {
      ...snapshot,
      viewer: { id: "admin", role: "admin" },
      threads: dataModule.parseDiscussion(
        sampleLesson,
        { id: "admin", role: "admin" },
        questions,
        "c2",
      ).threads,
    };
    await client.submitDiscussionAction(
      sample,
      "git",
      entry,
      lesson,
      adminSnapshot,
      {
        kind,
        questionId: discussionRaw.id,
        answerId: discussionAnswer.id,
        body: "Edited",
        fingerprint: dataModule.threadFingerprint(adminSnapshot.threads[0]),
      },
    );
    assert.equal(
      writes[0],
      kind === "reply"
        ? "/qa-questions/q-public/answers"
        : kind.endsWith("question")
          ? "/qa-questions/q-public"
          : `/answers/a-public${kind === "verify" || kind === "unverify" ? `/${kind}` : ""}`,
    );
    assert.equal(writes.length, 1);
  }
});
test("AI failures and malformed save acknowledgements are uncertain and never retried", async () => {
  for (const failure of ["timeout", "quota", "invalid"]) {
    let writes = 0;
    const { client, snapshot, entry, lesson } = discussionSetup({
      api: discussionApi({
        write: async () => {
          writes++;
          if (failure !== "invalid")
            throw {
              response: failure === "quota" ? { status: 429 } : undefined,
            };
          return { data: { id: "q-new" } };
        },
      }),
    });
    await assert.rejects(
      client.submitDiscussionAction(sample, "git", entry, lesson, snapshot, {
        kind: "ask",
        target: "ai",
        body: "Why does this work?",
      }),
      (error) => error.uncertain === true,
    );
    assert.equal(writes, 1);
  }
});
test("discussion view renders truthful public/private controls, feedback and exact CLI placement", () => {
  const { h, props } = discussionSetup(),
    View = h.load(
      new URL("./discussion-view.tsx", import.meta.url),
    ).DiscussionView;
  const html = h.render(createElement(View, props));
  assert.match(html, /Public discussion/);
  assert.match(html, /Private Ask AI/);
  assert.match(html, /Your question is shared/);
  assert.match(html, /view=qa/);
  assert.match(html, /concept=c2/);
  assert.match(html, /Delete question/);
  assert.match(html, /Edit question/);
  assert.doesNotMatch(html, /AI reply saved/);
  const failed = h.render(
    createElement(View, {
      ...props,
      error: "Not confirmed",
      uncertain: true,
      canWrite: false,
    }),
  );
  assert.match(failed, /Check saved threads/);
  assert.match(failed, /role="alert"/);
});
test("private discussion view explains admin/provider access and requires explicit AI consent", () => {
  let i = 0;
  const { h, props } = discussionSetup({
    hooks: {
      useState: (initial) => [i++ === 0 ? "ai" : initial, () => {}],
      useEffect() {},
      useRef: (value) => ({ current: value }),
    },
  });
  const View = h.load(
    new URL("./discussion-view.tsx", import.meta.url),
  ).DiscussionView;
  const html = h.render(
    createElement(View, {
      ...props,
      data: {
        ...props.data,
        threads: [{ ...props.data.threads[0], target: "ai" }],
      },
    }),
  );
  assert.match(html, /visible only to you and admins/);
  assert.match(html, /configured AI provider/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /No AI reply is saved/);
  assert.doesNotMatch(html, />Reply</);
});
test("discussion controller does not write on mount, deduplicates clicks and preserves drafts on stale reads", () => {
  const { snapshot, props } = discussionSetup();
  for (const stale of [false, true]) {
    const h = roadmapHarness({
      queries: {
        "concepts/c2/discussion": {
          data: snapshot,
          isPending: false,
          isFetching: false,
          isError: stale,
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useEffect() {},
        useRef: (v) => ({ current: v }),
      },
    });
    const tree = h
      .load(new URL("./gui-discussion.tsx", import.meta.url))
      .GuiDiscussion({ ...props, name: "git" });
    const view = tree.props.children[1];
    assert.equal(h.calls.length, 0);
    view.props.onAction({
      kind: "ask",
      target: "discussion",
      body: "Question",
    });
    view.props.onAction({
      kind: "ask",
      target: "discussion",
      body: "Question",
    });
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      stale ? 0 : 1,
    );
    assert.equal(view.props.canWrite, !stale);
  }
});
test("private cached discussion is hidden on denied or incompatible refresh", () => {
  const { snapshot, props } = discussionSetup();
  const h = roadmapHarness({
    queries: {
      "concepts/c2/discussion": {
        data: snapshot,
        isPending: false,
        isError: true,
        error: { response: { status: 404 } },
      },
    },
    hooks: {
      useState: (v) => [v, () => {}],
      useEffect() {},
      useRef: (v) => ({ current: v }),
    },
  });
  const html = h.render(
    createElement(
      h.load(new URL("./gui-discussion.tsx", import.meta.url)).GuiDiscussion,
      { ...props, name: "git" },
    ),
  );
  assert.match(html, /cached threads have been hidden/);
  assert.doesNotMatch(html, /How does a branch move/);
});
test("AI uncertainty unlocks only after an explicit successful fresh thread read", async () => {
  const { snapshot, props } = discussionSetup();
  for (const failed of [true, false]) {
    const mutationResult = {};
    const h = roadmapHarness({
      mutationResult,
      queries: {
        "concepts/c2/discussion": {
          data: snapshot,
          isPending: false,
          isFetching: false,
          refetch: async () => ({ isError: failed, data: snapshot }),
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useEffect() {},
        useRef: (v) => ({ current: v }),
      },
    });
    const { DiscussionFailure } = h.load(
      new URL("./discussion-client.ts", import.meta.url),
    );
    mutationResult.error = new DiscussionFailure("uncertain", true);
    const view = h
      .load(new URL("./gui-discussion.tsx", import.meta.url))
      .GuiDiscussion({ ...props, name: "git" }).props.children[1];
    assert.equal(view.props.canWrite, false);
    view.props.onAction({ kind: "ask", target: "ai", body: "Question" });
    assert.equal(h.calls.filter((c) => c[0] === "mutation").length, 0);
    view.props.onRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
  }
});
test("question and reply drafts survive public/private channel changes without writing", () => {
  const states = [];
  let index = 0;
  const { h, props } = discussionSetup({
    hooks: {
      useState: (initial) => {
        const at = index++;
        if (!(at in states)) states[at] = initial;
        return [
          states[at],
          (value) => {
            states[at] =
              typeof value === "function" ? value(states[at]) : value;
          },
        ];
      },
      useEffect() {},
      useRef: (v) => ({ current: v }),
    },
  });
  const View = h.load(
    new URL("./discussion-view.tsx", import.meta.url),
  ).DiscussionView;
  const render = () => {
    index = 0;
    return View({
      ...props,
      onAction: () => assert.fail("no writes from switching channels"),
    });
  };
  function find(root, match) {
    if (!root) return;
    if (Array.isArray(root))
      return root.map((node) => find(node, match)).find(Boolean);
    return match(root) ? root : find(root.props?.children, match);
  }
  let tree = render();
  find(
    tree,
    (e) => e.type === "textarea" && e.props.id === "discussion-question",
  ).props.onChange({ target: { value: "Public draft" } });
  tree = render();
  find(
    tree,
    (e) => e.type === "button" && e.props.children === "Reply",
  ).props.onClick({ currentTarget: { focus() {} } });
  tree = render();
  find(
    tree,
    (e) => e.type === "textarea" && e.props.id.startsWith("reply-"),
  ).props.onChange({ target: { value: "Reply draft" } });
  tree = render();
  find(
    tree,
    (e) => e.type === "button" && e.props["aria-pressed"] === false,
  ).props.onClick();
  tree = render();
  find(
    tree,
    (e) => e.type === "textarea" && e.props.id === "discussion-question",
  ).props.onChange({ target: { value: "Private draft" } });
  tree = render();
  find(
    tree,
    (e) => e.type === "button" && e.props["aria-pressed"] === false,
  ).props.onClick();
  tree = render();
  assert.equal(
    find(
      tree,
      (e) => e.type === "textarea" && e.props.id === "discussion-question",
    ).props.value,
    "Public draft",
  );
  assert.equal(
    find(tree, (e) => e.type === "textarea" && e.props.id.startsWith("reply-"))
      .props.value,
    "Reply draft",
  );
});
test("discussion styles retain the orange theme and lesson route is wired", () => {
  const source = readFileSync(
    new URL("./discussion.module.css", import.meta.url),
    "utf8",
  );
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /var\(--gui-primary\)/);
  assert.match(
    readFileSync(new URL("./lesson-view.tsx", import.meta.url), "utf8"),
    /\/discussion/,
  );
});

const contentUser = {
  id: "author-1",
  name: "Sam",
  email: "sam@example.test",
  role: "developer",
};
const ownRoadmapRaw = {
  id: "own-1",
  title: "Foundations of Git",
  description: "Connect commits and branches.",
  createdById: contentUser.id,
  reviewStatus: "draft",
  modules: [],
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};
function contentSetup(options) {
  const h = roadmapHarness(options),
    data = h.load(new URL("../content/content-data.ts", import.meta.url)),
    client = h.load(new URL("../content/content-client.ts", import.meta.url));
  const library = data.parseContentLibrary(
    contentUser,
    [ownRoadmapRaw],
    Date.parse("2026-10-12T00:00:00Z"),
  );
  return { h, data, client, library };
}
test("own content projects only the signed-in author's roadmaps, including for admins", () => {
  const { data } = contentSetup();
  for (const role of ["developer", "admin"]) {
    const library = data.parseContentLibrary({ ...contentUser, role }, [
      ownRoadmapRaw,
      { ...ownRoadmapRaw, id: "other", createdById: "other" },
      { ...ownRoadmapRaw, id: "orphan", createdById: null },
    ]);
    assert.equal(library.roadmaps.length, 1);
    assert.equal(library.roadmaps[0].moduleCount, 0);
    assert.equal(
      library.roadmaps[0].modules,
      undefined,
      "no lesson/draft payloads cached by the presentation",
    );
  }
});
test("own library evaluates effective unpublish/deletion without inventing review readiness", () => {
  const { data } = contentSetup(),
    now = Date.parse("2026-10-12T00:00:00Z");
  const parse = (patch) =>
    data.parseOwnRoadmap(
      { ...ownRoadmapRaw, reviewStatus: "published", ...patch },
      contentUser.id,
      now,
    );
  assert.equal(parse({ unpublishStatus: "requested" }).status, "published");
  assert.equal(
    parse({
      unpublishStatus: "approved",
      unpublishEffectiveAt: "2026-10-11T00:00:00Z",
    }).status,
    "draft",
  );
  assert.equal(
    parse({
      unpublishStatus: "approved",
      unpublishEffectiveAt: "2026-10-13T00:00:00Z",
    }).status,
    "published",
  );
  assert.equal(
    parse({ deleteEffectiveAt: "2026-10-11T00:00:00Z" }).status,
    "removed",
  );
  assert.equal(parse({ reviewStatus: "submitted" }).status, "submitted");
  assert.equal(
    parse({ moduleCount: undefined, modules: undefined }).moduleCount,
    undefined,
  );
});
test("own library rejects malformed private metadata and filters without mutating catalog data", () => {
  const { data, library } = contentSetup();
  for (const patch of [
    { reviewStatus: "approved" },
    { createdAt: "bad" },
    { createdById: "other" },
  ])
    assert.throws(() =>
      data.parseOwnRoadmap(
        { ...ownRoadmapRaw, ...patch },
        contentUser.id,
        Date.now(),
      ),
    );
  assert.throws(() =>
    data.parseContentLibrary({ ...contentUser, role: "student" }, [
      ownRoadmapRaw,
    ]),
  );
  const rows = [
    ...library.roadmaps,
    {
      ...library.roadmaps[0],
      id: "own-2",
      title: "Async JavaScript",
      status: "published",
    },
  ];
  assert.equal(
    data.filterOwnRoadmaps(rows, "async", "published", "title")[0].id,
    "own-2",
  );
  assert.equal(rows[0].id, "own-1");
});
test("roadmap draft validation keeps existing limits and allows international titles", () => {
  const { data } = contentSetup();
  assert.match(data.roadmapDraftErrors(" ", "").title, /title/);
  assert.match(data.roadmapDraftErrors("x".repeat(121), "").title, /120/);
  assert.match(
    data.roadmapDraftErrors("Title", "x".repeat(2001)).description,
    /2,000/,
  );
  assert.equal(data.roadmapDraftErrors("தமிழ் கற்றல்", "").title, undefined);
});
test("content entry checks identity before abortable timed library reads, with no writes", async () => {
  const calls = [],
    signal = new AbortController().signal;
  const { client } = contentSetup({
    api: {
      get: async (path, options) => {
        calls.push([path, options]);
        return { data: path === "/users/me" ? contentUser : [ownRoadmapRaw] };
      },
      post: () => assert.fail("no entry writes"),
    },
  });
  const result = await client.loadContentLibrary(signal);
  assert.equal(result.roadmaps.length, 1);
  assert.deepEqual(
    calls.map(([p]) => p),
    ["/users/me", "/roadmaps"],
  );
  for (const [, options] of calls) {
    assert.equal(options.timeout, 12000);
    assert.equal(options.signal, signal);
  }
});
test("create private roadmap uses one POST after fresh identity and preserves the established payload", async () => {
  for (const description of ["  Connect the ideas.  ", "  "]) {
    const calls = [];
    const { client } = contentSetup({
      api: {
        get: async (path) => {
          calls.push(["GET", path]);
          return { data: contentUser };
        },
        post: async (path, body, options) => {
          calls.push(["POST", path, body, options]);
          return {
            data: {
              ...ownRoadmapRaw,
              title: body.title,
              description: body.description ?? null,
            },
          };
        },
      },
    });
    const outcome = await client.createPrivateRoadmap(contentUser, {
      title: "  New roadmap  ",
      description,
    });
    assert.equal(outcome.roadmap.status, "draft");
    assert.equal(calls.length, 2);
    assert.equal(calls[1][1], "/roadmaps");
    assert.equal(calls[1][2].title, "New roadmap");
    assert.equal(calls[1][3].timeout, 12000);
    assert.equal("description" in calls[1][2], !!description.trim());
  }
});
test("changed or unconfirmed authoring identity and invalid fields cannot create content", async () => {
  for (const scenario of ["account", "role", "malformed", "blank"]) {
    const { client } = contentSetup({
      api: {
        get: async () => ({
          data:
            scenario === "account"
              ? { ...contentUser, id: "other" }
              : scenario === "role"
                ? { ...contentUser, role: "admin" }
                : scenario === "malformed"
                  ? {}
                  : contentUser,
        }),
        post: () => assert.fail("no create"),
      },
    });
    await assert.rejects(
      client.createPrivateRoadmap(contentUser, {
        title: scenario === "blank" ? " " : "Title",
        description: "",
      }),
    );
  }
});
test("timed-out or malformed roadmap creation never retries or claims success", async () => {
  for (const scenario of ["timeout", "server", "malformed", "published"]) {
    let writes = 0;
    const { client } = contentSetup({
      api: {
        get: async () => ({ data: contentUser }),
        post: async () => {
          writes++;
          if (scenario === "timeout" || scenario === "server")
            throw {
              response: scenario === "server" ? { status: 500 } : undefined,
            };
          return {
            data:
              scenario === "malformed"
                ? {}
                : {
                    ...ownRoadmapRaw,
                    title: "Title",
                    reviewStatus: "published",
                  },
          };
        },
      },
    });
    await assert.rejects(
      client.createPrivateRoadmap(contentUser, {
        title: "Title",
        description: "",
      }),
      (error) => error.uncertain === true,
    );
    assert.equal(writes, 1);
  }
});
test("GUI content presents real statuses, roadmap editor links and honest loading/error/empty states", () => {
  const { h, library } = contentSetup(),
    View = h.load(
      new URL("../content/content-view.tsx", import.meta.url),
    ).ContentLibraryView;
  const props = { data: library, onCreate() {}, onRefresh() {} };
  const html = h.render(createElement(View, props));
  assert.match(html, /Draft · private/);
  assert.match(html, /Roadmap authoring/);
  assert.match(html, /\/developer\/content\/own-1/);
  assert.match(html, /does not run AI/);
  const loading = h.render(
    createElement(View, { ...props, data: undefined, loading: true }),
  );
  assert.match(loading, /Loading your content/);
  assert.doesNotMatch(loading, /Your first roadmap/);
  const error = h.render(
    createElement(View, {
      ...props,
      data: undefined,
      readError: "Failed to load",
    }),
  );
  assert.match(error, /Content couldn’t load/);
  assert.doesNotMatch(error, /Your first roadmap/);
  const empty = h.render(
    createElement(View, { ...props, data: { ...library, roadmaps: [] } }),
  );
  assert.match(empty, /Your first roadmap starts/);
});
test("own-content controller reads only on entry and deduplicates creation while guarding stale state", () => {
  const { library } = contentSetup();
  for (const stale of [false, true]) {
    const h = roadmapHarness({
      queries: {
        "content/mine": {
          data: library,
          isPending: false,
          isFetching: false,
          isError: stale,
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
    });
    const tree = h
        .load(new URL("../content/gui-content.tsx", import.meta.url))
        .GuiContent(),
      view = tree.props.children;
    assert.equal(h.calls.length, 0);
    view.props.onCreate({ title: "Title", description: "" });
    view.props.onCreate({ title: "Title", description: "" });
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      stale ? 0 : 1,
    );
    assert.equal(view.props.canCreate, !stale);
  }
});
test("unconfirmed creation unlocks only after explicit successful library review", async () => {
  const { library } = contentSetup();
  for (const failed of [true, false]) {
    const mutationResult = {},
      h = roadmapHarness({
        mutationResult,
        queries: {
          "content/mine": {
            data: library,
            isPending: false,
            isFetching: false,
            refetch: async () => ({ data: library, isError: failed }),
          },
        },
        hooks: {
          useState: (v) => [v, () => {}],
          useRef: (v) => ({ current: v }),
        },
      });
    const { ContentFailure } = h.load(
      new URL("../content/content-client.ts", import.meta.url),
    );
    mutationResult.error = new ContentFailure("uncertain", true);
    const view = h
      .load(new URL("../content/gui-content.tsx", import.meta.url))
      .GuiContent().props.children;
    assert.equal(view.props.canCreate, false);
    view.props.onCreate({ title: "Title", description: "" });
    assert.equal(h.calls.length, 0);
    view.props.onRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
  }
});
test("private owned content is hidden on an access-denied refresh", () => {
  const { library } = contentSetup(),
    h = roadmapHarness({
      queries: {
        "content/mine": {
          data: library,
          isPending: false,
          isError: true,
          error: { response: { status: 403 } },
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
    });
  const tree = h
    .load(new URL("../content/gui-content.tsx", import.meta.url))
    .GuiContent();
  const html = h.render(tree.props.children);
  assert.match(html, /Cached private roadmaps are hidden/);
  assert.doesNotMatch(html, /Foundations of Git/);
});
test("My content mode gate keeps the route and never writes learning location", () => {
  const h = roadmapHarness({
    mode: {
      ready: true,
      isCli: true,
      location: {
        kind: "concept",
        roadmap: "git",
        module: "basics",
        concept: "branches",
      },
    },
  });
  const tree = h
    .load(new URL("../content/gui-content.tsx", import.meta.url))
    .ContentPage();
  tree.props.children[0].props.children.props.onClick();
  assert.equal(
    JSON.stringify(h.calls.at(-1)),
    JSON.stringify(["mode", "gui", { navigate: false }]),
  );
  assert.ok(!h.calls.some((c) => c[0] === "location"));
  const css = readFileSync(
    new URL("../content/content.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /var\(--gui-primary\)/);
});

function editorRaw() {
  return {
    ...ownRoadmapRaw,
    unpublishStatus: "none",
    modules: [0, 1, 2].map((i) => ({
      id: `m${i}`,
      roadmapId: "own-1",
      title: `Module ${i + 1}`,
      orderIndex: i,
      moduleConcepts: [0, 1, 2].map((j) => ({
        id: `p${i}-${j}`,
        moduleId: `m${i}`,
        conceptId: `c${i}-${j}`,
        orderIndex: j + 1,
        concept: {
          id: `c${i}-${j}`,
          title: `Lesson ${i + 1}.${j + 1}`,
          authorId: contentUser.id,
          reviewStatus: "approved",
          draftContent: null,
          originLabel: "handwritten",
        },
      })),
    })),
  };
}
function editorReview(raw) {
  const modules = raw.modules.map((m) => ({
    moduleId: m.id,
    title: m.title,
    approved:
      m.moduleConcepts.length > 0 &&
      m.moduleConcepts.every((p) => p.concept.reviewStatus === "approved"),
    concepts: m.moduleConcepts.map((p) => ({
      id: p.conceptId,
      title: p.concept.title,
      reviewStatus: p.concept.reviewStatus,
      hasPendingDraft: p.concept.draftContent != null,
    })),
  }));
  const concepts = modules.flatMap((m) => m.concepts),
    pendingCount = concepts.filter((c) => c.reviewStatus === "pending").length,
    rejectedCount = concepts.filter(
      (c) => c.reviewStatus === "rejected",
    ).length;
  return {
    roadmapId: raw.id,
    title: raw.title,
    reviewStatus: raw.reviewStatus,
    modules,
    moduleCount: modules.length,
    conceptCount: concepts.length,
    pendingCount,
    rejectedCount,
    canPublish:
      raw.reviewStatus === "submitted" && !pendingCount && !rejectedCount,
  };
}
function editorSetup(options = {}, raw = editorRaw()) {
  const h = roadmapHarness(options),
    data = h.load(new URL("../content/editor-data.ts", import.meta.url)),
    client = h.load(new URL("../content/editor-client.ts", import.meta.url));
  const editor = data.parseEditorData(
    contentUser,
    raw,
    editorReview(raw),
    raw.id,
  );
  return { h, data, client, editor, raw };
}
test("editor projection validates owned placement/review and keeps metadata only", () => {
  const raw = editorRaw();
  raw.modules[0].moduleConcepts[0].concept.content = "secret body";
  raw.modules[0].moduleConcepts[0].concept.draftContent = "";
  const { data, editor } = editorSetup({}, raw);
  assert.equal(editor.modules[0].lessons[0].hasPendingDraft, true);
  assert.equal(editor.modules[0].lessons[0].content, undefined);
  assert.equal(editor.modules[0].lessons[0].draftContent, undefined);
  for (const mutate of [
    (r) => {
      r.createdById = "other";
    },
    (r) => {
      r.modules[0].roadmapId = "other";
    },
    (r) => {
      r.modules[0].moduleConcepts[0].moduleId = "other";
    },
    (r) => {
      r.modules[0].moduleConcepts[0].concept.authorId = "other";
    },
    (r) => {
      r.modules.push(r.modules[0]);
    },
    (r) => {
      r.modules[0].moduleConcepts.push(r.modules[0].moduleConcepts[0]);
    },
    (r) => {
      r.modules = undefined;
    },
    (r) => {
      r.deleteEffectiveAt = "2020-01-01T00:00:00Z";
    },
  ]) {
    const invalid = editorRaw();
    mutate(invalid);
    assert.throws(() =>
      data.parseEditorData(contentUser, invalid, editorReview(raw), raw.id),
    );
  }
  assert.throws(() =>
    data.parseEditorData(
      contentUser,
      raw,
      { ...editorReview(raw), pendingCount: 1 },
      raw.id,
    ),
  );
  assert.throws(() =>
    data.parseEditorData(
      contentUser,
      raw,
      { ...editorReview(raw), canPublish: true },
      raw.id,
    ),
  );
});
test("editor search excludes other/unowned lessons even for admin and checks duplicate metadata", () => {
  const { data } = editorSetup(),
    lesson = editorRaw().modules[0].moduleConcepts[0].concept;
  assert.equal(
    data.parseOwnLessons(
      [
        lesson,
        { ...lesson, id: "foreign", authorId: "other" },
        { ...lesson, id: "orphan", authorId: null },
      ],
      contentUser.id,
    ).length,
    1,
  );
  assert.throws(
    () => data.parseOwnLessons([lesson, lesson], contentUser.id),
    /Duplicate/,
  );
  assert.throws(() =>
    data.parseOwnLessons(
      [{ ...lesson, reviewStatus: "made-up" }],
      contentUser.id,
    ),
  );
  // Admin list responses expose the real generation boolean, while detail
  // responses add the transient label. Both must yield the same preflight data.
  for (const generated of [true, false]) {
    const adminList = {
      ...lesson,
      originLabel: undefined,
      isAiGenerated: generated,
    };
    const detail = {
      ...adminList,
      originLabel: generated ? "ai" : "handwritten",
    };
    assert.equal(
      JSON.stringify(data.parseEditorLesson(adminList, contentUser.id)),
      JSON.stringify(data.parseEditorLesson(detail, contentUser.id)),
    );
  }
});
test("editor orders legacy zero indices without mutating and checks submission minimums", () => {
  const raw = editorRaw();
  raw.modules.reverse();
  const { data, editor } = editorSetup({}, raw);
  assert.equal(editor.modules[0].id, "m0");
  assert.equal(raw.modules[0].id, "m2");
  assert.equal(data.submissionIssues(editor).length, 0);
  assert.equal(
    data.submissionIssues({ ...editor, modules: editor.modules.slice(0, 2) })
      .length,
    1,
  );
  const empty = { ...editor, modules: [{ ...editor.modules[0], lessons: [] }] };
  assert.equal(data.submissionIssues(empty).length, 2);
  assert.equal(data.moduleTitleError("  模块  "), undefined);
  assert.ok(data.moduleTitleError(" "));
  assert.ok(data.moduleTitleError("a".repeat(121)));
});
test("editor reads account and normalizing review before detail, with abort/timeout and no explicit writes", async () => {
  const raw = editorRaw(),
    calls = [],
    signal = new AbortController().signal;
  const { client } = editorSetup({
    api: {
      get: async (path, opts) => {
        calls.push([path, opts]);
        return {
          data:
            path === "/users/me"
              ? contentUser
              : path.endsWith("/review")
                ? editorReview(raw)
                : raw,
        };
      },
      post: () => assert.fail("entry write"),
    },
  });
  await client.loadRoadmapEditor(raw.id, signal);
  assert.deepEqual(
    calls.map((c) => c[0]),
    ["/users/me", "/roadmaps/own-1/review", "/roadmaps/own-1"],
  );
  assert.ok(
    calls.every((c) => c[1].signal === signal && c[1].timeout === 12000),
  );
  const searched = [];
  const setup = editorSetup({
    api: {
      get: async (path, opts) => {
        searched.push([path, opts]);
        return {
          data:
            path === "/users/me"
              ? contentUser
              : [raw.modules[0].moduleConcepts[0].concept],
        };
      },
    },
  });
  assert.equal(
    (await setup.client.searchOwnLessons(setup.editor, " Lesson ", signal))
      .length,
    1,
  );
  assert.equal(searched[1][0], "/concepts?search=Lesson");
  await setup.client.searchOwnLessons(setup.editor, "x", signal);
  assert.equal(searched.length, 2);
});
test("module append uses next actual order and one POST, then checks saved state", async () => {
  let raw = editorRaw();
  raw.modules[2].orderIndex = 9;
  const calls = [],
    before = structuredClone(raw);
  const { client, editor } = editorSetup(
    {
      api: {
        get: async (path, opts) => {
          calls.push(["GET", path, opts]);
          return {
            data:
              path === "/users/me"
                ? contentUser
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
          };
        },
        post: async (path, body, opts) => {
          calls.push(["POST", path, body, opts]);
          const saved = {
            id: "m-new",
            roadmapId: raw.id,
            ...body,
            moduleConcepts: [],
          };
          raw = { ...raw, modules: [...raw.modules, saved] };
          return { data: saved };
        },
      },
    },
    before,
  );
  const outcome = await client.runEditorAction(editor, {
    kind: "module",
    title: "  Next module  ",
  });
  assert.equal(outcome.data.modules.at(-1).title, "Next module");
  assert.equal(calls.filter((c) => c[0] === "POST").length, 1);
  assert.equal(calls[3][2].orderIndex, 10);
  assert.equal(calls[3][3].timeout, 12000);
  assert.equal(calls.filter((c) => c[0] === "GET").length, 6);
});
test("changed account, stale tree, invalid module and published detach block before any write", async () => {
  for (const scenario of [
    "account",
    "tree",
    "module",
    "published",
    "minimums",
  ]) {
    const before = editorRaw(),
      raw = structuredClone(before);
    let writes = 0;
    if (scenario === "published") {
      before.reviewStatus = "published";
      raw.reviewStatus = "published";
    }
    if (scenario === "tree") raw.title = "Changed";
    if (scenario === "minimums") {
      before.modules = [];
      raw.modules = [];
    }
    const { client, editor } = editorSetup(
      {
        api: {
          get: async (path) => ({
            data:
              path === "/users/me"
                ? {
                    ...contentUser,
                    id: scenario === "account" ? "other" : contentUser.id,
                  }
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
          }),
          post: () => {
            writes++;
          },
          delete: () => {
            writes++;
          },
        },
      },
      before,
    );
    const action =
      scenario === "published"
        ? { kind: "detach", moduleId: "m0", conceptId: "c0-0" }
        : scenario === "module"
          ? { kind: "detach", moduleId: "missing", conceptId: "c0-0" }
          : scenario === "minimums"
            ? { kind: "submit" }
            : { kind: "module", title: "New" };
    await assert.rejects(client.runEditorAction(editor, action));
    assert.equal(writes, 0);
  }
});
test("attachment checks fresh own lesson and saves exactly one placement", async () => {
  let raw = editorRaw();
  const lesson = {
      ...raw.modules[0].moduleConcepts[0].concept,
      id: "new-lesson",
      title: "New lesson",
    },
    calls = [];
  const { client, data, editor } = editorSetup({
    api: {
      get: async (path) => {
        calls.push(["GET", path]);
        return {
          data:
            path === "/users/me"
              ? contentUser
              : path.startsWith("/concepts/")
                ? lesson
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
        };
      },
      post: async (path, body) => {
        calls.push(["POST", path, body]);
        const placement = {
          id: "new-placement",
          moduleId: "m0",
          conceptId: body.conceptId,
          orderIndex: 4,
          concept: lesson,
        };
        raw.modules[0].moduleConcepts.push(placement);
        return { data: placement };
      },
    },
  });
  const result = await client.runEditorAction(editor, {
    kind: "attach",
    moduleId: "m0",
    lesson: data.parseEditorLesson(lesson, contentUser.id),
  });
  assert.equal(result.data.modules[0].lessons.length, 4);
  assert.equal(calls[3][1], "/concepts/new-lesson");
  assert.equal(calls[4][1], "/modules/m0/concepts");
  assert.equal(calls.filter((c) => c[0] === "POST").length, 1);
});
test("foreign, changed, already attached lesson cannot be attached", async () => {
  for (const scenario of ["foreign", "changed", "attached"]) {
    const raw = editorRaw(),
      chosen = {
        ...raw.modules[0].moduleConcepts[0].concept,
        id: scenario === "attached" ? "c0-0" : "chosen",
      };
    let writes = 0;
    const current = {
      ...chosen,
      authorId: scenario === "foreign" ? "other" : chosen.authorId,
      title: scenario === "changed" ? "Different" : chosen.title,
    };
    const { client, data, editor } = editorSetup(
      {
        api: {
          get: async (path) => ({
            data:
              path === "/users/me"
                ? contentUser
                : path.startsWith("/concepts/")
                  ? current
                  : path.endsWith("/review")
                    ? editorReview(raw)
                    : raw,
          }),
          post: () => {
            writes++;
          },
        },
      },
      raw,
    );
    await assert.rejects(
      client.runEditorAction(editor, {
        kind: "attach",
        moduleId: "m0",
        lesson: data.parseEditorLesson(chosen, contentUser.id),
      }),
    );
    assert.equal(writes, 0);
  }
});
test("detach confirms saved absence with one DELETE and keeps other placements", async () => {
  const raw = editorRaw(),
    writes = [];
  const { client, editor } = editorSetup(
    {
      api: {
        get: async (path) => ({
          data:
            path === "/users/me"
              ? contentUser
              : path.endsWith("/review")
                ? editorReview(raw)
                : raw,
        }),
        delete: async (path, opts) => {
          writes.push([path, opts]);
          raw.modules[0].moduleConcepts.shift();
          return { data: undefined };
        },
      },
    },
    raw,
  );
  const result = await client.runEditorAction(editor, {
    kind: "detach",
    moduleId: "m0",
    conceptId: "c0-0",
  });
  assert.equal(result.data.modules[0].lessons.length, 2);
  assert.equal(result.data.modules[1].lessons.length, 3);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "/modules/m0/concepts/c0-0");
});
test("submit/request/withdraw confirm real lifecycle responses and fresh state", async () => {
  for (const kind of ["submit", "request-unpublish", "cancel-unpublish"]) {
    const raw = editorRaw();
    if (kind !== "submit") raw.reviewStatus = "published";
    if (kind === "cancel-unpublish") raw.unpublishStatus = "requested";
    let writes = 0;
    const { client, editor } = editorSetup(
      {
        api: {
          get: async (path) => ({
            data:
              path === "/users/me"
                ? contentUser
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
          }),
          post: async (path) => {
            writes++;
            assert.ok(path.endsWith(`/${kind}`));
            if (kind === "submit") raw.reviewStatus = "submitted";
            else
              raw.unpublishStatus =
                kind === "request-unpublish" ? "requested" : "none";
            return { data: raw };
          },
        },
      },
      raw,
    );
    const result = await client.runEditorAction(editor, { kind });
    assert.equal(writes, 1);
    assert.ok(result.message);
    assert.equal(
      result.data.roadmap.status,
      kind === "submit" ? "submitted" : "published",
    );
  }
});
test("write timeout/5xx/malformed ack/missing saved state lock uncertainty; refusals remain definitive", async () => {
  for (const scenario of [
    "network",
    "server",
    "timeout",
    "ack",
    "read",
    "missing",
    "denied",
    "bad",
  ]) {
    const raw = editorRaw();
    let writes = 0;
    const { client, editor } = editorSetup(
      {
        api: {
          get: async (path) => {
            if (scenario === "read" && writes) throw new Error("offline");
            return {
              data:
                path === "/users/me"
                  ? contentUser
                  : path.endsWith("/review")
                    ? editorReview(raw)
                    : raw,
            };
          },
          post: async () => {
            writes++;
            if (
              ["network", "server", "timeout", "denied", "bad"].includes(
                scenario,
              )
            )
              throw scenario === "network"
                ? new Error()
                : {
                    response: {
                      status:
                        scenario === "server"
                          ? 503
                          : scenario === "timeout"
                            ? 408
                            : scenario === "denied"
                              ? 403
                              : 400,
                    },
                  };
            return {
              data:
                scenario === "ack"
                  ? {}
                  : {
                      id: "new",
                      roadmapId: raw.id,
                      title: "New",
                      orderIndex: 3,
                    },
            };
          },
        },
      },
      raw,
    );
    await assert.rejects(
      client.runEditorAction(editor, { kind: "module", title: "New" }),
      (error) => {
        assert.equal(error.uncertain, !["denied", "bad"].includes(scenario));
        assert.equal(error.unavailable, scenario === "denied");
        return true;
      },
    );
    assert.equal(writes, 1);
  }
});
test("editor GUI shows real structure/review, explicit classic lesson destinations and honest load/error states", () => {
  const { h, editor } = editorSetup(),
    View = h.load(
      new URL("../content/editor-view.tsx", import.meta.url),
    ).RoadmapEditorView;
  const props = { data: editor, onAction() {}, onSearch() {}, onRefresh() {} };
  const html = h.render(createElement(View, props));
  assert.match(html, /9 lesson placements/);
  assert.match(html, /Before you submit/);
  assert.match(html, /\/developer\/concepts\/c0-0\/edit/);
  assert.match(html, /does not generate lessons/);
  const loading = h.render(
    createElement(View, { ...props, data: undefined, loading: true }),
  );
  assert.match(loading, /Loading your roadmap/);
  assert.doesNotMatch(loading, /0 modules/);
  const empty = h.render(
    createElement(View, { ...props, data: { ...editor, modules: [] } }),
  );
  assert.match(empty, /first chapter/);
  assert.match(empty, /Add at least 3 modules/);
  const published = h.render(
    createElement(View, {
      ...props,
      data: { ...editor, roadmap: { ...editor.roadmap, status: "published" } },
    }),
  );
  assert.doesNotMatch(published, /Detach Lesson/);
  assert.match(published, /Request takedown/);
  const uncertain = h.render(
    createElement(View, {
      ...props,
      error: "Maybe saved",
      uncertain: true,
      canWrite: false,
    }),
  );
  assert.match(uncertain, /change isn’t confirmed/);
  assert.match(uncertain, /disabled=""/);
});
test("editor controller deduplicates same-tick actions and pauses stale writes", () => {
  const { editor } = editorSetup();
  for (const stale of [false, true]) {
    const h = roadmapHarness({
      queries: {
        "content/editor/own-1": {
          data: editor,
          isPending: false,
          isFetching: false,
          isError: stale,
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
    });
    const view = h
      .load(new URL("../content/gui-roadmap-editor.tsx", import.meta.url))
      .GuiRoadmapEditor({ roadmapId: "own-1" }).props.children;
    view.props.onAction({ kind: "module", title: "New" });
    view.props.onAction({ kind: "module", title: "New" });
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      stale ? 0 : 1,
    );
    assert.equal(view.props.canWrite, !stale);
    assert.ok(h.queryCalls.every((q) => q.retry === false));
  }
});
test("editor uncertainty requires explicit successful recovery and hides access/contract failures", async () => {
  const { editor } = editorSetup();
  for (const failed of [false, true]) {
    const mutationResult = {},
      h = roadmapHarness({
        mutationResult,
        queries: {
          "content/editor/own-1": {
            data: editor,
            isPending: false,
            isFetching: false,
            refetch: async () => ({ data: editor, isError: failed }),
          },
        },
        hooks: {
          useState: (v) => [v, () => {}],
          useRef: (v) => ({ current: v }),
        },
      });
    const { ContentFailure } = h.load(
      new URL("../content/content-client.ts", import.meta.url),
    );
    mutationResult.error = new ContentFailure("uncertain", true);
    const view = h
      .load(new URL("../content/gui-roadmap-editor.tsx", import.meta.url))
      .GuiRoadmapEditor({ roadmapId: "own-1" }).props.children;
    assert.equal(view.props.canWrite, false);
    view.props.onAction({ kind: "submit" });
    assert.equal(h.calls.length, 0);
    view.props.onRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
  }
  const h = roadmapHarness({
    queries: {
      "content/editor/own-1": {
        data: editor,
        isError: true,
        error: { response: { status: 403 } },
      },
    },
    hooks: { useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }) },
  });
  const tree = h
    .load(new URL("../content/gui-roadmap-editor.tsx", import.meta.url))
    .GuiRoadmapEditor({ roadmapId: "own-1" });
  const html = h.render(tree.props.children);
  assert.match(html, /Cached private content is hidden/);
  assert.doesNotMatch(html, /Lesson 1/);
});
test("checked roadmap changes dismiss an old confirmation without clearing a module draft", () => {
  const { editor } = editorSetup(),
    refs = [],
    updates = [],
    effects = [];
  let stateIndex = 0,
    refIndex = 0,
    confirmationOpen = false,
    focusCount = 0;
  const pendingConfirmation = {
    action: { kind: "submit" },
    title: "Submit this roadmap?",
    description: "Original checked state",
  };
  const h = roadmapHarness({
    hooks: {
      useState: (initial) => {
        const index = stateIndex++;
        return [
          index === 0
            ? "Keep my draft"
            : index === 6 && confirmationOpen
              ? pendingConfirmation
              : initial,
          (value) => updates.push([index, value]),
        ];
      },
      useRef: (initial) => {
        const index = refIndex++;
        return refs[index] ?? (refs[index] = { current: initial });
      },
      useEffect: (callback) => effects.push(callback),
    },
  });
  const View = h.load(
    new URL("../content/editor-view.tsx", import.meta.url),
  ).RoadmapEditorView;
  const props = { data: editor, onAction() {}, onSearch() {}, onRefresh() {} };
  View(props);
  effects.splice(0).forEach((effect) => effect());
  refs[5].current = { focus: () => focusCount++ };
  confirmationOpen = true;
  stateIndex = 0;
  refIndex = 0;
  View({ ...props, data: { ...editor, loadedAt: "2026-10-12T18:00:00Z" } });
  effects.splice(0).forEach((effect) => effect());
  assert.ok(updates.some(([index, value]) => index === 6 && value === null));
  assert.ok(!updates.some(([index]) => index === 0));
  assert.equal(focusCount, 1);
});
test("editor mode remains on route without changing learner location and native theme/motion is scoped", () => {
  const h = roadmapHarness({ mode: { ready: true, isCli: true } });
  const tree = h
    .load(new URL("../content/gui-roadmap-editor.tsx", import.meta.url))
    .RoadmapEditorPage({ roadmapId: "own-1" });
  tree.props.children[0].props.children.props.onClick();
  assert.equal(
    JSON.stringify(h.calls.at(-1)),
    JSON.stringify(["mode", "gui", { navigate: false }]),
  );
  assert.ok(!h.calls.some((c) => c[0] === "location"));
  const css = readFileSync(
    new URL("../content/editor.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /var\(--gui-primary\)/);
});

const newLessonDraft = {
  title: " A clear connection ",
  content: "  ## One idea\n\nExplain it with a concrete example.\n",
  difficulty: "medium",
};
const createdLessonRaw = {
  id: "created-lesson",
  title: newLessonDraft.title.trim(),
  content: newLessonDraft.content,
  difficulty: "medium",
  slug: "a-clear-connection",
  authorId: contentUser.id,
  reviewStatus: "pending",
  draftContent: null,
  isAiGenerated: false,
  rejectionReason: null,
  createdAt: "2026-10-12T00:00:00Z",
};
const standaloneRequest = { moduleId: null, roadmapId: null, invalid: false };
const linkedRequest = { moduleId: "m0", roadmapId: "own-1", invalid: false };
function newLessonSetup(options = {}, linked = false, raw = editorRaw()) {
  const h = roadmapHarness(options),
    data = h.load(new URL("../content/new-lesson-data.ts", import.meta.url)),
    client = h.load(
      new URL("../content/new-lesson-client.ts", import.meta.url),
    );
  const context = {
    user: contentUser,
    request: linked ? linkedRequest : standaloneRequest,
    loadedAt: "2026-10-12T00:00:00Z",
    ...(linked
      ? {
          target: {
            editor: h
              .load(new URL("../content/editor-data.ts", import.meta.url))
              .parseEditorData(contentUser, raw, editorReview(raw), raw.id),
            moduleId: "m0",
          },
        }
      : {}),
  };
  return { h, data, client, context };
}
test("new lesson target params reject repeated, blank, unsafe and incomplete targets", () => {
  const { data } = newLessonSetup();
  assert.equal(
    JSON.stringify(data.lessonTargetRequest({})),
    JSON.stringify(standaloneRequest),
  );
  assert.equal(data.lessonTargetRequest({ moduleId: "m0" }).moduleId, "m0");
  for (const query of [
    { moduleId: ["m0", "m1"] },
    { moduleId: "../m0" },
    { moduleId: "" },
    { roadmapId: "own-1" },
    { moduleId: "m0", roadmapId: ["own-1"] },
  ])
    assert.equal(data.lessonTargetRequest(query).invalid, true);
});
test("new lesson validation preserves existing limits, international title and raw Markdown", () => {
  const { data } = newLessonSetup();
  assert.equal(
    data.lessonDraftErrors({ ...newLessonDraft, title: "  学习  " }).title,
    undefined,
  );
  assert.ok(data.lessonDraftErrors({ ...newLessonDraft, title: " " }).title);
  assert.ok(
    data.lessonDraftErrors({ ...newLessonDraft, title: "x".repeat(201) }).title,
  );
  assert.ok(
    data.lessonDraftErrors({ ...newLessonDraft, content: "Short" }).content,
  );
  assert.ok(
    data.lessonDraftErrors({ ...newLessonDraft, difficulty: "invented" })
      .difficulty,
  );
  assert.equal(data.lessonDraftErrors(newLessonDraft).content, undefined);
});
test("creation acknowledgement requires actual owner, body, difficulty, pending manual status and projects metadata only", () => {
  const { data } = newLessonSetup(),
    saved = data.parseLessonCreation(
      createdLessonRaw,
      contentUser.id,
      newLessonDraft,
    );
  assert.equal(saved.content, undefined);
  assert.equal(saved.draftContent, undefined);
  assert.equal(saved.originLabel, "handwritten");
  for (const patch of [
    { authorId: "other" },
    { content: "different text" },
    { title: "different" },
    { difficulty: "hard" },
    { reviewStatus: "approved" },
    { draftContent: "staged" },
    { isAiGenerated: true },
    { originLabel: "ai" },
    { createdAt: "invalid" },
  ])
    assert.throws(() =>
      data.parseLessonCreation(
        { ...createdLessonRaw, ...patch },
        contentUser.id,
        newLessonDraft,
      ),
    );
  const international = { ...newLessonDraft, title: "学习连接" };
  const unicodeSaved = data.parseLessonCreation(
    { ...createdLessonRaw, title: international.title, slug: "" },
    contentUser.id,
    international,
  );
  assert.equal(unicodeSaved.title, international.title);
  assert.equal(unicodeSaved.slug, undefined);
});
test("legacy module-only links resolve one owned parent; foreign, overdue and duplicate placements refuse", () => {
  const { data } = newLessonSetup(),
    raw = editorRaw();
  assert.equal(
    data.findOwnedModuleRoadmap(
      [raw, { ...raw, id: "foreign", createdById: "other" }],
      contentUser.id,
      "m0",
    ),
    "own-1",
  );
  for (const rows of [
    [],
    [{ ...raw, createdById: "other" }],
    [{ ...raw, modules: undefined }],
    [{ ...raw, deleteEffectiveAt: "2020-01-01T00:00:00Z" }],
    [raw, raw],
    [{ ...raw, modules: [{ ...raw.modules[0], roadmapId: "foreign" }] }],
  ])
    assert.throws(() =>
      data.findOwnedModuleRoadmap(rows, contentUser.id, "m0"),
    );
});
test("new lesson entry reads only account without target and guards linked parent with abort/timeout", async () => {
  const raw = editorRaw(),
    calls = [],
    signal = new AbortController().signal;
  const { client } = newLessonSetup({
    api: {
      get: async (path, opts) => {
        calls.push([path, opts]);
        return {
          data:
            path === "/users/me"
              ? contentUser
              : path === "/roadmaps"
                ? [raw]
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
        };
      },
      post: () => assert.fail("no entry write"),
    },
  });
  await client.loadNewLessonContext(standaloneRequest, signal);
  assert.equal(calls.length, 1);
  await client.loadNewLessonContext(
    { moduleId: "m0", roadmapId: null, invalid: false },
    signal,
  );
  assert.ok(calls.some((c) => c[0] === "/roadmaps"));
  assert.ok(
    calls.every((c) => c[1].signal === signal && c[1].timeout === 12000),
  );
  assert.ok(calls.at(-1)[0].endsWith("/own-1"));
});
test("standalone lesson creation uses one POST after fresh identity and preserves body whitespace", async () => {
  const calls = [],
    { client, context } = newLessonSetup({
      api: {
        get: async (path) => {
          calls.push(["GET", path]);
          return { data: contentUser };
        },
        post: async (path, body, opts) => {
          calls.push(["POST", path, body, opts]);
          return { data: createdLessonRaw };
        },
      },
    });
  const saved = await client.createNewLesson(context, newLessonDraft);
  assert.equal(saved.attachment, "none");
  assert.equal(saved.lesson.id, "created-lesson");
  assert.equal(calls.length, 2);
  assert.equal(calls[1][2].title, newLessonDraft.title.trim());
  assert.equal(calls[1][2].content, newLessonDraft.content);
  assert.equal(calls[1][2].isAiGenerated, undefined);
  assert.equal(calls[1][3].timeout, 12000);
});
test("changed identity, parent snapshot and invalid drafts never send creation", async () => {
  for (const scenario of ["account", "parent", "invalid"]) {
    const raw = editorRaw(),
      current = structuredClone(raw);
    if (scenario === "parent") current.modules[0].title = "Changed";
    let writes = 0;
    const { client, context } = newLessonSetup(
      {
        api: {
          get: async (path) => ({
            data:
              path === "/users/me"
                ? {
                    ...contentUser,
                    id: scenario === "account" ? "other" : contentUser.id,
                  }
                : path.endsWith("/review")
                  ? editorReview(current)
                  : current,
          }),
          post: () => {
            writes++;
          },
        },
      },
      scenario === "parent",
      raw,
    );
    await assert.rejects(
      client.createNewLesson(
        context,
        scenario === "invalid"
          ? { ...newLessonDraft, content: "" }
          : newLessonDraft,
      ),
    );
    assert.equal(writes, 0);
  }
});
test("linked creation sends one create and one guarded attach, then confirms saved placement", async () => {
  const raw = editorRaw(),
    writes = [];
  const { client, context } = newLessonSetup(
    {
      api: {
        get: async (path) => ({
          data:
            path === "/users/me"
              ? contentUser
              : path.startsWith("/concepts/")
                ? createdLessonRaw
                : path.endsWith("/review")
                  ? editorReview(raw)
                  : raw,
        }),
        post: async (path, body) => {
          writes.push([path, body]);
          if (path === "/concepts") return { data: createdLessonRaw };
          const placement = {
            id: "p-new",
            moduleId: "m0",
            conceptId: body.conceptId,
            orderIndex: 4,
            concept: createdLessonRaw,
          };
          raw.modules[0].moduleConcepts.push(placement);
          return { data: placement };
        },
      },
    },
    true,
    raw,
  );
  const result = await client.createNewLesson(context, newLessonDraft);
  assert.equal(result.attachment, "attached");
  assert.equal(writes.length, 2);
  assert.equal(writes[0][0], "/concepts");
  assert.equal(writes[1][0], "/modules/m0/concepts");
  assert.equal(writes[1][1].conceptId, "created-lesson");
});
test("attach refusal/timeout/malformed response preserve the confirmed lesson and never recreate", async () => {
  for (const scenario of ["refused", "timeout", "ack"]) {
    const raw = editorRaw(),
      writes = [];
    const { client, context } = newLessonSetup(
      {
        api: {
          get: async (path) => ({
            data:
              path === "/users/me"
                ? contentUser
                : path.startsWith("/concepts/")
                  ? createdLessonRaw
                  : path.endsWith("/review")
                    ? editorReview(raw)
                    : raw,
          }),
          post: async (path) => {
            writes.push(path);
            if (path === "/concepts") return { data: createdLessonRaw };
            if (scenario === "ack") return { data: {} };
            throw scenario === "timeout"
              ? new Error("timeout")
              : { response: { status: 400 } };
          },
        },
      },
      true,
      raw,
    );
    const result = await client.createNewLesson(context, newLessonDraft);
    assert.equal(result.lesson.id, "created-lesson");
    assert.equal(result.attachment, "unconfirmed");
    assert.equal(result.uncertain, scenario !== "refused");
    assert.equal(writes.filter((p) => p === "/concepts").length, 1);
    assert.equal(writes.length, 2);
  }
});
test("uncertain creation never attaches or retries; definitive refusal remains distinguishable", async () => {
  for (const scenario of ["network", "5xx", "408", "ack", "refused"]) {
    let writes = 0;
    const { client, context } = newLessonSetup({
      api: {
        get: async () => ({ data: contentUser }),
        post: async () => {
          writes++;
          if (scenario === "ack") return { data: { id: "unverified" } };
          throw scenario === "network"
            ? new Error()
            : {
                response: {
                  status:
                    scenario === "5xx" ? 503 : scenario === "408" ? 408 : 400,
                },
              };
        },
      },
    });
    await assert.rejects(
      client.createNewLesson(context, newLessonDraft),
      (error) => {
        assert.equal(error.uncertain, scenario !== "refused");
        return true;
      },
    );
    assert.equal(writes, 1);
  }
});
test("saved-state checks reconcile known attachment without writes and search possible previous saves using metadata only", async () => {
  const raw = editorRaw();
  raw.modules[0].moduleConcepts.push({
    id: "p-new",
    moduleId: "m0",
    conceptId: createdLessonRaw.id,
    orderIndex: 4,
    concept: createdLessonRaw,
  });
  const calls = [],
    { client, data, context } = newLessonSetup(
      {
        api: {
          get: async (path) => {
            calls.push(path);
            return {
              data:
                path === "/users/me"
                  ? contentUser
                  : path.startsWith("/concepts?")
                    ? [
                        createdLessonRaw,
                        {
                          ...createdLessonRaw,
                          id: "foreign",
                          authorId: "other",
                        },
                      ]
                    : path.startsWith("/concepts/")
                      ? createdLessonRaw
                      : path.endsWith("/review")
                        ? editorReview(raw)
                        : raw,
            };
          },
          post: () => assert.fail("no recovery writes"),
        },
      },
      true,
      raw,
    );
  const saved = data.parseLessonCreation(
    createdLessonRaw,
    contentUser.id,
    newLessonDraft,
  );
  assert.equal(
    (
      await client.checkNewLessonState(context, newLessonDraft, {
        lesson: saved,
        attachment: "unconfirmed",
        uncertain: true,
      })
    ).result.attachment,
    "attached",
  );
  const checked = await client.checkNewLessonState(
    { ...context, request: standaloneRequest, target: undefined },
    newLessonDraft,
  );
  assert.equal(checked.candidates.length, 1);
  assert.equal(checked.candidates[0].content, undefined);
  assert.ok(
    calls.at(-1).includes(encodeURIComponent(newLessonDraft.title.trim())),
  );
});
test("a target lost after creation keeps the owned saved lesson accessible; changed account hides it", async () => {
  for (const changedAccount of [false, true]) {
    let accountReads = 0;
    const { client, data, context } = newLessonSetup(
      {
        api: {
          get: async (path) => {
            if (path === "/users/me") {
              accountReads++;
              return {
                data: {
                  ...contentUser,
                  id:
                    changedAccount && accountReads > 1
                      ? "other"
                      : contentUser.id,
                },
              };
            }
            if (path.startsWith("/concepts/"))
              return { data: createdLessonRaw };
            throw { response: { status: 404 } };
          },
        },
      },
      true,
    );
    const result = {
      lesson: data.parseLessonCreation(
        createdLessonRaw,
        contentUser.id,
        newLessonDraft,
      ),
      attachment: "unconfirmed",
    };
    if (changedAccount)
      await assert.rejects(
        client.checkNewLessonState(context, newLessonDraft, result),
        (error) => error.unavailable === true,
      );
    else {
      const checked = await client.checkNewLessonState(
        context,
        newLessonDraft,
        result,
      );
      assert.equal(checked.result.lesson.id, "created-lesson");
      assert.equal(checked.result.targetUnavailable, true);
      assert.equal(checked.context.target, undefined);
    }
  }
});
test("creation followed by a lost target retains the confirmed lesson without sending attachment", async () => {
  const raw = editorRaw();
  let created = false,
    writes = 0;
  const { client, context } = newLessonSetup(
    {
      api: {
        get: async (path) => {
          if (path === "/users/me") return { data: contentUser };
          if (created) throw { response: { status: 404 } };
          return { data: path.endsWith("/review") ? editorReview(raw) : raw };
        },
        post: async (path) => {
          writes++;
          assert.equal(path, "/concepts");
          created = true;
          return { data: createdLessonRaw };
        },
      },
    },
    true,
    raw,
  );
  const result = await client.createNewLesson(context, newLessonDraft);
  assert.equal(writes, 1);
  assert.equal(result.lesson.id, "created-lesson");
  assert.equal(result.targetUnavailable, true);
  assert.equal(result.unavailable, false);
});
test("definitive access errors recover only for the same checked author", async () => {
  const { context } = newLessonSetup(),
    key = ["content", "new-lesson", null, null, false].join("/");
  for (const changed of [false, true]) {
    const h = roadmapHarness({
      mutationResult: { error: { response: { status: 403 } } },
      queries: {
        [key]: {
          data: context,
          isPending: false,
          isFetching: false,
          refetch: async () => ({
            data: changed
              ? { ...context, user: { ...contentUser, id: "other" } }
              : context,
            isError: false,
          }),
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
    });
    const unavailable = h
      .load(new URL("../content/gui-new-lesson.tsx", import.meta.url))
      .GuiNewLesson({ request: standaloneRequest }).props.children;
    unavailable.props.children[1].props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      changed ? 0 : 1,
    );
  }
});
test("new lesson GUI uses native labelled writing/difficulty and honest loading, result and partial-save actions", () => {
  const { h, data, context } = newLessonSetup(),
    View = h.load(
      new URL("../content/new-lesson-view.tsx", import.meta.url),
    ).NewLessonView,
    props = {
      context,
      onCreate() {},
      onAttach() {},
      onCheck() {},
      onStartAnother() {},
    };
  const html = h.render(createElement(View, props));
  assert.match(html, /name="lesson-difficulty"/);
  assert.match(html, /textarea/);
  assert.match(html, /Save private lesson/);
  assert.match(html, /without autosave/);
  const loading = h.render(
    createElement(View, { ...props, context: undefined, loading: true }),
  );
  assert.match(loading, /Preparing lesson authoring/);
  assert.match(loading, /disabled=""/);
  assert.match(loading, /Checking placement/);
  assert.doesNotMatch(loading, /This lesson is created without a module/);
  const result = {
    lesson: data.parseLessonCreation(
      createdLessonRaw,
      contentUser.id,
      newLessonDraft,
    ),
    attachment: "unconfirmed",
    issue: "Attach refused",
  };
  const partial = h.render(
    createElement(View, {
      ...props,
      result,
      canCreate: false,
      canAttach: true,
    }),
  );
  assert.match(partial, /Lesson created; attachment isn’t confirmed/);
  assert.match(partial, /Attach saved lesson/);
  assert.doesNotMatch(partial, />Save private lesson</);
  assert.match(partial, /Continue editing/);
  assert.match(partial, /readonly=""/i);
});
test("new lesson preview uses the safe reader renderer with inert HTML and explicit external-image loading", () => {
  let stateIndex = 0;
  const { context } = newLessonSetup(),
    h = roadmapHarness({
      hooks: {
        useState: (initial) => {
          const index = stateIndex++;
          return [
            index === 1
              ? "## Draft heading\n\n<script>alert(1)</script>\n\n![Sample](https://example.test/sample.png)\n\n[Bad](javascript:alert(1))"
              : index === 3
                ? "preview"
                : initial,
            () => {},
          ];
        },
      },
    });
  const View = h.load(
    new URL("../content/new-lesson-view.tsx", import.meta.url),
  ).NewLessonView;
  const html = h.render(
    createElement(View, {
      context,
      onCreate() {},
      onAttach() {},
      onCheck() {},
      onStartAnother() {},
    }),
  );
  assert.match(html, /new-lesson-preview-section/);
  assert.match(html, /Local preview/);
  assert.match(html, /Load image/);
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
});
test("new lesson controller deduplicates and pauses stale writes while keeping module query routing local", () => {
  const { context } = newLessonSetup(),
    key = ["content", "new-lesson", null, null, false].join("/");
  for (const stale of [false, true]) {
    const h = roadmapHarness({
        queries: {
          [key]: {
            data: context,
            isPending: false,
            isFetching: false,
            isError: stale,
          },
        },
        hooks: {
          useState: (v) => [v, () => {}],
          useRef: (v) => ({ current: v }),
        },
      }),
      view = h
        .load(new URL("../content/gui-new-lesson.tsx", import.meta.url))
        .GuiNewLesson({ request: standaloneRequest }).props.children;
    view.props.onCreate(newLessonDraft);
    view.props.onCreate(newLessonDraft);
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      stale ? 0 : 1,
    );
    assert.equal(view.props.canCreate, !stale);
    assert.equal(h.queryCalls[0].retry, false);
  }
  const mode = roadmapHarness({ mode: { ready: true, isCli: true } }),
    gate = mode
      .load(new URL("../content/gui-new-lesson.tsx", import.meta.url))
      .NewLessonPage({ request: linkedRequest });
  gate.props.children[0].props.children.props.onClick();
  assert.equal(
    JSON.stringify(mode.calls.at(-1)),
    JSON.stringify(["mode", "gui", { navigate: false }]),
  );
  assert.ok(!mode.calls.some((c) => c[0] === "location"));
  assert.match(
    readFileSync(
      new URL("../content/editor-view.tsx", import.meta.url),
      "utf8",
    ),
    /moduleId=\$\{encodeURIComponent\(m.id\)\}&roadmapId=/,
  );
});
test("unconfirmed creation unlocks only after successful explicit check using the original submitted title", async () => {
  const { context } = newLessonSetup(),
    key = ["content", "new-lesson", null, null, false].join("/");
  for (const failed of [false, true]) {
    const refs = [],
      mutationResult = {},
      calls = [];
    let refIndex = 0;
    const h = roadmapHarness({
      mutationResult,
      queries: {
        [key]: { data: context, isPending: false, isFetching: false },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => {
          const i = refIndex++;
          return refs[i] ?? (refs[i] = { current: v });
        },
      },
      api: {
        get: async (path) => {
          calls.push(path);
          if (failed) throw new Error("offline");
          return {
            data: path === "/users/me" ? contentUser : [createdLessonRaw],
          };
        },
      },
    });
    const controller = h.load(
        new URL("../content/gui-new-lesson.tsx", import.meta.url),
      ),
      before = controller.GuiNewLesson({ request: standaloneRequest }).props
        .children;
    before.props.onCreate(newLessonDraft);
    h.calls.find((c) => c[0] === "mutation")[1].onSettled();
    mutationResult.error = new (h.load(
      new URL("../content/content-client.ts", import.meta.url),
    ).ContentFailure)("uncertain", true);
    refIndex = 0;
    const after = controller.GuiNewLesson({ request: standaloneRequest }).props
      .children;
    assert.equal(after.props.canCreate, false);
    after.props.onCheck({ ...newLessonDraft, title: "Changed after timeout" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
    if (!failed)
      assert.equal(
        calls.at(-1),
        `/concepts?search=${encodeURIComponent(newLessonDraft.title.trim())}`,
      );
  }
});

function editLessonRaw(patch = {}) {
  return {
    ...createdLessonRaw,
    id: "editable",
    title: "Clear connections",
    content:
      "A branch points to a commit. It is a movable reference to a point in history.",
    draftContent: null,
    reviewStatus: "approved",
    updatedAt: "2026-10-12T01:00:00Z",
    appearsIn: [
      {
        moduleConceptId: "placement-1",
        moduleId: "module-1",
        roadmapId: "roadmap-1",
        moduleTitle: "Reading history",
        roadmapTitle: "Version control",
      },
    ],
    ...patch,
  };
}
function editLessonSetup(options = {}, raw = editLessonRaw()) {
  const h = roadmapHarness(options),
    data = h.load(new URL("../content/edit-lesson-data.ts", import.meta.url)),
    client = h.load(
      new URL("../content/edit-lesson-client.ts", import.meta.url),
    );
  return {
    h,
    data,
    client,
    before: data.parseEditLessonData(raw, contentUser, raw.id),
  };
}
test("lesson edit projection requires owner/admin, complete body/draft/review and safe placement data", () => {
  const { data, before } = editLessonSetup();
  assert.equal(before.lesson.media, undefined);
  assert.equal(before.lesson.slug, undefined);
  for (const patch of [
    { id: "other" },
    { authorId: "other" },
    { draftContent: undefined },
    { draftContent: {} },
    { content: null },
    { reviewStatus: "published" },
    { difficulty: "unknown" },
    { rejectionReason: undefined },
    { isAiGenerated: undefined },
    { updatedAt: "bad" },
    { appearsIn: undefined },
    { appearsIn: [...editLessonRaw().appearsIn, ...editLessonRaw().appearsIn] },
  ])
    assert.throws(() =>
      data.parseEditLessonData(editLessonRaw(patch), contentUser, "editable"),
    );
  assert.throws(() =>
    data.parseEditLessonData(
      editLessonRaw({ authorId: null }),
      contentUser,
      "editable",
    ),
  );
  for (const authorId of ["other", null])
    assert.equal(
      data.parseEditLessonData(
        editLessonRaw({ authorId }),
        { ...contentUser, role: "admin" },
        "editable",
      ).lesson.authorId,
      authorId,
    );
});
test("lesson editing prefers even an empty staged draft and uses update rather than creation validation", () => {
  const { data } = editLessonSetup();
  assert.equal(data.editableBody(editLessonRaw({ draftContent: "" })), "");
  assert.equal(
    data.editableBody(editLessonRaw({ draftContent: "pending" })),
    "pending",
  );
  assert.equal(
    data.lessonEditError({ kind: "body", content: "  x\n" }),
    undefined,
  );
  assert.match(data.lessonEditError({ kind: "body", content: " \n " }), /body/);
  assert.match(
    data.lessonEditError({ kind: "details", title: "", difficulty: "medium" }),
    /title/,
  );
  assert.match(
    data.lessonEditError({
      kind: "details",
      title: "x",
      difficulty: "unknown",
    }),
    /Choose/,
  );
  assert.equal(
    data.lessonEditError({
      kind: "details",
      title: " 分支 ",
      difficulty: "hard",
    }),
    undefined,
  );
});
test("lesson edit entry is abortable, timed and read-only with fresh account checked before lesson", async () => {
  const calls = [],
    signal = new AbortController().signal;
  const { client } = editLessonSetup({
    api: {
      get: async (path, options) => {
        calls.push([path, options]);
        return { data: path === "/users/me" ? contentUser : editLessonRaw() };
      },
      patch: () => assert.fail("entry writes"),
    },
  });
  await client.loadEditLesson("editable", signal);
  assert.deepEqual(
    calls.map((c) => c[0]),
    ["/users/me", "/concepts/editable"],
  );
  for (const [, options] of calls) {
    assert.equal(options.signal, signal);
    assert.equal(options.timeout, 12000);
  }
  await assert.rejects(client.loadEditLesson("../other"), /invalid/);
  assert.equal(calls.length, 2);
});
test("lesson edit preflight blocks changed account, role, body, draft, review, update stamp and placement before PATCH", async () => {
  for (const scenario of [
    "account",
    "role",
    "body",
    "draft",
    "review",
    "stamp",
    "placement",
    "access",
  ]) {
    let reads = 0;
    const { client, before } = editLessonSetup({
      api: {
        get: async (path) => {
          reads++;
          if (scenario === "access") throw { response: { status: 403 } };
          return {
            data:
              path === "/users/me"
                ? {
                    ...contentUser,
                    ...(scenario === "account"
                      ? { id: "other" }
                      : scenario === "role"
                        ? { role: "admin" }
                        : {}),
                  }
                : editLessonRaw(
                    scenario === "body"
                      ? { content: "changed" }
                      : scenario === "draft"
                        ? { draftContent: "new draft" }
                        : scenario === "review"
                          ? { reviewStatus: "pending" }
                          : scenario === "stamp"
                            ? { updatedAt: "2026-10-12T02:00:00Z" }
                            : scenario === "placement"
                              ? { appearsIn: [] }
                              : {},
                  ),
          };
        },
        patch: () => assert.fail(`no ${scenario} write`),
      },
    });
    await assert.rejects(
      client.saveLessonEdit(before, {
        kind: "body",
        content: "A new explanation",
      }),
      (error) => error.uncertain === false,
    );
    assert.equal(
      reads,
      ["account", "role", "access"].includes(scenario) ? 1 : 2,
    );
  }
});
test("details save sends one metadata-only PATCH and confirms a second account/lesson read", async () => {
  const calls = [],
    action = { kind: "details", title: " 分支 ", difficulty: "hard" };
  let raw = editLessonRaw();
  const { client, before } = editLessonSetup({
    api: {
      get: async (path) => {
        calls.push(["GET", path]);
        return { data: path === "/users/me" ? contentUser : raw };
      },
      patch: async (path, body, options) => {
        calls.push(["PATCH", path, body, options]);
        raw = {
          ...raw,
          title: body.title,
          difficulty: body.difficulty,
          updatedAt: "2026-10-12T02:00:00Z",
        };
        return { data: raw };
      },
    },
  });
  const result = await client.saveLessonEdit(before, action);
  assert.equal(result.outcome, "details");
  assert.equal(result.data.lesson.title, "分支");
  const patches = calls.filter((c) => c[0] === "PATCH");
  assert.equal(patches.length, 1);
  assert.equal(
    JSON.stringify(patches[0][2]),
    JSON.stringify({ title: "分支", difficulty: "hard" }),
  );
  assert.equal(patches[0][3].timeout, 12000);
  assert.deepEqual(
    calls.map((c) => c[0]),
    ["GET", "GET", "PATCH", "GET", "GET"],
  );
  assert.equal(result.data.lesson.content, before.lesson.content);
});
test("body saves confirm staged rewrites, immediate small edits with old draft kept, and nonlive pending resets", async () => {
  for (const scenario of ["staged", "small", "pending"]) {
    const original = editLessonRaw(
      scenario === "small"
        ? { draftContent: "An older staged rewrite" }
        : scenario === "pending"
          ? { reviewStatus: "rejected", rejectionReason: "Add examples" }
          : {},
    );
    const action = {
      kind: "body",
      content:
        scenario === "small"
          ? `${original.content}!`
          : "## Rewritten explanation\n\n" +
            "A completely different explanation with examples. ".repeat(4),
    };
    let raw = original,
      patches = 0;
    const { client, before } = editLessonSetup(
      {
        api: {
          get: async (path) => ({
            data: path === "/users/me" ? contentUser : raw,
          }),
          patch: async (path, body) => {
            patches++;
            assert.equal(
              JSON.stringify(body),
              JSON.stringify({ content: action.content }),
            );
            raw = {
              ...raw,
              updatedAt: "2026-10-12T02:00:00Z",
              ...(scenario === "staged"
                ? { draftContent: body.content }
                : { content: body.content }),
              ...(scenario === "pending"
                ? { reviewStatus: "pending", rejectionReason: null }
                : {}),
            };
            return { data: raw };
          },
        },
      },
      original,
    );
    const result = await client.saveLessonEdit(before, action);
    assert.equal(patches, 1);
    assert.equal(result.outcome, scenario === "staged" ? "draft" : "body");
    assert.equal(result.data.lesson.title, original.title);
    assert.equal(result.data.lesson.difficulty, original.difficulty);
    assert.equal(
      scenario === "staged"
        ? result.data.lesson.draftContent
        : result.data.lesson.content,
      action.content,
    );
    if (scenario === "small")
      assert.equal(result.data.lesson.draftContent, original.draftContent);
    if (scenario === "pending")
      assert.equal(result.data.lesson.rejectionReason, null);
  }
});
test("edit ACK must confirm the requested branch and preserve other fields and manual origin", () => {
  const { data, before } = editLessonSetup();
  const details = { kind: "details", title: "New title", difficulty: "hard" },
    ack = editLessonRaw({ title: "New title", difficulty: "hard" });
  for (const patch of [
    { title: "Old" },
    { difficulty: "medium" },
    { content: "Other" },
    { draftContent: "Other" },
    { reviewStatus: "pending" },
    { isAiGenerated: true },
    { authorId: "other" },
  ])
    assert.throws(() =>
      data.confirmLessonEdit({ ...ack, ...patch }, before, details),
    );
  const body = { kind: "body", content: "A changed long body. ".repeat(10) },
    staged = editLessonRaw({ draftContent: body.content });
  assert.equal(data.confirmLessonEdit(staged, before, body).outcome, "draft");
  for (const patch of [
    { draftContent: "Other" },
    { title: "Other" },
    { difficulty: "hard" },
    { reviewStatus: "pending" },
    { content: "Other" },
  ])
    assert.throws(() =>
      data.confirmLessonEdit({ ...staged, ...patch }, before, body),
    );
});
test("edit transport failures never retry a PATCH and distinguish unknown outcomes from refusals", async () => {
  for (const status of [undefined, 408, 500, 503, 400, 403, 404, 422, 429]) {
    let patches = 0;
    const { client, before } = editLessonSetup({
      api: {
        get: async (path) => ({
          data: path === "/users/me" ? contentUser : editLessonRaw(),
        }),
        patch: async () => {
          patches++;
          throw status ? { response: { status } } : new Error("timeout");
        },
      },
    });
    await assert.rejects(
      client.saveLessonEdit(before, {
        kind: "details",
        title: "New",
        difficulty: "hard",
      }),
      (error) =>
        error.uncertain === (!status || status === 408 || status >= 500) &&
        error.unavailable === [403, 404].includes(status),
    );
    assert.equal(patches, 1);
  }
});
test("edit malformed ACK, failed reread or mismatched reread stay unconfirmed after one PATCH", async () => {
  for (const scenario of ["ack", "read", "mismatch", "account"]) {
    let wrote = false,
      patches = 0;
    const action = { kind: "details", title: "New", difficulty: "hard" },
      ack = editLessonRaw({ title: "New", difficulty: "hard" });
    const { client, before } = editLessonSetup({
      api: {
        get: async (path) => {
          if (wrote && scenario === "read") throw new Error("offline");
          return {
            data:
              path === "/users/me"
                ? {
                    ...contentUser,
                    ...(wrote && scenario === "account" ? { id: "other" } : {}),
                  }
                : wrote
                  ? scenario === "mismatch"
                    ? editLessonRaw({ ...ack, title: "Changed elsewhere" })
                    : ack
                  : editLessonRaw(),
          };
        },
        patch: async () => {
          wrote = true;
          patches++;
          return { data: scenario === "ack" ? { id: "editable" } : ack };
        },
      },
    });
    await assert.rejects(
      client.saveLessonEdit(before, action),
      (error) =>
        error.uncertain === true &&
        error.unavailable === (scenario === "account"),
    );
    assert.equal(patches, 1);
  }
});
test("GUI editor opens the pending draft, offers checked body comparison, and scopes admin/no-placement states", () => {
  const raw = editLessonRaw({
      draftContent: "Pending rewrite for a clearer lesson",
    }),
    { h, before } = editLessonSetup({}, raw);
  const View = h.load(
      new URL("../content/edit-lesson-view.tsx", import.meta.url),
    ).EditLessonView,
    props = { data: before, onSave() {}, onCheck() {} };
  const html = h.render(createElement(View, props));
  assert.match(html, /Pending rewrite for a clearer lesson<\/textarea>/);
  assert.match(html, /Compare the saved body/);
  assert.match(html, /Compare the pending draft/);
  assert.match(html, /name="edit-lesson-difficulty"/);
  assert.match(html, /save keeps the body and review state/);
  assert.match(html, /Review body save/);
  assert.match(html, /without autosave/);
  const admin = h.render(
    createElement(View, {
      ...props,
      data: {
        ...before,
        user: { ...contentUser, role: "admin" },
        lesson: { ...before.lesson, authorId: null },
        placements: [],
      },
    }),
  );
  assert.match(admin, /Editing as an administrator/);
  assert.match(admin, /no module placements/);
});
test("GUI edit rechecks preserve local text until explicit confirmed replacement and body saves only body", () => {
  const states = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  const { h, before } = editLessonSetup({
    hooks: {
      useState: (initial) => {
        const i = stateIndex++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value) => {
            states[i] = typeof value === "function" ? value(states[i]) : value;
          },
        ];
      },
      useRef: (initial) => {
        const i = refIndex++;
        return refs[i] ?? (refs[i] = { current: initial });
      },
      useEffect() {},
    },
  });
  const View = h.load(
      new URL("../content/edit-lesson-view.tsx", import.meta.url),
    ).EditLessonView,
    saves = [];
  const render = (data) => {
    stateIndex = 0;
    refIndex = 0;
    return View({ data, onSave: (action) => saves.push(action), onCheck() {} });
  };
  let tree = render(before);
  walk(tree, (n) => n.props.id === "edit-lesson-title")[0].props.onChange({
    target: { value: "Local title" },
  });
  walk(tree, (n) => n.props.id === "edit-lesson-body")[0].props.onChange({
    target: { value: "Local body with an example" },
  });
  const checked = {
    ...before,
    lesson: {
      ...before.lesson,
      title: "New checked title",
      draftContent: "Checked pending draft",
    },
  };
  tree = render(checked);
  assert.equal(
    walk(tree, (n) => n.props.id === "edit-lesson-title")[0].props.value,
    "Local title",
  );
  assert.equal(
    walk(tree, (n) => n.props.id === "edit-lesson-body")[0].props.value,
    "Local body with an example",
  );
  walk(tree, (n) => n.type === "form")[1].props.onSubmit({
    preventDefault() {},
  });
  tree = render(checked);
  walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Save body text",
  )[0].props.onClick();
  assert.equal(
    JSON.stringify(saves[0]),
    JSON.stringify({ kind: "body", content: "Local body with an example" }),
  );
  tree = render(checked);
  walk(
    tree,
    (n) =>
      n.type === "button" &&
      n.props.children === "Use checked version in the form",
  )[0].props.onClick({ currentTarget: { focus() {} } });
  tree = render(checked);
  walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Use checked version",
  )[0].props.onClick();
  tree = render(checked);
  assert.equal(
    walk(tree, (n) => n.props.id === "edit-lesson-title")[0].props.value,
    "New checked title",
  );
  assert.equal(
    walk(tree, (n) => n.props.id === "edit-lesson-body")[0].props.value,
    "Checked pending draft",
  );
});
test("GUI edit controller deduplicates, pauses stale/failed writes, and keeps appearance switch on route", () => {
  const { before } = editLessonSetup(),
    key = "content/lesson-edit/editable";
  for (const scenario of ["ready", "fetching", "stale"]) {
    const h = roadmapHarness({
      queries: {
        [key]: {
          data: before,
          isPending: false,
          isFetching: scenario === "fetching",
          isError: scenario === "stale",
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
    });
    const view = h
      .load(new URL("../content/gui-edit-lesson.tsx", import.meta.url))
      .GuiEditLesson({ id: "editable" }).props.children;
    view.props.onSave({ kind: "body", content: "Local writing" });
    view.props.onSave({ kind: "body", content: "Local writing" });
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      scenario === "ready" ? 1 : 0,
    );
    assert.equal(h.queryCalls[0].retry, false);
    assert.equal(h.queryCalls[0].refetchOnWindowFocus, false);
  }
  const h = roadmapHarness({ mode: { ready: true, isCli: true } }),
    gate = h
      .load(new URL("../content/gui-edit-lesson.tsx", import.meta.url))
      .EditLessonPage({ id: "editable" });
  gate.props.children[0].props.children.props.onClick();
  assert.equal(
    JSON.stringify(h.calls.at(-1)),
    JSON.stringify(["mode", "gui", { navigate: false }]),
  );
  assert.ok(!h.calls.some((c) => c[0] === "location"));
});
test("body already matching the checked live text needs no repeat save even when an older draft remains", () => {
  let stateIndex = 0;
  const { h, before } = editLessonSetup(
    {
      hooks: {
        useState: (initial) => [
          stateIndex++ === 2 ? editLessonRaw().content : initial,
          () => {},
        ],
      },
    },
    editLessonRaw({ draftContent: "An older draft remains pending" }),
  );
  const View = h.load(
    new URL("../content/edit-lesson-view.tsx", import.meta.url),
  ).EditLessonView;
  const html = h.render(
    createElement(View, {
      data: before,
      onSave() {},
      onCheck() {},
      result: {
        data: before,
        action: {
          kind: "details",
          title: before.lesson.title,
          difficulty: before.lesson.difficulty,
        },
        outcome: "details",
        message: "Lesson details saved",
      },
    }),
  );
  assert.match(html, /This text matches the checked saved body/);
  const bodySave = [
    ...html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs),
  ].find((match) => match[2].includes("Review body save"));
  assert.match(bodySave[1], /disabled=""/);
});
test("lesson edit access/contract failures hide cached private body and account, ordinary errors keep the view paused", () => {
  const { before } = editLessonSetup();
  for (const hidden of [false, true]) {
    const query = {
      data: before,
      isPending: false,
      isFetching: false,
      isError: true,
    };
    const h = roadmapHarness({
      queries: { "content/lesson-edit/editable": query },
      hooks: {
        useState: (initial) => [initial, () => {}],
        useRef: (initial) => ({ current: initial }),
      },
    });
    query.error = hidden
      ? new (h.load(
          new URL("../content/content-client.ts", import.meta.url),
        ).ContentFailure)("Access changed", false, true)
      : new Error("offline");
    const shell = h
      .load(new URL("../content/gui-edit-lesson.tsx", import.meta.url))
      .GuiEditLesson({ id: "editable" });
    if (hidden) {
      assert.equal(shell.props.user, undefined);
      assert.equal(
        shell.props.children.props.title,
        "Lesson editing unavailable",
      );
      assert.equal(
        walk(shell, (n) => n.props.id === "edit-lesson-body").length,
        0,
      );
    } else {
      assert.equal(shell.props.user.id, before.user.id);
      assert.equal(shell.props.children.props.canSave, false);
      assert.equal(shell.props.children.props.data, before);
    }
  }
});
test("unconfirmed edit unlocks only after a successful read-only check, failed check keeps mutation error", async () => {
  const { before } = editLessonSetup();
  for (const failed of [false, true]) {
    const mutationResult = {};
    const h = roadmapHarness({
      mutationResult,
      queries: {
        "content/lesson-edit/editable": {
          data: before,
          isPending: false,
          isFetching: false,
        },
      },
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
      },
      api: {
        get: async (path) => {
          if (failed) throw new Error("offline");
          return { data: path === "/users/me" ? contentUser : editLessonRaw() };
        },
        patch: () => assert.fail("checking never writes"),
      },
    });
    const failure = h.load(
      new URL("../content/content-client.ts", import.meta.url),
    ).ContentFailure;
    mutationResult.error = new failure("uncertain", true);
    const view = h
      .load(new URL("../content/gui-edit-lesson.tsx", import.meta.url))
      .GuiEditLesson({ id: "editable" }).props.children;
    assert.equal(view.props.canSave, false);
    assert.equal(view.props.uncertain, true);
    view.props.onCheck();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
  }
});

const generationGuid = (n) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const generationProviders = [
  {
    provider: "nvidia",
    displayName: "NVIDIA",
    byokOnly: false,
    defaultModel: "sample-model",
  },
  {
    provider: "gemini",
    displayName: "Gemini",
    byokOnly: true,
    defaultModel: "sample-gemini",
  },
];
const generationKey = {
  id: generationGuid(200),
  provider: "nvidia",
  label: "Sample default",
  keyHint: "1234",
  isDefault: true,
  dailyLimit: 20,
  defaultModel: null,
  updatedAt: "2026-10-12T00:00:00Z",
};
const generationQuota = {
  remaining: 20,
  limit: 20,
  unlimited: false,
  tier: "own-key",
  provider: "nvidia",
};
function generationRaw() {
  const raw = editorRaw();
  raw.id = generationGuid(1);
  raw.modules.forEach((m, i) => {
    m.id = generationGuid(20 + i);
    m.roadmapId = raw.id;
    m.moduleConcepts.forEach((p) => {
      p.moduleId = m.id;
    });
  });
  return raw;
}
function generationJobRaw(patch = {}) {
  return {
    id: generationGuid(100),
    requestedByUserId: contentUser.id,
    jobType: "roadmap_modules",
    targetId: generationGuid(1),
    status: "pending",
    progressCurrent: 0,
    progressTotal: 0,
    resultSummary: null,
    errorMessage: null,
    createdAt: "2026-10-12T00:00:00Z",
    updatedAt: "2026-10-12T00:00:00Z",
    acknowledgedAt: null,
    retryOfJobId: null,
    provider: "nvidia",
    model: "sample-model",
    providerKeyId: generationGuid(200),
    ...patch,
  };
}
const generationSummary = {
  createdCount: 2,
  failedCount: 1,
  skippedCount: 0,
  failedItems: [{ title: "A lesson", reason: "Sample provider failure" }],
  targetLabel: "Foundations of Git",
  itemNoun: "module",
};
function generationSetup(options = {}, raw = generationRaw()) {
  const h = roadmapHarness(options),
    data = h.load(new URL("../generation/generation-data.ts", import.meta.url)),
    client = h.load(
      new URL("../generation/generation-client.ts", import.meta.url),
    );
  const editor = h
    .load(new URL("../content/editor-data.ts", import.meta.url))
    .parseEditorData(contentUser, raw, editorReview(raw), raw.id);
  const settings = data.parseGenerationSettings(
      contentUser,
      [generationKey],
      generationProviders,
      generationQuota,
    ),
    feed = data.parseGenerationFeed(contentUser, [], []);
  const library = h
    .load(new URL("../content/content-data.ts", import.meta.url))
    .parseContentLibrary(
      contentUser,
      [raw],
      Date.parse("2026-10-12T00:00:00Z"),
    );
  return {
    h,
    data,
    client,
    editor,
    settings,
    feed,
    library,
    raw,
    intent: {
      kind: "roadmap_modules",
      roadmapId: raw.id,
      targetId: raw.id,
      model: "",
    },
  };
}
function generationApi(overrides = {}) {
  const calls = [],
    raw = generationRaw();
  let job = generationJobRaw();
  const api = {
    get: async (path, options) => {
      calls.push(["GET", path, options]);
      if (overrides.get) return overrides.get(path, options, job);
      const value =
        path === "/users/me"
          ? contentUser
          : path === "/roadmaps"
            ? [raw]
            : path.endsWith("/review")
              ? editorReview(raw)
              : path === `/roadmaps/${raw.id}`
                ? raw
                : path === "/ai-keys"
                  ? [generationKey]
                  : path === "/ai-providers"
                    ? generationProviders
                    : path === "/ai-generate/quota"
                      ? generationQuota
                      : path.endsWith("jobs/active") ||
                          path.endsWith("jobs/results")
                        ? []
                        : path.includes("/jobs/")
                          ? job
                          : {
                              models: ["sample-model"],
                              live: false,
                              defaultModel: "sample-model",
                            };
      return { data: value };
    },
    post: async (path, body, options) => {
      calls.push(["POST", path, body, options]);
      if (overrides.post) return overrides.post(path, body, options);
      if (path.endsWith("acknowledge")) {
        job = {
          ...job,
          status: "completed",
          acknowledgedAt: "2026-10-12T02:00:00Z",
          updatedAt: "2026-10-12T02:00:00Z",
        };
        return { data: { acknowledged: 1 } };
      }
      const jobType = Object.entries({
        "roadmap-modules": "roadmap_modules",
        "module-concepts": "module_concepts",
        "module-mcqs": "module_mcqs",
      }).find(([name]) => path.endsWith(name))[1];
      job = generationJobRaw({
        jobType,
        targetId: body.roadmapId ?? body.moduleId,
        model: body.model || "sample-model",
      });
      return { data: { jobId: job.id } };
    },
  };
  return {
    api,
    calls,
    setJob: (value) => {
      job = value;
    },
  };
}
test("generation target links reject invalid/repeated/wrong-shape IDs without starting anything", () => {
  const { data } = generationSetup();
  for (const query of [
    { roadmapId: [generationGuid(1), generationGuid(1)] },
    { roadmapId: "../x" },
    { moduleId: generationGuid(20) },
    { jobId: "" },
  ])
    assert.equal(data.generationRequest(query).invalid, true);
  assert.equal(
    data.generationRequest({
      roadmapId: generationGuid(1),
      moduleId: generationGuid(20),
    }).moduleId,
    generationGuid(20),
  );
  assert.equal(data.generationRequest({}).invalid, false);
});
test("generation settings project metadata only and tie quota to actual default key and role", () => {
  const { data } = generationSetup();
  const settings = data.parseGenerationSettings(
    contentUser,
    [{ ...generationKey, apiKey: "secret", keyCiphertext: "cipher" }],
    generationProviders,
    generationQuota,
  );
  assert.equal(settings.keys[0].apiKey, undefined);
  assert.equal(settings.keys[0].keyCiphertext, undefined);
  for (const [keys, quota] of [
    [
      [generationKey, { ...generationKey, id: generationGuid(201) }],
      generationQuota,
    ],
    [[generationKey], { ...generationQuota, provider: "gemini" }],
    [[generationKey], { ...generationQuota, tier: "free" }],
    [[generationKey], { ...generationQuota, remaining: 21 }],
    [[generationKey], { ...generationQuota, limit: 15 }],
  ])
    assert.throws(() =>
      data.parseGenerationSettings(
        contentUser,
        keys,
        generationProviders,
        quota,
      ),
    );
  assert.equal(
    data.parseGenerationSettings(
      { ...contentUser, role: "admin" },
      [generationKey],
      generationProviders,
      {
        ...generationQuota,
        remaining: -1,
        limit: -1,
        unlimited: true,
        tier: "admin",
      },
    ).quota.unlimited,
    true,
  );
  assert.equal(
    data.parseGenerationSettings(contentUser, [], generationProviders, {
      remaining: 5,
      limit: 5,
      unlimited: false,
      tier: "free",
      provider: "nvidia",
    }).keys.length,
    0,
  );
});
test("generation jobs require requester-owned records, valid progress/dates and exact partial result counts", () => {
  const { data } = generationSetup();
  for (const patch of [
    { requestedByUserId: "other" },
    { jobType: "concept_content" },
    { progressCurrent: 2, progressTotal: 1 },
    { status: "cancelled" },
    { updatedAt: "bad" },
    { resultSummary: { ...generationSummary, failedCount: 2 } },
  ])
    assert.throws(() =>
      data.parseGenerationJob(generationJobRaw(patch), contentUser),
    );
  assert.throws(() =>
    data.parseGenerationJob(generationJobRaw({ requestedByUserId: "other" }), {
      ...contentUser,
      role: "admin",
    }),
  );
  const job = data.parseGenerationJob(
    generationJobRaw({
      status: "completed",
      resultSummary: generationSummary,
      provider: null,
      model: null,
      providerKeyId: null,
      retryOfJobId: generationGuid(99),
    }),
    contentUser,
  );
  assert.equal(job.resultSummary.createdCount, 2);
  assert.equal(job.resultSummary.failedCount, 1);
  assert.equal(job.provider, null);
});
test("job completion between active/results reads resolves to the later terminal record", () => {
  const { data } = generationSetup();
  const feed = data.parseGenerationFeed(
    contentUser,
    [generationJobRaw()],
    [
      generationJobRaw({
        status: "completed",
        resultSummary: generationSummary,
      }),
    ],
  );
  assert.equal(feed.active.length, 0);
  assert.equal(feed.results.length, 1);
  assert.throws(() =>
    data.parseGenerationFeed(
      contentUser,
      [generationJobRaw(), generationJobRaw()],
      [],
    ),
  );
  assert.throws(() =>
    data.parseGenerationFeed(
      contentUser,
      [],
      [
        generationJobRaw({
          status: "completed",
          acknowledgedAt: "2026-10-12T02:00:00Z",
        }),
      ],
    ),
  );
});
test("known-job lookup binds the returned requester-owned record to the exact requested ID", async () => {
  const fixture = generationApi();
  fixture.setJob(generationJobRaw({ id: generationGuid(99) }));
  const { client } = generationSetup({ api: fixture.api });
  await assert.rejects(
    client.loadGenerationJob(contentUser, generationGuid(100)),
    (error) => error.unavailable === true,
  );
  assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 0);
});
test("generation entry/metadata/feed reads are abortable timed and never call a model or POST", async () => {
  const fixture = generationApi(),
    { client } = generationSetup({ api: fixture.api }),
    signal = new AbortController().signal;
  await client.loadGenerationLibrary(signal);
  await client.loadGenerationSettings(contentUser, signal);
  await client.loadGenerationFeed(contentUser, signal);
  assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 0);
  assert.equal(
    fixture.calls.some((c) => c[1].includes("/models")),
    false,
  );
  for (const [, , options] of fixture.calls) {
    assert.equal(options.signal, signal);
    assert.equal(options.timeout, 12000);
  }
});
test("model catalog is an explicit read scoped to current default key and labels fallback rather than assuming live", async () => {
  const fixture = generationApi(),
    { client, settings, data } = generationSetup({ api: fixture.api });
  const catalog = await client.loadGenerationModels(settings);
  assert.equal(catalog.live, false);
  assert.equal(
    catalog.settingsFingerprint,
    data.generationSettingsFingerprint(settings),
  );
  assert.equal(
    fixture.calls.at(-1)[1],
    `/ai-providers/nvidia/models?keyId=${generationKey.id}`,
  );
  assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 0);
});
test("selected model override is forwarded once and confirmed from the saved job snapshot", async () => {
  const fixture = generationApi(),
    { client, editor, settings, intent, data } = generationSetup({
      api: fixture.api,
    });
  const catalog = data.parseGenerationModels(
    {
      models: ["  sample-alternative  "],
      live: true,
      defaultModel: "sample-model",
    },
    settings,
  );
  const saved = await client.startGeneration(
    editor,
    settings,
    { ...intent, model: "sample-alternative" },
    catalog,
  );
  assert.equal(saved.model, "sample-alternative");
  const posts = fixture.calls.filter((c) => c[0] === "POST");
  assert.equal(posts.length, 1);
  assert.equal(posts[0][2].model, "sample-alternative");
  const linked = data.generationRequest({
    roadmapId: generationGuid(1).replace("-4000-", "-5000-"),
  });
  assert.equal(linked.invalid, false);
});
test("zero acknowledgement count is accepted only when a fresh read confirms the reviewed flag", async () => {
  let fixture;
  fixture = generationApi({
    post: async () => {
      fixture.setJob(
        generationJobRaw({
          status: "completed",
          resultSummary: generationSummary,
          acknowledgedAt: "2026-10-12T02:00:00Z",
        }),
      );
      return { data: { acknowledged: 0 } };
    },
  });
  fixture.setJob(
    generationJobRaw({ status: "completed", resultSummary: generationSummary }),
  );
  const { client, data } = generationSetup({ api: fixture.api }),
    before = data.parseGenerationJob(
      generationJobRaw({
        status: "completed",
        resultSummary: generationSummary,
      }),
      contentUser,
    );
  assert.ok(
    (await client.markGenerationReviewed(contentUser, before)).acknowledgedAt,
  );
  assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 1);
});
test("generation start guards exact capacity, owned module, active target, quota gate and current model choice", () => {
  const { data, editor, settings, feed, intent } = generationSetup();
  assert.equal(
    data.generationStartIssue(editor, settings, feed, intent),
    undefined,
  );
  assert.match(
    data.generationStartIssue(
      { ...editor, modules: [...editor.modules, ...editor.modules] },
      settings,
      feed,
      intent,
    ),
    /six-item/,
  );
  const lessons = {
    ...intent,
    kind: "module_concepts",
    targetId: editor.modules[0].id,
  };
  assert.equal(data.generationRequiredSlots(editor, lessons), 4);
  assert.match(
    data.generationStartIssue(
      editor,
      { ...settings, quota: { ...settings.quota, remaining: 3 } },
      feed,
      lessons,
    ),
    /At least 4/,
  );
  assert.match(
    data.generationStartIssue(
      editor,
      settings,
      {
        ...feed,
        active: [data.parseGenerationJob(generationJobRaw(), contentUser)],
      },
      intent,
    ),
    /already active/,
  );
  assert.match(
    data.generationStartIssue(editor, settings, feed, {
      ...lessons,
      targetId: generationGuid(25),
    }),
    /module/,
  );
  assert.match(
    data.generationStartIssue(editor, settings, feed, {
      ...intent,
      model: "unknown",
    }),
    /catalog/,
  );
  assert.equal(
    data.generationStartIssue(
      editor,
      settings,
      feed,
      { ...intent, model: "sample-model" },
      data.parseGenerationModels(
        { models: ["sample-model"], live: false, defaultModel: "sample-model" },
        settings,
      ),
    ),
    undefined,
  );
});
test("all three batch actions send exactly one selected target/provider POST then verify requester-owned saved job", async () => {
  for (const kind of ["roadmap_modules", "module_concepts", "module_mcqs"]) {
    const fixture = generationApi(),
      { client, editor, settings, intent } = generationSetup({
        api: fixture.api,
      });
    const selected = {
      ...intent,
      kind,
      targetId:
        kind === "roadmap_modules" ? editor.roadmap.id : editor.modules[0].id,
    };
    const job = await client.startGeneration(editor, settings, selected);
    assert.equal(job.jobType, kind);
    assert.equal(job.targetId, selected.targetId);
    const posts = fixture.calls.filter((c) => c[0] === "POST");
    assert.equal(posts.length, 1);
    assert.equal(
      JSON.stringify(posts[0][2]),
      JSON.stringify({
        ...(kind === "roadmap_modules"
          ? { roadmapId: selected.targetId }
          : { moduleId: selected.targetId }),
        provider: "nvidia",
      }),
    );
    assert.equal(posts[0][3].timeout, 12000);
    assert.equal(
      fixture.calls.at(-1)[1],
      `/ai-generate/jobs/${generationGuid(100)}`,
    );
  }
});
test("generation preflight blocks account/role/tree/key/capacity/quota or active-job drift before any paid POST", async () => {
  for (const scenario of [
    "account",
    "role",
    "tree",
    "key",
    "quota",
    "active",
  ]) {
    const standard = generationApi(),
      fixture = generationApi({
        get: async (path, options, job) => {
          if (path === "/users/me")
            return {
              data: {
                ...contentUser,
                ...(scenario === "account"
                  ? { id: "other" }
                  : scenario === "role"
                    ? { role: "admin" }
                    : {}),
              },
            };
          if (scenario === "tree" && path === `/roadmaps/${generationGuid(1)}`)
            return { data: { ...generationRaw(), description: "Changed" } };
          if (scenario === "key" && path === "/ai-keys")
            return { data: [{ ...generationKey, id: generationGuid(201) }] };
          if (scenario === "quota" && path === "/ai-generate/quota")
            return { data: { ...generationQuota, remaining: 0 } };
          if (scenario === "active" && path.endsWith("jobs/active"))
            return { data: [job] };
          return standard.api.get(path, options);
        },
      });
    const { client, editor, settings, intent } = generationSetup({
      api: fixture.api,
    });
    await assert.rejects(client.startGeneration(editor, settings, intent));
    assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 0);
  }
});
test("generation unknown transport/acceptance/readback outcomes lock without automatic paid retry", async () => {
  for (const scenario of [
    "timeout",
    "server",
    "refused",
    "ack",
    "readback",
    "wrong-target",
    "wrong-key",
  ]) {
    let wrote = false;
    const standard = generationApi(),
      fixture = generationApi({
        get: async (path, options) => {
          if (wrote && path.includes("/jobs/")) {
            if (scenario === "readback") throw new Error("offline");
            return {
              data: generationJobRaw(
                scenario === "wrong-target"
                  ? { targetId: generationGuid(99) }
                  : scenario === "wrong-key"
                    ? { providerKeyId: generationGuid(201) }
                    : {},
              ),
            };
          }
          return standard.api.get(path, options);
        },
        post: async () => {
          wrote = true;
          if (scenario === "timeout") throw new Error("timeout");
          if (scenario === "server" || scenario === "refused")
            throw { response: { status: scenario === "server" ? 503 : 429 } };
          return {
            data: scenario === "ack" ? {} : { jobId: generationGuid(100) },
          };
        },
      });
    const { client, editor, settings, intent } = generationSetup({
      api: fixture.api,
    });
    await assert.rejects(
      client.startGeneration(editor, settings, intent),
      (error) =>
        error.uncertain === (scenario !== "refused") &&
        error.jobId ===
          (["readback", "wrong-target", "wrong-key"].includes(scenario)
            ? generationGuid(100)
            : undefined),
    );
    assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 1);
  }
});
test("mark reviewed scopes acknowledgement to one finished own ID and validates stored flag before reporting success", async () => {
  const fixture = generationApi();
  fixture.setJob(
    generationJobRaw({ status: "completed", resultSummary: generationSummary }),
  );
  const { client, data } = generationSetup({ api: fixture.api }),
    before = data.parseGenerationJob(
      generationJobRaw({
        status: "completed",
        resultSummary: generationSummary,
      }),
      contentUser,
    );
  const after = await client.markGenerationReviewed(contentUser, before);
  assert.ok(after.acknowledgedAt);
  const posts = fixture.calls.filter((c) => c[0] === "POST");
  assert.equal(posts.length, 1);
  assert.equal(posts[0][1], "/ai-generate/jobs/acknowledge");
  assert.equal(
    JSON.stringify(posts[0][2]),
    JSON.stringify({ jobIds: [before.id] }),
  );
});
test("reviewed/changed/active/foreign jobs cannot trigger duplicate or wrong acknowledgement", async () => {
  for (const scenario of ["reviewed", "changed", "active", "foreign"]) {
    const fixture = generationApi();
    fixture.setJob(
      generationJobRaw({
        status: scenario === "active" ? "running" : "completed",
        resultSummary: generationSummary,
        ...(scenario === "reviewed"
          ? { acknowledgedAt: "2026-10-12T02:00:00Z" }
          : scenario === "changed"
            ? { updatedAt: "2026-10-12T02:00:00Z" }
            : scenario === "foreign"
              ? { requestedByUserId: "other" }
              : {}),
      }),
    );
    const { client, data } = generationSetup({ api: fixture.api }),
      before = data.parseGenerationJob(
        generationJobRaw({
          status: "completed",
          resultSummary: generationSummary,
        }),
        contentUser,
      );
    if (scenario === "reviewed")
      assert.ok(
        (await client.markGenerationReviewed(contentUser, before))
          .acknowledgedAt,
      );
    else
      await assert.rejects(client.markGenerationReviewed(contentUser, before));
    assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 0);
  }
});
test("acknowledgement failures and malformed or unconfirmed stored flags retain unknown outcome after one POST", async () => {
  for (const scenario of ["transport", "ack", "flag"]) {
    const fixture = generationApi({
      post: async () => {
        if (scenario === "transport") throw new Error("offline");
        return { data: { acknowledged: scenario === "ack" ? 5 : 1 } };
      },
    });
    fixture.setJob(
      generationJobRaw({
        status: "completed",
        resultSummary: generationSummary,
      }),
    );
    const { client, data } = generationSetup({ api: fixture.api }),
      before = data.parseGenerationJob(
        generationJobRaw({
          status: "completed",
          resultSummary: generationSummary,
        }),
        contentUser,
      );
    await assert.rejects(
      client.markGenerationReviewed(contentUser, before),
      (error) => error.uncertain === true,
    );
    assert.equal(fixture.calls.filter((c) => c[0] === "POST").length, 1);
  }
});
test("generation GUI names saved counts and progress stages, provider charges/retries and native renewed consent", () => {
  const { h, data, library, settings, editor, feed } = generationSetup();
  const View = h.load(
    new URL("../generation/generation-view.tsx", import.meta.url),
  ).GenerationView;
  const html = h.render(
    createElement(View, {
      request: data.generationRequest({}),
      library,
      settings,
      target: editor,
      feed: {
        ...feed,
        active: [
          data.parseGenerationJob(
            generationJobRaw({
              status: "running",
              progressCurrent: 1,
              progressTotal: 6,
            }),
            contentUser,
          ),
        ],
        results: [
          data.parseGenerationJob(
            generationJobRaw({
              id: generationGuid(101),
              status: "completed",
              resultSummary: generationSummary,
            }),
            contentUser,
          ),
        ],
      },
      selectedRoadmapId: editor.roadmap.id,
      canStart: true,
      canReview: true,
      onRoadmap() {},
      onCheck() {},
      onLoadModels() {},
      onStart() {},
      onReview() {},
      onLookup() {},
    }),
  );
  assert.match(html, /name="generation-kind"/);
  assert.match(html, /<progress/);
  assert.match(html, /reported steps/);
  assert.match(html, /may incur provider charges/);
  assert.match(html, /automatically retry/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /up to 20 results/);
  assert.match(html, /Mark this result reviewed/);
  assert.doesNotMatch(html, /Cancel job|Retry generation|100%|price estimate/);
});
test("generation GUI requires consent per modal and does not start from selection, preview or unconfirmed checkbox", () => {
  const states = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  const { h, data, library, settings, editor, feed } = generationSetup({
    hooks: {
      useState: (initial) => {
        const i = stateIndex++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value) => {
            states[i] = typeof value === "function" ? value(states[i]) : value;
          },
        ];
      },
      useRef: (initial) => {
        const i = refIndex++;
        return refs[i] ?? (refs[i] = { current: initial });
      },
      useEffect() {},
    },
  });
  const View = h.load(
      new URL("../generation/generation-view.tsx", import.meta.url),
    ).GenerationView,
    starts = [];
  const render = () => {
    stateIndex = 0;
    refIndex = 0;
    return View({
      request: data.generationRequest({}),
      library,
      settings,
      target: editor,
      feed,
      selectedRoadmapId: editor.roadmap.id,
      canStart: true,
      onRoadmap() {},
      onCheck() {},
      onLoadModels() {},
      onStart: (intent) => starts.push(intent),
      onReview() {},
      onLookup() {},
    });
  };
  let tree = render();
  walk(tree, (n) => n.props.id === "generation-form")[0].props.onSubmit({
    preventDefault() {},
  });
  tree = render();
  const start = walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Start generation job",
  )[0];
  assert.equal(start.props.disabled, true);
  start.props.onClick();
  assert.equal(starts.length, 0);
  walk(
    tree,
    (n) => n.type === "input" && n.props.type === "checkbox",
  )[0].props.onChange({ target: { checked: true } });
  tree = render();
  walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Start generation job",
  )[0].props.onClick();
  assert.equal(starts.length, 1);
  tree = render();
  walk(tree, (n) => n.props.id === "generation-form")[0].props.onSubmit({
    preventDefault() {},
  });
  tree = render();
  assert.equal(
    walk(
      tree,
      (n) => n.type === "button" && n.props.children === "Start generation job",
    )[0].props.disabled,
    true,
  );
});
test("paid confirmation rejects a changed default-key snapshot before effects have time to clear old consent", () => {
  const states = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  const { h, data, library, settings, editor, feed } = generationSetup({
    hooks: {
      useState: (initial) => {
        const i = stateIndex++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value) => {
            states[i] = typeof value === "function" ? value(states[i]) : value;
          },
        ];
      },
      useRef: (initial) => {
        const i = refIndex++;
        return refs[i] ?? (refs[i] = { current: initial });
      },
      useEffect() {},
    },
  });
  const View = h.load(
      new URL("../generation/generation-view.tsx", import.meta.url),
    ).GenerationView,
    starts = [];
  const render = (setup) => {
    stateIndex = 0;
    refIndex = 0;
    return View({
      request: data.generationRequest({}),
      library,
      settings: setup,
      target: editor,
      feed,
      selectedRoadmapId: editor.roadmap.id,
      canStart: true,
      onRoadmap() {},
      onCheck() {},
      onLoadModels() {},
      onStart: (intent) => starts.push(intent),
      onReview() {},
      onLookup() {},
    });
  };
  let tree = render(settings);
  walk(tree, (n) => n.props.id === "generation-form")[0].props.onSubmit({
    preventDefault() {},
  });
  tree = render(settings);
  walk(
    tree,
    (n) => n.type === "input" && n.props.type === "checkbox",
  )[0].props.onChange({ target: { checked: true } });
  tree = render({
    ...settings,
    keys: [{ ...settings.keys[0], id: generationGuid(201) }],
  });
  const button = walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Start generation job",
  )[0];
  assert.equal(button.props.disabled, true);
  button.props.onClick();
  assert.equal(starts.length, 0);
});
test("generation controller deduplicates paid actions and disables stale/missing/uncertain settings while allowing jobs reads", () => {
  const fixture = generationSetup(),
    request = fixture.data.generationRequest({
      roadmapId: fixture.editor.roadmap.id,
    });
  for (const scenario of [
    "ready",
    "stale",
    "no-settings",
    "missing-target",
    "uncertain",
  ]) {
    const library = {
        ...fixture.library,
        ...(scenario === "missing-target" ? { roadmaps: [] } : {}),
      },
      mutationResult = {};
    const h = roadmapHarness({
      mutationResult,
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
        useEffect() {},
      },
      queries: {
        "generation/library": {
          data: library,
          isPending: false,
          isFetching: false,
        },
        "generation/settings/author-1/developer": {
          data: scenario === "no-settings" ? undefined : fixture.settings,
          isFetching: scenario === "stale",
          isError: scenario === "no-settings",
        },
        "generation/jobs/author-1/developer": {
          data: fixture.feed,
          isFetching: false,
        },
        [`generation/target/author-1/developer/${fixture.editor.roadmap.id}`]: {
          data: fixture.editor,
          isFetching: false,
        },
      },
    });
    if (scenario === "uncertain")
      mutationResult.error = new (h.load(
        new URL("../generation/generation-client.ts", import.meta.url),
      ).GenerationFailure)("unknown", true);
    const view = h
      .load(new URL("../generation/gui-generation.tsx", import.meta.url))
      .GuiGeneration({ request }).props.children;
    view.props.onStart(fixture.intent);
    view.props.onStart(fixture.intent);
    assert.equal(
      h.calls.filter((c) => c[0] === "mutation").length,
      scenario === "ready" ? 1 : 0,
    );
    if (scenario === "missing-target")
      assert.equal(view.props.target, undefined);
    if (scenario === "no-settings") assert.equal(view.props.canReview, true);
    const jobs = h.queryCalls.find((q) => q.queryKey[1] === "jobs");
    assert.equal(jobs.refetchInterval({ state: {} }), 5000);
    assert.equal(
      jobs.refetchInterval({ state: { error: new Error("offline") } }),
      false,
    );
    assert.equal(jobs.refetchIntervalInBackground, false);
  }
});
test("generation mode handoff preserves the developer shell and exact learner location", () => {
  const h = roadmapHarness({
      mode: {
        ready: true,
        isCli: true,
        location: {
          kind: "concept",
          roadmap: "git",
          module: "history",
          concept: "branches",
        },
      },
    }),
    request = { roadmapId: null, moduleId: null, jobId: null, invalid: false };
  const tree = h
    .load(new URL("../generation/gui-generation.tsx", import.meta.url))
    .GenerationPage({ request });
  walk(
    tree,
    (n) => n.props.children === "Open GUI generation & jobs",
  )[0].props.onClick();
  assert.equal(
    JSON.stringify(h.calls.at(-1)),
    JSON.stringify(["mode", "gui", { navigate: false }]),
  );
  assert.ok(!h.calls.some((c) => c[0] === "location"));
  const terminal = walk(tree, (n) =>
    n.props.href?.startsWith("/developer/terminal"),
  )[0];
  assert.ok(terminal.props.href.includes("path="));
});
test("unconfirmed generation unlocks only after explicit successful read checks and never retries a paid action", async () => {
  const fixture = generationSetup(),
    request = fixture.data.generationRequest({
      roadmapId: fixture.editor.roadmap.id,
    });
  for (const failed of [false, true]) {
    const api = generationApi({
        post: () => assert.fail("recovery never posts"),
      }),
      mutationResult = {};
    const h = roadmapHarness({
      api: {
        ...api.api,
        get: async (...args) => {
          if (failed) throw new Error("offline");
          return api.api.get(...args);
        },
      },
      mutationResult,
      hooks: {
        useState: (v) => [v, () => {}],
        useRef: (v) => ({ current: v }),
        useEffect() {},
      },
      queries: {
        "generation/library": {
          data: fixture.library,
          isPending: false,
          isFetching: false,
          refetch: async () => ({
            data: fixture.library,
            isError: failed,
            error: new Error("offline"),
          }),
        },
        "generation/settings/author-1/developer": {
          data: fixture.settings,
          isFetching: false,
        },
        "generation/jobs/author-1/developer": {
          data: fixture.feed,
          isFetching: false,
        },
        [`generation/target/author-1/developer/${fixture.editor.roadmap.id}`]: {
          data: fixture.editor,
          isFetching: false,
        },
      },
    });
    mutationResult.error = new (h.load(
      new URL("../generation/generation-client.ts", import.meta.url),
    ).GenerationFailure)("unknown", true);
    const view = h
      .load(new URL("../generation/gui-generation.tsx", import.meta.url))
      .GuiGeneration({ request }).props.children;
    assert.equal(view.props.canStart, false);
    view.props.onCheck();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.filter((c) => c[0] === "reset-mutation").length,
      failed ? 0 : 1,
    );
    assert.equal(api.calls.filter((c) => c[0] === "POST").length, 0);
  }
});

export function roadmapHarness({
  hooks,
  mode = { ready: true, isCli: false, location: { kind: "root" } },
  queries = {},
  pathname = "/developer/roadmaps",
  searchParams = "",
  globals = {},
  api,
  mutationResult = {},
} = {}) {
  const cache = {},
    calls = [],
    queryCalls = [];
  const root = new URL("../../", import.meta.url);
  function load(url) {
    if (cache[url.href]) return cache[url.href];
    const exports = (cache[url.href] = {});
    const source = readFileSync(url, "utf8");
    const js = ts.transpileModule(source, {
      fileName: url.pathname,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    vm.runInNewContext(js, {
      exports,
      URL,
      URLSearchParams,
      ...globals,
      require: (name) => {
        if (name === "./cli-content") return { CliContent: () => null };
        if (name === "./cli-roadmap-editor")
          return { CliRoadmapEditor: () => null };
        if (name === "./cli-new-lesson") return { CliNewLesson: () => null };
        if (name === "./cli-edit-lesson") return { CliEditLesson: () => null };
        if (name === "react" && hooks)
          return { ...requirePackage(name), ...hooks };
        if (name.endsWith(".css")) {
          const prefix = name
            .split("/")
            .at(-1)
            .replace(/\.module\.css$/, "")
            .replaceAll("-", "_");
          return {
            default: new Proxy({}, { get: (_, key) => `${prefix}_${key}` }),
          };
        }
        if (name === "next/link")
          return {
            default: ({ children, ...props }) =>
              createElement("a", props, children),
          };
        if (name === "next/navigation")
          return {
            usePathname: () => pathname,
            useRouter: () => ({
              replace: (p) => calls.push(["replace", p]),
              push: (p) => calls.push(["push", p]),
            }),
            useSearchParams: () => new URLSearchParams(searchParams),
          };
        if (name === "@/providers/ui-mode-provider")
          return {
            useUiMode: () => ({
              ...mode,
              setMode: (...args) => calls.push(["mode", ...args]),
              setLocation: (loc) => calls.push(["location", loc]),
            }),
          };
        if (name === "@/providers/theme-provider")
          return { useTheme: () => ({ isDark: false, toggleTheme() {} }) };
        if (name === "@/lib/auth")
          return {
            clearAuth() {},
            getUser: () => ({ role: "admin" }),
            getToken: () => null,
          };
        if (name === "@/lib/terminal/session")
          return { clearTerminalSessions() {} };
        if (name === "@/lib/api-client" || name === "./request")
          return {
            default: api ?? {
              get() {
                throw new Error("No real API calls in fixtures");
              },
            },
            api: {},
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({
              clear() {},
              getQueryData: (key) => queries[key.join("/")]?.data,
              setQueryData: (...args) => calls.push(["cache-data", ...args]),
              invalidateQueries: async () => {},
            }),
            useMutation: (options) => ({
              isPending: false,
              isSuccess: false,
              mutate: () => calls.push(["mutation", options]),
              reset: () => calls.push(["reset-mutation"]),
              ...mutationResult,
            }),
            useQuery: (options) => {
              queryCalls.push(options);
              return (
                queries[options.queryKey.join("/")] ?? {
                  isPending: true,
                  isFetching: true,
                  refetch() {},
                }
              );
            },
          };
        if (name === "@/components/dashboard/gui-dashboard")
          return {
            resource: (q) => ({
              data: q.data,
              pending: q.isPending,
              error: q.isError,
              refreshing: q.isFetching,
              retry: () => q.refetch(),
            }),
          };
        if (name.startsWith("@/") || name.startsWith("./")) {
          const base = name.startsWith("@/")
            ? new URL(name.slice(2), root)
            : new URL(name, url);
          const path = ["ts", "tsx"]
            .map((extension) => new URL(`${base.href}.${extension}`))
            .find(existsSync);
          if (!path) throw new Error(`Missing module ${name}`);
          return load(path);
        }
        return requirePackage(name);
      },
    });
    return exports;
  }
  return {
    load,
    calls,
    queryCalls,
    data: load(new URL("./roadmap-data.ts", import.meta.url)),
    view: load(new URL("./roadmap-view.tsx", import.meta.url)),
    shell: load(new URL("../gui/gui-workspace-shell.tsx", import.meta.url)),
    controller: load(new URL("./gui-roadmaps.tsx", import.meta.url)),
    render: (element) => renderToStaticMarkup(element),
  };
}
export const sample = {
  id: "r1",
  title: "Foundations of Git",
  slug: "foundations-of-git",
  description: "Understand how commits, branches and merges connect.",
  originLabel: "handwritten",
  reviewStatus: "published",
  createdAt: "2026-10-01T00:00:00Z",
  modules: [
    {
      id: "m1",
      title: "Getting started",
      orderIndex: 0,
      description: "Build a mental model of version history.",
      moduleConcepts: [
        {
          id: "p1",
          conceptId: "c1",
          orderIndex: 0,
          concept: {
            id: "c1",
            title: "How commits connect",
            slug: "commits",
            difficulty: "easy",
            questionCount: 3,
          },
        },
        {
          id: "p2",
          conceptId: "c2",
          orderIndex: 1,
          concept: {
            id: "c2",
            title: "Understanding branches",
            slug: "branches",
            difficulty: "easy",
            questionCount: 4,
          },
          prerequisites: [
            { prerequisiteConceptId: "c1", title: "How commits connect" },
          ],
        },
      ],
    },
    {
      id: "m2",
      title: "Bringing work together",
      orderIndex: 1,
      moduleConcepts: [
        {
          id: "p3",
          conceptId: "c3",
          orderIndex: 0,
          concept: {
            id: "c3",
            title: "Merging changes",
            slug: "merging",
            difficulty: "medium",
            questionCount: 3,
          },
        },
      ],
    },
  ],
};
export const sampleProgress = {
  roadmapId: "r1",
  totalConcepts: 3,
  completedConceptsCount: 1,
  concepts: [
    { conceptId: "c1", status: "completed" },
    { conceptId: "c2", status: "in_progress" },
    { conceptId: "c3", status: "not_started" },
  ],
};
function walk(node, predicate, result = []) {
  if (!node || typeof node !== "object") return result;
  if (predicate(node)) result.push(node);
  [node.props?.children]
    .flat(Infinity)
    .forEach((child) => walk(child, predicate, result));
  return result;
}
test("catalog resolves IDs and VFS names with exactly shared normalization", () => {
  const h = roadmapHarness();
  const maps = [sample, { ...sample, id: "r2" }];
  assert.equal(
    h.data.findRoadmap(maps, "foundations-of-git-2").roadmap.id,
    "r2",
  );
  assert.equal(h.data.findRoadmap(maps, "r1").name, "foundations-of-git");
  assert.equal(h.data.findRoadmap(maps, "missing"), undefined);
});
test("search/origin/sort combine without changing catalog order", () => {
  const d = roadmapHarness().data;
  const rows = [
    { ...sample, title: "Zebra", originLabel: "ai" },
    {
      ...sample,
      id: "r2",
      title: "Alpha",
      createdAt: "2026-10-08",
      description: "Graph theory",
    },
  ];
  assert.equal(
    d.filterRoadmaps(rows, " GRAPH ", "handwritten", "title")[0].id,
    "r2",
  );
  assert.equal(d.filterRoadmaps(rows, "", "all", "title")[0].title, "Alpha");
  assert.equal(rows[0].title, "Zebra");
  assert.equal(d.filterRoadmaps(rows, "missing", "all", "newest").length, 0);
});
test("curriculum orders placements and disambiguates duplicate module names", () => {
  const d = roadmapHarness().data;
  const original = {
    ...sample,
    modules: [
      { ...sample.modules[1], title: "Start", orderIndex: 2 },
      { ...sample.modules[0], title: "Start", orderIndex: 1 },
    ],
  };
  const result = d.curriculum(original, "git");
  assert.equal(result[0].module.id, "m1");
  assert.equal(result[1].location.module, "start-2");
  assert.equal(result[0].concepts[1].location.concept, "branches");
  assert.equal(original.modules[0].id, "m2");
});
test("recommendation requires tracked progress and per-placement prerequisites", () => {
  const d = roadmapHarness().data;
  assert.equal(
    d.nextLesson(sample, "git", sampleProgress).placement.conceptId,
    "c2",
  );
  const blocked = {
    ...sampleProgress,
    concepts: [
      { conceptId: "c1", status: "not_started" },
      { conceptId: "c2", status: "in_progress" },
    ],
  };
  assert.equal(d.nextLesson(sample, "git", blocked).placement.conceptId, "c1");
  assert.equal(d.nextLesson(sample, "git"), undefined);
  assert.equal(
    d.conceptStatus(sample.modules[0].moduleConcepts[0]),
    "Progress unavailable",
  );
  assert.equal(
    d.conceptStatus(sample.modules[0].moduleConcepts[0], { concepts: [] }),
    "Not tracked",
  );
});
test("same-roadmap projection preserves the precise CLI concept; a real move changes roadmap", () => {
  const d = roadmapHarness().data;
  const current = {
    kind: "concept",
    roadmap: "git",
    module: "start",
    concept: "branches",
  };
  assert.equal(d.overviewLocation(current, "git"), current);
  assert.equal(d.overviewLocation(current, "other").roadmap, "other");
  assert.equal(d.overviewLocation(current, "other").kind, "roadmap");
});
test("browser renders real cards, labels and native search controls; errors never look empty", () => {
  const h = roadmapHarness();
  const renderCard = (roadmap) =>
    createElement(h.view.BrowserCard, {
      roadmap,
      progress: ready(sampleProgress),
      key: roadmap.id,
    });
  const html = h.render(
    createElement(h.view.RoadmapBrowser, {
      source: ready([sample]),
      renderCard,
    }),
  );
  assert.match(html, /Foundations of Git/);
  assert.match(html, /Handwritten/);
  assert.match(html, /Search roadmaps/);
  assert.match(html, /<select id="roadmap-origin"/);
  assert.match(html, /1 of 3 tracked/);
  const error = h.render(
    createElement(h.view.RoadmapBrowser, {
      source: { pending: false, error: true, retry() {} },
      renderCard,
    }),
  );
  assert.match(error, /role="alert"/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /No roadmaps available|0 roadmaps/);
  const loading = h.render(
    createElement(h.view.RoadmapBrowser, {
      source: { pending: true, error: false, retry() {} },
      renderCard,
    }),
  );
  assert.match(loading, /Loading roadmaps/);
  assert.doesNotMatch(loading, /No roadmaps available/);
  assert.match(
    h.render(
      createElement(h.view.RoadmapBrowser, { source: ready([]), renderCard }),
    ),
    /No roadmaps available/,
  );
});
test("native module outlines, completed states and honest draft progress render", () => {
  const h = roadmapHarness();
  const html = h.render(
    createElement(h.view.RoadmapOverview, {
      roadmap: sample,
      name: "git",
      progress: ready(sampleProgress),
    }),
  );
  assert.match(html, /<details[^>]*open=""/);
  assert.match(html, /Completed/);
  assert.match(html, /Understanding branches/);
  assert.match(html, /\/modules\/getting-started\/lessons\/branches/);
  assert.match(html, /CLI/);
  assert.match(html, /aren’t included in completion totals/);
  const failed = h.render(
    createElement(h.view.RoadmapOverview, {
      roadmap: sample,
      name: "git",
      progress: { pending: false, error: true, retry() {} },
    }),
  );
  assert.match(failed, /Progress unavailable/);
  assert.doesNotMatch(failed, /0%|Continue learning/);
  const stale = h.render(
    createElement(h.view.RoadmapOverview, {
      roadmap: sample,
      name: "git",
      progress: { ...ready(sampleProgress), error: true },
    }),
  );
  assert.match(stale, /last loaded/);
  assert.doesNotMatch(stale, /Continue learning/);
});
test("CLI lesson links carry exact placement and do not race a default mode navigation", () => {
  const h = roadmapHarness();
  const loc = {
    kind: "concept",
    roadmap: "git",
    module: "start-2",
    concept: "branches",
  };
  const link = h.view.LearningCliLink({
    location: loc,
    conceptId: "c2",
    children: "Read",
  });
  const url = new URL(link.props.href, "http://test");
  assert.equal(url.searchParams.get("path"), "/roadmaps/git/start-2/branches");
  assert.equal(url.searchParams.get("concept"), "c2");
  link.props.onClick();
  assert.equal(h.calls[0][1], "cli");
  assert.equal(h.calls[0][2].navigate, false);
});
test("filter changes reset pages; page controls operate actual browser handlers", () => {
  const states = [],
    values = ["", "all", "newest", 2];
  let index = 0;
  const h = roadmapHarness({
    hooks: {
      useState: () => {
        const i = index++;
        return [values[i], (v) => states.push([i, v])];
      },
    },
  });
  const maps = Array.from({ length: 9 }, (_, i) => ({
    ...sample,
    id: `r${i}`,
    title: `Roadmap ${i}`,
  }));
  const tree = h.view.RoadmapBrowser({
    source: ready(maps),
    renderCard: (r) => createElement("article", { key: r.id }, r.title),
  });
  const input = walk(tree, (n) => n.type === "input")[0];
  input.props.onChange({ target: { value: "git" } });
  assert.deepEqual(states, [
    [0, "git"],
    [3, 1],
  ]);
  const buttons = walk(tree, (n) => n.type === "button");
  assert.equal(buttons[1].props.disabled, true);
  buttons[0].props.onClick();
  assert.deepEqual(states.at(-1), [3, 1]);
});
test("only eight displayed cards request progress and query reads are abortable/timed", () => {
  const h = roadmapHarness({
    queries: {
      roadmaps: {
        data: Array.from({ length: 25 }, (_, i) => ({
          ...sample,
          id: `r${i}`,
        })),
        isPending: false,
        refetch() {},
      },
    },
  });
  h.render(createElement(h.controller.RoadmapPage));
  assert.equal(
    h.queryCalls.filter((q) => q.queryKey.at(-1) === "progress").length,
    8,
  );
  const hook = readFileSync(
    new URL("../../lib/hooks/use-roadmap-progress.ts", import.meta.url),
    "utf8",
  );
  assert.match(hook, /signal, timeout: 12000/);
});
test("CLI mode gates the new GUI route and holds mode-aware loading while redirecting", () => {
  const effects = [];
  const h = roadmapHarness({
    mode: { ready: true, isCli: true },
    hooks: {
      useEffect: (effect) => effects.push(effect),
      useRef: (value) => ({ current: value }),
    },
  });
  const tree = h.controller.RoadmapPage({ reference: "r1" });
  effects.forEach((effect) => effect());
  assert.equal(tree.props.guiTitle, "Opening roadmaps");
  assert.deepEqual(h.calls, [["replace", "/developer/terminal?roadmap=r1"]]);
  assert.equal(h.queryCalls.length, 0);
});
test("after GUI is shown, the gate does not override an explicit lesson-mode handoff", () => {
  const effects = [],
    mode = { ready: true, isCli: false };
  const ref = { current: false };
  const h = roadmapHarness({
    mode,
    hooks: { useEffect: (fn) => effects.push(fn), useRef: () => ref },
  });
  h.controller.RoadmapPage({ reference: "r1" });
  effects.pop()();
  mode.isCli = true;
  h.controller.RoadmapPage({ reference: "r1" });
  effects.pop()();
  assert.equal(
    h.calls.length,
    0,
    "Next Link owns the intended path and lesson ID",
  );
});
test("scoped palette, select focus, responsive grids and reduced-motion are present", () => {
  const css = readFileSync(
    new URL("./roadmaps.module.css", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /minmax\(0, 1fr\)/);
  assert.match(css, /select:focus-visible/);
});

test("actual preference provider keeps developer shell for admins and ignores non-terminal path params", () => {
  const effects = [],
    changes = [],
    storage = [];
  const loc = {
    kind: "concept",
    roadmap: "git",
    module: "start",
    concept: "branches",
  };
  let stateIndex = 0;
  const values = ["cli", loc, true, true, true];
  const h = roadmapHarness({
    pathname: "/developer/roadmaps/git",
    hooks: {
      useState: () => {
        const i = stateIndex++;
        return [values[i], (v) => changes.push([i, v])];
      },
      useEffect: (fn) => effects.push(fn),
      useRef: (v) => ({ current: v }),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
    },
    globals: {
      localStorage: {
        getItem: () => null,
        setItem: (...args) => storage.push(args),
      },
    },
  });
  const provider = h.load(
    new URL("../../providers/ui-mode-provider.tsx", import.meta.url),
  );
  const tree = provider.UiModeProvider({ children: "child" });
  // This is the URL location effect, not the initial storage hydration effect.
  effects[2]();
  assert.equal(
    changes.length,
    0,
    "a mode change before Next navigation must not reset the concept",
  );
  tree.props.value.setMode("gui");
  assert.deepEqual(h.calls.at(-1), [
    "push",
    "/developer/roadmaps/git/modules/start/lessons/branches",
  ]);
  tree.props.value.setMode("cli");
  assert.equal(
    h.calls.at(-1)[1],
    "/developer/terminal?path=%2Froadmaps%2Fgit%2Fstart%2Fbranches",
  );
  assert.equal(
    storage.some(([key]) => key === "sd_last_location"),
    false,
  );
});
test("actual preference provider follows terminal back/forward path changes", () => {
  const effects = [],
    changes = [];
  let index = 0;
  const h = roadmapHarness({
    pathname: "/developer/terminal",
    searchParams: "path=%2Froadmaps%2Fgit%2Fstart",
    hooks: {
      useState: () => {
        const i = index++;
        return [
          ["cli", { kind: "root" }, true, true, true][i],
          (v) => changes.push([i, v]),
        ];
      },
      useEffect: (fn) => effects.push(fn),
      useRef: (v) => ({ current: v }),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
    },
    globals: { localStorage: { setItem() {} } },
  });
  h.load(
    new URL("../../providers/ui-mode-provider.tsx", import.meta.url),
  ).UiModeProvider({ children: null });
  effects[2]();
  assert.equal(changes[0][0], 1);
  assert.equal(changes[0][1].kind, "module");
  assert.equal(changes[0][1].roadmap, "git");
});

test("module resolution is parent-scoped and shares canonical collision names", () => {
  const d = roadmapHarness().data;
  const maps = {
    ...sample,
    modules: sample.modules.map((m) => ({ ...m, title: "Start" })),
  };
  assert.equal(d.findModule(maps, "git", "start-2").module.id, "m2");
  assert.equal(d.findModule(maps, "git", "m1").location.module, "start");
  assert.equal(
    d.findModule({ ...sample, modules: [sample.modules[1]] }, "git", "m1"),
    undefined,
  );
  const entry = d.findModule(sample, "git", "m1");
  assert.equal(
    d.moduleRoute(entry.location),
    "/developer/roadmaps/git/modules/getting-started",
  );
});
test("module totals count tracked local placements, not drafts or other modules", () => {
  const d = roadmapHarness().data;
  const entry = d.findModule(sample, "git", "m1");
  assert.equal(d.moduleProgress(entry, sampleProgress).totalConcepts, 2);
  assert.equal(
    d.moduleProgress(entry, sampleProgress).completedConceptsCount,
    1,
  );
  assert.equal(
    d.moduleProgress(entry, sampleProgress).completionPercentage,
    50,
  );
  entry.concepts.push({
    ...entry.concepts[0],
    placement: { ...entry.concepts[0].placement, id: "repeat" },
  });
  entry.concepts.push({
    ...entry.concepts[0],
    placement: {
      ...entry.concepts[0].placement,
      id: "draft",
      conceptId: "draft",
    },
  });
  assert.equal(d.moduleProgress(entry, sampleProgress).totalConcepts, 3);
  assert.equal(
    d.moduleProgress(entry, sampleProgress).completedConceptsCount,
    2,
  );
  assert.equal(
    d.moduleProgress(entry, { ...sampleProgress, concepts: [] }).totalConcepts,
    0,
  );
});
test("module recommendation stays local but honors prerequisites in other modules", () => {
  const d = roadmapHarness().data;
  const entry = d.findModule(sample, "git", "m2");
  assert.equal(
    d.nextModuleLesson(entry, sampleProgress).placement.conceptId,
    "c3",
  );
  entry.concepts[0].placement = {
    ...entry.concepts[0].placement,
    prerequisites: [{ prerequisiteConceptId: "c2", title: "Branches" }],
  };
  assert.equal(d.nextModuleLesson(entry, sampleProgress), undefined);
  assert.equal(
    d.nextModuleLesson(entry, {
      ...sampleProgress,
      concepts: sampleProgress.concepts.map((c) => ({
        ...c,
        status: "completed",
      })),
    }),
    undefined,
  );
  assert.equal(d.nextModuleLesson(entry), undefined);
});
test("module projection preserves the exact same-module concept; another module is a real move", () => {
  const d = roadmapHarness().data;
  const target = d.findModule(sample, "git", "m1").location;
  const deep = { ...target, kind: "concept", concept: "branches" };
  assert.equal(d.moduleOverviewLocation(deep, target), deep);
  const other = d.findModule(sample, "git", "m2").location;
  assert.equal(d.moduleOverviewLocation(deep, other), other);
  assert.equal(
    d.moduleOverviewLocation({ ...deep, roadmap: "other" }, target),
    target,
  );
});
test("module overview renders local progress, breadcrumbs, GUI lessons and module navigation", () => {
  const h = roadmapHarness();
  const view = h.load(new URL("./module-view.tsx", import.meta.url));
  const props = {
    roadmap: sample,
    name: "git",
    entry: h.data.findModule(sample, "git", "m1"),
    progress: ready(sampleProgress),
  };
  const html = h.render(createElement(view.ModuleOverview, props));
  assert.match(html, /1 of 2 tracked concepts completed/);
  assert.match(html, /50%/);
  assert.doesNotMatch(html, /1 of 3 tracked|33%/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /Inside this module/);
  assert.match(html, /\/modules\/getting-started\/lessons\/branches/);
  assert.match(
    html,
    /href="\/developer\/roadmaps\/git\/modules\/bringing-work-together"/,
  );
  assert.match(html, /Reading a lesson doesn’t mark it complete/);
  const completed = h.render(
    createElement(view.ModuleOverview, {
      ...props,
      progress: ready({
        ...sampleProgress,
        concepts: sampleProgress.concepts.map((c) => ({
          ...c,
          status: "completed",
        })),
      }),
    }),
  );
  assert.match(completed, /completed all tracked concepts in this module/);
  assert.doesNotMatch(completed, /Continue learning/);
});
test("module pending, failed, stale, untracked and empty states never fabricate completion", () => {
  const h = roadmapHarness();
  const view = h.load(new URL("./module-view.tsx", import.meta.url));
  const props = {
    roadmap: sample,
    name: "git",
    entry: h.data.findModule(sample, "git", "m1"),
  };
  const render = (progress, entry = props.entry) =>
    h.render(createElement(view.ModuleOverview, { ...props, entry, progress }));
  assert.match(
    render({ pending: true, retry() {} }),
    /Checking progress…|Loading learning progress/,
  );
  const failed = render({ error: true, pending: false, retry() {} });
  assert.match(failed, /Try again/);
  assert.doesNotMatch(failed, /0%|Continue learning/);
  const stale = render({ ...ready(sampleProgress), error: true });
  assert.match(stale, /last loaded|couldn’t refresh/);
  assert.doesNotMatch(stale, /Continue learning/);
  const untracked = render(ready({ ...sampleProgress, concepts: [] }));
  assert.match(untracked, /No approved concepts are tracked for this module/);
  assert.doesNotMatch(untracked, /100%|completed all tracked/);
  assert.match(
    render(ready(sampleProgress), { ...props.entry, concepts: [] }),
    /No visible concepts yet/,
  );
});
const moduleQueries = (detail = sample) => ({
  roadmaps: { data: [sample], isPending: false, refetch() {} },
  "roadmaps/r1/detail": { data: detail, isPending: false, refetch() {} },
  "roadmaps/r1/progress": {
    data: sampleProgress,
    isPending: false,
    refetch() {},
  },
});

const sampleLesson = {
  id: "c2",
  title: "Understanding branches",
  content: "## A movable pointer\n\nA branch points to a commit.",
  reviewStatus: "approved",
  originLabel: "handwritten",
  media: [],
};
const sampleQuiz = {
  conceptId: "c2",
  totalQuestions: 4,
  allQuestionsResolved: true,
};
const lessonQueries = () => ({
  ...moduleQueries(),
  "concepts/c2/lesson": { data: sampleLesson, isPending: false, refetch() {} },
  "concepts/c2/quiz-status": {
    data: sampleQuiz,
    isPending: false,
    refetch() {},
  },
});
test("lesson resolution is placement-scoped, ID/name-compatible and lossless", () => {
  const d = roadmapHarness().data;
  const entry = d.findModule(sample, "git", "m1");
  for (const reference of ["c2", "p2", "branches"]) {
    const l = d.findLesson(entry, reference);
    assert.equal(l.placement.id, "p2");
    assert.equal(
      d.lessonRoute(l.location),
      "/developer/roadmaps/git/modules/getting-started/lessons/branches",
    );
  }
  assert.equal(d.findLesson(entry, "c3"), undefined);
});
test("completion gates require current matching content, tracking, placement prerequisites and resolved quiz", () => {
  const h = roadmapHarness(),
    data = h.load(new URL("./lesson-data.ts", import.meta.url));
  const l = h.data.findLesson(h.data.findModule(sample, "git", "m1"), "c2");
  assert.equal(
    data.completionBlock(l, sampleLesson, sampleProgress, sampleQuiz),
    undefined,
  );
  assert.match(data.completionBlock(l), /Waiting/);
  assert.match(
    data.completionBlock(
      l,
      { ...sampleLesson, reviewStatus: "pending" },
      sampleProgress,
      sampleQuiz,
    ),
    /approved/,
  );
  assert.match(
    data.completionBlock(
      l,
      { ...sampleLesson, content: " " },
      sampleProgress,
      sampleQuiz,
    ),
    /no published content/,
  );
  assert.match(
    data.completionBlock(
      l,
      sampleLesson,
      { ...sampleProgress, concepts: [] },
      sampleQuiz,
    ),
    /not tracked/,
  );
  assert.match(
    data.completionBlock(
      l,
      sampleLesson,
      {
        ...sampleProgress,
        concepts: [{ conceptId: "c2", status: "in_progress" }],
      },
      sampleQuiz,
    ),
    /prerequisites/,
  );
  assert.match(
    data.completionBlock(l, sampleLesson, sampleProgress, {
      ...sampleQuiz,
      allQuestionsResolved: false,
    }),
    /knowledge check/,
  );
  assert.equal(
    data.completionBlock(l, sampleLesson, sampleProgress, {
      ...sampleQuiz,
      totalQuestions: 0,
      allQuestionsResolved: false,
    }),
    undefined,
  );
  assert.match(
    data.completionBlock(l, sampleLesson, sampleProgress, {
      ...sampleQuiz,
      conceptId: "c3",
    }),
    /changed/,
  );
  assert.match(
    data.completionBlock(l, sampleLesson, sampleProgress, { conceptId: "c2" }),
    /incomplete/,
  );
});
test("Markdown renders actual text, code, tables and matched TOC IDs without raw HTML or active unsafe URLs", () => {
  const h = roadmapHarness(),
    view = h.load(new URL("./lesson-markdown.tsx", import.meta.url)),
    data = h.load(new URL("./lesson-data.ts", import.meta.url));
  const text =
    "## Repeat\n\nReal lesson.\n\n## Repeat\n\n<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n![external](https://example.com/image.png)\n\n```js\nconst ok = true;\n```\n\n| A | B |\n| - | - |\n| one | two |\n\n{{diagram:missing}}";
  const html = h.render(createElement(view.LessonMarkdown, { content: text }));
  for (const item of data.lessonOutline(text))
    assert.ok(html.includes(`id="${item.id}"`));
  assert.match(html, /Real lesson/);
  assert.match(html, /const ok = true/);
  assert.match(html, /<table>/);
  assert.match(html, /Load image/);
  assert.doesNotMatch(html, /<img|<script|href="javascript/);
  assert.match(html, /diagram is unavailable/);
  const literal = h.render(
    createElement(view.LessonMarkdown, {
      content: "```text\n{{diagram:missing}}\n```",
    }),
  );
  assert.match(literal, /\{\{diagram:missing\}\}/);
  assert.doesNotMatch(literal, /diagram is unavailable/);
});
test("media validation and diagram bounds reject unsupported input without loading external resources", () => {
  const h = roadmapHarness(),
    data = h.load(new URL("./lesson-data.ts", import.meta.url)),
    diagram = h.load(new URL("./lesson-diagram.tsx", import.meta.url));
  for (const value of [
    "javascript:alert(1)",
    "//example.com/x",
    "https://user:pass@example.com/x",
    "data:image/svg+xml,x",
  ])
    assert.equal(data.safeMediaUrl(value), undefined);
  assert.equal(
    data.videoId({ kind: "video", payload: { videoId: "dQw4w9WgXcQ" } }),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    data.videoId({ kind: "video", payload: { videoId: "evil?autoplay=1" } }),
    undefined,
  );
  assert.equal(diagram.validDiagramSource("flowchart LR\nA-->B"), true);
  for (const source of [
    "",
    "x".repeat(20001),
    "%%{init: { securityLevel: 'loose' }}%%\nA-->B",
    "---\nconfig:\n---\nA-->B",
  ])
    assert.equal(diagram.validDiagramSource(source), false);
});

test("video player is opt-in, uses only a validated fixed-host embed, and can be closed", () => {
  const values = [false, true];
  let index = 0;
  const h = roadmapHarness({
    hooks: {
      useState(initial) {
        const slot = index++;
        return [
          values[slot] ?? initial,
          (v) => {
            values[slot] = v;
          },
        ];
      },
    },
  });
  const view = h.load(new URL("./lesson-markdown.tsx", import.meta.url));
  const media = {
    id: "video",
    kind: "video",
    payload: {
      videoId: "dQw4w9WgXcQ",
      title: "Sample video",
      url: "https://untrusted.invalid/embed",
    },
    license: "youtube",
  };
  const parent = view.LessonVideos({ media: [media] });
  const child = walk(
    parent,
    (n) => typeof n.type === "function" && n.type.name === "Video",
  )[0];
  const first = child.type(child.props);
  assert.equal(walk(first, (n) => n.type === "iframe").length, 0);
  walk(first, (n) => n.type === "button")[0].props.onClick();
  index = 0;
  const playing = child.type(child.props);
  const iframe = walk(playing, (n) => n.type === "iframe")[0];
  assert.equal(
    iframe.props.src,
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(iframe.props.title, "Sample video");
  assert.doesNotMatch(iframe.props.src, /untrusted|autoplay/);
  walk(playing, (n) => n.type === "button")[0].props.onClick();
  index = 0;
  assert.equal(
    walk(child.type(child.props), (n) => n.type === "iframe").length,
    0,
  );
});
test("reader uses real content, exact CLI placement, GUI adjacent lessons and distinct feedback states", () => {
  const h = roadmapHarness(),
    view = h.load(new URL("./lesson-view.tsx", import.meta.url));
  const entry = h.data.findModule(sample, "git", "m1"),
    lesson = h.data.findLesson(entry, "c2");
  const props = {
    roadmap: sample,
    name: "git",
    entry,
    lesson,
    content: sampleLesson,
    progress: ready(sampleProgress),
    quiz: ready(sampleQuiz),
    start: { pending: false, run() {} },
    complete: { pending: false, run() {} },
  };
  const render = (overrides = {}) =>
    h.render(createElement(view.LessonView, { ...props, ...overrides }));
  const html = render();
  assert.match(html, /A branch points to a commit/);
  assert.match(html, /concept=c2/);
  assert.match(html, /lessons\/merging/);
  assert.match(html, /Mark lesson complete/);
  assert.match(html, /Review knowledge check/);
  assert.match(
    render({ quiz: ready({ ...sampleQuiz, allQuestionsResolved: false }) }),
    /Start knowledge check/,
  );
  assert.match(html, /lessons\/branches\/quiz/);
  assert.doesNotMatch(html, /next checkpoint/);
  assert.doesNotMatch(html, /draftContent/);
  assert.match(
    render({
      start: { pending: false, error: "Network unavailable", run() {} },
    }),
    /Retry saving progress/,
  );
  assert.match(
    render({ complete: { pending: true, run() {} } }),
    /Checking and saving/,
  );
  assert.match(
    render({ complete: { pending: false, success: true, run() {} } }),
    /Lesson marked complete/,
  );
  assert.match(
    render({ complete: { pending: false, error: "Refresh first", run() {} } }),
    /Completion couldn’t be confirmed/,
  );
  assert.match(
    render({ content: { ...sampleLesson, content: null } }),
    /No lesson content yet/,
  );
  assert.match(
    render({ progress: { ...ready(sampleProgress), error: true } }),
    /Progress check unavailable/,
  );
});
test("completion preflight uses fresh reads and never posts when gates, placement or visibility fail", async () => {
  for (const failure of ["quiz", "prerequisites", "placement", "visibility"]) {
    const calls = [];
    const h = roadmapHarness({
      api: {
        async get(path) {
          calls.push(path);
          if (failure === "visibility" && path === "/concepts/c2")
            throw new Error("Unavailable");
          if (path === "/roadmaps/r1")
            return {
              data:
                failure === "placement" ? { ...sample, modules: [] } : sample,
            };
          if (path.endsWith("/progress"))
            return {
              data:
                failure === "prerequisites"
                  ? {
                      ...sampleProgress,
                      concepts: [{ conceptId: "c2", status: "in_progress" }],
                    }
                  : sampleProgress,
            };
          return {
            data: path.endsWith("quiz-status")
              ? { ...sampleQuiz, allQuestionsResolved: failure !== "quiz" }
              : sampleLesson,
          };
        },
        async post() {
          calls.push("POST");
        },
      },
    });
    const entry = h.data.findModule(sample, "git", "m1"),
      lesson = h.data.findLesson(entry, "c2");
    await assert.rejects(
      h
        .load(new URL("./gui-lesson.tsx", import.meta.url))
        .saveLessonCompletion(sample, "git", entry, lesson),
    );
    assert.equal(calls.includes("POST"), false);
  }
});
test("eligible completion posts only after four successful reads and returns the real acknowledgement", async () => {
  const calls = [],
    ack = { data: { status: "completed" } };
  const h = roadmapHarness({
    api: {
      async get(path) {
        calls.push(path);
        return {
          data:
            path === "/roadmaps/r1"
              ? sample
              : path.endsWith("/progress")
                ? sampleProgress
                : path.endsWith("quiz-status")
                  ? sampleQuiz
                  : sampleLesson,
        };
      },
      async post(path, body, options) {
        calls.push(path);
        assert.deepEqual(JSON.parse(JSON.stringify(body)), {});
        assert.equal(options.timeout, 12000);
        return ack;
      },
    },
  });
  const entry = h.data.findModule(sample, "git", "m1");
  assert.equal(
    await h
      .load(new URL("./gui-lesson.tsx", import.meta.url))
      .saveLessonCompletion(
        sample,
        "git",
        entry,
        h.data.findLesson(entry, "c2"),
      ),
    ack,
  );
  assert.equal(calls.length, 5);
  assert.equal(calls.at(-1), "/concepts/c2/complete");
});
test("reader starts once, never auto-completes, and stores the exact successfully resolved placement", () => {
  const effects = [],
    h = roadmapHarness({
      queries: lessonQueries(),
      hooks: { useEffect: (fn) => effects.push(fn) },
    });
  h.render(
    createElement(h.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
      conceptReference: "c2",
    }),
  );
  effects.forEach((fn) => fn());
  effects.forEach((fn) => fn());
  assert.equal(h.calls.filter((c) => c[0] === "mutation").length, 1);
  const last = h.calls.filter((c) => c[0] === "location").at(-1)[1];
  assert.equal(last.kind, "concept");
  assert.equal(last.concept, "branches");
});
test("reader wrong-parent/404 links hide cached content and don't write location or progress", () => {
  for (const reference of ["c3", "c2"]) {
    const effects = [],
      queries = lessonQueries();
    if (reference === "c2")
      queries["concepts/c2/lesson"] = {
        data: sampleLesson,
        isError: true,
        error: { response: { status: 404 } },
        isPending: false,
        refetch() {},
      };
    const h = roadmapHarness({
      queries,
      hooks: { useEffect: (fn) => effects.push(fn) },
    });
    const html = h.render(
      createElement(h.controller.RoadmapPage, {
        reference: "r1",
        moduleReference: "m1",
        conceptReference: reference,
      }),
    );
    effects.forEach((fn) => fn());
    assert.match(html, /Lesson unavailable/);
    assert.doesNotMatch(html, /A branch points to a commit/);
    assert.equal(
      h.calls.filter((c) => ["location", "mutation"].includes(c[0])).length,
      0,
    );
  }
});

test("cached lessons never start progress or move location until parent and lesson reads finish successfully", () => {
  for (const key of ["roadmaps", "roadmaps/r1/detail", "concepts/c2/lesson"]) {
    const effects = [],
      queries = lessonQueries();
    queries[key] = { ...queries[key], isFetching: true };
    const h = roadmapHarness({
      queries,
      hooks: { useEffect: (fn) => effects.push(fn) },
    });
    const html = h.render(
      createElement(h.controller.RoadmapPage, {
        reference: "r1",
        moduleReference: "m1",
        conceptReference: "c2",
      }),
    );
    effects.forEach((fn) => fn());
    assert.match(html, /Confirming the current lesson placement/);
    assert.equal(
      h.calls.filter((c) => ["location", "mutation"].includes(c[0])).length,
      0,
    );
  }
});
test("direct CLI reader handoff resolves placement IDs to exact path and concept ID", () => {
  const effects = [],
    h = roadmapHarness({
      queries: moduleQueries(),
      mode: { ready: true, isCli: true, location: { kind: "root" } },
      hooks: {
        useEffect: (fn) => effects.push(fn),
        useRef: (v) => ({ current: v }),
      },
    });
  h.render(
    createElement(h.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
      conceptReference: "p2",
    }),
  );
  effects.forEach((fn) => fn());
  assert.equal(
    h.calls.at(-1)[1],
    "/developer/terminal?path=%2Froadmaps%2Ffoundations-of-git%2Fgetting-started%2Fbranches&concept=c2",
  );
});
test("module controller resolves API IDs and handles wrong-parent/missing/404 links without leaking cached lessons", () => {
  const render = (reference, moduleReference, queries = moduleQueries()) => {
    const h = roadmapHarness({ queries });
    return h.render(
      createElement(h.controller.RoadmapPage, { reference, moduleReference }),
    );
  };
  assert.match(render("r1", "m1"), /Inside this module/);
  assert.match(
    render("foundations-of-git", "getting-started"),
    /Your progress here/,
  );
  const absent = render(
    "r1",
    "m1",
    moduleQueries({ ...sample, modules: [sample.modules[1]] }),
  );
  assert.match(absent, /Module unavailable/);
  assert.doesNotMatch(absent, /How commits connect/);
  const missing = render("r1", "missing");
  assert.match(missing, /Check again|Back to this roadmap/);
  const denied = render("r1", "m1", {
    ...moduleQueries(),
    "roadmaps/r1/detail": {
      data: sample,
      isPending: false,
      isError: true,
      error: { response: { status: 404 } },
      refetch() {},
    },
  });
  assert.match(denied, /Roadmap unavailable/);
  assert.doesNotMatch(denied, /How commits connect|Inside this module/);
  assert.match(render("r1", "../bad"), /Invalid roadmap link/);
});
test("direct CLI module handoff resolves IDs to canonical paths and never redirects on read failure", () => {
  const effects = [];
  const h = roadmapHarness({
    mode: { ready: true, isCli: true, location: { kind: "root" } },
    queries: moduleQueries(),
    hooks: {
      useEffect: (fn) => effects.push(fn),
      useRef: (v) => ({ current: v }),
    },
  });
  h.render(
    createElement(h.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
    }),
  );
  effects.forEach((fn) => fn());
  assert.equal(
    h.calls.at(-1)[1],
    "/developer/terminal?path=%2Froadmaps%2Ffoundations-of-git%2Fgetting-started",
  );
  const failedEffects = [];
  const failed = roadmapHarness({
    mode: { ready: true, isCli: true, location: { kind: "root" } },
    queries: { roadmaps: { isError: true, isPending: false, refetch() {} } },
    hooks: {
      useEffect: (fn) => failedEffects.push(fn),
      useRef: (v) => ({ current: v }),
    },
  });
  const html = failed.render(
    createElement(failed.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
    }),
  );
  failedEffects.forEach((fn) => fn());
  assert.match(html, /Module couldn’t open|Try again/);
  assert.equal(failed.calls.length, 0);
});
test("module controller does not reset a fallback concept and cannot override explicit GUI-to-CLI navigation", () => {
  const effects = [];
  const location = {
    kind: "concept",
    roadmap: "foundations-of-git",
    module: "getting-started",
    concept: "branches",
  };
  const h = roadmapHarness({
    mode: { ready: true, isCli: false, location },
    queries: moduleQueries(),
    hooks: { useEffect: (fn) => effects.push(fn) },
  });
  h.render(
    createElement(h.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
    }),
  );
  effects.forEach((fn) => fn());
  assert.equal(
    h.calls.length,
    0,
    "nearest module rendering preserves the concept",
  );
  const handoffEffects = [];
  const handoff = roadmapHarness({
    mode: { ready: true, isCli: true, location },
    queries: moduleQueries(),
    hooks: { useEffect: (fn) => handoffEffects.push(fn) },
  });
  handoff.render(
    createElement(handoff.controller.ModuleCliHandoff, {
      reference: "r1",
      moduleReference: "m1",
      guiWasShown: { current: true },
    }),
  );
  handoffEffects.forEach((fn) => fn());
  assert.equal(
    handoff.calls.length,
    0,
    "explicit Next links own lesson navigation",
  );
});
test("module motif keeps the orange tokens and stops its finite animation for reduced motion", () => {
  const css = readFileSync(
    new URL("./module.module.css", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.match(css, /animation: connect 800ms/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /stroke-dashoffset: 0/);
  assert.match(css, /aria-current="page"/);
});

const quizQuestions = [
  {
    id: "q1",
    conceptId: "c2",
    questionText: "What does a branch point to?",
    orderIndex: 0,
    options: [
      {
        id: "o2",
        optionText: "A copy of every file",
        orderIndex: 1,
        isCorrect: false,
        misconception: "Do not leak",
      },
      { id: "o1", optionText: "A commit", orderIndex: 0, isCorrect: true },
    ],
  },
  {
    id: "q2",
    conceptId: "c2",
    questionText: "When does it move?",
    orderIndex: 1,
    options: [
      { id: "o3", optionText: "When you commit on it", orderIndex: 0 },
      { id: "o4", optionText: "Whenever you read it", orderIndex: 1 },
    ],
  },
];
const quizStatus = {
  conceptId: "c2",
  totalQuestions: 2,
  allQuestionsResolved: false,
  questions: quizQuestions.map((q) => ({
    questionId: q.id,
    questionText: q.questionText,
    attemptsUsed: 0,
    attemptsRemaining: 3,
    isCorrect: false,
    isResolved: false,
  })),
};
function quizSetup(options = {}) {
  const h = roadmapHarness(options),
    entry = h.data.findModule(sample, "git", "m1"),
    lesson = h.data.findLesson(entry, "c2"),
    dataModule = h.load(new URL("./quiz-data.ts", import.meta.url));
  return {
    h,
    entry,
    lesson,
    dataModule,
    data: dataModule.parseKnowledgeCheck(
      sampleLesson,
      quizQuestions,
      quizStatus,
    ),
  };
}
test("knowledge check projects ordered student fields and never reveals author keys before resolution", () => {
  const { data } = quizSetup();
  assert.equal(data.questions[0].options[0].id, "o1");
  assert.doesNotMatch(
    JSON.stringify(data.questions),
    /isCorrect|misconception|distractorRationale/,
  );
  const { dataModule } = quizSetup();
  const parsed = dataModule.parseKnowledgeCheck(sampleLesson, quizQuestions, {
    ...quizStatus,
    questions: quizStatus.questions.map((s) => ({
      ...s,
      correctOptionId: "o1",
    })),
  });
  assert.equal(parsed.status.questions[0].correctOptionId, undefined);
});
test("knowledge check rejects partial, mismatched, duplicate and inconsistent snapshots rather than fake empty status", () => {
  const { dataModule } = quizSetup();
  for (const status of [
    undefined,
    { ...quizStatus, conceptId: "other" },
    { ...quizStatus, totalQuestions: 0 },
    { ...quizStatus, questions: [quizStatus.questions[0]] },
    {
      ...quizStatus,
      questions: [quizStatus.questions[0], quizStatus.questions[0]],
    },
    { ...quizStatus, allQuestionsResolved: true },
    {
      ...quizStatus,
      questions: quizStatus.questions.map((s) => ({
        ...s,
        attemptsRemaining: 2,
      })),
    },
  ])
    assert.throws(
      () => dataModule.parseKnowledgeCheck(sampleLesson, quizQuestions, status),
      /incomplete|changed/,
    );
  assert.throws(() =>
    dataModule.parseKnowledgeCheck(
      sampleLesson,
      [quizQuestions[0], quizQuestions[0]],
      quizStatus,
    ),
  );
  assert.throws(() =>
    dataModule.parseKnowledgeCheck(
      sampleLesson,
      [{ ...quizQuestions[0], options: [] }],
      quizStatus,
    ),
  );
  const empty = dataModule.parseKnowledgeCheck(sampleLesson, [], {
    conceptId: "c2",
    totalQuestions: 0,
    allQuestionsResolved: false,
    questions: [],
  });
  assert.equal(empty.questions.length, 0);
});
test("attempt acknowledgement hides unresolved keys and validates server counts instead of grading locally", () => {
  const { dataModule, data } = quizSetup(),
    question = data.questions[0],
    status = data.status.questions[0];
  const result = dataModule.parseAttemptResult(
    {
      isCorrect: false,
      attemptNumber: 1,
      attemptsRemaining: 2,
      correctOptionId: "o1",
    },
    question,
    "o2",
    status,
  );
  assert.equal(result.correctOptionId, undefined);
  assert.throws(() =>
    dataModule.parseAttemptResult(
      { isCorrect: true, attemptNumber: 1, attemptsRemaining: 1 },
      question,
      "o1",
      status,
    ),
  );
  assert.throws(() =>
    dataModule.parseAttemptResult(
      {
        isCorrect: true,
        attemptNumber: 1,
        attemptsRemaining: 2,
        correctOptionId: "o1",
      },
      question,
      "o2",
      status,
    ),
  );
  const exhausted = dataModule.parseAttemptResult(
    {
      isCorrect: false,
      attemptNumber: 3,
      attemptsRemaining: 0,
      correctOptionId: "o1",
    },
    question,
    "o2",
    { ...status, attemptsUsed: 2, attemptsRemaining: 1 },
  );
  assert.equal(exhausted.correctOptionId, "o1");
});
test("quiz prerequisites and approval are per placement and require real progress", () => {
  const { dataModule, data, lesson } = quizSetup();
  assert.equal(
    dataModule.quizActionBlock(lesson, data, sampleProgress),
    undefined,
  );
  assert.match(dataModule.quizActionBlock(lesson, data), /progress/);
  assert.match(
    dataModule.quizActionBlock(
      lesson,
      { ...data, content: { ...sampleLesson, reviewStatus: "draft" } },
      sampleProgress,
    ),
    /Author preview/,
  );
  assert.match(
    dataModule.quizActionBlock(lesson, data, {
      ...sampleProgress,
      concepts: [],
    }),
    /progress/,
  );
  assert.match(
    dataModule.quizActionBlock(lesson, data, {
      ...sampleProgress,
      concepts: sampleProgress.concepts.map((c) => ({
        ...c,
        status: "not_started",
      })),
    }),
    /prerequisites/,
  );
});
function quizApi({ failure, posts, gets } = {}) {
  return {
    async get(url, options) {
      gets?.push([url, options]);
      if (failure === "visibility" && url === "/concepts/c2")
        throw { response: { status: 403 } };
      let value =
        url === "/roadmaps/r1"
          ? sample
          : url === "/roadmaps/r1/progress"
            ? sampleProgress
            : url === "/concepts/c2"
              ? sampleLesson
              : url.endsWith("/questions")
                ? quizQuestions
                : quizStatus;
      if (failure === "placement" && url === "/roadmaps/r1")
        value = { ...sample, modules: [] };
      if (failure === "status" && url.endsWith("quiz-status"))
        value = undefined;
      if (failure === "changed" && url.endsWith("/questions"))
        value = quizQuestions.map((q) => ({
          ...q,
          questionText: q.questionText + " changed",
        }));
      if (failure === "used" && url.endsWith("quiz-status"))
        value = {
          ...quizStatus,
          questions: quizStatus.questions.map((s) => ({
            ...s,
            attemptsUsed: 1,
            attemptsRemaining: 2,
          })),
        };
      if (failure === "prerequisite" && url.endsWith("/progress"))
        value = {
          ...sampleProgress,
          concepts: sampleProgress.concepts.map((c) => ({
            ...c,
            status: "not_started",
          })),
        };
      return { data: value };
    },
    async post(url, body, options) {
      posts?.push([url, body, options]);
      if (failure === "timeout")
        throw { isAxiosError: true, code: "ECONNABORTED" };
      return {
        data:
          failure === "ack"
            ? {}
            : {
                isCorrect: true,
                attemptNumber: 1,
                attemptsRemaining: 2,
                correctOptionId: "o1",
              },
      };
    },
  };
}
test("quiz loads the guarded lesson before questions and stops hidden reads", async () => {
  const gets = [],
    { h } = quizSetup({ api: quizApi({ failure: "visibility", gets }) });
  const client = h.load(new URL("./quiz-client.ts", import.meta.url));
  await assert.rejects(client.loadKnowledgeCheck("c2"));
  assert.equal(gets.length, 1);
  assert.equal(gets[0][0], "/concepts/c2");
  assert.equal(gets[0][1].timeout, 12000);
});
test("fresh quiz preflight never posts on changed placement, visibility, question, attempt history or prerequisites", async () => {
  for (const failure of [
    "placement",
    "visibility",
    "status",
    "changed",
    "used",
    "prerequisite",
  ]) {
    const posts = [],
      { h, data, entry, lesson } = quizSetup({
        api: quizApi({ failure, posts }),
      });
    await assert.rejects(
      h
        .load(new URL("./quiz-client.ts", import.meta.url))
        .submitQuizAnswer(sample, "git", entry, lesson, data, {
          questionId: "q1",
          selectedOptionId: "o1",
        }),
    );
    assert.equal(posts.length, 0, failure);
  }
});
test("eligible quiz answer uses real IDs and exactly one POST after fresh reads", async () => {
  const posts = [],
    gets = [],
    { h, data, entry, lesson } = quizSetup({ api: quizApi({ posts, gets }) });
  const result = await h
    .load(new URL("./quiz-client.ts", import.meta.url))
    .submitQuizAnswer(sample, "git", entry, lesson, data, {
      questionId: "q1",
      selectedOptionId: "o1",
    });
  assert.equal(gets.length, 5);
  assert.equal(posts.length, 1);
  assert.equal(posts[0][0], "/questions/q1/attempt");
  assert.equal(posts[0][1].selectedOptionId, "o1");
  assert.equal(result.result.isCorrect, true);
});
test("timed-out and malformed quiz acknowledgements are never retried or reported as saved", async () => {
  for (const failure of ["timeout", "ack"]) {
    const posts = [],
      { h, data, entry, lesson } = quizSetup({
        api: quizApi({ failure, posts }),
      });
    const client = h.load(new URL("./quiz-client.ts", import.meta.url));
    let error;
    try {
      await client.submitQuizAnswer(sample, "git", entry, lesson, data, {
        questionId: "q1",
        selectedOptionId: "o1",
      });
    } catch (caught) {
      error = caught;
    }
    assert.ok(error);
    assert.equal(posts.length, 1);
    assert.match(client.quizError(error), /may already have used an attempt/);
  }
});
test("quiz renders native answer choices, saved counters, empty/error states and exact CLI handoff", () => {
  const { h, data, entry, lesson, dataModule } = quizSetup();
  const view = h.load(new URL("./quiz-view.tsx", import.meta.url));
  const props = {
    roadmap: sample,
    name: "git",
    entry,
    lesson,
    data,
    progress: ready(sampleProgress),
    onAnswer() {},
    onRefresh() {},
  };
  const render = (extra = {}) =>
    h.render(createElement(view.QuizView, { ...props, ...extra }));
  const html = render();
  assert.match(html, /type="radio"/);
  assert.match(html, /fieldset/);
  assert.match(html, /3 attempts remaining/);
  assert.match(html, /view=quiz/);
  assert.match(html, /concept=c2/);
  assert.match(html, /Skip for now/);
  assert.doesNotMatch(html, /Correct answer|mastered|XP awarded|Do not leak/);
  assert.match(
    render({ error: "Request may have saved", canAnswer: false }),
    /Answer couldn’t be confirmed/,
  );
  assert.match(
    render({ refreshing: true, canAnswer: false }),
    /Checking your saved attempts/,
  );
  const empty = dataModule.parseKnowledgeCheck(sampleLesson, [], {
    conceptId: "c2",
    totalQuestions: 0,
    allQuestionsResolved: false,
    questions: [],
  });
  assert.match(render({ data: empty }), /No knowledge check attached/);
  assert.doesNotMatch(render({ data: empty }), /type="radio"/);
});
test("resolved is distinct from correct; exhausted questions reveal only status-authorized answers", () => {
  const { h, entry, lesson, dataModule } = quizSetup();
  const rawStatus = {
    ...quizStatus,
    allQuestionsResolved: true,
    questions: quizStatus.questions.map((s, i) => ({
      ...s,
      attemptsUsed: i ? 3 : 1,
      attemptsRemaining: i ? 0 : 2,
      isCorrect: !i,
      isResolved: true,
      correctOptionId: i ? "o3" : "o1",
    })),
  };
  const data = dataModule.parseKnowledgeCheck(
    sampleLesson,
    quizQuestions,
    rawStatus,
  );
  const html = h.render(
    createElement(
      h.load(new URL("./quiz-view.tsx", import.meta.url)).QuizView,
      {
        roadmap: sample,
        name: "git",
        entry,
        lesson,
        data,
        progress: ready(sampleProgress),
        onAnswer() {},
        onRefresh() {},
      },
    ),
  );
  assert.match(html, /Knowledge check resolved/);
  assert.match(html, /1 of 2 answered correctly/);
  assert.match(html, /Correct answer/);
  assert.match(html, /Out of attempts/);
  assert.doesNotMatch(html, /mastered|XP awarded|100% correct/);
});
test("quiz controller never writes on mount and disables attempts for stale context/history", () => {
  for (const stale of ["context", "history", "refresh", "ready"]) {
    const base = quizSetup(),
      effects = [],
      queries = {
        "concepts/c2/quiz": {
          data: base.data,
          isError: stale === "history",
          isFetching: stale === "refresh",
          isPending: false,
          refetch: async () => ({ isError: true }),
        },
        "roadmaps/r1/progress": {
          data: sampleProgress,
          isPending: false,
          isFetching: false,
          refetch() {},
        },
      };
    const { h, entry, lesson } = quizSetup({
      queries,
      hooks: {
        useEffect: (fn) => effects.push(fn),
        useRef: (v) => ({ current: v }),
      },
    });
    const tree = h.load(new URL("./gui-quiz.tsx", import.meta.url)).GuiQuiz({
      roadmap: sample,
      name: "git",
      entry,
      lesson,
      contextReady: stale !== "context",
    });
    effects.forEach((fn) => fn());
    assert.equal(
      h.calls.some((c) => c[0] === "mutation"),
      false,
    );
    const child = tree.props.children;
    assert.equal(child.props.canAnswer, stale === "ready");
    child.props.onAnswer({ questionId: "q1", selectedOptionId: "o1" });
    if (stale !== "ready")
      assert.equal(
        h.calls.some((c) => c[0] === "mutation"),
        false,
      );
    else {
      child.props.onAnswer({ questionId: "q1", selectedOptionId: "o1" });
      assert.equal(
        h.calls.filter((c) => c[0] === "mutation").length,
        1,
        "deduplicate rapid submits",
      );
      assert.equal(h.calls.find((c) => c[0] === "mutation")[1].retry, false);
    }
  }
});
test("direct quiz CLI handoff uses exact concept position and literal quiz view", () => {
  const effects = [],
    h = roadmapHarness({
      queries: moduleQueries(),
      mode: { ready: true, isCli: true, location: { kind: "root" } },
      hooks: {
        useEffect: (fn) => effects.push(fn),
        useRef: (v) => ({ current: v }),
      },
    });
  h.render(
    createElement(h.controller.RoadmapPage, {
      reference: "r1",
      moduleReference: "m1",
      conceptReference: "p2",
      quiz: true,
    }),
  );
  effects.forEach((fn) => fn());
  assert.equal(
    h.calls.at(-1)[1],
    "/developer/terminal?path=%2Froadmaps%2Ffoundations-of-git%2Fgetting-started%2Fbranches&concept=c2&view=quiz",
  );
});
test("terminal quiz URL composes only a literal allowlisted command with a safe single reference", async () => {
  const source = readFileSync(
    new URL("../../app/developer/terminal/page.tsx", import.meta.url),
    "utf8",
  );
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(js, {
    exports,
    require: (name) =>
      name === "react/jsx-runtime"
        ? requirePackage(name)
        : { TerminalWorkspace: () => null },
  });
  for (const [params, command] of [
    [{ view: "quiz", concept: "c2" }, "quiz c2"],
    [{ view: "qa", concept: "c2" }, "qa concept c2"],
    [{ view: "qa", concept: "c2;bad" }, "qa"],
    [{ concept: "c2" }, "cat c2"],
    [{ view: "quiz", concept: "c2;logout" }, undefined],
    [{ view: "quiz", concept: "c2 other" }, undefined],
    [{ view: "quiz" }, undefined],
  ]) {
    const element = await exports.default({
      searchParams: Promise.resolve(params),
    });
    assert.equal(element.props.initialCommand, command);
    assert.equal(element.props.commandsRole, "developer");
  }
});
test("an unconfirmed quiz attempt stays locked until an explicit successful status refresh", async () => {
  for (const refreshFails of [true, false]) {
    const base = quizSetup();
    const { h, entry, lesson } = quizSetup({
      queries: {
        "concepts/c2/quiz": {
          data: base.data,
          isPending: false,
          isFetching: false,
          refetch: async () => ({ isError: refreshFails }),
        },
        "roadmaps/r1/progress": {
          data: sampleProgress,
          isFetching: false,
          refetch() {},
        },
      },
      mutationResult: { isError: true, error: { isAxiosError: true } },
      hooks: { useEffect() {}, useRef: (v) => ({ current: v }) },
    });
    const child = h
      .load(new URL("./gui-quiz.tsx", import.meta.url))
      .GuiQuiz({ roadmap: sample, name: "git", entry, lesson }).props.children;
    assert.equal(child.props.canAnswer, false);
    child.props.onAnswer({ questionId: "q1", selectedOptionId: "o1" });
    assert.equal(
      h.calls.some((c) => c[0] === "mutation"),
      false,
    );
    child.props.onRefresh();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      h.calls.some((c) => c[0] === "reset-mutation"),
      !refreshFails,
    );
  }
});
test("quiz access-denied refresh hides cached questions and never updates saved location", () => {
  const base = quizSetup(),
    effects = [];
  const { h, entry, lesson } = quizSetup({
    queries: {
      "concepts/c2/quiz": {
        data: base.data,
        isPending: false,
        isFetching: false,
        isError: true,
        error: { response: { status: 403 } },
        refetch() {},
      },
      "roadmaps/r1/progress": { data: sampleProgress, refetch() {} },
    },
    hooks: {
      useEffect: (fn) => effects.push(fn),
      useRef: (v) => ({ current: v }),
    },
  });
  const tree = h
    .load(new URL("./gui-quiz.tsx", import.meta.url))
    .GuiQuiz({ roadmap: sample, name: "git", entry, lesson });
  effects.forEach((fn) => fn());
  const html = h.render(tree);
  assert.match(html, /Knowledge check unavailable/);
  assert.doesNotMatch(html, /What does a branch point/);
  assert.equal(
    h.calls.some((c) => c[0] === "location"),
    false,
  );
});
