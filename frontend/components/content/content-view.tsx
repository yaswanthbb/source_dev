"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Layers3,
  LockKeyhole,
  FilePenLine,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  CONTENT_STATUSES,
  filterOwnRoadmaps,
  roadmapDraftErrors,
  contentDate,
  type ContentLibrary,
  type OwnRoadmap,
} from "./content-data";
import type { RoadmapDraft, RoadmapCreation } from "./content-client";
import styles from "./content.module.css";

const ORIGINS = {
  ai: "AI generated",
  handwritten: "Handwritten",
  partial: "Mixed origin",
};
export function ContentLibraryView({
  data,
  loading = false,
  refreshing = false,
  readError,
  pending = false,
  error,
  uncertain = false,
  recovered = false,
  outcome,
  canCreate = true,
  onCreate,
  onRefresh,
  onClassic,
}: {
  data?: ContentLibrary;
  loading?: boolean;
  refreshing?: boolean;
  readError?: string;
  pending?: boolean;
  error?: string;
  uncertain?: boolean;
  recovered?: boolean;
  outcome?: RoadmapCreation;
  canCreate?: boolean;
  onCreate: (draft: RoadmapDraft) => void;
  onRefresh: () => void;
  onClassic?: () => void;
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState("recent"),
    [page, setPage] = useState(0);
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof roadmapDraftErrors>>({
    title: undefined,
    description: undefined,
  });
  const [validationAttempt, setValidationAttempt] = useState(0);
  const feedback = useRef<HTMLDivElement>(null),
    summary = useRef<HTMLDivElement>(null),
    titleInput = useRef<HTMLInputElement>(null);
  const disabled = !data || !canCreate || loading || refreshing || pending;
  useEffect(() => {
    if (error || outcome) feedback.current?.focus();
  }, [error, outcome]);
  useEffect(() => {
    if (validationAttempt) summary.current?.focus();
  }, [validationAttempt]);
  useEffect(() => {
    if (outcome) {
      setTitle("");
      setDescription("");
      setErrors({ title: undefined, description: undefined });
    }
  }, [outcome]);
  const filtered = filterOwnRoadmaps(
    data?.roadmaps ?? [],
    search,
    status,
    sort,
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 6) - 1),
  );
  const rows = filtered.slice(currentPage * 6, (currentPage + 1) * 6);
  const counts = data && {
    all: data.roadmaps.length,
    draft: data.roadmaps.filter((r) => r.status === "draft").length,
    submitted: data.roadmaps.filter((r) => r.status === "submitted").length,
    published: data.roadmaps.filter((r) => r.status === "published").length,
    removed: data.roadmaps.filter((r) => r.status === "removed").length,
  };
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your authoring workspace</p>
          <h1>
            Ideas worth
            <br />
            <span>passing on.</span>
          </h1>
          <p>
            Build a roadmap, connect its lessons, and share what you know. This
            library contains only roadmaps you created.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => titleInput.current?.focus()}
            >
              <Plus size={17} aria-hidden="true" />
              New roadmap
            </button>
            {onClassic && (
              <button
                className={styles.secondary}
                type="button"
                onClick={onClassic}
              >
                Classic library
              </button>
            )}
          </div>
        </div>
        <svg className={styles.motif} viewBox="0 0 220 180" aria-hidden="true">
          <path
            className={styles.draw}
            d="M40 40h80v45h60M40 40v90h80"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <rect x="20" y="20" width="46" height="42" rx="12" />
          <rect x="98" y="67" width="46" height="42" rx="12" />
          <rect x="154" y="112" width="46" height="42" rx="12" />
          <path
            d="M32 36h22m-22 9h15m79 41h-17m17 9h-17m57 35h22m-22 9h15"
            stroke="var(--gui-surface)"
            strokeWidth="2"
          />
        </svg>
      </header>
      <section
        className={styles.metrics}
        aria-label="Your roadmap counts at last load"
      >
        {(["all", "draft", "submitted", "published"] as const).map((key) => (
          <div key={key}>
            <span>
              {key === "all" ? "Your roadmaps" : CONTENT_STATUSES[key]}
            </span>
            <strong>{counts ? counts[key] : "—"}</strong>
          </div>
        ))}
      </section>
      <div className={styles.workspace}>
        <section className={styles.library} aria-labelledby="library-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="library-heading">Your roadmap library</h2>
              <p>
                {data
                  ? `Last checked ${contentDate(data.loadedAt)}. Refresh to check review and scheduled changes.`
                  : "Your library will appear after your account and content are checked."}
              </p>
            </div>
            <button
              type="button"
              className={styles.secondary}
              disabled={loading || refreshing || pending}
              onClick={onRefresh}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {loading && (
            <GuiFeedback kind="loading" title="Loading your content">
              <p>Checking your account and private roadmap library.</p>
            </GuiFeedback>
          )}
          {readError && (
            <GuiFeedback
              kind="error"
              title={
                data
                  ? "Showing your previously loaded library"
                  : "Content couldn’t load"
              }
            >
              <p>{readError}</p>
              <button
                type="button"
                className={styles.secondary}
                disabled={refreshing || pending}
                onClick={onRefresh}
              >
                Reload library
              </button>
            </GuiFeedback>
          )}
          <div className={styles.filters}>
            <label>
              Search your roadmaps
              <input
                type="search"
                value={search}
                placeholder="Title or description"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
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
                <option value="recent">Newest first</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>
          <div
            className={styles.statusFilters}
            aria-label="Filter roadmaps by status"
          >
            {Object.entries(CONTENT_STATUSES)
              .filter(([key]) => key !== "removed" || !!counts?.removed)
              .map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={status === key}
                  onClick={() => {
                    setStatus(key);
                    setPage(0);
                  }}
                >
                  {label}
                  <span>
                    {counts ? counts[key as keyof typeof counts] : "—"}
                  </span>
                </button>
              ))}
          </div>
          {data && !rows.length && (
            <div className={styles.empty}>
              <Layers3 size={32} aria-hidden="true" />
              <h3>
                {data.roadmaps.length
                  ? "No matching roadmaps"
                  : "Your first roadmap starts with an idea."}
              </h3>
              <p>
                {data.roadmaps.length
                  ? "Try a different search or status filter."
                  : "Give it a title. Add the modules and lessons in the editor when you’re ready."}
              </p>
              {data.roadmaps.length ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setPage(0);
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => titleInput.current?.focus()}
                >
                  Create your first roadmap
                </button>
              )}
            </div>
          )}
          <div className={styles.cards}>
            {rows.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} />
            ))}
          </div>
          {filtered.length > 6 && (
            <nav
              className={styles.pagination}
              aria-label="Roadmap library pages"
            >
              <button
                className={styles.secondary}
                type="button"
                disabled={!currentPage}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {Math.ceil(filtered.length / 6)}
              </span>
              <button
                className={styles.secondary}
                type="button"
                disabled={(currentPage + 1) * 6 >= filtered.length}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>
        <aside className={styles.create} aria-labelledby="create-heading">
          <div className={styles.createTop}>
            <FilePenLine size={22} aria-hidden="true" />
            <p className={styles.eyebrow}>Start small. Build it out.</p>
            <h2 id="create-heading">Create a roadmap</h2>
            <p>A title today. A learning path tomorrow.</p>
          </div>
          {pending && (
            <GuiFeedback
              kind="loading"
              title="Checking your account and creating"
            >
              <p>Leaving this page cannot undo a request already sent.</p>
            </GuiFeedback>
          )}
          {error ? (
            <GuiFeedback
              ref={feedback}
              kind="error"
              title={
                uncertain
                  ? "Creation isn’t confirmed"
                  : "Roadmap couldn’t be created"
              }
            >
              <p>{error}</p>
              <button
                type="button"
                className={styles.secondary}
                disabled={pending || refreshing}
                onClick={onRefresh}
              >
                Check my library
              </button>
            </GuiFeedback>
          ) : (
            outcome && (
              <GuiFeedback
                ref={feedback}
                kind="success"
                title="Private roadmap created"
              >
                <p>
                  The server saved “{outcome.roadmap.title}”. It is not
                  published.
                </p>
                <Link
                  href={`/developer/content/${encodeURIComponent(outcome.roadmap.id)}`}
                >
                  Open classic editor{" "}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </GuiFeedback>
            )
          )}
          {recovered && (
            <GuiFeedback kind="info" title="Fresh library checked">
              <p>
                Look for the previous roadmap before creating another. An
                earlier request may still finish; another create can make a
                duplicate.
              </p>
            </GuiFeedback>
          )}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (disabled) return;
              const next = roadmapDraftErrors(title, description);
              setErrors(next);
              if (next.title || next.description) {
                setValidationAttempt((attempt) => attempt + 1);
                return;
              }
              onCreate({ title, description });
            }}
          >
            {(errors.title || errors.description) && (
              <GuiFeedback
                ref={summary}
                kind="error"
                title="Check your roadmap details"
              >
                {errors.title && (
                  <p>
                    <a href="#roadmap-title">{errors.title}</a>
                  </p>
                )}
                {errors.description && (
                  <p>
                    <a href="#roadmap-description">{errors.description}</a>
                  </p>
                )}
              </GuiFeedback>
            )}
            <label htmlFor="roadmap-title">
              Roadmap title <span>(required)</span>
            </label>
            <input
              ref={titleInput}
              id="roadmap-title"
              required
              maxLength={120}
              disabled={pending}
              value={title}
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "roadmap-title-error" : "roadmap-title-help"
              }
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              placeholder="e.g. Foundations of Git"
            />
            <p id="roadmap-title-help" className={styles.hint}>
              A clear subject, in 120 characters or fewer.
            </p>
            {errors.title && (
              <p id="roadmap-title-error" className={styles.fieldError}>
                {errors.title}
              </p>
            )}
            <label htmlFor="roadmap-description">
              Description <span>(optional)</span>
            </label>
            <textarea
              id="roadmap-description"
              rows={4}
              maxLength={2000}
              disabled={pending}
              value={description}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description
                  ? "roadmap-description-error"
                  : "roadmap-description-help"
              }
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors({ ...errors, description: undefined });
              }}
              placeholder="What will someone understand by the end?"
            />
            <p id="roadmap-description-help" className={styles.hint}>
              Set the direction. Up to 2,000 characters.
            </p>
            {errors.description && (
              <p id="roadmap-description-error" className={styles.fieldError}>
                {errors.description}
              </p>
            )}
            <p className={styles.privacy}>
              <LockKeyhole size={16} aria-hidden="true" />
              Private to you and admins until reviewed and published. Creating
              this draft does not run AI.
            </p>
            <button
              type="submit"
              className={styles.primary}
              disabled={disabled}
            >
              {pending ? "Creating…" : "Create private roadmap"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <p className={styles.classicNote}>
            Module and lesson authoring opens in the classic editor for now. Its
            GUI redesign is the next checkpoint.
          </p>
        </aside>
      </div>
    </div>
  );
}
function RoadmapCard({ roadmap: r }: { roadmap: OwnRoadmap }) {
  const label =
    r.status === "draft" && r.rejectionReason
      ? "Changes requested"
      : r.status === "draft"
        ? "Draft · private"
        : r.status === "submitted"
          ? "In review · private"
          : r.status === "published"
            ? "Published"
            : "Deletion effective";
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.badge}>{label}</span>
        {r.originLabel && (
          <span className={styles.origin}>{ORIGINS[r.originLabel]}</span>
        )}
      </div>
      <h3>{r.title}</h3>
      <p className={styles.description}>
        {r.description?.trim() || "No description added yet."}
      </p>
      <div className={styles.metadata}>
        <span>
          {r.moduleCount == null
            ? "Module count unavailable"
            : `${r.moduleCount} ${r.moduleCount === 1 ? "module" : "modules"}`}
        </span>
        <time dateTime={r.createdAt}>Created {contentDate(r.createdAt)}</time>
      </div>
      {r.rejectionReason && (
        <details className={styles.note}>
          <summary>Latest review feedback</summary>
          <p>{r.rejectionReason}</p>
        </details>
      )}
      {r.unpublishStatus === "requested" && r.status === "published" && (
        <p className={styles.note}>
          Unpublish requested. Still published while awaiting review.
        </p>
      )}
      {r.unpublishStatus === "approved" && r.unpublishEffectiveAt && (
        <p className={styles.note}>
          {r.status === "published"
            ? `Approved unpublish date: ${contentDate(r.unpublishEffectiveAt)}.`
            : `Unpublish effective since ${contentDate(r.unpublishEffectiveAt)}.`}
        </p>
      )}
      {r.deleteEffectiveAt && (
        <p className={styles.note}>
          {r.status === "removed"
            ? "Deletion is effective; admin maintenance may still be pending."
            : `Scheduled deletion: ${contentDate(r.deleteEffectiveAt)}.`}
        </p>
      )}
      {r.status !== "removed" && (
        <Link
          className={styles.editorLink}
          href={`/developer/content/${encodeURIComponent(r.id)}`}
        >
          Open editor <span>Classic view</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
