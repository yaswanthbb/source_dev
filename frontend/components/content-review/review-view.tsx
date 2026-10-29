"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  ArrowUpRight,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  actionTitle,
  canRoadmapAction,
  deletionDue,
  unpublishDue,
  effectiveRoadmapStatus,
  purgeCandidates,
  filterReviewLessons,
  filterReviewRoadmaps,
  requiresReviewReason,
  validReviewReason,
  reviewDisplayDate,
  type ReviewLibrary,
  type ReviewLesson,
  type ReviewAction,
  type Roadmap,
  type RoadmapDetail,
  type RoadmapKind,
  type ReviewRecovery,
} from "./review-data";
import styles from "./review.module.css";
export interface ContentReviewProps {
  library?: ReviewLibrary;
  loading?: boolean;
  busy?: boolean;
  pending?: boolean;
  blocked?: boolean;
  detail?: RoadmapDetail;
  opening?: string;
  error?: string;
  notice?: string;
  decisionVersion?: number;
  locked?: boolean;
  late?: boolean;
  recovery?: ReviewRecovery;
  onOpen: (id: string) => void;
  onAction: (a: ReviewAction) => void;
  onCheck: () => void;
  onAdopt: () => void;
}
const pageSize = 6;
const actionKey = (a: ReviewAction) =>
  a.scope === "purge"
    ? "purge"
    : a.scope === "lesson"
      ? `lesson:${a.lesson.id}`
      : `roadmap:${a.target.roadmap.id}`;
function BodyReview({
  content,
  title,
  prefix,
}: {
  content: string;
  title: string;
  prefix: string;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <section className={styles.body} aria-label={title}>
      <div className={styles.bodyHead}>
        <h4>{title}</h4>
        <div>
          <button
            type="button"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            Source
          </button>
          <button
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
      </div>
      {preview ? (
        <div
          className={styles.markdown}
          tabIndex={0}
          aria-label={`${title} preview`}
        >
          <LessonMarkdown content={content} idPrefix={prefix} />
        </div>
      ) : (
        <pre tabIndex={0} aria-label={`${title} source`}>
          {content || "(Empty text)"}
        </pre>
      )}
    </section>
  );
}
function LessonCard({
  lesson: l,
  blocked,
  onChoose,
}: {
  lesson: ReviewLesson;
  blocked: boolean;
  onChoose: (a: ReviewAction) => void;
}) {
  return (
    <li className={styles.lesson}>
      <details>
        <summary>
          <span>
            <strong>{l.title || "Untitled lesson"}</strong>
            <small>
              {l.author?.name || "Author not reported"} · {l.difficulty} ·
              Created {reviewDisplayDate(l.createdAt)}
            </small>
          </span>
          <span className={styles.badges}>
            <span>{l.isAiGenerated ? "AI-generated" : "Handwritten"}</span>
            <span>
              {l.draftContent !== null ? "Staged text" : "New lesson"}
            </span>
          </span>
        </summary>
        <div className={styles.lessonContent}>
          <p className={styles.caption}>
            Review decisions apply to this shared lesson across all placements.
            Creation time is reported; submission time is not.
          </p>
          <ul className={styles.placements} aria-label="Lesson placements">
            {l.placements.map((p) => (
              <li key={p.moduleId}>
                {p.roadmapTitle} / {p.moduleTitle}
              </li>
            ))}
          </ul>
          {l.rejectionReason && (
            <div className={styles.reason}>
              <strong>Previous feedback</strong>
              <p>{l.rejectionReason}</p>
            </div>
          )}
          <BodyReview
            content={l.content}
            title={
              l.reviewStatus === "approved"
                ? "Current approved body"
                : "Current saved body"
            }
            prefix={`review-${l.id}-current`}
          />
          {l.draftContent !== null && (
            <BodyReview
              content={l.draftContent}
              title="Staged text — approval replaces the current body"
              prefix={`review-${l.id}-staged`}
            />
          )}
          <details className={styles.questions}>
            <summary>
              Reviewer answer key · {l.questions.length} saved questions
            </summary>
            <p className={styles.caption}>
              Admin review only. These are the currently saved questions.
              Approving staged text does not replace the question set or submit
              quiz attempts.
            </p>
            {!l.questions.length ? (
              <p>No saved questions are reported.</p>
            ) : (
              <ol>
                {l.questions.map((q) => (
                  <li key={q.id}>
                    <h4>{q.questionText}</h4>
                    {!q.options.length ? (
                      <p>No options are reported.</p>
                    ) : (
                      <ul>
                        {q.options.map((o) => (
                          <li key={o.id}>
                            <span>{o.optionText}</span>
                            {o.isCorrect && <strong>Marked correct</strong>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.options.filter((o) => o.isCorrect).length !== 1 && (
                      <p className={styles.caution}>
                        This saved question has{" "}
                        {q.options.filter((o) => o.isCorrect).length} options
                        marked correct. Review its answer key.
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </details>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              disabled={blocked}
              onClick={() =>
                onChoose({ scope: "lesson", kind: "reject", lesson: l })
              }
            >
              {l.draftContent !== null ? "Reject staged text" : "Reject lesson"}
            </button>
            <button
              className={styles.primary}
              type="button"
              disabled={blocked}
              onClick={() =>
                onChoose({ scope: "lesson", kind: "approve", lesson: l })
              }
            >
              <ClipboardCheck size={16} aria-hidden="true" />
              {l.draftContent !== null
                ? "Approve staged text"
                : "Approve lesson"}
            </button>
          </div>
        </div>
      </details>
    </li>
  );
}
function RoadmapDates({ roadmap: r, at }: { roadmap: Roadmap; at: number }) {
  return (
    <div className={styles.dateNotes}>
      <span>
        {deletionDue(r, at)
          ? "Hidden from non-admins: deletion date reached"
          : unpublishDue(r, at)
            ? "Takedown date reached: effectively private"
            : effectiveRoadmapStatus(r, at) === "published"
              ? "Recorded as published"
              : "Private / awaiting publication"}
      </span>
      {r.unpublishStatus === "requested" && (
        <span>Author takedown request pending</span>
      )}
      {r.unpublishEffectiveAt && (
        <span>Takedown {reviewDisplayDate(r.unpublishEffectiveAt)}</span>
      )}
      {r.deleteEffectiveAt && (
        <span>
          {deletionDue(r, at) ? "Overdue deletion" : "Deletion scheduled"}:{" "}
          {reviewDisplayDate(r.deleteEffectiveAt)}
        </span>
      )}
    </div>
  );
}
function RoadmapReview({
  d,
  blocked,
  onChoose,
}: {
  d: RoadmapDetail;
  blocked: boolean;
  onChoose: (a: ReviewAction) => void;
}) {
  const kinds: RoadmapKind[] = [
    "publish",
    "reject",
    "unpublish",
    "approve-unpublish",
    "deny-unpublish",
    "schedule-delete",
    "cancel-scheduled-delete",
  ];
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeading}>
        <h4>Checked review: {d.roadmap.title}</h4>
        <p>Checked {reviewDisplayDate(d.checkedAt)}</p>
      </div>
      <RoadmapDates roadmap={d.roadmap} at={Date.parse(d.checkedAt)} />
      {d.roadmap.rejectionReason && (
        <div className={styles.reason}>
          <strong>Roadmap feedback</strong>
          <p>{d.roadmap.rejectionReason}</p>
        </div>
      )}
      <div className={styles.readiness}>
        <strong>
          {d.report.canPublish
            ? "Ready for publication review"
            : "Publication is not available"}
        </strong>
        <span>
          {d.report.moduleCount} modules · {d.report.conceptCount} lesson
          placements · {d.report.pendingCount} pending ·{" "}
          {d.report.rejectedCount} rejected
        </span>
      </div>
      <p className={styles.caption}>
        Readiness follows the saved review states. Module approval is a display
        rollup; staged text is shown separately. Publishing does not clear
        takedown or deletion schedules.
      </p>
      {!d.report.modules.length ? (
        <p className={styles.caption}>
          No modules are reported. Structure checks belong to submission; this
          view follows the current publication contract.
        </p>
      ) : (
        <ul className={styles.modules}>
          {d.report.modules.map((m) => (
            <li key={m.moduleId}>
              <details>
                <summary>
                  <span>{m.title}</span>
                  <small>
                    {m.approved ? "Lessons approved" : "Review needed"}
                    {m.originLabel ? ` · ${m.originLabel}` : ""}
                  </small>
                </summary>
                <ul>
                  {m.concepts.map((c) => (
                    <li key={c.id}>
                      <strong>{c.title}</strong>
                      <span>
                        {c.reviewStatus}
                        {c.hasPendingDraft ? " · Staged text" : ""}
                        {c.originLabel ? ` · ${c.originLabel}` : ""}
                      </span>
                      {c.rejectionReason && <p>{c.rejectionReason}</p>}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        {kinds
          .filter((k) => canRoadmapAction(d, k, Date.parse(d.checkedAt)))
          .map((kind) => (
            <button
              type="button"
              key={kind}
              className={
                kind === "publish"
                  ? styles.primary
                  : kind === "schedule-delete" || kind === "unpublish"
                    ? styles.danger
                    : styles.button
              }
              disabled={blocked}
              onClick={() => onChoose({ scope: "roadmap", kind, target: d })}
            >
              {actionTitle({ scope: "roadmap", kind, target: d })}
            </button>
          ))}
      </div>
    </div>
  );
}
function ActionConsequences({ a }: { a: ReviewAction }) {
  if (a.scope === "purge")
    return (
      <>
        <p>
          This permanently removes every roadmap whose scheduled deletion date
          is due when the server processes the request, including roadmaps
          outside your filters and any that become due in the meantime. It
          cannot be undone here.
        </p>
        <p>
          Roadmap modules and placements are removed. Shared lesson records are
          not deleted by this endpoint. The operation may partially finish if a
          later deletion fails.
        </p>
        <p>Overdue at the last check: {a.roadmaps.length}</p>
        <ul
          className={styles.purgeList}
          tabIndex={0}
          aria-label="Reviewed overdue roadmaps"
        >
          {a.roadmaps.map((r) => (
            <li key={r.id}>
              <strong>{r.title}</strong>
              <span>{reviewDisplayDate(r.deleteEffectiveAt!)}</span>
            </li>
          ))}
        </ul>
      </>
    );
  if (a.scope === "lesson")
    return (
      <>
        <p>
          {a.kind === "approve"
            ? a.lesson.draftContent !== null
              ? "This replaces the current body with the staged text, including an empty staged body, and marks the lesson approved. Approved content can be visible through published placements."
              : "This marks the saved lesson approved. It can become visible through published placements. Roadmap publication remains a separate action."
            : a.lesson.draftContent !== null
              ? "This discards the staged text and keeps the current body and its existing review status. Your feedback is saved for the author."
              : "This marks the lesson rejected and saves your feedback for the author. The roadmap will need that review state resolved before publication."}
        </p>
        <p>
          This is a shared lesson: the decision applies across its placements.
          The saved question set is not replaced.
        </p>
      </>
    );
  const r = a.target.roadmap;
  const copy: Record<RoadmapKind, string> = {
    publish:
      "This publishes the submitted roadmap. Existing takedown and deletion schedules remain in force and may still limit public access.",
    reject:
      "This returns the submitted roadmap to draft with your feedback. Individual lesson review marks remain unchanged.",
    unpublish:
      "This returns the published roadmap to draft now. Individual lesson approvals remain; shared lessons may still be visible through other published roadmaps.",
    "approve-unpublish":
      "This approves the author’s takedown request and sets a date about 30 days ahead. It does not take the roadmap down immediately. Other review and deletion states still affect visibility.",
    "deny-unpublish":
      "This closes the takedown request or cancels its active countdown. It does not publish a draft or clear a deletion schedule.",
    "schedule-delete":
      "This schedules moderation deletion about 30 days ahead. It does not publish private content. At the date, non-admin access is hidden; permanent row removal requires the separate purge action.",
    "cancel-scheduled-delete":
      "This clears the deletion schedule. If the date has passed and the roadmap is otherwise published, public access may return. Other takedown and review states still apply.",
  };
  return (
    <>
      <p>{copy[a.kind]}</p>
      {r.deleteEffectiveAt && (
        <p>Existing deletion date: {reviewDisplayDate(r.deleteEffectiveAt)}.</p>
      )}
      {r.unpublishEffectiveAt && (
        <p>
          Existing takedown date: {reviewDisplayDate(r.unpublishEffectiveAt)}.
        </p>
      )}
    </>
  );
}
export function ContentReviewView(p: ContentReviewProps) {
  const { setMode } = useUiMode();
  const [section, setSection] = useState("lessons"),
    [search, setSearch] = useState(""),
    [origin, setOrigin] = useState("all"),
    [lessonKind, setLessonKind] = useState("all"),
    [roadmapFilter, setRoadmapFilter] = useState("submitted"),
    [page, setPage] = useState(0),
    [choice, setChoice] = useState<ReviewAction>(),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [validation, setValidation] = useState(false),
    [purgeAcknowledged, setPurgeAcknowledged] = useState(false);
  const feedback = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    keep = useRef<HTMLButtonElement>(null),
    dialogFeedback = useRef<HTMLDivElement>(null),
    reasonField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (p.notice || p.error || p.recovery || p.pending) {
      if (choice && (p.error || p.pending)) dialogFeedback.current?.focus();
      else feedback.current?.focus();
    }
  }, [p.notice, p.error, p.recovery, p.pending, choice]);
  useEffect(() => {
    if (p.decisionVersion) {
      setChoice(undefined);
      setValidation(false);
    }
  }, [p.decisionVersion]);
  const choiceOpen = choice !== undefined;
  useEffect(() => {
    if (!choiceOpen || !dialog.current) return;
    const d = dialog.current,
      previous = document.activeElement as HTMLElement | null,
      fallback = feedback.current;
    d.showModal();
    keep.current?.focus();
    return () => {
      d.close();
      if (previous?.isConnected) previous.focus();
      else fallback?.focus();
    };
  }, [choiceOpen]);
  const library = p.library,
    at = library ? Date.parse(library.checkedAt) : 0,
    lessons = filterReviewLessons(
      library?.lessons ?? [],
      search,
      origin,
      lessonKind,
    ),
    roadmaps = filterReviewRoadmaps(
      library?.roadmaps ?? [],
      search,
      roadmapFilter,
      at,
    ),
    due = purgeCandidates(library?.roadmaps ?? [], at),
    rows = section === "lessons" ? lessons : roadmaps,
    pages = Math.max(1, Math.ceil(rows.length / pageSize)),
    current = Math.min(page, pages - 1),
    start = current * pageSize;
  const reason =
    choice && choice.scope !== "purge"
      ? (drafts[actionKey(choice)] ?? choice.reason ?? "")
      : "";
  function choose(a: ReviewAction) {
    if (p.blocked || p.busy || p.locked) return;
    setChoice(a);
    setValidation(false);
    setPurgeAcknowledged(false);
  }
  function close() {
    if (p.pending) return;
    setChoice(undefined);
    setValidation(false);
  }
  function submit() {
    if (!choice || p.blocked || p.busy || p.locked) return;
    if (requiresReviewReason(choice) && !validReviewReason(reason)) {
      setValidation(true);
      reasonField.current?.focus();
      return;
    }
    if (choice.scope === "purge" && !purgeAcknowledged) return;
    p.onAction(
      choice.scope === "purge" ? choice : { ...choice, reason: reason.trim() },
    );
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>CONTENT, WITH CARE</p>
          <h1>
            Good work deserves
            <br />
            <span>a thoughtful review.</span>
          </h1>
          <p>Read the lesson. Check the context. Make the next step clear.</p>
        </div>
        <svg
          className={styles.art}
          viewBox="0 0 170 160"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="86" cy="79" r="68" fill="currentColor" opacity=".08" />
          <rect
            x="41"
            y="20"
            width="84"
            height="118"
            rx="12"
            fill="var(--gui-surface)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M60 48h44M60 64h32M60 80h40M60 96h24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".6"
          />
          <circle cx="124" cy="113" r="23" fill="var(--gui-accent)" />
          <path
            d="m114 113 7 7 14-16"
            stroke="var(--gui-on-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </header>
      <div className={styles.topline}>
        <p>
          {library ? (
            <>
              Last checked{" "}
              <time dateTime={library.checkedAt}>
                {reviewDisplayDate(library.checkedAt)}
              </time>
            </>
          ) : (
            "Waiting for checked moderation data."
          )}
        </p>
        <div>
          <Link
            href="/admin/terminal?view=review"
            className={styles.button}
            onClick={() => setMode("cli", { navigate: false })}
          >
            Review in CLI
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            className={styles.button}
            type="button"
            disabled={p.busy || p.loading}
            onClick={p.onCheck}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {p.busy ? "Checking…" : "Refresh review"}
          </button>
        </div>
      </div>
      <div className={styles.totals} aria-label="Checked review totals">
        <div>
          <BookOpen size={19} aria-hidden="true" />
          <span>Lessons queued</span>
          <strong>{library?.lessons.length ?? "—"}</strong>
        </div>
        <div>
          <ClipboardCheck size={19} aria-hidden="true" />
          <span>Submitted roadmaps</span>
          <strong>
            {library?.roadmaps.filter((r) => r.reviewStatus === "submitted")
              .length ?? "—"}
          </strong>
        </div>
        <div>
          <Trash2 size={19} aria-hidden="true" />
          <span>Overdue deletions</span>
          <strong>{library ? due.length : "—"}</strong>
        </div>
      </div>
      <div className={styles.feedback} ref={feedback} tabIndex={-1}>
        {p.error && (
          <GuiFeedback kind="error" title="Review needs attention">
            <p>{p.error}</p>
          </GuiFeedback>
        )}
        {p.notice && (
          <GuiFeedback kind="success" title="Checked update">
            <p>{p.notice}</p>
          </GuiFeedback>
        )}
        {p.locked && (
          <GuiFeedback kind="info" title="Moderation actions are paused">
            <p>
              Check current state reads saved content and never repeats a
              moderation decision. Review the result before resuming.
            </p>
            <button
              className={styles.button}
              disabled={p.busy || p.loading}
              type="button"
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
              Checked {reviewDisplayDate(p.recovery.library.checkedAt)}. An
              earlier request may still finish.
            </p>
            <button
              className={styles.button}
              type="button"
              disabled={p.busy}
              onClick={p.onAdopt}
            >
              Use checked queue & resume
            </button>
          </GuiFeedback>
        )}
        {p.late && (
          <p className={styles.caution}>
            An earlier request may still finish. Recheck current content before
            another decision. The pause is local to this page and can reset when
            you leave.
          </p>
        )}
      </div>
      <nav className={styles.switcher} aria-label="Moderation views">
        {[
          ["lessons", "Lessons"],
          ["roadmaps", "Roadmaps"],
          ["maintenance", "Maintenance"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={section === value}
            onClick={() => {
              setSection(value);
              setPage(0);
              setSearch("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className={styles.panel} aria-labelledby="review-list-title">
        <div className={styles.panelHead}>
          <h2 id="review-list-title">
            {section === "lessons"
              ? "A closer look at each lesson"
              : section === "roadmaps"
                ? "From review to publication"
                : "Scheduled removal, clearly scoped"}
          </h2>
          <p>
            {section === "lessons"
              ? "New lessons and staged text in submitted or published roadmaps. Ordered by lesson creation date."
              : section === "roadmaps"
                ? "Open a roadmap for a fresh module review and the actions available in its saved state."
                : "Effective dates are evaluated when content is accessed. Permanent removal happens only through an explicit purge."}
          </p>
        </div>
        {section !== "maintenance" && (
          <div className={styles.filters}>
            <label className={styles.search}>
              <span>
                {section === "lessons"
                  ? "Search lessons or authors"
                  : "Search roadmaps"}
              </span>
              <span>
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  maxLength={500}
                  placeholder={
                    section === "lessons" ? "Title or author" : "Roadmap title"
                  }
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </span>
            </label>
            {section === "lessons" ? (
              <>
                <label>
                  <span>Origin</span>
                  <select
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="all">All origins</option>
                    <option value="ai">AI-generated</option>
                    <option value="manual">Handwritten</option>
                  </select>
                </label>
                <label>
                  <span>Review type</span>
                  <select
                    value={lessonKind}
                    onChange={(e) => {
                      setLessonKind(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="all">All lessons</option>
                    <option value="new">New lessons</option>
                    <option value="staged">Staged text</option>
                  </select>
                </label>
              </>
            ) : (
              <label>
                <span>Roadmap state</span>
                <select
                  value={roadmapFilter}
                  onChange={(e) => {
                    setRoadmapFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="submitted">Submitted</option>
                  <option value="published">Published</option>
                  <option value="takedown">
                    Takedown requests / countdowns
                  </option>
                  <option value="scheduled">Scheduled deletion</option>
                  <option value="draft">Draft / effectively private</option>
                  <option value="all">All states</option>
                </select>
              </label>
            )}
          </div>
        )}
        {p.loading ? (
          <div className={styles.empty} role="status">
            <RefreshCw size={26} aria-hidden="true" />
            <h3>Checking the review queue</h3>
            <p>Verifying admin access and the current lists.</p>
          </div>
        ) : !library ? (
          <div className={styles.empty}>
            <h3>Review data is unavailable</h3>
            <p>Refresh to check it. Missing data is not an empty queue.</p>
          </div>
        ) : section === "maintenance" ? (
          <div className={styles.maintenance}>
            <ShieldCheck size={28} aria-hidden="true" />
            <h3>
              {due.length
                ? `${due.length} roadmaps overdue at the last check`
                : "No overdue deletions at the last check"}
            </h3>
            <p>
              Scheduling hides a roadmap from non-admins when its date arrives.
              Purge permanently removes every overdue roadmap at server
              processing time, across all filters. It may partially finish on
              failure.
            </p>
            <ul>
              {due.map((r) => (
                <li key={r.id}>
                  <strong>{r.title}</strong>
                  <span>Due {reviewDisplayDate(r.deleteEffectiveAt!)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.danger}
              disabled={p.blocked || p.busy || !due.length}
              onClick={() =>
                choose({ scope: "purge", kind: "purge", roadmaps: due })
              }
            >
              <Trash2 size={16} aria-hidden="true" />
              Review global purge
            </button>
          </div>
        ) : !rows.length ? (
          <div className={styles.empty}>
            <ClipboardCheck size={26} aria-hidden="true" />
            <h3>
              {section === "lessons"
                ? "No lessons match this view"
                : "No roadmaps match this view"}
            </h3>
            <p>Try another filter or refresh the checked list.</p>
          </div>
        ) : (
          <>
            {section === "lessons" ? (
              <ul className={styles.list} aria-label="Lesson review queue">
                {lessons.slice(start, start + pageSize).map((l) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    blocked={!!p.blocked || !!p.busy}
                    onChoose={choose}
                  />
                ))}
              </ul>
            ) : (
              <ul className={styles.list} aria-label="Roadmaps for review">
                {roadmaps.slice(start, start + pageSize).map((r) => (
                  <li className={styles.roadmap} key={r.id}>
                    <div className={styles.roadmapHead}>
                      <div>
                        <h3>{r.title}</h3>
                        <span className={styles.badge}>
                          {effectiveRoadmapStatus(r, at)}
                        </span>
                      </div>
                      <button
                        className={styles.button}
                        type="button"
                        disabled={p.busy || p.blocked}
                        aria-expanded={p.detail?.roadmap.id === r.id}
                        onClick={() => p.onOpen(r.id)}
                      >
                        {p.opening === r.id
                          ? "Checking…"
                          : p.detail?.roadmap.id === r.id
                            ? "Close review"
                            : "Open review"}
                      </button>
                    </div>
                    <RoadmapDates roadmap={r} at={at} />
                    {p.detail?.roadmap.id === r.id && (
                      <RoadmapReview
                        d={p.detail}
                        blocked={!!p.blocked || !!p.busy}
                        onChoose={choose}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            <nav className={styles.pager} aria-label="Review list pages">
              <p aria-live="polite">
                {start + 1}–{Math.min(start + pageSize, rows.length)} of{" "}
                {rows.length} matching{" "}
                {section === "lessons" ? "lessons" : "roadmaps"}
              </p>
              <div>
                <button
                  className={styles.button}
                  type="button"
                  disabled={current === 0}
                  aria-label="Previous review page"
                  onClick={() => setPage(current - 1)}
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  Previous
                </button>
                <button
                  className={styles.button}
                  type="button"
                  disabled={current >= pages - 1}
                  aria-label="Next review page"
                  onClick={() => setPage(current + 1)}
                >
                  Next
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
      <p className={styles.footnote}>
        Values describe the last checked state. Approval, publication and
        scheduled removal are separate decisions. Shared content may appear in
        more than one roadmap.
      </p>
      {choice && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="review-action-title"
          aria-describedby="review-action-description"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <div className={styles.dialogHead}>
            <span className={styles.eyebrow}>
              {choice.scope === "purge"
                ? "PERMANENT GLOBAL REMOVAL"
                : "CONFIRM YOUR REVIEW"}
            </span>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Close review confirmation"
              disabled={p.pending}
              onClick={close}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <h2 id="review-action-title">{actionTitle(choice)}?</h2>
          {choice.scope !== "purge" && (
            <p className={styles.selectedName}>
              {choice.scope === "lesson"
                ? choice.lesson.title
                : choice.target.roadmap.title}
            </p>
          )}
          <div id="review-action-description">
            <ActionConsequences a={choice} />
            <p>
              Current admin access and the selected version will be checked
              before one decision is sent.
            </p>
          </div>
          {requiresReviewReason(choice) && (
            <label className={styles.reasonField}>
              Feedback for the author
              <textarea
                ref={reasonField}
                rows={4}
                maxLength={2000}
                value={reason}
                aria-invalid={validation && !validReviewReason(reason)}
                aria-describedby={
                  validation && !validReviewReason(reason)
                    ? "review-reason-error"
                    : "review-reason-help"
                }
                onChange={(e) => {
                  setDrafts({ ...drafts, [actionKey(choice)]: e.target.value });
                  if (validation) setValidation(false);
                }}
              />
              <small id="review-reason-help">
                Specific feedback, up to 2,000 characters. Kept on this page if
                the decision fails.
              </small>
              {validation && !validReviewReason(reason) && (
                <strong id="review-reason-error">
                  Add specific feedback before rejecting.
                </strong>
              )}
            </label>
          )}
          {choice.scope === "purge" && (
            <label className={styles.acknowledge}>
              <input
                type="checkbox"
                checked={purgeAcknowledged}
                onChange={(e) => setPurgeAcknowledged(e.target.checked)}
              />
              I understand this applies to all overdue roadmaps when the server
              processes it, including outside this view.
            </label>
          )}
          <div ref={dialogFeedback} tabIndex={-1}>
            {p.error && (
              <GuiFeedback kind="error" title="Decision needs attention">
                <p>{p.error}</p>
                {p.locked && (
                  <p>
                    Close this confirmation to check current state. Your
                    feedback remains on this page.
                  </p>
                )}
              </GuiFeedback>
            )}
            {p.pending && (
              <GuiFeedback
                kind="loading"
                title="Checking and saving the decision"
              >
                <p>
                  Waiting for a checked result. Closing or navigating away
                  cannot cancel an accepted request.
                </p>
              </GuiFeedback>
            )}
          </div>
          <div className={styles.dialogActions}>
            <button
              ref={keep}
              className={styles.button}
              type="button"
              disabled={p.pending}
              onClick={close}
            >
              {choice.scope === "purge"
                ? "Keep scheduled roadmaps"
                : "Keep reviewing"}
            </button>
            <button
              type="button"
              className={
                choice.scope === "purge" ||
                choice.kind === "reject" ||
                choice.kind === "schedule-delete" ||
                choice.kind === "unpublish"
                  ? styles.danger
                  : styles.primary
              }
              disabled={
                p.blocked ||
                p.busy ||
                p.locked ||
                (choice.scope === "purge" && !purgeAcknowledged)
              }
              onClick={submit}
            >
              {p.pending
                ? "Waiting for result…"
                : choice.scope === "purge"
                  ? "Purge all overdue permanently"
                  : actionTitle(choice)}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
