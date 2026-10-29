import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import { parseContentUser } from "@/components/content/content-data";
import {
  parseNotice,
  parseNotices,
  notificationCount,
  noticeFingerprint,
  type Inbox,
} from "./notifications-data";
export class NotificationFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
    public conflict = false,
  ) {
    super(message);
  }
}
const changed = () =>
  new NotificationFailure(
    "Your account changed or notification access couldn’t be confirmed. Reload or sign in again.",
    false,
    true,
  );
const code = (e: unknown) =>
  (e as { response?: { status?: number } })?.response?.status;
function guardSession() {
  const token = getToken();
  if (!token) throw changed();
  return () => {
    if (getToken() !== token) throw changed();
  };
}
async function account(
  expected: Pick<User, "id" | "role">,
  signal?: AbortSignal,
) {
  let raw: unknown;
  try {
    raw = (await apiClient.get("/users/me", { timeout: 12000, signal })).data;
  } catch (e) {
    throw new NotificationFailure(
      "Your account couldn’t be checked. Try refreshing the inbox.",
      false,
      [401, 403, 404].includes(code(e) ?? 0),
    );
  }
  try {
    const user = parseContentUser(raw);
    if (user.id !== expected.id || user.role !== expected.role) throw changed();
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch {
    throw changed();
  }
}
export async function loadNotificationCount(
  expected: User,
  signal?: AbortSignal,
): Promise<number> {
  const guard = guardSession();
  await account(expected, signal);
  guard();
  try {
    const raw = (
      await apiClient.get("/notifications/unread-count", {
        timeout: 12000,
        signal,
      })
    ).data;
    guard();
    return notificationCount(raw);
  } catch (e) {
    if (e instanceof NotificationFailure) throw e;
    throw new NotificationFailure(
      "The unread count is unavailable. Open the inbox to check again.",
      false,
      [401, 403, 404].includes(code(e) ?? 0),
    );
  }
}
export async function loadNotifications(
  expected: User,
  signal?: AbortSignal,
): Promise<Inbox> {
  const guard = guardSession(),
    user = await account(expected, signal);
  guard();
  try {
    const raw = (
      await apiClient.get("/notifications", { timeout: 12000, signal })
    ).data;
    guard();
    const items = parseNotices(raw, user.id),
      count = (
        await apiClient.get("/notifications/unread-count", {
          timeout: 12000,
          signal,
        })
      ).data;
    guard();
    return {
      user,
      items,
      unread: notificationCount(count),
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    if (e instanceof NotificationFailure) throw e;
    throw new NotificationFailure(
      "Your inbox couldn’t be fully checked. Refresh before changing read state.",
      false,
      [401, 403, 404].includes(code(e) ?? 0),
    );
  }
}
export async function markNotifications(
  before: Inbox,
  target: string | "all",
): Promise<{ inbox: Inbox; marked: number; already: boolean }> {
  const selected =
    target === "all" ? undefined : before.items.find((n) => n.id === target);
  if (target !== "all" && !selected)
    throw new NotificationFailure(
      "Choose a notification from the checked inbox.",
    );
  const guard = guardSession(),
    fresh = await loadNotifications(before.user);
  guard();
  if (selected) {
    const row = fresh.items.find((n) => n.id === selected.id);
    if (!row || noticeFingerprint(row) !== noticeFingerprint(selected))
      throw new NotificationFailure(
        "This notification changed or is no longer available. Refresh and review before continuing.",
        false,
        false,
        true,
      );
    if (row.isRead) return { inbox: fresh, marked: 0, already: true };
  } else if (fresh.unread === 0 && fresh.items.every((n) => n.isRead))
    return { inbox: fresh, marked: 0, already: true };
  let raw: unknown;
  try {
    raw =
      target === "all"
        ? (
            await apiClient.post("/notifications/read-all", undefined, {
              timeout: 12000,
            })
          ).data
        : (
            await apiClient.patch(`/notifications/${target}/read`, undefined, {
              timeout: 12000,
            })
          ).data;
  } catch (e) {
    const status = code(e),
      refused = !!status && status >= 400 && status < 500 && status !== 408;
    let unavailable = [401, 403, 404].includes(status ?? 0);
    try {
      guard();
    } catch {
      unavailable = true;
    }
    throw new NotificationFailure(
      refused
        ? "The read-state change was refused. Refresh before trying again."
        : "The read-state change couldn’t be confirmed. It may have completed. Writes are paused until you check the inbox.",
      !refused,
      unavailable,
    );
  }
  try {
    guard();
    let marked = 0;
    if (target === "all") marked = notificationCount(raw, "marked");
    else {
      const ack = parseNotice(raw, fresh.user.id);
      if (
        ack.id !== target ||
        !ack.isRead ||
        noticeFingerprint(ack) !== noticeFingerprint(selected!)
      )
        throw new Error();
      marked = 1;
    }
    const checked = await loadNotifications(before.user);
    guard();
    if (target === "all") {
      if (checked.unread !== 0 || checked.items.some((n) => !n.isRead))
        throw new Error();
    } else {
      const row = checked.items.find((n) => n.id === target),
        ack = parseNotice(raw, fresh.user.id);
      if (
        !row?.isRead ||
        noticeFingerprint(row) !== noticeFingerprint(ack) ||
        row.readAt !== ack.readAt
      )
        throw new Error();
    }
    return { inbox: checked, marked, already: false };
  } catch (e) {
    throw new NotificationFailure(
      "The response and saved read state couldn’t both be confirmed. Check the inbox before another action; an earlier request may still finish.",
      true,
      e instanceof NotificationFailure && e.unavailable,
    );
  }
}
