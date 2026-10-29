import type { User } from "@/lib/auth";
export const NOTIFICATION_TYPES = {
  roadmap_submitted: "Roadmap submitted",
  roadmap_published: "Roadmap published",
  roadmap_rejected: "Roadmap needs changes",
  concept_approved: "Lesson approved",
  concept_rejected: "Lesson needs changes",
  roadmap_unpublish_approved: "Unpublish request approved",
  roadmap_unpublished: "Roadmap unpublished",
  roadmap_deleted: "Roadmap deletion notice",
  article_deleted: "Article removed",
  ai_job_completed: "AI job completed",
  ai_job_failed: "AI job failed",
};
export interface Notice {
  id: string;
  userId: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  payload: Record<string, string | number | null>;
}
export interface Inbox {
  user: User;
  items: Notice[];
  unread: number;
  checkedAt: string;
}
const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
function date(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Error("Invalid notification date");
  return new Date(value).toISOString();
}
export function parseNotice(raw: unknown, userId: string): Notice {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid notification");
  const row = raw as Record<string, unknown>;
  if (
    !uuid(row.id) ||
    row.userId !== userId ||
    typeof row.type !== "string" ||
    !/^\w{1,64}$/.test(row.type) ||
    typeof row.isRead !== "boolean" ||
    !row.payload ||
    typeof row.payload !== "object" ||
    Array.isArray(row.payload)
  )
    throw new Error("Invalid notification");
  const payload: Notice["payload"] = {},
    p = row.payload as Record<string, unknown>;
  for (const key of [
    "roadmapTitle",
    "conceptTitle",
    "title",
    "targetLabel",
    "reason",
    "reviewedBy",
    "removedBy",
    "what",
    "jobType",
    "status",
    "reviewStatus",
  ]) {
    if (p[key] == null) continue;
    if (typeof p[key] !== "string" || (p[key] as string).length > 20000)
      throw new Error("Invalid notification details");
    payload[key] = p[key] as string;
  }
  for (const key of ["roadmapId", "conceptId", "whatId", "jobId"])
    if (p[key] != null) {
      if (!uuid(p[key])) throw new Error("Invalid notification target");
      payload[key] = p[key];
    }
  for (const key of ["reviewedAt", "removedAt", "effectiveAt"])
    if (p[key] != null) payload[key] = date(p[key]);
  for (const key of ["createdCount", "failedCount"])
    if (p[key] != null) {
      if (!Number.isSafeInteger(p[key]) || (p[key] as number) < 0)
        throw new Error("Invalid notification count");
      payload[key] = p[key] as number;
    }
  const readAt = row.readAt == null ? null : date(row.readAt);
  if (row.isRead !== !!readAt) throw new Error("Incomplete read state");
  return {
    id: row.id,
    userId,
    type: row.type,
    createdAt: date(row.createdAt),
    isRead: row.isRead,
    readAt,
    payload,
  };
}
export function parseNotices(raw: unknown, userId: string): Notice[] {
  if (!Array.isArray(raw)) throw new Error("Incomplete notification list");
  const rows = raw.map((row) => parseNotice(row, userId));
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new Error("Duplicate notification");
  return rows.sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
export function notificationCount(raw: unknown, key = "unread"): number {
  const n = (raw as Record<string, unknown> | null)?.[key];
  if (!Number.isSafeInteger(n) || (n as number) < 0)
    throw new Error("Invalid count");
  return n as number;
}
export const noticeFingerprint = (n: Notice) =>
  JSON.stringify([n.id, n.userId, n.type, n.createdAt, n.payload]);
export const noticeLabel = (n: Notice) =>
  Object.hasOwn(NOTIFICATION_TYPES, n.type)
    ? NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]
    : "Account update";
export const noticeTitle = (n: Notice) =>
  String(
    n.payload.conceptTitle ||
      n.payload.roadmapTitle ||
      n.payload.title ||
      n.payload.targetLabel ||
      noticeLabel(n),
  );
export function noticeTarget(
  n: Notice,
  role: User["role"],
): { href: string; label: string } | undefined {
  if (n.type === "roadmap_submitted")
    return role === "admin"
      ? { href: "/admin/content-review", label: "Open review queue" }
      : undefined;
  if (
    n.type === "roadmap_deleted" ||
    n.type === "roadmap_unpublished" ||
    n.type === "roadmap_unpublish_approved"
  )
    return { href: "/developer/content", label: "Open my content" };
  if (n.type === "article_deleted")
    return { href: "/developer/articles", label: "Open my articles" };
  if (n.type.startsWith("ai_job_"))
    return { href: "/developer/generate", label: "Open generation & jobs" };
  if (
    ["concept_approved", "concept_rejected"].includes(n.type) &&
    n.payload.conceptId
  )
    return {
      href: `/developer/concepts/${encodeURIComponent(n.payload.conceptId)}/edit`,
      label: "Open lesson editor",
    };
  if (
    ["roadmap_published", "roadmap_rejected"].includes(n.type) &&
    n.payload.roadmapId
  )
    return {
      href: `/developer/content/${encodeURIComponent(n.payload.roadmapId)}`,
      label: "Open roadmap editor",
    };
}
export function notificationDate(value: string) {
  return (
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
