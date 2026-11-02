import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import {
  parseContentLibrary,
  parseContentUser,
  parseOwnRoadmap,
  roadmapDraftErrors,
} from "./content-data";

export class ContentFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
export function contentUnavailable(error: unknown) {
  return error instanceof ContentFailure
    ? error.unavailable
    : [401, 403, 404].includes(
        (error as { response?: { status?: number } })?.response?.status ?? 0,
      );
}
export function contentError(error: unknown) {
  return error instanceof ContentFailure
    ? error.message
    : "Your content couldn’t load. Check your connection and reload; your draft is kept on this page.";
}
export async function loadContentLibrary(signal?: AbortSignal) {
  const options = { signal, timeout: 12000 };
  const user = await apiClient.get("/users/me", options);
  try {
    parseContentUser(user.data);
  } catch {
    throw new ContentFailure(
      "Your account information is incomplete. Sign in again or reload.",
      false,
      true,
    );
  }
  const rows = await apiClient.get("/roadmaps", options);
  try {
    return parseContentLibrary(user.data, rows.data);
  } catch {
    throw new ContentFailure(
      "Content ownership, dates or publication status couldn’t be confirmed. Cached private content is hidden; reload the library.",
      false,
      true,
    );
  }
}
export interface RoadmapDraft {
  title: string;
  description: string;
}
export async function createPrivateRoadmap(
  user: Pick<User, "id" | "role">,
  draft: RoadmapDraft,
) {
  const errors = roadmapDraftErrors(draft.title, draft.description);
  if (errors.title || errors.description)
    throw new ContentFailure(errors.title || errors.description!);
  let current: User;
  let rawUser: unknown;
  try {
    rawUser = (await apiClient.get("/users/me", { timeout: 12000 })).data;
  } catch (error) {
    throw new ContentFailure(
      "Your current account couldn’t be checked. Reload before creating content.",
      false,
      contentUnavailable(error),
    );
  }
  try {
    current = parseContentUser(rawUser);
  } catch {
    throw new ContentFailure(
      "Your current account information is incomplete. Cached private content has been hidden; reload.",
      false,
      true,
    );
  }
  if (current.id !== user.id || current.role !== user.role)
    throw new ContentFailure(
      "Your account or role changed. Reload before creating content.",
      false,
      true,
    );
  const body = {
    title: draft.title.trim(),
    ...(draft.description.trim()
      ? { description: draft.description.trim() }
      : {}),
  };
  let raw: unknown;
  try {
    raw = (await apiClient.post("/roadmaps", body, { timeout: 12000 })).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    throw new ContentFailure(
      status === 401 || status === 403
        ? "Your session or authoring access changed. Sign in again if needed."
        : status === 400 || status === 422
          ? "The server couldn’t accept this roadmap. Check the title and description."
          : "Creation couldn’t be confirmed. A private roadmap may already exist. Check your library before creating another.",
      !status || status >= 500,
      status === 401 || status === 403,
    );
  }
  try {
    const roadmap = parseOwnRoadmap(raw, current.id, Date.now());
    if (
      roadmap.reviewStatus !== "draft" ||
      roadmap.status !== "draft" ||
      roadmap.title !== body.title ||
      roadmap.description !== (body.description ?? null)
    )
      throw new Error();
    return { roadmap, draft };
  } catch {
    throw new ContentFailure(
      "The creation response was incomplete. It may have saved; check your library before creating another.",
      true,
    );
  }
}
export type RoadmapCreation = Awaited<ReturnType<typeof createPrivateRoadmap>>;
