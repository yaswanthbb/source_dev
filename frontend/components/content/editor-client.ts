import apiClient from "@/lib/api-client";
import { ContentFailure, contentUnavailable } from "./content-client";
import { contentId, parseContentUser } from "./content-data";
import {
  editorObject,
  editorCount,
  editorFingerprint,
  parseEditorData,
  parseEditorLesson,
  parseOwnLessons,
  submissionIssues,
  moduleTitleError,
  type EditorData,
  type EditorLesson,
} from "./editor-data";

const timeout = 12000;
export type EditorAction =
  | { kind: "module"; title: string }
  | { kind: "attach"; moduleId: string; lesson: EditorLesson }
  | { kind: "detach"; moduleId: string; conceptId: string }
  | { kind: "submit" | "request-unpublish" | "cancel-unpublish" };

async function currentAccount(
  signal?: AbortSignal,
  expected?: EditorData["user"],
) {
  const response = await apiClient.get("/users/me", { signal, timeout });
  try {
    const user = parseContentUser(response.data);
    if (expected && (user.id !== expected.id || user.role !== expected.role))
      throw new Error();
    return user;
  } catch {
    throw new ContentFailure(
      "Your account or authoring access changed. Cached content is hidden; reload.",
      false,
      true,
    );
  }
}
export async function loadRoadmapEditor(
  roadmapId: string,
  signal?: AbortSignal,
  expected?: EditorData["user"],
) {
  try {
    contentId(roadmapId);
  } catch {
    throw new ContentFailure("This roadmap address is invalid.", false, true);
  }
  const user = await currentAccount(signal, expected),
    options = { signal, timeout };
  // The existing review endpoint normalizes elapsed unpublish dates. Read the
  // detail afterwards so the two responses describe the same effective state.
  const review = await apiClient.get(`/roadmaps/${roadmapId}/review`, options);
  const detail = await apiClient.get(`/roadmaps/${roadmapId}`, options);
  try {
    return parseEditorData(user, detail.data, review.data, roadmapId);
  } catch {
    throw new ContentFailure(
      "Roadmap ownership, structure or review state couldn’t be confirmed. Cached content is hidden; reload.",
      false,
      true,
    );
  }
}
export async function searchOwnLessons(
  data: EditorData,
  term: string,
  signal?: AbortSignal,
) {
  if (term.trim().length < 2) return [];
  const user = await currentAccount(signal, data.user);
  const response = await apiClient.get(
    `/concepts?search=${encodeURIComponent(term.trim())}`,
    { signal, timeout },
  );
  try {
    return parseOwnLessons(response.data, user.id);
  } catch {
    throw new ContentFailure(
      "Lesson ownership or metadata couldn’t be confirmed. Reload before attaching.",
      false,
      true,
    );
  }
}
export async function runEditorAction(
  before: EditorData,
  action: EditorAction,
) {
  if (action.kind === "module" && moduleTitleError(action.title))
    throw new ContentFailure(moduleTitleError(action.title)!);
  let fresh: EditorData;
  try {
    fresh = await loadRoadmapEditor(before.roadmap.id, undefined, before.user);
  } catch (error) {
    throw new ContentFailure(
      "Your current account and roadmap couldn’t be checked. Reload before making changes.",
      false,
      contentUnavailable(error),
    );
  }
  if (editorFingerprint(fresh) !== editorFingerprint(before))
    throw new ContentFailure(
      "This roadmap changed since your last check. Refresh and review it before trying again.",
    );
  let path = `/roadmaps/${fresh.roadmap.id}/${action.kind}`,
    body: unknown;
  let moduleId: string | undefined,
    conceptId: string | undefined,
    orderIndex: number | undefined;
  switch (action.kind) {
    case "module":
      path = `/roadmaps/${fresh.roadmap.id}/modules`;
      orderIndex = Math.max(-1, ...fresh.modules.map((m) => m.orderIndex)) + 1;
      if (!Number.isSafeInteger(orderIndex))
        throw new ContentFailure(
          "Module order can’t be assigned. Reload your roadmap.",
        );
      body = { title: action.title.trim(), orderIndex };
      break;
    case "attach":
    case "detach": {
      moduleId = contentId(action.moduleId);
      const targetModule = fresh.modules.find((m) => m.id === moduleId);
      if (!targetModule)
        throw new ContentFailure(
          "This module is no longer in your roadmap. Reload.",
        );
      conceptId = contentId(
        action.kind === "attach" ? action.lesson.id : action.conceptId,
      );
      const attached = targetModule.lessons.some((c) => c.id === conceptId);
      if (action.kind === "detach") {
        if (fresh.roadmap.status === "published" || !attached)
          throw new ContentFailure(
            "Published lessons can’t be detached. Reload to check this placement.",
          );
        path = `/modules/${moduleId}/concepts/${conceptId}`;
      } else {
        if (attached)
          throw new ContentFailure(
            "This lesson is already attached to that module.",
          );
        const response = await apiClient.get(`/concepts/${conceptId}`, {
          timeout,
        });
        let lesson: EditorLesson;
        try {
          lesson = parseEditorLesson(response.data, fresh.user.id);
        } catch {
          throw new ContentFailure(
            "Lesson ownership couldn’t be confirmed. Reload before attaching.",
            false,
            true,
          );
        }
        if (JSON.stringify(lesson) !== JSON.stringify(action.lesson))
          throw new ContentFailure(
            "This lesson changed. Search again and review it before attaching.",
          );
        path = `/modules/${moduleId}/concepts`;
        body = { conceptId };
      }
      break;
    }
    case "submit":
      if (fresh.roadmap.status !== "draft" || submissionIssues(fresh).length)
        throw new ContentFailure(
          "Submission needs a draft with at least 3 modules and 3 lessons in every module.",
        );
      break;
    case "request-unpublish":
      if (
        fresh.roadmap.status !== "published" ||
        (fresh.roadmap.unpublishStatus &&
          fresh.roadmap.unpublishStatus !== "none")
      )
        throw new ContentFailure(
          "Only a published roadmap without an open takedown request can request one.",
        );
      break;
    case "cancel-unpublish":
      if (
        fresh.roadmap.status !== "published" ||
        !["requested", "approved"].includes(fresh.roadmap.unpublishStatus ?? "")
      )
        throw new ContentFailure(
          "There is no open takedown request to withdraw.",
        );
      break;
  }
  let ack: unknown;
  try {
    ack = (
      action.kind === "detach"
        ? await apiClient.delete(path, { timeout })
        : await apiClient.post(path, body, { timeout })
    ).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    const uncertain = !status || status >= 500 || status === 408;
    throw new ContentFailure(
      uncertain
        ? "The change may have saved. Check the roadmap before making another change; an earlier request may still finish."
        : "The server refused this change. Your draft is kept. Refresh to check access and current review state.",
      uncertain,
      contentUnavailable(error),
    );
  }
  try {
    if (action.kind === "module") {
      const row = editorObject(ack);
      moduleId = contentId(row.id);
      if (
        fresh.modules.some((m) => m.id === moduleId) ||
        row.roadmapId !== fresh.roadmap.id ||
        row.title !== action.title.trim() ||
        row.orderIndex !== orderIndex
      )
        throw new Error();
    } else if (action.kind === "attach") {
      const row = editorObject(ack);
      contentId(row.id);
      if (
        row.moduleId !== moduleId ||
        row.conceptId !== conceptId ||
        editorCount(row.orderIndex) < 1
      )
        throw new Error();
    } else if (action.kind !== "detach") {
      const row = editorObject(ack);
      if (
        row.id !== fresh.roadmap.id ||
        row.createdById !== fresh.user.id ||
        row.reviewStatus !==
          (action.kind === "submit" ? "submitted" : "published")
      )
        throw new Error();
      if (
        action.kind === "request-unpublish" &&
        row.unpublishStatus !== "requested"
      )
        throw new Error();
      if (
        action.kind === "cancel-unpublish" &&
        (row.unpublishStatus !== "none" || row.unpublishEffectiveAt != null)
      )
        throw new Error();
    }
  } catch {
    throw new ContentFailure(
      "The server response was incomplete. The change may have saved; check your roadmap before trying again.",
      true,
    );
  }
  let after: EditorData;
  try {
    after = await loadRoadmapEditor(fresh.roadmap.id, undefined, fresh.user);
  } catch (error) {
    throw new ContentFailure(
      "The request returned, but saved state couldn’t be checked. Reload before making another change.",
      true,
      contentUnavailable(error),
    );
  }
  const savedModule = after.modules.find((m) => m.id === moduleId);
  const confirmed =
    action.kind === "module"
      ? savedModule?.title === action.title.trim() &&
        savedModule.orderIndex === orderIndex
      : action.kind === "attach"
        ? savedModule?.lessons.some((c) => c.id === conceptId)
        : action.kind === "detach"
          ? savedModule && !savedModule.lessons.some((c) => c.id === conceptId)
          : action.kind === "submit"
            ? after.roadmap.status === "submitted"
            : action.kind === "request-unpublish"
              ? after.roadmap.status === "published" &&
                after.roadmap.unpublishStatus === "requested"
              : after.roadmap.status === "published" &&
                after.roadmap.unpublishStatus === "none";
  if (!confirmed)
    throw new ContentFailure(
      "Saved state doesn’t yet confirm the change. Check your roadmap before trying again.",
      true,
    );
  return {
    data: after,
    action,
    message:
      action.kind === "module"
        ? "Module added"
        : action.kind === "attach"
          ? "Lesson attached"
          : action.kind === "detach"
            ? "Lesson detached; the lesson itself is kept"
            : action.kind === "submit"
              ? "Roadmap submitted for review"
              : action.kind === "request-unpublish"
                ? "Takedown requested; roadmap remains published"
                : "Takedown withdrawn",
  };
}
export type EditorOutcome = Awaited<ReturnType<typeof runEditorAction>>;
