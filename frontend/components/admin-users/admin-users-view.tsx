"use client";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  X,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  actionable,
  requestTarget,
  filterDirectory,
  filterRequests,
  displayUserDate,
  type UsersLibrary,
  type UsersAction,
  type UsersRecovery,
} from "./admin-users-data";
import styles from "./admin-users.module.css";
export interface UsersViewProps {
  library?: UsersLibrary;
  loading?: boolean;
  busy?: boolean;
  blocked?: boolean;
  error?: string;
  notice?: string;
  locked?: boolean;
  recovery?: UsersRecovery;
  late?: boolean;
  onAction: (action: UsersAction) => void;
  onCheck: () => void;
  onAdopt: () => void;
}
const pageSize = 8;
export function UsersView(p: UsersViewProps) {
  const [section, setSection] = useState("directory"),
    [search, setSearch] = useState(""),
    [role, setRole] = useState("all"),
    [sort, setSort] = useState("name"),
    [status, setStatus] = useState("pending"),
    [page, setPage] = useState(0),
    [choice, setChoice] = useState<UsersAction>();
  const feedback = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (p.notice || p.error || p.recovery) feedback.current?.focus();
  }, [p.notice, p.error, p.recovery]);
  useEffect(() => {
    if (!choice || !dialog.current) return;
    const previous = document.activeElement as HTMLElement | null,
      fallback = feedback.current,
      d = dialog.current;
    d.showModal();
    cancel.current?.focus();
    return () => {
      d.close();
      if (previous?.isConnected) previous.focus();
      else fallback?.focus();
    };
  }, [choice]);
  const library = p.library,
    users = filterDirectory(library?.users ?? [], search, role, sort),
    requests = filterRequests(library?.requests ?? [], status),
    rows = section === "directory" ? users : requests,
    totalPages = Math.max(1, Math.ceil(rows.length / pageSize)),
    current = Math.min(page, totalPages - 1),
    start = current * pageSize,
    pending = library?.requests.filter((r) => r.status === "pending").length;
  function choose(action: UsersAction) {
    if (!p.blocked && !p.busy && !p.locked) setChoice(action);
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>THE PEOPLE BEHIND THE PROGRESS</p>
          <h1>
            A place for
            <br />
            <span>every learner.</span>
          </h1>
          <p>Find an account. Handle requests with care.</p>
        </div>
        <div className={styles.art} aria-hidden="true">
          <svg viewBox="0 0 180 150" fill="none">
            <circle cx="90" cy="77" r="64" fill="currentColor" opacity=".08" />
            <path
              d="M36 95h108M60 66h60"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
            <rect
              x="56"
              y="23"
              width="68"
              height="104"
              rx="12"
              fill="var(--gui-surface)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="90" cy="58" r="13" fill="currentColor" opacity=".18" />
            <path
              d="M70 94c0-24 40-24 40 0M74 108h32"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="139" cy="99" r="18" fill="var(--gui-accent)" />
            <path
              d="m131 99 6 6 10-12"
              stroke="var(--gui-on-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </header>
      <div className={styles.topline}>
        <p>
          {library ? (
            <>
              Last checked{" "}
              <time dateTime={library.checkedAt}>
                {displayUserDate(library.checkedAt)}
              </time>
            </>
          ) : (
            "Account details are not checked yet."
          )}
        </p>
        <button
          type="button"
          className={styles.button}
          disabled={p.busy || p.loading}
          onClick={p.onCheck}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {p.busy ? "Checking…" : "Refresh users"}
        </button>
      </div>
      <div className={styles.summary} aria-label="Checked account totals">
        <div>
          <Users size={19} aria-hidden="true" />
          <span>Accounts in directory</span>
          <strong>{library?.users.length ?? "—"}</strong>
        </div>
        <div>
          <ShieldCheck size={19} aria-hidden="true" />
          <span>Protected admins</span>
          <strong>
            {library?.users.filter((u) => u.role === "admin").length ?? "—"}
          </strong>
        </div>
        <div>
          <ClipboardCheck size={19} aria-hidden="true" />
          <span>Pending requests</span>
          <strong>{pending ?? "—"}</strong>
        </div>
      </div>
      <div ref={feedback} tabIndex={-1} className={styles.feedback}>
        {p.error && (
          <GuiFeedback kind="error" title="This change needs attention">
            <p>{p.error}</p>
          </GuiFeedback>
        )}
        {p.notice && (
          <GuiFeedback kind="success" title="Checked update">
            <p>{p.notice}</p>
          </GuiFeedback>
        )}
        {p.locked && (
          <GuiFeedback kind="info" title="Account changes are paused">
            <p>
              Use Check current state to read the directory and requests.
              Checking never repeats an action.
            </p>
            <button
              className={styles.button}
              type="button"
              disabled={p.busy || p.loading}
              onClick={p.onCheck}
            >
              Check current state
            </button>
          </GuiFeedback>
        )}
        {p.recovery && (
          <GuiFeedback kind="info" title="Review the checked state">
            <p>{p.recovery.summary}</p>
            <p>
              Checked {displayUserDate(p.recovery.library.checkedAt)}. This does
              not cancel an earlier request.
            </p>
            <button
              className={styles.button}
              type="button"
              disabled={p.busy}
              onClick={p.onAdopt}
            >
              Use checked list & resume
            </button>
          </GuiFeedback>
        )}
        {p.late && (
          <p className={styles.caution}>
            An earlier request may still finish. Refresh before another
            decision. This pause is kept on this page and can reset when you
            leave.
          </p>
        )}
      </div>
      <nav className={styles.switcher} aria-label="User management views">
        <button
          type="button"
          aria-pressed={section === "directory"}
          onClick={() => {
            setSection("directory");
            setPage(0);
          }}
        >
          Directory
        </button>
        <button
          type="button"
          aria-pressed={section === "requests"}
          onClick={() => {
            setSection("requests");
            setPage(0);
          }}
        >
          Deletion requests <span>{pending ?? "—"} pending</span>
        </button>
      </nav>
      <section className={styles.panel} aria-labelledby="users-list-heading">
        <div className={styles.panelHead}>
          <div>
            <h2 id="users-list-heading">
              {section === "directory"
                ? "People, at a glance"
                : "Requests, with context"}
            </h2>
            <p>
              {section === "directory"
                ? "Search the loaded directory by name or email. Admin accounts are protected."
                : "Requests are ordered newest first. Deleting an account also removes its request history."}
            </p>
          </div>
        </div>
        <div className={styles.filters}>
          {section === "directory" ? (
            <>
              <label className={styles.search}>
                <span>Search accounts</span>
                <span className={styles.searchBox}>
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Name or email"
                    maxLength={320}
                  />
                </span>
              </label>
              <label>
                Role
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="all">All roles</option>
                  <option value="developer">Developers</option>
                  <option value="admin">Admins</option>
                </select>
              </label>
              <label>
                Sort
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="name">Name</option>
                  <option value="newest">Newest accounts</option>
                </select>
              </label>
              {(search || role !== "all") && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setSearch("");
                    setRole("all");
                    setPage(0);
                  }}
                >
                  Clear filters
                </button>
              )}
            </>
          ) : (
            <label>
              Request status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="pending">Pending</option>
                <option value="all">All statuses</option>
                <option value="rejected">Rejected</option>
                <option value="approved">Approved</option>
              </select>
            </label>
          )}
        </div>
        {p.loading ? (
          <div className={styles.empty} role="status">
            <RefreshCw size={24} aria-hidden="true" />
            <h3>Checking accounts and requests</h3>
            <p>Waiting for current account details.</p>
          </div>
        ) : !library ? (
          <div className={styles.empty}>
            <h3>Account details are unavailable</h3>
            <p>
              Refresh to check the directory. Missing data is not an empty list.
            </p>
          </div>
        ) : !rows.length ? (
          <div className={styles.empty}>
            <Users size={28} aria-hidden="true" />
            <h3>
              {section === "directory"
                ? search || role !== "all"
                  ? "No accounts match these filters"
                  : "No accounts in the checked directory"
                : status === "pending"
                  ? "No pending requests"
                  : "No requests match this status"}
            </h3>
            <p>
              {section === "directory"
                ? "Try another name, email or role."
                : "Changing the filter only changes this view."}
            </p>
          </div>
        ) : (
          <>
            {section === "directory" ? (
              <ul className={styles.list} aria-label="User directory">
                {users.slice(start, start + pageSize).map((u) => (
                  <li key={u.id} className={styles.person}>
                    <span className={styles.avatar} aria-hidden="true">
                      {u.name.slice(0, 1).toUpperCase() || "U"}
                    </span>
                    <div className={styles.identity}>
                      <h3>{u.name || "Unnamed account"}</h3>
                      <p>{u.email}</p>
                      <small>
                        Joined{" "}
                        <time dateTime={u.createdAt}>
                          {displayUserDate(u.createdAt)}
                        </time>
                      </small>
                    </div>
                    <span className={styles.badge}>
                      {u.role}
                      {u.id === library.user.id ? " · You" : ""}
                    </span>
                    {actionable(u, library.user) ? (
                      <button
                        className={styles.delete}
                        type="button"
                        disabled={p.blocked || p.busy}
                        onClick={() => choose({ kind: "delete", target: u })}
                        aria-label={`Delete account for ${u.name} (${u.email})`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Delete account
                      </button>
                    ) : (
                      <span className={styles.protected}>
                        <ShieldCheck size={14} aria-hidden="true" />
                        Protected
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul
                className={styles.list}
                aria-label="Account deletion requests"
              >
                {requests.slice(start, start + pageSize).map((r) => {
                  const target = requestTarget(library, r),
                    canAct =
                      r.status === "pending" &&
                      target &&
                      actionable(target, library.user);
                  return (
                    <li key={r.id} className={styles.request}>
                      <div className={styles.requestHead}>
                        <div>
                          <h3>{r.user?.name || "Account not reported"}</h3>
                          <p>{r.user?.email || "Identity unavailable"}</p>
                          <small>
                            Requested{" "}
                            <time dateTime={r.createdAt}>
                              {displayUserDate(r.createdAt)}
                            </time>
                          </small>
                        </div>
                        <span className={styles.badge}>{r.status}</span>
                      </div>
                      <details>
                        <summary>Request details</summary>
                        <div className={styles.reason}>
                          <strong>Reason</strong>
                          <p
                            tabIndex={0}
                            role="region"
                            aria-label="Submitted reason"
                          >
                            {r.reason || "No reason provided."}
                          </p>
                          <small>Request ID: {r.id}</small>
                          {r.reviewedAt && (
                            <p>
                              Reviewed {displayUserDate(r.reviewedAt)} ·{" "}
                              {r.reviewer || "Reviewer no longer reported"}
                            </p>
                          )}
                        </div>
                      </details>
                      {canAct ? (
                        <div className={styles.requestActions}>
                          <button
                            type="button"
                            className={styles.button}
                            disabled={p.blocked || p.busy}
                            onClick={() =>
                              choose({ kind: "reject", target, request: r })
                            }
                          >
                            Reject request
                          </button>
                          <button
                            type="button"
                            className={styles.delete}
                            disabled={p.blocked || p.busy}
                            onClick={() =>
                              choose({ kind: "approve", target, request: r })
                            }
                          >
                            <Trash2 size={16} aria-hidden="true" />
                            Approve & delete account
                          </button>
                        </div>
                      ) : (
                        r.status === "pending" && (
                          <p className={styles.caution}>
                            Actions unavailable: the current developer account
                            could not be matched or is protected.
                          </p>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <nav className={styles.pager} aria-label="User list pages">
              <p aria-live="polite">
                {start + 1}–{Math.min(start + pageSize, rows.length)} of{" "}
                {rows.length}{" "}
                {section === "directory"
                  ? "matching accounts"
                  : "matching requests"}
              </p>
              <div>
                <button
                  className={styles.button}
                  type="button"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                  aria-label="Previous user list page"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Previous
                </button>
                <button
                  className={styles.button}
                  type="button"
                  disabled={current >= totalPages - 1}
                  onClick={() => setPage(current + 1)}
                  aria-label="Next user list page"
                >
                  Next
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
      <p className={styles.footnote}>
        Account removal is permanent. Personal progress is erased; authored
        roadmaps, lessons and discussion answers stay on the platform. This page
        does not change roles or create accounts.
      </p>
      {choice && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="user-action-title"
          aria-describedby="user-action-description"
          onCancel={(e) => {
            e.preventDefault();
            setChoice(undefined);
          }}
        >
          <div className={styles.dialogHead}>
            <span className={styles.eyebrow}>
              {choice.kind === "reject"
                ? "REVIEW A REQUEST"
                : "PERMANENT ACCOUNT REMOVAL"}
            </span>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Close account confirmation"
              onClick={() => setChoice(undefined)}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
          <h2 id="user-action-title">
            {choice.kind === "reject"
              ? "Reject this request?"
              : choice.kind === "approve"
                ? "Approve deletion?"
                : "Delete this account?"}
          </h2>
          <p className={styles.selectedName}>{choice.target.name}</p>
          <p>{choice.target.email}</p>
          <div id="user-action-description">
            {choice.kind === "reject" ? (
              <p>
                The account stays listed. This pending deletion request will be
                marked rejected.
              </p>
            ) : (
              <>
                <p>
                  This permanently removes the developer account, its personal
                  progress and deletion-request history. Authored roadmaps,
                  lessons and discussion answers remain. This cannot be undone
                  here.
                </p>
                {choice.kind === "approve" && (
                  <p>
                    The request is approved before deletion runs. A failure may
                    leave a reviewed request and an account that still exists.
                  </p>
                )}
              </>
            )}
            {choice.kind !== "delete" && (
              <div className={styles.reason}>
                <strong>Submitted reason</strong>
                <p tabIndex={0} role="region" aria-label="Submitted reason">
                  {choice.request.reason || "No reason provided."}
                </p>
              </div>
            )}
            <p>
              Current admin access, account details and request state will be
              checked before sending this decision.
            </p>
          </div>
          <div className={styles.dialogActions}>
            <button
              ref={cancel}
              type="button"
              className={styles.button}
              onClick={() => setChoice(undefined)}
            >
              {choice.kind === "reject"
                ? "Keep request pending"
                : "Keep account"}
            </button>
            <button
              className={
                choice.kind === "reject" ? styles.primary : styles.delete
              }
              type="button"
              disabled={p.blocked || p.busy || p.locked}
              onClick={() => {
                p.onAction(choice);
                setChoice(undefined);
              }}
            >
              {choice.kind === "reject"
                ? "Reject request"
                : choice.kind === "approve"
                  ? "Approve & delete permanently"
                  : "Delete permanently"}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
