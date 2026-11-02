import {
  contentId,
  parseContentUser,
  parseOwnRoadmap,
  type OwnRoadmap,
} from "./content-data";
import type { User } from "@/lib/auth";

export const EDITOR_REVIEW = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Changes requested",
};
export interface EditorLesson {
  id: string;
  title: string;
  authorId: string;
  reviewStatus: keyof typeof EDITOR_REVIEW;
  hasPendingDraft: boolean;
  rejectionReason: string | null;
  originLabel: "ai" | "handwritten" | null;
}
export interface EditorModule {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Array<EditorLesson & { placementId: string; orderIndex: number }>;
}
export interface EditorData {
  user: User;
  roadmap: OwnRoadmap;
  modules: EditorModule[];
  review: { pendingCount: number; rejectedCount: number; canPublish: boolean };
  loadedAt: string;
}
export function editorObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Authoring data is incomplete.");
  return value as Record<string, unknown>;
}
export function editorText(value: unknown) {
  if (typeof value !== "string")
    throw new Error("Authoring text is incomplete.");
  return value;
}
export function editorCount(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Authoring counts are incomplete.");
  return value;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value))
    throw new Error("Authoring structure is incomplete.");
  return value;
}
function unique<T>(values: T[], key: (v: T) => string): T[] {
  if (new Set(values.map(key)).size !== values.length)
    throw new Error("Duplicate authoring data.");
  return values;
}
export function parseEditorLesson(
  value: unknown,
  userId: string,
): EditorLesson {
  const row = editorObject(value);
  if (
    row.authorId !== userId ||
    !Object.hasOwn(EDITOR_REVIEW, String(row.reviewStatus))
  )
    throw new Error("Lesson ownership or review changed.");
  if (row.draftContent != null && typeof row.draftContent !== "string")
    throw new Error("Draft metadata is incomplete.");
  return {
    id: contentId(row.id),
    title: editorText(row.title),
    authorId: userId,
    reviewStatus: row.reviewStatus as EditorLesson["reviewStatus"],
    hasPendingDraft: row.draftContent != null,
    rejectionReason:
      row.rejectionReason == null ? null : editorText(row.rejectionReason),
    originLabel:
      row.originLabel === "ai" || row.originLabel === "handwritten"
        ? row.originLabel
        : typeof row.isAiGenerated === "boolean"
          ? row.isAiGenerated
            ? "ai"
            : "handwritten"
          : null,
  };
}
export function parseEditorData(
  userValue: unknown,
  detail: unknown,
  reviewValue: unknown,
  roadmapId: string,
  now = Date.now(),
): EditorData {
  const user = parseContentUser(userValue),
    raw = editorObject(detail);
  const roadmap = parseOwnRoadmap(raw, user.id, now);
  if (roadmap.id !== roadmapId || roadmap.status === "removed")
    throw new Error("Roadmap access changed.");
  const modules = unique(
    array(raw.modules).map((value) => {
      const row = editorObject(value),
        id = contentId(row.id);
      if (row.roadmapId !== roadmapId)
        throw new Error("Module placement changed.");
      const lessons = unique(
        array(row.moduleConcepts).map((value) => {
          const placement = editorObject(value),
            lesson = parseEditorLesson(placement.concept, user.id);
          if (placement.moduleId !== id || placement.conceptId !== lesson.id)
            throw new Error("Lesson placement changed.");
          return {
            ...lesson,
            placementId: contentId(placement.id),
            orderIndex: editorCount(placement.orderIndex),
          };
        }),
        (lesson) => lesson.id,
      ).sort(
        (a, b) =>
          a.orderIndex - b.orderIndex ||
          a.placementId.localeCompare(b.placementId),
      );
      unique(lessons, (lesson) => lesson.placementId);
      return {
        id,
        title: editorText(row.title),
        orderIndex: editorCount(row.orderIndex),
        lessons,
      };
    }),
    (m) => m.id,
  ).sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
  const review = editorObject(reviewValue);
  if (
    review.roadmapId !== roadmapId ||
    review.reviewStatus !== roadmap.status ||
    review.title !== roadmap.title
  )
    throw new Error("Review state changed.");
  const reviewModules = unique(array(review.modules).map(editorObject), (r) =>
    contentId(r.moduleId),
  );
  if (reviewModules.length !== modules.length)
    throw new Error("Review structure changed.");
  for (const m of modules) {
    const state = reviewModules.find((r) => r.moduleId === m.id);
    if (!state || state.title !== m.title)
      throw new Error("Module review changed.");
    const concepts = unique(array(state.concepts).map(editorObject), (r) =>
      contentId(r.id),
    );
    if (
      concepts.length !== m.lessons.length ||
      state.approved !==
        (m.lessons.length > 0 &&
          m.lessons.every((c) => c.reviewStatus === "approved"))
    )
      throw new Error("Review structure changed.");
    for (const c of m.lessons) {
      const r = concepts.find((r) => r.id === c.id);
      if (
        !r ||
        r.title !== c.title ||
        r.reviewStatus !== c.reviewStatus ||
        r.hasPendingDraft !== c.hasPendingDraft
      )
        throw new Error("Lesson review changed.");
    }
  }
  const lessons = modules.flatMap((m) => m.lessons),
    pendingCount = editorCount(review.pendingCount),
    rejectedCount = editorCount(review.rejectedCount);
  if (
    editorCount(review.moduleCount) !== modules.length ||
    editorCount(review.conceptCount) !== lessons.length ||
    pendingCount !==
      lessons.filter((c) => c.reviewStatus === "pending").length ||
    rejectedCount !==
      lessons.filter((c) => c.reviewStatus === "rejected").length ||
    review.canPublish !==
      (roadmap.status === "submitted" && !pendingCount && !rejectedCount)
  )
    throw new Error("Review counts changed.");
  return {
    user,
    roadmap,
    modules,
    review: {
      pendingCount,
      rejectedCount,
      canPublish: review.canPublish as boolean,
    },
    loadedAt: new Date(now).toISOString(),
  };
}
export function parseOwnLessons(value: unknown, userId: string) {
  return unique(
    array(value)
      .filter((v) => editorObject(v).authorId === userId)
      .map((v) => parseEditorLesson(v, userId)),
    (c) => c.id,
  );
}
export function editorFingerprint(data: EditorData) {
  return JSON.stringify({
    user: { id: data.user.id, role: data.user.role },
    roadmap: data.roadmap,
    modules: data.modules,
    review: data.review,
  });
}
export function submissionIssues(data: EditorData) {
  return [
    ...(data.modules.length < 3 ? ["Add at least 3 modules."] : []),
    ...data.modules
      .filter((m) => m.lessons.length < 3)
      .map(
        (m) =>
          `“${m.title}” needs at least 3 lessons (${m.lessons.length} attached).`,
      ),
  ];
}
export function moduleTitleError(title: string) {
  return !title.trim()
    ? "Give your module a title."
    : title.trim().length > 120
      ? "Use 120 characters or fewer."
      : undefined;
}
