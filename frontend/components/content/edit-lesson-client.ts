import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import { ContentFailure, contentUnavailable } from "./content-client";
import { contentId, parseContentUser } from "./content-data";
import {
  parseEditLessonData,
  editLessonFingerprint,
  lessonEditError,
  confirmLessonEdit,
  type EditLessonData,
  type LessonEdit,
} from "./edit-lesson-data";

const timeout = 12000;
export async function loadEditLesson(
  id: string,
  signal?: AbortSignal,
  expected?: Pick<User, "id" | "role">,
) {
  try {
    contentId(id);
  } catch {
    throw new ContentFailure("This lesson address is invalid.", false, true);
  }
  const options = { signal, timeout };
  const account = await apiClient.get("/users/me", options);
  let user: User;
  try {
    user = parseContentUser(account.data);
    if (expected && (user.id !== expected.id || user.role !== expected.role))
      throw new Error();
  } catch {
    throw new ContentFailure(
      "Your account or editing access changed. Cached lesson text is hidden.",
      false,
      true,
    );
  }
  const response = await apiClient.get(`/concepts/${id}`, options);
  try {
    return parseEditLessonData(response.data, user, id);
  } catch {
    throw new ContentFailure(
      "Lesson ownership, body or saved state couldn't be confirmed. Cached lesson text is hidden.",
      false,
      true,
    );
  }
}
export async function saveLessonEdit(
  before: EditLessonData,
  action: LessonEdit,
) {
  const error = lessonEditError(action);
  if (error) throw new ContentFailure(error);
  let fresh: EditLessonData;
  try {
    fresh = await loadEditLesson(before.lesson.id, undefined, before.user);
  } catch (error) {
    throw new ContentFailure(
      "Current editing access couldn't be checked. Recheck before saving; your writing is kept.",
      false,
      contentUnavailable(error),
    );
  }
  if (editLessonFingerprint(fresh) !== editLessonFingerprint(before))
    throw new ContentFailure(
      "This lesson changed since your last check. Recheck and compare the saved version before saving your writing.",
    );
  // Keep metadata separate: the backend's staged-body branch returns before
  // applying difficulty. Never submit a combined payload or auto-chain saves.
  const body =
    action.kind === "body"
      ? { content: action.content }
      : { title: action.title.trim(), difficulty: action.difficulty };
  let ack: unknown;
  try {
    ack = (
      await apiClient.patch(`/concepts/${fresh.lesson.id}`, body, { timeout })
    ).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    const uncertain = !status || status === 408 || status >= 500;
    throw new ContentFailure(
      uncertain
        ? "The save may have finished. Check the saved version before saving again; an earlier request may still finish."
        : "The server refused the save. Your writing is kept. Recheck access and the saved version before trying again.",
      uncertain,
      contentUnavailable(error),
    );
  }
  let confirmed: ReturnType<typeof confirmLessonEdit>;
  try {
    confirmed = confirmLessonEdit(ack, fresh, action);
  } catch {
    throw new ContentFailure(
      "The save response was incomplete. Check the saved version before trying again.",
      true,
    );
  }
  let after: EditLessonData;
  try {
    after = await loadEditLesson(fresh.lesson.id, undefined, fresh.user);
  } catch (error) {
    throw new ContentFailure(
      "The request returned, but saved state couldn't be checked. Recheck before saving again.",
      true,
      contentUnavailable(error),
    );
  }
  if (JSON.stringify(after.lesson) !== JSON.stringify(confirmed.lesson))
    throw new ContentFailure(
      "The saved version doesn't confirm this response. Check and compare before saving again.",
      true,
    );
  return {
    data: after,
    action,
    outcome: confirmed.outcome,
    message:
      confirmed.outcome === "details"
        ? "Lesson details saved"
        : confirmed.outcome === "draft"
          ? "Body staged for review; saved body kept"
          : "Saved body updated",
  };
}
export type LessonEditResult = Awaited<ReturnType<typeof saveLessonEdit>>;
