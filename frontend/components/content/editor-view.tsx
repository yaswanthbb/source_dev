"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Layers3,
  Plus,
  Search,
  Send,
  Unlink,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { contentDate } from "./content-data";
import {
  EDITOR_REVIEW,
  submissionIssues,
  moduleTitleError,
  type EditorData,
  type EditorLesson,
} from "./editor-data";
import type { EditorAction, EditorOutcome } from "./editor-client";
import styles from "./editor.module.css";

export interface EditorViewProps {
  data?: EditorData;
  loading?: boolean;
  refreshing?: boolean;
  readError?: string;
  pending?: boolean;
  error?: string;
  uncertain?: boolean;
  recovered?: boolean;
  outcome?: EditorOutcome;
  canWrite?: boolean;
  searchResults?: EditorLesson[];
  searchPending?: boolean;
  searchError?: string;
  onSearch: (term: string) => void;
  onAction: (action: EditorAction) => void;
  onRefresh: () => void;
  onClassic?: () => void;
}
export function RoadmapEditorView({
  data,
  loading = false,
  refreshing = false,
  readError,
  pending = false,
  error,
  uncertain = false,
  recovered = false,
  outcome,
  canWrite = true,
  searchResults,
  searchPending = false,
  searchError,
  onSearch,
  onAction,
  onRefresh,
  onClassic,
}: EditorViewProps) {
  const [title, setTitle] = useState(""),
    [titleError, setTitleError] = useState<string>(),
    [attempt, setAttempt] = useState(0);
  const [attachModule, setAttachModule] = useState<string | null>(null),
    [term, setTerm] = useState(""),
    [searchedTerm, setSearchedTerm] = useState("");
  const [confirm, setConfirm] = useState<{
    action: EditorAction;
    title: string;
    description: string;
  } | null>(null);
  const titleInput = useRef<HTMLInputElement>(null),
    summary = useRef<HTMLDivElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    confirmation = useRef<HTMLDivElement>(null),
    searchInput = useRef<HTMLInputElement>(null),
    returnFocus = useRef<HTMLButtonElement | null>(null),
    handledOutcome = useRef<EditorOutcome | undefined>(undefined),
    checkedData = useRef(data);
  const disabled = !data || !canWrite || loading || refreshing || pending;
  useEffect(() => {
    if (attempt) summary.current?.focus();
  }, [attempt]);
  useEffect(() => {
    if (checkedData.current === data) return;
    checkedData.current = data;
    if (confirm) {
      setConfirm(null);
      returnFocus.current?.focus();
    }
  }, [data, confirm]);
  useEffect(() => {
    if (error || outcome) feedback.current?.focus();
  }, [error, outcome]);
  useEffect(() => {
    if (confirm) confirmation.current?.focus();
  }, [confirm]);
  useEffect(() => {
    if (attachModule) searchInput.current?.focus();
  }, [attachModule]);
  useEffect(() => {
    if (!outcome || handledOutcome.current === outcome) return;
    handledOutcome.current = outcome;
    setConfirm(null);
    if (outcome.action.kind === "module") {
      setTitle("");
      setTitleError(undefined);
    }
    if (outcome.action.kind === "attach") {
      setAttachModule(null);
      setTerm("");
      setSearchedTerm("");
      onSearch("");
    }
  }, [outcome, onSearch]);
  const issues = data ? submissionIssues(data) : [],
    r = data?.roadmap;
  function cancelConfirm() {
    setConfirm(null);
    returnFocus.current?.focus();
  }
  function ask(
    event: React.MouseEvent<HTMLButtonElement>,
    action: EditorAction,
    title: string,
    description: string,
  ) {
    returnFocus.current = event.currentTarget;
    setConfirm({ action, title, description });
  }
  const activeModule = data?.modules.find((m) => m.id === attachModule);
  const matchingResults =
    searchedTerm === term.trim() ? searchResults : undefined;
  const candidates = matchingResults?.filter(
    (c) => !activeModule?.lessons.some((l) => l.id === c.id),
  );
  return (
    <div className={styles.page}>
      <nav aria-label="Authoring breadcrumb" className={styles.breadcrumb}>
        <Link href="/developer/content">
          <ArrowLeft size={16} aria-hidden="true" />
          My content
        </Link>
        <span>Roadmap editor</span>
      </nav>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Connect the learning path</p>
          <h1>{r?.title ?? "Your roadmap editor"}</h1>
          <p>
            {r?.description ||
              "Arrange modules and connect your lessons. Each part gives the next idea somewhere to land."}
          </p>
          <div className={styles.actions}>
            <button
              className={styles.primary}
              type="button"
              disabled={!data}
              onClick={() => titleInput.current?.focus()}
            >
              <Plus size={17} aria-hidden="true" />
              Add a module
            </button>
            {onClassic && (
              <button
                className={styles.secondary}
                type="button"
                onClick={onClassic}
              >
                Classic editor
              </button>
            )}
            {data && (
              <Link
                className={styles.secondary}
                href={`/developer/generate?roadmapId=${encodeURIComponent(data.roadmap.id)}`}
              >
                AI generation & jobs
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <svg viewBox="0 0 220 170" className={styles.motif} aria-hidden="true">
          <path
            className={styles.draw}
            d="M35 35h145v48H35v48h145"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="18" y="19" width="34" height="34" rx="8" />
          <rect x="163" y="66" width="34" height="34" rx="8" />
          <rect x="18" y="114" width="34" height="34" rx="8" />
          <path
            d="M77 27h56m-56 9h38m-56 43h64m-64 9h39m18 39h56m-56 9h38"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </header>
      <div className={styles.checkbar}>
        <span>
          {data
            ? `Last checked ${contentDate(data.loadedAt)}. Refresh for review and scheduled changes.`
            : "Checking your account, roadmap and review state."}
        </span>
        <button
          type="button"
          className={styles.secondary}
          disabled={refreshing || pending}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh roadmap"}
        </button>
      </div>
      {loading && (
        <GuiFeedback kind="loading" title="Loading your roadmap">
          <p>Checking ownership, modules and lesson review metadata.</p>
        </GuiFeedback>
      )}
      {readError && (
        <GuiFeedback
          kind="error"
          title={
            data
              ? "Showing the previously checked roadmap"
              : "Roadmap couldn’t load"
          }
        >
          <p>{readError}</p>
          <p>Changes are paused until a successful refresh.</p>
        </GuiFeedback>
      )}
      {pending && (
        <GuiFeedback kind="loading" title="Checking and saving your change">
          <p>
            Changes stay paused while the request and saved state are checked.
            Leaving cannot undo a request already sent.
          </p>
        </GuiFeedback>
      )}
      {error ? (
        <GuiFeedback
          ref={feedback}
          kind="error"
          title={
            uncertain
              ? "The change isn’t confirmed"
              : "The change couldn’t be completed"
          }
        >
          <p>{error}</p>
          <button
            className={styles.secondary}
            type="button"
            disabled={pending || refreshing}
            onClick={onRefresh}
          >
            Check saved roadmap
          </button>
        </GuiFeedback>
      ) : (
        outcome && (
          <GuiFeedback ref={feedback} kind="success" title={outcome.message}>
            <p>Confirmed against the saved roadmap.</p>
          </GuiFeedback>
        )
      )}
      {recovered && (
        <GuiFeedback kind="info" title="Fresh roadmap checked">
          <p>
            Review the result before another change. An earlier request may
            still finish; repeating it can create a duplicate. A fresh read
            cannot cancel that request.
          </p>
        </GuiFeedback>
      )}
      {confirm && (
        <div
          className={styles.confirm}
          ref={confirmation}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !pending) cancelConfirm();
          }}
        >
          <h2>{confirm.title}</h2>
          <p>{confirm.description}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              disabled={pending}
              onClick={cancelConfirm}
            >
              Keep as is
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={disabled}
              onClick={() => onAction(confirm.action)}
            >
              {pending ? "Saving…" : "Confirm change"}
            </button>
          </div>
        </div>
      )}
      {data && (
        <div className={styles.workspace}>
          <section className={styles.outline} aria-labelledby="outline-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>The structure</p>
                <h2 id="outline-heading">Modules & lessons</h2>
              </div>
              <span>
                {data.modules.length} modules ·{" "}
                {data.modules.reduce((n, m) => n + m.lessons.length, 0)} lesson
                placements
              </span>
            </div>
            {!data.modules.length && (
              <div className={styles.empty}>
                <Layers3 size={32} aria-hidden="true" />
                <h3>Give your roadmap its first chapter.</h3>
                <p>
                  Add a module, then attach lessons you own. No AI runs when you
                  add or connect content here.
                </p>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={() => titleInput.current?.focus()}
                >
                  Add your first module
                </button>
              </div>
            )}
            <div className={styles.modules}>
              {data.modules.map((m, index) => (
                <article className={styles.module} key={m.id}>
                  <div className={styles.moduleHead}>
                    <span className={styles.number} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{m.title}</h3>
                      <p>
                        {m.lessons.length}{" "}
                        {m.lessons.length === 1 ? "lesson" : "lessons"}
                      </p>
                    </div>
                    <button
                      className={styles.secondary}
                      type="button"
                      disabled={disabled}
                      aria-expanded={attachModule === m.id}
                      aria-controls={`attach-${m.id}`}
                      onClick={(e) => {
                        returnFocus.current = e.currentTarget;
                        setAttachModule(attachModule === m.id ? null : m.id);
                        setTerm("");
                        setSearchedTerm("");
                        onSearch("");
                      }}
                    >
                      <Plus size={16} aria-hidden="true" />
                      {attachModule === m.id ? "Close search" : "Attach lesson"}
                    </button>
                  </div>
                  {!m.lessons.length && (
                    <p className={styles.moduleEmpty}>
                      No lessons attached yet. Connect an existing lesson below.
                    </p>
                  )}
                  <ol className={styles.lessons}>
                    {m.lessons.map((c) => (
                      <li key={c.placementId}>
                        <BookOpen size={17} aria-hidden="true" />
                        <div className={styles.lessonInfo}>
                          <Link
                            href={`/developer/concepts/${encodeURIComponent(c.id)}/edit`}
                          >
                            {c.title}
                            <ArrowUpRight size={14} aria-hidden="true" />
                          </Link>
                          <div className={styles.tags}>
                            <span>{EDITOR_REVIEW[c.reviewStatus]}</span>
                            {c.hasPendingDraft && <span>Pending draft</span>}
                            {c.originLabel && (
                              <span>
                                {c.originLabel === "ai"
                                  ? "AI generated"
                                  : "Handwritten"}
                              </span>
                            )}
                          </div>
                          {c.rejectionReason && (
                            <details>
                              <summary>Review feedback</summary>
                              <p>{c.rejectionReason}</p>
                            </details>
                          )}
                        </div>
                        {r?.status !== "published" && (
                          <button
                            className={styles.detach}
                            type="button"
                            disabled={disabled}
                            aria-label={`Detach ${c.title} from ${m.title}`}
                            onClick={(e) =>
                              ask(
                                e,
                                {
                                  kind: "detach",
                                  moduleId: m.id,
                                  conceptId: c.id,
                                },
                                "Detach this lesson?",
                                `Remove “${c.title}” from “${m.title}”? The lesson itself and its other placements are kept.`,
                              )
                            }
                          >
                            <Unlink size={15} aria-hidden="true" />
                            Detach
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                  <Link
                    className={styles.textLink}
                    href={`/developer/generate?roadmapId=${encodeURIComponent(data.roadmap.id)}&moduleId=${encodeURIComponent(m.id)}`}
                  >
                    Generate lessons or questions for this module
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                  {attachModule === m.id && (
                    <div id={`attach-${m.id}`} className={styles.attach}>
                      <h4>Connect one of your lessons</h4>
                      <p>
                        Search by title. Lessons already in this module are
                        excluded.
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!disabled && term.trim().length >= 2) {
                            setSearchedTerm(term.trim());
                            onSearch(term.trim());
                          }
                        }}
                      >
                        <label htmlFor={`search-${m.id}`}>
                          Search your lessons
                        </label>
                        <div className={styles.inputRow}>
                          <input
                            ref={searchInput}
                            type="search"
                            id={`search-${m.id}`}
                            value={term}
                            maxLength={120}
                            disabled={pending}
                            onChange={(e) => {
                              setTerm(e.target.value);
                              setSearchedTerm("");
                              onSearch("");
                            }}
                            placeholder="At least 2 characters"
                          />
                          <button
                            type="submit"
                            className={styles.secondary}
                            disabled={
                              disabled ||
                              searchPending ||
                              term.trim().length < 2
                            }
                          >
                            <Search size={16} aria-hidden="true" />
                            Search
                          </button>
                        </div>
                      </form>
                      {searchPending && searchedTerm && (
                        <GuiFeedback
                          kind="loading"
                          title="Searching your lessons"
                        />
                      )}
                      {searchError && searchedTerm && (
                        <GuiFeedback
                          kind="error"
                          title="Lesson search couldn’t load"
                        >
                          <p>{searchError}</p>
                          <p>Your search is kept. Search again to retry.</p>
                        </GuiFeedback>
                      )}
                      {candidates && (
                        <>
                          <p role="status">
                            {candidates.length
                              ? `${candidates.length} matching lessons available to attach.`
                              : "No matching unattached lessons of yours. Try another title."}
                          </p>
                          <ul className={styles.results}>
                            {candidates.map((c) => (
                              <li key={c.id}>
                                <div>
                                  <strong>{c.title}</strong>
                                  <span>
                                    {EDITOR_REVIEW[c.reviewStatus]}
                                    {c.hasPendingDraft
                                      ? " · Pending draft"
                                      : ""}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className={styles.secondary}
                                  disabled={
                                    disabled || searchPending || !!searchError
                                  }
                                  onClick={() =>
                                    onAction({
                                      kind: "attach",
                                      moduleId: m.id,
                                      lesson: c,
                                    })
                                  }
                                  aria-label={`Attach ${c.title} to ${m.title}`}
                                >
                                  Attach
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <Link
                        className={styles.textLink}
                        href={`/developer/concepts/new?moduleId=${encodeURIComponent(m.id)}&roadmapId=${encodeURIComponent(data.roadmap.id)}`}
                      >
                        Write a new lesson for this module
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <section
              className={styles.newModule}
              aria-labelledby="new-module-heading"
            >
              <p className={styles.eyebrow}>Keep building</p>
              <h2 id="new-module-heading">Add a module</h2>
              <p>
                Give the next part a clear name. It will follow the current
                modules.
              </p>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  const issue = moduleTitleError(title);
                  setTitleError(issue);
                  if (issue) {
                    setAttempt((n) => n + 1);
                    return;
                  }
                  onAction({ kind: "module", title });
                }}
              >
                {titleError && (
                  <GuiFeedback
                    ref={summary}
                    kind="error"
                    title="Check your module title"
                  >
                    <a href="#module-title">{titleError}</a>
                  </GuiFeedback>
                )}
                <label htmlFor="module-title">Module title (required)</label>
                <div className={styles.inputRow}>
                  <input
                    ref={titleInput}
                    id="module-title"
                    value={title}
                    required
                    maxLength={120}
                    disabled={pending}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleError(undefined);
                    }}
                    aria-invalid={!!titleError}
                    aria-describedby={
                      titleError ? "module-title-error" : "module-title-help"
                    }
                    placeholder="e.g. Working with branches"
                  />
                  <button
                    className={styles.primary}
                    type="submit"
                    disabled={disabled}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add module
                  </button>
                </div>
                <p className={styles.hint} id="module-title-help">
                  Up to 120 characters. Adding a module does not generate
                  lessons.
                </p>
                {titleError && (
                  <p id="module-title-error" className={styles.fieldError}>
                    {titleError}
                  </p>
                )}
              </form>
            </section>
          </section>
          <aside className={styles.review} aria-labelledby="review-heading">
            <p className={styles.eyebrow}>From draft to shared</p>
            <h2 id="review-heading">Review & publication</h2>
            <span className={styles.badge}>
              {r?.status === "draft"
                ? "Draft · private"
                : r?.status === "submitted"
                  ? "In review · private"
                  : "Published"}
            </span>
            <p>
              {r?.status === "published"
                ? "This roadmap is published. You can add modules and attach your lessons; detach is available after unpublishing."
                : "Your roadmap stays private to you and admins until it is reviewed and published."}
            </p>
            <div className={styles.reviewCounts}>
              <div>
                <strong>{data.review.pendingCount}</strong>
                <span>Pending review</span>
              </div>
              <div>
                <strong>{data.review.rejectedCount}</strong>
                <span>Changes requested</span>
              </div>
            </div>
            {r?.rejectionReason && (
              <GuiFeedback kind="info" title="Latest roadmap feedback">
                <p>{r.rejectionReason}</p>
              </GuiFeedback>
            )}
            {r?.deleteEffectiveAt && (
              <GuiFeedback kind="info" title="Deletion scheduled">
                <p>
                  Scheduled for {contentDate(r.deleteEffectiveAt)}. Refresh to
                  check effective state.
                </p>
              </GuiFeedback>
            )}
            {r?.status === "draft" && (
              <>
                <h3>Before you submit</h3>
                <p>
                  At least 3 modules, each with 3 lessons. Rejected lessons are
                  sent back for review on resubmission.
                </p>
                {issues.length ? (
                  <ul className={styles.issues}>
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.ready}>
                    The loaded structure meets submission minimums. The server
                    checks again when you submit.
                  </p>
                )}
                <button
                  className={styles.primary}
                  type="button"
                  disabled={disabled || !!issues.length}
                  onClick={(e) =>
                    ask(
                      e,
                      { kind: "submit" },
                      "Submit this roadmap?",
                      "Send the whole roadmap for admin review. This does not publish it. Rejected lessons will be queued for review again.",
                    )
                  }
                >
                  <Send size={16} aria-hidden="true" />
                  Submit for review
                </button>
              </>
            )}
            {r?.status === "submitted" && (
              <GuiFeedback
                kind="info"
                title={
                  data.review.canPublish
                    ? "Ready for admin publication"
                    : "Review is in progress"
                }
              >
                <p>
                  {data.review.canPublish
                    ? "The saved review state allows an admin to publish. Your roadmap remains private until they do."
                    : "An admin reviews the attached lessons before publishing. Refresh to check for changes."}
                </p>
              </GuiFeedback>
            )}
            {r?.status === "published" && (
              <>
                {r.unpublishStatus === "requested" ? (
                  <GuiFeedback kind="info" title="Takedown requested">
                    <p>Still published while an admin reviews your request.</p>
                  </GuiFeedback>
                ) : r.unpublishStatus === "approved" &&
                  r.unpublishEffectiveAt ? (
                  <GuiFeedback kind="info" title="Unpublish scheduled">
                    <p>
                      Remains published until{" "}
                      {contentDate(r.unpublishEffectiveAt)}. Refresh after that
                      date to check effective state.
                    </p>
                  </GuiFeedback>
                ) : null}
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={disabled}
                  onClick={(e) => {
                    const withdraw =
                      r.unpublishStatus === "requested" ||
                      r.unpublishStatus === "approved";
                    ask(
                      e,
                      {
                        kind: withdraw
                          ? "cancel-unpublish"
                          : "request-unpublish",
                      },
                      withdraw ? "Withdraw takedown?" : "Request takedown?",
                      withdraw
                        ? "Withdraw the request or scheduled unpublish. The roadmap remains published."
                        : "Ask an admin to unpublish this roadmap. Approval starts the existing 30-day countdown; it stays published until then.",
                    );
                  }}
                >
                  {r.unpublishStatus === "requested" ||
                  r.unpublishStatus === "approved"
                    ? "Withdraw takedown"
                    : "Request takedown"}
                </button>
              </>
            )}
            <p className={styles.hint}>
              Lesson editing opens in the GUI. Learning progress and your
              learner location are unaffected by authoring.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
