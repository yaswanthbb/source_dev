"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FilePenLine,
  Save,
  Layers,
  Check,
  GitBranch,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { hasSignificantContentChange } from "@/lib/content-diff";
import { EDITOR_REVIEW } from "./editor-data";
import { contentDate } from "./content-data";
import { LESSON_DIFFICULTIES, type LessonDraft } from "./new-lesson-data";
import {
  editableBody,
  editLessonFingerprint,
  lessonEditError,
  type EditLessonData,
  type LessonEdit,
} from "./edit-lesson-data";
import type { LessonEditResult } from "./edit-lesson-client";
import base from "./new-lesson.module.css";
import styles from "./edit-lesson.module.css";

export interface EditLessonViewProps {
  data: EditLessonData;
  refreshing?: boolean;
  pending?: boolean;
  canSave?: boolean;
  readError?: string;
  error?: string;
  uncertain?: boolean;
  recoveryWarning?: boolean;
  checkVersion?: number;
  result?: LessonEditResult;
  onSave: (action: LessonEdit) => void;
  onCheck: () => void;
  onClassic?: () => void;
}
export function EditLessonView({
  data,
  refreshing = false,
  pending = false,
  canSave = true,
  readError,
  error,
  uncertain = false,
  recoveryWarning = false,
  checkVersion = 0,
  result,
  onSave,
  onCheck,
  onClassic,
}: EditLessonViewProps) {
  const { lesson } = data;
  const [title, setTitle] = useState(lesson.title),
    [difficulty, setDifficulty] = useState<LessonDraft["difficulty"]>(
      lesson.difficulty,
    ),
    [content, setContent] = useState(editableBody(lesson));
  const [mode, setMode] = useState<"write" | "preview">("write"),
    [validation, setValidation] = useState<{
      kind: "details" | "body";
      message: string;
      field: string;
    }>(),
    [attempt, setAttempt] = useState(0),
    [confirm, setConfirm] = useState<
      { kind: "body"; action: LessonEdit } | { kind: "reset" } | null
    >(null);
  const summary = useRef<HTMLDivElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    checkedFeedback = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    cancelButton = useRef<HTMLButtonElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    bodySave = useRef<HTMLButtonElement>(null),
    titleInput = useRef<HTMLInputElement>(null);
  const fingerprint = editLessonFingerprint(data),
    previous = useRef(fingerprint);
  const disabled = pending || refreshing || !canSave;
  const detailsDirty =
    title.trim() !== lesson.title || difficulty !== lesson.difficulty;
  const bodyDirty =
    content !== lesson.content && content !== lesson.draftContent;
  const significant = hasSignificantContentChange(lesson.content, content, 40);
  useEffect(() => {
    if (attempt) summary.current?.focus();
  }, [attempt]);
  useEffect(() => {
    if (previous.current === fingerprint) return;
    previous.current = fingerprint;
    setConfirm(null);
  }, [fingerprint]);
  useEffect(() => {
    if (confirm && !dialog.current?.open) {
      dialog.current?.showModal();
      cancelButton.current?.focus();
    }
    if (!confirm && dialog.current?.open) {
      dialog.current.close();
      returnFocus.current?.focus();
    }
  }, [confirm]);
  // Close the native modal before focusing a result outside its inert subtree.
  useEffect(() => {
    if (error || result) feedback.current?.focus();
  }, [error, result]);
  useEffect(() => {
    if (checkVersion > 0) checkedFeedback.current?.focus();
  }, [checkVersion]);
  function validate(action: LessonEdit) {
    const error = lessonEditError(action);
    if (!error) {
      setValidation(undefined);
      return true;
    }
    setValidation({
      kind: action.kind,
      message: error,
      field:
        action.kind === "body"
          ? "edit-lesson-body"
          : !title.trim() || title.trim().length > 200
            ? "edit-lesson-title"
            : "edit-lesson-difficulty",
    });
    setMode("write");
    setAttempt((v) => v + 1);
    return false;
  }
  return (
    <div className={`${base.page} ${styles.page}`}>
      <nav className={base.breadcrumb} aria-label="Lesson editing breadcrumb">
        <Link href="/developer/content">
          <ArrowLeft size={16} aria-hidden="true" />
          My content
        </Link>
        <span aria-hidden="true">/</span>
        <span>Edit lesson</span>
      </nav>
      <header className={base.hero}>
        <div>
          <p className={base.eyebrow}>Good ideas get clearer.</p>
          <h1>
            Keep the idea.
            <br />
            <span>Refine the connection.</span>
          </h1>
          <p>
            Make each explanation easier to follow. Save lesson details and body
            text separately, with room to compare what’s already saved.
          </p>
          {onClassic && (
            <div className={base.actions}>
              <button
                type="button"
                className={base.secondary}
                onClick={onClassic}
              >
                Classic editor
              </button>
            </div>
          )}
        </div>
        <svg className={base.motif} viewBox="0 0 220 170" aria-hidden="true">
          <rect x="25" y="32" width="78" height="99" rx="8" />
          <rect x="116" y="42" width="78" height="99" rx="8" />
          <path
            d="M42 56h43M42 71h31M134 67h43M134 82h36M134 97h43"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className={base.draw}
            d="M78 113h28V26h57"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="78" cy="113" r="5" fill="var(--gui-accent)" />
          <circle cx="163" cy="26" r="5" fill="var(--gui-accent)" />
        </svg>
      </header>
      <div className={styles.lessonIdentity}>
        <FilePenLine size={22} aria-hidden="true" />
        <div>
          <h2>{lesson.title}</h2>
          <p>
            {EDITOR_REVIEW[lesson.reviewStatus]} ·{" "}
            {lesson.isAiGenerated ? "AI generated" : "Handwritten"}
            {lesson.draftContent !== null && " · Pending draft"}
          </p>
        </div>
        <span className={styles.badge}>
          {detailsDirty || bodyDirty ? "Unsaved writing" : "Checked version"}
        </span>
      </div>
      <div className={base.checkbar}>
        <span>
          Last checked {contentDate(data.loadedAt)}. Rechecking keeps your
          writing; it does not replace the form.
        </span>
        <button
          className={base.secondary}
          type="button"
          disabled={pending || refreshing}
          onClick={onCheck}
        >
          {refreshing ? "Checking…" : "Check saved version"}
        </button>
      </div>
      {data.user.id !== lesson.authorId && (
        <GuiFeedback kind="info" title="Editing as an administrator">
          <p>
            This lesson belongs to another author
            {lesson.authorId === null
              ? " whose account is no longer linked"
              : ""}
            . Your saves use the existing author/admin permissions.
          </p>
        </GuiFeedback>
      )}
      {lesson.rejectionReason && (
        <GuiFeedback kind="info" title="Changes requested">
          <p>{lesson.rejectionReason}</p>
        </GuiFeedback>
      )}
      {readError && (
        <GuiFeedback kind="error" title="The saved version couldn't refresh">
          <p>{readError}</p>
          <p>
            Your writing is kept. Saving is paused until a successful check.
          </p>
        </GuiFeedback>
      )}
      {pending && (
        <GuiFeedback
          kind="loading"
          title="Checking, saving and confirming your change"
        >
          <p>
            Keep this page open to see the result. Leaving cannot undo a request
            already sent.
          </p>
        </GuiFeedback>
      )}
      {error ? (
        <GuiFeedback
          ref={feedback}
          kind="error"
          title={
            uncertain ? "Save isn't confirmed" : "The change couldn't be saved"
          }
        >
          <p>{error}</p>
          <button
            type="button"
            className={base.secondary}
            disabled={pending || refreshing}
            onClick={onCheck}
          >
            Check saved version
          </button>
        </GuiFeedback>
      ) : (
        result && (
          <GuiFeedback ref={feedback} kind="success" title={result.message}>
            <p>
              {result.outcome === "details"
                ? "Title and difficulty are confirmed. Body text and review state were kept."
                : result.outcome === "draft"
                  ? "The checked body stays in place. Your new body is a pending draft for review."
                  : `The checked body was updated. ${EDITOR_REVIEW[result.data.lesson.reviewStatus]}.${result.data.lesson.draftContent !== null ? " A previous pending draft remains separate." : ""}`}{" "}
              Any other unsaved fields are kept in this form.
            </p>
          </GuiFeedback>
        )
      )}
      {(checkVersion > 0 || recoveryWarning) && !error && !readError && (
        <GuiFeedback
          ref={checkedFeedback}
          kind="info"
          title={
            recoveryWarning
              ? "Saved version checked; review before another save"
              : "Saved version checked"
          }
        >
          {recoveryWarning ? (
            <p>
              This read cannot prove which request saved the text. An earlier
              request may still finish. Compare your writing with the checked
              version before choosing to save again.
            </p>
          ) : (
            <p>
              Your writing is kept. Compare it with the checked body and pending
              draft below; use the checked version only when you choose to
              replace the form.
            </p>
          )}
        </GuiFeedback>
      )}
      {validation && (
        <GuiFeedback ref={summary} kind="error" title="Check this lesson field">
          <p>
            <a href={`#${validation.field}`}>{validation.message}</a>
          </p>
        </GuiFeedback>
      )}
      <div className={base.workspace}>
        <div className={styles.forms}>
          <section
            className={base.composer}
            aria-labelledby="edit-details-heading"
          >
            <div className={base.sectionHeading}>
              <div>
                <p className={base.eyebrow}>The signpost</p>
                <h2 id="edit-details-heading">Lesson details</h2>
              </div>
              <FilePenLine size={24} aria-hidden="true" />
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (disabled || !detailsDirty) return;
                const action = { kind: "details" as const, title, difficulty };
                if (validate(action)) onSave(action);
              }}
            >
              <label htmlFor="edit-lesson-title">Lesson title (required)</label>
              <input
                ref={titleInput}
                id="edit-lesson-title"
                value={title}
                maxLength={200}
                required
                disabled={pending}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setValidation(undefined);
                }}
                aria-invalid={
                  validation?.field === "edit-lesson-title" || undefined
                }
                aria-describedby="edit-title-help"
              />
              <p className={base.hint} id="edit-title-help">
                Up to 200 characters. A title change updates the lesson’s slug.
              </p>
              <fieldset
                id="edit-lesson-difficulty"
                tabIndex={-1}
                disabled={pending}
                className={base.difficulty}
              >
                <legend>Difficulty</legend>
                {Object.entries(LESSON_DIFFICULTIES).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="edit-lesson-difficulty"
                      value={value}
                      checked={difficulty === value}
                      onChange={() => {
                        setDifficulty(value as LessonDraft["difficulty"]);
                        setValidation(undefined);
                      }}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <div className={base.saveRow}>
                <p>
                  <Check size={16} aria-hidden="true" />
                  Details update immediately. This save keeps the body and
                  review state.
                </p>
                <button
                  className={base.primary}
                  type="submit"
                  disabled={disabled || !detailsDirty}
                >
                  <Save size={16} aria-hidden="true" />
                  Save lesson details
                </button>
              </div>
            </form>
          </section>
          <section
            className={base.composer}
            aria-labelledby="edit-body-heading"
          >
            <div className={base.sectionHeading}>
              <div>
                <p className={base.eyebrow}>The explanation</p>
                <h2 id="edit-body-heading">Lesson body</h2>
              </div>
              <GitBranch size={24} aria-hidden="true" />
            </div>
            {lesson.draftContent !== null && (
              <div className={styles.draftNote}>
                <Layers size={19} aria-hidden="true" />
                <p>
                  A pending draft is saved separately from the body. Compare
                  both checked versions below. Small body updates can still take
                  effect immediately while keeping the older pending draft.
                </p>
              </div>
            )}
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (disabled || !bodyDirty) return;
                const action = { kind: "body" as const, content };
                if (validate(action)) {
                  returnFocus.current = bodySave.current;
                  setConfirm({ kind: "body", action });
                }
              }}
            >
              <div className={base.bodyHeading}>
                <label htmlFor="edit-lesson-body">Lesson body (required)</label>
                <div
                  className={base.modeButtons}
                  role="group"
                  aria-label="Lesson body view"
                >
                  <button
                    type="button"
                    aria-pressed={mode === "write"}
                    aria-controls="edit-body-write"
                    onClick={() => setMode("write")}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "preview"}
                    aria-controls="edit-body-preview"
                    onClick={() => setMode("preview")}
                  >
                    Preview
                  </button>
                </div>
              </div>
              <div id="edit-body-write" hidden={mode !== "write"}>
                <textarea
                  id="edit-lesson-body"
                  value={content}
                  rows={14}
                  required
                  disabled={pending}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setValidation(undefined);
                  }}
                  aria-invalid={
                    validation?.field === "edit-lesson-body" || undefined
                  }
                  aria-describedby="edit-body-help"
                />
              </div>
              {mode === "preview" && (
                <div
                  className={base.preview}
                  id="edit-body-preview"
                  role="region"
                  aria-label="Local lesson body preview"
                >
                  <p className={base.previewLabel}>
                    Local preview · Text in this form · External images load
                    only on request
                  </p>
                  {content.trim() ? (
                    <LessonMarkdown
                      content={content}
                      idPrefix="edit-lesson-local"
                    />
                  ) : (
                    <p className={base.hint}>
                      Write an explanation to preview it here.
                    </p>
                  )}
                </div>
              )}
              <div className={base.bodyMeta}>
                <p className={base.hint} id="edit-body-help">
                  Markdown is supported. Your writing stays on this page without
                  autosave; leaving can lose unsaved changes.
                </p>
                <span>{content.trim().length} characters</span>
              </div>
              <p className={base.hint}>
                {content === lesson.draftContent
                  ? "This text matches the checked pending draft."
                  : content === lesson.content
                    ? "This text matches the checked saved body."
                    : "This body has unsaved changes."}
              </p>
              <div className={base.saveRow}>
                <p>
                  <GitBranch size={16} aria-hidden="true" />
                  Review how the body can change before saving. Title and
                  difficulty are kept.
                </p>
                <button
                  ref={bodySave}
                  className={base.primary}
                  type="submit"
                  disabled={disabled || !bodyDirty}
                >
                  <Save size={16} aria-hidden="true" />
                  Review body save
                </button>
              </div>
            </form>
          </section>
          <section
            className={`${base.composer} ${styles.compare}`}
            aria-labelledby="checked-version-heading"
          >
            <div className={base.sectionHeading}>
              <div>
                <p className={base.eyebrow}>A point of reference</p>
                <h2 id="checked-version-heading">The checked version</h2>
              </div>
              <Layers size={24} aria-hidden="true" />
            </div>
            <p className={base.hint}>
              Saved {contentDate(lesson.updatedAt)} ·{" "}
              {LESSON_DIFFICULTIES[lesson.difficulty]}. This reference refreshes
              when you check; your writing above stays as it is.
            </p>
            <details>
              <summary>Compare the saved body</summary>
              <div className={styles.reference}>
                <LessonMarkdown
                  content={lesson.content}
                  idPrefix="edit-lesson-saved"
                />
              </div>
            </details>
            {lesson.draftContent !== null && (
              <details>
                <summary>Compare the pending draft</summary>
                <div className={styles.reference}>
                  {lesson.draftContent ? (
                    <LessonMarkdown
                      content={lesson.draftContent}
                      idPrefix="edit-lesson-staged"
                    />
                  ) : (
                    <p>The pending draft is empty.</p>
                  )}
                </div>
              </details>
            )}
            <button
              className={base.secondary}
              type="button"
              disabled={disabled}
              onClick={(event) => {
                returnFocus.current = event.currentTarget;
                setConfirm({ kind: "reset" });
              }}
            >
              Use checked version in the form
            </button>
          </section>
        </div>
        <aside className={base.notes} aria-labelledby="edit-notes-heading">
          <p className={base.eyebrow}>Before you save</p>
          <h2 id="edit-notes-heading">
            Two parts.
            <br />
            One clear lesson.
          </h2>
          <h3>Details</h3>
          <p>
            Save the title and difficulty together. These changes take effect
            immediately, including on lessons already in use.
          </p>
          <div className={base.noteDivider} />
          <h3>Body text</h3>
          <p>
            A large change to an approved lesson in a published roadmap is
            staged for review. Smaller edits update its saved body immediately.
            A large edit to a lesson that isn’t live returns it to pending
            review.
          </p>
          <p className={base.hint}>
            The server decides the result. Saving does not approve a draft or
            publish a roadmap.
          </p>
          <div className={base.noteDivider} />
          <h3>Where it appears</h3>
          {data.placements.length ? (
            <ul className={styles.placements}>
              {data.placements.map((p) => (
                <li key={p.id}>
                  <strong>{p.moduleTitle}</strong>
                  <span>{p.roadmapTitle}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>This lesson has no module placements in the checked response.</p>
          )}
          <div className={base.noteDivider} />
          <details>
            <summary>Markdown reminders</summary>
            <p>
              Use headings, short paragraphs, lists and fenced code. HTML stays
              inert. Diagrams use the same protected renderer as the lesson
              reader.
            </p>
            <pre>
              {
                "## A useful idea\n\nExplain why it matters.\n\n- Give one concrete example\n- Connect it to the next idea"
              }
            </pre>
          </details>
          <Link className={base.textLink} href="/developer/content">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to My content
          </Link>
        </aside>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="edit-confirm-title"
        aria-describedby="edit-confirm-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirm(null);
        }}
      >
        <span className={styles.dialogIcon}>
          <FilePenLine size={24} aria-hidden="true" />
        </span>
        <h2 id="edit-confirm-title">
          {confirm?.kind === "reset"
            ? "Replace the form with the checked version?"
            : "Save this body text?"}
        </h2>
        <div id="edit-confirm-description">
          {confirm?.kind === "reset" ? (
            <p>
              This replaces the title, difficulty and writing above. Any unsaved
              changes will be discarded. If a pending draft exists, it will be
              loaded first.
            </p>
          ) : (
            <>
              <p>
                {significant
                  ? "This is a large change compared with the checked saved body. If this approved lesson is in a published roadmap, the body is staged for review. Otherwise the body updates and returns to pending review."
                  : "This is a small change compared with the checked saved body. The body updates immediately, including wherever the lesson is already in use."}
              </p>
              {lesson.draftContent !== null && (
                <p>
                  A direct body update keeps the previous pending draft. A
                  staged update replaces it with this text.
                </p>
              )}
              <p>
                This saves only body text. Any unsaved title or difficulty
                change stays in this form.
              </p>
            </>
          )}
        </div>
        <div className={styles.dialogActions}>
          <button
            ref={cancelButton}
            className={base.secondary}
            type="button"
            onClick={() => setConfirm(null)}
          >
            Keep writing
          </button>
          <button
            className={base.primary}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!confirm || disabled) return;
              const action = confirm;
              setConfirm(null);
              if (action.kind === "body") onSave(action.action);
              else {
                setTitle(lesson.title);
                setDifficulty(lesson.difficulty);
                setContent(editableBody(lesson));
                setValidation(undefined);
                setMode("write");
                returnFocus.current = titleInput.current;
              }
            }}
          >
            {confirm?.kind === "reset"
              ? "Use checked version"
              : "Save body text"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
