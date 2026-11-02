"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, FileText, Save } from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { articleDate } from "./articles-data";
import { articleDraftErrors, type ArticleDraft } from "./own-articles-data";
import {
  articleMatchesDraft,
  articleEditFingerprint,
  type ArticleEditorContext,
} from "./article-editor-data";
import common from "./own-articles.module.css";
import styles from "./article-editor.module.css";
export interface ArticleEditorViewProps {
  context?: ArticleEditorContext;
  draft: ArticleDraft;
  onDraft: (draft: ArticleDraft) => void;
  loading?: boolean;
  refreshing?: boolean;
  pending?: boolean;
  blocked?: boolean;
  locked?: boolean;
  review?: ArticleEditorContext;
  earlierRequest?: boolean;
  error?: string;
  notice?: string;
  onSave: (draft: ArticleDraft) => void;
  onCheck: () => void;
  onAdopt: (keepDraft: boolean) => void;
}
export function ArticleEditorView(props: ArticleEditorViewProps) {
  const { context, draft } = props,
    article = context?.article;
  const [preview, setPreview] = useState(false),
    [errors, setErrors] = useState<Record<string, string | undefined>>({}),
    [confirmation, setConfirmation] = useState<{
      kind: "save" | "replace";
      draft: string;
      reference: string;
      account: string;
    }>();
  const validationRef = useRef<HTMLDivElement>(null),
    errorRef = useRef<HTMLDivElement>(null),
    statusRef = useRef<HTMLDivElement>(null),
    linksRef = useRef<HTMLDetailsElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null),
    cancelRef = useRef<HTMLButtonElement>(null);
  const dirty = !!article && !articleMatchesDraft(article, draft),
    account = context ? `${context.user.id}:${context.user.role}` : "",
    reference = article ? articleEditFingerprint(article) : "",
    reviewReference = props.review
      ? articleEditFingerprint(props.review.article)
      : "";
  const adminEdit = !!context && context.article.authorId !== context.user.id;
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
    if (!dirty && !props.pending && !props.earlierRequest) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, props.pending, props.earlierRequest]);
  const confirmCurrent =
    !!confirmation &&
    confirmation.account === account &&
    confirmation.draft === JSON.stringify(draft) &&
    confirmation.reference ===
      (confirmation.kind === "save" ? reference : reviewReference);
  function edit(field: keyof ArticleDraft, value: string) {
    props.onDraft({ ...draft, [field]: value });
    setErrors((old) => ({ ...old, [field]: undefined }));
  }
  function prepare() {
    if (props.blocked || !article || !dirty) return;
    const issues = articleDraftErrors(draft);
    setErrors(issues);
    if (Object.values(issues).some(Boolean)) {
      if (issues.content) setPreview(false);
      return;
    }
    setConfirmation({
      kind: "save",
      draft: JSON.stringify(draft),
      reference,
      account,
    });
  }
  return (
    <div className={`${common.page} ${styles.page}`}>
      <header className={styles.header}>
        <Link href="/developer/articles" className={styles.back}>
          <ArrowLeft size={15} aria-hidden="true" /> My articles
        </Link>
        <div className={styles.titleRow}>
          <div>
            <p className={common.eyebrow}>Make a good explanation better</p>
            <h1>
              Edit article<span>.</span>
            </h1>
            <p>Refine the connection. Your changes go live when you save.</p>
          </div>
          <svg viewBox="0 0 120 90" fill="none" aria-hidden="true">
            <path
              d="M15 18h70v58H15z"
              fill="var(--gui-surface)"
              stroke="var(--gui-border)"
            />
            <path
              d="M30 33h32M30 44h40M30 55h20"
              stroke="var(--gui-accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              className={styles.pen}
              d="m64 66 29-41 9 7-29 41-14 3z"
              fill="var(--gui-accent-soft)"
              stroke="var(--gui-accent)"
              strokeWidth="2"
            />
            <circle cx="103" cy="14" r="3" fill="var(--gui-accent)" />
          </svg>
        </div>
      </header>
      {props.error && (
        <GuiFeedback
          ref={errorRef}
          kind="error"
          title={
            props.locked
              ? "Review saved state before saving"
              : "Article needs attention"
          }
        >
          {props.error}
        </GuiFeedback>
      )}
      {props.notice && (
        <GuiFeedback ref={statusRef} kind="info" title="Article status">
          {props.notice}
        </GuiFeedback>
      )}
      {props.earlierRequest && (
        <GuiFeedback kind="info" title="Earlier save may still finish">
          A successful read cannot cancel an earlier request. Recheck before
          saving again; a late save could change the public text.
        </GuiFeedback>
      )}
      {adminEdit && (
        <GuiFeedback kind="info" title="Editing as an administrator">
          {article?.authorId
            ? "You are editing another author’s public article."
            : "This article no longer has an author account."}{" "}
          Your save changes its public text immediately; it does not transfer
          authorship.
        </GuiFeedback>
      )}
      {props.locked && (
        <section
          className={styles.recovery}
          aria-labelledby="edit-article-review"
        >
          <h2 id="edit-article-review">Choose how to continue</h2>
          <p>
            Your local draft is kept. Check the latest saved version before
            another save. Reviewing or choosing a version does not send an
            update.
          </p>
          <button
            type="button"
            disabled={props.pending || props.refreshing}
            onClick={props.onCheck}
          >
            {props.refreshing ? "Checking…" : "Check saved version"}
          </button>
          {props.review && (
            <>
              <p>
                <strong>{props.review.article.title}</strong>
                <br />
                Last updated {articleDate(props.review.article.updatedAt)}.{" "}
                {articleMatchesDraft(props.review.article, draft)
                  ? "Your current text matches this checked version."
                  : "This checked version differs from your draft."}
              </p>
              <details>
                <summary>Compare checked saved Markdown</summary>
                <pre tabIndex={0} aria-label="Checked saved Markdown">
                  {props.review.article.content || "No saved article text."}
                </pre>
                <dl>
                  <dt>Roadmap UUID</dt>
                  <dd>{props.review.article.roadmapId ?? "None"}</dd>
                  <dt>Lesson UUID</dt>
                  <dd>{props.review.article.conceptId ?? "None"}</dd>
                </dl>
              </details>
              <div className={styles.recoveryActions}>
                <button
                  type="button"
                  disabled={props.pending || props.refreshing}
                  onClick={() => {
                    setErrors({});
                    props.onAdopt(true);
                  }}
                >
                  Keep my draft with this saved version
                </button>
                <button
                  type="button"
                  disabled={props.pending || props.refreshing}
                  onClick={() =>
                    setConfirmation({
                      kind: "replace",
                      draft: JSON.stringify(draft),
                      reference: reviewReference,
                      account,
                    })
                  }
                >
                  Replace my draft with saved text
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {article ? (
        <div className={styles.desk}>
          <section
            className={common.composer}
            aria-labelledby="edit-article-writing"
          >
            <header className={common.panelHeader}>
              <div>
                <p className={common.eyebrow}>Your writing desk</p>
                <h2 id="edit-article-writing">Article details & text</h2>
              </div>
              <FileText size={21} aria-hidden="true" />
            </header>
            <p className={common.publicNotice}>
              Saves update the public article immediately. There is no review or
              staging step. Your local changes are not autosaved.
            </p>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                prepare();
              }}
            >
              {Object.values(errors).some(Boolean) && (
                <div
                  ref={validationRef}
                  tabIndex={-1}
                  role="alert"
                  className={common.validation}
                >
                  <strong>Check these fields</strong>
                  <ul>
                    {Object.entries(errors)
                      .filter(([, value]) => value)
                      .map(([field, value]) => (
                        <li key={field}>
                          <a href={`#edit-article-${field}`}>{value}</a>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <label htmlFor="edit-article-title">
                Title <span>{draft.title.length}/200</span>
              </label>
              <input
                id="edit-article-title"
                value={draft.title}
                maxLength={200}
                onChange={(event) => edit("title", event.target.value)}
                disabled={props.pending}
                aria-invalid={!!errors.title}
                aria-describedby={
                  errors.title ? "edit-article-title-error" : undefined
                }
              />
              {errors.title && (
                <p className={common.fieldError} id="edit-article-title-error">
                  {errors.title}
                </p>
              )}
              <div className={common.editorLabel}>
                <label htmlFor="edit-article-content">
                  Article <span>Markdown</span>
                </label>
                <button
                  type="button"
                  aria-pressed={preview}
                  onClick={() => setPreview((value) => !value)}
                >
                  {preview ? "Return to writing" : "Preview Markdown"}
                </button>
              </div>
              <p className={common.hint} id="edit-article-help">
                Markdown preview runs here. External images load only when you
                choose to load them.
              </p>
              {preview ? (
                <div
                  className={common.preview}
                  role="region"
                  aria-label="Article edit preview"
                >
                  <p className={common.previewLabel}>Local edit preview</p>
                  {draft.content.trim() ? (
                    <LessonMarkdown
                      content={draft.content}
                      idPrefix="article-edit-preview"
                      label="Article"
                    />
                  ) : (
                    <p>Write article text to preview it.</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="edit-article-content"
                  rows={18}
                  value={draft.content}
                  onChange={(event) => edit("content", event.target.value)}
                  disabled={props.pending}
                  aria-invalid={!!errors.content}
                  aria-describedby={`edit-article-help${errors.content ? " edit-article-content-error" : ""}`}
                />
              )}
              {errors.content && (
                <p
                  className={common.fieldError}
                  id="edit-article-content-error"
                >
                  {errors.content}
                </p>
              )}
              <details ref={linksRef} className={common.links}>
                <summary>Further-reading links</summary>
                <p>
                  Use roadmap/lesson UUIDs. Leaving a field blank removes that
                  reference when you save. References do not grant access to
                  private curriculum.
                </p>
                {(["roadmapId", "conceptId"] as const).map((field) => (
                  <div key={field}>
                    <label htmlFor={`edit-article-${field}`}>
                      {field === "roadmapId" ? "Roadmap UUID" : "Lesson UUID"}
                    </label>
                    <input
                      id={`edit-article-${field}`}
                      value={draft[field]}
                      onChange={(event) => edit(field, event.target.value)}
                      disabled={props.pending}
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={!!errors[field]}
                      aria-describedby={
                        errors[field]
                          ? `edit-article-${field}-error`
                          : undefined
                      }
                      placeholder="Leave blank to remove link"
                    />
                    {errors[field] && (
                      <p
                        className={common.fieldError}
                        id={`edit-article-${field}-error`}
                      >
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}
              </details>
              <div className={common.submit}>
                <p role="status">
                  {props.pending
                    ? "Checking and saving…"
                    : dirty
                      ? "Unsaved local changes"
                      : "Matches the saved reference"}
                </p>
                <button
                  className={common.primary}
                  type="submit"
                  disabled={props.blocked || !dirty}
                >
                  <Save size={15} aria-hidden="true" />
                  {props.pending ? "Saving…" : "Review & save"}
                </button>
              </div>
            </form>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.saved}>
              <p className={common.eyebrow}>Saved reference</p>
              <h2>{article.title}</h2>
              <p>{article.authorName ?? "Author unavailable"}</p>
              <dl>
                <dt>Published</dt>
                <dd>
                  <time dateTime={article.createdAt}>
                    {articleDate(article.createdAt)}
                  </time>
                </dd>
                <dt>Last updated</dt>
                <dd>
                  <time dateTime={article.updatedAt}>
                    {articleDate(article.updatedAt)}
                  </time>
                </dd>
              </dl>
              <Link href={`/articles/${article.id}`} prefetch={false}>
                Read public article{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
              <button
                type="button"
                disabled={props.pending || props.refreshing}
                onClick={props.onCheck}
              >
                {props.refreshing ? "Checking…" : "Check saved version"}
              </button>
              <details>
                <summary>View reference Markdown</summary>
                <pre tabIndex={0} aria-label="Saved reference Markdown">
                  {article.content || "No saved article text."}
                </pre>
              </details>
            </section>
            <section className={styles.explainer}>
              <Check size={18} aria-hidden="true" />
              <h2>A save you can check</h2>
              <p>
                We check your account and the saved version before sending one
                update, then read the article back. If the outcome is unclear,
                saving pauses for your review.
              </p>
              <p>
                Drafts stay in this page. Leaving or changing appearance can
                lose unsaved text.
              </p>
            </section>
          </aside>
        </div>
      ) : (
        <GuiFeedback
          kind={props.loading ? "loading" : "info"}
          title={
            props.loading ? "Loading article editor" : "Editor unavailable"
          }
        >
          {props.loading
            ? "Checking your account, article and editing access."
            : "Check the saved version to retry loading this article."}
          <button
            type="button"
            disabled={props.refreshing}
            onClick={props.onCheck}
          >
            Check saved version
          </button>
        </GuiFeedback>
      )}
      <dialog
        ref={dialogRef}
        className={common.dialog}
        aria-labelledby="article-edit-confirm"
        aria-describedby="article-edit-confirm-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirmation(undefined);
        }}
      >
        <p className={common.eyebrow}>
          {confirmation?.kind === "replace"
            ? "Choose your text"
            : "Immediate public update"}
        </p>
        <h2 id="article-edit-confirm">
          {confirmation?.kind === "replace"
            ? "Replace your local draft?"
            : "Save these changes now?"}
        </h2>
        <p className={common.confirmTitle}>
          {draft.title.trim() || article?.title}
        </p>
        <p id="article-edit-confirm-description">
          {confirmation?.kind === "replace"
            ? "This replaces your current title, Markdown and links with the checked saved version. Your unsaved local text will be discarded. It does not update the server."
            : adminEdit
              ? "You are editing as an administrator. This immediately changes the author’s public article, without a review step. Your account and saved version will be checked first."
              : "This updates your public article immediately, without a review step. Your account and saved version will be checked before one update is sent."}
        </p>
        {!confirmCurrent && confirmation && (
          <p role="alert">
            The account, draft or checked version changed. Cancel and review
            again.
          </p>
        )}
        <div className={common.dialogActions}>
          <button
            ref={cancelRef}
            type="button"
            onClick={() => setConfirmation(undefined)}
          >
            Keep writing
          </button>
          <button
            className={common.primary}
            type="button"
            disabled={
              !confirmCurrent ||
              props.pending ||
              props.refreshing ||
              (confirmation?.kind === "save" && props.blocked)
            }
            onClick={() => {
              if (
                !confirmation ||
                !confirmCurrent ||
                props.pending ||
                props.refreshing
              )
                return;
              const kind = confirmation.kind;
              if (kind === "save" && props.blocked) return;
              setConfirmation(undefined);
              if (kind === "replace") {
                setErrors({});
                props.onAdopt(false);
              } else props.onSave({ ...draft });
            }}
          >
            {confirmation?.kind === "replace"
              ? "Replace local draft"
              : "Save public changes"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
