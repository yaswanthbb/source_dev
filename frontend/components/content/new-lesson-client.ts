import apiClient from "@/lib/api-client";
import { ContentFailure, contentUnavailable } from "./content-client";
import { contentId, parseContentUser } from "./content-data";
import { editorFingerprint, parseEditorLesson } from "./editor-data";
import { loadRoadmapEditor, runEditorAction } from "./editor-client";
import {
  findOwnedModuleRoadmap,
  lessonDraftErrors,
  parseLessonCreation,
  parseSavedNewLesson,
  possibleLessonSaves,
  type NewLessonContext,
  type LessonTargetRequest,
  type LessonDraft,
  type SavedNewLesson,
} from "./new-lesson-data";

const timeout = 12000;
export interface NewLessonResult {
  lesson: SavedNewLesson;
  attachment: "none" | "attached" | "unconfirmed";
  issue?: string;
  uncertain?: boolean;
  unavailable?: boolean;
  targetUnavailable?: boolean;
}
async function account(
  signal?: AbortSignal,
  expected?: NewLessonContext["user"],
) {
  const raw = (await apiClient.get("/users/me", { signal, timeout })).data;
  try {
    const user = parseContentUser(raw);
    if (expected && (user.id !== expected.id || user.role !== expected.role))
      throw new Error();
    return user;
  } catch {
    throw new ContentFailure(
      "Your account or authoring role changed. Cached private content is hidden; recheck access.",
      false,
      true,
    );
  }
}
export async function loadNewLessonContext(
  request: LessonTargetRequest,
  signal?: AbortSignal,
  expected?: NewLessonContext["user"],
): Promise<NewLessonContext> {
  if (request.invalid || (request.roadmapId && !request.moduleId))
    throw new ContentFailure(
      "This module link is incomplete or invalid. Open your roadmap editor and choose its new-lesson link.",
      false,
      true,
    );
  try {
    if (request.moduleId) contentId(request.moduleId);
    if (request.roadmapId) contentId(request.roadmapId);
  } catch {
    throw new ContentFailure("This module link is invalid.", false, true);
  }
  const user = await account(signal, expected);
  if (!request.moduleId)
    return { user, request, loadedAt: new Date().toISOString() };
  let roadmapId = request.roadmapId;
  if (!roadmapId) {
    const raw = (await apiClient.get("/roadmaps", { signal, timeout })).data;
    try {
      roadmapId = findOwnedModuleRoadmap(raw, user.id, request.moduleId);
    } catch {
      throw new ContentFailure(
        "The linked module couldn’t be confirmed as part of your own content. Open your roadmap editor to choose it again.",
        false,
        true,
      );
    }
  }
  const editor = await loadRoadmapEditor(roadmapId, signal, user);
  if (!editor.modules.some((m) => m.id === request.moduleId))
    throw new ContentFailure(
      "This module is no longer in the linked roadmap. Choose it again from your editor.",
      false,
      true,
    );
  return {
    user: editor.user,
    request: { moduleId: request.moduleId, roadmapId, invalid: false },
    target: { editor, moduleId: request.moduleId },
    loadedAt: editor.loadedAt,
  };
}
export async function attachCreatedLesson(
  context: NewLessonContext,
  lesson: SavedNewLesson,
): Promise<NewLessonResult> {
  if (!context.target || context.user.id !== lesson.authorId)
    throw new ContentFailure(
      "Load your own lesson and target module before attaching.",
      false,
      true,
    );
  const metadata = parseEditorLesson(
    { ...lesson, draftContent: lesson.hasPendingDraft ? "" : null },
    context.user.id,
  );
  try {
    await runEditorAction(context.target.editor, {
      kind: "attach",
      moduleId: context.target.moduleId,
      lesson: metadata,
    });
    return { lesson, attachment: "attached" };
  } catch (error) {
    let unavailable = contentUnavailable(error),
      targetUnavailable = false;
    if (unavailable) {
      // A missing/changed module must not erase a confirmed lesson. Verify the
      // account again before showing its metadata, and hide the old target.
      try {
        await account(undefined, context.user);
        unavailable = false;
        targetUnavailable = true;
      } catch {}
    }
    return {
      lesson,
      attachment: "unconfirmed",
      issue:
        error instanceof ContentFailure
          ? error.message
          : "Attachment couldn’t be checked. Recheck the saved lesson and module before trying again.",
      uncertain: error instanceof ContentFailure && error.uncertain,
      unavailable,
      targetUnavailable,
    };
  }
}
export async function createNewLesson(
  before: NewLessonContext,
  draft: LessonDraft,
): Promise<NewLessonResult> {
  const errors = lessonDraftErrors(draft);
  if (errors.title || errors.content || errors.difficulty)
    throw new ContentFailure(
      errors.title || errors.content || errors.difficulty!,
    );
  let current: NewLessonContext;
  try {
    current = await loadNewLessonContext(
      before.request,
      undefined,
      before.user,
    );
  } catch (error) {
    throw new ContentFailure(
      "Your current account and target couldn’t be checked. Recheck before creating; your draft is kept.",
      false,
      contentUnavailable(error),
    );
  }
  if (
    before.target &&
    (!current.target ||
      editorFingerprint(before.target.editor) !==
        editorFingerprint(current.target.editor))
  )
    throw new ContentFailure(
      "The target roadmap changed. Recheck and review the module before creating your lesson.",
    );
  const body = {
    title: draft.title.trim(),
    content: draft.content,
    difficulty: draft.difficulty,
  };
  let raw: unknown;
  try {
    raw = (await apiClient.post("/concepts", body, { timeout })).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
        ?.status,
      uncertain = !status || status >= 500 || status === 408;
    throw new ContentFailure(
      uncertain
        ? "Creation couldn’t be confirmed. A lesson may already exist. Check saved lessons before creating another; an earlier request may still finish."
        : "The server refused lesson creation. Your draft is kept. Check your details and authoring access.",
      uncertain,
      contentUnavailable(error),
    );
  }
  let lesson: SavedNewLesson;
  try {
    lesson = parseLessonCreation(raw, current.user.id, draft);
  } catch {
    throw new ContentFailure(
      "The creation response was incomplete. It may have saved. Check saved lessons before creating another.",
      true,
    );
  }
  return current.target
    ? attachCreatedLesson(current, lesson)
    : { lesson, attachment: "none" };
}
export async function checkNewLessonState(
  before: NewLessonContext,
  draft: LessonDraft,
  result?: NewLessonResult,
) {
  if (!result) {
    const context = await loadNewLessonContext(
      before.request,
      undefined,
      before.user,
    );
    const raw = (
      await apiClient.get(
        `/concepts?search=${encodeURIComponent(draft.title.trim())}`,
        { timeout },
      )
    ).data;
    try {
      return {
        context,
        candidates: possibleLessonSaves(raw, context.user.id, draft),
        result: undefined,
      };
    } catch {
      throw new ContentFailure(
        "Saved lesson ownership or metadata couldn’t be checked. Keep changes paused and recheck.",
        false,
        true,
      );
    }
  }
  const user = await account(undefined, before.user);
  const raw = (
    await apiClient.get(`/concepts/${contentId(result.lesson.id)}`, { timeout })
  ).data;
  let lesson: SavedNewLesson;
  try {
    lesson = parseSavedNewLesson(raw, user.id);
    if (lesson.id !== result.lesson.id) throw new Error();
  } catch {
    throw new ContentFailure(
      "The saved lesson’s ownership or identity couldn’t be confirmed. Cached private content is hidden.",
      false,
      true,
    );
  }
  let context: NewLessonContext;
  try {
    context = await loadNewLessonContext(before.request, undefined, user);
  } catch (error) {
    if (!contentUnavailable(error)) throw error;
    await account(undefined, user);
    return {
      context: {
        user,
        request: before.request,
        loadedAt: new Date().toISOString(),
      } as NewLessonContext,
      candidates: [] as SavedNewLesson[],
      result: {
        lesson,
        attachment: "unconfirmed",
        targetUnavailable: true,
        issue:
          "The lesson is saved, but this target module is unavailable. Continue editing the lesson or choose a module from your roadmap editor.",
      } as NewLessonResult,
    };
  }
  const attached = context.target?.editor.modules
    .find((m) => m.id === context.target!.moduleId)
    ?.lessons.some((c) => c.id === lesson.id);
  return {
    context,
    candidates: [] as SavedNewLesson[],
    result: {
      lesson,
      attachment: context.target
        ? attached
          ? "attached"
          : "unconfirmed"
        : "none",
    } as NewLessonResult,
  };
}
