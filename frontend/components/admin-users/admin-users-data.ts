import type { AdminUser } from "@/components/admin-dashboard/admin-dashboard-data";
export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: "developer" | "admin";
  createdAt: string;
}
export interface DeletionRequest {
  id: string;
  userId: string;
  user: Pick<DirectoryUser, "id" | "name" | "email" | "role"> | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewer: string | null;
}
export interface UsersLibrary {
  user: AdminUser;
  users: DirectoryUser[];
  requests: DeletionRequest[];
  checkedAt: string;
}
export type UsersAction =
  | { kind: "delete"; target: DirectoryUser }
  | {
      kind: "approve" | "reject";
      target: DirectoryUser;
      request: DeletionRequest;
    };
export interface UsersRecovery {
  library: UsersLibrary;
  summary: string;
}
export function userObject(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Incomplete user details");
  return v as Record<string, unknown>;
}
function text(v: unknown, max = 20000): string {
  if (typeof v !== "string" || v.length > max)
    throw new Error("Incomplete user text");
  return v;
}
export function userId(v: unknown): string {
  const s = text(v);
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s))
    throw new Error("Invalid user identifier");
  return s;
}
export function userDate(v: unknown): string {
  const s = text(v);
  if (!Number.isFinite(Date.parse(s))) throw new Error("Invalid user date");
  return new Date(s).toISOString();
}
function identity(v: unknown) {
  const r = userObject(v);
  if (r.role !== "admin" && r.role !== "developer")
    throw new Error("Unknown user role");
  const email = text(r.email, 320);
  if (!/^[^\s@]+@[^\s@]+$/.test(email))
    throw new Error("Invalid account email");
  return {
    id: userId(r.id),
    name: text(r.name),
    email,
    role: r.role as DirectoryUser["role"],
  };
}
function rows<T>(v: unknown, parse: (v: unknown) => T & { id: string }): T[] {
  if (!Array.isArray(v)) throw new Error("Incomplete user list");
  const parsed = v.map(parse);
  if (new Set(parsed.map((r) => r.id)).size !== parsed.length)
    throw new Error("Duplicate user record");
  return parsed;
}
export function parseDirectory(v: unknown): DirectoryUser[] {
  return rows(v, (v) => ({
    ...identity(v),
    createdAt: userDate(userObject(v).createdAt),
  }));
}
export function parseRequests(v: unknown): DeletionRequest[] {
  return rows(v, (v) => {
    const r = userObject(v),
      uid = userId(r.userId),
      user = r.user == null ? null : identity(r.user);
    if (user && user.id !== uid) throw new Error("Mismatched request account");
    if (
      r.status !== "pending" &&
      r.status !== "approved" &&
      r.status !== "rejected"
    )
      throw new Error("Unknown request status");
    const reviewedAt = r.reviewedAt === null ? null : userDate(r.reviewedAt);
    const reviewerId =
      r.reviewedByAdminId == null ? null : userId(r.reviewedByAdminId);
    if (r.status === "pending" && (reviewedAt || reviewerId))
      throw new Error("Inconsistent pending request");
    if (r.status !== "pending" && !reviewedAt)
      throw new Error("Missing review date");
    const reviewer =
      r.reviewedByAdmin == null ? null : userObject(r.reviewedByAdmin);
    if (reviewer && userId(reviewer.id) !== reviewerId)
      throw new Error("Mismatched reviewer");
    return {
      id: userId(r.id),
      userId: uid,
      user,
      reason: r.reason === null ? null : text(r.reason),
      status: r.status,
      createdAt: userDate(r.createdAt),
      reviewedAt,
      reviewedByAdminId: reviewerId,
      reviewer: reviewer ? text(reviewer.name) : null,
    };
  });
}
export const userFingerprint = (u: DirectoryUser) =>
  JSON.stringify([u.id, u.name, u.email, u.role, u.createdAt]);
export const requestFingerprint = (r: DeletionRequest) =>
  JSON.stringify([
    r.id,
    r.userId,
    r.user?.id,
    r.user?.name,
    r.user?.email,
    r.user?.role,
    r.reason,
    r.status,
    r.createdAt,
    r.reviewedAt,
    r.reviewedByAdminId,
  ]);
export function requestTarget(
  library: UsersLibrary,
  r: DeletionRequest,
): DirectoryUser | undefined {
  const u = library.users.find((u) => u.id === r.userId);
  return u &&
    r.user &&
    u.name === r.user.name &&
    u.email === r.user.email &&
    u.role === r.user.role
    ? u
    : undefined;
}
export const actionable = (u: DirectoryUser, actor: AdminUser) =>
  u.role === "developer" && u.id !== actor.id;
export function filterDirectory(
  users: DirectoryUser[],
  search: string,
  role: string,
  sort: string,
) {
  const q = search.trim().toLocaleLowerCase("en");
  return users
    .filter(
      (u) =>
        (role === "all" || role === u.role) &&
        (!q ||
          u.name.toLocaleLowerCase("en").includes(q) ||
          u.email.toLocaleLowerCase("en").includes(q)),
    )
    .sort((a, b) =>
      sort === "newest"
        ? Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          a.id.localeCompare(b.id)
        : a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    );
}
export function filterRequests(requests: DeletionRequest[], status: string) {
  return requests
    .filter((r) => status === "all" || r.status === status)
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        a.id.localeCompare(b.id),
    );
}
export const displayUserDate = (v: string) =>
  new Date(v).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
