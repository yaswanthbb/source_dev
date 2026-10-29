import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import { parseContentUser } from "@/components/content/content-data";
import {
  loadNotifications,
  NotificationFailure,
} from "@/components/notifications/notifications-client";
import {
  parseAdminSection,
  type AdminSections,
  type AdminUser,
  type Checked,
} from "./admin-dashboard-data";
export class AdminDashboardFailure extends Error {
  constructor(
    message: string,
    public unavailable = false,
  ) {
    super(message);
  }
}
const changed = () =>
  new AdminDashboardFailure(
    "Admin access or your account changed. Cached dashboard data is hidden; reload or sign in again.",
    true,
  );
export function adminGuard(session: string | null) {
  if (!session || getToken() !== session) throw changed();
  return () => {
    if (getToken() !== session) throw changed();
  };
}
const denied = (e: unknown) =>
  [401, 403, 404].includes(
    (e as { response?: { status?: number } })?.response?.status ?? 0,
  );
export async function loadAdminAccount(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
  session = getToken(),
): Promise<AdminUser> {
  const guard = adminGuard(session);
  let raw: unknown;
  try {
    raw = (await apiClient.get("/users/me", { timeout: 12000, signal })).data;
  } catch (e) {
    throw new AdminDashboardFailure(
      "Your admin account couldn’t be checked. Try checking access again.",
      denied(e),
    );
  }
  guard();
  try {
    const u = parseContentUser(raw);
    if (
      u.role !== "admin" ||
      (expected && (u.id !== expected.id || u.role !== expected.role))
    )
      throw changed();
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  } catch {
    throw changed();
  }
}
export const ADMIN_PATHS = {
  overview: "/admin/analytics/overview",
  roadmaps: "/admin/analytics/roadmaps",
  concepts: "/admin/analytics/concepts",
  developers: "/admin/analytics/developers",
  queue: "/admin/content-review/pending",
} as const;
export async function loadAdminSection<K extends keyof AdminSections>(
  user: AdminUser,
  kind: K,
  signal?: AbortSignal,
  session = getToken(),
): Promise<Checked<AdminSections[K]>> {
  const guard = adminGuard(session);
  await loadAdminAccount(user, signal, session);
  guard();
  let value: AdminSections[K];
  try {
    const raw = (
      await apiClient.get(ADMIN_PATHS[kind], { timeout: 12000, signal })
    ).data;
    guard();
    value = parseAdminSection(kind, raw);
  } catch (e) {
    if (e instanceof AdminDashboardFailure) throw e;
    throw new AdminDashboardFailure(
      "This section couldn’t be fully checked. Refresh it before relying on these values.",
      denied(e),
    );
  }
  await loadAdminAccount(user, signal, session);
  guard();
  return { value, checkedAt: new Date().toISOString() };
}
export async function loadAdminFeed(
  user: AdminUser,
  signal?: AbortSignal,
  session = getToken(),
) {
  const guard = adminGuard(session);
  await loadAdminAccount(user, signal, session);
  guard();
  try {
    const inbox = await loadNotifications(user, signal);
    guard();
    await loadAdminAccount(user, signal, session);
    guard();
    return inbox;
  } catch (e) {
    if (e instanceof AdminDashboardFailure) throw e;
    throw new AdminDashboardFailure(
      "Your notifications couldn’t be checked. Refresh this section or use the bell.",
      e instanceof NotificationFailure && e.unavailable,
    );
  }
}
