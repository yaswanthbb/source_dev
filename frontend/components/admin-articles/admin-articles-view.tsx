"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, RefreshCw, ArrowUpRight, Trash2 } from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { contentDate } from "@/components/content/content-data";
import {
  moderationReason,
  moderationVersion,
  type AdminArticlesLibrary,
  type AdminArticleDetail,
  type AdminArticleRecovery,
  type ArticleRow,
} from "./admin-articles-client";
import styles from "./admin-articles.module.css";
export interface AdminArticlesProps {
  library?: AdminArticlesLibrary;
  pending: boolean;
  error?: string;
  busy: boolean;
  detail?: AdminArticleDetail;
  detailError: string;
  notice: string;
  paused: boolean;
  earlier: boolean;
  recovery?: AdminArticleRecovery;
  decisionVersion: number;
  onRefresh: () => void;
  onInspect: (row: ArticleRow) => void;
  onDelete: (detail: AdminArticleDetail, reason: string) => void;
  onRecover: () => void;
  onAdopt: () => void;
}
function DeleteConfirmation({
  actorId,
  detail,
  reason,
  onReason,
  busy,
  message,
  onKeep,
  onConfirm,
}: {
  actorId: string;
  detail: AdminArticleDetail;
  reason: string;
  onReason: (text: string) => void;
  busy: boolean;
  message: string;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    keep = useRef<HTMLButtonElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    feedback = useRef<HTMLParagraphElement>(null),
    [issue, setIssue] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.showModal();
    keep.current?.focus();
    return () => {
      node?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (message && !busy) feedback.current?.focus();
  }, [message, busy]);
  const a = detail.article;
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="article-delete-title"
      aria-describedby="article-delete-consequences"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onKeep();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          try {
            moderationReason(reason);
            setIssue("");
            onConfirm();
          } catch {
            setIssue("Write a specific reason using 1–2000 characters.");
            input.current?.focus();
          }
        }}
      >
        <p className={styles.eyebrow}>PERMANENT ARTICLE REMOVAL</p>
        <h2 id="article-delete-title">Delete this public article?</h2>
        <strong className={styles.selectedTitle}>{a.title}</strong>
        <p>
          By {a.authorName ?? "Author unavailable"} · Article{" "}
          <code>{a.id}</code>
        </p>
        <p>
          Saved {contentDate(a.updatedAt)} · Checked{" "}
          {contentDate(detail.checkedAt)}
        </p>
        <div id="article-delete-consequences">
          <p>
            This permanently removes the article from the public library. This
            page has no restore action. Linked roadmaps and lessons remain.
          </p>
          <p>
            {a.authorId === null
              ? "There is no author account to notify."
              : a.authorId === actorId
                ? "This is your own article. No author notification is sent."
                : "The backend attempts an author notification before removal. Delivery is not verified here. A failed request can leave a notification even if removal fails."}
          </p>
        </div>
        <details>
          <summary>Review the exact saved Markdown</summary>
          <pre tabIndex={0}>{a.content || "(Empty article text)"}</pre>
        </details>
        <label htmlFor="article-removal-reason">
          Reason for removal
          <textarea
            ref={input}
            id="article-removal-reason"
            value={reason}
            maxLength={2000}
            rows={4}
            onChange={(e) => {
              onReason(e.target.value);
              setIssue("");
            }}
            aria-invalid={!!issue}
            aria-describedby={
              issue
                ? "article-reason-error article-reason-help"
                : "article-reason-help"
            }
            disabled={busy}
          />
        </label>
        <p id="article-reason-help" className={styles.hint}>
          Be specific. The trimmed reason is sent with the removal request. For
          another author’s account, it is included in the attempted
          notification. This form allows up to 2000 characters.
        </p>
        {issue && (
          <p id="article-reason-error" role="alert">
            {issue}
          </p>
        )}
        {message && (
          <p
            ref={feedback}
            tabIndex={-1}
            role="status"
            className={styles.notice}
          >
            {message}
          </p>
        )}
        {busy && (
          <p role="status">
            Checking and requesting removal. Keep this page open for the result.
          </p>
        )}
        <div className={styles.actions}>
          <button ref={keep} type="button" onClick={onKeep} disabled={busy}>
            Keep article
          </button>
          <button type="submit" className={styles.danger} disabled={busy}>
            <Trash2 size={15} aria-hidden="true" />{" "}
            {busy ? "Removing…" : "Delete article permanently"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function AdminArticlesView(p: AdminArticlesProps) {
  const [search, setSearch] = useState(""),
    [author, setAuthor] = useState("all"),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [preview, setPreview] = useState(false),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [choice, setChoice] = useState<{
      actorId: string;
      detail: AdminArticleDetail;
      version: number;
      notice: string;
    }>();
  const feedback = useRef<HTMLParagraphElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    detailHeading = useRef<HTMLHeadingElement>(null);
  const handledNotice = useRef("");
  useEffect(() => {
    if (!p.notice) handledNotice.current = "";
    if (p.notice && !choice && p.notice !== handledNotice.current) {
      feedback.current?.focus();
      handledNotice.current = p.notice;
    }
  }, [p.notice, choice]);
  useEffect(() => {
    setPreview(false);
    if (p.detail) detailHeading.current?.focus();
  }, [p.detail]);
  useEffect(() => {
    if (
      choice &&
      !p.busy &&
      (p.paused ||
        p.decisionVersion !== choice.version ||
        !p.detail ||
        moderationVersion(p.detail.article) !==
          moderationVersion(choice.detail.article))
    )
      setChoice(undefined);
  }, [p.paused, p.decisionVersion, p.detail, p.busy, choice]);
  const rows = (p.library?.articles ?? [])
    .filter(
      (a) =>
        `${a.title} ${a.authorName ?? ""} ${a.id}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (author === "all" ||
          (author === "mine"
            ? a.authorId === p.library?.user.id
            : a.authorId === null)),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          a.id.localeCompare(b.id),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 8)),
    current = Math.min(page, pages),
    canAct = !!p.library && !p.pending && !p.error && !p.busy && !p.paused;
  return (
    <div className={styles.page} aria-busy={p.pending || p.busy}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ADMIN WORKSPACE / ARTICLES</p>
          <h1>
            Read with care.
            <br />
            <span>Keep the library useful.</span>
          </h1>
          <p>Review the public article and explain a moderation decision.</p>
        </div>
        <svg
          className={styles.art}
          width="176"
          height="150"
          viewBox="0 0 176 150"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M35 25H117L142 50V127H35V25Z"
            fill="var(--gui-surface)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M117 25V51H142M53 56H99M53 72H120M53 88H110M53 104H91"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="131"
            cy="111"
            r="20"
            fill="var(--gui-accent-soft)"
            stroke="var(--gui-accent)"
            strokeWidth="2"
          />
          <path
            d="M122 110L128 117L140 103"
            stroke="var(--gui-accent)"
            strokeWidth="3"
          />
        </svg>
      </header>
      <div className={styles.toolbar}>
        <p>
          <strong>{p.library ? p.library.articles.length : "—"}</strong> checked
          public articles · published immediately, without a review queue
        </p>
        <button
          type="button"
          disabled={p.busy || p.pending}
          onClick={p.onRefresh}
        >
          <RefreshCw size={15} aria-hidden="true" /> Refresh articles
        </button>
      </div>
      {p.notice && (
        <p ref={feedback} tabIndex={-1} role="status" className={styles.notice}>
          {p.notice}
        </p>
      )}
      {p.busy && !choice && (
        <p role="status">Checking the requested operation…</p>
      )}
      {p.earlier && !p.paused && (
        <p className={styles.notice}>
          An earlier delete request may still finish. Refresh changed records
          before another decision.
        </p>
      )}
      {p.paused && (
        <GuiFeedback kind="error" title="Article deletions paused">
          <p>
            An article may already be removed and a notification may already
            exist. Checking saved state never repeats the delete. This pause
            applies while this page stays open.
          </p>
          <button type="button" disabled={p.busy} onClick={p.onRecover}>
            Check saved state
          </button>
          {p.recovery && (
            <>
              <p>
                {p.recovery.removed
                  ? "The checked article is absent from the detail endpoint and checked list."
                  : "The article is still present in the checked state. Read its current text before another decision."}
              </p>
              <button type="button" disabled={p.busy} onClick={p.onAdopt}>
                Use checked state and resume
              </button>
            </>
          )}
        </GuiFeedback>
      )}
      {p.pending ? (
        <GuiFeedback kind="loading" title="Checking the public library">
          <p>Checking current admin access and article metadata.</p>
        </GuiFeedback>
      ) : p.error || !p.library ? (
        <GuiFeedback kind="error" title="Article library unavailable">
          <p>{p.error || "The list couldn’t be checked."}</p>
        </GuiFeedback>
      ) : (
        <>
          <section aria-labelledby="admin-articles-list">
            <div className={styles.filters}>
              <label>
                Search articles
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Title, author or article ID"
                />
              </label>
              <label>
                Author
                <select
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All authors</option>
                  <option value="mine">My articles</option>
                  <option value="none">No author account</option>
                </select>
              </label>
              <label>
                Sort by
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>
            <div className={styles.sectionTop}>
              <h2 id="admin-articles-list" ref={heading} tabIndex={-1}>
                Public articles
              </h2>
              <span>
                {rows.length} match · Checked{" "}
                {new Date(p.library.checkedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {!rows.length ? (
              <p className={styles.empty}>
                {p.library.articles.length
                  ? "No articles match these filters."
                  : "No public articles were returned in the checked response."}
              </p>
            ) : (
              <ul className={styles.list}>
                {rows.slice((current - 1) * 8, current * 8).map((a) => (
                  <li key={a.id}>
                    <FileText size={19} aria-hidden="true" />
                    <div>
                      <h3>{a.title}</h3>
                      <p>
                        {a.authorName ?? "Author unavailable"} · Published{" "}
                        {contentDate(a.createdAt)} · Updated{" "}
                        {contentDate(a.updatedAt)}
                      </p>
                      <code>{a.id}</code>
                    </div>
                    <button
                      type="button"
                      disabled={p.busy}
                      onClick={() => p.onInspect(a)}
                    >
                      Review article
                      <span className={styles.srOnly}>: {a.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <nav aria-label="Article list pages" className={styles.paging}>
              <button
                type="button"
                disabled={current === 1}
                onClick={() => {
                  setPage(current - 1);
                  heading.current?.focus();
                }}
              >
                Previous
              </button>
              <span>
                Page {current} of {pages}
              </span>
              <button
                type="button"
                disabled={current === pages}
                onClick={() => {
                  setPage(current + 1);
                  heading.current?.focus();
                }}
              >
                Next
              </button>
            </nav>
          </section>
        </>
      )}
      {p.detailError && (
        <GuiFeedback kind="error" title="Article details unavailable">
          <p>{p.detailError}</p>
        </GuiFeedback>
      )}
      {p.detail && p.library && !p.error && !p.pending && (
        <section
          className={styles.detail}
          aria-labelledby="moderation-article-title"
        >
          <p className={styles.eyebrow}>CHECKED SAVED ARTICLE</p>
          <h2 id="moderation-article-title" ref={detailHeading} tabIndex={-1}>
            {p.detail.article.title}
          </h2>
          <p className={styles.hint}>
            By {p.detail.article.authorName ?? "Author unavailable"} · Saved{" "}
            {contentDate(p.detail.article.updatedAt)}
          </p>
          <p className={styles.hint}>
            Author ID: {p.detail.article.authorId ?? "No author account"} ·
            Slug: {p.detail.article.slug || "(empty)"}
          </p>
          <p className={styles.hint}>
            Linked roadmap: {p.detail.article.roadmapId ?? "None"} · Linked
            lesson: {p.detail.article.conceptId ?? "None"}. Links follow normal
            visibility rules; removal does not remove these targets.
          </p>
          <div className={styles.actions}>
            <Link href={`/articles/${p.detail.article.id}`}>
              Open public reader <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            {canAct && (
              <Link href={`/developer/articles/${p.detail.article.id}/edit`}>
                Edit in developer workspace{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            )}
            <button
              type="button"
              aria-pressed={preview}
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Show saved Markdown" : "Preview Markdown"}
            </button>
          </div>
          <p className={styles.hint}>
            Admin edits publish immediately and keep the original authorship.
            Preview is optional; external images load only after a separate
            image action.
          </p>
          {preview ? (
            <LessonMarkdown
              content={p.detail.article.content}
              idPrefix="moderation-article"
              label="Article"
            />
          ) : (
            <pre tabIndex={0} aria-label="Complete saved article Markdown">
              {p.detail.article.content || "(Empty article text)"}
            </pre>
          )}
          <div className={styles.decision}>
            <div>
              <h3>Remove from the public library</h3>
              <p>
                Permanent deletion requires a specific reason and a final
                confirmation of this saved version.
              </p>
            </div>
            <button
              type="button"
              className={styles.danger}
              disabled={!canAct}
              onClick={() =>
                setChoice({
                  actorId: p.library!.user.id,
                  detail: p.detail!,
                  version: p.decisionVersion,
                  notice: p.notice,
                })
              }
            >
              <Trash2 size={15} aria-hidden="true" /> Remove article…
            </button>
          </div>
        </section>
      )}
      {choice && (
        <DeleteConfirmation
          actorId={choice.actorId}
          detail={choice.detail}
          reason={drafts[choice.detail.article.id] ?? ""}
          onReason={(text) =>
            setDrafts({ ...drafts, [choice.detail.article.id]: text })
          }
          busy={p.busy}
          message={p.notice === choice.notice ? "" : p.notice}
          onKeep={() => {
            if (!p.busy) setChoice(undefined);
          }}
          onConfirm={() =>
            p.onDelete(choice.detail, drafts[choice.detail.article.id] ?? "")
          }
        />
      )}
    </div>
  );
}
