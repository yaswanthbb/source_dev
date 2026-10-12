import type { ReviewCount } from "@/components/dashboard/dashboard-data";
import type { QuizQuestion } from "@/components/roadmaps/quiz-data";

export interface ReviewItem {
  id: string;
  dueDate: string;
  lastReviewedAt: string | null;
  intervalDays: number;
  correctStreak: number;
  isLeech?: boolean;
  question: QuizQuestion & { conceptId: string; conceptTitle: string };
}
export interface ReviewQueue {
  items: ReviewItem[];
  counts: ReviewCount;
}
export interface ReviewResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  newIntervalDays: number;
  nextDueDate: string;
  xpAwarded: number;
  isLeech: boolean;
}
function fail(): never {
  throw new Error(
    "The review response was incomplete. Refresh the queue before continuing.",
  );
}
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail();
  return v as Record<string, unknown>;
}
function text(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) fail();
  return v;
}
function integer(v: unknown): number {
  if (!Number.isSafeInteger(v) || (v as number) < 0) fail();
  return v as number;
}
function day(v: unknown): string {
  const s = text(v);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(`${s}T12:00:00Z`)) ||
    new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) !== s
  )
    fail();
  return s;
}
export function parseReviewCounts(raw: unknown): ReviewCount {
  const v = record(raw);
  const counts: ReviewCount = {
    count: integer(v.count),
    dueCount: integer(v.dueCount),
  };
  for (const key of [
    "sessionCount",
    "heldBackCount",
    "unavailableCount",
    "leechCount",
  ] as const) {
    if (v[key] !== undefined) counts[key] = integer(v[key]);
  }
  return counts;
}
// Project student-facing fields only. Never trust incidental answer-key metadata.
export function parseReviewItems(raw: unknown): ReviewItem[] {
  if (!Array.isArray(raw)) fail();
  const ids = new Set<string>();
  return raw.map((rawItem) => {
    const v = record(rawItem),
      q = record(v.question),
      id = text(v.id);
    if (ids.has(id) || !Array.isArray(q.options)) fail();
    ids.add(id);
    const optionIds = new Set<string>();
    const options = q.options
      .map((rawOption) => {
        const o = record(rawOption),
          optionId = text(o.id);
        if (optionIds.has(optionId)) fail();
        optionIds.add(optionId);
        return {
          id: optionId,
          optionText: text(o.optionText),
          orderIndex: integer(o.orderIndex),
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
    if (
      v.lastReviewedAt !== null &&
      (typeof v.lastReviewedAt !== "string" ||
        !Number.isFinite(Date.parse(v.lastReviewedAt)))
    )
      fail();
    if (v.isLeech !== undefined && typeof v.isLeech !== "boolean") fail();
    return {
      id,
      dueDate: day(v.dueDate),
      lastReviewedAt: v.lastReviewedAt as string | null,
      intervalDays: integer(v.intervalDays),
      correctStreak: integer(v.correctStreak),
      isLeech: v.isLeech === undefined ? undefined : v.isLeech === true,
      question: {
        id: text(q.id),
        conceptId: text(q.conceptId),
        conceptTitle: text(q.conceptTitle),
        questionText: text(q.questionText),
        orderIndex: integer(q.orderIndex),
        options,
      },
    };
  });
}
export function reviewFingerprint(item: ReviewItem) {
  return JSON.stringify(item);
}
export function reconcileReviewBatch(
  batch: ReviewItem[],
  savedIds: Set<string>,
  fresh: ReviewItem[],
) {
  const current = new Map(
    fresh.filter((i) => i.question.options.length >= 2).map((i) => [i.id, i]),
  );
  return batch
    .filter((i) => !savedIds.has(i.id) && current.has(i.id))
    .map((i) => current.get(i.id)!);
}
export function parseReviewResult(
  raw: unknown,
  item: ReviewItem,
  selected: string,
): ReviewResult {
  const v = record(raw);
  if (
    typeof v.isCorrect !== "boolean" ||
    (v.isLeech !== undefined && typeof v.isLeech !== "boolean")
  )
    fail();
  const correctOptionId =
    v.correctOptionId === null ? null : text(v.correctOptionId);
  if (
    (correctOptionId &&
      !item.question.options.some((o) => o.id === correctOptionId)) ||
    (v.isCorrect && correctOptionId !== selected) ||
    (!v.isCorrect && correctOptionId === selected)
  )
    fail();
  const newIntervalDays = integer(v.newIntervalDays);
  if (newIntervalDays < 1) fail();
  return {
    isCorrect: v.isCorrect,
    correctOptionId,
    newIntervalDays,
    nextDueDate: day(v.nextDueDate),
    xpAwarded: integer(v.xpAwarded),
    isLeech: v.isLeech === true,
  };
}
// Civil dates are displayed without shifting them into the browser's timezone.
export function reviewDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
