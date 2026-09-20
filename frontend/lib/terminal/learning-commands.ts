/* ==========================================================================
   source:dev terminal — learning commands
   --------------------------------------------------------------------------
   Everything a student does lives here: browsing roadmaps, reading a lesson,
   answering its quiz, and running the Q&A board. Nothing routes away to a
   separate page and nothing renders as a panel — a listing is aligned columns
   the way `ls -l` prints them, a lesson is a paged block the way `man` prints
   one, a quiz is a sequence of prompts, and the commands that follow any of
   them are `[tokens]` printed inline at the end of a line. Clicking a token
   types its command, so the pointer and the keyboard take the same path.
   ========================================================================== */

import { api } from "./request";
import {
  stuck,
  currentConcept,
  setCurrentConcept,
  conceptFooter,
} from "./output";
import type {
  RoadmapProgressData,
  ConceptProgressInfo,
} from "@/lib/hooks/use-roadmap-progress";
import type { CommandCtx, CommandSpec, TerminalAction } from "./commands";

/** The shortest input worth spending a metered AI generation on. Below this,
 *  or with no letters at all, the question is bounced before the request. */
const MIN_QUESTION = 10;

interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}
interface Progress {
  conceptId: string;
  status: string;
  updatedAt: string;
  createdAt: string;
}
interface ReviewItem {
  id: string;
  question: {
    conceptTitle: string;
    questionText: string;
    options: Array<{ id: string; optionText: string; orderIndex: number }>;
  };
}
interface ReviewResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  newIntervalDays: number;
  xpAwarded: number;
}
interface ConceptSummary {
  id: string;
  title: string;
  slug?: string;
}
interface ConceptDetail extends ConceptSummary {
  content: string;
  difficulty?: "easy" | "medium" | "hard";
  appearsIn?: Array<{
    moduleId: string;
    moduleTitle: string;
    roadmapId: string;
    roadmapTitle: string;
    orderIndex: number;
  }>;
}
interface McqQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  options: Array<{ id: string; optionText: string; orderIndex: number }>;
}
interface QuestionStatus {
  questionId: string;
  attemptsRemaining: number;
  isCorrect: boolean;
  isResolved: boolean;
  correctOptionId?: string;
}
interface QuizStatus {
  totalQuestions: number;
  allQuestionsResolved: boolean;
  questions: QuestionStatus[];
}
interface AttemptResult {
  isCorrect: boolean;
  attemptsRemaining: number;
  correctOptionId?: string;
}
interface QaAnswer {
  id: string;
  isAiAnswer?: boolean;
  body: string;
  createdAt: string;
  instructorName?: string | null;
  instructor?: { id: string; name: string };
}
interface QaThread {
  id: string;
  conceptId: string;
  userId?: string;
  studentId?: string;
  studentName?: string | null;
  body: string;
  createdAt: string;
  updatedAt?: string;
  user?: { id: string; name: string };
  student?: { id: string; name: string };
  answers?: QaAnswer[];
  conceptTitle?: string;
}

// ─── Output helpers ─────────────────────────────────────────────────────────
// The vocabulary every command below prints with. Four shapes, all of them
// lines: a heading, an aligned row, a wrapped paragraph, and a footer of
// inline command tokens. Nothing here draws a box.

/** A section heading in the `ls`/`systemctl` idiom: the name, then a count or
 *  subject after a slash. Blank line above so output breathes without a rule. */
function heading(ctx: CommandCtx, text: string) {
  ctx.io.print("");
  ctx.io.print(text.toUpperCase(), "head");
}

/** An indented status line: `[OK]`-style marker, subject, then detail. The
 *  marker column is fixed so a listing scans vertically. `STATE` is short on
 *  purpose — `IN PROGRESS` becomes `WIP` — because on a 360px screen a long
 *  badge pushes the title off the line. */
function entry(
  ctx: CommandCtx,
  marker: string,
  title: string,
  actions?: TerminalAction[],
) {
  ctx.io.print(`  ${marker.padEnd(9)} ${title}`, "out", actions);
}

/** Continuation detail under an `entry`, indented past the marker column so
 *  it reads as belonging to the line above it. */
function detail(ctx: CommandCtx, text: string) {
  ctx.io.print(`            ${text}`, "dim");
}

/** The commands that follow whatever was just printed, as one line of inline
 *  tokens under an arrow — the shape a CLI uses to suggest the next verb. */
function next(ctx: CommandCtx, actions: TerminalAction[], lead = "→") {
  if (!actions.length) return;
  ctx.io.print(lead, "dim", actions);
}

/** Choose one row: arrow keys where the host offers them, a typed number or
 *  word everywhere else. Returns the picked row index. `aliases` names the
 *  words that pick each row — `skip`, `ai` — so typing keeps working where
 *  digits were never the interface. Esc aborts the command: the rejection
 *  carries `CommandAborted`, so callers never handle "no choice" as one. */
async function pickRow(
  ctx: CommandCtx,
  prompt: string,
  rows: string[],
  aliases: string[][] = [],
): Promise<number> {
  if (ctx.io.select) return ctx.io.select(prompt, rows);
  rows.forEach((row, i) => ctx.io.print(`  ${i + 1}. ${row}`));
  for (;;) {
    const reply = (
      await ctx.io.ask(`${prompt} — answer 1–${rows.length}`)
    ).trim();
    if (/^\d+$/.test(reply)) {
      const at = Number(reply) - 1;
      if (at >= 0 && at < rows.length) return at;
    } else {
      const word = reply.toLowerCase();
      const hit = aliases.findIndex((names) =>
        names.some((name) => name.toLowerCase() === word),
      );
      if (hit !== -1) return hit;
    }
    ctx.io.print(`Enter a number from 1 to ${rows.length}.`, "err");
  }
}

/** Flow a markdown body as terminal text. Falls back to printing it raw when
 *  the host has no markdown renderer, which is what the dashboard's one-line
 *  prompt does. */
function body(ctx: CommandCtx, markdown: string) {
  if (ctx.io.doc) return ctx.io.doc(markdown);
  ctx.io.print(markdown);
}

const catalog = async () => (await api.get<Roadmap[]>("/roadmaps")).data;
const progressFor = async (id: string) =>
  (
    await api.get<RoadmapProgressData>(
      `/roadmaps/${encodeURIComponent(id)}/progress`,
    )
  ).data;
const unlocked = (concept: ConceptProgressInfo) =>
  !(concept.prerequisites ?? []).some((p) => !p.isCompletedByCurrentUser);

export function nextConcept(concepts: ConceptProgressInfo[]) {
  return (
    concepts.find((c) => c.status === "in_progress" && unlocked(c)) ??
    concepts.find((c) => c.status === "not_started" && unlocked(c))
  );
}

async function findRoadmap(value: string): Promise<Roadmap> {
  const all = await catalog();
  // No listing numbers roadmaps any more — `ls` prints names, not a numbered
  // index — so a roadmap is named by its directory name, title, slug or id.
  const query = value.toLowerCase();
  const exact = all.find(
    (r) =>
      r.id === value ||
      r.slug?.toLowerCase() === query ||
      r.title.toLowerCase() === query,
  );
  if (exact) return exact;
  const matches = all.filter((r) => r.title.toLowerCase().includes(query));
  if (matches.length === 1) return matches[0];
  throw new Error(
    matches.length
      ? "Several roadmaps match. Use the full title, or the directory name ls prints."
      : "Roadmap not found. Run ls at the root to see the available paths.",
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const conceptList = async () =>
  (await api.get<ConceptSummary[]>("/concepts")).data;

/** Accept an id, a slug, an exact title, or an unambiguous fragment, so
 *  a lesson can be named however the reader has it at hand. Bare numbers
 *  never resolve here: a digit is not a lesson, and guessing would aim a
 *  quiz or a completion at the wrong one. */
async function findConceptId(value: string): Promise<string> {
  if (UUID.test(value)) return value;
  const all = await conceptList();
  const query = value.toLowerCase();
  const exact = all.find(
    (c) =>
      c.id === value ||
      c.slug?.toLowerCase() === query ||
      c.title.toLowerCase() === query,
  );
  if (exact) return exact.id;
  const matches = all.filter((c) => c.title.toLowerCase().includes(query));
  if (matches.length === 1) return matches[0].id;
  throw new Error(
    matches.length
      ? `Several lessons match “${value}”. Use the full title, or the name ls prints.`
      : `No lesson matches “${value}”. Browse what is published with ls and cd.`,
  );
}

function navigate(ctx: CommandCtx, path: string) {
  if (!ctx.navigate)
    throw new Error("Open the full-screen terminal to navigate.");
  ctx.navigate(path);
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Lessons ────────────────────────────────────────────────────────────────

/** Fetch a lesson and print it. Marking it started is the same side effect the
 *  old reading page had on mount, so progress behaves identically — it is just
 *  no longer a route. The lesson prints like a man page: a header line naming
 *  the section, the body, then the verbs that follow it. */
async function showConcept(ctx: CommandCtx, conceptId: string) {
  ctx.io.print("loading lesson…", "dim");
  const { data: concept } = await api.get<ConceptDetail>(
    `/concepts/${encodeURIComponent(conceptId)}`,
  );
  setCurrentConcept({ id: conceptId, title: concept.title });
  await api.post(`/concepts/${encodeURIComponent(conceptId)}/start`).catch(
    () => {
      /* Already started — the endpoint is idempotent from the caller's view. */
    },
  );

  const roadmapId = concept.appearsIn?.[0]?.roadmapId;
  const [quiz, roadmapProgress] = await Promise.all([
    api
      .get<QuizStatus>(`/concepts/${encodeURIComponent(conceptId)}/quiz-status`)
      .then((r) => r.data)
      .catch(() => undefined),
    roadmapId ? progressFor(roadmapId).catch(() => undefined) : undefined,
  ]);

  const here = roadmapProgress?.concepts?.find((c) => c.conceptId === conceptId);
  const completed = here?.status === "completed";
  const unmet = (here?.prerequisites ?? []).filter(
    (p) => !p.isCompletedByCurrentUser,
  );
  const questionCount = quiz?.totalQuestions ?? 0;
  const resolved = quiz?.questions.filter((q) => q.isResolved).length ?? 0;

  const state = completed
    ? "COMPLETED"
    : quiz?.allQuestionsResolved
      ? "RESOLVED"
      : here?.status === "in_progress"
        ? "IN PROGRESS"
        : "READING";

  // `man`'s header line: left is what you are reading, right is its section.
  ctx.io.print("");
  ctx.io.print(`LESSON(1)   ${concept.title.toUpperCase()}   [${state}]`, "head");
  ctx.io.print(
    [
      concept.appearsIn?.[0]?.roadmapTitle,
      concept.difficulty && `difficulty: ${concept.difficulty}`,
      questionCount
        ? `knowledge check: ${resolved}/${questionCount} resolved`
        : "no knowledge check",
    ]
      .filter(Boolean)
      .join(" · "),
    "dim",
  );
  if (unmet.length)
    ctx.io.print(
      `[!] Recommended first: ${unmet.map((p) => p.title).join(", ")}`,
      "err",
    );

  const content = concept.content || "";
  // A long lesson gets a jump index under its header, the way `man` lists its
  // sections: plain text, numbered, and the numbers are commands.
  const sections = sectionsOf(content);
  rememberSections(sections);
  if (sections.length > 1) {
    ctx.io.print("");
    const label = (s: Section, i: number) => `[${i + 1}] ${s.title}`;
    if (ctx.io.say)
      ctx.io.say(
        [
          "SECTIONS: ",
          ...sections.flatMap((s, i) => [
            { label: label(s, i), command: `jump ${i + 1}` },
            "   ",
          ]),
        ],
        "dim",
      );
    else
      ctx.io.print(
        `SECTIONS: ${sections.map(label).join("   ")}`,
        "dim",
        sections.map((s, i) => ({
          label: String(i + 1),
          command: `jump ${i + 1}`,
        })),
      );
    ctx.io.print("jump <n> reopens one · a bare number works too", "dim");
  }
  ctx.io.print("", "rule");

  body(ctx, content || "_No content has been published for this lesson yet._");

  ctx.io.print("", "rule");

  const following = roadmapProgress
    ? nextConcept(
        (roadmapProgress.concepts ?? []).filter(
          (c) => c.conceptId !== conceptId,
        ),
      )
    : undefined;

  // Token labels are the command verb, never the id — an inline `[quiz]`
  // stays readable at 360px where `[quiz 550e8400-…]` would not, and clicking
  // it still runs the full line.
  next(ctx, [
    ...(questionCount
      ? [{ label: "quiz", command: `quiz ${concept.id}` }]
      : completed
        ? []
        : [{ label: "complete", command: `complete ${concept.id}` }]),
    { label: "qa ask", command: `qa ask ${concept.id}` },
    { label: "qa concept", command: `qa concept ${concept.id}` },
    ...(following
      ? [{ label: "cat next", command: `cat ${following.conceptId}` }]
      : []),
  ]);

  // The closing line names what follows the lesson in words, not just tokens:
  // a quiz when there is one, the by-hand finish when there isn't. Skipped
  // when the quiz state itself never arrived — unknown is not none.
  if (quiz !== undefined)
    stuck(ctx.io, "", conceptFooter(concept.id, questionCount));
}

// ─── Lesson sections ────────────────────────────────────────────────────────
// A long lesson is easier to walk if its headings are addressable. The body is
// markdown, so the headings are already there — this reads them out, numbers
// them, and keeps the last lesson's around so `jump 3` can reprint one.

interface Section {
  title: string;
  content: string;
}

/** Markdown ATX headings, with the text that follows each. A lesson with no
 *  headings is one section, which the caller treats as "no index needed". */
function sectionsOf(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  let fenced = false;
  for (const line of lines) {
    // A `#` inside a code fence is code, not a heading.
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[2].replace(/[*_`]/g, ""), content: line };
      continue;
    }
    if (current) current.content += `\n${line}`;
  }
  if (current) sections.push(current);
  return sections;
}

/** The sections of the lesson currently on screen, so `jump` knows what the
 *  numbers printed under its header refer to. Memory only. */
let lessonSections: Section[] = [];
function rememberSections(sections: Section[]) {
  lessonSections = sections;
}

const jump: CommandSpec = {
  name: "jump",
  usage: "jump <n>",
  help: {
    usage: "jump <n>",
    description: [
      "Jump to a numbered section of the lesson on screen. The numbers come",
      "from the header the lesson printed, so `3` alone means the same thing.",
    ],
    args: [{ name: "<n>", text: "A section number from the lesson header" }],
    examples: ["jump 2", "3"],
  },
  summary: "reopen one section of the lesson you are reading",
  group: "learn",
  run: (ctx) => {
    if (!lessonSections.length) {
      stuck(
        ctx.io,
        "No lesson is open.",
        "Open one with {continue}, browse for one with {ls}, or name it directly with {cat}.",
      );
      return;
    }
    const token = ctx.args[0] ?? "";
    const at = Number(token) - 1;
    if (!/^\d+$/.test(token) || at < 0 || at >= lessonSections.length) {
      ctx.io.print(
        `jump: enter a section number from 1 to ${lessonSections.length}.`,
        "err",
      );
      ctx.io.print(
        `sections: ${lessonSections.map((s, i) => `[${i + 1}] ${s.title}`).join("  ")}`,
        "dim",
      );
      return;
    }
    const section = lessonSections[at];
    ctx.io.print("");
    ctx.io.print(`§ ${at + 1}. ${section.title}`, "head");
    ctx.io.print("", "rule");
    body(ctx, section.content);
    stuck(
      ctx.io,
      "",
      "Sections are numbered above · jump <n> opens another one.",
    );
  },
};

const quiz: CommandSpec = {
  name: "quiz",
  usage: "quiz [lesson]",
  completes: "path",
  help: {
    usage: "quiz [lesson]",
    description: [
      "Answer a lesson's quiz here at the prompt: one question at a time,",
      "numbered options, and the result after each answer.",
      "Attempts are limited per question, and the count left is shown as you go.",
      "With no lesson, quizzes the lesson on screen — the last one cat, less",
      "or continue showed.",
    ],
    args: [
      {
        name: "[lesson]",
        text: "Name, title, or an unambiguous fragment; the lesson on screen when omitted",
      },
    ],
    examples: ["quiz", "quiz what-is-voip"],
  },
  summary: "answer a lesson's knowledge check",
  group: "learn",
  run: async (ctx) => {
    let conceptId: string;
    if (!ctx.args.length) {
      const onScreen = currentConcept();
      if (!onScreen) {
        ctx.io.print("usage: quiz <lesson title or id>", "dim");
        return;
      }
      conceptId = onScreen.id;
    } else {
      conceptId = await findConceptId(ctx.args.join(" "));
    }
    setCurrentConcept({ id: conceptId });
    const [questions, status] = await Promise.all([
      api
        .get<McqQuestion[]>(`/concepts/${encodeURIComponent(conceptId)}/questions`)
        .then((r) => r.data)
        .catch(() => [] as McqQuestion[]),
      api
        .get<QuizStatus>(`/concepts/${encodeURIComponent(conceptId)}/quiz-status`)
        .then((r) => r.data)
        .catch(() => undefined),
    ]);

    if (!questions.length) {
      stuck(
        ctx.io,
        "This lesson has no knowledge check.",
        `Lessons without one are finished by hand: {complete:complete ${conceptId}} marks it done, {cat:cat ${conceptId}} reopens it, or {continue} moves you on.`,
      );
      return;
    }

    const statusFor = new Map(
      (status?.questions ?? []).map((q) => [q.questionId, q]),
    );
    const ordered = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);
    let correct = 0;
    let stopped = false;

    for (const [index, question] of ordered.entries()) {
      const known = statusFor.get(question.id);
      const options = [...question.options].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      ctx.io.print("");
      ctx.io.print(`[${index + 1}/${ordered.length}] ${question.questionText}`, "head");

      if (known?.isResolved) {
        const answer = options.find((o) => o.id === known.correctOptionId);
        if (known.isCorrect) correct += 1;
        ctx.io.print(
          known.isCorrect
            ? `[OK] Already answered correctly.`
            : `Already resolved. Correct answer: ${answer?.optionText ?? "unavailable"}`,
          known.isCorrect ? "ok" : "dim",
        );
        continue;
      }

      if (!options.length) {
        ctx.io.print("This question has no answer options.", "err");
        continue;
      }

      let remaining = known?.attemptsRemaining ?? 3;

      while (remaining > 0) {
        // One call for both hosts: arrows where they exist, a numbered list
        // everywhere else. The two escapes ride along as rows so the words
        // keep working too — `skip` is still `skip`.
        const at = await pickRow(
          ctx,
          `Choose · ${plural(remaining, "attempt")} left`,
          [...options.map((o) => o.optionText), "skip this question", "stop for now"],
          [...options.map(() => [] as string[]), ["skip"], ["stop"]],
        );
        if (at === options.length + 1) {
          stopped = true;
          break;
        }
        if (at === options.length) break;

        const picked = at;
        const { data: result } = await api.post<AttemptResult>(
          `/questions/${encodeURIComponent(question.id)}/attempt`,
          { selectedOptionId: options[picked].id },
        );
        remaining = result.attemptsRemaining;

        if (result.isCorrect) {
          correct += 1;
          ctx.io.print("[OK] Correct.", "ok");
          break;
        }
        if (remaining > 0) {
          ctx.io.print(
            `Not quite. ${plural(remaining, "attempt")} left.`,
            "err",
          );
          continue;
        }
        ctx.io.print(
          `Out of attempts. Correct answer: ${
            options.find((o) => o.id === result.correctOptionId)?.optionText ??
            "unavailable"
          }`,
          "err",
        );
      }

      if (stopped) break;
    }

    const final = await api
      .get<QuizStatus>(`/concepts/${encodeURIComponent(conceptId)}/quiz-status`)
      .then((r) => r.data)
      .catch(() => undefined);

    if (final?.allQuestionsResolved) {
      ctx.io.print("");
      ctx.io.print("[OK] Lesson mastered · XP awarded.", "ok");
      await ctx.refreshLearning?.();
    }

    ctx.io.print("");
    ctx.io.print(
      `${stopped ? "quiz: paused" : "quiz: complete"} — ${correct}/${ordered.length} correct${
        final?.allQuestionsResolved ? " · mastered" : ""
      }`,
      final?.allQuestionsResolved ? "ok" : "out",
    );
    next(ctx, [
      ...(final?.allQuestionsResolved
        ? []
        : [{ label: "quiz", command: `quiz ${conceptId}` }]),
      { label: "cat", command: `cat ${conceptId}` },
      { label: "continue", command: "continue" },
    ]);
  },
};

const complete: CommandSpec = {
  name: "complete",
  usage: "complete [lesson]",
  completes: "path",
  help: {
    usage: "complete [lesson]",
    description: [
      "Mark a lesson finished and collect the XP for it. Refuses while the",
      "lesson still has an unresolved quiz, which is the same rule the old",
      "reading page enforced.",
      "With no lesson, completes the lesson on screen — the last one cat,",
      "less or continue showed.",
    ],
    args: [
      {
        name: "[lesson]",
        text: "Name, title, or an unambiguous fragment; the lesson on screen when omitted",
      },
    ],
    examples: ["complete", "complete what-is-voip"],
  },
  summary: "mark a lesson without a quiz as finished",
  group: "learn",
  run: async (ctx) => {
    let conceptId: string;
    if (!ctx.args.length) {
      const onScreen = currentConcept();
      if (!onScreen) {
        ctx.io.print("usage: complete <lesson title or id>", "dim");
        return;
      }
      conceptId = onScreen.id;
    } else {
      conceptId = await findConceptId(ctx.args.join(" "));
    }
    setCurrentConcept({ id: conceptId });
    await api.post(`/concepts/${encodeURIComponent(conceptId)}/complete`);
    ctx.io.print("[OK] Lesson marked complete · streak and XP updated.", "ok");
    await ctx.refreshLearning?.();
    next(ctx, [
      { label: "continue", command: "continue" },
      { label: "ls", command: "ls" },
    ]);
  },
};

const continueLearning: CommandSpec = {
  name: "continue",
  aliases: ["resume"],
  usage: "continue [roadmap]",
  help: {
    usage: "continue [roadmap]",
    description: [
      "Pick up where you stopped: the most recent unfinished lesson, or the",
      "next unlocked one when nothing is in progress.",
      "With a roadmap, the next unlocked lesson inside that path only.",
    ],
    args: [{ name: "[roadmap]", text: "Stay inside this path" }],
    examples: ["continue", "continue voip-basics", "resume"],
  },
  summary: "resume your latest lesson or the next unlocked concept",
  group: "learn",
  run: async (ctx) => {
    if (ctx.args.length) {
      const roadmap = await findRoadmap(ctx.args.join(" "));
      const progress = await progressFor(roadmap.id);
      const next = nextConcept(progress.concepts ?? []);
      if (!next) {
        stuck(
          ctx.io,
          `Nothing unfinished and unlocked in ${roadmap.title}.`,
          "Browse the paths with {ls}, resume somewhere else with {continue}, or catch up on recall with {review}.",
        );
        return;
      }
      await showConcept(ctx, next.conceptId);
      return;
    }
    const [all, recent] = await Promise.all([
      catalog(),
      api.get<Progress[]>("/progress/me").then((r) => r.data),
    ]);
    const results = await Promise.allSettled(all.map((r) => progressFor(r.id)));
    const available = results.flatMap((r) =>
      r.status === "fulfilled" ? (r.value.concepts ?? []) : [],
    );
    const inProgress = recent
      .filter((p) => p.status === "in_progress")
      .sort(
        (a, b) =>
          Date.parse(b.updatedAt || b.createdAt) -
          Date.parse(a.updatedAt || a.createdAt),
      );
    const latest = inProgress
      .map((p) =>
        available.find((c) => c.conceptId === p.conceptId && unlocked(c)),
      )
      .find(Boolean);
    const next = latest ?? nextConcept(available);
    if (!next) {
      if (results.some((r) => r.status === "rejected"))
        throw new Error(
          "Some learning progress could not load. Try continue again.",
        );
      stuck(
        ctx.io,
        "No unfinished, unlocked lessons right now.",
        "Try browsing your paths ({ls}), catching up on review ({review}), or asking a question ({qa}).",
      );
      return;
    }
    await showConcept(ctx, next.conceptId);
  },
};

// ─── Review ─────────────────────────────────────────────────────────────────

const review: CommandSpec = {
  name: "review",
  usage: "review [start]",
  help: {
    usage: "review [start]",
    description: [
      "Show how many spaced-repetition reviews are due, or answer them.",
      "Bare, it reports the queue. With start, it runs the session here at the",
      "prompt and reschedules each card by how you answered.",
    ],
    commands: [{ name: "start", text: "Answer the due reviews now" }],
    examples: ["review", "review start"],
  },
  summary: "check your queue or answer reviews inside the terminal",
  group: "learn",
  run: async (ctx) => {
    const sub = ctx.args[0];
    if (sub && sub !== "start") {
      ctx.io.print("usage: review [start]", "err");
      return;
    }
    if (!sub) {
      const { data } = await api.get<{
        count?: number;
        dueCount?: number;
      }>("/review/due-count");
      const count = data.dueCount ?? data.count ?? 0;
      heading(ctx, "review / queue");
      entry(
        ctx,
        count ? "[DUE]" : "[CLEAR]",
        count
          ? `${plural(count, "review")} ready to answer`
          : "nothing due — your recall is up to date",
      );
      if (count) next(ctx, [{ label: "review start", command: "review start" }]);
      else
        stuck(
          ctx.io,
          "",
          "Nothing to recall yet. Learn something new with {continue}, browse a path with {ls}, or ask about what you have read with {qa}.",
        );
      return;
    }
    const { data: items } = await api.get<ReviewItem[]>("/review/due");
    if (!items.length) {
      ctx.io.print("No reviews due. Your queue is clear.", "ok");
      stuck(
        ctx.io,
        "",
        "Come back when something is scheduled — until then, {continue} a lesson, browse with {ls}, or check {status}.",
      );
      return;
    }
    let answered = 0;
    let xp = 0;
    for (const item of items) {
      const options = [...item.question.options].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      if (!options.length) {
        ctx.io.print(
          "This question has no answer options. Skipping it for now.",
          "err",
        );
        continue;
      }
      ctx.io.print("");
      ctx.io.print(
        `[${answered + 1}/${items.length}] ${item.question.conceptTitle} — ${item.question.questionText}`,
        "head",
      );
      // Arrows where they exist; pickRow prints the numbered list for the
      // fallback. Esc stops the session, exactly as it always has.
      const selected = await pickRow(
        ctx,
        "Choose",
        options.map((o) => o.optionText),
      );
      const { data: result } = await api.post<ReviewResult>(
        `/review/${encodeURIComponent(item.id)}/answer`,
        { selectedOptionId: options[selected].id },
      );
      answered += 1;
      xp += result.xpAwarded ?? 0;
      ctx.io.print(
        result.isCorrect
          ? `[OK] Correct · +${result.xpAwarded ?? 0} XP`
          : `Incorrect. Correct answer: ${options.find((o) => o.id === result.correctOptionId)?.optionText ?? "unavailable"}`,
        result.isCorrect ? "ok" : "err",
      );
      ctx.io.print(
        `Next review in ${plural(result.newIntervalDays, "day")}.`,
        "dim",
      );
      await ctx.refreshLearning?.();
      if (answered < items.length) {
        const next = (
          await ctx.io.ask("Keep going?", {
            choices: [
              { label: "[next question]", value: "next" },
              { label: "[finish for now]", value: "finish" },
            ],
          })
        )
          .trim()
          .toLowerCase();
        if (next !== "next" && next !== "y" && next !== "yes") break;
      }
    }
    ctx.io.print("");
    ctx.io.print(
      `review: session complete — ${answered} answered · +${xp} XP`,
      "ok",
    );
    next(ctx, [
      { label: "review", command: "review" },
      { label: "continue", command: "continue" },
    ]);
  },
};

// ─── Q&A ────────────────────────────────────────────────────────────────────

/** Threads seen in the last listing, so `qa open <id>` does not have to sweep
 *  every concept again. Memory only, and cleared on sign-out — one student's
 *  questions must never be readable by whoever signs in next. */
const threadCache = new Map<string, QaThread>();

export function clearLearningCache() {
  threadCache.clear();
  lessonSections = [];
  setCurrentConcept(null);
}

function remember(threads: QaThread[]) {
  for (const thread of threads) threadCache.set(thread.id, thread);
}

const askerOf = (t: QaThread) =>
  t.studentName || t.user?.name || t.student?.name || "Student";
const askerIdOf = (t: QaThread) => t.userId ?? t.studentId ?? t.user?.id ?? t.student?.id;

async function threadsForConcept(
  conceptId: string,
  title?: string,
): Promise<QaThread[]> {
  const { data } = await api.get<QaThread[]>(
    `/concepts/${encodeURIComponent(conceptId)}/qa-questions`,
  );
  return data.map((t) => ({ ...t, conceptTitle: title ?? t.conceptTitle }));
}

/** The board has no cross-concept endpoint, so this walks the catalogue the
 *  same way the old page did. One concept is one request; a failure there is
 *  skipped rather than failing the whole board. */
async function allThreads(ctx: CommandCtx): Promise<QaThread[]> {
  const concepts = await conceptList();
  ctx.io.print(`scanning ${plural(concepts.length, "lesson")}…`, "dim");
  const results = await Promise.all(
    concepts.map((c) => threadsForConcept(c.id, c.title).catch(() => [])),
  );
  const flat = results.flat();
  flat.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  remember(flat);
  return flat;
}

/** One thread as two lines: the state marker plus who asked and where, then
 *  the question itself clipped to a readable excerpt. */
function printThread(ctx: CommandCtx, thread: QaThread, mine: boolean) {
  const answers = thread.answers?.length ?? 0;
  // Threads open by id, typed in full or by an unambiguous prefix — so the
  // listing shows the id's head beside every thread, the way `git log`
  // shows hashes. No indices: a number here must never read as a command.
  const short = thread.id.slice(0, 8);
  entry(
    ctx,
    answers ? "[ANS]" : "[OPEN]",
    `[${short}] ${thread.conceptTitle ?? "lesson"} — ${mine ? "you" : askerOf(thread)} · ${shortDate(thread.createdAt)} · ${plural(answers, "answer")}`,
    [
      { label: "qa open", command: `qa open ${thread.id}` },
      { label: "cat", command: `cat ${thread.conceptId}` },
      ...(mine && !answers
        ? [{ label: "edit", command: `qa edit ${thread.id}` }]
        : []),
      ...(mine ? [{ label: "delete", command: `qa delete ${thread.id}` }] : []),
    ],
  );
  detail(
    ctx,
    thread.body.length > 160 ? `${thread.body.slice(0, 157)}…` : thread.body,
  );
}

async function locateThread(ctx: CommandCtx, value: string): Promise<QaThread> {
  const needle = value.trim();
  const cached = threadCache.get(needle);
  if (cached) return cached;
  const threads = await allThreads(ctx);
  const exact = threads.find((t) => t.id === needle);
  if (exact) return exact;
  // An unambiguous head of the id opens it, the way a short hash does
  // everywhere else — with the ambiguity said out loud instead of guessed.
  // A bare number matches nothing here: digits are not addresses.
  const lowered = needle.toLowerCase();
  const hits = threads.filter((t) => t.id.toLowerCase().startsWith(lowered));
  if (hits.length === 1) return hits[0];
  if (hits.length > 1)
    throw new Error(
      `“${needle}” matches ${hits.length} discussions. Type a few more characters of the id.`,
    );
  throw new Error(
    "That discussion is no longer on the board. Run qa to list.",
  );
}

function renderThread(ctx: CommandCtx, thread: QaThread, mine: boolean) {
  const answers = thread.answers ?? [];
  heading(ctx, `discussion / ${thread.conceptTitle ?? "lesson"}`);
  ctx.io.print(
    `${mine ? "you" : askerOf(thread)} · ${shortDate(thread.createdAt)}${
      thread.updatedAt &&
      Date.parse(thread.updatedAt) - Date.parse(thread.createdAt) > 1000
        ? " · (edited)"
        : ""
    }`,
    "dim",
  );
  // The question is plain text on the board, so it prints as plain text —
  // only answers are authored as markdown.
  ctx.io.print(thread.body);

  if (!answers.length) {
    ctx.io.print("", "rule");
    ctx.io.print(
      "no answer yet — an instructor will pick this up, or ask the AI for one now",
      "dim",
    );
  }

  for (const answer of answers) {
    ctx.io.print("", "rule");
    ctx.io.print(
      `${
        answer.isAiAnswer
          ? "AI"
          : `INSTRUCTOR · ${answer.instructorName ?? answer.instructor?.name ?? "verified instructor"}`
      }  ${shortDate(answer.createdAt)}`,
      "head",
    );
    body(ctx, answer.body);
  }

  ctx.io.print("", "rule");
  next(ctx, [
    { label: "cat", command: `cat ${thread.conceptId}` },
    { label: "qa ask", command: `qa ask ${thread.conceptId}` },
    ...(mine && !answers.length
      ? [{ label: "edit", command: `qa edit ${thread.id}` }]
      : []),
    ...(mine ? [{ label: "delete", command: `qa delete ${thread.id}` }] : []),
    { label: "qa", command: "qa" },
  ]);
}

async function askQuestion(ctx: CommandCtx, reference?: string) {
  // Asking from inside a lesson asks about it — the picker below stays for
  // when no lesson is on screen.
  const onScreen = reference ? null : currentConcept();
  let conceptId: string;
  if (reference) {
    conceptId = await findConceptId(reference);
    setCurrentConcept({ id: conceptId });
  } else if (onScreen) {
    conceptId = onScreen.id;
    setCurrentConcept({ id: conceptId });
  } else {
    // No picker: asking with no lesson in sight is refused outright, so a
    // question can never be aimed somewhere the reader cannot see.
    stuck(
      ctx.io,
      "No lesson on screen.",
      "Open one with {cat}, page it with {less}, or resume with {continue} — or name it directly: qa ask <lesson>.",
    );
    return;
  }

  // Only two answers mean anything here, so only two are accepted. Anything
  // else re-asks: routing an unrecognised reply to the AI would spend one of
  // a shared daily quota on a question nobody aimed anywhere.
  const at = await pickRow(
    ctx,
    "Who should answer?",
    ["ai · instant explanation", "instructor · replies on the board"],
    [["ai"], ["instructor"]],
  );
  const to = at === 0 ? "ai" : "instructor";

  // Checked here, before the request: an AI generation is metered, so a blank
  // or one-word question must never cost one.
  let body = "";
  for (;;) {
    body = (await ctx.io.ask("Your question")).trim();
    if (body.length >= MIN_QUESTION && /[a-z]/i.test(body)) break;
    ctx.io.print(
      body
        ? `too short: ask a real question — at least ${MIN_QUESTION} characters, in words.`
        : "nothing entered: type your question, or press Escape to cancel.",
      "err",
    );
  }

  ctx.io.status?.(to === "ai" ? "asking the AI" : "posting to instructors");
  ctx.io.print(
    to === "ai" ? "asking the AI…" : "posting to instructors…",
    "dim",
  );
  await api.post(`/concepts/${encodeURIComponent(conceptId)}/qa-questions`, {
    body,
    target: to,
  });

  if (to === "instructor") {
    ctx.io.print("[OK] Posted — an instructor will answer on the board.", "ok");
    next(ctx, [
      { label: "qa mine", command: "qa mine" },
      { label: "cat", command: `cat ${conceptId}` },
    ]);
    return;
  }

  // The AI answers synchronously, so re-read the thread and show it rather
  // than making the student go looking for it.
  ctx.io.print("[OK] Answered.", "ok");
  const threads = await threadsForConcept(conceptId).catch(() => []);
  remember(threads);
  const mineId = ctx.user?.id;
  const posted = threads
    .filter((t) => !mineId || askerIdOf(t) === mineId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (posted) renderThread(ctx, posted, true);
}

const qa: CommandSpec = {
  name: "qa",
  usage: "qa [mine|unanswered|search]",
  completes: "path",
  completesAfter: ["ask", "concept"],
  help: {
    usage:
      "qa [ask|open <id>|mine|unanswered|concept <lesson>|edit <id>|delete <id>|search]",
    description: [
      "The question board. Bare, it lists recent threads with their answer",
      "counts; the subcommands ask, read and manage them.",
    ],
    commands: [
      { name: "ask", text: "Start a thread about the lesson on screen, or name one" },
      { name: "open <id>", text: "Read one thread and its answers" },
      { name: "mine", text: "Only threads you started" },
      { name: "unanswered", text: "Only threads with no answer yet" },
      { name: "concept <lesson>", text: "Only threads about one lesson" },
      { name: "edit <id>", text: "Reword a question you asked" },
      { name: "delete <id>", text: "Remove a question you asked" },
    ],
    args: [{ name: "[search]", text: "Only threads containing this text" }],
    examples: [
      "qa",
      "qa ask",
      "qa open 9f2c4a1d",
      "qa mine",
      "qa unanswered",
      "qa concept what-is-voip",
      "qa codec",
    ],
  },
  summary: "browse discussions, ask, and read answers",
  group: "learn",
  run: async (ctx) => {
    const [sub, ...rest] = ctx.args;
    const argument = rest.join(" ");
    const mineId = ctx.user?.id;
    const isMine = (t: QaThread) =>
      Boolean(mineId) && askerIdOf(t) === mineId;

    if (sub === "ask") {
      await askQuestion(ctx, argument || undefined);
      return;
    }

    if (sub === "open") {
      if (!argument) {
        ctx.io.print("usage: qa open <thread-id>", "dim");
        return;
      }
      const thread = await locateThread(ctx, argument);
      renderThread(ctx, thread, isMine(thread));
      return;
    }

    if (sub === "edit") {
      if (!argument) {
        ctx.io.print("usage: qa edit <thread-id>", "dim");
        return;
      }
      const thread = await locateThread(ctx, argument);
      if (!isMine(thread))
        throw new Error("You can only edit a question you asked.");
      if (thread.answers?.length)
        throw new Error("Answered questions can no longer be edited.");
      ctx.io.print(thread.body, "dim");
      const body = (await ctx.io.ask("New wording")).trim();
      if (!body) {
        ctx.io.print("Unchanged.", "dim");
        return;
      }
      await api.patch(`/qa-questions/${encodeURIComponent(thread.id)}`, {
        body,
      });
      threadCache.set(thread.id, { ...thread, body });
      ctx.io.print("[OK] Question updated.", "ok");
      return;
    }

    if (sub === "delete") {
      if (!argument) {
        ctx.io.print("usage: qa delete <thread-id>", "dim");
        return;
      }
      const thread = await locateThread(ctx, argument);
      if (!isMine(thread))
        throw new Error("You can only delete a question you asked.");
      const confirm = (
        await ctx.io.ask("Delete this question and any answers on it?", {
          choices: [
            { value: "yes", label: "[yes, delete it]" },
            { value: "no", label: "[keep it]" },
          ],
        })
      )
        .trim()
        .toLowerCase();
      if (confirm !== "yes" && confirm !== "y") {
        ctx.io.print("Kept.", "dim");
        return;
      }
      await api.delete(`/qa-questions/${encodeURIComponent(thread.id)}`);
      threadCache.delete(thread.id);
      ctx.io.print("[OK] Question deleted.", "ok");
      return;
    }

    // Listing. `qa concept <ref>` scopes to one lesson; bare words search.
    let threads: QaThread[];
    let heading_: string;

    if (sub === "concept") {
      if (!argument) {
        ctx.io.print("usage: qa concept <lesson title or id>", "dim");
        return;
      }
      const conceptId = await findConceptId(argument);
      const concept = (await conceptList()).find((c) => c.id === conceptId);
      threads = await threadsForConcept(conceptId, concept?.title);
      remember(threads);
      heading_ = `discussions / ${concept?.title ?? "lesson"}`;
    } else {
      const filter = sub?.toLowerCase();
      const all = await allThreads(ctx);
      if (filter === "mine") {
        threads = all.filter(isMine);
        heading_ = "discussions / your questions";
      } else if (filter === "unanswered") {
        threads = all.filter((t) => !t.answers?.length);
        heading_ = "discussions / awaiting an answer";
      } else if (filter === "answered") {
        threads = all.filter((t) => t.answers?.length);
        heading_ = "discussions / answered";
      } else if (filter) {
        const query = ctx.args.join(" ").toLowerCase();
        threads = all.filter(
          (t) =>
            t.body.toLowerCase().includes(query) ||
            t.conceptTitle?.toLowerCase().includes(query) ||
            askerOf(t).toLowerCase().includes(query) ||
            t.answers?.some((a) => a.body.toLowerCase().includes(query)),
        );
        heading_ = `discussions / “${ctx.args.join(" ")}”`;
      } else {
        threads = all;
        heading_ = "discussions / all";
      }
    }

    if (!threads.length) {
      stuck(
        ctx.io,
        "No discussions match that.",
        "Start one with {qa ask}, see the whole board with {qa}, or go back to a lesson with {continue}.",
      );
      return;
    }

    const shown = threads.slice(0, 25);
    heading(ctx, `${heading_} · ${plural(threads.length, "thread")}`);
    shown.forEach((t) => printThread(ctx, t, isMine(t)));
    ctx.io.print("");
    if (threads.length > shown.length)
      ctx.io.print(
        `showing ${shown.length} of ${threads.length} — narrow with qa <search>, qa mine, or qa unanswered`,
        "dim",
      );
    ctx.io.print(
      "qa ask starts a thread · qa open <id> reads one",
      "dim",
      [{ label: "qa ask", command: "qa ask" }],
    );
  },
};

const status: CommandSpec = {
  name: "status",
  usage: "status",
  help: {
    usage: "status",
    description: [
      "Print your XP, the current streak, and how many reviews are due.",
      "The three numbers that say whether today has been a learning day.",
    ],
    examples: ["status", "review", "continue"],
  },
  summary: "show XP, streak, and reviews due",
  group: "learn",
  run: async (ctx) => {
    const [stats, due] = await Promise.all([
      api.get<{ totalXp: number; currentStreak: number }>(
        "/gamification/me",
      ),
      api.get<{ count?: number; dueCount?: number }>("/review/due-count"),
    ]);
    const dueCount = due.data.dueCount ?? due.data.count ?? 0;
    heading(ctx, "status");
    ctx.io.print(`  ${"xp".padEnd(12)} ${stats.data.totalXp}`);
    ctx.io.print(
      `  ${"streak".padEnd(12)} ${plural(stats.data.currentStreak, "day")}`,
    );
    ctx.io.print(`  ${"reviews_due".padEnd(12)} ${dueCount}`);
    next(ctx, [
      { label: "continue", command: "continue" },
      ...(dueCount ? [{ label: "review", command: "review" }] : []),
    ]);
  },
};

const today: CommandSpec = {
  name: "today",
  usage: "today",
  help: {
    usage: "today",
    description: [
      "The morning briefing: greeting, streak and XP, reviews due, the",
      "next unlocked lesson, and the last seven days as one sparkline.",
      "Read-only — nothing here answers, completes or reschedules anything.",
    ],
    examples: ["today", "continue", "heatmap"],
  },
  summary: "your briefing: streak, reviews, and what's next",
  group: "learn",
  run: async (ctx) => {
    const hour = new Date().getHours();
    const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // One round of requests, all independent. A probe that fails reads as
    // unknown and its row is skipped — a briefing that refuses to print
    // because one number was unavailable helps nobody.
    const [stats, due, week, all, recent] = await Promise.all([
      api
        .get<{ totalXp: number; currentStreak: number }>("/gamification/me")
        .then((r) => r.data)
        .catch(() => undefined),
      api
        .get<{ count?: number; dueCount?: number }>("/review/due-count")
        .then((r) => r.data.dueCount ?? r.data.count ?? 0)
        .catch(() => undefined),
      api
        .get<Array<{ date: string; active: boolean; xp: number }>>(
          "/gamification/activity?days=7",
        )
        .then((r) => r.data)
        .catch(() => undefined),
      catalog().catch(() => [] as Roadmap[]),
      api.get<Progress[]>("/progress/me").then((r) => r.data).catch(() => []),
    ]);

    heading(ctx, `today / ${date}`);
    const name = ctx.user?.name?.split(" ")[0];
    ctx.io.print(
      `Good ${part}${name ? `, ${name}` : ""}. Here's the shape of it.`,
      "dim",
    );

    if (stats) {
      entry(
        ctx,
        stats.currentStreak > 0 ? "[STREAK]" : "[REST]",
        `${plural(stats.currentStreak, "day")} running · ${stats.totalXp} XP banked`,
      );
    }
    if (due !== undefined) {
      entry(
        ctx,
        due ? "[DUE]" : "[CLEAR]",
        due
          ? `${plural(due, "review")} ready to answer`
          : "nothing due — your recall is up to date",
      );
    }
    if (week?.length) {
      const peak = Math.max(1, ...week.map((d) => d.xp));
      const cells = " .:-=#";
      const spark = week
        .map((d) => cells[Math.min(4, Math.round((d.xp / peak) * 4))])
        .join("");
      detail(ctx, `week  ${spark}   oldest → today`);
    }

    // The next lesson, by the same rule `continue` walks — read here, opened
    // there. `today` never opens anything itself.
    let following: { label: string; command: string } | undefined;
    if (all.length) {
      const results = await Promise.allSettled(all.map((r) => progressFor(r.id)));
      const available = results.flatMap((r) =>
        r.status === "fulfilled" ? (r.value.concepts ?? []) : [],
      );
      const inProgress = recent
        .filter((p) => p.status === "in_progress")
        .sort(
          (a, b) =>
            Date.parse(b.updatedAt || b.createdAt) -
            Date.parse(a.updatedAt || a.createdAt),
        );
      const latest = inProgress
        .map((p) =>
          available.find((c) => c.conceptId === p.conceptId && unlocked(c)),
        )
        .find(Boolean);
      const upcoming = latest ?? nextConcept(available);
      if (upcoming) {
        const roadmap = all.find((r) =>
          results.some(
            (res, i) =>
              res.status === "fulfilled" &&
              all[i].id === r.id &&
              (res.value.concepts ?? []).some(
                (c) => c.conceptId === upcoming.conceptId,
              ),
          ),
        );
        entry(
          ctx,
          "[NEXT]",
          `${upcoming.conceptTitle ?? "your lesson"}${roadmap ? ` — ${roadmap.title}` : ""}`,
        );
        following = { label: "continue", command: "continue" };
      }
    }

    next(ctx, [
      ...(following ? [following] : []),
      ...(due ? [{ label: "review start", command: "review start" }] : []),
      { label: "heatmap", command: "heatmap" },
    ]);
  },
};

const heatmap: CommandSpec = {
  name: "heatmap",
  usage: "heatmap [days]",
  help: {
    usage: "heatmap [days]",
    description: [
      "Draw the contribution graph as text: one column per week, seven rows",
      "Monday to Sunday, darker cells for bigger XP days. Same data as the",
      "dashboard graph, counted in your own timezone.",
    ],
    args: [
      { name: "[days]", text: "How many days back, 7 to 371; twelve weeks when omitted" },
    ],
    examples: ["heatmap", "heatmap 30", "heatmap 365"],
  },
  summary: "draw your activity graph as text",
  group: "learn",
  run: async (ctx) => {
    let days = 84;
    if (ctx.args[0] !== undefined) {
      const count = Number(ctx.args[0]);
      if (!Number.isInteger(count) || count < 1 || count > 371) {
        ctx.io.print("heatmap: days must be a whole number from 1 to 371", "err");
        return;
      }
      days = count;
    }

    let data: Array<{ date: string; active: boolean; xp: number }>;
    try {
      ({ data } = await api.get<Array<{ date: string; active: boolean; xp: number }>>(
        `/gamification/activity?days=${days}`,
      ));
    } catch (e) {
      ctx.io.print(
        `heatmap: ${e instanceof Error ? e.message : "request failed"}`,
        "err",
      );
      return;
    }
    if (!data.length) {
      stuck(
        ctx.io,
        "No days came back.",
        "Try again in a moment, or start the streak with {continue}.",
      );
      return;
    }

    const peak = Math.max(0, ...data.map((d) => d.xp));
    const cell = (xp: number) => {
      if (xp <= 0) return "·";
      if (peak <= 0) return ":";
      if (xp < peak / 3) return ":";
      return xp < (peak * 2) / 3 ? "+" : "#";
    };
    const total = data.reduce((sum, d) => sum + d.xp, 0);
    const active = data.filter((d) => d.active).length;

    heading(
      ctx,
      `activity / last ${data.length} days · ${active} active · ${total} XP`,
    );
    // Columns are weeks, rows Monday to Sunday: pad the head so the first
    // column starts on Monday, the way wall calendars read.
    const lead = (new Date(`${data[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const padded: Array<{ xp: number } | null> = [
      ...Array<null>(lead).fill(null),
      ...data,
    ];
    const names = ["M", " ", "W", " ", "F", " ", " "];
    for (let row = 0; row < 7; row += 1) {
      let line = `${names[row]} `;
      for (let col = row; col < padded.length; col += 7) {
        const day = padded[col];
        line += day ? cell(day.xp) : " ";
      }
      ctx.io.print(line);
    }
    ctx.io.print("  · none   : some   + solid   # peak", "dim");
    next(ctx, [{ label: "continue", command: "continue" }]);
  },
};

export const LEARNING_COMMANDS: CommandSpec[] = [
  continueLearning,
  jump,
  quiz,
  complete,
  review,
  qa,
  status,
  today,
  heatmap,
  {
    name: "dashboard",
    usage: "dashboard",
    help: {
      usage: "dashboard",
      description: [
        "Leave the shell for the graphical dashboard, keeping the session.",
        "Where you are is remembered underneath, so switching back to CLI",
        "returns you to this exact location.",
      ],
      examples: ["dashboard"],
    },
    summary: "return to mission control",
    group: "navigate",
    run: (ctx) => navigate(ctx, "/student/dashboard"),
  },
];
