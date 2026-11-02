"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  GitBranch,
  Layers,
  RotateCcw,
  Search,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { useUiMode } from "@/providers/ui-mode-provider";
import { toCliRoute, type Location } from "@/lib/terminal/location";
import {
  roadmapSummary,
  type Resource,
  type RoadmapProgressData,
} from "@/components/dashboard/dashboard-data";
import {
  conceptStatus,
  curriculum,
  filterRoadmaps,
  nextLesson,
  lessonRoute,
  moduleRoute,
  ORIGINS,
  PAGE_SIZE,
  type LearningRoadmap,
  type CurriculumModule,
} from "./roadmap-data";
import styles from "./roadmaps.module.css";

export function DataState<T>({
  source,
  label,
  children,
  unavailable = false,
}: {
  source: Resource<T>;
  label: string;
  children: ReactNode;
  unavailable?: boolean;
}) {
  const missing = source.data === undefined || unavailable;
  if (source.pending && missing)
    return (
      <div className={styles.loading} role="status">
        <span>Loading {label.toLowerCase()}…</span>
        <div className={styles.skeleton} aria-hidden="true" />
        <div className={styles.skeleton} aria-hidden="true" />
      </div>
    );
  return (
    <>
      {source.error && (
        <GuiFeedback
          kind="error"
          title={
            missing
              ? unavailable
                ? `${label} unavailable`
                : `${label} couldn’t load`
              : `${label} couldn’t refresh`
          }
        >
          <p>
            {missing
              ? unavailable
                ? `This ${label.toLowerCase()} may have been removed or may no longer be shared with you.`
                : "Please try again. Your saved progress hasn’t changed."
              : "Showing the last loaded data. Try again for an update."}
          </p>
          <button
            type="button"
            className={styles.secondary}
            onClick={source.retry}
            disabled={source.refreshing}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {source.refreshing ? "Retrying…" : "Try again"}
          </button>
        </GuiFeedback>
      )}
      {!missing && children}
    </>
  );
}
export function OriginLabel({
  roadmap,
}: {
  roadmap: Pick<LearningRoadmap, "originLabel" | "reviewStatus">;
}) {
  return (
    <div className={styles.labels}>
      {roadmap.originLabel && <span>{ORIGINS[roadmap.originLabel]}</span>}
      {roadmap.reviewStatus && roadmap.reviewStatus !== "published" && (
        <span>
          {roadmap.reviewStatus === "submitted" ? "In review" : "Private draft"}
        </span>
      )}
    </div>
  );
}
export function LearningCliLink({
  location,
  conceptId,
  children,
  primary = false,
  quiz = false,
  discussion = false,
}: {
  location: Location;
  conceptId?: string;
  children: ReactNode;
  primary?: boolean;
  quiz?: boolean;
  discussion?: boolean;
}) {
  const { setMode } = useUiMode();
  const route = toCliRoute(location, "developer");
  return (
    <Link
      className={primary ? styles.primary : styles.textLink}
      href={`${route}${conceptId ? `${route.includes("?") ? "&" : "?"}concept=${encodeURIComponent(conceptId)}${discussion ? "&view=qa" : quiz ? "&view=quiz" : ""}` : ""}`}
      onClick={() => setMode("cli", { navigate: false })}
    >
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
      <span className={styles.cli}>CLI</span>
    </Link>
  );
}
export function ProgressSummary({
  source,
  title,
  scope = "roadmap",
}: {
  source: Resource<RoadmapProgressData>;
  title: string;
  scope?: "roadmap" | "module";
}) {
  const summary = source.data && roadmapSummary(source.data);
  return (
    <DataState source={source} label="Learning progress">
      {summary && (
        <div className={styles.progress}>
          <div>
            <span>
              {summary.done} of {summary.total} tracked concepts completed
            </span>
            <strong>{summary.percentage}%</strong>
          </div>
          <progress
            value={summary.done}
            max={summary.total || 1}
            aria-label={`${title} completion`}
          />
          {summary.total === 0 && (
            <small>
              No approved concepts are tracked for this {scope} yet.
            </small>
          )}
        </div>
      )}
    </DataState>
  );
}
export function ConceptList({
  concepts,
  progress,
  numbered = false,
}: {
  concepts: CurriculumModule["concepts"];
  progress: Resource<RoadmapProgressData>;
  numbered?: boolean;
}) {
  return (
    <ol className={`${styles.concepts} ${numbered ? styles.lessonCards : ""}`}>
      {concepts.map(({ placement, location }, index) => {
        const status =
          progress.pending && !progress.data
            ? "Checking progress…"
            : conceptStatus(placement, progress.data);
        const missingPrereqs = (placement.prerequisites ?? []).filter(
          (p) =>
            !progress.data?.concepts?.some(
              (row) =>
                row.conceptId === p.prerequisiteConceptId &&
                row.status === "completed",
            ),
        );
        return (
          <li key={placement.id}>
            <div className={styles.conceptHeading}>
              <span className={styles.conceptIcon}>
                {numbered ? (
                  String(index + 1).padStart(2, "0")
                ) : status === "Completed" ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <BookOpen size={17} aria-hidden="true" />
                )}
              </span>
              <Link href={lessonRoute(location)}>
                {placement.concept.title}
              </Link>
            </div>
            <div className={styles.conceptMeta}>
              <span>
                {status}
                {progress.error && progress.data ? " · last loaded" : ""}
              </span>
              {placement.concept.difficulty && (
                <span>Difficulty: {placement.concept.difficulty}</span>
              )}
              {placement.concept.questionCount !== undefined && (
                <span>{placement.concept.questionCount} quiz questions</span>
              )}
            </div>
            {!!missingPrereqs.length && (
              <p className={styles.prereqs}>
                {progress.data ? "Before completing: " : "Prerequisites: "}
                {missingPrereqs.map((p) => p.title).join(", ")}. You can still
                read this lesson.
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
function ThreadArt() {
  return (
    <svg
      className={styles.threadArt}
      viewBox="0 0 260 150"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 104H82C105 104 110 45 140 45H204C240 45 240 109 206 109H173"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <rect
        x="30"
        y="87"
        width="34"
        height="34"
        rx="10"
        fill="var(--gui-surface)"
        stroke="currentColor"
      />
      <rect
        x="122"
        y="28"
        width="34"
        height="34"
        rx="10"
        fill="var(--gui-accent-soft)"
        stroke="currentColor"
      />
      <rect
        x="186"
        y="92"
        width="34"
        height="34"
        rx="10"
        fill="var(--gui-surface)"
        stroke="currentColor"
      />
      <circle cx="47" cy="104" r="4" fill="currentColor" />
      <path d="m132 45 5 5 9-10" stroke="currentColor" strokeWidth="2" />
      <circle cx="203" cy="109" r="4" fill="currentColor" />
    </svg>
  );
}
export function BrowserCard({
  roadmap,
  progress,
}: {
  roadmap: LearningRoadmap;
  progress: Resource<RoadmapProgressData>;
}) {
  const count = (roadmap.modules ?? []).reduce(
    (n, m) => n + (m.moduleConcepts?.length ?? 0),
    0,
  );
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.icon}>
          <GitBranch size={21} aria-hidden="true" />
        </span>
        <OriginLabel roadmap={roadmap} />
      </div>
      <h2>
        <Link href={`/developer/roadmaps/${encodeURIComponent(roadmap.id)}`}>
          {roadmap.title}
        </Link>
      </h2>
      <p className={styles.description}>
        {roadmap.description ||
          "Explore the modules and concepts in this roadmap."}
      </p>
      <p className={styles.metadata}>
        <Layers size={15} aria-hidden="true" />
        {roadmap.modules?.length ?? roadmap.moduleCount ?? 0} modules
        <span>·</span>
        {count} visible concepts
      </p>
      <ProgressSummary source={progress} title={roadmap.title} />
      <Link
        className={styles.textLink}
        href={`/developer/roadmaps/${encodeURIComponent(roadmap.id)}`}
      >
        Explore roadmap <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
export function RoadmapBrowser({
  source,
  renderCard,
}: {
  source: Resource<LearningRoadmap[]>;
  renderCard: (r: LearningRoadmap) => ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const matches = filterRoadmaps(source.data ?? [], search, origin, sort);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const reset = () => {
    setSearch("");
    setOrigin("all");
    setPage(1);
  };
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your next connection</p>
          <h1>
            Find a path.
            <br />
            Make it yours.
          </h1>
          <p>
            Explore roadmaps built from focused modules and concepts. Learn
            something new, test your understanding, and keep it with you.
          </p>
        </div>
        <ThreadArt />
      </header>
      <section aria-label="Browse roadmaps">
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <label htmlFor="roadmap-search">Search roadmaps</label>
            <div>
              <Search size={18} aria-hidden="true" />
              <input
                id="roadmap-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className={styles.select}>
            <label htmlFor="roadmap-origin">Origin</label>
            <select
              id="roadmap-origin"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All origins</option>
              {Object.entries(ORIGINS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.select}>
            <label htmlFor="roadmap-sort">Sort by</label>
            <select
              id="roadmap-sort"
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
        </div>
        <DataState source={source} label="Roadmaps">
          <p className={styles.resultCount} role="status" aria-atomic="true">
            {matches.length} {matches.length === 1 ? "roadmap" : "roadmaps"}
            {search.trim() || origin !== "all"
              ? " matching your filters"
              : " available to you"}
          </p>
          {matches.length ? (
            <>
              <div className={styles.grid}>
                {matches
                  .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
                  .map(renderCard)}
              </div>
              {pages > 1 && (
                <nav className={styles.pagination} aria-label="Roadmap pages">
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {current} of {pages}
                  </span>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={current === pages}
                    onClick={() => setPage(current + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <BookOpen size={28} aria-hidden="true" />
              <h2>
                {source.data?.length
                  ? "Let’s try another search."
                  : "No roadmaps available yet."}
              </h2>
              <p>
                {source.data?.length
                  ? "Try a shorter title, a different keyword, or clear the origin filter."
                  : "Roadmaps shared with you and your own drafts will appear here. You can also create your own content."}
              </p>
              {source.data?.length ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={reset}
                >
                  Clear filters
                </button>
              ) : (
                <Link className={styles.textLink} href="/developer/content">
                  Go to my content <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </DataState>
      </section>
      <p className={styles.footnote}>
        Same content. Two ways to explore. Switch to CLI whenever you like.
      </p>
    </div>
  );
}
export function RoadmapOverview({
  roadmap,
  name,
  progress,
}: {
  roadmap: LearningRoadmap;
  name: string;
  progress: Resource<RoadmapProgressData>;
}) {
  const modules = curriculum(roadmap, name);
  const next = !progress.error && nextLesson(roadmap, name, progress.data);
  const summary = progress.data && roadmapSummary(progress.data);
  return (
    <div className={styles.page}>
      <nav aria-label="Learning breadcrumb" className={styles.breadcrumb}>
        <Link href="/developer/roadmaps">Roadmaps</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{roadmap.title}</span>
      </nav>
      <header className={styles.overviewHero}>
        <OriginLabel roadmap={roadmap} />
        <p className={styles.eyebrow}>A path through the ideas</p>
        <h1>{roadmap.title}</h1>
        <p>
          {roadmap.description ||
            "Work through the modules below, one concept at a time."}
        </p>
        <p className={styles.metadata}>
          <Layers size={16} aria-hidden="true" />
          {modules.length} modules<span>·</span>
          {modules.reduce((n, m) => n + m.concepts.length, 0)} visible concepts
        </p>
      </header>
      <div className={styles.overviewGrid}>
        <section
          className={styles.curriculum}
          aria-labelledby="curriculum-heading"
        >
          <div className={styles.sectionHeading}>
            <h2 id="curriculum-heading">The roadmap</h2>
            <span>One concept at a time</span>
          </div>
          {modules.length ? (
            modules.map(({ module, location, concepts }, index) => (
              <details
                className={styles.module}
                key={module.id}
                open={index === 0}
              >
                <summary>
                  <span className={styles.number}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.moduleTitle}>
                    <strong>{module.title}</strong>
                    <small>
                      {concepts.length}{" "}
                      {concepts.length === 1 ? "concept" : "concepts"}
                    </small>
                  </span>
                  <ChevronDown
                    className={styles.chevron}
                    size={19}
                    aria-hidden="true"
                  />
                </summary>
                <div className={styles.moduleBody}>
                  {module.description && <p>{module.description}</p>}
                  <Link
                    className={styles.textLink}
                    href={moduleRoute(location)}
                  >
                    Explore module <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  {concepts.length ? (
                    <ConceptList concepts={concepts} progress={progress} />
                  ) : (
                    <p>No visible concepts in this module yet.</p>
                  )}
                </div>
              </details>
            ))
          ) : (
            <div className={styles.empty}>
              <Layers size={26} aria-hidden="true" />
              <h3>No modules yet.</h3>
              <p>This roadmap’s outline is still taking shape.</p>
            </div>
          )}
        </section>
        <aside className={styles.journey} aria-labelledby="journey-heading">
          <span className={styles.icon}>
            <GitBranch size={22} aria-hidden="true" />
          </span>
          <h2 id="journey-heading">Your way through</h2>
          <ProgressSummary source={progress} title={roadmap.title} />
          {next ? (
            <>
              <p className={styles.eyebrow}>Next available concept</p>
              <h3>{next.placement.concept.title}</h3>
              <Link
                className={styles.primary}
                href={lessonRoute(next.location)}
              >
                Continue learning
              </Link>
            </>
          ) : (
            summary &&
            !progress.error && (
              <p>
                {summary.total > 0 && summary.done === summary.total
                  ? "You’ve completed all tracked concepts in this roadmap. Revisit any lesson below."
                  : "Explore a module below. Prerequisites and concept progress will guide your next step."}
              </p>
            )
          )}
          <p className={styles.note}>
            Progress tracks approved concepts. Drafts may be visible to their
            author or an admin, but aren’t included in completion totals.
          </p>
          <div className={styles.divider} />
          <LearningCliLink location={{ kind: "roadmap", roadmap: name }}>
            Open roadmap in terminal
          </LearningCliLink>
          <p className={styles.note}>
            Read lessons here or in the terminal. Your learning place stays
            connected.
          </p>
        </aside>
      </div>
    </div>
  );
}
