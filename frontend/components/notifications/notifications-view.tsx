"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Terminal,
  X,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  NOTIFICATION_TYPES,
  noticeLabel,
  noticeTitle,
  noticeTarget,
  notificationDate,
  type Inbox,
} from "./notifications-data";
import styles from "./notifications.module.css";
export interface NotificationsViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  inbox?: Inbox;
  count?: number;
  countError?: boolean;
  loading?: boolean;
  error?: string;
  notice?: string;
  pending?: string;
  locked?: boolean;
  earlierRequest?: boolean;
  review?: Inbox;
  unavailable?: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onCheck: () => void;
  onResume: () => void;
  onCli?: () => void;
  shell?: "admin" | "developer";
}
export function NotificationsView(p: NotificationsViewProps) {
  const [type, setType] = useState("all"),
    [unread, setUnread] = useState(false),
    [page, setPage] = useState(0),
    [confirm, setConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    close = useRef<HTMLButtonElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    all = useRef<HTMLButtonElement>(null),
    status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!p.open || !dialog.current) return;
    const element = dialog.current,
      previous = document.activeElement as HTMLElement | null;
    element.showModal();
    close.current?.focus();
    return () => {
      element.close();
      previous?.focus();
    };
  }, [p.open]);
  useEffect(() => {
    if (!confirm) return;
    const trigger = all.current;
    cancel.current?.focus();
    return () => trigger?.focus();
  }, [confirm]);
  useEffect(() => {
    if (p.open && !p.pending && (p.notice || p.error)) status.current?.focus();
  }, [p.open, p.pending, p.notice, p.error]);
  const source = p.unavailable ? undefined : p.inbox,
    rows = (source?.items ?? []).filter(
      (n) =>
        (type === "all" || type === "other"
          ? type === "all" || !Object.hasOwn(NOTIFICATION_TYPES, n.type)
          : n.type === type) &&
        (!unread || !n.isRead),
    ),
    pages = Math.max(1, Math.ceil(rows.length / 6)),
    current = Math.min(page, pages - 1),
    items = rows.slice(current * 6, current * 6 + 6),
    blocked =
      !!p.pending ||
      !!p.locked ||
      !!p.error ||
      !source ||
      p.loading ||
      p.unavailable;
  const count = p.unavailable ? undefined : p.count,
    closeInbox = () => {
      setConfirm(false);
      p.onClose();
    };
  return (
    <>
      <button
        className={styles.bell}
        type="button"
        onClick={p.onOpen}
        aria-label={`Notifications${count !== undefined ? `, ${count} unread at last check` : p.countError ? ", unread count unavailable" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={p.open}
        aria-controls="gui-notifications-dialog"
        title="Notifications"
      >
        <Bell size={19} aria-hidden="true" />
        {count !== undefined && count > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {count > 99 ? "99+" : count}
          </span>
        )}
        {p.countError && (
          <span className={styles.unknown} aria-hidden="true">
            !
          </span>
        )}
      </button>
      <dialog
        ref={dialog}
        id="gui-notifications-dialog"
        className={styles.dialog}
        aria-labelledby="gui-notifications-title"
        aria-describedby="gui-notifications-description"
        onCancel={(event) => {
          event.preventDefault();
          if (confirm) setConfirm(false);
          else closeInbox();
        }}
      >
        <header className={styles.header}>
          <div className={styles.title}>
            <span className={styles.mark}>
              <Bell size={23} aria-hidden="true" />
            </span>
            <div>
              <p className={styles.eyebrow}>YOUR WORKSPACE, IN THE LOOP</p>
              <h2 id="gui-notifications-title">
                Notifications<span>.</span>
              </h2>
            </div>
          </div>
          <button
            ref={close}
            className={styles.iconButton}
            type="button"
            onClick={closeInbox}
            aria-label="Close notifications"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>
          <p id="gui-notifications-description" className={styles.intro}>
            Review decisions, content updates and generation jobs. Opening this
            inbox keeps everything unread until you choose otherwise.
          </p>
          {p.unavailable ? (
            <GuiFeedback
              kind="error"
              title="Notification access needs checking"
            >
              <p>
                Your session or account access changed. Cached notifications are
                hidden. Reload or sign in before continuing.
              </p>
              <Link href="/login">Sign in</Link>
              <button type="button" onClick={() => window.location.reload()}>
                Reload page
              </button>
            </GuiFeedback>
          ) : (
            <>
              {p.error && (
                <GuiFeedback
                  ref={status}
                  kind="error"
                  title={
                    p.locked
                      ? "Read-state changes are paused"
                      : "Inbox couldn’t be checked"
                  }
                >
                  <p>{p.error}</p>
                </GuiFeedback>
              )}
              {p.notice && (
                <GuiFeedback
                  ref={p.error ? undefined : status}
                  kind="success"
                  title={p.notice}
                />
              )}
              {p.earlierRequest && (
                <GuiFeedback
                  kind="info"
                  title="An earlier request may still finish"
                >
                  A fresh read cannot cancel a read-state change already sent.
                  Check again if new or changed notifications appear.
                </GuiFeedback>
              )}
              <div className={styles.summary}>
                <span>
                  {source
                    ? `${source.items.length} ${source.items.length === 1 ? "notification" : "notifications"} · ${source.unread} unread at last check`
                    : "Your notification history"}
                </span>
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={p.onCheck}
                    disabled={!!p.pending || confirm}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    {p.pending === "check"
                      ? "Checking…"
                      : p.locked
                        ? "Check saved read state"
                        : "Refresh"}
                  </button>
                  <button
                    ref={all}
                    type="button"
                    onClick={() => setConfirm(true)}
                    disabled={
                      blocked ||
                      confirm ||
                      !(source?.unread || source?.items.some((n) => !n.isRead))
                    }
                  >
                    <CheckCheck size={15} aria-hidden="true" />
                    Mark all read
                  </button>
                </div>
              </div>
              {source && (
                <p className={styles.checked}>
                  Last checked {notificationDate(source.checkedAt)}. Refresh for
                  new activity.
                </p>
              )}
              {confirm && (
                <section
                  className={styles.confirm}
                  aria-labelledby="notifications-confirm-title"
                >
                  <h3 id="notifications-confirm-title">
                    Mark every unread notification as read?
                  </h3>
                  <p>
                    This applies to your whole account, including items outside
                    these filters and notifications that arrive before the
                    request is processed. The last check found{" "}
                    {source?.unread ?? 0} unread. Your history stays here.
                  </p>
                  <div className={styles.actions}>
                    <button
                      ref={cancel}
                      type="button"
                      onClick={() => setConfirm(false)}
                    >
                      Keep unread
                    </button>
                    <button
                      className={styles.primary}
                      type="button"
                      disabled={blocked}
                      onClick={() => {
                        setConfirm(false);
                        p.onReadAll();
                      }}
                    >
                      Confirm mark all read
                    </button>
                  </div>
                </section>
              )}
              {p.locked && (
                <section
                  className={styles.recovery}
                  aria-label="Review checked read state"
                >
                  <h3>Check before another action</h3>
                  <p>Changes remain paused while you review the saved inbox.</p>
                  {p.review && (
                    <>
                      <p>
                        Checked {p.review.items.length} notifications and{" "}
                        {p.review.unread} unread. Resume to display these saved
                        results. No write is repeated.
                      </p>
                      <button
                        type="button"
                        disabled={!!p.pending}
                        onClick={p.onResume}
                      >
                        Use checked inbox & resume
                      </button>
                    </>
                  )}
                </section>
              )}
              <fieldset
                className={styles.filters}
                disabled={!!p.pending || confirm || !source}
              >
                <legend className={styles.srOnly}>Filter notifications</legend>
                <label>
                  Notification type
                  <select
                    value={type}
                    onChange={(event) => {
                      setType(event.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="all">All types</option>
                    {Object.entries(NOTIFICATION_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                    <option value="other">Other updates</option>
                  </select>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={unread}
                    onChange={(event) => {
                      setUnread(event.target.checked);
                      setPage(0);
                    }}
                  />
                  Unread only
                </label>
              </fieldset>
              {p.loading && !source ? (
                <GuiFeedback kind="loading" title="Checking your inbox">
                  Loading notifications for the current account.
                </GuiFeedback>
              ) : (
                source && (
                  <>
                    {items.length === 0 ? (
                      <div className={styles.empty}>
                        <InboxIllustration />
                        <h3>
                          {source.items.length === 0
                            ? "A quiet moment."
                            : "Nothing matches these filters."}
                        </h3>
                        <p>
                          {source.items.length === 0
                            ? "New review decisions and job updates will appear here. Refresh when you want to check."
                            : "Try another type or turn off Unread only to see more of your history."}
                        </p>
                        {source.items.length > 0 && (
                          <button
                            type="button"
                            disabled={!!p.pending || confirm}
                            onClick={() => {
                              setUnread(false);
                              setType("all");
                              setPage(0);
                            }}
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <ol
                        className={styles.list}
                        aria-label="Notification history"
                      >
                        {items.map((n) => {
                          const target = noticeTarget(n, source.user.role),
                            hasDetails = !!(
                              n.payload.reason ||
                              n.payload.reviewedBy ||
                              n.payload.removedBy ||
                              n.payload.effectiveAt ||
                              n.payload.reviewedAt ||
                              n.payload.removedAt ||
                              n.payload.createdCount !== undefined ||
                              n.payload.failedCount !== undefined ||
                              n.payload.jobId
                            );
                          return (
                            <li
                              key={n.id}
                              className={`${styles.item} ${!n.isRead ? styles.unread : ""}`}
                            >
                              <span className={styles.itemIcon}>
                                {n.isRead ? (
                                  <Check size={17} aria-hidden="true" />
                                ) : (
                                  <Bell size={17} aria-hidden="true" />
                                )}
                              </span>
                              <article className={styles.itemBody}>
                                <div className={styles.meta}>
                                  <span>{noticeLabel(n)}</span>
                                  <span className={styles.readState}>
                                    {n.isRead ? "Read" : "Unread"}
                                  </span>
                                </div>
                                <h3>{noticeTitle(n)}</h3>
                                <time dateTime={n.createdAt}>
                                  {notificationDate(n.createdAt)}
                                </time>
                                {!Object.hasOwn(NOTIFICATION_TYPES, n.type) && (
                                  <p className={styles.small}>
                                    Update type: {n.type}. More details are not
                                    available in this view.
                                  </p>
                                )}
                                {n.type.startsWith("ai_job_") && (
                                  <p className={styles.small}>
                                    This is a job outcome notice. Check
                                    generation & jobs for the current result;
                                    this inbox starts no model calls.
                                  </p>
                                )}
                                {hasDetails && (
                                  <details>
                                    <summary>View details</summary>
                                    {n.payload.reason && (
                                      <div className={styles.reason}>
                                        <strong>Reason</strong>
                                        <p>{n.payload.reason}</p>
                                      </div>
                                    )}
                                    <dl>
                                      {(
                                        [
                                          ["reviewedBy", "Reviewed by"],
                                          ["reviewedAt", "Reviewed at"],
                                          ["removedBy", "Removed by"],
                                          ["removedAt", "Removed at"],
                                          ["effectiveAt", "Effective at"],
                                          ["createdCount", "Created"],
                                          ["failedCount", "Failed"],
                                          ["jobId", "Job ID"],
                                        ] as const
                                      ).map(
                                        ([key, label]) =>
                                          n.payload[key] != null && (
                                            <div key={key}>
                                              <dt>{label}</dt>
                                              <dd>
                                                {key.endsWith("At")
                                                  ? notificationDate(
                                                      String(n.payload[key]),
                                                    )
                                                  : n.payload[key]}
                                              </dd>
                                            </div>
                                          ),
                                      )}
                                    </dl>
                                  </details>
                                )}
                                <div className={styles.itemActions}>
                                  {target && (
                                    <Link
                                      href={target.href}
                                      onClick={closeInbox}
                                    >
                                      {target.label}
                                      <ArrowUpRight
                                        size={13}
                                        aria-hidden="true"
                                      />
                                    </Link>
                                  )}
                                  <button
                                    type="button"
                                    disabled={blocked || confirm || n.isRead}
                                    aria-label={
                                      n.isRead
                                        ? `Already read: ${noticeTitle(n)}`
                                        : `Mark as read: ${noticeTitle(n)}`
                                    }
                                    onClick={() => p.onRead(n.id)}
                                  >
                                    {p.pending === n.id
                                      ? "Marking read…"
                                      : n.isRead
                                        ? "Read"
                                        : "Mark as read"}
                                  </button>
                                </div>
                              </article>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    {rows.length > 0 && (
                      <nav
                        className={styles.pagination}
                        aria-label="Notification pages"
                      >
                        <span>
                          {current * 6 + 1}–
                          {Math.min(current * 6 + 6, rows.length)} of{" "}
                          {rows.length} matching
                        </span>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            aria-label="Previous notifications page"
                            disabled={current === 0 || !!p.pending || confirm}
                            onClick={() => setPage(current - 1)}
                          >
                            <ArrowLeft size={15} aria-hidden="true" />
                          </button>
                          <span>
                            {current + 1} / {pages}
                          </span>
                          <button
                            type="button"
                            aria-label="Next notifications page"
                            disabled={
                              current === pages - 1 || !!p.pending || confirm
                            }
                            onClick={() => setPage(current + 1)}
                          >
                            <ArrowRight size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </nav>
                    )}
                  </>
                )
              )}
            </>
          )}
        </div>
        <footer className={styles.footer}>
          <span>Read status only. Your history is kept.</span>
          <Link
            href={
              p.shell === "admin"
                ? "/admin/terminal?view=notify"
                : "/developer/terminal?view=notify"
            }
            onClick={() => {
              closeInbox();
              p.onCli?.();
            }}
          >
            <Terminal size={14} aria-hidden="true" />
            Open in CLI
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </footer>
      </dialog>
    </>
  );
}
function InboxIllustration() {
  return (
    <svg
      className={styles.illustration}
      width="100"
      height="85"
      viewBox="0 0 100 85"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="50" cy="42" r="34" fill="var(--gui-accent-soft)" />
      <g>
        <path
          d="m25 40 8-20h34l8 20v24H25V40Z"
          fill="var(--gui-surface)"
          stroke="var(--gui-border)"
          strokeWidth="2"
        />
        <path
          d="M25 40h15l3 8h14l3-8h15"
          stroke="var(--gui-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M43 30h14"
          stroke="var(--gui-border)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M77 15v10m-5-5h10"
        stroke="var(--gui-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
