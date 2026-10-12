"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FilePenLine,
  LockKeyhole,
  Plus,
  Save,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { EDITOR_REVIEW } from "./editor-data";
import { contentDate } from "./content-data";
import {
  lessonDraftErrors,
  LESSON_DIFFICULTIES,
  type LessonDraft,
  type NewLessonContext,
  type SavedNewLesson,
} from "./new-lesson-data";
import type { NewLessonResult } from "./new-lesson-client";
import styles from "./new-lesson.module.css";

export interface NewLessonViewProps {
  context?: NewLessonContext;
  loading?: boolean;
  refreshing?: boolean;
  readError?: string;
  pending?: boolean;
  error?: string;
  checkError?: string;
  uncertain?: boolean;
  result?: NewLessonResult;
  candidates?: SavedNewLesson[];
  checkedTitle?: string;
  recovered?: boolean;
  resetVersion?: number;
  canCreate?: boolean;
  canAttach?: boolean;
  onCreate: (draft: LessonDraft) => void;
  onAttach: () => void;
  onCheck: (draft: LessonDraft) => void;
  onStartAnother: () => void;
  onClassic?: () => void;
}
export function NewLessonView({
  context,
  loading = false,
  refreshing = false,
  readError,
  pending = false,
  error,
  checkError,
  uncertain = false,
  result,
  candidates,
  checkedTitle,
  recovered = false,
  resetVersion = 0,
  canCreate = true,
  canAttach = false,
  onCreate,
  onAttach,
  onCheck,
  onStartAnother,
  onClassic,
}: NewLessonViewProps) {
  const [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [difficulty, setDifficulty] = useState<LessonDraft["difficulty"]>("medium");
  const [mode, setMode] = useState<"write" | "preview">("write"),
    [errors, setErrors] = useState<ReturnType<typeof lessonDraftErrors>>({
      title: undefined,
      content: undefined,
      difficulty: undefined,
    }),
    [attempt, setAttempt] = useState(0);
  const summary = useRef<HTMLDivElement>(null),
    status = useRef<HTMLDivElement>(null),
    savedStatus = useRef<HTMLDivElement>(null),
    preview = useRef<HTMLDivElement>(null),
    titleInput = useRef<HTMLInputElement>(null),
    bodyInput = useRef<HTMLTextAreaElement>(null),
    previousReset = useRef(resetVersion);
  const draft = { title, content, difficulty },
    disabled =
      !context || !canCreate || pending || refreshing || loading || !!result;
  const target = context?.target,
    targetModule = target?.editor.modules.find((m) => m.id === target.moduleId);
  const targetRequested = !!context?.request.moduleId;
  useEffect(() => {
    if (attempt) summary.current?.focus();
  }, [attempt]);
  useEffect(() => {
    if (error || checkError) status.current?.focus();
    else if (result) savedStatus.current?.focus();
  }, [error, checkError, result]);
  useEffect(() => {
    if (previousReset.current === resetVersion) return;
    previousReset.current = resetVersion;
    setTitle("");
    setContent("");
    setDifficulty("medium");
    setMode("write");
    setErrors({ title: undefined, content: undefined, difficulty: undefined });
    titleInput.current?.focus();
  }, [resetVersion]);
  const openPreview = () => {
    setMode("preview");
  };
  const openWrite = () => {
    setMode("write");
  };
  const chars = content.trim().length;
  return (
    <div className={styles.page}>
      <nav
        className={styles.breadcrumb}
        aria-label="Lesson authoring breadcrumb"
      >
        <Link href="/developer/content">
          <ArrowLeft size={16} aria-hidden="true" />
          My content
        </Link>
        {target && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/developer/content/${encodeURIComponent(target.editor.roadmap.id)}`}
            >
              {target.editor.roadmap.title}
            </Link>
          </>
        )}
        <span>New lesson</span>
      </nav>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>One idea. Made clear.</p>
          <h1>
            Write the next
            <br />
            <span>connection.</span>
          </h1>
          <p>
            Turn what you know into a lesson. Start with a clear explanation,
            add an example, and give the next idea a place to begin.
          </p>
          <div className={styles.actions}>
            {onClassic && (
              <button
                className={styles.secondary}
                type="button"
                onClick={onClassic}
              >
                Classic authoring
              </button>
            )}
          </div>
        </div>
        <svg className={styles.motif} viewBox="0 0 220 170" aria-hidden="true">
          <path
            d="M44 24h95l33 32v88H44z"
            fill="var(--gui-surface)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M139 24v32h33"
            fill="var(--gui-accent-soft)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M66 56h49M66 70h67M66 84h52"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className={styles.draw}
            d="M75 112h52v-13h58"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="65" y="102" width="20" height="20" rx="5" />
          <rect x="175" y="89" width="20" height="20" rx="5" />
        </svg>
      </header>
      <div className={styles.checkbar}>
        <span>
          {context
            ? `Last checked ${contentDate(context.loadedAt)}. Your writing is kept in this page, without autosave.`
            : "Checking your authoring account and optional module."}
        </span>
        <button
          className={styles.secondary}
          type="button"
          disabled={refreshing || pending}
          onClick={() => onCheck(draft)}
        >
          {refreshing
            ? "Checking…"
            : result || uncertain
              ? "Check saved state"
              : "Recheck access"}
        </button>
      </div>
      {loading && (
        <GuiFeedback kind="loading" title="Preparing lesson authoring">
          <p>Checking your account and any module linked from your roadmap.</p>
        </GuiFeedback>
      )}
      {readError && (
        <GuiFeedback
          kind="error"
          title={
            context
              ? "Authoring checks couldn’t refresh"
              : "Authoring couldn’t load"
          }
        >
          <p>{readError}</p>
          <p>
            Your draft is kept; creation stays paused until a successful check.
          </p>
        </GuiFeedback>
      )}
      {pending && (
        <GuiFeedback
          kind="loading"
          title={
            result
              ? "Checking and attaching the saved lesson"
              : target
                ? "Creating your lesson, then checking attachment"
                : "Creating your lesson"
          }
        >
          <p>
            Leaving this page cannot undo a request already sent. A saved lesson
            is kept even if its attachment fails.
          </p>
        </GuiFeedback>
      )}
      {(error || checkError) && (
        <GuiFeedback
          ref={status}
          kind="error"
          title={
            checkError
              ? "Saved state couldn’t be checked"
              : uncertain
                ? "Lesson creation isn’t confirmed"
                : "The lesson couldn’t be created"
          }
        >
          <p>{checkError || error}</p>
          <button
            type="button"
            className={styles.secondary}
            disabled={pending || refreshing}
            onClick={() => onCheck(draft)}
          >
            Check saved state
          </button>
        </GuiFeedback>
      )}
      {result && (
        <GuiFeedback
          ref={savedStatus}
          kind={result.attachment === "unconfirmed" ? "info" : "success"}
          title={
            result.attachment === "attached"
              ? "Lesson created and attachment confirmed"
              : result.attachment === "unconfirmed"
                ? "Lesson created; attachment isn’t confirmed"
                : "Lesson created"
          }
        >
          <p>
            The server saved “{result.lesson.title}”.{" "}
            {EDITOR_REVIEW[result.lesson.reviewStatus]}. This form does not
            publish lessons.
          </p>
          {result.issue && <p>{result.issue}</p>}
          {result.attachment === "unconfirmed" && (
            <>
              <p>
                Keep this saved lesson. Checking or retrying attachment never
                creates it again.
              </p>
              <button
                type="button"
                className={styles.secondary}
                disabled={pending || refreshing}
                onClick={() => onCheck(draft)}
              >
                Check saved lesson & module
              </button>
              {canAttach && (
                <button
                  type="button"
                  className={styles.primary}
                  disabled={pending || refreshing}
                  onClick={onAttach}
                >
                  Attach saved lesson
                </button>
              )}
            </>
          )}
          <div className={styles.actions}>
            <Link
              className={styles.secondary}
              href={`/developer/concepts/${encodeURIComponent(result.lesson.id)}/edit`}
            >
              Continue editing
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {target && result.attachment === "attached" && (
              <Link
                className={styles.secondary}
                href={`/developer/content/${encodeURIComponent(target.editor.roadmap.id)}`}
              >
                View roadmap editor
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </GuiFeedback>
      )}
      {recovered && (
        <GuiFeedback kind="info" title="Fresh saved state checked">
          <p>
            Review any previous save before creating another. An earlier request
            may still finish; a fresh read cannot cancel it or guarantee that
            repeating a change is safe.
          </p>
        </GuiFeedback>
      )}
      {candidates !== undefined && !result && (
        <section
          className={styles.candidates}
          aria-labelledby="possible-saves-heading"
        >
          <h2 id="possible-saves-heading">Possible previous saves</h2>
          <p>
            {candidates.length
              ? `${candidates.length} owned lesson(s) match the submitted title “${checkedTitle ?? title.trim()}” and difficulty. These matches do not prove which request created them.`
              : `No matching owned lessons for “${checkedTitle ?? title.trim()}” appeared in this check. An earlier request may still finish.`}
          </p>
          <ul>
            {candidates.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/developer/concepts/${encodeURIComponent(c.id)}/edit`}
                >
                  {c.title}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <span>
                  {EDITOR_REVIEW[c.reviewStatus]} · Created{" "}
                  {contentDate(c.createdAt)}
                </span>
              </li>
            ))}
          </ul>
          {candidates.length > 6 && (
            <p>
              Showing the first 6 matches. Use lesson search in your roadmap
              editor to review more.
            </p>
          )}
        </section>
      )}
      <div className={styles.workspace}>
        <section
          className={styles.composer}
          aria-labelledby="lesson-form-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>
                {result ? "Your submitted text" : "The writing desk"}
              </p>
              <h2 id="lesson-form-heading">
                {result ? "Lesson saved" : "Create a lesson"}
              </h2>
            </div>
            <FilePenLine size={24} aria-hidden="true" />
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (disabled) return;
              const next = lessonDraftErrors(draft);
              setErrors(next);
              if (next.title || next.content || next.difficulty) {
                setMode("write");
                setAttempt((v) => v + 1);
                return;
              }
              onCreate(draft);
            }}
          >
            {(errors.title || errors.content || errors.difficulty) && (
              <GuiFeedback
                ref={summary}
                kind="error"
                title="Check your lesson details"
              >
                {errors.title && (
                  <p>
                    <a href="#new-lesson-title">{errors.title}</a>
                  </p>
                )}
                {errors.content && (
                  <p>
                    <a href="#new-lesson-body">{errors.content}</a>
                  </p>
                )}
                {errors.difficulty && (
                  <p>
                    <a href="#new-lesson-difficulty">{errors.difficulty}</a>
                  </p>
                )}
              </GuiFeedback>
            )}
            <label htmlFor="new-lesson-title">Lesson title (required)</label>
            <input
              ref={titleInput}
              id="new-lesson-title"
              value={title}
              maxLength={200}
              required
              readOnly={!!result}
              disabled={pending}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "lesson-title-error" : "lesson-title-help"
              }
              placeholder="e.g. How a branch points to a commit"
            />
            <p id="lesson-title-help" className={styles.hint}>
              A specific idea, in 200 characters or fewer.
            </p>
            {errors.title && (
              <p id="lesson-title-error" className={styles.fieldError}>
                {errors.title}
              </p>
            )}
            <fieldset
              id="new-lesson-difficulty"
              tabIndex={-1}
              className={styles.difficulty}
              disabled={pending || !!result}
              aria-describedby={
                errors.difficulty ? "lesson-difficulty-error" : undefined
              }
            >
              <legend>Difficulty</legend>
              {Object.entries(LESSON_DIFFICULTIES).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="radio"
                    name="lesson-difficulty"
                    value={key}
                    checked={difficulty === key}
                    onChange={() => {
                      setDifficulty(key as LessonDraft["difficulty"]);
                      setErrors({ ...errors, difficulty: undefined });
                    }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {errors.difficulty && (
              <p id="lesson-difficulty-error" className={styles.fieldError}>
                {errors.difficulty}
              </p>
            )}
            <div className={styles.bodyHeading}>
              <label htmlFor={mode === "write" ? "new-lesson-body" : undefined}>
                Lesson body · Markdown (required)
              </label>
              <div
                className={styles.modeButtons}
                aria-label="Writing and preview mode"
              >
                <button
                  type="button"
                  aria-pressed={mode === "write"}
                  aria-controls="new-lesson-writing"
                  onClick={openWrite}
                >
                  Write
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "preview"}
                  aria-controls="new-lesson-preview"
                  onClick={openPreview}
                >
                  Preview
                </button>
              </div>
            </div>
            {mode === "write" ? (
              <div id="new-lesson-writing">
                <textarea
                  ref={bodyInput}
                  id="new-lesson-body"
                  value={content}
                  rows={16}
                  required
                  readOnly={!!result}
                  disabled={pending}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setErrors({ ...errors, content: undefined });
                  }}
                  aria-invalid={!!errors.content}
                  aria-describedby={
                    errors.content ? "lesson-body-error" : "lesson-body-help"
                  }
                  placeholder="Explain the idea. Show an example. Connect it to what comes next."
                />
              </div>
            ) : (
              <section
                id="new-lesson-preview"
                className={styles.preview}
                ref={preview}
                tabIndex={-1}
                aria-label="Local Markdown preview"
              >
                <p className={styles.previewLabel}>
                  Local preview · No save or AI generation
                </p>
                {content.trim() ? (
                  <LessonMarkdown
                    content={content}
                    idPrefix="new-lesson-preview-section"
                  />
                ) : (
                  <div className={styles.previewEmpty}>
                    <FilePenLine size={24} aria-hidden="true" />
                    <h3>Your explanation goes here.</h3>
                    <p>Write something, then preview how it reads.</p>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={openWrite}
                    >
                      Start writing
                    </button>
                  </div>
                )}
              </section>
            )}
            <div className={styles.bodyMeta}>
              <p id="lesson-body-help" className={styles.hint}>
                At least 20 characters. Use headings, lists, links and fenced
                code.
              </p>
              <span>{chars} characters</span>
            </div>
            {errors.content && (
              <p id="lesson-body-error" className={styles.fieldError}>
                {errors.content}
              </p>
            )}
            {result ? (
              <>
                <p className={styles.hint}>
                  This is the local text you submitted. Edits made elsewhere are
                  not loaded into it. Continue editing the saved lesson in its
                  lesson editor.
                </p>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={pending || refreshing || uncertain}
                  onClick={onStartAnother}
                >
                  <Plus size={16} aria-hidden="true" />
                  Start another lesson
                </button>
              </>
            ) : (
              <div className={styles.saveRow}>
                <p>
                  <LockKeyhole size={17} aria-hidden="true" />
                  Starts in pending review. No AI runs here.
                </p>
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={disabled}
                >
                  <Save size={17} aria-hidden="true" />
                  {pending
                    ? "Saving…"
                    : target
                      ? "Save lesson & attach"
                      : "Save private lesson"}
                </button>
              </div>
            )}
          </form>
        </section>
        <aside className={styles.notes} aria-labelledby="lesson-notes-heading">
          <p className={styles.eyebrow}>A place in the path</p>
          <h2 id="lesson-notes-heading">
            {targetModule
              ? "Linked module"
              : targetRequested
                ? "Module needs a check"
                : context
                  ? "Your own lesson"
                  : "Checking placement"}
          </h2>
          {targetModule && target ? (
            <>
              <span className={styles.badge}>
                {target.editor.roadmap.status === "published"
                  ? "Published roadmap"
                  : target.editor.roadmap.status === "submitted"
                    ? "Roadmap in review"
                    : "Draft roadmap"}
              </span>
              <h3>{targetModule.title}</h3>
              <p>In {target.editor.roadmap.title}.</p>
              <p>
                Saving creates your lesson first, then checks and attaches it
                here. If attachment fails, the saved lesson is kept.
              </p>
              <Link
                className={styles.textLink}
                href={`/developer/content/${encodeURIComponent(target.editor.roadmap.id)}`}
              >
                Back to roadmap editor
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p>
              {targetRequested
                ? "The saved lesson remains yours. Recheck the target or open My content to choose a module."
                : context
                  ? "This lesson is created without a module. You can attach it later from an owned roadmap’s editor."
                  : "A linked module appears here once its ownership is checked. Creation is paused while authoring access loads."}
            </p>
          )}
          <div className={styles.noteDivider} />
          <h3>Make the idea easier to follow</h3>
          <ol>
            <li>Explain one clear concept.</li>
            <li>Give an example someone can trace.</li>
            <li>Connect it to the next idea.</li>
          </ol>
          <details>
            <summary>Markdown at a glance</summary>
            <pre>
              {
                "## A heading\n\n- A useful detail\n- Another connection\n\n**A key idea** and `inline code`\n\n```js\nconst idea = 'connected';\n```"
              }
            </pre>
            <p>
              Preview reuses the lesson reader. HTML is skipped; external images
              require a separate Load image action.
            </p>
          </details>
          <p className={styles.privacy}>
            <LockKeyhole size={17} aria-hidden="true" />
            Only you and admins can access new pending lessons. They need
            approval and a published placement before learners can read them.
          </p>
          <p className={styles.hint}>
            Your text is kept while this page stays open. Leaving or switching
            views can discard unsaved writing.
          </p>
        </aside>
      </div>
    </div>
  );
}
