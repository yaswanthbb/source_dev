"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, type User } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { NotificationsView } from "./notifications-view";
import {
  loadNotifications,
  loadNotificationCount,
  markNotifications,
  NotificationFailure,
} from "./notifications-client";
import type { Inbox } from "./notifications-data";
import { Bell } from "lucide-react";
import styles from "./notifications.module.css";
export function GuiNotifications({
  user,
  shell = "developer",
}: {
  user?: User;
  shell?: "developer" | "admin";
}) {
  return user ? (
    <BoundNotifications
      key={`${user.id}:${user.role}:${shell}`}
      user={user}
      shell={shell}
    />
  ) : (
    <button
      type="button"
      className={styles.bell}
      disabled
      aria-label="Notifications unavailable until your account is checked"
    >
      <Bell size={19} aria-hidden="true" />
    </button>
  );
}
export function BoundNotifications({
  user,
  shell = "developer",
}: {
  user: User;
  shell?: "developer" | "admin";
}) {
  const [session] = useState(getToken),
    [open, setOpen] = useState(false),
    [invalid, setInvalid] = useState(false),
    [pending, setPending] = useState<string>(),
    [error, setError] = useState<NotificationFailure>(),
    [locked, setLocked] = useState(false),
    [review, setReview] = useState<Inbox>(),
    [earlier, setEarlier] = useState(false),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    cache = useQueryClient(),
    { setMode } = useUiMode(),
    key = ["notifications", "inbox", user.id, user.role],
    countKey = ["notifications", "count", user.id, user.role];
  const inbox = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadNotifications(user, signal),
    enabled: open && !!session && !invalid,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
  const count = useQuery({
    queryKey: countKey,
    queryFn: ({ signal }) => loadNotificationCount(user, signal),
    enabled: !!session && !invalid && !open && !inbox.data,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
  useEffect(() => {
    const changed = () => setInvalid(true),
      stored = (e: StorageEvent) => {
        if (e.key === null || e.key === "sd_token" || e.key === "sd_user")
          changed();
      };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
    };
  }, []);
  const unavailable =
    invalid ||
    !session ||
    getToken() !== session ||
    !!error?.unavailable ||
    [inbox.error, count.error].some(
      (e) => e instanceof NotificationFailure && e.unavailable,
    );
  function current() {
    if (!unavailable && getToken() === session) return true;
    setInvalid(true);
    return false;
  }
  const safe = (e: unknown) =>
    e instanceof NotificationFailure
      ? e
      : new NotificationFailure(
          "The notification state couldn’t be checked. Refresh before another action.",
        );
  async function read(target: string) {
    if (
      !current() ||
      busy.current ||
      pending ||
      locked ||
      inbox.isFetching ||
      inbox.isError ||
      !inbox.data
    )
      return;
    busy.current = true;
    setPending(target);
    setError(undefined);
    setReview(undefined);
    setNotice("");
    try {
      const result = await markNotifications(inbox.data, target);
      if (!current()) return;
      cache.setQueryData(key, result.inbox);
      cache.setQueryData(countKey, result.inbox.unread);
      setNotice(
        result.already
          ? "Already read. Saved read state checked."
          : target === "all"
            ? `Server reported marking ${result.marked} read. Saved inbox checked.`
            : "Notification marked as read and checked.",
      );
    } catch (e) {
      const failure = safe(e);
      setError(failure);
      if (failure.uncertain || failure.conflict) setLocked(true);
      if (failure.uncertain) setEarlier(true);
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  }
  async function check() {
    if (!current() || busy.current) return;
    busy.current = true;
    setPending("check");
    setReview(undefined);
    setNotice("");
    try {
      const checked = await loadNotifications(user);
      if (!current()) return;
      if (locked) {
        setReview(checked);
        setNotice(
          "Saved read state checked. Review the counts before resuming.",
        );
      } else {
        cache.setQueryData(key, checked);
        cache.setQueryData(countKey, checked.unread);
        setNotice("Inbox refreshed. No read state was changed.");
      }
      setError(undefined);
    } catch (e) {
      setError(safe(e));
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  }
  function resume() {
    if (!current() || busy.current || !review) return;
    cache.setQueryData(key, review);
    cache.setQueryData(countKey, review.unread);
    setReview(undefined);
    setError(undefined);
    setLocked(false);
    setNotice("Checked inbox adopted. Review it before another action.");
  }
  const failure =
    error ??
    (inbox.error instanceof NotificationFailure ? inbox.error : undefined);
  return (
    <NotificationsView
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      shell={shell}
      inbox={unavailable ? undefined : inbox.data}
      count={unavailable ? undefined : (inbox.data?.unread ?? count.data)}
      countError={count.isError && !inbox.data}
      loading={open && inbox.isPending && !inbox.data}
      error={failure?.message}
      notice={notice}
      pending={pending ?? (inbox.isFetching && open ? "load" : undefined)}
      locked={locked}
      earlierRequest={earlier}
      review={review}
      unavailable={unavailable}
      onRead={(id) => void read(id)}
      onReadAll={() => void read("all")}
      onCheck={() => void check()}
      onResume={resume}
      onCli={() => setMode("cli", { navigate: false })}
    />
  );
}
