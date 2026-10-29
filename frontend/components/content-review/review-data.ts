import type { AdminUser } from "@/components/admin-dashboard/admin-dashboard-data";
export type LessonStatus = "pending" | "approved" | "rejected";
export type RoadmapStatus = "draft" | "submitted" | "published";
export interface LessonCore {
  id: string;
  title: string;
  slug: string;
  content: string;
  draftContent: string | null;
  difficulty: "easy" | "medium" | "hard";
  reviewStatus: LessonStatus;
  isAiGenerated: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}
export interface Question {
  id: string;
  questionText: string;
  orderIndex: number;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
  }[];
}
export interface ReviewLesson extends LessonCore {
  author: { id: string; name: string } | null;
  placements: {
    roadmapId: string;
    roadmapTitle: string;
    moduleId: string;
    moduleTitle: string;
    orderIndex: number;
  }[];
  questions: Question[];
}
export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  reviewStatus: RoadmapStatus;
  rejectionReason: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  unpublishStatus: "none" | "requested" | "approved";
  unpublishEffectiveAt: string | null;
  deleteEffectiveAt: string | null;
}
export interface ReviewReport {
  roadmapId: string;
  title: string;
  reviewStatus: RoadmapStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  modules: {
    moduleId: string;
    title: string;
    approved: boolean;
    originLabel: string | null;
    concepts: {
      id: string;
      title: string;
      reviewStatus: LessonStatus;
      rejectionReason: string | null;
      hasPendingDraft: boolean;
      originLabel: string | null;
    }[];
  }[];
  moduleCount: number;
  conceptCount: number;
  pendingCount: number;
  rejectedCount: number;
  canPublish: boolean;
}
export interface RoadmapDetail {
  roadmap: Roadmap;
  report: ReviewReport;
  checkedAt: string;
}
export interface ReviewLibrary {
  user: AdminUser;
  lessons: ReviewLesson[];
  roadmaps: Roadmap[];
  checkedAt: string;
}
export type RoadmapKind =
  | "publish"
  | "reject"
  | "unpublish"
  | "approve-unpublish"
  | "deny-unpublish"
  | "schedule-delete"
  | "cancel-scheduled-delete";
export type ReviewAction =
  | {
      scope: "lesson";
      kind: "approve" | "reject";
      lesson: ReviewLesson;
      reason?: string;
    }
  | {
      scope: "roadmap";
      kind: RoadmapKind;
      target: RoadmapDetail;
      reason?: string;
    }
  | { scope: "purge"; kind: "purge"; roadmaps: Roadmap[] };
export interface ReviewRecovery {
  library: ReviewLibrary;
  summary: string;
}
export function reviewObject(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Incomplete review object");
  return v as Record<string, unknown>;
}
export function reviewText(v: unknown, max = 2000000): string {
  if (typeof v !== "string" || v.length > max)
    throw new Error("Incomplete review text");
  return v;
}
export function reviewId(v: unknown): string {
  const s = reviewText(v, 100);
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s))
    throw new Error("Invalid review identifier");
  return s;
}
export function reviewDate(v: unknown): string {
  const s = reviewText(v, 100);
  if (!Number.isFinite(Date.parse(s))) throw new Error("Invalid review date");
  return new Date(s).toISOString();
}
const nullableDate = (v: unknown) => (v === null ? null : reviewDate(v));
const nullableText = (v: unknown) => (v === null ? null : reviewText(v));
const nullableId = (v: unknown) => (v === null ? null : reviewId(v));
const bool = (v: unknown) => {
  if (typeof v !== "boolean") throw new Error("Incomplete review flag");
  return v;
};
export function reviewCount(v: unknown): number {
  if (!Number.isSafeInteger(v) || (v as number) < 0)
    throw new Error("Invalid review count");
  return v as number;
}
function status<T extends string>(v: unknown, values: readonly T[]): T {
  if (!values.includes(v as T)) throw new Error("Unknown review status");
  return v as T;
}
function rows<T extends { id: string }>(
  v: unknown,
  parse: (v: unknown) => T,
): T[] {
  if (!Array.isArray(v)) throw new Error("Incomplete review list");
  const out = v.map(parse);
  if (new Set(out.map((r) => r.id)).size !== out.length)
    throw new Error("Duplicate review row");
  return out;
}
export function parseLessonCore(v: unknown): LessonCore {
  const r = reviewObject(v);
  return {
    id: reviewId(r.id),
    title: reviewText(r.title),
    slug: reviewText(r.slug),
    content: reviewText(r.content),
    draftContent: nullableText(r.draftContent),
    difficulty: status(r.difficulty, ["easy", "medium", "hard"]),
    reviewStatus: status(r.reviewStatus, ["pending", "approved", "rejected"]),
    isAiGenerated: bool(r.isAiGenerated),
    rejectionReason: nullableText(r.rejectionReason),
    createdAt: reviewDate(r.createdAt),
    updatedAt: reviewDate(r.updatedAt),
    reviewedAt: nullableDate(r.reviewedAt),
  };
}
export function parseReviewLessons(v: unknown): ReviewLesson[] {
  return rows(v, (v) => {
    const r = reviewObject(v),
      core = parseLessonCore(r);
    if (
      core.reviewStatus === "rejected" ||
      (core.reviewStatus === "approved" && core.draftContent === null)
    )
      throw new Error("Not queued for review");
    const a = r.author === null ? null : reviewObject(r.author);
    if (!Array.isArray(r.placements))
      throw new Error("Incomplete review placements");
    const placements = r.placements.map((v) => {
      const p = reviewObject(v);
      return {
        roadmapId: reviewId(p.roadmapId),
        roadmapTitle: reviewText(p.roadmapTitle),
        moduleId: reviewId(p.moduleId),
        moduleTitle: reviewText(p.moduleTitle),
        orderIndex: reviewCount(p.orderIndex),
      };
    });
    if (
      !placements.length ||
      new Set(placements.map((p) => p.moduleId)).size !== placements.length
    )
      throw new Error("Invalid review placements");
    const questions = rows(r.questions, (v) => {
      const q = reviewObject(v);
      return {
        id: reviewId(q.id),
        questionText: reviewText(q.questionText),
        orderIndex: reviewCount(q.orderIndex),
        options: rows(q.options, (v) => {
          const o = reviewObject(v);
          return {
            id: reviewId(o.id),
            optionText: reviewText(o.optionText),
            isCorrect: bool(o.isCorrect),
            orderIndex: reviewCount(o.orderIndex),
          };
        }).sort(
          (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
        ),
      };
    }).sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    return {
      ...core,
      author: a ? { id: reviewId(a.id), name: reviewText(a.name) } : null,
      placements: placements.sort((a, b) =>
        a.moduleId.localeCompare(b.moduleId),
      ),
      questions,
    };
  }).sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
export function parseReviewRoadmap(v: unknown): Roadmap {
  const r = reviewObject(v);
  return {
    id: reviewId(r.id),
    title: reviewText(r.title),
    slug: reviewText(r.slug),
    description: nullableText(r.description),
    createdById: nullableId(r.createdById),
    createdAt: reviewDate(r.createdAt),
    updatedAt: reviewDate(r.updatedAt),
    reviewStatus: status(r.reviewStatus, ["draft", "submitted", "published"]),
    rejectionReason: nullableText(r.rejectionReason),
    reviewedByUserId: nullableId(r.reviewedByUserId),
    reviewedAt: nullableDate(r.reviewedAt),
    unpublishStatus: status(r.unpublishStatus, [
      "none",
      "requested",
      "approved",
    ]),
    unpublishEffectiveAt: nullableDate(r.unpublishEffectiveAt),
    deleteEffectiveAt: nullableDate(r.deleteEffectiveAt),
  };
}
export const parseReviewRoadmaps = (v: unknown) =>
  rows(v, parseReviewRoadmap).sort(
    (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
  );
const origin = (v: unknown) =>
  v == null ? null : status(v, ["ai", "handwritten", "partial"]);
export function parseReviewReport(v: unknown, roadmap: Roadmap): ReviewReport {
  const r = reviewObject(v);
  if (!Array.isArray(r.modules)) throw new Error("Incomplete module review");
  const modules = r.modules.map((v) => {
    const m = reviewObject(v),
      concepts = rows(m.concepts, (v) => {
        const c = reviewObject(v);
        return {
          id: reviewId(c.id),
          title: reviewText(c.title),
          reviewStatus: status(c.reviewStatus, [
            "pending",
            "approved",
            "rejected",
          ]),
          rejectionReason: nullableText(c.rejectionReason),
          hasPendingDraft: bool(c.hasPendingDraft),
          originLabel: origin(c.originLabel),
        };
      });
    const approved = bool(m.approved);
    if (
      approved !==
      (concepts.length > 0 &&
        concepts.every((c) => c.reviewStatus === "approved"))
    )
      throw new Error("Inconsistent module review");
    return {
      moduleId: reviewId(m.moduleId),
      title: reviewText(m.title),
      approved,
      originLabel: origin(m.originLabel),
      concepts,
    };
  });
  if (new Set(modules.map((m) => m.moduleId)).size !== modules.length)
    throw new Error("Duplicate review module");
  const all = modules.flatMap((m) => m.concepts),
    pendingCount = reviewCount(r.pendingCount),
    rejectedCount = reviewCount(r.rejectedCount),
    canPublish = bool(r.canPublish);
  if (
    reviewId(r.roadmapId) !== roadmap.id ||
    r.title !== roadmap.title ||
    r.reviewStatus !== roadmap.reviewStatus ||
    r.rejectionReason !== roadmap.rejectionReason ||
    nullableDate(r.reviewedAt) !== roadmap.reviewedAt ||
    reviewCount(r.moduleCount) !== modules.length ||
    reviewCount(r.conceptCount) !== all.length ||
    pendingCount !== all.filter((c) => c.reviewStatus === "pending").length ||
    rejectedCount !== all.filter((c) => c.reviewStatus === "rejected").length ||
    canPublish !==
      (roadmap.reviewStatus === "submitted" &&
        pendingCount === 0 &&
        rejectedCount === 0)
  )
    throw new Error("Inconsistent publication review");
  return {
    roadmapId: roadmap.id,
    title: roadmap.title,
    reviewStatus: roadmap.reviewStatus,
    rejectionReason: nullableText(r.rejectionReason),
    reviewedAt: nullableDate(r.reviewedAt),
    modules,
    moduleCount: modules.length,
    conceptCount: all.length,
    pendingCount,
    rejectedCount,
    canPublish,
  };
}
export const lessonFingerprint = (r: ReviewLesson) => JSON.stringify(r);
export const roadmapFingerprint = (r: Roadmap) => JSON.stringify(r);
export const reportFingerprint = (r: ReviewReport) =>
  JSON.stringify({
    ...r,
    modules: [...r.modules]
      .sort((a, b) => a.moduleId.localeCompare(b.moduleId))
      .map((m) => ({
        ...m,
        concepts: [...m.concepts].sort((a, b) => a.id.localeCompare(b.id)),
      })),
  });
export const deletionDue = (r: Roadmap, at = Date.now()) =>
  !!r.deleteEffectiveAt && Date.parse(r.deleteEffectiveAt) <= at;
export const unpublishDue = (r: Roadmap, at = Date.now()) =>
  r.reviewStatus === "published" &&
  r.unpublishStatus === "approved" &&
  !!r.unpublishEffectiveAt &&
  Date.parse(r.unpublishEffectiveAt) <= at;
export const effectiveRoadmapStatus = (r: Roadmap, at = Date.now()) =>
  unpublishDue(r, at) ? "draft" : r.reviewStatus;
export const purgeCandidates = (r: Roadmap[], at = Date.now()) =>
  r.filter((r) => deletionDue(r, at)).sort((a, b) => a.id.localeCompare(b.id));
export function canRoadmapAction(
  d: RoadmapDetail,
  kind: RoadmapKind,
  at = Date.now(),
) {
  const r = d.roadmap;
  switch (kind) {
    case "publish":
      return r.reviewStatus === "submitted" && d.report.canPublish;
    case "reject":
      return r.reviewStatus === "submitted";
    case "unpublish":
      return r.reviewStatus === "published";
    case "approve-unpublish":
      return r.unpublishStatus === "requested";
    case "deny-unpublish":
      return (
        r.unpublishStatus === "requested" ||
        (r.reviewStatus === "published" &&
          r.unpublishStatus === "approved" &&
          !!r.unpublishEffectiveAt &&
          Date.parse(r.unpublishEffectiveAt) > at)
      );
    case "schedule-delete":
      return r.deleteEffectiveAt === null;
    case "cancel-scheduled-delete":
      return r.deleteEffectiveAt !== null;
  }
}
export const requiresReviewReason = (a: ReviewAction) =>
  a.scope !== "purge" && a.kind === "reject";
export const validReviewReason = (s: string) =>
  s.trim().length > 0 && s.trim().length <= 2000;
export const actionTitle = (a: ReviewAction) =>
  a.scope === "purge"
    ? "Purge all overdue roadmaps"
    : a.scope === "lesson"
      ? a.kind === "approve"
        ? "Approve lesson"
        : "Reject lesson"
      : {
          publish: "Publish roadmap",
          reject: "Return roadmap to draft",
          unpublish: "Unpublish now",
          "approve-unpublish": "Approve takedown request",
          "deny-unpublish": "Close takedown request",
          "schedule-delete": "Schedule deletion",
          "cancel-scheduled-delete": "Cancel scheduled deletion",
        }[a.kind];
export const reviewDisplayDate = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
export function filterReviewLessons(
  rows: ReviewLesson[],
  search: string,
  originFilter: string,
  kind: string,
) {
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q ||
        r.title.toLowerCase().includes(q) ||
        r.author?.name.toLowerCase().includes(q)) &&
      (originFilter === "all" ||
        (originFilter === "ai" ? r.isAiGenerated : !r.isAiGenerated)) &&
      (kind === "all" ||
        (kind === "staged"
          ? r.draftContent !== null
          : r.draftContent === null)),
  );
}
export function filterReviewRoadmaps(
  rows: Roadmap[],
  search: string,
  filter: string,
  at: number,
) {
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || r.title.toLowerCase().includes(q)) &&
      (filter === "all" ||
        (filter === "scheduled"
          ? !!r.deleteEffectiveAt
          : filter === "takedown"
            ? r.unpublishStatus !== "none"
            : effectiveRoadmapStatus(r, at) === filter)),
  );
}
