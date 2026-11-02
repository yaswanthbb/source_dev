import type { User } from "@/lib/auth";

export interface OwnRoadmap {
  id: string;
  title: string;
  description: string | null;
  createdById: string;
  reviewStatus: "draft" | "submitted" | "published";
  status: "draft" | "submitted" | "published" | "removed";
  createdAt: string;
  updatedAt?: string;
  moduleCount?: number;
  originLabel?: "ai" | "handwritten" | "partial" | null;
  rejectionReason?: string | null;
  unpublishStatus?: "none" | "requested" | "approved";
  unpublishEffectiveAt?: string | null;
  deleteEffectiveAt?: string | null;
}
export interface ContentLibrary {
  user: User;
  roadmaps: OwnRoadmap[];
  loadedAt: string;
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Content data is incomplete. Reload your library.");
  return value as Record<string, unknown>;
};
export function contentId(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value))
    throw new Error("Content data is incomplete. Reload your library.");
  return value;
}
function string(value: unknown) {
  if (typeof value !== "string")
    throw new Error("Content data is incomplete. Reload your library.");
  return value;
}
function timestamp(value: unknown) {
  const result = string(value);
  if (!Number.isFinite(Date.parse(result)))
    throw new Error("Content dates are incomplete. Reload your library.");
  return result;
}
function optionalDate(value: unknown) {
  return value == null ? null : timestamp(value);
}
export function parseContentUser(value: unknown): User {
  const user = object(value);
  if (user.role !== "developer" && user.role !== "admin")
    throw new Error("Your account cannot author content. Sign in again.");
  return {
    id: contentId(user.id),
    name: string(user.name),
    email: string(user.email),
    role: user.role,
    profilePicture:
      typeof user.profilePicture === "string" ? user.profilePicture : null,
  };
}
export function parseOwnRoadmap(
  value: unknown,
  userId: string,
  now: number,
): OwnRoadmap {
  const row = object(value),
    id = contentId(row.id);
  if (
    row.createdById !== userId ||
    !["draft", "submitted", "published"].includes(String(row.reviewStatus))
  )
    throw new Error(
      "Content ownership or review status changed. Reload your library.",
    );
  const reviewStatus = row.reviewStatus as OwnRoadmap["reviewStatus"];
  if (
    row.unpublishStatus != null &&
    !["none", "requested", "approved"].includes(String(row.unpublishStatus))
  )
    throw new Error("Publication metadata is incomplete. Reload your library.");
  const unpublishEffectiveAt = optionalDate(row.unpublishEffectiveAt),
    deleteEffectiveAt = optionalDate(row.deleteEffectiveAt);
  const status =
    deleteEffectiveAt && Date.parse(deleteEffectiveAt) <= now
      ? "removed"
      : row.unpublishStatus === "approved" &&
          unpublishEffectiveAt &&
          Date.parse(unpublishEffectiveAt) <= now
        ? "draft"
        : reviewStatus;
  let moduleCount: number | undefined;
  if (
    typeof row.moduleCount === "number" &&
    Number.isInteger(row.moduleCount) &&
    row.moduleCount >= 0
  )
    moduleCount = row.moduleCount;
  else if (Array.isArray(row.modules)) moduleCount = row.modules.length;
  else if (row.moduleCount != null)
    throw new Error("Module counts are incomplete. Reload your library.");
  return {
    id,
    title: string(row.title),
    description: row.description == null ? null : string(row.description),
    createdById: userId,
    reviewStatus,
    status,
    createdAt: timestamp(row.createdAt),
    updatedAt: row.updatedAt == null ? undefined : timestamp(row.updatedAt),
    moduleCount,
    originLabel:
      row.originLabel === "ai" ||
      row.originLabel === "handwritten" ||
      row.originLabel === "partial"
        ? row.originLabel
        : null,
    rejectionReason:
      row.rejectionReason == null ? null : string(row.rejectionReason),
    unpublishStatus: row.unpublishStatus as OwnRoadmap["unpublishStatus"],
    unpublishEffectiveAt,
    deleteEffectiveAt,
  };
}
export function parseContentLibrary(
  userValue: unknown,
  value: unknown,
  now = Date.now(),
): ContentLibrary {
  const user = parseContentUser(userValue);
  if (!Array.isArray(value))
    throw new Error("Content data is incomplete. Reload your library.");
  const seen = new Set<string>();
  const roadmaps = value
    .filter((raw) => object(raw).createdById === user.id)
    .map((raw) => {
      const roadmap = parseOwnRoadmap(raw, user.id, now);
      if (seen.has(roadmap.id))
        throw new Error("Duplicate content returned. Reload your library.");
      seen.add(roadmap.id);
      return roadmap;
    });
  return { user, roadmaps, loadedAt: new Date(now).toISOString() };
}
export const CONTENT_STATUSES = {
  all: "All roadmaps",
  draft: "Drafts",
  submitted: "In review",
  published: "Published",
  removed: "Deletion effective",
};
export function filterOwnRoadmaps(
  rows: OwnRoadmap[],
  search: string,
  status: string,
  sort: string,
) {
  const query = search.trim().toLocaleLowerCase();
  return rows
    .filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!query ||
          `${r.title} ${r.description ?? ""}`
            .toLocaleLowerCase()
            .includes(query)),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
}
export function roadmapDraftErrors(title: string, description: string) {
  return {
    title: !title.trim()
      ? "Give your roadmap a title."
      : title.trim().length > 120
        ? "Use 120 characters or fewer for the title."
        : undefined,
    description:
      description.trim().length > 2000
        ? "Keep the description within 2,000 characters."
        : undefined,
  };
}
export const contentDate = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
