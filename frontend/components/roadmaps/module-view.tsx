"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";
import type {
  Resource,
  RoadmapProgressData,
} from "@/components/dashboard/dashboard-data";
import { roadmapSummary } from "@/components/dashboard/dashboard-data";
import {
  ConceptList,
  LearningCliLink,
  OriginLabel,
  ProgressSummary,
} from "./roadmap-view";
import {
  curriculum,
  moduleProgress,
  moduleRoute,
  lessonRoute,
  nextModuleLesson,
  type CurriculumModule,
  type LearningRoadmap,
} from "./roadmap-data";
import styles from "./roadmaps.module.css";
import moduleStyles from "./module.module.css";

export function ModuleOverview({
  roadmap,
  name,
  entry,
  progress,
}: {
  roadmap: LearningRoadmap;
  name: string;
  entry: CurriculumModule;
  progress: Resource<RoadmapProgressData>;
}) {
  const modules = curriculum(roadmap, name);
  const index = modules.findIndex((m) => m.module.id === entry.module.id);
  const scoped = {
    ...progress,
    data: progress.data && moduleProgress(entry, progress.data),
  };
  const summary = scoped.data && roadmapSummary(scoped.data);
  const next = !progress.error && nextModuleLesson(entry, progress.data);
  const previous = modules[index - 1],
    following = modules[index + 1];
  const roadmapHref = `/developer/roadmaps/${encodeURIComponent(name)}`;
  return (
    <div className={styles.page}>
      <nav aria-label="Learning breadcrumb" className={styles.breadcrumb}>
        <Link href="/developer/roadmaps">Roadmaps</Link>
        <span aria-hidden="true">/</span>
        <Link href={roadmapHref}>{roadmap.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{entry.module.title}</span>
      </nav>
      <header className={`${styles.overviewHero} ${moduleStyles.hero}`}>
        <div>
          <OriginLabel roadmap={entry.module} />
          <p className={styles.eyebrow}>
            Module {String(index + 1).padStart(2, "0")} /{" "}
            {String(modules.length).padStart(2, "0")}
          </p>
          <h1>{entry.module.title}</h1>
          <p className={moduleStyles.description}>
            {entry.module.description ||
              "Explore the concepts below in curriculum order. Revisit any lesson whenever you need it."}
          </p>
          <p className={styles.metadata}>
            <BookOpen size={16} aria-hidden="true" />
            {entry.concepts.length} visible{" "}
            {entry.concepts.length === 1 ? "concept" : "concepts"}
            <span>·</span>
            {roadmap.title}
          </p>
        </div>
        <div className={moduleStyles.stamp} aria-hidden="true">
          <svg viewBox="0 0 160 150" fill="none">
            <path
              d="M29 30h71c38 0 38 46 0 46H60c-38 0-38 46 0 46h71"
              stroke="currentColor"
              strokeWidth="2"
              pathLength="1"
            />
            <rect
              x="19"
              y="20"
              width="20"
              height="20"
              rx="6"
              fill="var(--gui-surface)"
              stroke="currentColor"
            />
            <circle
              cx="80"
              cy="76"
              r="10"
              fill="var(--gui-surface)"
              stroke="currentColor"
            />
            <rect
              x="121"
              y="112"
              width="20"
              height="20"
              rx="6"
              fill="currentColor"
            />
          </svg>
        </div>
      </header>
      <div className={styles.overviewGrid}>
        <section aria-labelledby="module-concepts-heading">
          <div className={styles.sectionHeading}>
            <h2 id="module-concepts-heading">Inside this module</h2>
            <span>Read. Practice. Connect.</span>
          </div>
          {entry.concepts.length ? (
            <ConceptList
              concepts={entry.concepts}
              progress={progress}
              numbered
            />
          ) : (
            <div className={styles.empty}>
              <BookOpen size={26} aria-hidden="true" />
              <h3>No visible concepts yet.</h3>
              <p>
                This module’s lessons may still be drafts or aren’t shared with
                you. Choose another module in the roadmap.
              </p>
              <Link className={styles.textLink} href={roadmapHref}>
                View the roadmap <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
          <nav className={moduleStyles.neighbors} aria-label="Adjacent modules">
            {previous && (
              <Link href={moduleRoute(previous.location)}>
                <ArrowLeft size={16} aria-hidden="true" />
                <span>
                  <small>Previous module</small>
                  {previous.module.title}
                </span>
              </Link>
            )}
            {following && (
              <Link href={moduleRoute(following.location)}>
                <span>
                  <small>Next module</small>
                  {following.module.title}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </section>
        <aside
          className={styles.journey}
          aria-labelledby="module-progress-heading"
        >
          <span className={styles.icon}>
            <Layers size={22} aria-hidden="true" />
          </span>
          <h2 id="module-progress-heading">Your progress here</h2>
          <ProgressSummary
            source={scoped}
            title={entry.module.title}
            scope="module"
          />
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
                {!entry.concepts.length
                  ? "No visible lessons to track here yet. Explore another module in this roadmap."
                  : summary.total > 0 && summary.done === summary.total
                    ? "You’ve completed all tracked concepts in this module. Revisit a lesson or explore the next module."
                    : "Choose a lesson to explore. Prerequisites shown alongside it guide what to complete first."}
              </p>
            )
          )}
          <p className={styles.note}>
            Only approved concepts in this module count toward progress. Reading
            a lesson doesn’t mark it complete.
          </p>
          <div className={styles.divider} />
          <nav aria-label="Roadmap modules" className={moduleStyles.moduleNav}>
            <h3>In this roadmap</h3>
            <ol>
              {modules.map((m, i) => (
                <li key={m.module.id}>
                  <Link
                    href={moduleRoute(m.location)}
                    aria-current={
                      m.module.id === entry.module.id ? "page" : undefined
                    }
                  >
                    <span className={styles.number}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{m.module.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.divider} />
          <LearningCliLink location={entry.location}>
            Open module in terminal
          </LearningCliLink>
          <p className={styles.note}>
            Lessons open here or in CLI. Your place stays connected between both
            views.
          </p>
        </aside>
      </div>
    </div>
  );
}
