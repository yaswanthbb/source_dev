import { contentId, parseOwnRoadmap } from "./content-data";
import {
  editorObject,
  editorText,
  parseEditorLesson,
  type EditorLesson,
  type EditorData,
} from "./editor-data";
import type { User } from "@/lib/auth";

export const LESSON_DIFFICULTIES = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
export interface LessonDraft {
  title: string;
  content: string;
  difficulty: keyof typeof LESSON_DIFFICULTIES;
}
export interface LessonTargetRequest {
  moduleId: string | null;
  roadmapId: string | null;
  invalid: boolean;
}
export interface NewLessonContext {
  user: User;
  request: LessonTargetRequest;
  target?: { editor: EditorData; moduleId: string };
  loadedAt: string;
}
export interface SavedNewLesson extends EditorLesson {
  difficulty: LessonDraft["difficulty"];
  createdAt: string;
}
export function lessonTargetRequest(
  query: Record<string, string | string[] | undefined>,
): LessonTargetRequest {
  try {
    if (Array.isArray(query.moduleId) || Array.isArray(query.roadmapId))
      throw new Error();
    const moduleId =
      query.moduleId === undefined ? null : contentId(query.moduleId);
    const roadmapId =
      query.roadmapId === undefined ? null : contentId(query.roadmapId);
    if (roadmapId && !moduleId) throw new Error();
    return { moduleId, roadmapId, invalid: false };
  } catch {
    return { moduleId: null, roadmapId: null, invalid: true };
  }
}
export function lessonDraftErrors(draft: LessonDraft) {
  return {
    title: !draft.title.trim()
      ? "Give your lesson a title."
      : draft.title.trim().length > 200
        ? "Use 200 characters or fewer for the title."
        : undefined,
    content:
      draft.content.trim().length < 20
        ? "Write at least 20 characters for the lesson body."
        : undefined,
    difficulty: !Object.hasOwn(LESSON_DIFFICULTIES, draft.difficulty)
      ? "Choose Easy, Medium or Hard."
      : undefined,
  };
}
export function parseSavedNewLesson(
  value: unknown,
  userId: string,
): SavedNewLesson {
  const row = editorObject(value),
    lesson = parseEditorLesson(row, userId);
  const createdAt = editorText(row.createdAt);
  if (
    !Object.hasOwn(LESSON_DIFFICULTIES, String(row.difficulty)) ||
    !Number.isFinite(Date.parse(createdAt))
  )
    throw new Error("Lesson metadata is incomplete.");
  return {
    ...lesson,
    difficulty: row.difficulty as LessonDraft["difficulty"],
    createdAt,
  };
}
export function parseLessonCreation(
  value: unknown,
  userId: string,
  draft: LessonDraft,
) {
  const row = editorObject(value),
    lesson = parseSavedNewLesson(row, userId);
  if (
    lesson.title !== draft.title.trim() ||
    row.content !== draft.content ||
    lesson.difficulty !== draft.difficulty ||
    lesson.reviewStatus !== "pending" ||
    lesson.hasPendingDraft ||
    row.isAiGenerated !== false ||
    lesson.originLabel !== "handwritten" ||
    lesson.rejectionReason != null
  )
    throw new Error("Creation response is incomplete.");
  return lesson;
}
export function findOwnedModuleRoadmap(
  value: unknown,
  userId: string,
  moduleId: string,
  now = Date.now(),
) {
  if (!Array.isArray(value)) throw new Error("Roadmaps are incomplete.");
  const matches: string[] = [];
  for (const valueRow of value) {
    const raw = editorObject(valueRow);
    if (raw.createdById !== userId) continue;
    const roadmap = parseOwnRoadmap(raw, userId, now);
    if (roadmap.status === "removed") continue;
    if (!Array.isArray(raw.modules))
      throw new Error("Module ownership is incomplete.");
    for (const valueModule of raw.modules) {
      const row = editorObject(valueModule);
      if (row.id === moduleId) {
        if (row.roadmapId !== roadmap.id)
          throw new Error("Module placement changed.");
        matches.push(roadmap.id);
      }
    }
  }
  if (matches.length !== 1)
    throw new Error("The module is missing, duplicated or not owned by you.");
  return matches[0];
}
export function possibleLessonSaves(
  value: unknown,
  userId: string,
  draft: LessonDraft,
) {
  if (!Array.isArray(value)) throw new Error("Lesson search is incomplete.");
  const lessons = value
    .filter((v) => editorObject(v).authorId === userId)
    .map((v) => parseSavedNewLesson(v, userId));
  if (new Set(lessons.map((c) => c.id)).size !== lessons.length)
    throw new Error("Duplicate lesson metadata.");
  return lessons.filter(
    (c) => c.title === draft.title.trim() && c.difficulty === draft.difficulty,
  );
}
