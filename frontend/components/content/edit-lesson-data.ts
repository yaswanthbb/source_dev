import type { User } from "@/lib/auth";
import { hasSignificantContentChange } from "@/lib/content-diff";
import { contentId } from "./content-data";
import { editorObject, editorText, EDITOR_REVIEW } from "./editor-data";
import { LESSON_DIFFICULTIES, type LessonDraft } from "./new-lesson-data";

export interface EditableLesson {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  draftContent: string | null;
  difficulty: LessonDraft["difficulty"];
  reviewStatus: keyof typeof EDITOR_REVIEW;
  rejectionReason: string | null;
  isAiGenerated: boolean;
  updatedAt: string;
}
export interface EditLessonData {
  user: User;
  lesson: EditableLesson;
  placements: Array<{
    id: string;
    moduleId: string;
    moduleTitle: string;
    roadmapId: string;
    roadmapTitle: string;
  }>;
  loadedAt: string;
}
export type LessonEdit =
  | { kind: "details"; title: string; difficulty: LessonDraft["difficulty"] }
  | { kind: "body"; content: string };
export function lessonEditError(action: LessonEdit) {
  if (action.kind === "body")
    return !action.content.trim()
      ? "Write a lesson body before saving."
      : undefined;
  return !action.title.trim()
    ? "Give your lesson a title."
    : action.title.trim().length > 200
      ? "Use 200 characters or fewer for the title."
      : !Object.hasOwn(LESSON_DIFFICULTIES, action.difficulty)
        ? "Choose Easy, Medium or Hard."
        : undefined;
}
export function parseEditableLesson(
  value: unknown,
  user: User,
  id: string,
): EditableLesson {
  const row = editorObject(value);
  const authorId = row.authorId === null ? null : contentId(row.authorId);
  if (
    row.id !== id ||
    (user.role !== "admin" && authorId !== user.id) ||
    !Object.hasOwn(EDITOR_REVIEW, String(row.reviewStatus)) ||
    !Object.hasOwn(LESSON_DIFFICULTIES, String(row.difficulty)) ||
    (row.draftContent !== null && typeof row.draftContent !== "string") ||
    (row.rejectionReason !== null && typeof row.rejectionReason !== "string") ||
    typeof row.isAiGenerated !== "boolean"
  )
    throw new Error("Lesson ownership or saved state is incomplete.");
  const updatedAt = editorText(row.updatedAt);
  if (!Number.isFinite(Date.parse(updatedAt)))
    throw new Error("Lesson dates are incomplete.");
  return {
    id: contentId(row.id),
    authorId,
    title: editorText(row.title),
    content: editorText(row.content),
    draftContent: row.draftContent as string | null,
    difficulty: row.difficulty as EditableLesson["difficulty"],
    reviewStatus: row.reviewStatus as EditableLesson["reviewStatus"],
    rejectionReason: row.rejectionReason as string | null,
    isAiGenerated: row.isAiGenerated,
    updatedAt,
  };
}
export function parseEditLessonData(
  value: unknown,
  user: User,
  id: string,
): EditLessonData {
  const row = editorObject(value),
    lesson = parseEditableLesson(row, user, id);
  if (!Array.isArray(row.appearsIn))
    throw new Error("Lesson placements are incomplete.");
  const placements = row.appearsIn
    .map((value) => {
      const p = editorObject(value);
      return {
        id: contentId(p.moduleConceptId),
        moduleId: contentId(p.moduleId),
        roadmapId: contentId(p.roadmapId),
        moduleTitle: editorText(p.moduleTitle),
        roadmapTitle: editorText(p.roadmapTitle),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(placements.map((p) => p.id)).size !== placements.length)
    throw new Error("Duplicate lesson placements.");
  return { user, lesson, placements, loadedAt: new Date().toISOString() };
}
export function editLessonFingerprint(data: EditLessonData) {
  return JSON.stringify({
    account: [data.user.id, data.user.role],
    lesson: data.lesson,
    placements: data.placements,
  });
}
export const editableBody = (lesson: EditableLesson) =>
  lesson.draftContent ?? lesson.content;
export function confirmLessonEdit(
  value: unknown,
  before: EditLessonData,
  action: LessonEdit,
) {
  const next = parseEditableLesson(value, before.user, before.lesson.id),
    old = before.lesson;
  if (
    next.authorId !== old.authorId ||
    next.isAiGenerated !== old.isAiGenerated
  )
    throw new Error("Lesson author or origin changed.");
  if (action.kind === "details") {
    if (
      next.title !== action.title.trim() ||
      next.difficulty !== action.difficulty ||
      next.content !== old.content ||
      next.draftContent !== old.draftContent ||
      next.reviewStatus !== old.reviewStatus ||
      next.rejectionReason !== old.rejectionReason
    )
      throw new Error("Lesson details aren't confirmed.");
    return { lesson: next, outcome: "details" as const };
  }
  if (next.title !== old.title || next.difficulty !== old.difficulty)
    throw new Error("Other lesson details changed.");
  const significant = hasSignificantContentChange(
    old.content,
    action.content,
    40,
  );
  if (
    significant &&
    old.reviewStatus === "approved" &&
    next.content === old.content &&
    next.draftContent === action.content &&
    next.reviewStatus === old.reviewStatus &&
    next.rejectionReason === old.rejectionReason
  )
    return { lesson: next, outcome: "draft" as const };
  if (
    next.content !== action.content ||
    next.draftContent !== old.draftContent ||
    next.reviewStatus !== (significant ? "pending" : old.reviewStatus) ||
    next.rejectionReason !== (significant ? null : old.rejectionReason)
  )
    throw new Error("Lesson body isn't confirmed.");
  return { lesson: next, outcome: "body" as const };
}
