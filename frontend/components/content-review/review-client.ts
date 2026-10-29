import apiClient from "@/lib/api-client";
import { getToken } from "@/lib/auth";
import {
  loadAdminAccount,
  adminGuard,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import type { AdminUser } from "@/components/admin-dashboard/admin-dashboard-data";
import {
  parseReviewLessons,
  parseReviewRoadmaps,
  parseReviewRoadmap,
  parseReviewReport,
  parseLessonCore,
  reviewObject,
  reviewId,
  reviewCount,
  lessonFingerprint,
  roadmapFingerprint,
  reportFingerprint,
  purgeCandidates,
  canRoadmapAction,
  requiresReviewReason,
  validReviewReason,
  type ReviewLibrary,
  type ReviewAction,
  type RoadmapDetail,
  type Roadmap,
  type ReviewRecovery,
} from "./review-data";
export class ReviewFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
const code = (e: unknown) =>
  (e as { response?: { status?: number } })?.response?.status;
export const reviewUnavailable = (e: unknown) =>
  (e instanceof ReviewFailure || e instanceof AdminDashboardFailure) &&
  e.unavailable;
export const reviewError = (e: unknown) =>
  e instanceof ReviewFailure || e instanceof AdminDashboardFailure
    ? e.message
    : "The review state couldn’t be checked. Refresh before continuing.";
const timeout = 12000;
async function get(
  path: string,
  signal?: AbortSignal,
  optional = false,
): Promise<unknown> {
  try {
    return (await apiClient.get(path, { timeout, signal })).data;
  } catch (e) {
    if (optional && code(e) === 404) return undefined;
    throw new ReviewFailure(
      "Review details couldn’t be loaded. This check sends no moderation decision.",
      false,
      [401, 403].includes(code(e) ?? 0),
    );
  }
}
export async function loadReviewLibrary(
  expected?: Pick<AdminUser, "id" | "role">,
  signal?: AbortSignal,
  session = getToken(),
): Promise<ReviewLibrary> {
  const guard = adminGuard(session),
    user = await loadAdminAccount(expected, signal, session);
  guard();
  let lessons, roadmaps;
  try {
    const [queue, library] = await Promise.all([
      get("/admin/content-review/pending", signal),
      get("/roadmaps", signal),
    ]);
    guard();
    lessons = parseReviewLessons(queue);
    roadmaps = parseReviewRoadmaps(library);
  } catch (e) {
    if (e instanceof ReviewFailure || e instanceof AdminDashboardFailure)
      throw e;
    throw new ReviewFailure(
      "The lesson queue and roadmap list couldn’t both be validated. Their values are unavailable.",
    );
  }
  await loadAdminAccount(user, signal, session);
  guard();
  return { user, lessons, roadmaps, checkedAt: new Date().toISOString() };
}
export async function loadRoadmapReview(
  user: AdminUser,
  id: string,
  signal?: AbortSignal,
  session = getToken(),
): Promise<RoadmapDetail> {
  const guard = adminGuard(session);
  await loadAdminAccount(user, signal, session);
  guard();
  try {
    // The review GET may normalize an elapsed takedown; read the row afterwards.
    const reportRaw = await get(`/roadmaps/${reviewId(id)}/review`, signal);
    guard();
    const roadmap = parseReviewRoadmap(
      await get(`/roadmaps/${reviewId(id)}`, signal),
    );
    guard();
    if (roadmap.id !== id) throw new Error();
    const report = parseReviewReport(reportRaw, roadmap);
    await loadAdminAccount(user, signal, session);
    guard();
    return { roadmap, report, checkedAt: new Date().toISOString() };
  } catch (e) {
    if (e instanceof ReviewFailure || e instanceof AdminDashboardFailure)
      throw e;
    throw new ReviewFailure(
      "This roadmap changed or its review details couldn’t be validated. Refresh and open it again.",
    );
  }
}
const changed = () =>
  new ReviewFailure(
    "The selected content or review state changed. No decision was sent. Refresh and review the current version again.",
  );
function uncertain(unavailable = false) {
  return new ReviewFailure(
    "This decision couldn’t be fully confirmed. Moderation actions are paused. Check current state before another decision; an earlier request may still finish.",
    true,
    unavailable,
  );
}
function validateLessonSave(
  raw: unknown,
  a: Extract<ReviewAction, { scope: "lesson" }>,
  user: AdminUser,
) {
  const r = reviewObject(raw),
    saved = parseLessonCore(raw),
    before = a.lesson,
    base = parseLessonCore(before);
  if (
    r.authorId !== (before.author?.id ?? null) ||
    r.reviewedByUserId !== user.id ||
    !saved.reviewedAt
  )
    throw new Error();
  const expected = {
    ...base,
    content:
      a.kind === "approve"
        ? (before.draftContent ?? before.content)
        : before.content,
    draftContent: null,
    reviewStatus:
      a.kind === "approve"
        ? "approved"
        : before.draftContent !== null
          ? before.reviewStatus
          : "rejected",
    rejectionReason: a.kind === "approve" ? null : a.reason!.trim(),
    updatedAt: saved.updatedAt,
    reviewedAt: saved.reviewedAt,
  };
  if (JSON.stringify(saved) !== JSON.stringify(expected)) throw new Error();
  return saved;
}
function validateRoadmapSave(
  raw: unknown,
  a: Extract<ReviewAction, { scope: "roadmap" }>,
  user: AdminUser,
  sentAt: number,
): Roadmap {
  const saved = parseReviewRoadmap(raw),
    before = a.target.roadmap,
    expected = { ...before, updatedAt: saved.updatedAt };
  const reviewed = () => {
    if (!saved.reviewedAt || saved.reviewedByUserId !== user.id)
      throw new Error();
    expected.reviewedAt = saved.reviewedAt;
    expected.reviewedByUserId = user.id;
  };
  const deadline = (date: string | null) => {
    if (
      !date ||
      Math.abs(Date.parse(date) - (sentAt + 30 * 86400000)) > 86400000
    )
      throw new Error();
    return date;
  };
  switch (a.kind) {
    case "publish":
      expected.reviewStatus = "published";
      expected.rejectionReason = null;
      reviewed();
      break;
    case "reject":
      expected.reviewStatus = "draft";
      expected.rejectionReason = a.reason!.trim();
      reviewed();
      break;
    case "unpublish":
      expected.reviewStatus = "draft";
      break;
    case "approve-unpublish":
      expected.unpublishStatus = "approved";
      expected.unpublishEffectiveAt = deadline(saved.unpublishEffectiveAt);
      reviewed();
      break;
    case "deny-unpublish":
      expected.unpublishStatus = "none";
      expected.unpublishEffectiveAt = null;
      break;
    case "schedule-delete":
      expected.deleteEffectiveAt = deadline(saved.deleteEffectiveAt);
      reviewed();
      break;
    case "cancel-scheduled-delete":
      expected.deleteEffectiveAt = null;
      break;
  }
  if (roadmapFingerprint(saved) !== roadmapFingerprint(expected))
    throw new Error();
  return saved;
}
export async function performReviewAction(
  before: ReviewLibrary,
  a: ReviewAction,
  session = getToken(),
): Promise<{ library: ReviewLibrary; message: string }> {
  if (
    requiresReviewReason(a) &&
    !validReviewReason(a.scope !== "purge" ? (a.reason ?? "") : "")
  )
    throw new ReviewFailure(
      "Add specific feedback of 1–2,000 characters before rejecting.",
    );
  const guard = adminGuard(session),
    current = await loadReviewLibrary(before.user, undefined, session);
  guard();
  let freshDetail: RoadmapDetail | undefined;
  if (a.scope === "lesson") {
    const lesson = current.lessons.find((l) => l.id === a.lesson.id);
    if (!lesson || lessonFingerprint(lesson) !== lessonFingerprint(a.lesson))
      throw changed();
  } else if (a.scope === "roadmap") {
    if (!current.roadmaps.some((r) => r.id === a.target.roadmap.id))
      throw changed();
    freshDetail = await loadRoadmapReview(
      current.user,
      a.target.roadmap.id,
      undefined,
      session,
    );
    guard();
    if (
      roadmapFingerprint(freshDetail.roadmap) !==
        roadmapFingerprint(a.target.roadmap) ||
      reportFingerprint(freshDetail.report) !==
        reportFingerprint(a.target.report) ||
      !canRoadmapAction(freshDetail, a.kind)
    )
      throw changed();
  } else {
    const candidates = purgeCandidates(current.roadmaps),
      selected = [...a.roadmaps].sort((a, b) => a.id.localeCompare(b.id));
    if (
      !selected.length ||
      new Set(selected.map((r) => r.id)).size !== selected.length ||
      JSON.stringify(candidates) !== JSON.stringify(selected)
    )
      throw changed();
  }
  guard();
  let raw: unknown;
  const sentAt = Date.now();
  try {
    raw =
      a.scope === "purge"
        ? (
            await apiClient.delete(
              "/admin/content-review/roadmaps/purge-deleted",
              { timeout },
            )
          ).data
        : (
            await apiClient.patch(
              a.scope === "lesson"
                ? `/admin/content-review/${reviewId(a.lesson.id)}/${a.kind}`
                : `/admin/content-review/roadmaps/${reviewId(a.target.roadmap.id)}/${a.kind}`,
              requiresReviewReason(a)
                ? { reason: a.reason!.trim() }
                : undefined,
              { timeout },
            )
          ).data;
  } catch (e) {
    throw uncertain(
      [401, 403].includes(code(e) ?? 0) || getToken() !== session,
    );
  }
  try {
    guard();
    let savedLesson: ReturnType<typeof parseLessonCore> | undefined,
      savedRoadmap: Roadmap | undefined,
      purged: number | undefined;
    if (a.scope === "lesson")
      savedLesson = validateLessonSave(raw, a, current.user);
    else if (a.scope === "roadmap")
      savedRoadmap = validateRoadmapSave(raw, a, current.user, sentAt);
    else purged = reviewCount(reviewObject(raw).purged);
    if (a.scope === "lesson") {
      const readback = await get(`/concepts/${reviewId(a.lesson.id)}`);
      guard();
      if (
        JSON.stringify(validateLessonSave(readback, a, current.user)) !==
        JSON.stringify(savedLesson)
      )
        throw new Error();
    } else if (a.scope === "roadmap") {
      const readback = parseReviewRoadmap(
        await get(`/roadmaps/${reviewId(a.target.roadmap.id)}`),
      );
      guard();
      if (roadmapFingerprint(readback) !== roadmapFingerprint(savedRoadmap!))
        throw new Error();
    } else {
      for (const r of a.roadmaps) {
        if (
          (await get(`/roadmaps/${reviewId(r.id)}`, undefined, true)) !==
          undefined
        )
          throw new Error();
        guard();
      }
    }
    const library = await loadReviewLibrary(current.user, undefined, session);
    guard();
    if (a.scope === "lesson") {
      const row = library.lessons.find((l) => l.id === a.lesson.id),
        shouldRemain = savedLesson!.reviewStatus === "pending";
      if (
        shouldRemain
          ? !row ||
            JSON.stringify(parseLessonCore(row)) !== JSON.stringify(savedLesson)
          : !!row
      )
        throw new Error();
    } else if (a.scope === "roadmap") {
      const row = library.roadmaps.find((r) => r.id === a.target.roadmap.id);
      if (!row || roadmapFingerprint(row) !== roadmapFingerprint(savedRoadmap!))
        throw new Error();
    } else if (
      library.roadmaps.some((r) => a.roadmaps.some((s) => s.id === r.id))
    )
      throw new Error();
    const message =
      a.scope === "purge"
        ? `The server reported ${purged} purged roadmaps. The ${a.roadmaps.length} reviewed overdue roadmaps are absent from checked lookups and the list. The reported count may include other roadmaps due at processing time.`
        : a.scope === "lesson"
          ? "Lesson review saved. The body, review fields and queue were checked. Roadmap publication remains a separate decision."
          : "Roadmap decision saved. Its saved state and the roadmap list were checked. Existing visibility schedules still apply.";
    return { library, message };
  } catch (e) {
    throw uncertain(reviewUnavailable(e) || getToken() !== session);
  }
}
/** GET-only recovery; review GETs may apply the backend's existing lazy date normalization. */
export async function checkReviewState(
  user: AdminUser,
  a?: ReviewAction,
  session = getToken(),
): Promise<ReviewRecovery> {
  const guard = adminGuard(session),
    library = await loadReviewLibrary(user, undefined, session);
  guard();
  let summary =
    "Lesson queue and roadmap list checked. Review the current versions before another decision.";
  if (a?.scope === "lesson") {
    const raw = await get(
      `/concepts/${reviewId(a.lesson.id)}`,
      undefined,
      true,
    );
    guard();
    if (raw === undefined)
      summary =
        "The lesson was not returned by the checked lookup. Queue absence alone does not prove deletion or approval.";
    else {
      const lesson = parseLessonCore(raw);
      if (lesson.id !== a.lesson.id) throw changed();
      summary = `The checked lesson is ${lesson.reviewStatus}, with ${lesson.draftContent !== null ? "a staged draft" : "no staged draft"}. This read does not cancel or attribute an earlier decision.`;
    }
  } else if (a?.scope === "roadmap") {
    const raw = await get(
      `/roadmaps/${reviewId(a.target.roadmap.id)}`,
      undefined,
      true,
    );
    guard();
    if (raw === undefined)
      summary = "The roadmap was not returned by the checked lookup.";
    else {
      const roadmap = parseReviewRoadmap(raw);
      if (roadmap.id !== a.target.roadmap.id) throw changed();
      summary = `The checked roadmap is recorded as ${roadmap.reviewStatus}; takedown state: ${roadmap.unpublishStatus}; deletion ${roadmap.deleteEffectiveAt ? "scheduled for " + roadmap.deleteEffectiveAt : "not scheduled"}. Effective dates can limit public access.`;
    }
  } else if (a?.scope === "purge") {
    const missing = a.roadmaps.filter(
      (r) => !library.roadmaps.some((s) => s.id === r.id),
    );
    summary = `${missing.length} of ${a.roadmaps.length} reviewed overdue roadmaps are absent from the checked list. This does not confirm a complete purge or its reported count.`;
  }
  await loadAdminAccount(user, undefined, session);
  guard();
  return { library, summary };
}
