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
  authUser = { role: "admin" },
  authToken = null,
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
        if (name === "server-only") return {};
        if (name === "@/components/notifications/gui-notifications")
          return {
            GuiNotifications: () =>
              createElement(
                "button",
                { "aria-label": "Notifications" },
                "Notifications",
              ),
          };
        if (name === "./cli-content-review")
          return { CliContentReview: () => null };
        if (name === "./cli-admin-users") return { CliAdminUsers: () => null };
        if (name === "./cli-admin-dashboard")
          return { CliAdminDashboard: () => null };
        if (name === "./cli-profile") return { CliProfile: () => null };
        if (name === "./cli-content") return { CliContent: () => null };
        if (name === "./cli-edit-article")
          return { CliEditArticle: () => null };
        if (name === "./cli-own-articles")
          return { CliOwnArticles: () => null };
        if (name === "./cli-roadmap-editor")
          return { CliRoadmapEditor: () => null };
        if (name === "./cli-new-lesson") return { CliNewLesson: () => null };
        if (name === "./cli-provider-keys")
          return { CliProviderKeys: () => null };
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
            default: ({ children, ...props }) => {
              delete props.prefetch;
              return createElement("a", props, children);
            },
          };
        if (name === "next/navigation")
          return {
            notFound() {
              throw new Error("NEXT_NOT_FOUND");
            },
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
            setUser: (user) => calls.push(["set-user", user]),
            getUser: () => authUser,
            getToken: () =>
              typeof authToken === "function" ? authToken() : authToken,
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

// Provider-key samples never contact a provider or use a real credential.
function keySetup(options = {}) {
  const h = roadmapHarness(options),
    data = h.load(
      new URL("../provider-keys/provider-keys-data.ts", import.meta.url),
    ),
    client = h.load(
      new URL("../provider-keys/provider-keys-client.ts", import.meta.url),
    );
  return {
    h,
    data,
    client,
    workspace: data.parseKeyWorkspace(
      contentUser,
      [generationKey],
      generationProviders,
    ),
  };
}
function keyApi(options = {}) {
  let keys = structuredClone(options.keys ?? [generationKey]);
  const calls = [];
  const api = {
    async get(path, config) {
      calls.push(["GET", path, config]);
      if (path === "/users/me") return { data: options.user ?? contentUser };
      if (path === "/ai-keys")
        return {
          data: options.readKeys
            ? options.readKeys(keys, calls)
            : structuredClone(keys),
        };
      if (path === "/ai-providers") return { data: generationProviders };
      if (path === "/ai-generate/quota") {
        if (options.quotaError) throw options.quotaError;
        return { data: generationQuota };
      }
      if (path.includes("/models?"))
        return {
          data: {
            models: ["sample-model", "sample-other"],
            live: options.live ?? true,
            defaultModel: "sample-model",
          },
        };
      throw Error(`Unexpected GET ${path}`);
    },
    async post(path, body) {
      calls.push(["POST", path, body]);
      if (options.postError) throw options.postError;
      if (path.endsWith("/lookup"))
        return {
          data: {
            models: ["sample-other"],
            live: options.live ?? true,
            defaultModel: "sample-model",
          },
        };
      const created = {
        ...generationKey,
        id: generationGuid(201),
        provider: body.provider,
        keyHint: body.apiKey.slice(-4),
        label: body.label ?? null,
        defaultModel: body.defaultModel ?? null,
        isDefault: keys.length === 0,
      };
      keys.push(created);
      return {
        data: options.ack ? options.ack(created) : structuredClone(created),
      };
    },
    async patch(path, body) {
      calls.push(["PATCH", path, body]);
      if (options.patchError) throw options.patchError;
      const target = keys.find((k) => path.endsWith(k.id));
      if (body.isDefault === true)
        keys.forEach((k) => {
          k.isDefault = false;
        });
      Object.assign(target, body);
      return {
        data: options.ack ? options.ack(target) : structuredClone(target),
      };
    },
    async delete(path) {
      calls.push(["DELETE", path]);
      if (options.deleteError) throw options.deleteError;
      keys = keys.filter((k) => !path.endsWith(k.id));
      return { data: { success: true } };
    },
  };
  return { api, calls };
}
test("provider keys reuse strict metadata projection without retaining secret fields", () => {
  const { data } = keySetup();
  const parsed = data.parseKeyWorkspace(
    contentUser,
    [
      {
        ...generationKey,
        apiKey: "sample-secret",
        keyCiphertext: "sample-cipher",
      },
    ],
    generationProviders,
  );
  assert.equal(parsed.keys[0].apiKey, undefined);
  assert.equal(parsed.keys[0].keyCiphertext, undefined);
  for (const patch of [
    { dailyLimit: 0 },
    { dailyLimit: 51 },
    { keyHint: "too-long-hint" },
    { isDefault: "yes" },
    { updatedAt: "bad" },
  ])
    assert.throws(() =>
      data.parseKeyWorkspace(
        contentUser,
        [{ ...generationKey, ...patch }],
        generationProviders,
      ),
    );
  assert.throws(() =>
    data.parseKeyWorkspace(
      contentUser,
      [generationKey, generationKey],
      generationProviders,
    ),
  );
  assert.throws(() =>
    data.parseKeyWorkspace(
      contentUser,
      [generationKey],
      [generationProviders[1]],
    ),
  );
});
test("provider key action validation covers caps, labels, capacity and current model bindings", () => {
  const { data, workspace } = keySetup();
  for (const n of [0, 51, 1.5, NaN])
    assert.throws(() =>
      data.keyActionBody(workspace, {
        kind: "cap",
        id: generationKey.id,
        value: n,
      }),
    );
  assert.equal(
    data.keyActionBody(workspace, {
      kind: "cap",
      id: generationKey.id,
      value: 1,
    }).dailyLimit,
    1,
  );
  assert.equal(
    data.keyActionBody(workspace, {
      kind: "label",
      id: generationKey.id,
      value: "  ",
    }).label,
    null,
  );
  assert.throws(() =>
    data.keyActionBody(workspace, {
      kind: "label",
      id: generationKey.id,
      value: "a".repeat(121),
    }),
  );
  assert.throws(() =>
    data.keyActionBody(workspace, {
      kind: "model",
      id: generationKey.id,
      value: "unlisted",
    }),
  );
  assert.equal(
    data.keyActionBody(workspace, {
      kind: "model",
      id: generationKey.id,
      value: "",
    }).defaultModel,
    null,
  );
  const catalog = data.parseKeyCatalog(
    { models: [" sample-other "], live: true, defaultModel: "sample-model" },
    data.keyCatalogBinding(workspace, generationKey.id),
  );
  assert.equal(
    data.keyActionBody(workspace, {
      kind: "model",
      id: generationKey.id,
      value: "sample-other",
      catalog,
    }).defaultModel,
    "sample-other",
  );
  assert.throws(() =>
    data.keyActionBody(
      {
        ...workspace,
        keys: workspace.keys.map((k) => ({ ...k, dailyLimit: 21 })),
      },
      { kind: "model", id: generationKey.id, value: "sample-other", catalog },
    ),
  );
  assert.throws(() =>
    data.parseKeyCatalog(
      { models: ["one", "one"], live: true, defaultModel: "one" },
      "binding",
    ),
  );
});
test("provider key entry makes timed abortable metadata reads only and quota failure is independent", async () => {
  const f = keyApi({
      quotaError: {
        response: { status: 503, data: { message: "sample-secret" } },
      },
    }),
    { client } = keySetup({ api: f.api }),
    signal = {};
  const workspace = await client.loadKeyWorkspace(contentUser, signal);
  assert.equal(workspace.keys.length, 1);
  assert.deepEqual(
    f.calls.map((c) => c[1]),
    ["/users/me", "/ai-keys", "/ai-providers"],
  );
  for (const call of f.calls) {
    assert.equal(call[2].signal, signal);
    assert.equal(call[2].timeout, 20000);
  }
  await assert.rejects(
    client.loadKeyQuota(workspace),
    (e) => !e.message.includes("sample-secret") && !e.unavailable,
  );
  assert.equal(f.calls.filter((c) => c[0] !== "GET").length, 0);
});
test("provider key reads hide private metadata for malformed records or changed identity", async () => {
  for (const options of [
    { user: { ...contentUser, id: "changed" } },
    { user: { ...contentUser, role: "admin" } },
    { readKeys: () => [{ ...generationKey, dailyLimit: 90 }] },
  ]) {
    const f = keyApi(options),
      { client } = keySetup({ api: f.api });
    await assert.rejects(
      client.loadKeyWorkspace(contentUser),
      (e) => e.unavailable === true,
    );
    assert.equal(
      f.calls.some((c) => c[0] !== "GET"),
      false,
    );
  }
});
test("provider lookup is explicit, key-bound, metadata-only and never stores a key", async () => {
  const f = keyApi(),
    { client, workspace, data } = keySetup({ api: f.api });
  const result = await client.lookupNewKey(
    workspace,
    "gemini",
    " sample-key-5678 ",
  );
  assert.equal(result.live, true);
  assert.equal(result.binding, data.keyCatalogBinding(workspace, "new:gemini"));
  assert.equal(JSON.stringify(result).includes("sample-key-5678"), false);
  const posts = f.calls.filter((c) => c[0] === "POST");
  assert.equal(posts.length, 1);
  assert.equal(posts[0][1], "/ai-providers/gemini/models/lookup");
  assert.deepEqual(JSON.parse(JSON.stringify(posts[0][2])), {
    apiKey: "sample-key-5678",
  });
});
test("provider lookup rejects fallback as a verification and sanitizes Axios request secrets", async () => {
  for (const options of [
    { live: false },
    {
      postError: {
        message: "sample-secret",
        config: { data: "sample-secret" },
        response: { status: 400, data: { message: "sample-secret" } },
      },
    },
  ]) {
    const f = keyApi(options),
      { client, workspace } = keySetup({ api: f.api });
    await assert.rejects(
      client.lookupNewKey(workspace, "nvidia", "sample-secret"),
      (e) =>
        !JSON.stringify(e).includes("sample-secret") &&
        !e.message.includes("sample-secret") &&
        !e.config &&
        !e.response,
    );
  }
});
test("stored model catalog uses the selected own key and discloses fallback", async () => {
  const f = keyApi({ live: false }),
    { client, workspace, data } = keySetup({ api: f.api });
  const result = await client.loadStoredKeyModels(workspace, generationKey.id);
  assert.equal(result.live, false);
  assert.equal(
    result.binding,
    data.keyCatalogBinding(workspace, generationKey.id),
  );
  assert.ok(f.calls.some((c) => c[1].endsWith(`?keyId=${generationKey.id}`)));
  assert.equal(f.calls.filter((c) => c[0] !== "GET").length, 0);
});
test("creating first and second keys uses one POST and requires exact saved metadata", async () => {
  for (const initial of [[], [generationKey]]) {
    const f = keyApi({ keys: initial }),
      { client, data } = keySetup({ api: f.api }),
      before = data.parseKeyWorkspace(
        contentUser,
        initial,
        generationProviders,
      );
    const saved = await client.changeProviderKey(before, {
      kind: "create",
      provider: "gemini",
      apiKey: " sample-key-5678 ",
      label: " Teaching ",
      defaultModel: "",
    });
    assert.equal(saved.keys.length, initial.length + 1);
    const added = saved.keys.find((k) => k.id === generationGuid(201));
    assert.equal(added.isDefault, !initial.length);
    assert.equal(added.label, "Teaching");
    assert.equal(added.keyHint, "5678");
    assert.equal(added.apiKey, undefined);
    assert.equal(f.calls.filter((c) => c[0] === "POST").length, 1);
  }
});
test("creating a key with an explicit model requires this key's live lookup result", async () => {
  const f = keyApi(),
    { client, data, workspace } = keySetup({ api: f.api });
  const catalog = data.parseKeyCatalog(
    { models: ["sample-other"], live: true, defaultModel: "sample-model" },
    data.keyCatalogBinding(workspace, "new:gemini"),
  );
  await client.changeProviderKey(workspace, {
    kind: "create",
    provider: "gemini",
    apiKey: "sample-5678",
    label: "",
    defaultModel: "sample-other",
    catalog,
  });
  assert.equal(
    f.calls.find((c) => c[1] === "/ai-keys" && c[0] === "POST")[2].defaultModel,
    "sample-other",
  );
});
test("metadata edits, default clearing and switching confirm one PATCH and fresh saved state", async () => {
  const second = {
    ...generationKey,
    id: generationGuid(202),
    provider: "gemini",
    isDefault: false,
  };
  for (const action of [
    { kind: "cap", id: generationKey.id, value: 32 },
    { kind: "label", id: generationKey.id, value: " New name " },
    { kind: "model", id: generationKey.id, value: "" },
    { kind: "clear-default", id: generationKey.id },
    { kind: "default", id: second.id },
  ]) {
    const f = keyApi({ keys: [generationKey, second] }),
      { client, data } = keySetup({ api: f.api });
    const before = data.parseKeyWorkspace(
        contentUser,
        [generationKey, second],
        generationProviders,
      ),
      saved = await client.changeProviderKey(before, action);
    assert.equal(f.calls.filter((c) => c[0] === "PATCH").length, 1);
    assert.equal(
      f.calls.filter((c) => c[0] === "POST" || c[0] === "DELETE").length,
      0,
    );
    if (action.kind === "default") {
      assert.equal(saved.keys.find((k) => k.id === second.id).isDefault, true);
      assert.equal(
        saved.keys.find((k) => k.id === generationKey.id).isDefault,
        false,
      );
    }
    if (action.kind === "clear-default")
      assert.equal(
        saved.keys.some((k) => k.isDefault),
        false,
      );
  }
});
test("key changes stop before writing when account or saved defaults drift", async () => {
  for (const options of [
    { user: { ...contentUser, id: "other" } },
    { readKeys: (keys) => keys.map((k) => ({ ...k, dailyLimit: 21 })) },
  ]) {
    const f = keyApi(options),
      { client, workspace } = keySetup({ api: f.api });
    await assert.rejects(
      client.changeProviderKey(workspace, {
        kind: "cap",
        id: generationKey.id,
        value: 30,
      }),
    );
    assert.equal(f.calls.filter((c) => c[0] !== "GET").length, 0);
  }
});
test("unknown key writes and malformed acknowledgements stay uncertain without secret-bearing errors", async () => {
  for (const options of [
    { postError: { config: { data: "sample-secret" } } },
    {
      postError: {
        response: { status: 408, data: { message: "sample-secret" } },
      },
    },
    {
      postError: {
        response: { status: 500, data: { message: "sample-secret" } },
      },
    },
    { ack: (row) => ({ ...row, keyHint: "wrong" }) },
  ]) {
    const f = keyApi(options),
      { client, workspace } = keySetup({ api: f.api });
    await assert.rejects(
      client.changeProviderKey(workspace, {
        kind: "create",
        provider: "gemini",
        apiKey: "sample-secret",
        label: "",
        defaultModel: "",
      }),
      (e) =>
        e.uncertain &&
        !e.message.includes("sample-secret") &&
        !e.response &&
        !e.config,
    );
    assert.equal(f.calls.filter((c) => c[0] === "POST").length, 1);
  }
});
test("definite provider refusals are not reported as saved and never echo raw errors", async () => {
  const f = keyApi({
      patchError: {
        response: { status: 400, data: { message: "sample-secret" } },
      },
    }),
    { client, workspace } = keySetup({ api: f.api });
  await assert.rejects(
    client.changeProviderKey(workspace, {
      kind: "cap",
      id: generationKey.id,
      value: 30,
    }),
    (e) => !e.uncertain && !e.message.includes("sample-secret"),
  );
});
test("a changed saved-state readback cannot claim a key edit succeeded", async () => {
  let read = 0;
  const f = keyApi({
      readKeys: (keys) =>
        ++read > 1 ? keys.map((k) => ({ ...k, label: "different" })) : keys,
    }),
    { client, workspace } = keySetup({ api: f.api });
  await assert.rejects(
    client.changeProviderKey(workspace, {
      kind: "cap",
      id: generationKey.id,
      value: 30,
    }),
    (e) => e.uncertain === true,
  );
  assert.equal(f.calls.filter((c) => c[0] === "PATCH").length, 1);
});
test("deletion confirms only the selected key and never auto-promotes another stored key", async () => {
  const second = {
      ...generationKey,
      id: generationGuid(202),
      provider: "gemini",
      isDefault: false,
    },
    f = keyApi({ keys: [generationKey, second] }),
    { client, data } = keySetup({ api: f.api }),
    before = data.parseKeyWorkspace(
      contentUser,
      [generationKey, second],
      generationProviders,
    );
  const saved = await client.changeProviderKey(before, {
    kind: "delete",
    id: generationKey.id,
  });
  assert.equal(saved.keys.length, 1);
  assert.equal(saved.keys[0].isDefault, false);
  assert.deepEqual(
    f.calls.filter((c) => c[0] === "DELETE").map((c) => c[1]),
    [`/ai-keys/${generationKey.id}`],
  );
});
test("an in-use key removal refusal retains the stored key and is never retried", async () => {
  const f = keyApi({
      deleteError: {
        response: { status: 400, data: { message: "running job" } },
      },
    }),
    { client, workspace } = keySetup({ api: f.api });
  await assert.rejects(
    client.changeProviderKey(workspace, {
      kind: "delete",
      id: generationKey.id,
    }),
    (e) => !e.uncertain,
  );
  assert.equal(f.calls.filter((c) => c[0] === "DELETE").length, 1);
  const saved = await client.loadKeyWorkspace(contentUser);
  assert.equal(saved.keys.length, 1);
});
test("key form renders masked input, native consent, true allowance and per-key controls", () => {
  const { h, workspace } = keySetup(),
    { ProviderKeysView } = h.load(
      new URL("../provider-keys/provider-keys-view.tsx", import.meta.url),
    );
  const html = h.render(
    createElement(ProviderKeysView, {
      data: workspace,
      quota: generationQuota,
      onAction: async () => true,
      onCheck() {},
      onLookup: async () => undefined,
      onModels: async () => undefined,
      onClassic() {},
    }),
  );
  assert.match(html, /type="password"/);
  assert.match(html, /autocomplete="off"/i);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /20 \/ 20/);
  assert.match(html, /does not reset/);
  assert.match(html, /Edit label, cap &amp; model/);
  assert.match(html, /Use shared service instead/);
  assert.doesNotMatch(html, /value="sample-secret"/);
});
test("key controller isolates quota failure, uses no mutation cache and blocks same-tick writes", async () => {
  const f = keyApi(),
    fixture = keySetup(),
    { workspace } = fixture,
    state = [],
    refs = [];
  let index = 0,
    refIndex = 0;
  const h = roadmapHarness({
    api: f.api,
    queries: {
      "provider-keys/workspace": {
        data: workspace,
        isFetching: false,
        isError: false,
      },
      [`provider-keys/quota/${workspace.user.id}/${workspace.user.role}/${fixture.data.keyFingerprint(workspace)}`]:
        { isError: true, error: new Error("missing configuration") },
    },
    hooks: {
      useState: (v) => {
        const i = index++;
        state[i] ??= v;
        return [
          state[i],
          (v) => {
            state[i] = typeof v === "function" ? v(state[i]) : v;
          },
        ];
      },
      useRef: (v) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: v }),
      useEffect() {},
    },
  });
  const { GuiProviderKeys } = h.load(
      new URL("../provider-keys/gui-provider-keys.tsx", import.meta.url),
    ),
    view = GuiProviderKeys().props.children;
  assert.equal(view.props.blocked, false);
  assert.ok(view.props.quotaError);
  assert.equal(h.queryCalls.length, 2);
  assert.equal(h.queryCalls[0].retry, false);
  const first = view.props.onAction({
    kind: "cap",
    id: generationKey.id,
    value: 30,
  });
  const duplicate = view.props.onAction({
    kind: "cap",
    id: generationKey.id,
    value: 30,
  });
  assert.equal(await duplicate, false);
  await first;
  assert.equal(f.calls.filter((c) => c[0] === "PATCH").length, 1);
  const source = readFileSync(
    new URL("../provider-keys/gui-provider-keys.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /useMutation|localStorage|sessionStorage/);
});

test("provider key consent and removal freeze saved settings synchronously before effects", async () => {
  const f = keySetup(),
    state = [
      "nvidia",
      "sample-5678",
      "",
      "",
      true,
      f.data.keyFingerprint(f.workspace),
      undefined,
      {},
      {
        key: f.workspace.keys[0],
        snapshot: f.data.keyFingerprint(f.workspace),
      },
    ];
  let index = 0,
    called = 0;
  const h = roadmapHarness({
    hooks: {
      useState: (v) => {
        const i = index++;
        return [
          state[i] ?? v,
          (n) => {
            state[i] = n;
          },
        ];
      },
      useRef: (v) => ({ current: v }),
      useEffect() {},
    },
  });
  const { ProviderKeysView } = h.load(
    new URL("../provider-keys/provider-keys-view.tsx", import.meta.url),
  );
  const changed = {
    ...f.workspace,
    keys: f.workspace.keys.map((k) => ({ ...k, dailyLimit: 21 })),
  };
  const tree = ProviderKeysView({
    data: changed,
    onAction: async () => {
      called++;
      return true;
    },
    onCheck() {},
    onLookup: async () => {
      called++;
    },
    onModels: async () => undefined,
    onClassic() {},
  });
  const checkbox = walk(tree, (n) => n.props.id === "provider-consent")[0];
  assert.equal(checkbox.props.checked, false);
  const remove = walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Remove stored key",
  )[0];
  assert.equal(remove.props.disabled, true);
  walk(tree, (n) => n.type === "form")[0].props.onSubmit({
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(called, 0);
  assert.ok(state[7].consent);
});
test("provider key recovery clears locks only after a successful read and never repeats a write", async () => {
  for (const failed of [false, true]) {
    const f = keyApi(),
      fixture = keySetup(),
      state = [],
      refs = [];
    let index = 0,
      refIndex = 0;
    const h = roadmapHarness({
      api: {
        ...f.api,
        get: async (...args) => {
          if (failed) throw new Error("offline");
          return f.api.get(...args);
        },
      },
      queries: {
        "provider-keys/workspace": {
          data: fixture.workspace,
          isFetching: false,
          isError: false,
        },
      },
      hooks: {
        useState: (v) => {
          const i = index++;
          if (!(i in state)) state[i] = v;
          return [
            state[i],
            (n) => {
              state[i] = typeof n === "function" ? n(state[i]) : n;
            },
          ];
        },
        useRef: (v) =>
          refs[refIndex++] ?? (refs[refIndex - 1] = { current: v }),
        useEffect() {},
      },
    });
    const { ProviderKeyFailure } = h.load(
      new URL("../provider-keys/provider-keys-client.ts", import.meta.url),
    );
    state[1] = new ProviderKeyFailure("unknown", true);
    const { GuiProviderKeys } = h.load(
        new URL("../provider-keys/gui-provider-keys.tsx", import.meta.url),
      ),
      view = GuiProviderKeys().props.children;
    assert.equal(view.props.blocked, true);
    view.props.onCheck();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(!!state[1], failed);
    assert.equal(f.calls.filter((c) => c[0] !== "GET").length, 0);
  }
});
test("provider key appearance preserves classic rendering without writing learner location", () => {
  for (const isCli of [true, false]) {
    const h = roadmapHarness({
        mode: { ready: true, isCli, location: { kind: "root" } },
        hooks: { useEffect() {} },
      }),
      { ProviderKeysPage } = h.load(
        new URL("../provider-keys/gui-provider-keys.tsx", import.meta.url),
      ),
      tree = ProviderKeysPage();
    if (isCli) {
      assert.equal(
        walk(tree, (n) => n.type?.name === "CliProviderKeys").length,
        1,
      );
      walk(
        tree,
        (n) => n.props.children === "Open GUI provider keys",
      )[0].props.onClick();
      assert.deepEqual(JSON.parse(JSON.stringify(h.calls.at(-1))), [
        "mode",
        "gui",
        { navigate: false },
      ]);
    } else assert.equal(tree.type.name, "GuiProviderKeys");
    assert.equal(
      h.calls.some((c) => c[0] === "location"),
      false,
    );
  }
});

function publicArticleRaw(index = 1, patch = {}) {
  return {
    id: `public-${index}`,
    title: `Developer note ${index}`,
    slug: `note-${index}`,
    createdAt: "2026-10-20T09:00:00.000Z",
    content: "An explanation of commits and the connections between them.",
    author: {
      id: "sample-author",
      name: "Alex Morgan",
      email: "not-for-the-list@example.invalid",
      passwordHash: "not-for-the-list",
    },
    roadmapId: "not-for-the-list",
    ...patch,
  };
}
function articleSetup(options = {}) {
  const h = roadmapHarness({
    ...options,
    globals: {
      AbortSignal: { timeout: (ms) => ({ timeoutMs: ms }) },
      ...options.globals,
    },
    hooks: { useEffect() {}, ...options.hooks },
  });
  return {
    h,
    data: h.load(new URL("../articles/articles-data.ts", import.meta.url)),
    server: h.load(new URL("../articles/articles-server.ts", import.meta.url)),
  };
}
test("public article query validation rejects ambiguous search/pages and keeps one trimmed title query", () => {
  const { data } = articleSetup();
  assert.equal(
    JSON.stringify(data.articlesRequest({ search: "  closures  ", page: "2" })),
    JSON.stringify({ search: "closures", page: 2 }),
  );
  for (const query of [
    { search: ["one", "two"] },
    { search: "a".repeat(201) },
    { search: "one\u0000two" },
    { search: "one\ntwo" },
    { page: ["1", "2"] },
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "" },
    { page: "9007199254740992" },
  ])
    assert.ok(data.articlesRequest(query).issue);
  assert.equal(data.articlesRequest({ search: "" }).issue, undefined);
});
test("article navigation encodes searches, keeps pages and never allows an external base path", () => {
  const { data } = articleSetup(),
    query = "C++ & hooks? #100%_";
  const url = new URL(data.articlesHref(query, 3), "https://example.invalid");
  assert.equal(url.pathname, "/articles");
  assert.equal(url.searchParams.get("search"), query);
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(data.articlesHref("", 1), "/articles");
  assert.equal(data.articlesHref("Git", 1).includes("page="), false);
  for (const bad of [
    "https://example.invalid",
    "//example.invalid",
    "/../articles",
    "/articles?key=value",
  ])
    assert.throws(() => data.articlesHref("", 1, bad));
});
test("public article summaries project author names and short text without shipping raw account/body metadata", () => {
  const { data } = articleSetup(),
    raw = publicArticleRaw(1, {
      content: "A useful explanation. ".repeat(100) + "RAW_BODY_TAIL",
    }),
    result = data.parsePublicArticles([raw])[0];
  assert.deepEqual(Object.keys(result), [
    "id",
    "title",
    "authorName",
    "createdAt",
    "excerpt",
  ]);
  assert.equal(result.authorName, "Alex Morgan");
  assert.ok(Array.from(result.excerpt).length <= 221);
  assert.equal(JSON.stringify(result).includes("not-for-the-list"), false);
  assert.equal(JSON.stringify(result).includes("RAW_BODY_TAIL"), false);
  assert.equal(
    data.parsePublicArticles([publicArticleRaw(2, { author: null })])[0]
      .authorName,
    null,
  );
  assert.equal(
    data.parsePublicArticles([
      publicArticleRaw(3, { author: { name: "  " }, content: undefined }),
    ])[0].excerpt,
    null,
  );
});
test("public article lists reject malformed IDs, duplicate rows, titles, dates and author contracts", () => {
  const { data } = articleSetup();
  for (const patch of [
    { id: "../secret" },
    { id: "https://invalid" },
    { title: " " },
    { title: "x".repeat(201) },
    { createdAt: "2026-02-30T12:00:00Z" },
    { createdAt: "yesterday" },
    { author: { name: 5 } },
    { author: [] },
    { content: { html: "not text" } },
  ])
    assert.throws(() => data.parsePublicArticles([publicArticleRaw(1, patch)]));
  assert.throws(() => data.parsePublicArticles({ items: [] }));
  assert.throws(() =>
    data.parsePublicArticles([publicArticleRaw(), publicArticleRaw()]),
  );
});
test("article previews remain plain text and drop remote media destinations, HTML and code blocks", () => {
  const { data } = articleSetup(),
    text = data.articleExcerpt(
      "# A title\n\n**Useful** [context](https://example.invalid/path). ![remote](https://example.invalid/image.png)\n```js\nDO_NOT_PREVIEW_CODE\n```\n<script>DO_NOT_PREVIEW_SCRIPT</script><strong>More context</strong>",
    );
  assert.match(text, /A title Useful context/);
  assert.match(text, /More context/);
  assert.doesNotMatch(text, /example.invalid|DO_NOT_PREVIEW|<|\*\*/);
  assert.equal(data.articleExcerpt("```js\nonlyCode()\n```"), null);
  const unicode = data.articleExcerpt("🧠".repeat(240));
  assert.equal(Array.from(unicode).length, 221);
  assert.equal(unicode.includes("�"), false);
});
test("article pages preserve endpoint order, report actual totals and clamp beyond the last page", () => {
  const { data } = articleSetup(),
    items = data.parsePublicArticles(
      Array.from({ length: 27 }, (_, i) => publicArticleRaw(27 - i)),
    );
  const page = data.articlePage(items, { search: "note", page: 2 });
  assert.equal(page.total, 27);
  assert.equal(page.pages, 3);
  assert.equal(page.items.length, 12);
  assert.equal(page.items[0].id, "public-15");
  const last = data.articlePage(items, { search: "", page: 999 });
  assert.equal(last.page, 3);
  assert.equal(last.items.length, 3);
  const empty = data.articlePage([], { search: "", page: 8 });
  assert.equal(empty.page, 1);
  assert.equal(empty.pages, 1);
  assert.equal(empty.total, 0);
  assert.equal(data.articleDate("2026-10-20T00:30:00+05:30"), "Oct 19, 2026");
});
test("public article loader performs one anonymous fresh timed GET and no account or provider lookup", async () => {
  const { server } = articleSetup(),
    calls = [];
  const result = await server.loadPublicArticles(
    { search: "% Git & hooks_", page: 2 },
    async (...args) => {
      calls.push(args);
      return {
        ok: true,
        json: async () =>
          Array.from({ length: 15 }, (_, i) => publicArticleRaw(i + 1)),
      };
    },
    "https://api.example.invalid/",
  );
  assert.equal(result.kind, "ready");
  assert.equal(result.items.length, 3);
  assert.equal(calls.length, 1);
  const [path, options] = calls[0];
  assert.equal(
    path,
    "https://api.example.invalid/articles?search=%25%20Git%20%26%20hooks_",
  );
  assert.equal(options.method, "GET");
  assert.equal(options.cache, "no-store");
  assert.equal(options.credentials, "omit");
  assert.equal(options.signal.timeoutMs, 12000);
  assert.deepEqual(Object.keys(options.headers), ["Accept"]);
});
test("article load failures, invalid JSON and malformed contracts never masquerade as an empty notebook", async () => {
  const { server } = articleSetup(),
    request = { search: "closures", page: 2 };
  for (const fetcher of [
    async () => {
      throw Error("offline");
    },
    async () => ({ ok: false, status: 503 }),
    async () => ({
      ok: true,
      json: async () => {
        throw Error("bad JSON");
      },
    }),
    async () => ({
      ok: true,
      json: async () => [publicArticleRaw(1, { id: "bad/path" })],
    }),
  ]) {
    const result = await server.loadPublicArticles(
      request,
      fetcher,
      "https://api.example.invalid",
    );
    assert.equal(result.kind, "error");
    assert.equal(result.request.search, "closures");
    assert.equal(result.total, undefined);
  }
  const empty = await server.loadPublicArticles(
    request,
    async () => ({ ok: true, json: async () => [] }),
    "https://api.example.invalid",
  );
  assert.equal(empty.kind, "ready");
  assert.equal(empty.total, 0);
});
test("invalid public article parameters never reach the service", async () => {
  const { server, data } = articleSetup();
  const result = await server.loadPublicArticles(
    data.articlesRequest({ search: ["one", "two"] }),
    async () => assert.fail("invalid request must not fetch"),
    "https://api.example.invalid",
  );
  assert.equal(result.kind, "invalid");
});
test("public article server route awaits query parameters and crosses the client boundary with plain projected data", async () => {
  const calls = [],
    { h } = articleSetup({
      globals: {
        AbortSignal: { timeout: (ms) => ({ timeoutMs: ms }) },
        process: {
          env: { NEXT_PUBLIC_API_URL: "https://api.example.invalid" },
        },
        fetch: async (...args) => {
          calls.push(args);
          return { ok: true, json: async () => [publicArticleRaw()] };
        },
      },
    });
  const page = h.load(
    new URL("../../app/articles/page.tsx", import.meta.url),
  ).default;
  const tree = await page({
    searchParams: Promise.resolve({ search: "note", page: "1" }),
  });
  assert.equal(tree.type.name, "ArticlesPage");
  assert.equal(tree.props.result.kind, "ready");
  assert.equal(tree.props.result.items[0].id, "public-1");
  assert.equal(JSON.stringify(tree.props).includes("passwordHash"), false);
  assert.equal(calls.length, 1);
});
test("article view renders real cards, public links, native page-resetting title search and accessible result context", () => {
  const { h, data } = articleSetup(),
    result = data.articlePage(
      data.parsePublicArticles(
        Array.from({ length: 15 }, (_, i) => publicArticleRaw(i + 1)),
      ),
      { search: "note", page: 1 },
    );
  const { ArticlesView } = h.load(
      new URL("../articles/articles-view.tsx", import.meta.url),
    ),
    html = h.render(createElement(ArticlesView, { result, onClassic() {} }));
  assert.match(html, /Showing 1–12 of 15 articles/);
  assert.match(html, /action="\/articles#public-article-results" method="GET"/);
  assert.match(html, /type="search"/);
  assert.doesNotMatch(html, /name="page"/);
  assert.match(html, /href="\/articles\/public-1"/);
  assert.match(html, /id="public-article-public-1"/);
  assert.match(html, /search=note&amp;page=2#public-article-results/);
  assert.match(html, /Write an article/);
  assert.match(html, /href="\/developer\/articles"/);
  assert.doesNotMatch(
    html,
    /\/developer\/articles\/new|Trending|Featured|min read/,
  );
});
test("article empty, no-match, unavailable, invalid and loading states give distinct next steps", () => {
  const { h, data } = articleSetup(),
    { ArticlesView } = h.load(
      new URL("../articles/articles-view.tsx", import.meta.url),
    );
  const render = (result) =>
    h.render(createElement(ArticlesView, { result, onClassic() {} }));
  const empty = render(data.articlePage([], { search: "", page: 1 }));
  assert.match(empty, /Every notebook starts/);
  assert.match(empty, /Open article workspace/);
  const noMatch = render(data.articlePage([], { search: "nomatch", page: 1 }));
  assert.match(noMatch, /No article titles matched/);
  assert.match(noMatch, /Browse all articles/);
  const error = render({
    kind: "error",
    request: { search: "kept", page: 2 },
    message: "Unavailable",
  });
  assert.match(error, /notebook couldn’t load/);
  assert.match(error, /search=kept&amp;page=2/);
  assert.doesNotMatch(error, /No articles have been shared/);
  const invalid = render({
    kind: "invalid",
    request: { search: "", page: 1 },
    message: "Use one search",
  });
  assert.match(invalid, /aria-invalid="true"/);
  assert.match(invalid, /Edit the title search/);
  const loading = render({ kind: "loading", request: { search: "", page: 1 } });
  assert.match(loading, /Loading public articles/);
  assert.doesNotMatch(loading, /Showing|No articles have been shared/);
});
test("public article titles and excerpts are escaped text and list links stay internal", () => {
  const { h, data } = articleSetup(),
    result = data.articlePage(
      data.parsePublicArticles([
        publicArticleRaw(1, {
          title: '<img src=x onerror="bad()">',
          content: "<script>bad()</script>Plain <b>context</b>",
        }),
      ]),
      { search: "", page: 1 },
    ),
    { ArticlesView } = h.load(
      new URL("../articles/articles-view.tsx", import.meta.url),
    );
  const html = h.render(
    createElement(ArticlesView, { result, onClassic() {} }),
  );
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|<script|href="javascript:/);
  assert.match(html, /Plain context/);
});
test("article appearance uses before-paint scoped CSS, retains public HTML and never changes learner location", () => {
  const { h, data } = articleSetup(),
    { ArticlesPage } = h.load(
      new URL("../articles/articles-page.tsx", import.meta.url),
    ),
    tree = ArticlesPage({
      result: data.articlePage([], { search: "", page: 1 }),
    });
  const gui = walk(tree, (n) => n.type?.name === "ArticlesView")[0];
  gui.props.onClassic();
  walk(
    tree,
    (n) => n.props.children === "Open GUI articles",
  )[0].props.onClick();
  assert.deepEqual(
    JSON.parse(JSON.stringify(h.calls.filter((c) => c[0] === "mode"))),
    [
      ["mode", "cli", { navigate: false }],
      ["mode", "gui", { navigate: false }],
    ],
  );
  assert.equal(
    h.calls.some((c) => c[0] === "location"),
    false,
  );
  const css = readFileSync(
    new URL("../articles/articles.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /html\[data-ui-mode="cli"\]/);
  assert.match(css, /\.classicMode\s*\{\s*display: none/);
  const html = h.render(tree);
  assert.match(html, /Good ideas deserve/);
  assert.match(html, /Notes from developers/);
});
test("article pagination handles both appearances without dropping searches or offering missing pages", () => {
  const { h, data } = articleSetup(),
    { ArticlePagination } = h.load(
      new URL("../articles/article-pagination.tsx", import.meta.url),
    ),
    result = data.articlePage(
      data.parsePublicArticles(
        Array.from({ length: 25 }, (_, i) => publicArticleRaw(i + 1)),
      ),
      { search: "a & b", page: 3 },
    );
  for (const classic of [false, true]) {
    const html = h.render(
      createElement(ArticlePagination, { result, classic }),
    );
    assert.match(html, /Page 3 of 3/);
    assert.match(html, /search=a\+%26\+b&amp;page=2/);
    assert.match(html, /aria-disabled="true">Next articles/);
    assert.equal((html.match(/rel="next"/g) || []).length, 0);
  }
});
test("public reading navigation Escape closes its disclosure and returns focus", () => {
  let listener,
    closed = false,
    focused = 0;
  const effects = [];
  const h = roadmapHarness({
    globals: {
      window: {
        addEventListener: (_, fn) => {
          listener = fn;
        },
        removeEventListener() {},
      },
    },
    hooks: {
      useState: () => [
        true,
        (value) => {
          closed = value === false;
        },
      ],
      useRef: () => ({
        current: {
          focus() {
            focused++;
          },
        },
      }),
      useEffect: (fn) => effects.push(fn),
    },
  });
  const { PublicReadingShell } = h.load(
    new URL("../articles/public-reading-shell.tsx", import.meta.url),
  );
  PublicReadingShell({ children: null, onClassic() {} });
  effects.forEach((fn) => fn());
  listener({ key: "Escape" });
  assert.equal(closed, true);
  assert.equal(focused, 1);
});

test("article results focus waits for hydration and only follows an explicit results anchor", () => {
  for (const scenario of [
    { hash: "", ready: true, kind: "ready", expected: 0 },
    { hash: "#other", ready: true, kind: "ready", expected: 0 },
    {
      hash: "#public-article-results",
      ready: false,
      kind: "ready",
      expected: 0,
    },
    {
      hash: "#public-article-results",
      ready: true,
      kind: "loading",
      expected: 0,
    },
    {
      hash: "#public-article-results",
      ready: true,
      kind: "ready",
      expected: 1,
    },
    {
      hash: "#classic-article-results",
      ready: true,
      kind: "ready",
      classic: true,
      expected: 1,
    },
  ]) {
    const effects = [],
      events = [],
      target = {
        getClientRects: () => [{}],
        scrollIntoView: (options) => events.push(["scroll", options.behavior]),
        focus: () => events.push(["focus"]),
      };
    const h = roadmapHarness({
      mode: {
        ready: scenario.ready,
        isCli: !!scenario.classic,
        location: { kind: "root" },
      },
      hooks: { useEffect: (fn) => effects.push(fn) },
      globals: {
        window: {
          location: { hash: scenario.hash },
          requestAnimationFrame(fn) {
            fn();
            return 1;
          },
          cancelAnimationFrame() {},
        },
        document: {
          getElementById: (id) =>
            (
              scenario.classic
                ? id === "classic-article-results"
                : id === "public-article-results"
            )
              ? target
              : { getClientRects: () => [] },
        },
      },
    });
    const { ArticlesPage } = h.load(
      new URL("../articles/articles-page.tsx", import.meta.url),
    );
    ArticlesPage({
      result: { kind: scenario.kind, request: { search: "", page: 1 } },
    });
    effects.forEach((fn) => fn());
    assert.equal(
      events.filter((e) => e[0] === "focus").length,
      scenario.expected,
    );
    if (scenario.expected) assert.equal(events[0][1], "instant");
  }
});

function readerSetup(options = {}) {
  const { h } = articleSetup(options);
  return {
    h,
    data: h.load(
      new URL("../articles/article-reader-data.ts", import.meta.url),
    ),
    server: h.load(
      new URL("../articles/article-reader-server.ts", import.meta.url),
    ),
    view: h.load(
      new URL("../articles/article-reader-view.tsx", import.meta.url),
    ),
  };
}
function readerRaw(patch = {}) {
  return publicArticleRaw(1, { updatedAt: "2026-10-21T10:00:00Z", ...patch });
}
test("public reader projects only validated reading data, with honest missing-author and link presence", () => {
  const { data } = readerSetup();
  const article = data.parsePublicArticle(readerRaw(), "public-1");
  assert.deepEqual(
    Object.keys(article).sort(),
    [
      "id",
      "title",
      "authorName",
      "createdAt",
      "updatedAt",
      "content",
      "hasCurriculum",
    ].sort(),
  );
  assert.equal(article.content, readerRaw().content);
  assert.equal(article.hasCurriculum, true);
  assert.equal(JSON.stringify(article).includes("passwordHash"), false);
  assert.equal(JSON.stringify(article).includes("not-for-the-list"), false);
  const noAuthor = data.parsePublicArticle(
    readerRaw({ author: null, roadmapId: null, conceptId: null, content: "" }),
    "public-1",
  );
  assert.equal(noAuthor.authorName, null);
  assert.equal(noAuthor.hasCurriculum, false);
  assert.equal(noAuthor.content, "");
});
test("public reader rejects mismatched content, missing body, malformed timestamps and unsafe linked IDs", () => {
  const { data } = readerSetup();
  for (const patch of [
    { id: "other" },
    { content: undefined },
    { content: {} },
    { updatedAt: "2026-02-30T00:00:00Z" },
    { updatedAt: "invalid" },
    { conceptId: "../../private" },
    { author: { name: 42 } },
    { title: "" },
  ])
    assert.throws(() => data.parsePublicArticle(readerRaw(patch), "public-1"));
  assert.equal(data.articleReaderHref("public-1"), "/articles/public-1");
  assert.throws(() => data.articleReaderHref("//evil.test"));
});
test("reader makes one anonymous timed fresh GET, without curriculum, user or provider calls", async () => {
  const { server } = readerSetup(),
    calls = [];
  const result = await server.loadPublicArticle(
    "public-1",
    async (...args) => {
      calls.push(args);
      return { ok: true, status: 200, json: async () => readerRaw() };
    },
    "https://api.example.invalid/",
  );
  assert.equal(result.kind, "ready");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://api.example.invalid/articles/public-1");
  const options = calls[0][1];
  assert.equal(options.method, "GET");
  assert.equal(options.cache, "no-store");
  assert.equal(options.credentials, "omit");
  assert.equal(options.signal.timeoutMs, 12000);
  assert.deepEqual(Object.keys(options.headers), ["Accept"]);
});
test("only reader 404 or invalid IDs mean missing; forbidden, server, malformed and network responses remain unavailable", async () => {
  const { server } = readerSetup();
  assert.equal(
    (
      await server.loadPublicArticle(
        "bad/path",
        () => assert.fail("invalid ID must not fetch"),
        "https://api.invalid",
      )
    ).kind,
    "missing",
  );
  assert.equal(
    (
      await server.loadPublicArticle(
        "public-1",
        async () => ({
          status: 404,
          ok: false,
          json: () => assert.fail("404 must not parse"),
        }),
        "https://api.invalid",
      )
    ).kind,
    "missing",
  );
  for (const fetcher of [
    async () => ({ ok: false, status: 403 }),
    async () => ({ ok: false, status: 503 }),
    async () => {
      throw new Error("private token");
    },
    async () => ({
      ok: true,
      json: async () => {
        throw new Error("private body");
      },
    }),
    async () => ({
      ok: true,
      json: async () => readerRaw({ id: "different" }),
    }),
  ]) {
    const result = await server.loadPublicArticle(
      "public-1",
      fetcher,
      "https://api.invalid",
    );
    assert.deepEqual(JSON.parse(JSON.stringify(result)), { kind: "error" });
  }
});
test("reader server route awaits params, projects plain client props, and uses true not-found only for missing articles", async () => {
  for (const status of [200, 404, 503]) {
    const { h } = readerSetup({
      globals: {
        process: { env: { NEXT_PUBLIC_API_URL: "https://api.invalid" } },
        fetch: async () => ({
          status,
          ok: status === 200,
          json: async () => readerRaw(),
        }),
      },
    });
    const page = h.load(
      new URL("../../app/articles/[id]/page.tsx", import.meta.url),
    ).default;
    const pending = page({ params: Promise.resolve({ id: "public-1" }) });
    if (status === 404) {
      await assert.rejects(pending, /NEXT_NOT_FOUND/);
      continue;
    }
    const tree = await pending;
    assert.equal(tree.type.name, "ArticleReaderPage");
    assert.equal(tree.props.result.kind, status === 200 ? "ready" : "error");
    assert.equal(tree.props.retryHref, "/articles/public-1");
    assert.doesNotMatch(
      JSON.stringify(tree.props),
      /passwordHash|email|authorId|roadmapId/,
    );
  }
});
test("reader formats real Markdown with matching section links, safe external links, inert HTML and opt-in media", () => {
  const { h, data, view } = readerSetup();
  const result = {
    kind: "ready",
    article: data.parsePublicArticle(
      readerRaw({
        title: "Commits <script>unsafe</script>",
        content:
          "## A useful connection\n\nReal **article** text.\n\n## A useful connection\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert)\n\n[official](https://example.invalid/docs)\n\n![Diagram](https://example.invalid/image.png)\n\n```ts\nconst commit = true;\n```\n\n| A | B |\n| - | - |\n| one | two |",
      }),
      "public-1",
    ),
  };
  const html = h.render(
    createElement(view.ArticleReaderView, { result, onClassic() {} }),
  );
  assert.match(html, /<strong>article<\/strong>/);
  const links = [...html.matchAll(/href="#(article-section-\d+)"/g)].map(
    (m) => m[1],
  );
  assert.equal(links.length, 2);
  assert.equal(new Set(links).size, 2);
  for (const id of links) assert.ok(html.includes(`id="${id}"`));
  assert.match(html, /Scrollable article table/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /opens in a new tab/);
  assert.match(html, /Load image/);
  assert.match(html, /Loading connects to example.invalid/);
  assert.match(html, /Copy code/);
  assert.doesNotMatch(
    html,
    /<script|<img|href="javascript|passwordHash|approved|Mark complete/,
  );
});
test("reader publishes UTC dates and actual edits, gives deleted-author and blank-body states, and omits invented metadata", () => {
  const { h, data, view } = readerSetup();
  const render = (patch) =>
    h.render(
      createElement(view.ArticleReaderView, {
        result: {
          kind: "ready",
          article: data.parsePublicArticle(readerRaw(patch), "public-1"),
        },
        onClassic() {},
      }),
    );
  const html = render({ author: null, content: "", roadmapId: null });
  assert.match(html, /Author unavailable/);
  assert.match(html, /No article text/);
  assert.match(html, /Oct 20, 2026/);
  assert.match(html, /Updated/);
  assert.doesNotMatch(
    html,
    /Article sections|Explore the linked|Read time|views|likes/,
  );
  assert.doesNotMatch(render({ updatedAt: readerRaw().createdAt }), /Updated/);
});
test("reader linked curriculum stays behind explicit sign-in without exposing draft IDs or titles", () => {
  const { h, data, view } = readerSetup();
  const html = h.render(
    createElement(view.ArticleReaderView, {
      result: {
        kind: "ready",
        article: data.parsePublicArticle(readerRaw(), "public-1"),
      },
      onClassic() {},
    }),
  );
  assert.match(html, /Linked roadmaps and lessons require an account/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /href="\/articles"/);
  assert.doesNotMatch(html, /not-for-the-list/);
  assert.equal(h.queryCalls.length, 0);
});
test("reader unavailable, missing and loading states offer distinct recovery without invented progress", () => {
  const { h, view } = readerSetup();
  const html = (kind) =>
    h.render(
      createElement(view.ArticleReaderView, {
        result: { kind },
        retryHref: "/articles/public-1",
        onClassic() {},
      }),
    );
  assert.match(html("error"), /Article unavailable/);
  assert.match(html("error"), /href="\/articles\/public-1"/);
  assert.match(html("missing"), /Article not found/);
  assert.doesNotMatch(html("missing"), /Try again/);
  assert.match(html("loading"), /Loading article/);
  assert.doesNotMatch(html("loading"), /%|Try again/);
});
test("reader appearance changes preserve the current URL and learner location, while classic keeps literal Markdown", () => {
  const { h, data } = readerSetup();
  const Page = h.load(
    new URL("../articles/article-reader-page.tsx", import.meta.url),
  ).ArticleReaderPage;
  const result = {
    kind: "ready",
    article: data.parsePublicArticle(
      readerRaw({ content: "## Literal classic text" }),
      "public-1",
    ),
  };
  const tree = Page({ result });
  const gui = walk(
    tree,
    (n) => typeof n.type === "function" && n.type.name === "ArticleReaderView",
  );
  gui[0].props.onClassic();
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["mode", "cli", { navigate: false }],
    ["mode", "gui", { navigate: false }],
  ]);
  const html = h.render(tree);
  assert.match(html, /<article[^>]*>## Literal classic text<\/article>/);
  assert.match(html, /Skip to article/);
  assert.doesNotMatch(html, /aria-current="page"/);
});

const ownDraft = {
  title: "A useful connection",
  content: "## Start here\n\nA handwritten public explanation.",
  roadmapId: "",
  conceptId: "",
};
function ownRaw(patch = {}) {
  return {
    id: "own-article-1",
    title: ownDraft.title,
    content: ownDraft.content,
    authorId: contentUser.id,
    author: { ...contentUser, passwordHash: "do-not-retain" },
    createdAt: "2026-10-20T10:00:00Z",
    updatedAt: "2026-10-20T10:00:00Z",
    roadmapId: null,
    conceptId: null,
    ...patch,
  };
}
function ownSetup(options = {}) {
  const { h } = articleSetup({ authUser: contentUser, ...options });
  return {
    h,
    data: h.load(new URL("../articles/own-articles-data.ts", import.meta.url)),
    client: h.load(
      new URL("../articles/own-articles-client.ts", import.meta.url),
    ),
    view: h.load(new URL("../articles/own-articles-view.tsx", import.meta.url)),
  };
}
function ownApi(initial = [ownRaw()]) {
  const state = {
    rows: structuredClone(initial),
    user: contentUser,
    calls: [],
    next: 2,
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, undefined, options]);
      if (path === "/users/me") return { data: state.user };
      if (path === "/articles") return { data: structuredClone(state.rows) };
      const row = state.rows.find((item) => `/articles/${item.id}` === path);
      if (!row) throw { response: { status: 404 } };
      return { data: structuredClone(row) };
    },
    async post(path, body, options) {
      state.calls.push(["POST", path, body, options]);
      const row = ownRaw({ ...body, id: `own-article-${state.next++}` });
      state.rows.unshift(row);
      return { data: structuredClone(row) };
    },
    async delete(path, options) {
      state.calls.push(["DELETE", path, undefined, options]);
      state.rows = state.rows.filter((row) => `/articles/${row.id}` !== path);
      return { data: { success: true } };
    },
  };
  return { state, api };
}
test("own article library filters by exact author even for admins and projects only owned metadata", () => {
  const { data } = ownSetup(),
    library = data.parseOwnArticles(contentUser, [
      ownRaw(),
      ownRaw({ id: "other", authorId: "foreign" }),
      ownRaw({ id: "deleted-author", authorId: null }),
    ]);
  assert.equal(library.articles.length, 1);
  assert.deepEqual(
    Object.keys(library.articles[0]).sort(),
    [
      "id",
      "title",
      "authorId",
      "createdAt",
      "updatedAt",
      "roadmapId",
      "conceptId",
    ].sort(),
  );
  assert.doesNotMatch(
    JSON.stringify(library.articles),
    /passwordHash|email|content|do-not-retain/,
  );
  const admin = { ...contentUser, role: "admin" };
  assert.equal(
    data.parseOwnArticles(admin, [
      ownRaw(),
      ownRaw({ id: "foreign", authorId: "other" }),
    ]).articles.length,
    1,
  );
  for (const rows of [
    [ownRaw(), ownRaw()],
    [ownRaw({ updatedAt: "bad" })],
    [ownRaw({ title: "" })],
    [ownRaw({ roadmapId: "../bad" })],
    [ownRaw({ authorId: 42 })],
  ])
    assert.throws(() => data.parseOwnArticles(contentUser, rows));
});
test("article drafts enforce current title/body/optional UUID contracts and preserve Markdown exactly", () => {
  const { data } = ownSetup();
  for (const patch of [
    { title: " " },
    { title: "x".repeat(201) },
    { content: "\n " },
    { roadmapId: "not-a-uuid" },
    { conceptId: "/private" },
  ])
    assert.ok(
      Object.values(data.articleDraftErrors({ ...ownDraft, ...patch })).some(
        Boolean,
      ),
    );
  const body = data.articleBody({
    ...ownDraft,
    title: "  学习连接  ",
    content: " leading\n\nMarkdown  ",
  });
  assert.equal(body.title, "学习连接");
  assert.equal(body.content, " leading\n\nMarkdown  ");
  assert.equal(body.roadmapId, undefined);
  assert.equal(body.conceptId, undefined);
  const id = "12345678-1234-4234-8234-123456789abc";
  assert.equal(
    data.articleBody({ ...ownDraft, roadmapId: ` ${id} ` }).roadmapId,
    id,
  );
});
test("article save acknowledgement must match owner, text and optional links without retaining the response account", () => {
  const { data } = ownSetup();
  assert.equal(
    data.parseArticleSave(ownRaw(), contentUser.id, ownDraft).id,
    "own-article-1",
  );
  for (const patch of [
    { authorId: "other" },
    { title: "different" },
    { content: "different" },
    { conceptId: "new-link" },
    { updatedAt: "bad" },
  ])
    assert.throws(() =>
      data.parseArticleSave(ownRaw(patch), contentUser.id, ownDraft),
    );
});
test("own article entry reads account then existing public list, with abort/timeout and no writes", async () => {
  const { api, state } = ownApi(),
    { client } = ownSetup({ api }),
    signal = { name: "sample-abort" };
  const library = await client.loadOwnArticles(signal);
  assert.equal(library.articles.length, 1);
  assert.deepEqual(
    state.calls.map((row) => row.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/articles"],
    ],
  );
  assert.ok(
    state.calls.every(
      (row) => row[3].timeout === 12000 && row[3].signal === signal,
    ),
  );
});
test("publish rechecks the account, posts once, confirms the public body and fresh own list before success", async () => {
  const { api, state } = ownApi(),
    { client, data } = ownSetup({ api }),
    before = data.parseOwnArticles(contentUser, state.rows);
  const result = await client.publishOwnArticle(before, ownDraft);
  assert.equal(result.article.id, "own-article-2");
  assert.equal(result.library.articles.length, 2);
  assert.deepEqual(
    state.calls.map((row) => row.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/articles"],
      ["POST", "/articles"],
      ["GET", "/articles/own-article-2"],
      ["GET", "/users/me"],
      ["GET", "/articles"],
    ],
  );
  assert.equal(state.calls.filter((row) => row[0] === "POST").length, 1);
  assert.equal(
    state.calls.find((row) => row[0] === "POST")[2].content,
    ownDraft.content,
  );
});
test("changed account or invalid article fields stop publishing before any write", async () => {
  for (const invalid of [false, true]) {
    const { api, state } = ownApi(),
      { client, data } = ownSetup({ api }),
      before = data.parseOwnArticles(contentUser, state.rows);
    if (!invalid) state.user = { ...contentUser, id: "new-account" };
    await assert.rejects(
      client.publishOwnArticle(
        before,
        invalid ? { ...ownDraft, title: "" } : ownDraft,
      ),
    );
    assert.equal(state.calls.filter((row) => row[0] === "POST").length, 0);
  }
});
test("publish transport/408/server failures are ambiguous, while refusal is safe and errors discard response secrets", async () => {
  for (const code of [undefined, 408, 503, 400, 403, 422]) {
    const { api, state } = ownApi();
    api.post = async () => {
      throw {
        response: code
          ? { status: code, data: { message: "secret body" } }
          : undefined,
        config: { secret: "secret config" },
      };
    };
    const { client, data } = ownSetup({ api }),
      before = data.parseOwnArticles(contentUser, state.rows);
    await assert.rejects(
      client.publishOwnArticle(before, ownDraft),
      (error) => {
        assert.equal(error.uncertain, !code || code === 408 || code >= 500);
        assert.equal(error.unavailable, code === 403);
        assert.doesNotMatch(JSON.stringify(error), /secret body|secret config/);
        return true;
      },
    );
  }
});
test("malformed publish acknowledgements and failed readbacks retain known IDs and pause repeat writes", async () => {
  for (const problem of ["ack", "readback"]) {
    const { api, state } = ownApi(),
      post = api.post,
      get = api.get;
    api.post = async (...args) => {
      const response = await post(...args);
      if (problem === "ack") response.data.content = "different";
      return response;
    };
    api.get = async (path, opts) => {
      if (problem === "readback" && path === "/articles/own-article-2")
        throw { response: { status: 503 } };
      return get(path, opts);
    };
    const { client, data } = ownSetup({ api });
    await assert.rejects(
      client.publishOwnArticle(
        data.parseOwnArticles(contentUser, state.rows),
        ownDraft,
      ),
      (error) =>
        error.uncertain === true && error.articleId === "own-article-2",
    );
    assert.equal(state.calls.filter((row) => row[0] === "POST").length, 1);
  }
});
test("own deletion rechecks owner and saved fingerprint, requires a strict acknowledgement and confirmed absence", async () => {
  const { api, state } = ownApi(),
    { client, data } = ownSetup({ api }),
    before = data.parseOwnArticles(contentUser, state.rows);
  const library = await client.deleteOwnArticle(before, before.articles[0]);
  assert.equal(library.articles.length, 0);
  assert.equal(state.calls.filter((row) => row[0] === "DELETE").length, 1);
  assert.deepEqual(
    state.calls.map((row) => row.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/articles"],
      ["GET", "/articles/own-article-1"],
      ["DELETE", "/articles/own-article-1"],
      ["GET", "/articles/own-article-1"],
      ["GET", "/users/me"],
      ["GET", "/articles"],
    ],
  );
});
test("changed, removed or foreign articles stop deletion before the request, including admin own-list actions", async () => {
  for (const change of ["version", "owner", "removed"]) {
    const { api, state } = ownApi(),
      { client, data } = ownSetup({ api }),
      before = data.parseOwnArticles(contentUser, state.rows);
    if (change === "version") state.rows[0].updatedAt = "2026-10-21T10:00:00Z";
    if (change === "owner") state.rows[0].authorId = "foreign";
    if (change === "removed") state.rows = [];
    await assert.rejects(client.deleteOwnArticle(before, before.articles[0]));
    assert.equal(state.calls.filter((row) => row[0] === "DELETE").length, 0);
  }
});
test("delete malformed acknowledgement, still-present article and failed readback remain uncertain without automatic repeats", async () => {
  for (const problem of ["ack", "present", "read"]) {
    const { api, state } = ownApi(),
      remove = api.delete,
      get = api.get;
    api.delete = async (...args) => {
      if (problem === "present") {
        state.calls.push(["DELETE", args[0]]);
        return { data: { success: true } };
      }
      const response = await remove(...args);
      return problem === "ack" ? { data: { success: "yes" } } : response;
    };
    api.get = async (path, opts) => {
      if (
        problem === "read" &&
        state.calls.some((row) => row[0] === "DELETE") &&
        path === "/articles/own-article-1"
      )
        throw { response: { status: 503 } };
      return get(path, opts);
    };
    const { client, data } = ownSetup({ api }),
      before = data.parseOwnArticles(contentUser, state.rows);
    await assert.rejects(
      client.deleteOwnArticle(before, before.articles[0]),
      (error) =>
        error.uncertain === true && error.articleId === "own-article-1",
    );
    assert.equal(state.calls.filter((row) => row[0] === "DELETE").length, 1);
  }
});
test("read-only publish recovery identifies only new own title matches or a retained ID and never writes", async () => {
  const { api, state } = ownApi(),
    { client, data } = ownSetup({ api }),
    before = data.parseOwnArticles(contentUser, state.rows);
  state.rows.unshift(
    ownRaw({ id: "candidate" }),
    ownRaw({ id: "foreign-match", authorId: "other" }),
    ownRaw({ id: "other-title", title: "Different" }),
  );
  const result = await client.checkOwnArticleAction(before, {
    kind: "create",
    draft: ownDraft,
  });
  assert.deepEqual(
    Array.from(result.candidates, (row) => row.id),
    ["candidate"],
  );
  const byId = await client.checkOwnArticleAction(
    before,
    { kind: "create", draft: ownDraft },
    "own-article-1",
  );
  assert.deepEqual(
    Array.from(byId.candidates, (row) => row.id),
    ["own-article-1"],
  );
  assert.ok(state.calls.every((row) => row[0] === "GET"));
});
test("read-only delete recovery treats only 404 as absent; unavailable readback never unlocks changes", async () => {
  const { api, state } = ownApi(),
    get = api.get,
    { client, data } = ownSetup({ api }),
    before = data.parseOwnArticles(contentUser, state.rows);
  state.rows = [];
  assert.equal(
    (
      await client.checkOwnArticleAction(before, {
        kind: "delete",
        article: before.articles[0],
      })
    ).removed,
    true,
  );
  api.get = async (path, opts) => {
    if (path === "/articles/own-article-1") throw { response: { status: 503 } };
    return get(path, opts);
  };
  await assert.rejects(
    client.checkOwnArticleAction(before, {
      kind: "delete",
      article: before.articles[0],
    }),
  );
  assert.ok(state.calls.every((row) => row[0] === "GET"));
});
test("account token changes during preflight stop the article write", async () => {
  let token = "first";
  const { api, state } = ownApi(),
    get = api.get;
  api.get = async (...args) => {
    const result = await get(...args);
    if (args[0] === "/articles") token = "second";
    return result;
  };
  const { client, data } = ownSetup({ api, authToken: () => token });
  await assert.rejects(
    client.publishOwnArticle(
      data.parseOwnArticles(contentUser, state.rows),
      ownDraft,
    ),
    (error) => error.unavailable,
  );
  assert.equal(state.calls.filter((row) => row[0] === "POST").length, 0);
});
test("own article workspace presents actual counts, labelled public authoring, editor links and no invented review gate", () => {
  const { h, data, view } = ownSetup();
  const library = data.parseOwnArticles(contentUser, [
    ownRaw(),
    ownRaw({ id: "second" }),
  ]);
  const html = h.render(
    createElement(view.OwnArticlesView, {
      data: library,
      onAction() {},
      onCheck() {},
      onResume() {},
      onNew() {},
    }),
  );
  assert.match(html, /2 articles in your last checked library/);
  assert.match(html, /Publishes immediately/);
  for (const id of ["title", "content", "roadmapId", "conceptId"])
    assert.match(html, new RegExp(`id="own-article-${id}"`));
  assert.match(html, /Preview Markdown/);
  assert.match(html, /Review &amp; publish/);
  assert.match(html, /\/developer\/articles\/own-article-1\/edit/);
  assert.doesNotMatch(html, /\(classic\)/);
  assert.doesNotMatch(
    html,
    /In review|Awaiting approval|do-not-retain|Auto-saved/,
  );
});
test("own article empty/loading/unavailable/recovery states are distinct and retain late-request warnings", () => {
  const { h, data, view } = ownSetup(),
    base = { onAction() {}, onCheck() {}, onResume() {}, onNew() {} };
  const render = (props) =>
    h.render(createElement(view.OwnArticlesView, { ...base, ...props }));
  assert.match(render({ loading: true }), /Loading your articles/);
  assert.match(render({}), /Library unavailable/);
  assert.match(
    render({ data: data.parseOwnArticles(contentUser, []) }),
    /Your first article starts here/,
  );
  const locked = render({
    locked: true,
    error: "Could not confirm",
    recovery: {
      library: data.parseOwnArticles(contentUser, []),
      candidates: [],
      removed: false,
    },
  });
  assert.match(locked, /Review before another change/);
  assert.match(locked, /earlier request may still finish/);
  assert.match(locked, /I reviewed saved state/);
});
function ownControllerSetup({ api, states = [] } = {}) {
  let si = 0,
    ri = 0;
  const refs = [],
    values = [...states];
  const hooks = {
    useEffect() {},
    useState(initial) {
      const i = si++;
      if (!(i in values))
        values[i] = typeof initial === "function" ? initial() : initial;
      return [
        values[i],
        (value) => {
          values[i] = typeof value === "function" ? value(values[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = ri++;
      return refs[i] ?? (refs[i] = { current: initial });
    },
  };
  const setup = ownSetup({
    api,
    hooks,
    queries: {
      [`articles/own-library/${contentUser.id}/${contentUser.role}`]: {
        data: { user: contentUser, articles: [] },
        isPending: false,
        isFetching: false,
        isError: false,
      },
    },
  });
  const component = setup.h.load(
    new URL("../articles/gui-own-articles.tsx", import.meta.url),
  ).GuiOwnArticles;
  return {
    ...setup,
    values,
    render() {
      si = 0;
      ri = 0;
      const tree = component();
      return {
        tree,
        view: walk(tree, (n) => n.type?.name === "OwnArticlesView")[0],
      };
    },
  };
}
test("own article controller binds the cache to account, reads only on entry and synchronously blocks repeat submissions", async () => {
  const { api, state } = ownApi([]),
    post = api.post;
  let release;
  api.post = async (...args) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    return post(...args);
  };
  const setup = ownControllerSetup({ api }),
    props = setup.render().view.props;
  assert.equal(setup.h.queryCalls[0].retry, false);
  assert.equal(setup.h.queryCalls[0].refetchOnWindowFocus, false);
  assert.deepEqual(Array.from(setup.h.queryCalls[0].queryKey), [
    "articles",
    "own-library",
    contentUser.id,
    contentUser.role,
  ]);
  assert.equal(state.calls.length, 0);
  props.onAction({ kind: "create", draft: ownDraft });
  props.onAction({ kind: "create", draft: ownDraft });
  await new Promise(setImmediate);
  release();
  await new Promise(setImmediate);
  assert.equal(state.calls.filter((row) => row[0] === "POST").length, 1);
  assert.equal(setup.render().view.props.result.id, "own-article-2");
});
test("ambiguous publish locks the controller; failed saved-state checks stay locked and only successful review can resume", async () => {
  const { api } = ownApi([]),
    get = api.get;
  let failCheck = false;
  api.post = async () => {
    throw { response: { status: 408 } };
  };
  api.get = async (...args) => {
    if (failCheck) throw { response: { status: 503 } };
    return get(...args);
  };
  const setup = ownControllerSetup({ api });
  setup.render().view.props.onAction({ kind: "create", draft: ownDraft });
  await new Promise(setImmediate);
  let props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.equal(props.blocked, true);
  failCheck = true;
  props.onCheck();
  await new Promise(setImmediate);
  props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.equal(props.recovery, undefined);
  props.onResume();
  assert.equal(setup.render().view.props.locked, true);
  failCheck = false;
  props.onCheck();
  await new Promise(setImmediate);
  props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.ok(props.recovery);
  props.onResume();
  props = setup.render().view.props;
  assert.equal(props.locked, false);
  assert.equal(props.previousUncertain, true);
});

test("token changes after publish retain the known ID as uncertain and hide the prior account without reading it back", async () => {
  let token = "first";
  const { api, state } = ownApi(),
    post = api.post;
  api.post = async (...args) => {
    const result = await post(...args);
    token = "second";
    return result;
  };
  const { client, data } = ownSetup({ api, authToken: () => token });
  await assert.rejects(
    client.publishOwnArticle(
      data.parseOwnArticles(contentUser, state.rows),
      ownDraft,
    ),
    (error) =>
      error.uncertain &&
      error.unavailable &&
      error.articleId === "own-article-2",
  );
  assert.equal(state.calls.filter((row) => row[0] === "POST").length, 1);
  assert.equal(
    state.calls.some((row) => row[1] === "/articles/own-article-2"),
    false,
  );
});
test("own article server entry selects a client leaf, while classic mode never starts GUI library reads", () => {
  const { h } = ownSetup({
    mode: { ready: true, isCli: true, location: { kind: "root" } },
  });
  const entry = h.load(
    new URL("../../app/developer/articles/page.tsx", import.meta.url),
  ).default;
  const page = entry();
  assert.equal(page.type.name, "OwnArticlesPage");
  assert.deepEqual(Object.keys(page.props), []);
  const tree = page.type(page.props);
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["mode", "gui", { navigate: false }],
  ]);
  assert.equal(h.queryCalls.length, 0);
});

function articleEditorSetup(options = {}) {
  const { h } = ownSetup(options);
  return {
    h,
    data: h.load(
      new URL("../articles/article-editor-data.ts", import.meta.url),
    ),
    client: h.load(
      new URL("../articles/article-editor-client.ts", import.meta.url),
    ),
    view: h.load(
      new URL("../articles/article-editor-view.tsx", import.meta.url),
    ),
  };
}
function editableApi(initial = [ownRaw()]) {
  const setup = ownApi(initial);
  setup.api.patch = async (path, body, options) => {
    setup.state.calls.push(["PATCH", path, body, options]);
    const row = setup.state.rows.find(
      (item) => `/articles/${item.id}` === path,
    );
    if (!row) throw { response: { status: 404 } };
    Object.assign(row, body, {
      updatedAt: "2026-10-21T12:00:00Z",
      slug: "a-new-slug-is-not-the-route",
    });
    return { data: structuredClone(row) };
  };
  return setup;
}
const editedDraft = {
  ...ownDraft,
  title: "A clearer connection",
  content: "## Updated\n\nThe public explanation, refined.\n",
};
test("article editor projects matching author/admin reading fields and accepts orphan articles only for admins", () => {
  const { data } = articleEditorSetup();
  const article = data.parseEditableArticle(
    ownRaw(),
    contentUser,
    "own-article-1",
  );
  assert.equal(article.content, ownDraft.content);
  assert.equal(article.authorId, contentUser.id);
  assert.doesNotMatch(
    JSON.stringify(article),
    /passwordHash|email|slug|do-not-retain/,
  );
  for (const patch of [
    { id: "other" },
    { authorId: "foreign" },
    { authorId: undefined },
    { content: undefined },
    { updatedAt: "bad" },
  ])
    assert.throws(() =>
      data.parseEditableArticle(ownRaw(patch), contentUser, "own-article-1"),
    );
  const admin = { ...contentUser, role: "admin" };
  assert.equal(
    data.parseEditableArticle(
      ownRaw({ authorId: "foreign" }),
      admin,
      "own-article-1",
    ).authorId,
    "foreign",
  );
  assert.equal(
    data.parseEditableArticle(
      ownRaw({ authorId: null, author: null }),
      admin,
      "own-article-1",
    ).authorId,
    null,
  );
  assert.throws(() =>
    data.parseEditableArticle(
      ownRaw({ authorId: null }),
      contentUser,
      "own-article-1",
    ),
  );
});
test("article edit body preserves exact Markdown and explicitly clears each blank optional link", () => {
  const { data } = articleEditorSetup(),
    body = data.articleEditBody({
      ...editedDraft,
      title: "  学习连接  ",
      content: " exact text\n\n ",
      roadmapId: " ",
      conceptId: "",
    });
  assert.equal(body.title, "学习连接");
  assert.equal(body.content, " exact text\n\n ");
  assert.equal(body.roadmapId, null);
  assert.equal(body.conceptId, null);
  const article = data.parseEditableArticle(
    ownRaw(),
    contentUser,
    "own-article-1",
  );
  assert.equal(data.articleMatchesDraft(article, ownDraft), true);
  assert.equal(
    data.articleMatchesDraft(article, { ...ownDraft, content: " " }),
    false,
  );
  assert.notEqual(
    data.articleEditFingerprint(article),
    data.articleEditFingerprint({ ...article, content: "changed" }),
  );
});
test("article editor loads timed abortable account then detail with no list or write on entry", async () => {
  const { api, state } = editableApi(),
    { client } = articleEditorSetup({ api }),
    signal = { name: "abort-sample" };
  const result = await client.loadArticleEditor("own-article-1", signal);
  assert.equal(result.article.id, "own-article-1");
  assert.deepEqual(
    state.calls.map((row) => row.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/articles/own-article-1"],
    ],
  );
  assert.ok(
    state.calls.every(
      (row) => row[3].timeout === 12000 && row[3].signal === signal,
    ),
  );
});
test("article editor invalid addresses, missing rows, denied ownership and malformed responses never become an empty editor", async () => {
  for (const issue of ["id", "missing", "foreign", "malformed"]) {
    const { api, state } = editableApi();
    if (issue === "missing") state.rows = [];
    if (issue === "foreign") state.rows[0].authorId = "other";
    if (issue === "malformed") state.rows[0].content = undefined;
    const { client } = articleEditorSetup({ api });
    await assert.rejects(
      client.loadArticleEditor(issue === "id" ? "bad/path" : "own-article-1"),
      (error) =>
        error.unavailable === true &&
        (issue !== "missing" || error.missing === true),
    );
    assert.equal(
      state.calls.some((row) => row[0] === "PATCH"),
      false,
    );
    if (issue === "id") assert.equal(state.calls.length, 0);
  }
});
test("article editor sends one existing PATCH after version checks and confirms the complete public readback", async () => {
  const { api, state } = editableApi(),
    { client } = articleEditorSetup({ api }),
    before = await client.loadArticleEditor("own-article-1");
  state.calls = [];
  const result = await client.saveArticleEdit(before, editedDraft);
  assert.equal(result.article.title, editedDraft.title);
  assert.equal(result.article.content, editedDraft.content);
  assert.deepEqual(
    state.calls.map((row) => row.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/articles/own-article-1"],
      ["PATCH", "/articles/own-article-1"],
      ["GET", "/users/me"],
      ["GET", "/articles/own-article-1"],
    ],
  );
  const write = state.calls.find((row) => row[0] === "PATCH");
  assert.equal(write[2].roadmapId, null);
  assert.equal(write[2].conceptId, null);
  assert.equal(write[3].timeout, 12000);
  assert.equal(result.article.slug, undefined);
});
test("unchanged or invalid article edits and changed account/version stop before PATCH", async () => {
  for (const issue of [
    "unchanged",
    "invalid",
    "account",
    "role",
    "body",
    "owner",
    "links",
  ]) {
    const { api, state } = editableApi(),
      { client } = articleEditorSetup({ api }),
      before = await client.loadArticleEditor("own-article-1");
    state.calls = [];
    if (issue === "account") state.user = { ...contentUser, id: "new-account" };
    if (issue === "role") state.user = { ...contentUser, role: "admin" };
    if (issue === "body")
      state.rows[0].content =
        "Someone else changed the body without a new timestamp.";
    if (issue === "owner") state.rows[0].authorId = "other";
    if (issue === "links") state.rows[0].roadmapId = "different-link";
    await assert.rejects(
      client.saveArticleEdit(
        before,
        issue === "unchanged"
          ? ownDraft
          : issue === "invalid"
            ? { ...editedDraft, content: " " }
            : editedDraft,
      ),
      (error) =>
        !(issue === "body" || issue === "links") || error.conflict === true,
    );
    assert.equal(state.calls.filter((row) => row[0] === "PATCH").length, 0);
  }
});
test("admin article edits retain original foreign or orphan authorship and use the same saved-state checks", async () => {
  for (const authorId of ["foreign", null]) {
    const { api, state } = editableApi([
      ownRaw({
        authorId,
        author: authorId ? { name: "Original author" } : null,
      }),
    ]);
    state.user = { ...contentUser, role: "admin" };
    const { client } = articleEditorSetup({ api }),
      before = await client.loadArticleEditor("own-article-1"),
      saved = await client.saveArticleEdit(before, editedDraft);
    assert.equal(saved.article.authorId, authorId);
    assert.equal(state.calls.filter((row) => row[0] === "PATCH").length, 1);
  }
});
test("article edit transport/408/server failures pause writes, while definite refusals discard raw response details", async () => {
  for (const code of [undefined, 408, 503, 400, 403, 422]) {
    const { api } = editableApi();
    api.patch = async () => {
      throw {
        response: code
          ? { status: code, data: { message: "private backend payload" } }
          : undefined,
        config: { secret: "private request" },
      };
    };
    const { client } = articleEditorSetup({ api }),
      before = await client.loadArticleEditor("own-article-1");
    await assert.rejects(
      client.saveArticleEdit(before, editedDraft),
      (error) => {
        assert.equal(error.uncertain, !code || code === 408 || code >= 500);
        assert.equal(error.unavailable, code === 403);
        assert.doesNotMatch(
          JSON.stringify(error),
          /private backend|private request/,
        );
        return true;
      },
    );
  }
});
test("article edit mismatched acknowledgement or readback is uncertain and never repeats the PATCH", async () => {
  for (const issue of ["ack", "content", "read", "deleted"]) {
    const { api, state } = editableApi(),
      patch = api.patch,
      get = api.get;
    let wrote = false;
    api.patch = async (...args) => {
      const response = await patch(...args);
      wrote = true;
      if (issue === "ack") response.data.id = "wrong";
      return response;
    };
    api.get = async (path, options) => {
      if (wrote && path === "/articles/own-article-1") {
        if (issue === "read") throw { response: { status: 503 } };
        if (issue === "deleted") throw { response: { status: 404 } };
        const response = await get(path, options);
        if (issue === "content") response.data.content = "different saved body";
        return response;
      }
      return get(path, options);
    };
    const { client } = articleEditorSetup({ api }),
      before = await client.loadArticleEditor("own-article-1");
    await assert.rejects(
      client.saveArticleEdit(before, editedDraft),
      (error) =>
        error.uncertain === true &&
        (issue !== "deleted" || error.missing === true),
    );
    assert.equal(state.calls.filter((row) => row[0] === "PATCH").length, 1);
  }
});
test("article editor token changes after PATCH hide prior account state and leave the outcome uncertain", async () => {
  let token = "first";
  const { api, state } = editableApi(),
    patch = api.patch;
  api.patch = async (...args) => {
    const result = await patch(...args);
    token = "second";
    return result;
  };
  const { client } = articleEditorSetup({ api, authToken: () => token }),
    before = await client.loadArticleEditor("own-article-1");
  state.calls = [];
  await assert.rejects(
    client.saveArticleEdit(before, editedDraft),
    (error) => error.uncertain && error.unavailable,
  );
  assert.equal(state.calls.filter((row) => row[0] === "PATCH").length, 1);
  assert.equal(state.calls.at(-1)[0], "PATCH");
});
test("article editor UI distinguishes saved reference, immediate public save, local preview and admin override", () => {
  const { h, data, view } = articleEditorSetup(),
    article = data.parseEditableArticle(ownRaw(), contentUser, "own-article-1"),
    base = {
      context: { user: contentUser, article },
      draft: ownDraft,
      onDraft() {},
      onSave() {},
      onCheck() {},
      onAdopt() {},
    };
  const html = h.render(createElement(view.ArticleEditorView, base));
  assert.match(html, /Saves update the public article immediately/);
  assert.match(html, /Matches the saved reference/);
  assert.match(html, /Saved reference/);
  assert.match(html, /Read public article/);
  assert.match(html, /Leaving a field blank removes/);
  assert.match(html, /id="edit-article-title"/);
  assert.doesNotMatch(
    html,
    /passwordHash|do-not-retain|AI generation|staged draft/,
  );
  const admin = h.render(
    createElement(view.ArticleEditorView, {
      ...base,
      context: {
        user: { ...contentUser, role: "admin" },
        article: { ...article, authorId: null, authorName: null },
      },
    }),
  );
  assert.match(admin, /Editing as an administrator/);
  assert.match(admin, /no longer has an author account/);
  assert.match(admin, /does not transfer authorship/);
});
test("editor saved-version review offers explicit keep or replace choices and never invents successful mutation status", () => {
  const { h, data, view } = articleEditorSetup(),
    article = data.parseEditableArticle(ownRaw(), contentUser, "own-article-1"),
    context = { user: contentUser, article };
  const html = h.render(
    createElement(view.ArticleEditorView, {
      context,
      draft: editedDraft,
      locked: true,
      earlierRequest: true,
      review: context,
      onDraft() {},
      onSave() {},
      onCheck() {},
      onAdopt() {},
    }),
  );
  assert.match(html, /Your local draft is kept/);
  assert.match(html, /Keep my draft with this saved version/);
  assert.match(html, /Replace my draft with saved text/);
  assert.match(html, /Compare checked saved Markdown/);
  assert.match(html, /Earlier save may still finish/);
  assert.doesNotMatch(html, /Changes saved and checked/);
});
function editorControllerSetup({ api } = {}) {
  let si = 0,
    ri = 0;
  const values = [],
    refs = [];
  const projected = articleEditorSetup().data.parseEditableArticle(
      ownRaw(),
      contentUser,
      "own-article-1",
    ),
    context = { user: contentUser, article: projected };
  const hooks = {
    useEffect() {},
    useState(initial) {
      const i = si++;
      if (!(i in values))
        values[i] = typeof initial === "function" ? initial() : initial;
      return [
        values[i],
        (value) => {
          values[i] = typeof value === "function" ? value(values[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = ri++;
      return refs[i] ?? (refs[i] = { current: initial });
    },
  };
  const setup = articleEditorSetup({
    api,
    hooks,
    queries: {
      [`articles/editor/own-article-1/${contentUser.id}/${contentUser.role}`]: {
        data: context,
        isPending: false,
        isFetching: false,
        isError: false,
      },
    },
  });
  const Component = setup.h.load(
    new URL("../articles/gui-article-editor.tsx", import.meta.url),
  ).GuiArticleEditor;
  return {
    ...setup,
    values,
    context,
    render() {
      si = 0;
      ri = 0;
      const tree = Component({ id: "own-article-1" });
      return {
        tree,
        view: walk(tree, (n) => n.type?.name === "ArticleEditorView")[0],
      };
    },
  };
}
test("article editor controller scopes reads to account/article and synchronously blocks duplicate saves", async () => {
  const { api, state } = editableApi(),
    patch = api.patch;
  let release;
  api.patch = async (...args) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    return patch(...args);
  };
  const setup = editorControllerSetup({ api }),
    props = setup.render().view.props;
  assert.equal(setup.h.queryCalls[0].retry, false);
  assert.equal(setup.h.queryCalls[0].refetchOnWindowFocus, false);
  assert.equal(state.calls.length, 0);
  props.onSave(editedDraft);
  props.onSave(editedDraft);
  await new Promise(setImmediate);
  release();
  await new Promise(setImmediate);
  assert.equal(state.calls.filter((row) => row[0] === "PATCH").length, 1);
  assert.match(setup.render().view.props.notice, /Changes saved and checked/);
});
test("article editor failed recovery stays locked; successful checks keep local text until explicit version adoption", async () => {
  const { api } = editableApi(),
    get = api.get;
  let fail = false;
  api.patch = async () => {
    throw { response: { status: 408 } };
  };
  api.get = async (...args) => {
    if (fail) throw { response: { status: 503 } };
    return get(...args);
  };
  const setup = editorControllerSetup({ api });
  setup.render().view.props.onDraft(editedDraft);
  setup.render().view.props.onSave(editedDraft);
  await new Promise(setImmediate);
  let props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.equal(props.earlierRequest, true);
  fail = true;
  props.onCheck();
  await new Promise(setImmediate);
  props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.equal(props.review, undefined);
  assert.equal(props.draft.content, editedDraft.content);
  props.onAdopt(false);
  assert.equal(setup.render().view.props.draft.content, editedDraft.content);
  fail = false;
  props.onCheck();
  await new Promise(setImmediate);
  props = setup.render().view.props;
  assert.ok(props.review);
  assert.equal(props.locked, true);
  assert.equal(props.draft.content, editedDraft.content);
  props.onAdopt(false);
  props = setup.render().view.props;
  assert.equal(props.locked, false);
  assert.equal(props.draft.content, ownDraft.content);
  assert.equal(props.earlierRequest, true);
});
test("article editor server route awaits a plain ID and classic mode starts no GUI editor query", async () => {
  const { h } = articleEditorSetup({
    mode: { ready: true, isCli: true, location: { kind: "root" } },
  });
  const route = h.load(
    new URL("../../app/developer/articles/[id]/edit/page.tsx", import.meta.url),
  ).default;
  const tree = await route({
    params: Promise.resolve({ id: "own-article-1" }),
  });
  assert.equal(tree.props.id, "own-article-1");
  assert.equal(tree.key, "own-article-1");
  const classic = tree.type(tree.props);
  walk(classic, (n) => n.type === "button")[0].props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["mode", "gui", { navigate: false }],
  ]);
  assert.equal(h.queryCalls.length, 0);
});
test("article editor navigation keeps My articles active for nested editor routes", () => {
  const { h } = articleEditorSetup({
    pathname: "/developer/articles/own-article-1/edit",
  });
  const html = h.render(
    createElement(
      h.shell.GuiWorkspaceShell,
      { user: contentUser, section: "Edit article" },
      "Editor sample",
    ),
  );
  assert.match(html, /href="\/developer\/articles"[^>]*aria-current="page"/);
});

const sampleProfile = {
  id: "12345678-1234-4234-8234-123456789abc",
  name: "Mira Patel",
  email: "mira@example.test",
  role: "developer",
  timezone: "Asia/Kolkata",
  profilePicture: null,
  hasPassword: true,
  authProvider: null,
  preferences: { uiMode: "gui", hasSeenCliWelcome: true },
};
const samplePassword = {
  currentPassword: "sample-current-value",
  newPassword: "sample-next-value",
  confirmPassword: "sample-next-value",
};
function profileSetup(options = {}) {
  const h = roadmapHarness({
    authToken: "profile-session",
    authUser: sampleProfile,
    ...options,
  });
  return {
    h,
    data: h.load(new URL("../profile/profile-data.ts", import.meta.url)),
    client: h.load(new URL("../profile/profile-client.ts", import.meta.url)),
    view: h.load(new URL("../profile/profile-view.tsx", import.meta.url)),
  };
}
function profileApi(patch = {}) {
  const state = {
    user: structuredClone({ ...sampleProfile, ...patch }),
    calls: [],
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, undefined, options]);
      return { data: structuredClone(state.user) };
    },
    async patch(path, body, options) {
      state.calls.push(["PATCH", path, body, options]);
      if (path.endsWith("/password"))
        return { data: { message: "Password updated successfully" } };
      Object.assign(state.user, body);
      return { data: structuredClone(state.user) };
    },
  };
  return { api, state };
}
test("profile projection retains known preferences and capabilities while dropping account secrets", () => {
  const { data } = profileSetup();
  const profile = data.parseProfile({
    ...sampleProfile,
    passwordHash: "private-hash",
    authProviderId: "private-provider-id",
    preferences: { ...sampleProfile.preferences, secret: "private-value" },
  });
  assert.equal(profile.hasPassword, true);
  assert.equal(profile.preferences.hasSeenCliWelcome, true);
  assert.doesNotMatch(
    JSON.stringify(profile),
    /private-|passwordHash|authProviderId|secret/,
  );
  assert.equal(
    data.parseProfile({ ...sampleProfile, timezone: "Asia/Kathmandu" })
      .timezone,
    "Asia/Kathmandu",
  );
  for (const patch of [
    { id: "foreign" },
    { hasPassword: undefined },
    { role: "instructor" },
    { profilePicture: "javascript:alert(1)" },
    { timezone: "Not/AZone" },
    { profilePicture: "https://name:pass@example.test/a.jpg" },
  ])
    assert.throws(() => data.parseProfile({ ...sampleProfile, ...patch }));
});
test("profile and password validation identifies actual invalid fields without trimming passwords", () => {
  const { data } = profileSetup();
  assert.ok(
    data.profileErrors({ ...data.profileDraft(sampleProfile), name: "  " })
      .name,
  );
  assert.ok(
    data.profileErrors({
      ...data.profileDraft(sampleProfile),
      name: "a".repeat(101),
    }).name,
  );
  assert.ok(
    data.profileErrors({
      ...data.profileDraft(sampleProfile),
      timezone: "wrong",
    }).timezone,
  );
  assert.equal(Object.keys(data.passwordErrors(samplePassword)).length, 0);
  assert.ok(
    data.passwordErrors({ ...samplePassword, newPassword: "short" })
      .newPassword,
  );
  assert.ok(
    data.passwordErrors({ ...samplePassword, confirmPassword: "different" })
      .confirmPassword,
  );
  assert.ok(
    data.passwordErrors({
      ...samplePassword,
      newPassword: samplePassword.currentPassword,
    }).newPassword,
  );
});
test("profile entry reads only the timed abortable current account and rejects changed identity", async () => {
  const { api, state } = profileApi(),
    { client } = profileSetup({ api }),
    signal = { sample: "abort" };
  await client.loadProfile(sampleProfile, signal);
  assert.equal(state.calls.length, 1);
  assert.equal(state.calls[0][1], "/users/me");
  assert.equal(state.calls[0][3].timeout, 12000);
  assert.equal(state.calls[0][3].signal, signal);
  state.user.role = "admin";
  await assert.rejects(
    client.loadProfile(sampleProfile),
    (error) => error.unavailable,
  );
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 0);
});
test("unchanged and invalid profile drafts never start a request", async () => {
  const { api, state } = profileApi(),
    { client, data } = profileSetup({ api });
  await assert.rejects(
    client.saveProfile(sampleProfile, data.profileDraft(sampleProfile)),
  );
  await assert.rejects(
    client.saveProfile(sampleProfile, {
      ...data.profileDraft(sampleProfile),
      name: "  ",
    }),
  );
  assert.equal(state.calls.length, 0);
});
test("profile save rechecks saved fields, sends one scoped PATCH and requires matching readback", async () => {
  const { api, state } = profileApi(),
    { client, data } = profileSetup({ api });
  const saved = await client.saveProfile(sampleProfile, {
    ...data.profileDraft(sampleProfile),
    name: "  Updated name  ",
  });
  assert.equal(saved.name, "Updated name");
  assert.deepEqual(
    state.calls.map((c) => c.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["PATCH", "/users/me"],
      ["GET", "/users/me"],
    ],
  );
  assert.deepEqual(Object.keys(state.calls[1][2]).sort(), ["name", "timezone"]);
  assert.ok(state.calls.every((c) => c[3].timeout === 12000));
});
test("unchanged provider photo is preserved without sending a remote URL to the data-only upload endpoint", async () => {
  const { api, state } = profileApi({
      profilePicture: "https://example.test/avatar.jpg",
    }),
    { client, data } = profileSetup({ api });
  const before = { ...state.user };
  await client.saveProfile(before, {
    ...data.profileDraft(before),
    name: "Changed",
  });
  assert.equal(state.calls[1][2].profilePicture, undefined);
  assert.equal(state.user.profilePicture, before.profilePicture);
  state.calls.length = 0;
  await client.saveProfile(state.user, {
    ...data.profileDraft(state.user),
    profilePicture: null,
  });
  assert.equal(state.calls[1][2].profilePicture, null);
});
test("stale details and identity stop before profile writes", async () => {
  for (const patch of [
    { name: "Changed elsewhere" },
    { email: "other@example.test" },
    { role: "admin" },
  ]) {
    const { api, state } = profileApi(patch),
      { client, data } = profileSetup({ api });
    await assert.rejects(
      client.saveProfile(sampleProfile, {
        ...data.profileDraft(sampleProfile),
        name: "My draft",
      }),
      (error) => error.conflict || error.unavailable,
    );
    assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 0);
  }
});
test("malformed or mismatched profile ACK and failed readback are uncertain and never repeat PATCH", async () => {
  for (const kind of ["ack", "readback", "mismatch"]) {
    const { api, state } = profileApi(),
      patch = api.patch,
      get = api.get;
    api.patch = async (...args) => {
      const result = await patch(...args);
      return kind === "ack"
        ? { data: { passwordHash: "private-response" } }
        : result;
    };
    api.get = async (...args) => {
      if (state.calls.some((c) => c[0] === "PATCH")) {
        if (kind === "readback")
          throw {
            config: { data: "private-request" },
            response: { status: 503 },
          };
        if (kind === "mismatch") state.user.name = "Changed again";
      }
      return get(...args);
    };
    const { client, data } = profileSetup({ api });
    await assert.rejects(
      client.saveProfile(sampleProfile, {
        ...data.profileDraft(sampleProfile),
        name: "Draft",
      }),
      (error) => {
        assert.equal(error.uncertain, true);
        assert.doesNotMatch(JSON.stringify(error) + error.message, /private-/);
        return true;
      },
    );
    assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  }
});
test("profile write errors expose fixed copy and distinguish refusal from uncertainty", async () => {
  for (const code of [400, 408, 503, undefined]) {
    const { api } = profileApi();
    api.patch = async () => {
      throw {
        response: { status: code, data: { message: "private-server-detail" } },
        config: { data: "private-payload" },
      };
    };
    const { client, data } = profileSetup({ api });
    await assert.rejects(
      client.saveProfile(sampleProfile, {
        ...data.profileDraft(sampleProfile),
        name: "Draft",
      }),
      (error) => {
        assert.equal(error.uncertain, code !== 400);
        assert.doesNotMatch(JSON.stringify(error) + error.message, /private-/);
        return true;
      },
    );
  }
});
test("profile session changes prevent sending a write and hide ambiguous completed writes", async () => {
  for (const at of ["GET", "PATCH"]) {
    let token = "profile-session";
    const { api, state } = profileApi(),
      original = at === "GET" ? api.get : api.patch;
    api[at === "GET" ? "get" : "patch"] = async (...args) => {
      const result = await original(...args);
      token = "changed-session";
      return result;
    };
    const { client, data } = profileSetup({ api, authToken: () => token });
    await assert.rejects(
      client.saveProfile(sampleProfile, {
        ...data.profileDraft(sampleProfile),
        name: "Draft",
      }),
      (error) => error.unavailable && (at === "GET" || error.uncertain),
    );
    assert.equal(
      state.calls.filter((c) => c[0] === "PATCH").length,
      at === "GET" ? 0 : 1,
    );
  }
});
test("password changes check capabilities and send only current and new password once", async () => {
  const { api, state } = profileApi(),
    { client } = profileSetup({ api });
  await client.changeProfilePassword(sampleProfile, samplePassword);
  assert.deepEqual(
    state.calls.map((c) => c.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["PATCH", "/users/me/password"],
    ],
  );
  assert.deepEqual(Object.keys(state.calls[1][2]).sort(), [
    "currentPassword",
    "newPassword",
  ]);
  assert.equal(state.calls[1][3].timeout, 12000);
  state.calls.length = 0;
  state.user.hasPassword = false;
  await assert.rejects(
    client.changeProfilePassword(sampleProfile, samplePassword),
    (error) => error.unavailable,
  );
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 0);
});
test("password malformed ACK and transport failure stay uncertain without retaining credentials or raw errors", async () => {
  for (const kind of ["ack", "failure"]) {
    const { api } = profileApi();
    api.patch = async () => {
      if (kind === "ack")
        return {
          data: {
            message: "Unexpected response",
            passwordHash: "private-hash",
          },
        };
      throw {
        response: { status: 503 },
        config: { data: JSON.stringify(samplePassword) },
      };
    };
    const { client } = profileSetup({ api });
    await assert.rejects(
      client.changeProfilePassword(sampleProfile, samplePassword),
      (error) => {
        assert.equal(error.uncertain, true);
        assert.doesNotMatch(
          JSON.stringify(error) + error.message,
          /sample-current-value|sample-next-value|private-hash/,
        );
        return true;
      },
    );
  }
});
test("photo preparation rejects unsupported and oversized files before decode, crops locally and releases bitmap", async () => {
  let decoded = 0,
    closed = 0;
  const draws = [];
  const { data } = profileSetup({
    globals: {
      createImageBitmap: async () => {
        decoded++;
        return {
          width: 600,
          height: 400,
          close() {
            closed++;
          },
        };
      },
      document: {
        createElement() {
          return {
            getContext() {
              return {
                fillRect() {},
                drawImage(...args) {
                  draws.push(args);
                },
              };
            },
            toDataURL() {
              return "data:image/jpeg;base64,YWJj";
            },
          };
        },
      },
    },
  });
  await assert.rejects(
    data.preparePicture({ type: "image/svg+xml", size: 10 }),
  );
  await assert.rejects(
    data.preparePicture({ type: "image/png", size: 11 * 1024 * 1024 }),
  );
  assert.equal(decoded, 0);
  assert.equal(
    await data.preparePicture({ type: "image/png", size: 1024 }),
    "data:image/jpeg;base64,YWJj",
  );
  assert.equal(closed, 1);
  assert.deepEqual(draws[0].slice(1), [100, 0, 400, 400, 0, 0, 256, 256]);
});
test("profile GUI renders separate labelled forms, read-only email and honest social-only capabilities", () => {
  const { h, data, view } = profileSetup(),
    props = {
      user: sampleProfile,
      draft: data.profileDraft(sampleProfile),
      onDraft() {},
      onSave() {},
      onPassword() {},
      onCheck() {},
      onAdopt() {},
    };
  const html = h.render(createElement(view.ProfileView, props));
  assert.match(html, /A little more/);
  assert.match(html, /id="profile-email"[^>]*readOnly=""/);
  assert.match(html, /autoComplete="current-password"/);
  assert.match(html, /Saved separately from your profile/);
  assert.match(html, /Show confirm new password/);
  const social = h.render(
    createElement(view.ProfileView, {
      ...props,
      user: { ...sampleProfile, authProvider: "google", hasPassword: false },
    }),
  );
  assert.match(social, /You sign in with Google/);
  assert.doesNotMatch(
    social,
    /security-currentPassword|Confirm password change/,
  );
});
function profileHookState() {
  const values = [],
    refs = [];
  let si = 0,
    ri = 0;
  return {
    values,
    reset() {
      si = 0;
      ri = 0;
    },
    hooks: {
      useEffect() {},
      useState(initial) {
        const i = si++;
        if (!(i in values))
          values[i] = typeof initial === "function" ? initial() : initial;
        return [
          values[i],
          (value) =>
            (values[i] =
              typeof value === "function" ? value(values[i]) : value),
        ];
      },
      useRef(initial) {
        const i = ri++;
        return refs[i] ?? (refs[i] = { current: initial });
      },
    },
  };
}
function profileControllerSetup(api, options = {}) {
  const state = profileHookState(),
    setup = profileSetup({
      api,
      hooks: state.hooks,
      ...options,
      queries: {
        [`profile/settings/${sampleProfile.id}/${sampleProfile.role}`]: {
          data: sampleProfile,
          isPending: false,
          isFetching: false,
          isError: false,
        },
      },
    });
  const Controller = setup.h.load(
    new URL("../profile/gui-profile.tsx", import.meta.url),
  ).GuiProfile;
  return {
    ...setup,
    ...state,
    render() {
      state.reset();
      const tree = Controller();
      return {
        tree,
        view: walk(tree, (n) => n.type?.name === "ProfileView")[0],
      };
    },
  };
}
test("profile controller blocks overlapping saves synchronously and caches only checked projected account data", async () => {
  const { api, state } = profileApi(),
    patch = api.patch;
  let release;
  api.patch = async (...args) => {
    await new Promise((resolve) => (release = resolve));
    return patch(...args);
  };
  const setup = profileControllerSetup(api),
    draft = { ...setup.data.profileDraft(sampleProfile), name: "Updated" },
    props = setup.render().view.props;
  props.onSave(draft);
  props.onSave(draft);
  await new Promise(setImmediate);
  release();
  await new Promise(setImmediate);
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  assert.match(setup.render().view.props.notice, /saved and checked/);
  assert.doesNotMatch(
    JSON.stringify(setup.h.calls),
    /currentPassword|newPassword/,
  );
});
test("profile failed recovery stays locked and a successful check requires explicit keep-or-replace choice", async () => {
  const { api } = profileApi(),
    get = api.get;
  let fail = false;
  api.patch = async () => {
    throw { response: { status: 408 } };
  };
  api.get = async (...args) => {
    if (fail) throw { response: { status: 503 } };
    return get(...args);
  };
  const setup = profileControllerSetup(api),
    draft = {
      ...setup.data.profileDraft(sampleProfile),
      name: "My unsaved name",
    };
  setup.render().view.props.onDraft(draft);
  setup.render().view.props.onSave(draft);
  await new Promise(setImmediate);
  assert.equal(setup.render().view.props.locked, true);
  fail = true;
  setup.render().view.props.onCheck();
  await new Promise(setImmediate);
  let props = setup.render().view.props;
  assert.equal(props.locked, true);
  assert.equal(props.review, undefined);
  assert.equal(props.draft.name, draft.name);
  fail = false;
  props.onCheck();
  await new Promise(setImmediate);
  props = setup.render().view.props;
  assert.ok(props.review);
  assert.equal(props.locked, true);
  assert.equal(props.draft.name, draft.name);
  props.onAdopt(true);
  props = setup.render().view.props;
  assert.equal(props.locked, false);
  assert.equal(props.earlierRequest, true);
  assert.equal(props.draft.name, draft.name);
});
test("ambiguous password response pauses password writes and offers no profile-read verification claim", async () => {
  const { api } = profileApi();
  api.patch = async () => {
    throw {
      response: { status: 503 },
      config: { data: JSON.stringify(samplePassword) },
    };
  };
  const setup = profileControllerSetup(api);
  setup.render().view.props.onPassword(samplePassword);
  await new Promise(setImmediate);
  const props = setup.render().view.props;
  assert.equal(props.passwordLocked, true);
  assert.equal(props.pending, undefined);
  assert.doesNotMatch(
    JSON.stringify(setup.h.calls),
    /sample-current-value|sample-next-value/,
  );
  const html = setup.h.render(createElement(setup.view.ProfileView, props));
  assert.match(html, /A profile read cannot verify which password works/);
});
test("password confirmation clears local fields before submitting and validation sends no password request", () => {
  const state = profileHookState(),
    sent = [],
    setup = profileSetup({ hooks: state.hooks }),
    props = {
      user: sampleProfile,
      draft: setup.data.profileDraft(sampleProfile),
      onDraft() {},
      onSave() {},
      onPassword(value) {
        sent.push(value);
        assert.equal(state.values[1].currentPassword, "");
      },
      onCheck() {},
      onAdopt() {},
    };
  const render = () => {
    state.reset();
    return setup.view.ProfileView(props);
  };
  let tree = render();
  walk(tree, (n) => n.type === "form")[1].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(sent.length, 0);
  for (const [key, value] of Object.entries(samplePassword)) {
    tree = render();
    walk(tree, (n) => n.props?.id === `security-${key}`)[0].props.onChange({
      target: { value },
    });
  }
  tree = render();
  walk(tree, (n) => n.type === "form")[1].props.onSubmit({
    preventDefault() {},
  });
  tree = render();
  const dialog = walk(tree, (n) => n.type === "dialog")[0];
  walk(dialog, (n) => n.type === "button")
    .at(-1)
    .props.onClick();
  assert.equal(sent.length, 1);
  assert.equal(render().props.children.length > 0, true);
});
test("classic profile mode starts no GUI account query and switches back without changing learning location", () => {
  const { h } = profileSetup({
    mode: { ready: true, isCli: true, location: { kind: "root" } },
  });
  const Page = h.load(
      new URL("../profile/gui-profile.tsx", import.meta.url),
    ).ProfilePage,
    tree = Page();
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.equal(h.queryCalls.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["mode", "gui", { navigate: false }],
  ]);
});

test("profile controller refuses profile/password/check actions when a session changes between render and click", async () => {
  for (const action of ["onSave", "onPassword", "onCheck"]) {
    let token = "profile-session";
    const { api, state } = profileApi(),
      setup = profileControllerSetup(api, { authToken: () => token });
    const props = setup.render().view.props;
    token = "changed-session";
    props[action](
      action === "onPassword"
        ? samplePassword
        : {
            ...setup.data.profileDraft(sampleProfile),
            name: "Retained local edit",
          },
    );
    await new Promise(setImmediate);
    assert.equal(state.calls.length, 0);
    assert.equal(setup.render().view, undefined);
  }
});
test("profile controller hides unavailable account data without exposing the retained draft", async () => {
  const { api, state } = profileApi({ role: "admin" }),
    setup = profileControllerSetup(api);
  const draft = {
    ...setup.data.profileDraft(sampleProfile),
    name: "A private local draft",
  };
  setup.render().view.props.onDraft(draft);
  setup.render().view.props.onSave(draft);
  await new Promise(setImmediate);
  const { tree, view } = setup.render();
  assert.equal(view, undefined);
  assert.equal(tree.props.user, undefined);
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 0);
  assert.doesNotMatch(
    setup.h.render(tree),
    /A private local draft|mira@example.test/,
  );
});

const noticeId = (i) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
function noticeRaw(i = 1, patch = {}) {
  return {
    id: noticeId(i),
    userId: sampleProfile.id,
    type: "roadmap_rejected",
    createdAt: "2026-10-24T06:00:00Z",
    updatedAt: "2026-10-24T06:00:00Z",
    isRead: false,
    readAt: null,
    payload: {
      roadmapId: noticeId(90),
      roadmapTitle: "Network foundations",
      reason: "Please add examples.",
      reviewedBy: "Reviewer",
      reviewedAt: "2026-10-24T06:00:00Z",
    },
    ...patch,
  };
}
function notificationSetup(options = {}) {
  const h = roadmapHarness({
    authUser: sampleProfile,
    authToken: "notice-session",
    ...options,
  });
  return {
    h,
    data: h.load(
      new URL("../notifications/notifications-data.ts", import.meta.url),
    ),
    client: h.load(
      new URL("../notifications/notifications-client.ts", import.meta.url),
    ),
    view: h.load(
      new URL("../notifications/notifications-view.tsx", import.meta.url),
    ),
  };
}
function notificationApi(rows = [noticeRaw()]) {
  const state = {
    user: { ...sampleProfile },
    rows: structuredClone(rows),
    calls: [],
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, undefined, options]);
      if (path === "/users/me") return { data: state.user };
      if (path === "/notifications")
        return { data: structuredClone(state.rows) };
      if (path === "/notifications/unread-count")
        return { data: { unread: state.rows.filter((n) => !n.isRead).length } };
      throw new Error("Unexpected read");
    },
    async patch(path, body, options) {
      state.calls.push(["PATCH", path, body, options]);
      const row = state.rows.find(
        (n) => path === `/notifications/${n.id}/read`,
      );
      if (!row) throw { response: { status: 404 } };
      row.isRead = true;
      row.readAt = "2026-10-24T07:00:00.000Z";
      return { data: structuredClone(row) };
    },
    async post(path, body, options) {
      state.calls.push(["POST", path, body, options]);
      const unread = state.rows.filter((n) => !n.isRead);
      for (const n of unread) {
        n.isRead = true;
        n.readAt = "2026-10-24T07:00:00.000Z";
      }
      return { data: { marked: unread.length } };
    },
  };
  return { api, state };
}
const notificationSnapshot = (data, rows = [noticeRaw()]) => ({
  user: sampleProfile,
  items: data.parseNotices(rows, sampleProfile.id),
  unread: rows.filter((n) => !n.isRead).length,
  checkedAt: "2026-10-24T06:00:00.000Z",
});
test("notification projection keeps typed decision details while discarding provider errors and raw account metadata", () => {
  const { data } = notificationSetup(),
    raw = noticeRaw(1, {
      payload: {
        reason: "<script>literal text</script>",
        errorMessage: "private-provider-error",
        passwordHash: "private-hash",
        roadmapId: noticeId(90),
      },
    }),
    notice = data.parseNotice(
      { ...raw, user: { passwordHash: "private-hash" } },
      sampleProfile.id,
    );
  assert.equal(notice.payload.reason, "<script>literal text</script>");
  assert.doesNotMatch(
    JSON.stringify(notice),
    /private-|passwordHash|errorMessage/,
  );
  assert.equal(
    data.parseNotices(
      [noticeRaw(1), noticeRaw(2, { createdAt: "2026-10-25T00:00:00Z" })],
      sampleProfile.id,
    )[0].id,
    noticeId(2),
  );
});
test("invalid, foreign, duplicate and inconsistent notification records never become a partial inbox", () => {
  const { data } = notificationSetup();
  for (const patch of [
    { userId: noticeId(55) },
    { id: "../bad" },
    { isRead: true, readAt: null },
    { isRead: false, readAt: "2026-10-24T07:00:00Z" },
    { createdAt: "bad" },
    { payload: { roadmapId: "https://evil.test" } },
    { payload: { createdCount: -1 } },
  ])
    assert.throws(() =>
      data.parseNotices([noticeRaw(), noticeRaw(2, patch)], sampleProfile.id),
    );
  assert.throws(() =>
    data.parseNotices([noticeRaw(), noticeRaw()], sampleProfile.id),
  );
  assert.throws(() => data.notificationCount({ unread: 1.5 }));
  assert.throws(() => data.notificationCount({ unread: -1 }));
});
test("notification navigation uses checked internal targets, the GUI review queue and no deleted-content links", () => {
  const { data } = notificationSetup();
  const submitted = data.parseNotice(
    noticeRaw(1, { type: "roadmap_submitted" }),
    sampleProfile.id,
  );
  assert.equal(data.noticeTarget(submitted, "developer"), undefined);
  assert.equal(
    data.noticeTarget(submitted, "admin").label,
    "Open review queue",
  );
  for (const type of [
    "article_deleted",
    "roadmap_deleted",
    "roadmap_unpublished",
  ])
    assert.doesNotMatch(
      data.noticeTarget({ ...submitted, type }, "developer").href,
      new RegExp(noticeId(90)),
    );
  assert.equal(
    data.noticeTarget({ ...submitted, type: "ai_job_failed" }, "developer")
      .href,
    "/developer/generate",
  );
  assert.equal(
    data.noticeTarget({ ...submitted, type: "future_update" }, "developer"),
    undefined,
  );
});
test("notification entry uses timed abortable account/list/count reads and no read-state mutation", async () => {
  const { api, state } = notificationApi(),
    { client } = notificationSetup({ api }),
    signal = { sample: "abort" };
  await client.loadNotifications(sampleProfile, signal);
  assert.deepEqual(
    state.calls.map((c) => c.slice(0, 2)),
    [
      ["GET", "/users/me"],
      ["GET", "/notifications"],
      ["GET", "/notifications/unread-count"],
    ],
  );
  assert.ok(
    state.calls.every((c) => c[3].timeout === 12000 && c[3].signal === signal),
  );
});
test("notification read rechecks ownership and selected content, writes once and checks saved read state", async () => {
  const { api, state } = notificationApi(),
    { client, data } = notificationSetup({ api }),
    before = notificationSnapshot(data);
  const result = await client.markNotifications(before, noticeId(1));
  assert.equal(result.inbox.items[0].isRead, true);
  assert.equal(result.marked, 1);
  assert.equal(result.inbox.unread, 0);
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  assert.equal(state.calls.at(-1)[1], "/notifications/unread-count");
});
test("stale notification details and changed accounts stop before marking read", async () => {
  for (const kind of ["target", "account", "missing"]) {
    const { api, state } = notificationApi(),
      { client, data } = notificationSetup({ api }),
      before = notificationSnapshot(data);
    if (kind === "target") state.rows[0].payload.reason = "Changed elsewhere";
    if (kind === "account") state.user.role = "admin";
    if (kind === "missing") state.rows = [];
    await assert.rejects(
      client.markNotifications(before, noticeId(1)),
      (e) => e.conflict || e.unavailable,
    );
    assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
  }
});
test("already-read notification and empty all-read request perform no repeat writes", async () => {
  const { api, state } = notificationApi([
      noticeRaw(1, { isRead: true, readAt: "2026-10-24T07:00:00Z" }),
    ]),
    { client, data } = notificationSetup({ api }),
    before = notificationSnapshot(data);
  assert.equal(
    (await client.markNotifications(before, noticeId(1))).already,
    true,
  );
  assert.equal((await client.markNotifications(before, "all")).already, true);
  assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
});
test("mark-all sends the existing account-wide endpoint once and confirms list plus unread count", async () => {
  const { api, state } = notificationApi([noticeRaw(1), noticeRaw(2)]),
    { client, data } = notificationSetup({ api }),
    result = await client.markNotifications(
      notificationSnapshot(data, state.rows),
      "all",
    );
  assert.equal(result.marked, 2);
  assert.equal(result.inbox.unread, 0);
  assert.ok(result.inbox.items.every((n) => n.isRead));
  assert.deepEqual(
    state.calls.filter((c) => c[0] === "POST").map((c) => c.slice(0, 3)),
    [["POST", "/notifications/read-all", undefined]],
  );
});
test("malformed notification acknowledgements and readback failures pause writes without leaking raw errors", async () => {
  for (const kind of ["one-ack", "all-ack", "readback"]) {
    const { api, state } = notificationApi(),
      patch = api.patch,
      post = api.post,
      get = api.get;
    api.patch = async (...args) => {
      const result = await patch(...args);
      return kind === "one-ack"
        ? { data: { private: "private-response" } }
        : result;
    };
    api.post = async (...args) => {
      await post(...args);
      return { data: { marked: -1 } };
    };
    api.get = async (...args) => {
      if (kind === "readback" && state.calls.some((c) => c[0] === "PATCH"))
        throw {
          response: { status: 503 },
          config: { data: "private-request" },
        };
      return get(...args);
    };
    const { client, data } = notificationSetup({ api });
    await assert.rejects(
      client.markNotifications(
        notificationSnapshot(data),
        kind === "all-ack" ? "all" : noticeId(1),
      ),
      (e) => {
        assert.equal(e.uncertain, true);
        assert.doesNotMatch(JSON.stringify(e) + e.message, /private-/);
        return true;
      },
    );
    assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 1);
  }
});
test("a new unread arrival after mark-all never produces a false all-read confirmation", async () => {
  const { api, state } = notificationApi(),
    post = api.post;
  api.post = async (...args) => {
    const result = await post(...args);
    state.rows.push(noticeRaw(2));
    return result;
  };
  const { client, data } = notificationSetup({ api });
  await assert.rejects(
    client.markNotifications(notificationSnapshot(data), "all"),
    (e) => e.uncertain,
  );
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 1);
});
test("notification refusals and uncertain transport errors are fixed safe failures", async () => {
  for (const status of [400, 404, 408, 503, undefined]) {
    const { api } = notificationApi();
    api.patch = async () => {
      throw {
        response: { status, data: { message: "private-message" } },
        config: { data: "private-payload" },
      };
    };
    const { client, data } = notificationSetup({ api });
    await assert.rejects(
      client.markNotifications(notificationSnapshot(data), noticeId(1)),
      (e) => {
        assert.equal(e.uncertain, status !== 400 && status !== 404);
        assert.doesNotMatch(JSON.stringify(e) + e.message, /private-/);
        return true;
      },
    );
  }
});
test("notification session changes across reads and writes prevent cache confirmation for the old account", async () => {
  for (const stage of ["GET", "PATCH"]) {
    let token = "notice-session";
    const { api, state } = notificationApi(),
      original = stage === "GET" ? api.get : api.patch;
    api[stage === "GET" ? "get" : "patch"] = async (...args) => {
      const result = await original(...args);
      token = "new-session";
      return result;
    };
    const { client, data } = notificationSetup({ api, authToken: () => token });
    await assert.rejects(
      client.markNotifications(notificationSnapshot(data), noticeId(1)),
      (e) => e.unavailable,
    );
    assert.equal(
      state.calls.filter((c) => c[0] === "PATCH").length,
      stage === "GET" ? 0 : 1,
    );
  }
});
function notificationControllerSetup(api, options = {}) {
  const state = profileHookState(),
    setup = notificationSetup({
      api,
      hooks: state.hooks,
      ...options,
      queries: {
        [`notifications/inbox/${sampleProfile.id}/${sampleProfile.role}`]: {
          data: notificationSnapshot(notificationSetup().data),
          isFetching: false,
          isPending: false,
          isError: false,
        },
        ...options.queries,
      },
    }),
    Controller = setup.h.load(
      new URL("../notifications/gui-notifications.tsx", import.meta.url),
    ).BoundNotifications;
  return {
    ...setup,
    ...state,
    render() {
      state.reset();
      return Controller({ user: sampleProfile }).props;
    },
  };
}
test("notification controller loads only count before opening and never polls or writes on entry", () => {
  const setup = notificationControllerSetup(undefined, {
    queries: {
      [`notifications/inbox/${sampleProfile.id}/${sampleProfile.role}`]: {
        isPending: true,
        isFetching: false,
        isError: false,
      },
    },
  });
  setup.render();
  assert.equal(setup.h.queryCalls[0].enabled, false);
  assert.equal(setup.h.queryCalls[0].retry, false);
  assert.equal(setup.h.queryCalls[0].refetchOnWindowFocus, false);
  assert.equal(setup.h.queryCalls[0].staleTime, Infinity);
  assert.equal(setup.h.queryCalls[1].enabled, true);
  setup.render().onOpen();
  setup.render();
  assert.equal(setup.h.queryCalls.at(-2).enabled, true);
  assert.equal(setup.h.calls.filter((c) => c[0] === "mutation").length, 0);
});
test("notification controller guards duplicate clicks, adopts checked results and keeps writes out of mutation cache", async () => {
  const { api, state } = notificationApi(),
    patch = api.patch;
  let release;
  api.patch = async (...args) => {
    await new Promise((resolve) => (release = resolve));
    return patch(...args);
  };
  const setup = notificationControllerSetup(api),
    props = setup.render();
  props.onRead(noticeId(1));
  props.onReadAll();
  await new Promise(setImmediate);
  release();
  await new Promise(setImmediate);
  assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 1);
  assert.match(setup.render().notice, /marked as read and checked/);
  assert.equal(setup.h.calls.filter((c) => c[0] === "mutation").length, 0);
});
test("uncertain notification outcome stays locked through failed checks and requires explicit successful review", async () => {
  const { api } = notificationApi(),
    get = api.get;
  let fail = false;
  api.patch = async () => {
    throw { response: { status: 408 } };
  };
  api.get = async (...args) => {
    if (fail) throw { response: { status: 503 } };
    return get(...args);
  };
  const setup = notificationControllerSetup(api);
  setup.render().onRead(noticeId(1));
  await new Promise(setImmediate);
  assert.equal(setup.render().locked, true);
  fail = true;
  setup.render().onCheck();
  await new Promise(setImmediate);
  assert.equal(setup.render().review, undefined);
  assert.equal(setup.render().locked, true);
  fail = false;
  setup.render().onCheck();
  await new Promise(setImmediate);
  assert.ok(setup.render().review);
  assert.equal(setup.render().locked, true);
  setup.render().onResume();
  assert.equal(setup.render().locked, false);
  assert.equal(setup.render().earlierRequest, true);
});
test("notification actions after an account-token change send no request and hide old inbox data", async () => {
  let token = "notice-session";
  const { api, state } = notificationApi(),
    setup = notificationControllerSetup(api, { authToken: () => token }),
    props = setup.render();
  token = "new-session";
  props.onRead(noticeId(1));
  await new Promise(setImmediate);
  assert.equal(state.calls.length, 0);
  assert.equal(setup.render().unavailable, true);
  assert.equal(setup.render().inbox, undefined);
});
test("notification view distinguishes history, reason details, safe text, filters and explicit read actions", () => {
  const { h, data, view } = notificationSetup(),
    inbox = notificationSnapshot(data, [
      noticeRaw(1, {
        payload: {
          reason: "<script>unsafe() </script>",
          roadmapTitle: "Literal <b>title</b>",
        },
      }),
    ]),
    html = h.render(
      createElement(view.NotificationsView, {
        open: true,
        inbox,
        count: 1,
        onOpen() {},
        onClose() {},
        onRead() {},
        onReadAll() {},
        onCheck() {},
        onResume() {},
      }),
    );
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /Opening this inbox keeps everything unread/);
  assert.match(html, /Notification type/);
  assert.match(html, /Unread only/);
  assert.match(html, /View details/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|<b>title/);
  assert.match(html, /Mark as read/);
  assert.match(html, /Open in CLI/);
});
test("notification mark-all confirmation states full-account scope and cancels without a write", () => {
  const state = profileHookState(),
    { view, data } = notificationSetup({ hooks: state.hooks }),
    calls = [],
    props = {
      open: true,
      inbox: notificationSnapshot(data),
      count: 1,
      onOpen() {},
      onClose() {
        calls.push("close");
      },
      onRead() {
        calls.push("one");
      },
      onReadAll() {
        calls.push("all");
      },
      onCheck() {},
      onResume() {},
    };
  const render = () => {
    state.reset();
    return view.NotificationsView(props);
  };
  let tree = render();
  walk(
    tree,
    (n) => n.type === "button" && n.props.children?.includes?.("Mark all read"),
  )[0].props.onClick();
  tree = render();
  assert.ok(
    walk(tree, (n) => n.props?.id === "notifications-confirm-title").length,
  );
  assert.equal(calls.length, 0);
  walk(
    tree,
    (n) => n.type === "button" && n.props.children === "Keep unread",
  )[0].props.onClick();
  assert.equal(calls.length, 0);
  assert.equal(
    walk(render(), (n) => n.props?.id === "notifications-confirm-title").length,
    0,
  );
});
test("GUI workspace composes shared inbox while terminal chrome and command sources remain unchanged", () => {
  const { h } = notificationSetup(),
    tree = h.shell.GuiWorkspaceShell;
  const html = h.render(
    createElement(tree, { user: sampleProfile }, "Sample workspace"),
  );
  assert.match(html, /aria-label="Notifications"/);
  assert.doesNotMatch(html, /Notifications — opens in CLI/);
});

test("future notification type names cannot resolve inherited object properties as labels", () => {
  const { data } = notificationSetup();
  for (const type of ["constructor", "toString", "__proto__"])
    assert.equal(
      data.noticeLabel(
        data.parseNotice(noticeRaw(1, { type }), sampleProfile.id),
      ),
      "Account update",
    );
});

test("notification CLI handoff follows the workspace view even when the account is an admin", () => {
  const { h, data, view } = notificationSetup();
  const inbox = {
    ...notificationSnapshot(data),
    user: { ...sampleProfile, role: "admin" },
  };
  const props = {
    open: true,
    inbox,
    onOpen() {},
    onClose() {},
    onRead() {},
    onReadAll() {},
    onCheck() {},
    onResume() {},
  };
  const developer = h.render(createElement(view.NotificationsView, props));
  assert.match(developer, /href="\/developer\/terminal\?view=notify"/);
  assert.doesNotMatch(developer, /href="\/admin\/terminal/);
  const admin = h.render(
    createElement(view.NotificationsView, { ...props, shell: "admin" }),
  );
  assert.match(admin, /href="\/admin\/terminal\?view=notify"/);
});

const adminActor = { ...sampleProfile, role: "admin" };
const adminOverview = {
  totalDevelopers: 12,
  totalAdmins: 2,
  totalRoadmaps: 5,
  totalModules: 15,
  totalConcepts: 42,
  totalConceptCompletions: 89,
  activeDevelopers: 7,
  totalXpAwarded: 1020,
};
function adminQueueRaw(i = 1, patch = {}) {
  return {
    id: noticeId(i),
    title: `Review lesson ${i}`,
    createdAt: `2026-10-${String(20 + i).padStart(2, "0")}T06:00:00Z`,
    reviewStatus: "pending",
    draftContent: null,
    content: "private-lesson-body",
    author: {
      id: noticeId(80),
      name: "Sample author",
      email: "private-email",
      passwordHash: "private-hash",
    },
    placements: [
      {
        roadmapTitle: "Networking",
        moduleTitle: "Getting started",
        roadmap: { passwordHash: "private-hash" },
      },
    ],
    questions: [
      { questionText: "private-question", options: [{ isCorrect: true }] },
    ],
    ...patch,
  };
}
const adminRoadmap = {
  roadmapId: noticeId(60),
  title: "Networking",
  totalConcepts: 6,
  totalEnrolledDevelopers: 5,
  averageCompletionPercentage: 33.33,
  totalCompletedConcepts: 10,
};
const adminDeveloper = {
  developerId: noticeId(61),
  name: "Mira Patel",
  email: "private-email",
  conceptsAuthored: 12,
  roadmapsCreated: 2,
  questionsAnswered: 4,
  mcqQuestionsCreated: 9,
};
const adminConcept = {
  conceptId: noticeId(62),
  title: "Routing",
  difficulty: "medium",
  completionCount: 3,
  startedButNotCompletedCount: 2,
};
function adminSetup(options = {}) {
  const h = roadmapHarness({
    authUser: adminActor,
    authToken: "admin-session",
    ...options,
  });
  return {
    h,
    data: h.load(
      new URL("../admin-dashboard/admin-dashboard-data.ts", import.meta.url),
    ),
    client: h.load(
      new URL("../admin-dashboard/admin-dashboard-client.ts", import.meta.url),
    ),
    view: h.load(
      new URL("../admin-dashboard/admin-dashboard-view.tsx", import.meta.url),
    ),
  };
}
function adminApi() {
  const state = {
    user: { ...adminActor },
    calls: [],
    rows: {
      overview: adminOverview,
      queue: [adminQueueRaw()],
      roadmaps: [adminRoadmap],
      developers: [adminDeveloper],
      concepts: [adminConcept],
    },
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, options]);
      if (path === "/users/me") return { data: state.user };
      if (path === "/notifications") return { data: [] };
      if (path === "/notifications/unread-count")
        return { data: { unread: 0 } };
      const key =
        path === "/admin/content-review/pending"
          ? "queue"
          : path.split("/").at(-1);
      if (!(key in state.rows)) throw new Error("Unexpected admin request");
      return { data: structuredClone(state.rows[key]) };
    },
    async post() {
      throw new Error("No admin dashboard writes");
    },
    async patch() {
      throw new Error("No admin dashboard writes");
    },
  };
  return { api, state };
}
test("admin queue projection retains only metadata, including empty staged drafts, and sorts by creation rather than inventing submission dates", () => {
  const { data } = adminSetup(),
    rows = data.parseAdminSection("queue", [
      adminQueueRaw(2),
      adminQueueRaw(1, { reviewStatus: "approved", draftContent: "" }),
    ]);
  assert.equal(rows[1].hasDraft, true);
  assert.equal(data.oldestQueue(rows)[0].id, noticeId(1));
  assert.doesNotMatch(
    JSON.stringify(rows),
    /private-|draftContent|questions|options|isCorrect|submittedAt/,
  );
  assert.equal(
    data.parseAdminSection("developers", [adminDeveloper])[0].email,
    undefined,
  );
});
test("admin parsers reject negative, missing, duplicate and malformed metrics instead of substituting zeros", () => {
  const { data } = adminSetup();
  for (const raw of [
    { ...adminOverview, totalDevelopers: -1 },
    { ...adminOverview, totalXpAwarded: undefined },
    { ...adminOverview, totalModules: 1.5 },
  ])
    assert.throws(() => data.parseAdminSection("overview", raw));
  for (const raw of [
    [{ ...adminRoadmap, averageCompletionPercentage: 101 }],
    [adminRoadmap, adminRoadmap],
    [{ ...adminRoadmap, roadmapId: "../bad" }],
  ])
    assert.throws(() => data.parseAdminSection("roadmaps", raw));
  for (const patch of [
    { reviewStatus: "approved", draftContent: null },
    { createdAt: "bad" },
    { placements: null },
    { draftContent: { body: "bad" } },
  ])
    assert.throws(() =>
      data.parseAdminSection("queue", [adminQueueRaw(1, patch)]),
    );
  assert.equal(
    data.parseAdminSection(
      "overview",
      Object.fromEntries(Object.keys(adminOverview).map((k) => [k, 0])),
    ).totalDevelopers,
    0,
  );
});
test("admin rankings use API totals without mutating responses or fabricating trend data", () => {
  const { data } = adminSetup(),
    rows = [
      adminRoadmap,
      {
        ...adminRoadmap,
        roadmapId: noticeId(63),
        title: "Other",
        totalEnrolledDevelopers: 9,
      },
    ];
  assert.equal(data.rankedRoadmaps(rows)[0].title, "Other");
  assert.equal(rows[0].title, "Networking");
  assert.equal(
    data.rankedDevelopers([
      adminDeveloper,
      { ...adminDeveloper, developerId: noticeId(64), conceptsAuthored: 13 },
    ])[0].conceptsAuthored,
    13,
  );
  assert.equal(
    data.rankedConcepts([
      adminConcept,
      { ...adminConcept, conceptId: noticeId(65), completionCount: 5 },
    ])[0].completionCount,
    5,
  );
});
test("admin section reads are timed, abortable and bracketed by fresh matching admin-account checks", async () => {
  const { api, state } = adminApi(),
    { client } = adminSetup({ api }),
    signal = { sample: "abort" },
    result = await client.loadAdminSection(
      adminActor,
      "overview",
      signal,
      "admin-session",
    );
  assert.equal(result.value.totalDevelopers, 12);
  assert.deepEqual(
    state.calls.map((c) => c[1]),
    ["/users/me", "/admin/analytics/overview", "/users/me"],
  );
  assert.ok(
    state.calls.every((c) => c[2].timeout === 12000 && c[2].signal === signal),
  );
  assert.ok(Number.isFinite(Date.parse(result.checkedAt)));
});
test("non-admin or changed account cannot start an admin resource read", async () => {
  for (const patch of [{ role: "developer" }, { id: noticeId(99) }]) {
    const { api, state } = adminApi();
    Object.assign(state.user, patch);
    const { client } = adminSetup({ api });
    await assert.rejects(
      client.loadAdminSection(adminActor, "queue", undefined, "admin-session"),
      (e) => e.unavailable,
    );
    assert.deepEqual(
      state.calls.map((c) => c[1]),
      ["/users/me"],
    );
  }
});
test("a lost admin role after a response prevents private section data entering query cache", async () => {
  const { api, state } = adminApi(),
    get = api.get;
  api.get = async (...args) => {
    const result = await get(...args);
    if (args[0] === "/admin/analytics/developers")
      state.user.role = "developer";
    return result;
  };
  const { client } = adminSetup({ api });
  await assert.rejects(
    client.loadAdminSection(
      adminActor,
      "developers",
      undefined,
      "admin-session",
    ),
    (e) => e.unavailable,
  );
});
test("admin read failures retain only fixed safe error copy and distinguish denial", async () => {
  for (const status of [403, 503]) {
    const { api } = adminApi(),
      get = api.get;
    api.get = async (...args) => {
      if (args[0] === "/admin/analytics/overview")
        throw {
          response: { status, data: { message: "private-server-message" } },
          config: { data: "private-request" },
        };
      return get(...args);
    };
    const { client } = adminSetup({ api });
    await assert.rejects(
      client.loadAdminSection(
        adminActor,
        "overview",
        undefined,
        "admin-session",
      ),
      (e) => {
        assert.equal(e.unavailable, status === 403);
        assert.doesNotMatch(JSON.stringify(e) + e.message, /private-/);
        return true;
      },
    );
  }
});
test("malformed admin data stays unavailable and no read path performs a write", async () => {
  const { api, state } = adminApi();
  state.rows.roadmaps = [
    { ...adminRoadmap, averageCompletionPercentage: "30" },
  ];
  const { client } = adminSetup({ api });
  await assert.rejects(
    client.loadAdminSection(adminActor, "roadmaps", undefined, "admin-session"),
    (e) => !e.unavailable,
  );
  assert.ok(state.calls.every((c) => c[0] === "GET"));
});
test("admin token changes before or during a request reject results for the previous session", async () => {
  for (const stage of ["before", "during"]) {
    let token = stage === "before" ? "new-session" : "admin-session";
    const { api, state } = adminApi(),
      get = api.get;
    api.get = async (...args) => {
      const result = await get(...args);
      if (args[0].startsWith("/admin/")) token = "new-session";
      return result;
    };
    const { client } = adminSetup({ api, authToken: () => token });
    await assert.rejects(
      client.loadAdminSection(
        adminActor,
        "overview",
        undefined,
        "admin-session",
      ),
      (e) => e.unavailable,
    );
    if (stage === "before") assert.equal(state.calls.length, 0);
  }
});
test("admin notification activity reuses the recipient inbox contract without marking items read", async () => {
  const { api, state } = adminApi(),
    { client } = adminSetup({ api }),
    feed = await client.loadAdminFeed(adminActor, undefined, "admin-session");
  assert.equal(feed.user.id, adminActor.id);
  assert.equal(feed.unread, 0);
  assert.ok(state.calls.every((c) => c[0] === "GET"));
  assert.ok(state.calls.some((c) => c[1] === "/notifications"));
});
function adminViewProps(data) {
  const make = (value) => ({
    data: value,
    pending: false,
    checkedAt: "2026-10-27T06:00:00Z",
  });
  return {
    user: adminActor,
    overview: make(adminOverview),
    queue: make(data.parseAdminSection("queue", [adminQueueRaw()])),
    roadmaps: make([adminRoadmap]),
    developers: make(data.parseAdminSection("developers", [adminDeveloper])),
    concepts: make([adminConcept]),
    feed: make({
      user: adminActor,
      items: [],
      unread: 0,
      checkedAt: "2026-10-27T06:00:00Z",
    }),
    onRefresh() {},
  };
}
test("admin overview describes actual metric scope and labels unfinished destinations honestly", () => {
  const { h, data, view } = adminSetup(),
    html = h.render(
      createElement(view.AdminDashboardView, adminViewProps(data)),
    );
  assert.match(html, /recorded progress/);
  assert.match(html, /Submission dates aren’t reported/);
  assert.match(html, /not a platform audit log/);
  assert.doesNotMatch(html, /Classic/);
  assert.match(html, /Review this lesson in CLI/);
  assert.match(html, /33.33%/);
  assert.doesNotMatch(
    html,
    /private-|Approve lesson|Reject lesson|Delete user|growth|trend/,
  );
});
test("admin unavailable and pending sections never render fabricated empty success or cached metric values", () => {
  const { h, data, view } = adminSetup(),
    props = adminViewProps(data);
  const html = h.render(
    createElement(view.AdminDashboardView, {
      ...props,
      overview: { pending: false, error: "Could not check" },
      queue: { pending: true },
      roadmaps: { pending: false, error: "Could not check" },
    }),
  );
  assert.match(html, /Platform totals unavailable/);
  assert.match(html, /Checking review queue/);
  assert.doesNotMatch(
    html,
    /33.33%|No lessons are waiting|Dashboard refreshed/,
  );
  const empty = h.render(
    createElement(view.AdminDashboardView, {
      ...props,
      queue: { data: [], pending: false },
    }),
  );
  assert.match(empty, /No lessons are waiting/);
});
test("admin queue filters distinguish staged revisions without sending API actions", () => {
  const state = profileHookState(),
    { h, data, view } = adminSetup({ hooks: state.hooks }),
    props = adminViewProps(data);
  props.queue.data = data.parseAdminSection("queue", [
    adminQueueRaw(1),
    adminQueueRaw(2, {
      title: "Staged revision title",
      reviewStatus: "approved",
      draftContent: "",
    }),
  ]);
  const render = () => {
    state.reset();
    return view.AdminDashboardView(props);
  };
  let tree = render();
  walk(tree, (n) => n.type === "select")[0].props.onChange({
    target: { value: "drafts" },
  });
  tree = render();
  const list = walk(tree, (n) => n.type === "ol")[0];
  assert.equal(list.props.children.length, 1);
  assert.match(h.render(list), /Staged revision title/);
  assert.equal(h.calls.filter((c) => c[0] === "mutation").length, 0);
});
function adminControllerSetup(options = {}) {
  const state = profileHookState(),
    setup = adminSetup({ hooks: state.hooks, ...options });
  const props = adminViewProps(setup.data),
    queries = {
      [`admin/dashboard/account/${adminActor.id}/admin`]: {
        data: adminActor,
        isFetching: false,
        isPending: false,
        isError: false,
        refetch: async () => ({ isError: false }),
      },
    };
  for (const kind of [
    "overview",
    "queue",
    "roadmaps",
    "concepts",
    "developers",
  ])
    queries[`admin/dashboard/${kind}/${adminActor.id}/admin`] = {
      data: { value: props[kind].data, checkedAt: props[kind].checkedAt },
      isFetching: false,
      isPending: false,
      isError: false,
      refetch: async () => ({ isError: false }),
    };
  queries[`notifications/inbox/${adminActor.id}/admin`] = {
    data: props.feed.data,
    isFetching: false,
    isPending: false,
    isError: false,
    refetch: async () => ({ isError: false }),
  };
  const complete = adminSetup({
      hooks: state.hooks,
      queries: { ...queries, ...options.queries },
      ...Object.fromEntries(
        Object.entries(options).filter(([key]) => key !== "queries"),
      ),
    }),
    Controller = complete.h.load(
      new URL("../admin-dashboard/gui-admin-dashboard.tsx", import.meta.url),
    ).GuiAdminDashboard;
  return {
    ...complete,
    ...state,
    queries,
    render() {
      state.reset();
      return Controller();
    },
  };
}
test("admin controller gates all sections behind a fresh account check and scopes cache keys to that actor", () => {
  const actorKey = `admin/dashboard/account/${adminActor.id}/admin`,
    setup = adminControllerSetup({
      queries: {
        [actorKey]: {
          data: adminActor,
          isFetching: true,
          isPending: false,
          isError: false,
        },
      },
    });
  const tree = setup.render();
  assert.equal(
    walk(tree, (n) => n.type?.name === "AdminDashboardView").length,
    0,
  );
  assert.ok(setup.h.queryCalls.slice(1).every((q) => q.enabled === false));
  assert.equal(setup.h.queryCalls[0].refetchOnMount, "always");
  const ready = adminControllerSetup();
  ready.render();
  assert.ok(
    ready.h.queryCalls
      .slice(1)
      .every((q) => q.queryKey.includes(adminActor.id)),
  );
  assert.equal(
    ready.h.queryCalls[6].queryKey.join("/"),
    `notifications/inbox/${adminActor.id}/admin`,
  );
});
test("admin refresh synchronously blocks duplicate requests and reports partial failures", async () => {
  let releases = [],
    calls = 0;
  const setup = adminControllerSetup({
    queries: {
      [`admin/dashboard/overview/${adminActor.id}/admin`]: {
        data: { value: adminOverview, checkedAt: "2026-10-27T06:00:00Z" },
        isFetching: false,
        isPending: false,
        isError: false,
        refetch: async () => {
          calls++;
          await new Promise((resolve) => releases.push(resolve));
          return { isError: true };
        },
      },
    },
  });
  const tree = setup.render(),
    props = walk(tree, (n) => n.type?.name === "AdminDashboardView")[0].props;
  props.onRefresh("overview");
  props.onRefresh("overview");
  assert.equal(calls, 1);
  releases[0]();
  await new Promise(setImmediate);
  const next = walk(
    setup.render(),
    (n) => n.type?.name === "AdminDashboardView",
  )[0].props;
  assert.match(next.notice, /Some sections/);
  assert.equal(next.refreshing, false);
});
test("an admin section denial hides all cached private dashboard fields", () => {
  let failure;
  const key = `admin/dashboard/developers/${adminActor.id}/admin`;
  const blocked = {
    isFetching: false,
    isPending: false,
    isError: true,
    get error() {
      return failure;
    },
  };
  const setup = adminControllerSetup({ queries: { [key]: blocked } });
  failure = new setup.client.AdminDashboardFailure("Denied", true);
  const tree = setup.render();
  assert.equal(tree.props.user, undefined);
  assert.equal(
    walk(tree, (n) => n.type?.name === "AdminDashboardView").length,
    0,
  );
  const html = setup.h.render(tree);
  assert.match(html, /Admin access needs checking/);
  assert.doesNotMatch(html, /Routing|Networking|Sample author|1,020/);
});
test("admin shell uses explicit admin routes while admins in developer view keep developer navigation", () => {
  const { h } = adminSetup({ pathname: "/admin/dashboard" }),
    admin = h.render(
      createElement(
        h.shell.GuiWorkspaceShell,
        { user: adminActor, shell: "admin" },
        "Admin sample",
      ),
    ),
    developer = h.render(
      createElement(
        h.shell.GuiWorkspaceShell,
        { user: adminActor },
        "Developer sample",
      ),
    );
  assert.match(admin, /aria-label="Admin navigation"/);
  assert.match(admin, /href="\/admin\/terminal"/);
  assert.match(admin, /Developer view/);
  assert.match(admin, /href="\/admin\/users"/);
  assert.match(developer, /aria-label="Workspace navigation"/);
  assert.match(developer, /href="\/developer\/terminal"/);
});
test("admin shell and dashboard CLI links set mode without changing saved learning location", () => {
  const hooks = {
      useState: (initial) => [
        typeof initial === "function" ? initial() : initial,
        () => {},
      ],
      useEffect() {},
      useRef: (value) => ({ current: value }),
    },
    { h, data, view } = adminSetup({ hooks, pathname: "/admin/dashboard" });
  let tree = h.shell.GuiWorkspaceShell({
    user: adminActor,
    shell: "admin",
    children: "Sample",
  });
  walk(
    tree,
    (n) => n.props?.href === "/admin/terminal?view=articles",
  )[0].props.onClick();
  tree = view.AdminDashboardView(adminViewProps(data));
  walk(tree, (n) =>
    n.props?.href?.includes("view=review&ref="),
  )[0].props.onClick();
  assert.ok(h.calls.every((c) => c[0] === "mode"));
  assert.ok(h.calls.every((c) => c[1] === "cli" && c[2].navigate === false));
});
test("classic admin appearance starts no GUI dashboard queries and returns to GUI on the same route", () => {
  const { h } = adminSetup({
      mode: { ready: true, isCli: true, location: { kind: "root" } },
    }),
    Page = h.load(
      new URL("../admin-dashboard/gui-admin-dashboard.tsx", import.meta.url),
    ).AdminDashboardPage,
    tree = Page();
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.equal(h.queryCalls.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["mode", "gui", { navigate: false }],
  ]);
});

// Checkpoint 25: directory and irreversible user-management contracts.
function usersRaw(i = 71, patch = {}) {
  return {
    id: noticeId(i),
    name: i === 71 ? "Nora Chen" : "Jordan Lee",
    email: `learner${i}@example.test`,
    role: "developer",
    createdAt: "2026-10-02T00:00:00Z",
    passwordHash: "discard-hash",
    authProviderId: "discard-provider",
    preferences: { lastLocation: "discard-location" },
    ...patch,
  };
}
function requestRaw(patch = {}) {
  return {
    id: noticeId(75),
    userId: noticeId(71),
    user: usersRaw(),
    reason: "I no longer need this account. <script>private</script>",
    status: "pending",
    createdAt: "2026-10-20T08:00:00Z",
    reviewedAt: null,
    reviewedByAdminId: null,
    reviewedByAdmin: null,
    ...patch,
  };
}
function usersSetup(options = {}) {
  const h = roadmapHarness({
    authUser: adminActor,
    authToken: "users-session",
    ...options,
  });
  return {
    h,
    data: h.load(
      new URL("../admin-users/admin-users-data.ts", import.meta.url),
    ),
    client: h.load(
      new URL("../admin-users/admin-users-client.ts", import.meta.url),
    ),
    view: h.load(
      new URL("../admin-users/admin-users-view.tsx", import.meta.url),
    ),
  };
}
function usersApi() {
  const state = {
    actor: { ...adminActor },
    users: [
      usersRaw(),
      usersRaw(72),
      { ...adminActor, createdAt: "2026-10-01T00:00:00Z" },
    ],
    requests: [requestRaw()],
    calls: [],
    afterWrite: false,
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, options]);
      if (state.failRead && state.afterWrite)
        throw { response: { status: 503, data: { message: "discard-raw" } } };
      return {
        data: structuredClone(
          path === "/users/me"
            ? state.actor
            : path === "/users"
              ? state.users
              : path === "/users/deletion-requests"
                ? state.requests
                : assert.fail(`Unexpected ${path}`),
        ),
      };
    },
    async delete(path, options) {
      state.calls.push(["DELETE", path, options]);
      state.afterWrite = true;
      if (state.writeError) throw state.writeError;
      const uid = path.split("/").at(-1);
      state.users = state.users.filter((u) => u.id !== uid);
      state.requests = state.requests.filter((r) => r.userId !== uid);
      return {
        data: state.badAck ?? { success: true, message: "discard-raw-message" },
      };
    },
    async patch(path, body, options) {
      state.calls.push(["PATCH", path, body, options]);
      state.afterWrite = true;
      const kind = path.split("/").at(-1),
        rid = path.split("/").at(-2),
        r = state.requests.find((r) => r.id === rid);
      if (state.writeError) {
        if (state.partialApproval)
          Object.assign(r, {
            status: "approved",
            reviewedAt: "2026-10-27T06:00:00Z",
            reviewedByAdminId: adminActor.id,
          });
        throw state.writeError;
      }
      if (kind === "approve") {
        state.users = state.users.filter((u) => u.id !== r.userId);
        state.requests = state.requests.filter((q) => q.userId !== r.userId);
        return { data: state.badAck ?? { success: true } };
      }
      Object.assign(r, {
        status: "rejected",
        reviewedAt: "2026-10-27T06:00:00Z",
        reviewedByAdminId: adminActor.id,
        reviewedByAdmin: { id: adminActor.id, name: adminActor.name },
      });
      return { data: state.badAck ?? structuredClone(r) };
    },
  };
  return { state, api };
}
function usersLibrary(setup, state) {
  return {
    user: adminActor,
    users: setup.data.parseDirectory(state.users),
    requests: setup.data.parseRequests(state.requests),
    checkedAt: "2026-10-27T06:00:00Z",
  };
}
function usersAction(library, kind = "delete") {
  return kind === "delete"
    ? { kind, target: library.users[0] }
    : { kind, target: library.users[0], request: library.requests[0] };
}
function usersViewProps(library, patch = {}) {
  return { library, onAction() {}, onCheck() {}, onAdopt() {}, ...patch };
}
test("users directory projection drops secrets, preferences and non-displayed relations", () => {
  const { data } = usersSetup(),
    users = data.parseDirectory([usersRaw()]),
    requests = data.parseRequests([requestRaw()]);
  assert.equal(users[0].createdAt, "2026-10-02T00:00:00.000Z");
  assert.equal(requests[0].user.email, users[0].email);
  assert.doesNotMatch(
    JSON.stringify({ users, requests }),
    /discard-hash|discard-provider|discard-location|passwordHash|preferences/,
  );
});
test("users projections reject duplicate, malformed and mismatched account/request identities", () => {
  const { data } = usersSetup();
  for (const raw of [
    [usersRaw(), usersRaw()],
    [usersRaw(71, { email: "unknown" })],
    [usersRaw(71, { role: "instructor" })],
    [usersRaw(71, { createdAt: "invalid" })],
  ])
    assert.throws(() => data.parseDirectory(raw));
  for (const raw of [
    [requestRaw(), requestRaw()],
    [requestRaw({ userId: noticeId(72) })],
    [requestRaw({ status: "pending", reviewedAt: "2026-10-22T00:00:00Z" })],
    [requestRaw({ reason: { private: true } })],
    [requestRaw({ status: "rejected" })],
  ])
    assert.throws(() => data.parseRequests(raw));
  assert.equal(data.parseRequests([requestRaw({ user: null })])[0].user, null);
});
test("users search, role, sorting and request status filters are local and nonmutating", () => {
  const { data } = usersSetup(),
    raw = [usersRaw(), usersRaw(72, { name: "Ari Vale" })],
    rows = data.parseDirectory(raw),
    order = rows.map((r) => r.id).join();
  assert.equal(
    data.filterDirectory(rows, " LEARNER71@EXAMPLE.TEST ", "all", "name")
      .length,
    1,
  );
  assert.equal(data.filterDirectory(rows, "", "admin", "name").length, 0);
  assert.equal(
    data.filterDirectory(rows, "", "all", "name")[0].name,
    "Ari Vale",
  );
  assert.equal(rows.map((r) => r.id).join(), order);
  assert.equal(
    data.filterRequests(data.parseRequests([requestRaw()]), "rejected").length,
    0,
  );
});
test("users library reads are timed, abortable and bracketed by fresh matching admin checks", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    signal = new AbortController().signal;
  const library = await setup.client.loadUsersLibrary(adminActor, signal);
  assert.equal(library.users.length, 3);
  assert.equal(
    state.calls.map((c) => c[1]).join(),
    "/users/me,/users,/users/deletion-requests,/users/me",
  );
  for (const c of state.calls) {
    assert.equal(c[2].timeout, 12000);
    assert.equal(c[2].signal, signal);
  }
  assert.ok(state.calls.every((c) => c[0] === "GET"));
});
test("users library refuses non-admin and changed sessions before exposing lists", async () => {
  const { api, state } = usersApi();
  state.actor.role = "developer";
  const setup = usersSetup({ api });
  await assert.rejects(
    setup.client.loadUsersLibrary(adminActor),
    (e) => e.unavailable === true,
  );
  assert.equal(state.calls.length, 1);
  let token = "users-session";
  const next = usersSetup({ api, authToken: () => token });
  token = "new-session";
  await assert.rejects(
    next.client.loadUsersLibrary(adminActor, undefined, "users-session"),
    (e) => e.unavailable === true,
  );
  assert.equal(state.calls.length, 1);
});
test("users direct deletion preflights identity, sends one DELETE and confirms directory/request absence", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state);
  const saved = await setup.client.performUsersAction(
    before,
    usersAction(before),
  );
  assert.equal(
    saved.users.some((u) => u.id === before.users[0].id),
    false,
  );
  assert.equal(saved.requests.length, 0);
  const writes = state.calls.filter((c) => c[0] !== "GET");
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1], `/users/${before.users[0].id}`);
  assert.equal(writes[0][2].timeout, 12000);
  assert.equal(state.calls.at(-1)[1], "/users/me");
});
test("users approval acknowledges cascade removal instead of requiring a retained approved request", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state);
  const saved = await setup.client.performUsersAction(
    before,
    usersAction(before, "approve"),
  );
  assert.equal(saved.requests.length, 0);
  assert.equal(saved.users.length, 2);
  const write = state.calls.find((c) => c[0] === "PATCH");
  assert.equal(
    write[1],
    `/users/deletion-requests/${before.requests[0].id}/approve`,
  );
  assert.equal(write[3].timeout, 12000);
});
test("users rejection requires matching saved reviewer/date/reason and preserves the account", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state);
  const saved = await setup.client.performUsersAction(
    before,
    usersAction(before, "reject"),
  );
  assert.equal(saved.requests[0].status, "rejected");
  assert.equal(saved.requests[0].reviewedByAdminId, adminActor.id);
  assert.equal(saved.users.length, 3);
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
});
test("users protected, missing, changed or mismatched targets stop before every write", async () => {
  for (const change of [
    (s) => (s.users[0].name = "Changed name"),
    (s) => (s.users[0].role = "admin"),
    (s) => s.users.shift(),
    (s) => (s.requests[0].reason = "Changed reason"),
    (s) => (s.requests[0].user.email = "foreign@example.test"),
  ]) {
    const { api, state } = usersApi(),
      setup = usersSetup({ api }),
      before = usersLibrary(setup, state);
    change(state);
    await assert.rejects(
      setup.client.performUsersAction(before, usersAction(before, "approve")),
    );
    assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
  }
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state);
  await assert.rejects(
    setup.client.performUsersAction(before, {
      kind: "delete",
      target: before.users[2],
    }),
  );
  assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
});
test("users changed admin role after reads prevents a mutation", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state),
    get = api.get;
  let actorReads = 0;
  api.get = async (path, options) => {
    if (path === "/users/me" && ++actorReads === 2)
      state.actor.role = "developer";
    return get(path, options);
  };
  await assert.rejects(
    setup.client.performUsersAction(before, usersAction(before)),
    (e) => e.unavailable === true,
  );
  assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
});
test("users approval 4xx with partial review save is uncertain and recovery never repeats approval", async () => {
  const { api, state } = usersApi(),
    setup = usersSetup({ api }),
    before = usersLibrary(setup, state),
    action = usersAction(before, "approve");
  state.partialApproval = true;
  state.writeError = {
    response: { status: 400, data: { message: "private-backend" } },
  };
  await assert.rejects(
    setup.client.performUsersAction(before, action),
    (e) => e.uncertain === true && !e.message.includes("private-backend"),
  );
  const recovered = await setup.client.checkUsersState(adminActor, action);
  assert.match(recovered.summary, /still listed.*approved/);
  assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 1);
});
test("users malformed acknowledgement, readback failure and transport uncertainty never report success", async () => {
  for (const config of [
    { badAck: { success: false } },
    { failRead: true },
    { writeError: new Error("private-token") },
  ]) {
    const { api, state } = usersApi();
    Object.assign(state, config);
    const setup = usersSetup({ api }),
      before = usersLibrary(setup, state);
    await assert.rejects(
      setup.client.performUsersAction(before, usersAction(before)),
      (e) => e.uncertain === true && !e.message.includes("private-token"),
    );
    assert.equal(state.calls.filter((c) => c[0] === "DELETE").length, 1);
  }
});
test("users rejection with wrong account or reviewer acknowledgement is uncertain", async () => {
  for (const patch of [
    { id: noticeId(79) },
    { userId: noticeId(79) },
    { reviewedByAdminId: noticeId(79) },
    { reason: "changed" },
    { reviewedAt: "invalid" },
  ]) {
    const { api, state } = usersApi(),
      setup = usersSetup({ api }),
      before = usersLibrary(setup, state);
    state.badAck = {
      ...requestRaw(),
      status: "rejected",
      reviewedAt: "2026-10-27T06:00:00Z",
      reviewedByAdminId: adminActor.id,
      ...patch,
    };
    await assert.rejects(
      setup.client.performUsersAction(before, usersAction(before, "reject")),
      (e) => e.uncertain === true,
    );
  }
});
test("users fixed read failures do not expose backend payloads or invent an empty directory", async () => {
  const { api } = usersApi();
  api.get = async (path) => {
    if (path === "/users/me") return { data: adminActor };
    throw { response: { status: 503, data: { message: "private-response" } } };
  };
  const setup = usersSetup({ api });
  await assert.rejects(
    setup.client.loadUsersLibrary(adminActor),
    (e) => !e.message.includes("private-response"),
  );
  const state = profileHookState(),
    view = usersSetup({ hooks: state.hooks });
  const html = view.h.render(
    createElement(
      view.view.UsersView,
      usersViewProps(undefined, { error: "Unavailable" }),
    ),
  );
  assert.match(html, /Account details are unavailable/);
  assert.doesNotMatch(html, /No accounts in the checked directory/);
});
function usersControllerSetup(options = {}) {
  const state = profileHookState(),
    fixture = usersApi(),
    queries = {},
    setup = usersSetup({
      hooks: state.hooks,
      api: fixture.api,
      queries,
      ...options,
    });
  const library = usersLibrary(setup, fixture.state),
    key = `admin/users/library/${adminActor.id}/admin`;
  queries[key] = {
    data: library,
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: async () => ({ isError: false }),
    ...options.query,
  };
  const Controller = setup.h.load(
    new URL("../admin-users/gui-admin-users.tsx", import.meta.url),
  ).GuiAdminUsers;
  return {
    ...setup,
    ...state,
    fixture,
    library,
    query: queries[key],
    render() {
      state.reset();
      const tree = Controller();
      return { tree, view: walk(tree, (n) => n.type?.name === "UsersView")[0] };
    },
  };
}
test("users controller scopes cache and hides cached values during a fresh entry read", () => {
  const setup = usersControllerSetup({ query: { isFetching: true } }),
    rendered = setup.render();
  assert.equal(rendered.view.props.library, undefined);
  assert.equal(rendered.tree.props.user, undefined);
  const q = setup.h.queryCalls.find(
    (q) => q.queryKey[0] === "admin" && q.queryKey[1] === "users",
  );
  assert.equal(
    q.queryKey.join("/"),
    `admin/users/library/${adminActor.id}/admin`,
  );
  assert.equal(q.retry, false);
  assert.equal(q.refetchOnMount, "always");
});
test("users controller blocks same-tick duplicate account decisions", async () => {
  const setup = usersControllerSetup(),
    props = setup.render().view.props,
    action = usersAction(setup.library);
  props.onAction(action);
  props.onAction(action);
  await new Promise(setImmediate);
  assert.equal(
    setup.fixture.state.calls.filter((c) => c[0] === "DELETE").length,
    1,
  );
  assert.match(setup.render().view.props.notice, /absence from the directory/);
});
test("users uncertain outcomes stay paused through failed checks and need explicit checked-list adoption", async () => {
  const setup = usersControllerSetup(),
    action = usersAction(setup.library);
  setup.fixture.state.writeError = new Error("timeout");
  setup.render().view.props.onAction(action);
  await new Promise(setImmediate);
  let p = setup.render().view.props;
  assert.equal(p.locked, true);
  assert.equal(p.late, true);
  p.onAction(action);
  await new Promise(setImmediate);
  setup.fixture.state.failRead = true;
  p.onCheck();
  await new Promise(setImmediate);
  p = setup.render().view.props;
  assert.equal(p.locked, true);
  assert.equal(p.recovery, undefined);
  setup.fixture.state.failRead = false;
  p.onCheck();
  await new Promise(setImmediate);
  p = setup.render().view.props;
  assert.ok(p.recovery);
  assert.equal(p.locked, true);
  p.onAdopt();
  p = setup.render().view.props;
  assert.equal(p.locked, false);
  assert.equal(p.late, true);
  assert.equal(
    setup.fixture.state.calls.filter((c) => c[0] === "DELETE").length,
    1,
  );
});
test("users controller checks the original session between render and action", async () => {
  let token = "users-session";
  const setup = usersControllerSetup({ authToken: () => token }),
    props = setup.render().view.props;
  token = "changed";
  props.onAction(usersAction(setup.library));
  props.onCheck();
  await new Promise(setImmediate);
  assert.equal(setup.fixture.state.calls.length, 0);
  const rendered = setup.render();
  assert.equal(rendered.view, undefined);
  assert.equal(rendered.tree.props.user, undefined);
});
test("users confirmation names the account, defaults to keeping it and only calls the action on confirmation", () => {
  const state = profileHookState(),
    setup = usersSetup({ hooks: state.hooks }),
    fixture = usersApi(),
    library = usersLibrary(setup, fixture.state);
  let calls = 0;
  const props = usersViewProps(library, {
      onAction() {
        calls++;
      },
    }),
    render = () => {
      state.reset();
      return setup.view.UsersView(props);
    };
  let tree = render();
  walk(tree, (n) =>
    n.props?.["aria-label"]?.startsWith("Delete account for Nora"),
  )[0].props.onClick();
  tree = render();
  let dialog = walk(tree, (n) => n.type === "dialog")[0];
  assert.match(setup.h.render(dialog), /learner71@example.test/);
  assert.match(setup.h.render(dialog), /Keep account/);
  assert.equal(calls, 0);
  dialog.props.onCancel({ preventDefault() {} });
  assert.equal(walk(render(), (n) => n.type === "dialog").length, 0);
  assert.equal(calls, 0);
  tree = render();
  walk(tree, (n) =>
    n.props?.["aria-label"]?.startsWith("Delete account for Nora"),
  )[0].props.onClick();
  dialog = walk(render(), (n) => n.type === "dialog")[0];
  walk(
    dialog,
    (n) => n.type === "button" && n.props.children === "Delete permanently",
  )[0].props.onClick();
  assert.equal(calls, 1);
});
test("users view protects admins, escapes request reasons and filters statuses without writes", () => {
  const state = profileHookState(),
    setup = usersSetup({ hooks: state.hooks }),
    fixture = usersApi(),
    library = usersLibrary(setup, fixture.state),
    props = usersViewProps(library);
  let tree = setup.view.UsersView(props),
    html = setup.h.render(tree);
  assert.match(html, /Protected/);
  assert.doesNotMatch(html, /Delete account for Mira/);
  walk(
    tree,
    (n) => n.type === "button" && n.props["aria-pressed"] === false,
  )[0].props.onClick();
  state.reset();
  tree = setup.view.UsersView(props);
  html = setup.h.render(tree);
  assert.match(html, /&lt;script&gt;private&lt;\/script&gt;/);
  assert.match(html, /Approve &amp; delete account/);
  assert.match(html, /Reject request/);
  walk(tree, (n) => n.type === "select")[0].props.onChange({
    target: { value: "rejected" },
  });
  state.reset();
  assert.match(
    setup.h.render(setup.view.UsersView(props)),
    /No requests match this status/,
  );
});
test("users classic mode preserves its original page without starting GUI data queries", () => {
  const setup = usersSetup({
      mode: { ready: true, isCli: true, location: { kind: "root" } },
    }),
    Page = setup.h.load(
      new URL("../admin-users/gui-admin-users.tsx", import.meta.url),
    ).AdminUsersPage,
    tree = Page();
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.equal(setup.h.queryCalls.length, 0);
  assert.equal(setup.h.calls.at(-1)[1], "gui");
  assert.equal(setup.h.calls.at(-1)[2].navigate, false);
});

test("users stale reviewed request stops before approval and denied access hides the entire cached directory", async () => {
  const setup = usersControllerSetup();
  Object.assign(setup.fixture.state.requests[0], {
    status: "rejected",
    reviewedAt: "2026-10-27T06:00:00Z",
    reviewedByAdminId: adminActor.id,
  });
  setup.render().view.props.onAction(usersAction(setup.library, "approve"));
  await new Promise(setImmediate);
  assert.equal(
    setup.fixture.state.calls.filter((c) => c[0] !== "GET").length,
    0,
  );
  const original = setup.fixture.api.get;
  setup.fixture.api.get = async (path, options) => {
    if (path === "/users")
      throw { response: { status: 403, data: { message: "private" } } };
    return original(path, options);
  };
  setup.render().view.props.onCheck();
  await new Promise(setImmediate);
  const rendered = setup.render();
  assert.equal(rendered.view, undefined);
  assert.equal(rendered.tree.props.user, undefined);
  assert.doesNotMatch(
    setup.h.render(rendered.tree),
    /Nora Chen|learner71@example.test/,
  );
});

test("users loading and unavailable totals remain unknown while checked zero stays zero", () => {
  const hooks = {
      useEffect() {},
      useRef: (value) => ({ current: value }),
      useState: (value) => [
        typeof value === "function" ? value() : value,
        () => {},
      ],
    },
    setup = usersSetup({ hooks }),
    fixture = usersApi(),
    library = usersLibrary(setup, fixture.state);
  for (const props of [
    usersViewProps(undefined, { loading: true }),
    usersViewProps(undefined, { error: "Unavailable" }),
  ]) {
    const tree = setup.view.UsersView(props),
      summary = walk(
        tree,
        (n) => n.props?.["aria-label"] === "Checked account totals",
      )[0],
      html = setup.h.render(summary);
    assert.equal((html.match(/—/g) || []).length, 3);
    assert.doesNotMatch(
      setup.h.render(tree),
      /No accounts in the checked directory/,
    );
  }
  const zero = setup.view.UsersView(
    usersViewProps({ ...library, users: [], requests: [] }),
  );
  assert.match(setup.h.render(zero), /No accounts in the checked directory/);
  const summary = walk(
    zero,
    (n) => n.props?.["aria-label"] === "Checked account totals",
  )[0];
  assert.equal(
    (setup.h.render(summary).match(/<strong>0<\/strong>/g) || []).length,
    3,
  );
});

// Checkpoint 26: content review and roadmap moderation.
const modStamp = "2026-10-01T06:00:00Z";
function modLesson(patch = {}) {
  return {
    id: noticeId(201),
    title: "Packets, patiently explained",
    slug: "packets",
    content: "Current saved body",
    draftContent: null,
    difficulty: "medium",
    reviewStatus: "pending",
    isAiGenerated: false,
    rejectionReason: null,
    createdAt: modStamp,
    updatedAt: modStamp,
    reviewedAt: null,
    reviewedByUserId: null,
    authorId: noticeId(77),
    author: {
      id: noticeId(77),
      name: "Nora Chen",
      email: "discard-email",
      passwordHash: "discard-password",
    },
    placements: [
      {
        roadmapId: noticeId(301),
        roadmapTitle: "Network foundations",
        moduleId: noticeId(401),
        moduleTitle: "The first mile",
        orderIndex: 0,
      },
    ],
    questions: [
      {
        id: noticeId(501),
        questionText: "What does routing do?",
        orderIndex: 0,
        options: [
          {
            id: noticeId(601),
            optionText: "Chooses a path",
            isCorrect: true,
            orderIndex: 0,
          },
          {
            id: noticeId(602),
            optionText: "Makes a copy",
            isCorrect: false,
            orderIndex: 1,
          },
        ],
      },
    ],
    privateError: "discard-raw",
    ...patch,
  };
}
function modRoadmap(patch = {}) {
  return {
    id: noticeId(301),
    title: "Network foundations",
    slug: "network-foundations",
    description: "A careful introduction.",
    createdById: noticeId(77),
    createdAt: modStamp,
    updatedAt: modStamp,
    reviewStatus: "submitted",
    rejectionReason: null,
    reviewedByUserId: null,
    reviewedAt: null,
    unpublishStatus: "none",
    unpublishEffectiveAt: null,
    deleteEffectiveAt: null,
    modules: [{ content: "discard-tree" }],
    teacherPersona: { secret: "discard-persona" },
    ...patch,
  };
}
function modReport(r, lessons = []) {
  const concepts = lessons.map((c) => ({
    id: c.id,
    title: c.title,
    reviewStatus: c.reviewStatus,
    rejectionReason: c.rejectionReason,
    hasPendingDraft: c.draftContent !== null,
    originLabel: c.isAiGenerated ? "ai" : "handwritten",
  }));
  const modules = [
      {
        moduleId: noticeId(401),
        title: "The first mile",
        approved:
          concepts.length > 0 &&
          concepts.every((c) => c.reviewStatus === "approved"),
        originLabel: concepts.length ? "handwritten" : null,
        concepts,
      },
    ],
    pendingCount = concepts.filter((c) => c.reviewStatus === "pending").length,
    rejectedCount = concepts.filter(
      (c) => c.reviewStatus === "rejected",
    ).length;
  return {
    roadmapId: r.id,
    title: r.title,
    reviewStatus: r.reviewStatus,
    rejectionReason: r.rejectionReason,
    reviewedAt: r.reviewedAt,
    modules,
    moduleCount: modules.length,
    conceptCount: concepts.length,
    pendingCount,
    rejectedCount,
    canPublish:
      r.reviewStatus === "submitted" && !pendingCount && !rejectedCount,
  };
}
function moderationSetup(options = {}) {
  const h = roadmapHarness({
    authUser: adminActor,
    authToken: "moderation-session",
    globals: { AbortController },
    ...options,
  });
  return {
    h,
    data: h.load(new URL("../content-review/review-data.ts", import.meta.url)),
    client: h.load(
      new URL("../content-review/review-client.ts", import.meta.url),
    ),
    view: h.load(new URL("../content-review/review-view.tsx", import.meta.url)),
  };
}
function moderationApi() {
  const state = {
    actor: { ...adminActor },
    lessons: [modLesson()],
    roadmaps: [modRoadmap()],
    calls: [],
    wrote: false,
  };
  function report(r) {
    return state.reportOverride ?? modReport(r, state.lessons);
  }
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, options]);
      if (state.failRead && state.wrote)
        throw {
          response: { status: 503, data: { message: "discard-private" } },
        };
      if (path === "/users/me") return { data: structuredClone(state.actor) };
      if (path === "/admin/content-review/pending")
        return {
          data: structuredClone(
            state.lessons.filter(
              (l) =>
                l.reviewStatus === "pending" ||
                (l.reviewStatus === "approved" && l.draftContent !== null),
            ),
          ),
        };
      if (path === "/roadmaps")
        return { data: structuredClone(state.roadmaps) };
      if (path.startsWith("/concepts/")) {
        const l = state.lessons.find((l) => l.id === path.split("/")[2]);
        if (!l) throw { response: { status: 404 } };
        return { data: structuredClone(l) };
      }
      if (path.startsWith("/roadmaps/")) {
        const r = state.roadmaps.find((r) => r.id === path.split("/")[2]);
        if (!r) throw { response: { status: 404 } };
        return {
          data: structuredClone(path.endsWith("/review") ? report(r) : r),
        };
      }
      assert.fail(`Unexpected moderation GET ${path}`);
    },
    async patch(path, body, options) {
      state.calls.push(["PATCH", path, body, options]);
      state.wrote = true;
      if (state.writeError) throw state.writeError;
      const kind = path.split("/").at(-1),
        id = path.split("/").at(-2),
        stamp = new Date().toISOString();
      if (!path.includes("/roadmaps/")) {
        const l = state.lessons.find((l) => l.id === id);
        if (kind === "approve") {
          if (l.draftContent !== null) l.content = l.draftContent;
          l.draftContent = null;
          l.reviewStatus = "approved";
          l.rejectionReason = null;
        } else {
          if (l.draftContent !== null) l.draftContent = null;
          else l.reviewStatus = "rejected";
          l.rejectionReason = body.reason;
        }
        Object.assign(l, {
          reviewedAt: stamp,
          updatedAt: stamp,
          reviewedByUserId: adminActor.id,
        });
        return { data: state.badAck ?? structuredClone(l) };
      }
      const r = state.roadmaps.find((r) => r.id === id),
        review = () =>
          Object.assign(r, {
            reviewedAt: stamp,
            reviewedByUserId: adminActor.id,
          });
      r.updatedAt = stamp;
      switch (kind) {
        case "publish":
          r.reviewStatus = "published";
          r.rejectionReason = null;
          review();
          break;
        case "reject":
          r.reviewStatus = "draft";
          r.rejectionReason = body.reason;
          review();
          break;
        case "unpublish":
          r.reviewStatus = "draft";
          break;
        case "approve-unpublish":
          r.unpublishStatus = "approved";
          r.unpublishEffectiveAt = new Date(
            Date.now() + 30 * 86400000,
          ).toISOString();
          review();
          break;
        case "deny-unpublish":
          r.unpublishStatus = "none";
          r.unpublishEffectiveAt = null;
          break;
        case "schedule-delete":
          r.deleteEffectiveAt = new Date(
            Date.now() + 30 * 86400000,
          ).toISOString();
          review();
          break;
        case "cancel-scheduled-delete":
          r.deleteEffectiveAt = null;
          break;
        default:
          assert.fail(kind);
      }
      return { data: state.badAck ?? structuredClone(r) };
    },
    async delete(path, options) {
      state.calls.push(["DELETE", path, options]);
      state.wrote = true;
      const overdue = state.roadmaps.filter(
        (r) =>
          r.deleteEffectiveAt && Date.parse(r.deleteEffectiveAt) <= Date.now(),
      );
      if (state.partialPurge) {
        state.roadmaps = state.roadmaps.filter((r) => r.id !== overdue[0]?.id);
        throw new Error("discard-partial");
      }
      if (state.writeError) throw state.writeError;
      state.roadmaps = state.roadmaps.filter((r) => !overdue.includes(r));
      return { data: state.badAck ?? { purged: overdue.length } };
    },
  };
  return { state, api };
}
function modLibrary(setup, state) {
  return {
    user: adminActor,
    lessons: setup.data.parseReviewLessons(
      state.lessons.filter(
        (l) =>
          l.reviewStatus === "pending" ||
          (l.reviewStatus === "approved" && l.draftContent !== null),
      ),
    ),
    roadmaps: setup.data.parseReviewRoadmaps(state.roadmaps),
    checkedAt: new Date().toISOString(),
  };
}
function modDetail(setup, state) {
  const roadmap = setup.data.parseReviewRoadmap(state.roadmaps[0]);
  return {
    roadmap,
    report: setup.data.parseReviewReport(
      modReport(state.roadmaps[0], state.lessons),
      roadmap,
    ),
    checkedAt: new Date().toISOString(),
  };
}
const modProps = (library, patch = {}) => ({
  library,
  onOpen() {},
  onAction() {},
  onCheck() {},
  onAdopt() {},
  ...patch,
});
test("moderation projection keeps complete text, empty staged bodies and admin answer keys while dropping raw entities", () => {
  const setup = moderationSetup(),
    full = "Long source " + "complete text ".repeat(400),
    lesson = setup.data.parseReviewLessons([
      modLesson({ content: full, draftContent: "", reviewStatus: "approved" }),
    ])[0];
  assert.equal(lesson.content, full);
  assert.equal(lesson.draftContent, "");
  assert.equal(lesson.questions[0].options[0].isCorrect, true);
  assert.equal(lesson.author.email, undefined);
  assert.doesNotMatch(JSON.stringify(lesson), /discard-|passwordHash/);
  const row = setup.data.parseReviewRoadmap(modRoadmap());
  assert.doesNotMatch(JSON.stringify(row), /discard-|teacherPersona|modules/);
});
test("moderation projections reject malformed, duplicate and nonqueued records without silent defaults", () => {
  const { data } = moderationSetup();
  for (const rows of [
    [modLesson(), modLesson()],
    [modLesson({ reviewStatus: "approved" })],
    [modLesson({ draftContent: 3 })],
    [modLesson({ reviewedAt: "invalid" })],
    [modLesson({ placements: [] })],
    [
      modLesson({
        questions: [
          {
            id: noticeId(501),
            questionText: "Question",
            orderIndex: 0,
            options: [
              { id: noticeId(601), optionText: "Answer", orderIndex: 0 },
            ],
          },
        ],
      }),
    ],
  ])
    assert.throws(() => data.parseReviewLessons(rows));
  for (const rows of [
    [modRoadmap(), modRoadmap()],
    [modRoadmap({ deleteEffectiveAt: "invalid" })],
    [modRoadmap({ unpublishStatus: "unknown" })],
  ])
    assert.throws(() => data.parseReviewRoadmaps(rows));
});
test("moderation publish readiness mirrors review states without reintroducing submission structure minimums", () => {
  const { data } = moderationSetup(),
    r = data.parseReviewRoadmap(modRoadmap()),
    raw = modReport(modRoadmap(), []),
    report = data.parseReviewReport(raw, r);
  assert.equal(report.canPublish, true);
  assert.equal(report.moduleCount, 1);
  assert.equal(
    data.canRoadmapAction(
      { roadmap: r, report, checkedAt: modStamp },
      "publish",
    ),
    true,
  );
  assert.throws(() => data.parseReviewReport({ ...raw, canPublish: false }, r));
  assert.throws(() => data.parseReviewReport({ ...raw, pendingCount: 1 }, r));
  assert.throws(() =>
    data.parseReviewReport({ ...raw, roadmapId: noticeId(999) }, r),
  );
});
test("moderation effective dates separate public takedown, overdue deletion and stored publication state", () => {
  const { data } = moderationSetup(),
    at = Date.parse("2026-10-29T06:00:00Z"),
    past = "2026-10-28T06:00:00Z",
    future = "2026-11-29T06:00:00Z";
  const r = data.parseReviewRoadmap(
    modRoadmap({
      reviewStatus: "published",
      unpublishStatus: "approved",
      unpublishEffectiveAt: past,
    }),
  );
  assert.equal(data.effectiveRoadmapStatus(r, at), "draft");
  assert.equal(r.reviewStatus, "published");
  assert.equal(data.deletionDue(r, at), false);
  assert.equal(
    data.purgeCandidates(
      [
        r,
        { ...r, id: noticeId(302), deleteEffectiveAt: past },
        { ...r, id: noticeId(303), deleteEffectiveAt: future },
      ],
      at,
    ).length,
    1,
  );
});
test("moderation filters distinguish handwritten/AI and non-null staged text without mutating snapshots", () => {
  const { data } = moderationSetup(),
    rows = data.parseReviewLessons([
      modLesson(),
      modLesson({
        id: noticeId(202),
        isAiGenerated: true,
        draftContent: "",
        reviewStatus: "approved",
      }),
    ]);
  assert.equal(
    data.filterReviewLessons(rows, "nora", "all", "staged").length,
    1,
  );
  assert.equal(data.filterReviewLessons(rows, "", "manual", "new").length, 1);
  assert.equal(rows.length, 2);
});
test("moderation entry reads are timed, abortable and bracketed by current admin checks", async () => {
  const { api, state } = moderationApi(),
    setup = moderationSetup({ api }),
    signal = new AbortController().signal;
  await setup.client.loadReviewLibrary(adminActor, signal);
  assert.equal(
    state.calls.map((c) => c[1]).join(),
    "/users/me,/admin/content-review/pending,/roadmaps,/users/me",
  );
  for (const c of state.calls) {
    assert.equal(c[2].timeout, 12000);
    assert.equal(c[2].signal, signal);
  }
});
test("moderation roadmap detail reads the review before the row to accommodate lazy date normalization", async () => {
  const { api, state } = moderationApi(),
    setup = moderationSetup({ api });
  await setup.client.loadRoadmapReview(adminActor, noticeId(301));
  assert.equal(
    state.calls.map((c) => c[1]).join(),
    `/users/me,/roadmaps/${noticeId(301)}/review,/roadmaps/${noticeId(301)},/users/me`,
  );
  assert.ok(state.calls.every((c) => c[0] === "GET"));
});
test("moderation entry refuses role changes and session changes before private content enters cache", async () => {
  const { api, state } = moderationApi();
  state.actor.role = "developer";
  const setup = moderationSetup({ api });
  await assert.rejects(
    setup.client.loadReviewLibrary(adminActor),
    (e) => e.unavailable,
  );
  assert.equal(state.calls.length, 1);
  let token = "moderation-session";
  const next = moderationSetup({ api, authToken: () => token });
  token = "new";
  await assert.rejects(
    next.client.loadReviewLibrary(adminActor, undefined, "moderation-session"),
    (e) => e.unavailable,
  );
  assert.equal(state.calls.length, 1);
});
test("moderation approving even an empty staged body promotes it and checks the saved body and queue", async () => {
  const { api, state } = moderationApi();
  state.lessons[0].reviewStatus = "approved";
  state.lessons[0].draftContent = "";
  const setup = moderationSetup({ api }),
    before = modLibrary(setup, state);
  const result = await setup.client.performReviewAction(before, {
    scope: "lesson",
    kind: "approve",
    lesson: before.lessons[0],
  });
  assert.equal(state.lessons[0].content, "");
  assert.equal(result.library.lessons.length, 0);
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  assert.ok(state.calls.some((c) => c[1] === `/concepts/${noticeId(201)}`));
});
test("moderation rejecting staged text keeps the body and prior status, including the pending-plus-draft edge case", async () => {
  for (const status of ["approved", "pending"]) {
    const { api, state } = moderationApi();
    Object.assign(state.lessons[0], {
      reviewStatus: status,
      draftContent: "A staged revision",
    });
    const setup = moderationSetup({ api }),
      before = modLibrary(setup, state);
    const result = await setup.client.performReviewAction(before, {
      scope: "lesson",
      kind: "reject",
      lesson: before.lessons[0],
      reason: "Clarify the example.",
    });
    assert.equal(state.lessons[0].content, "Current saved body");
    assert.equal(state.lessons[0].reviewStatus, status);
    assert.equal(state.lessons[0].draftContent, null);
    assert.equal(result.library.lessons.length, status === "pending" ? 1 : 0);
  }
});
test("moderation rejecting a new lesson records feedback and removes the rejected lesson from the queue", async () => {
  const { api, state } = moderationApi(),
    setup = moderationSetup({ api }),
    before = modLibrary(setup, state);
  const result = await setup.client.performReviewAction(before, {
    scope: "lesson",
    kind: "reject",
    lesson: before.lessons[0],
    reason: "  Add a concrete example.  ",
  });
  assert.equal(state.lessons[0].reviewStatus, "rejected");
  assert.equal(state.lessons[0].rejectionReason, "Add a concrete example.");
  assert.equal(result.library.lessons.length, 0);
});
test("moderation stale bodies, answer keys, placements or authors stop before a decision", async () => {
  for (const change of [
    (s) => (s.lessons[0].content = "Changed"),
    (s) => (s.lessons[0].questions[0].options[0].isCorrect = false),
    (s) => (s.lessons[0].placements[0].roadmapTitle = "Changed"),
    (s) => (s.lessons[0].author.name = "Changed"),
  ]) {
    const { api, state } = moderationApi(),
      setup = moderationSetup({ api }),
      before = modLibrary(setup, state);
    change(state);
    await assert.rejects(
      setup.client.performReviewAction(before, {
        scope: "lesson",
        kind: "approve",
        lesson: before.lessons[0],
      }),
      (e) => !e.uncertain,
    );
    assert.equal(state.calls.filter((c) => c[0] !== "GET").length, 0);
  }
});
test("moderation rejection requires trimmed feedback before any request and drops raw errors", async () => {
  const { api, state } = moderationApi(),
    setup = moderationSetup({ api }),
    before = modLibrary(setup, state);
  for (const reason of ["  ", "x".repeat(2001)])
    await assert.rejects(
      setup.client.performReviewAction(before, {
        scope: "lesson",
        kind: "reject",
        lesson: before.lessons[0],
        reason,
      }),
    );
  assert.equal(state.calls.length, 0);
  api.get = async (path) => {
    if (path === "/users/me") return { data: adminActor };
    throw { response: { status: 503, data: { message: "discard-secret" } } };
  };
  await assert.rejects(
    setup.client.loadReviewLibrary(adminActor),
    (e) => !e.message.includes("discard-secret"),
  );
});
test("moderation roadmap publication and rejection require a fresh unchanged review report", async () => {
  for (const kind of ["publish", "reject"]) {
    const { api, state } = moderationApi();
    state.lessons[0].reviewStatus = "approved";
    const setup = moderationSetup({ api }),
      before = modLibrary(setup, state),
      target = modDetail(setup, state);
    const result = await setup.client.performReviewAction(before, {
      scope: "roadmap",
      kind,
      target,
      reason: "Needs a clearer scope.",
    });
    assert.equal(
      result.library.roadmaps[0].reviewStatus,
      kind === "publish" ? "published" : "draft",
    );
    assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  }
  const { api, state } = moderationApi();
  state.lessons[0].reviewStatus = "approved";
  const setup = moderationSetup({ api }),
    before = modLibrary(setup, state),
    target = modDetail(setup, state);
  state.lessons[0].reviewStatus = "pending";
  await assert.rejects(
    setup.client.performReviewAction(before, {
      scope: "roadmap",
      kind: "publish",
      target,
    }),
    (e) => !e.uncertain,
  );
  assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 0);
});
test("moderation roadmap operations preserve unrelated schedules and support takedown and deletion cancellation", async () => {
  for (const kind of [
    "unpublish",
    "approve-unpublish",
    "deny-unpublish",
    "schedule-delete",
    "cancel-scheduled-delete",
  ]) {
    const { api, state } = moderationApi();
    state.roadmaps[0].reviewStatus = "published";
    if (["approve-unpublish", "deny-unpublish"].includes(kind))
      state.roadmaps[0].unpublishStatus = "requested";
    if (kind === "cancel-scheduled-delete")
      state.roadmaps[0].deleteEffectiveAt = new Date(
        Date.now() + 86400000,
      ).toISOString();
    const setup = moderationSetup({ api }),
      before = modLibrary(setup, state),
      target = modDetail(setup, state),
      result = await setup.client.performReviewAction(before, {
        scope: "roadmap",
        kind,
        target,
      });
    assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
    assert.ok(result.library.roadmaps.length);
    if (kind === "approve-unpublish")
      assert.ok(result.library.roadmaps[0].unpublishEffectiveAt);
    if (kind === "schedule-delete")
      assert.ok(result.library.roadmaps[0].deleteEffectiveAt);
    if (kind === "cancel-scheduled-delete")
      assert.equal(result.library.roadmaps[0].deleteEffectiveAt, null);
  }
});
test("moderation malformed lesson/roadmap acknowledgements and failed readback pause further decisions", async () => {
  for (const config of [
    { badAck: { success: true } },
    { failRead: true },
    {
      writeError: {
        response: { status: 400, data: { message: "discard-raw" } },
      },
    },
    { writeError: new Error("discard-token") },
  ]) {
    const { api, state } = moderationApi();
    Object.assign(state, config);
    const setup = moderationSetup({ api }),
      before = modLibrary(setup, state);
    await assert.rejects(
      setup.client.performReviewAction(before, {
        scope: "lesson",
        kind: "approve",
        lesson: before.lessons[0],
      }),
      (e) => e.uncertain && !e.message.includes("discard-"),
    );
    assert.equal(state.calls.filter((c) => c[0] === "PATCH").length, 1);
  }
  const { api, state } = moderationApi();
  state.lessons[0].reviewStatus = "approved";
  state.badAck = modRoadmap({
    reviewStatus: "published",
    title: "Wrong target",
  });
  const setup = moderationSetup({ api }),
    before = modLibrary(setup, state);
  await assert.rejects(
    setup.client.performReviewAction(before, {
      scope: "roadmap",
      kind: "publish",
      target: modDetail(setup, state),
    }),
    (e) => e.uncertain,
  );
});
test("moderation purge confirms reviewed overdue lookups and reports a server count without an exact-set promise", async () => {
  const { api, state } = moderationApi();
  state.roadmaps[0].deleteEffectiveAt = new Date(
    Date.now() - 86400000,
  ).toISOString();
  const setup = moderationSetup({ api }),
    before = modLibrary(setup, state),
    selected = setup.data.purgeCandidates(before.roadmaps);
  const result = await setup.client.performReviewAction(before, {
    scope: "purge",
    kind: "purge",
    roadmaps: selected,
  });
  assert.equal(result.library.roadmaps.length, 0);
  assert.match(result.message, /server reported 1/);
  assert.match(result.message, /other roadmaps due/);
  assert.equal(state.calls.filter((c) => c[0] === "DELETE").length, 1);
});
test("moderation purge stops for changed candidates and treats partial purge failures as uncertain", async () => {
  const { api, state } = moderationApi();
  state.roadmaps[0].deleteEffectiveAt = new Date(
    Date.now() - 86400000,
  ).toISOString();
  const setup = moderationSetup({ api }),
    before = modLibrary(setup, state),
    a = { scope: "purge", kind: "purge", roadmaps: before.roadmaps };
  state.roadmaps.push(
    modRoadmap({
      id: noticeId(302),
      deleteEffectiveAt: new Date(Date.now() - 1000).toISOString(),
    }),
  );
  await assert.rejects(
    setup.client.performReviewAction(before, a),
    (e) => !e.uncertain,
  );
  assert.equal(state.calls.filter((c) => c[0] === "DELETE").length, 0);
  state.roadmaps.pop();
  state.partialPurge = true;
  await assert.rejects(
    setup.client.performReviewAction(before, a),
    (e) => e.uncertain,
  );
  const recovered = await setup.client.checkReviewState(adminActor, a);
  assert.match(recovered.summary, /1 of 1/);
  assert.match(recovered.summary, /does not confirm a complete purge/);
  assert.equal(state.calls.filter((c) => c[0] === "DELETE").length, 1);
});
test("moderation recovery checks current saved state without repeating a decision or inferring approval from queue absence", async () => {
  const { api, state } = moderationApi(),
    setup = moderationSetup({ api }),
    before = modLibrary(setup, state),
    a = { scope: "lesson", kind: "approve", lesson: before.lessons[0] };
  state.lessons[0].reviewStatus = "rejected";
  const result = await setup.client.checkReviewState(adminActor, a);
  assert.match(result.summary, /rejected/);
  assert.ok(state.calls.every((c) => c[0] === "GET"));
});
function moderationControllerSetup(options = {}) {
  const hooks = profileHookState(),
    fixture = moderationApi(),
    queries = {},
    setup = moderationSetup({
      hooks: hooks.hooks,
      api: fixture.api,
      queries,
      ...options,
    }),
    library = modLibrary(setup, fixture.state),
    key = `admin/content-review/library/${adminActor.id}/admin`;
  queries[key] = {
    data: library,
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: async () => ({ isError: false }),
    ...options.query,
  };
  const Controller = setup.h.load(
    new URL("../content-review/gui-content-review.tsx", import.meta.url),
  ).GuiContentReview;
  return {
    ...setup,
    ...hooks,
    fixture,
    library,
    query: queries[key],
    render() {
      hooks.reset();
      const tree = Controller();
      return {
        tree,
        view: walk(tree, (n) => n.type?.name === "ContentReviewView")[0],
      };
    },
  };
}
test("moderation controller hides cached bodies and answer keys while entry is rechecked", () => {
  const setup = moderationControllerSetup({ query: { isFetching: true } }),
    rendered = setup.render();
  assert.equal(rendered.view.props.library, undefined);
  assert.equal(rendered.view.props.detail, undefined);
  assert.equal(rendered.tree.props.user, undefined);
  const q = setup.h.queryCalls.find((q) => q.queryKey[1] === "content-review");
  assert.equal(
    q.queryKey.join("/"),
    `admin/content-review/library/${adminActor.id}/admin`,
  );
  assert.equal(q.refetchOnMount, "always");
  assert.equal(q.retry, false);
});
test("moderation controller deduplicates decisions and checks the original session at action time", async () => {
  const setup = moderationControllerSetup(),
    a = { scope: "lesson", kind: "approve", lesson: setup.library.lessons[0] },
    props = setup.render().view.props;
  props.onAction(a);
  props.onAction(a);
  await new Promise(setImmediate);
  assert.equal(
    setup.fixture.state.calls.filter((c) => c[0] === "PATCH").length,
    1,
  );
  assert.match(setup.render().view.props.notice, /review saved/);
  let token = "moderation-session";
  const next = moderationControllerSetup({ authToken: () => token }),
    p = next.render().view.props;
  token = "new";
  p.onAction({
    scope: "lesson",
    kind: "approve",
    lesson: next.library.lessons[0],
  });
  p.onOpen(noticeId(301));
  await new Promise(setImmediate);
  assert.equal(next.fixture.state.calls.length, 0);
  assert.equal(next.render().view, undefined);
});
test("moderation uncertainty stays paused through failed checks and requires explicit adoption with a retained late-request warning", async () => {
  const setup = moderationControllerSetup(),
    a = { scope: "lesson", kind: "approve", lesson: setup.library.lessons[0] };
  setup.fixture.state.writeError = new Error("timeout");
  setup.render().view.props.onAction(a);
  await new Promise(setImmediate);
  let p = setup.render().view.props;
  assert.equal(p.locked, true);
  p.onAction(a);
  setup.fixture.state.failRead = true;
  p.onCheck();
  await new Promise(setImmediate);
  p = setup.render().view.props;
  assert.equal(p.recovery, undefined);
  assert.equal(p.locked, true);
  setup.fixture.state.failRead = false;
  p.onCheck();
  await new Promise(setImmediate);
  p = setup.render().view.props;
  assert.ok(p.recovery);
  assert.equal(p.locked, true);
  p.onAdopt();
  p = setup.render().view.props;
  assert.equal(p.locked, false);
  assert.equal(p.late, true);
  assert.equal(
    setup.fixture.state.calls.filter((c) => c[0] === "PATCH").length,
    1,
  );
});
test("moderation denied access hides every cached private field and the shell account", async () => {
  const setup = moderationControllerSetup(),
    get = setup.fixture.api.get;
  setup.fixture.api.get = async (path, options) => {
    if (path === "/roadmaps")
      throw { response: { status: 403, data: { message: "discard-secret" } } };
    return get(path, options);
  };
  setup.render().view.props.onCheck();
  await new Promise(setImmediate);
  const r = setup.render();
  assert.equal(r.view, undefined);
  assert.equal(r.tree.props.user, undefined);
  assert.doesNotMatch(
    setup.h.render(r.tree),
    /Packets, patiently|Chooses a path|Nora Chen/,
  );
});
test("moderation source panels keep the full submitted text and saved answer key without quiz attempts", () => {
  const hooks = profileHookState(),
    setup = moderationSetup({ hooks: hooks.hooks }),
    fixture = moderationApi();
  fixture.state.lessons[0].content = "Full body " + "long text ".repeat(500);
  fixture.state.lessons[0].draftContent = "";
  const library = modLibrary(setup, fixture.state),
    html = setup.h.render(
      createElement(setup.view.ContentReviewView, modProps(library)),
    );
  assert.match(html, /long text long text/);
  assert.match(html, /Marked correct/);
  assert.match(html, /Staged text/);
  assert.match(html, /Empty text/);
  assert.match(html, /does not replace the question set/);
  assert.doesNotMatch(html, /discard-email|discard-password/);
});
test("moderation confirmation retains specific feedback after cancellation and requires deliberate rejection", () => {
  const state = profileHookState(),
    setup = moderationSetup({ hooks: state.hooks }),
    fixture = moderationApi(),
    library = modLibrary(setup, fixture.state);
  let calls = 0,
    last;
  const props = modProps(library, {
      onAction(a) {
        calls++;
        last = a;
      },
    }),
    render = () => {
      state.reset();
      return setup.view.ContentReviewView(props);
    };
  function openReject() {
    const card = walk(render(), (n) => n.type?.name === "LessonCard")[0];
    card.props.onChoose({
      scope: "lesson",
      kind: "reject",
      lesson: library.lessons[0],
    });
    return walk(render(), (n) => n.type === "dialog")[0];
  }
  let d = openReject();
  walk(
    d,
    (n) => n.type === "button" && n.props.children === "Reject lesson",
  )[0].props.onClick();
  assert.equal(calls, 0);
  d = walk(render(), (n) => n.type === "dialog")[0];
  assert.match(setup.h.render(d), /Add specific feedback/);
  walk(d, (n) => n.type === "textarea")[0].props.onChange({
    target: { value: "Explain the routing example." },
  });
  d = walk(render(), (n) => n.type === "dialog")[0];
  d.props.onCancel({ preventDefault() {} });
  assert.equal(calls, 0);
  d = openReject();
  assert.equal(
    walk(d, (n) => n.type === "textarea")[0].props.value,
    "Explain the routing example.",
  );
  walk(
    d,
    (n) => n.type === "button" && n.props.children === "Reject lesson",
  )[0].props.onClick();
  assert.equal(calls, 1);
  assert.equal(last.reason, "Explain the routing example.");
});
test("moderation global purge confirmation includes all reviewed overdue rows and requires scope acknowledgement", () => {
  const state = profileHookState(),
    setup = moderationSetup({ hooks: state.hooks }),
    fixture = moderationApi();
  fixture.state.roadmaps[0].deleteEffectiveAt = new Date(
    Date.now() - 86400000,
  ).toISOString();
  const library = modLibrary(setup, fixture.state);
  let calls = 0;
  const props = modProps(library, {
      onAction() {
        calls++;
      },
    }),
    render = () => {
      state.reset();
      return setup.view.ContentReviewView(props);
    };
  walk(
    render(),
    (n) => n.type === "button" && n.props.children === "Maintenance",
  )[0].props.onClick();
  let tree = render();
  walk(
    tree,
    (n) =>
      n.type === "button" &&
      Array.isArray(n.props.children) &&
      n.props.children.includes("Review global purge"),
  )[0].props.onClick();
  let d = walk(render(), (n) => n.type === "dialog")[0];
  assert.match(setup.h.render(d), /outside your filters/);
  assert.match(setup.h.render(d), /Network foundations/);
  walk(
    d,
    (n) =>
      n.type === "button" &&
      n.props.children === "Purge all overdue permanently",
  )[0].props.onClick();
  assert.equal(calls, 0);
  walk(
    d,
    (n) => n.type === "input" && n.props.type === "checkbox",
  )[0].props.onChange({ target: { checked: true } });
  d = walk(render(), (n) => n.type === "dialog")[0];
  walk(
    d,
    (n) =>
      n.type === "button" &&
      n.props.children === "Purge all overdue permanently",
  )[0].props.onClick();
  assert.equal(calls, 1);
});
test("moderation missing and loading data stay unknown rather than displaying a false empty queue", () => {
  const hooks = {
      useEffect() {},
      useRef: (v) => ({ current: v }),
      useState: (v) => [typeof v === "function" ? v() : v, () => {}],
    },
    setup = moderationSetup({ hooks });
  for (const props of [
    modProps(undefined, { loading: true }),
    modProps(undefined, { error: "Unavailable" }),
  ]) {
    const tree = setup.view.ContentReviewView(props),
      totals = walk(
        tree,
        (n) => n.props?.["aria-label"] === "Checked review totals",
      )[0];
    assert.equal((setup.h.render(totals).match(/—/g) || []).length, 3);
    assert.doesNotMatch(setup.h.render(tree), /No lessons match/);
  }
});
test("moderation classic appearance starts no GUI reads and CLI handoff preserves learning location", () => {
  const setup = moderationSetup({
      mode: { ready: true, isCli: true, location: { kind: "root" } },
    }),
    Page = setup.h.load(
      new URL("../content-review/gui-content-review.tsx", import.meta.url),
    ).ContentReviewPage,
    tree = Page();
  walk(tree, (n) => n.type === "button")[0].props.onClick();
  assert.equal(setup.h.queryCalls.length, 0);
  assert.equal(setup.h.calls.at(-1)[1], "gui");
  assert.equal(setup.h.calls.at(-1)[2].navigate, false);
});

// Checkpoint 27: admin jobs use real account scope, explicit one-ID acknowledgement.
function adminJobsSetup(options = {}) {
  const h = roadmapHarness({
    authUser: adminActor,
    authToken: "jobs-session",
    ...options,
  });
  return {
    h,
    client: h.load(
      new URL("../admin-jobs/admin-jobs-client.ts", import.meta.url),
    ),
    view: h.load(new URL("../admin-jobs/admin-jobs-view.tsx", import.meta.url)),
    data: h.load(new URL("../generation/generation-data.ts", import.meta.url)),
  };
}
function adminJobsApi() {
  const state = {
    user: { ...adminActor },
    job: generationJobRaw({
      requestedByUserId: adminActor.id,
      status: "completed",
      resultSummary: generationSummary,
    }),
    calls: [],
    fail: null,
    ack: 1,
    readFailure: false,
  };
  const api = {
    async get(path, options) {
      state.calls.push(["GET", path, options]);
      if (path === "/users/me") return { data: state.user };
      if (state.readFailure) throw new Error("private provider detail");
      if (path.endsWith("/active")) return { data: [] };
      if (path.endsWith("/results"))
        return { data: state.job.acknowledgedAt ? [] : [state.job] };
      return { data: state.job };
    },
    async post(path, body) {
      state.calls.push(["POST", path, body]);
      if (state.fail) throw state.fail;
      state.job = { ...state.job, acknowledgedAt: "2026-10-29T00:00:00Z" };
      return { data: { acknowledged: state.ack } };
    },
  };
  return { state, api };
}
function adminJobsProps(setup, patch = {}) {
  const job = setup.data.parseGenerationJob(
    generationJobRaw({
      requestedByUserId: adminActor.id,
      status: "completed",
      resultSummary: generationSummary,
    }),
    adminActor,
  );
  return {
    feed: {
      user: adminActor,
      active: [],
      results: [job],
      loadedAt: "2026-10-29T00:00:00Z",
    },
    pending: false,
    busy: false,
    lookupError: "",
    notice: "",
    paused: false,
    recovered: false,
    onRefresh() {},
    onLookup() {},
    onReview() {},
    onRecover() {},
    onAdopt() {},
    ...patch,
  };
}
test("admin jobs feed checks the same admin before and after owner-scoped reads", async () => {
  const { state, api } = adminJobsApi(),
    { client } = adminJobsSetup({ api });
  const feed = await client.loadAdminJobs(adminActor);
  assert.equal(feed.results.length, 1);
  assert.deepEqual(
    state.calls.map((c) => c[1]),
    [
      "/users/me",
      "/ai-generate/jobs/active",
      "/ai-generate/jobs/results",
      "/users/me",
    ],
  );
  assert.equal(feed.results[0].requestedByUserId, adminActor.id);
  assert.equal(feed.results[0].requestedBy, undefined);
});
test("admin jobs lookup accepts a known different requester but refuses foreign acknowledgement", async () => {
  const { state, api } = adminJobsApi(),
    { client } = adminJobsSetup({ api });
  state.job.requestedByUserId = generationGuid(999);
  const job = await client.inspectAdminJob(adminActor, state.job.id);
  assert.equal(job.requestedByUserId, generationGuid(999));
  await assert.rejects(
    client.acknowledgeAdminJob(adminActor, job),
    /Only your own/,
  );
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 0);
});
test("admin jobs never expose private server errors or malformed lookup records", async () => {
  for (const patch of [
    { id: generationGuid(888) },
    { status: "unknown" },
    { requestedByUserId: "../bad" },
    { progressCurrent: -1 },
  ]) {
    const { state, api } = adminJobsApi(),
      { client } = adminJobsSetup({ api });
    Object.assign(state.job, patch);
    await assert.rejects(
      client.inspectAdminJob(adminActor, generationGuid(100)),
      /couldn’t be checked/,
    );
  }
  const { state, api } = adminJobsApi(),
    { client } = adminJobsSetup({ api });
  state.readFailure = true;
  await assert.rejects(
    client.loadAdminJobs(adminActor),
    (e) => !e.message.includes("private provider"),
  );
});
test("admin jobs invalid UUID makes no request", async () => {
  const { state, api } = adminJobsApi(),
    { client } = adminJobsSetup({ api });
  await assert.rejects(
    client.inspectAdminJob(adminActor, "../jobs"),
    /complete job UUID/,
  );
  assert.equal(state.calls.length, 0);
});
test("admin jobs reject role/account changes and foreign feed rows", async () => {
  for (const kind of ["role", "actor", "owner"]) {
    const { state, api } = adminJobsApi(),
      { client } = adminJobsSetup({ api });
    if (kind === "role") state.user.role = "developer";
    if (kind === "actor") state.user.id = generationGuid(999);
    if (kind === "owner") state.job.requestedByUserId = generationGuid(999);
    await assert.rejects(client.loadAdminJobs(adminActor));
  }
});
test("admin jobs session replacement prevents reads and acknowledgement", async () => {
  let token = "jobs-session";
  const { state, api } = adminJobsApi(),
    { client, data } = adminJobsSetup({ api, authToken: () => token });
  const before = data.parseGenerationJob(state.job, adminActor);
  token = "other";
  await assert.rejects(
    client.loadAdminJobs(adminActor, undefined, "jobs-session"),
  );
  await assert.rejects(
    client.acknowledgeAdminJob(adminActor, before, "jobs-session"),
  );
  assert.equal(state.calls.length, 0);
});
test("admin jobs acknowledgement sends exactly one owned ID and checks saved row and unread feed", async () => {
  const { state, api } = adminJobsApi(),
    { client, data } = adminJobsSetup({ api });
  const result = await client.acknowledgeAdminJob(
    adminActor,
    data.parseGenerationJob(state.job, adminActor),
  );
  assert.ok(result.job.acknowledgedAt);
  assert.equal(result.feed.results.length, 0);
  const posts = state.calls.filter((c) => c[0] === "POST");
  assert.equal(posts.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(posts[0][2])), {
    jobIds: [state.job.id],
  });
});
test("admin jobs changed selected results block the write", async () => {
  const { state, api } = adminJobsApi(),
    { client, data } = adminJobsSetup({ api });
  const before = data.parseGenerationJob(state.job, adminActor);
  state.job.model = "changed";
  await assert.rejects(
    client.acknowledgeAdminJob(adminActor, before),
    /changed/,
  );
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 0);
});
test("admin jobs all sent acknowledgement failures remain uncertain with no replay", async () => {
  for (const variant of ["transport", "4xx", "bad-ack", "readback"]) {
    const { state, api } = adminJobsApi(),
      { client, data } = adminJobsSetup({ api });
    const before = data.parseGenerationJob(state.job, adminActor);
    if (variant === "transport") state.fail = new Error();
    if (variant === "4xx") state.fail = { response: { status: 400 } };
    if (variant === "bad-ack") state.ack = 8;
    if (variant === "readback") {
      api.post = async (path, body) => {
        state.calls.push(["POST", path, body]);
        state.readFailure = true;
        return { data: { acknowledged: 1 } };
      };
    }
    await assert.rejects(
      client.acknowledgeAdminJob(adminActor, before),
      (e) => e.uncertain === true,
    );
    assert.equal(state.calls.filter((c) => c[0] === "POST").length, 1);
  }
});
test("admin jobs recovery reads never acknowledge", async () => {
  const { state, api } = adminJobsApi(),
    { client } = adminJobsSetup({ api });
  await client.loadAdminJobs(adminActor);
  await client.inspectAdminJob(adminActor, state.job.id);
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 0);
});
test("admin jobs view explains owner scope, result cap and content approval boundary", () => {
  const setup = adminJobsSetup(),
    html = setup.h.render(
      createElement(setup.view.AdminJobsView, adminJobsProps(setup)),
    );
  for (const text of [
    /your account/,
    /newest 20/,
    /not a complete job history/,
    /does not approve generated content/,
    /no platform-wide job listing API/,
    /Full job UUID/,
  ])
    assert.match(html, text);
  assert.doesNotMatch(html, /No unread results/);
});
test("admin jobs view separates pending, failed and genuine empty lists", () => {
  const setup = adminJobsSetup();
  for (const [patch, match] of [
    [{ pending: true, feed: undefined }, /Checking your jobs/],
    [{ error: "Not checked", feed: undefined }, /Jobs unavailable/],
    [{}, /No active jobs in the checked response/],
  ]) {
    const html = setup.h.render(
      createElement(setup.view.AdminJobsView, adminJobsProps(setup, patch)),
    );
    assert.match(html, match);
  }
});
test("admin jobs paused recovery requires explicit checked-state adoption", () => {
  const setup = adminJobsSetup({ hooks: profileHookState().hooks });
  let adopts = 0;
  const tree = setup.view.AdminJobsView(
    adminJobsProps(setup, {
      paused: true,
      recovered: true,
      onAdopt() {
        adopts++;
      },
    }),
  );
  assert.match(setup.h.render(tree), /Acknowledgements paused/);
  walk(
    tree,
    (n) =>
      n.type === "button" &&
      n.props.children === "Use checked state and resume",
  )[0].props.onClick();
  assert.equal(adopts, 1);
});
test("admin jobs GUI navigation remains inside admin shell and classic handoff uses admin commands", () => {
  const setup = adminJobsSetup();
  const html = setup.h.render(
    createElement(
      setup.h.shell.GuiWorkspaceShell,
      { shell: "admin", user: adminActor },
      "Sample",
    ),
  );
  assert.match(html, /href="\/admin\/jobs"/);
  const classic = adminJobsSetup({ mode: { ready: true, isCli: true } });
  const Page = classic.h.load(
    new URL("../admin-jobs/gui-admin-jobs.tsx", import.meta.url),
  ).AdminJobsPage;
  assert.match(classic.h.render(Page()), /admin\/terminal\?view=jobs/);
  assert.equal(classic.h.queryCalls.length, 0);
});

function adminJobsController(options = {}) {
  const state = profileHookState(),
    first = adminJobsSetup(),
    props = adminJobsProps(first);
  const query = {
    data: props.feed,
    isFetching: false,
    isPending: false,
    isError: false,
    refetch: async () => ({ isError: false }),
  };
  const setup = adminJobsSetup({
    hooks: state.hooks,
    queries: { [`admin/jobs/${adminActor.id}/admin`]: query },
    ...options,
  });
  const Controller = setup.h.load(
    new URL("../admin-jobs/gui-admin-jobs.tsx", import.meta.url),
  ).GuiAdminJobs;
  return {
    ...setup,
    query,
    render() {
      state.reset();
      const tree = Controller();
      return {
        tree,
        props: walk(tree, (n) => n.type?.name === "AdminJobsView")[0]?.props,
      };
    },
  };
}
test("admin jobs controller hides fetching, failed and denied cached records", () => {
  for (const kind of ["fetch", "error", "deny"]) {
    const setup = adminJobsController();
    if (kind === "fetch") setup.query.isFetching = true;
    else setup.query.isError = true;
    if (kind === "deny")
      setup.query.error = new setup.client.AdminJobsFailure(
        "Denied",
        false,
        true,
      );
    const result = setup.render();
    assert.equal(result.props?.feed, undefined);
    if (kind === "deny") assert.equal(result.props, undefined);
  }
});
test("admin jobs controller deduplicates refreshes synchronously", async () => {
  let release,
    calls = 0;
  const setup = adminJobsController();
  setup.query.refetch = async () => {
    calls++;
    await new Promise((resolve) => (release = resolve));
    return { isError: false };
  };
  const { props } = setup.render();
  props.onRefresh();
  props.onRefresh();
  assert.equal(calls, 1);
  assert.equal(setup.render().props.busy, true);
  release();
  await new Promise(setImmediate);
  assert.equal(setup.render().props.busy, false);
  assert.match(setup.render().props.notice, /Jobs refreshed/);
});
test("admin jobs controller invalidates a session between render and action", () => {
  let token = "jobs-session";
  const setup = adminJobsController({ authToken: () => token });
  const { props } = setup.render();
  token = "new-session";
  props.onLookup(generationGuid(100));
  const next = setup.render();
  assert.equal(next.props, undefined);
  assert.equal(next.tree.props.user, undefined);
});
test("admin jobs controller keeps uncertain acknowledgements paused through failed recovery", async () => {
  const { api, state } = adminJobsApi(),
    setup = adminJobsController({ api });
  state.fail = new Error("Network");
  let { props } = setup.render();
  props.onReview(props.feed.results[0]);
  props.onReview(props.feed.results[0]);
  await new Promise(setImmediate);
  props = setup.render().props;
  assert.equal(props.paused, true);
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 1);
  state.readFailure = true;
  props.onRecover();
  await new Promise(setImmediate);
  props = setup.render().props;
  assert.equal(props.paused, true);
  assert.equal(props.recovered, false);
  state.readFailure = false;
  props.onRecover();
  await new Promise(setImmediate);
  props = setup.render().props;
  assert.equal(props.paused, true);
  assert.equal(props.recovered, true);
  props.onAdopt();
  assert.equal(setup.render().props.paused, false);
  assert.equal(setup.render().props.earlier, true);
  assert.equal(state.calls.filter((c) => c[0] === "POST").length, 1);
  assert.match(
    setup.render().props.notice,
    /earlier acknowledgement may still finish/,
  );
});
