import apiClient from "@/lib/api-client";
import { getToken } from "@/lib/auth";
import {
  loadAdminAccount,
  adminGuard,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import type { AdminUser } from "@/components/admin-dashboard/admin-dashboard-data";
import {
  parseDirectory,
  parseRequests,
  userObject,
  userId,
  userDate,
  userFingerprint,
  requestFingerprint,
  actionable,
  requestTarget,
  type UsersLibrary,
  type UsersAction,
  type UsersRecovery,
} from "./admin-users-data";
export class UsersFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
const status = (e: unknown) =>
  (e as { response?: { status?: number } })?.response?.status;
export const usersUnavailable = (e: unknown) =>
  (e instanceof UsersFailure || e instanceof AdminDashboardFailure) &&
  e.unavailable;
export function safeUsersError(e: unknown) {
  return e instanceof UsersFailure || e instanceof AdminDashboardFailure
    ? e.message
    : "User details couldn’t be checked. Refresh before continuing.";
}
const timeout = 12000;
export async function loadUsersLibrary(
  expected?: Pick<AdminUser, "id" | "role">,
  signal?: AbortSignal,
  session = getToken(),
): Promise<UsersLibrary> {
  const guard = adminGuard(session),
    user = await loadAdminAccount(expected, signal, session);
  guard();
  let users, requests;
  try {
    const [directory, deletions] = await Promise.all([
      apiClient.get("/users", { timeout, signal }),
      apiClient.get("/users/deletion-requests", { timeout, signal }),
    ]);
    guard();
    users = parseDirectory(directory.data);
    requests = parseRequests(deletions.data);
  } catch (e) {
    if (e instanceof AdminDashboardFailure) throw e;
    throw new UsersFailure(
      "The directory and deletion requests couldn’t both be checked. This check makes no account changes.",
      false,
      [401, 403, 404].includes(status(e) ?? 0),
    );
  }
  await loadAdminAccount(user, signal, session);
  guard();
  return { user, users, requests, checkedAt: new Date().toISOString() };
}
function uncertainty(unavailable = false) {
  return new UsersFailure(
    "This change couldn’t be fully confirmed. Account changes are paused. Check current state before continuing; an earlier request may still finish.",
    true,
    unavailable,
  );
}
export async function performUsersAction(
  before: UsersLibrary,
  action: UsersAction,
  session = getToken(),
): Promise<UsersLibrary> {
  const guard = adminGuard(session),
    current = await loadUsersLibrary(before.user, undefined, session);
  guard();
  const target = current.users.find((u) => u.id === action.target.id);
  if (
    !target ||
    !actionable(target, current.user) ||
    userFingerprint(target) !== userFingerprint(action.target)
  )
    throw new UsersFailure(
      "This account changed, is protected, or is no longer listed. No change was sent. Refresh and review it again.",
    );
  if (action.kind !== "delete") {
    const request = current.requests.find((r) => r.id === action.request.id);
    if (
      !request ||
      request.status !== "pending" ||
      requestFingerprint(request) !== requestFingerprint(action.request) ||
      requestTarget(current, request)?.id !== target.id
    )
      throw new UsersFailure(
        "This request changed or is no longer pending. No change was sent. Refresh and review it again.",
      );
  }
  guard();
  let raw: unknown;
  try {
    raw =
      action.kind === "delete"
        ? (await apiClient.delete(`/users/${userId(target.id)}`, { timeout }))
            .data
        : (
            await apiClient.patch(
              `/users/deletion-requests/${userId(action.request.id)}/${action.kind}`,
              undefined,
              { timeout },
            )
          ).data;
  } catch (e) {
    const code = status(e),
      denied = [401, 403].includes(code ?? 0);
    // Approval saves review state before deletion; even a 4xx can follow a partial write.
    if (
      action.kind === "approve" ||
      !code ||
      code === 408 ||
      code >= 500 ||
      getToken() !== session
    )
      throw uncertainty(denied || getToken() !== session);
    throw new UsersFailure(
      "The server refused this change. Refresh the directory and review the current account or request before trying again.",
      false,
      denied,
    );
  }
  try {
    guard();
    const ack = userObject(raw);
    if (action.kind === "reject") {
      if (
        userId(ack.id) !== action.request.id ||
        userId(ack.userId) !== target.id ||
        ack.status !== "rejected" ||
        userId(ack.reviewedByAdminId) !== current.user.id ||
        ack.reason !== action.request.reason
      )
        throw new Error();
      userDate(ack.reviewedAt);
    } else if (ack.success !== true) throw new Error();
    const checked = await loadUsersLibrary(before.user, undefined, session);
    guard();
    if (action.kind === "reject") {
      const request = checked.requests.find((r) => r.id === action.request.id),
        user = checked.users.find((u) => u.id === target.id);
      if (
        !request ||
        request.status !== "rejected" ||
        request.userId !== target.id ||
        request.reason !== action.request.reason ||
        request.reviewedByAdminId !== current.user.id ||
        request.reviewedAt !== userDate(ack.reviewedAt) ||
        !user ||
        userFingerprint(user) !== userFingerprint(target)
      )
        throw new Error();
    } else if (
      checked.users.some((u) => u.id === target.id) ||
      checked.requests.some((r) => r.userId === target.id)
    )
      throw new Error();
    return checked;
  } catch (e) {
    throw uncertainty(usersUnavailable(e) || getToken() !== session);
  }
}
/** Read-only recovery does not repeat the earlier mutation. */
export async function checkUsersState(
  expected: AdminUser,
  action?: UsersAction,
  session = getToken(),
): Promise<UsersRecovery> {
  const library = await loadUsersLibrary(expected, undefined, session);
  if (!action)
    return {
      library,
      summary:
        "Directory and requests checked. Review the current list before continuing.",
    };
  const user = library.users.find((u) => u.id === action.target.id);
  const request =
    action.kind === "delete"
      ? undefined
      : library.requests.find((r) => r.id === action.request.id);
  const summary = !user
    ? "The account is absent from the checked directory. This read does not establish which request removed it."
    : action.kind !== "delete"
      ? `The account is still listed. The request is ${request?.status ?? "no longer listed"}.`
      : "The account is still listed in the checked directory.";
  return { library, summary };
}
