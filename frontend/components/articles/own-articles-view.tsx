"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  PenLine,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { articleDate } from "./articles-data";
import {
  articleDraftErrors,
  emptyArticleDraft,
  ownArticleFingerprint,
  type ArticleDraft,
  type OwnArticle,
  type OwnArticleAction,
  type OwnArticlesLibrary,
  type ArticleRecovery,
} from "./own-articles-data";
import reading from "./article-reader.module.css";
import styles from "./own-articles.module.css";
export interface OwnArticlesViewProps {
  data?: OwnArticlesLibrary;
  loading?: boolean;
  refreshing?: boolean;
  pending?: boolean;
  blocked?: boolean;
  locked?: boolean;
  recovery?: ArticleRecovery;
  previousUncertain?: boolean;
  result?: OwnArticle;
  error?: string;
  notice?: string;
  onAction: (action: OwnArticleAction) => void;
  onCheck: () => void;
  onResume: () => void;
  onNew: () => void;
}
function NotebookMark() {
  return (
    <svg viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <path
        d="M35 19h83l20 20v65H35z"
        fill="var(--gui-surface)"
        stroke="var(--gui-border)"
        strokeWidth="1.5"
      />
      <path
        d="M118 19v20h20M51 47h43M51 59h62M51 71h45M51 83h57"
        stroke="var(--gui-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className={styles.penStroke}
        d="m105 91 30-44 11 8-31 44-16 7z"
        fill="var(--gui-accent-soft)"
        stroke="var(--gui-accent)"
        strokeWidth="2"
      />
      <circle cx="151" cy="26" r="4" fill="var(--gui-accent)" />
      <path
        d="M19 70h10M24 65v10"
        stroke="var(--gui-accent)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
export function OwnArticlesView(props: OwnArticlesViewProps) {
  const [draft, setDraft] = useState<ArticleDraft>({ ...emptyArticleDraft }),
    [errors, setErrors] = useState<Record<string, string | undefined>>({}),
    [preview, setPreview] = useState(false),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [confirmation, setConfirmation] = useState<{
      action: OwnArticleAction;
      account: string;
      snapshot: string;
    }>();
  const validationRef = useRef<HTMLDivElement>(null),
    errorRef = useRef<HTMLDivElement>(null),
    statusRef = useRef<HTMLDivElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null),
    cancelRef = useRef<HTMLButtonElement>(null),
    titleRef = useRef<HTMLInputElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    linksRef = useRef<HTMLDetailsElement>(null),
    previousResult = useRef<string | undefined>(undefined);
  const account = props.data
    ? `${props.data.user.id}:${props.data.user.role}`
    : "";
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!confirmation || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, [confirmation]);
  useEffect(() => {
    if (errors.roadmapId || errors.conceptId) {
      if (linksRef.current) linksRef.current.open = true;
    }
    if (Object.values(errors).some(Boolean)) validationRef.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (props.error) errorRef.current?.focus();
  }, [props.error]);
  useEffect(() => {
    if (props.notice) statusRef.current?.focus();
  }, [props.notice]);
  useEffect(() => {
    if (!Object.values(draft).some(Boolean) || props.result) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, props.result]);
  useEffect(() => {
    if (previousResult.current && !props.result) titleRef.current?.focus();
    previousResult.current = props.result?.id;
  }, [props.result]);
  const filtered = (props.data?.articles ?? [])
    .filter((row) =>
      row.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    )
    .slice()
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    currentPage = Math.min(page, pages),
    rows = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  const selectedId =
    confirmation?.action.kind === "delete"
      ? confirmation.action.article.id
      : undefined;
  const confirmCurrent =
    !!confirmation &&
    confirmation.account === account &&
    (confirmation.action.kind === "create"
      ? confirmation.snapshot === JSON.stringify(draft)
      : confirmation.snapshot ===
        ownArticleFingerprint(
          props.data?.articles.find((row) => row.id === selectedId) ?? {
            ...confirmation.action.article,
            updatedAt: "changed",
          },
        ));
  function edit(field: keyof ArticleDraft, value: string) {
    setDraft((old) => ({ ...old, [field]: value }));
    setErrors((old) => ({ ...old, [field]: undefined }));
  }
  function preparePublish() {
    if (props.blocked || props.result) return;
    const issues = articleDraftErrors(draft);
    setErrors(issues);
    if (Object.values(issues).some(Boolean)) {
      if (issues.content) setPreview(false);
      return;
    }
    setConfirmation({
      action: { kind: "create", draft: { ...draft } },
      account,
      snapshot: JSON.stringify(draft),
    });
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your words, out in the world</p>
          <h1>
            My articles<span>.</span>
          </h1>
          <p>
            A useful explanation can make something click. Write yours, then
            share it with everyone.
          </p>
          <Link href="/articles">
            Explore public articles{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <NotebookMark />
      </header>
      <div className={styles.topline}>
        <p>
          <span className={styles.dot} />
          {props.data
            ? `${props.data.articles.length} ${props.data.articles.length === 1 ? "article" : "articles"} in your last checked library`
            : "Your article workspace"}
        </p>
        <button
          type="button"
          onClick={props.onCheck}
          disabled={props.pending || props.refreshing}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {props.refreshing ? "Checking…" : "Check saved articles"}
        </button>
      </div>
      {props.error && (
        <GuiFeedback
          ref={errorRef}
          kind="error"
          title={
            props.locked ? "Outcome not confirmed" : "Articles need attention"
          }
        >
          {props.error}
        </GuiFeedback>
      )}
      {props.notice && (
        <GuiFeedback ref={statusRef} kind="success" title="Saved-state check">
          {props.notice}
        </GuiFeedback>
      )}
      {props.locked && (
        <section className={styles.recovery} aria-labelledby="article-recovery">
          <h2 id="article-recovery">Review before another change</h2>
          <p>
            Publishing or deletion may already have happened. Changes stay
            paused until a successful check and your review. A read cannot
            cancel an earlier request.
          </p>
          <button
            type="button"
            onClick={props.onCheck}
            disabled={props.pending || props.refreshing}
          >
            {props.refreshing ? "Checking saved state…" : "Check saved state"}
          </button>
          {props.recovery && (
            <>
              <p>
                {props.recovery.removed
                  ? "The selected article is currently absent."
                  : props.recovery.candidates.length
                    ? "Possible saved articles — open and review these before publishing again."
                    : "No matching new article appeared in this check. An earlier request may still finish."}
              </p>
              {props.recovery.candidates.map((row) => (
                <Link
                  key={row.id}
                  href={`/articles/${row.id}`}
                  prefetch={false}
                >
                  {row.title} <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              ))}
              <button
                type="button"
                onClick={props.onResume}
                disabled={props.pending || props.refreshing}
              >
                I reviewed saved state — resume changes
              </button>
            </>
          )}
        </section>
      )}
      {props.previousUncertain && !props.locked && (
        <GuiFeedback kind="info" title="Earlier request may still finish">
          Check the library for duplicates before publishing again. Resuming
          changes does not cancel that request.
        </GuiFeedback>
      )}
      <div className={styles.columns}>
        <section
          className={styles.composer}
          aria-labelledby="article-compose-title"
        >
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Make the connection</p>
              <h2 id="article-compose-title">Write an article</h2>
            </div>
            <PenLine size={21} aria-hidden="true" />
          </header>
          <p className={styles.publicNotice}>
            Publishes immediately. Your article text and author name will be
            public, with no review step. Your draft stays in this page until you
            publish; it isn’t autosaved.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              preparePublish();
            }}
            noValidate
          >
            {Object.values(errors).some(Boolean) && (
              <div
                className={styles.validation}
                ref={validationRef}
                tabIndex={-1}
                role="alert"
              >
                <strong>Check these fields</strong>
                <ul>
                  {Object.entries(errors)
                    .filter(([, value]) => value)
                    .map(([field, value]) => (
                      <li key={field}>
                        <a href={`#own-article-${field}`}>{value}</a>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <label htmlFor="own-article-title">
              Title <span>{draft.title.length}/200</span>
            </label>
            <input
              ref={titleRef}
              id="own-article-title"
              value={draft.title}
              maxLength={200}
              onChange={(e) => edit("title", e.target.value)}
              disabled={props.pending || !!props.result}
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "own-article-title-error" : undefined
              }
              placeholder="The idea you wish someone had explained sooner"
            />
            {errors.title && (
              <p className={styles.fieldError} id="own-article-title-error">
                {errors.title}
              </p>
            )}
            <div className={styles.editorLabel}>
              <label htmlFor="own-article-content">
                Article <span>Markdown</span>
              </label>
              <button
                type="button"
                aria-pressed={preview}
                onClick={() => setPreview((v) => !v)}
              >
                {preview ? "Return to writing" : "Preview Markdown"}
              </button>
            </div>
            <p className={styles.hint} id="article-markdown-help">
              Use headings, lists, links and fenced code blocks. Preview runs
              here; it does not publish.
            </p>
            {preview ? (
              <div
                className={`${styles.preview} ${reading.body}`}
                role="region"
                aria-label="Draft preview"
              >
                <p className={styles.previewLabel}>Local draft preview</p>
                {draft.content.trim() ? (
                  <LessonMarkdown
                    content={draft.content}
                    idPrefix="article-draft-section"
                    label="Article"
                  />
                ) : (
                  <p>Start writing to preview your article.</p>
                )}
              </div>
            ) : (
              <textarea
                id="own-article-content"
                rows={14}
                value={draft.content}
                onChange={(e) => edit("content", e.target.value)}
                disabled={props.pending || !!props.result}
                aria-invalid={!!errors.content}
                aria-describedby={`article-markdown-help${errors.content ? " own-article-content-error" : ""}`}
                placeholder="Start with the connection. What helped it click for you?"
              />
            )}
            {errors.content && (
              <p className={styles.fieldError} id="own-article-content-error">
                {errors.content}
              </p>
            )}
            <details ref={linksRef} className={styles.links}>
              <summary>
                Link further reading <span>optional</span>
              </summary>
              <p>
                Copy a roadmap or lesson UUID from your content. These
                references do not grant readers access to private curriculum.
              </p>
              {(["roadmapId", "conceptId"] as const).map((field) => (
                <div key={field}>
                  <label htmlFor={`own-article-${field}`}>
                    {field === "roadmapId" ? "Roadmap UUID" : "Lesson UUID"}
                  </label>
                  <input
                    id={`own-article-${field}`}
                    value={draft[field]}
                    onChange={(e) => edit(field, e.target.value)}
                    disabled={props.pending || !!props.result}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={!!errors[field]}
                    aria-describedby={
                      errors[field] ? `own-article-${field}-error` : undefined
                    }
                    placeholder="Leave blank if not needed"
                  />
                  {errors[field] && (
                    <p
                      className={styles.fieldError}
                      id={`own-article-${field}-error`}
                    >
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}
            </details>
            {props.result ? (
              <div className={styles.saved}>
                <FileText size={20} aria-hidden="true" />
                <div>
                  <strong>Published and checked</strong>
                  <Link href={`/articles/${props.result.id}`} prefetch={false}>
                    Read your article{" "}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    disabled={props.blocked}
                    onClick={() => {
                      props.onNew();
                      setDraft({ ...emptyArticleDraft });
                      setErrors({});
                      setPreview(false);
                      titleRef.current?.focus();
                    }}
                  >
                    Start another article
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.submit}>
                <p>
                  {props.pending
                    ? "Checking account, ownership and saved state…"
                    : "Handwritten. Public when you publish."}
                </p>
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={props.blocked || props.pending}
                >
                  {props.pending ? "Working…" : "Review & publish"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </form>
        </section>
        <section
          className={styles.library}
          aria-labelledby="own-articles-library"
        >
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Your public notebook</p>
              <h2 id="own-articles-library">Published articles</h2>
            </div>
            <FileText size={21} aria-hidden="true" />
          </header>
          <div className={styles.filters}>
            <label htmlFor="own-article-search">
              <Search size={15} aria-hidden="true" />
              Search your titles
            </label>
            <input
              ref={searchRef}
              id="own-article-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Find an article"
            />
            <label htmlFor="own-article-sort">Sort articles</label>
            <select
              id="own-article-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
          {props.loading ? (
            <GuiFeedback kind="loading" title="Loading your articles">
              Checking your account and public article library.
            </GuiFeedback>
          ) : !props.data ? (
            <GuiFeedback kind="info" title="Library unavailable">
              Use Check saved articles to reload. Your draft is kept.
            </GuiFeedback>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={28} aria-hidden="true" />
              <h3>
                {search.trim()
                  ? "No titles match."
                  : "Your first article starts here."}
              </h3>
              <p>
                {search.trim()
                  ? "Try another title or clear your search."
                  : "Share an explanation, a discovery, or a connection you made."}
              </p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    searchRef.current?.focus();
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <p className={styles.resultCount} role="status">
                Showing {(currentPage - 1) * 6 + 1}–
                {Math.min(currentPage * 6, filtered.length)} of{" "}
                {filtered.length} {search.trim() ? "matching " : ""}articles
              </p>
              <ol
                className={styles.articleList}
                start={(currentPage - 1) * 6 + 1}
              >
                {rows.map((row) => (
                  <li key={row.id}>
                    <div className={styles.articleMeta}>
                      <span>PUBLIC ARTICLE</span>
                      <time dateTime={row.createdAt}>
                        {articleDate(row.createdAt)}
                      </time>
                    </div>
                    <h3>
                      <Link href={`/articles/${row.id}`} prefetch={false}>
                        {row.title}
                      </Link>
                    </h3>
                    <div className={styles.rowActions}>
                      <Link href={`/articles/${row.id}`} prefetch={false}>
                        Read <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                      <Link href={`/developer/articles/${row.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={props.blocked}
                        aria-label={`Delete ${row.title}`}
                        onClick={() =>
                          setConfirmation({
                            action: { kind: "delete", article: row },
                            account,
                            snapshot: ownArticleFingerprint(row),
                          })
                        }
                      >
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              {pages > 1 && (
                <nav className={styles.pager} aria-label="Your article pages">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {pages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="own-article-dialog-title"
        aria-describedby="own-article-dialog-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirmation(undefined);
        }}
      >
        <p className={styles.eyebrow}>
          {confirmation?.action.kind === "delete"
            ? "Permanent removal"
            : "Ready to share?"}
        </p>
        <h2 id="own-article-dialog-title">
          {confirmation?.action.kind === "delete"
            ? "Delete this article?"
            : "Publish this article now?"}
        </h2>
        <p className={styles.confirmTitle}>
          {confirmation?.action.kind === "delete"
            ? confirmation.action.article.title
            : confirmation?.action.draft.title.trim()}
        </p>
        <p id="own-article-dialog-description">
          {confirmation?.action.kind === "delete"
            ? "This permanently removes the public article. There is no undo. Your account, ownership and saved version will be checked before deletion."
            : "Your article text and author name become public immediately, without a review step. Only publish text you intend to share."}
        </p>
        {!confirmCurrent && confirmation && (
          <p role="alert">
            The article, draft or account changed. Cancel and review the latest
            state.
          </p>
        )}
        <div className={styles.dialogActions}>
          <button
            ref={cancelRef}
            type="button"
            onClick={() => setConfirmation(undefined)}
          >
            Keep reviewing
          </button>
          <button
            className={
              confirmation?.action.kind === "delete"
                ? styles.danger
                : styles.primary
            }
            type="button"
            disabled={!confirmCurrent || props.blocked}
            onClick={() => {
              if (!confirmation || !confirmCurrent || props.blocked) return;
              const action = confirmation.action;
              setConfirmation(undefined);
              props.onAction(action);
            }}
          >
            {confirmation?.action.kind === "delete"
              ? "Delete permanently"
              : "Publish now"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
