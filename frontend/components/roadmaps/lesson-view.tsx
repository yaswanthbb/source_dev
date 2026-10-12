"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Terminal } from "lucide-react";
import type {
  Resource,
  RoadmapProgressData,
} from "@/components/dashboard/dashboard-data";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  curriculum,
  lessonRoute,
  moduleRoute,
  ORIGINS,
  conceptStatus,
  type CurriculumModule,
  type CurriculumLesson,
  type LearningRoadmap,
} from "./roadmap-data";
import {
  completionBlock,
  lessonOutline,
  type LessonContent,
  type QuizStatus,
} from "./lesson-data";
import { LearningCliLink } from "./roadmap-view";
import { LessonMarkdown, LessonVideos } from "./lesson-markdown";
import styles from "./lesson.module.css";
import shared from "./roadmaps.module.css";

export type LessonAction = {
  pending: boolean;
  error?: string;
  success: boolean;
  run(): void;
};
export function LessonView({
  roadmap,
  name,
  entry,
  lesson,
  content,
  progress,
  quiz,
  start,
  complete,
  canSave = true,
}: {
  roadmap: LearningRoadmap;
  name: string;
  entry: CurriculumModule;
  lesson: CurriculumLesson;
  content: LessonContent;
  progress: Resource<RoadmapProgressData>;
  quiz: Resource<QuizStatus>;
  start: LessonAction;
  complete: LessonAction;
  canSave?: boolean;
}) {
  const all = curriculum(roadmap, name).flatMap((m) => m.concepts);
  const index = all.findIndex((l) => l.placement.id === lesson.placement.id);
  const previous = all[index - 1],
    next = all[index + 1];
  const outline = lessonOutline(content.content ?? "");
  const completed =
    complete.success ||
    (!progress.error &&
      conceptStatus(lesson.placement, progress.data) === "Completed");
  const block = !canSave
    ? "Confirming the current lesson placement. Refresh the roadmap if this doesn’t finish."
    : progress.error || quiz.error
      ? "Refresh progress and quiz status before completing this lesson."
      : completionBlock(lesson, content, progress.data, quiz.data);
  const stale = progress.error || quiz.error;
  return (
    <div className={styles.reader}>
      <nav aria-label="Learning breadcrumb" className={shared.breadcrumb}>
        <Link href="/developer/roadmaps">Roadmaps</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/developer/roadmaps/${encodeURIComponent(name)}`}>
          {roadmap.title}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={moduleRoute(entry.location)}>{entry.module.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{content.title}</span>
      </nav>
      <div className={styles.layout}>
        <div className={styles.mobileNav}>
          <details>
            <summary>Lessons in {entry.module.title}</summary>
            <nav aria-label="Mobile module lessons">
              {entry.concepts.map((l, i) => (
                <Link
                  key={l.placement.id}
                  href={lessonRoute(l.location)}
                  aria-current={
                    l.placement.id === lesson.placement.id ? "page" : undefined
                  }
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {l.placement.concept.title}
                    <small>
                      {progress.error
                        ? "Progress unavailable"
                        : conceptStatus(l.placement, progress.data)}
                    </small>
                  </span>
                </Link>
              ))}
              <Link href={moduleRoute(entry.location)}>Module overview</Link>
            </nav>
          </details>
          <details>
            <summary>On this page</summary>
            <nav aria-label="Mobile lesson sections">
              {outline.map((h) => (
                <a key={h.id} href={`#${h.id}`}>
                  {h.title}
                </a>
              ))}
              <a href="#lesson-checkpoint">Knowledge & progress</a>
            </nav>
          </details>
        </div>
        <aside className={styles.lessonNav} aria-label="Lessons in this module">
          <p className={styles.eyebrow}>Your learning path</p>
          <h2>{entry.module.title}</h2>
          <ol>
            {entry.concepts.map((l, i) => (
              <li key={l.placement.id}>
                <Link
                  href={lessonRoute(l.location)}
                  aria-current={
                    l.placement.id === lesson.placement.id ? "page" : undefined
                  }
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {l.placement.concept.title}
                    <small>
                      {progress.error
                        ? "Progress unavailable"
                        : conceptStatus(l.placement, progress.data)}
                    </small>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href={moduleRoute(entry.location)} className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" /> Module overview
          </Link>
        </aside>
        <article className={styles.article} id="lesson-reading">
          <header className={styles.header}>
            <p className={styles.eyebrow}>
              <BookOpen size={14} aria-hidden="true" /> Lesson{" "}
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(all.length).padStart(2, "0")}
            </p>
            <h1>{content.title}</h1>
            <div className={styles.metadata}>
              {content.originLabel && (
                <span>{ORIGINS[content.originLabel]}</span>
              )}
              {content.difficulty && (
                <span>Difficulty: {content.difficulty}</span>
              )}
              <span>
                {completed
                  ? "Completed"
                  : start.pending
                    ? "Saving your place…"
                    : "Reading"}
              </span>
            </div>
            {content.reviewStatus !== "approved" && (
              <GuiFeedback kind="info" title="Author preview">
                <p>
                  This lesson is not approved yet. You’re viewing saved content,
                  not staged edits; it does not count toward roadmap completion.
                </p>
              </GuiFeedback>
            )}
            {start.error && (
              <GuiFeedback
                kind="error"
                title="Your reading place couldn’t save"
              >
                <p>{start.error} You can still read the lesson.</p>
                <button
                  type="button"
                  onClick={start.run}
                  disabled={start.pending}
                >
                  Retry saving progress
                </button>
              </GuiFeedback>
            )}
          </header>
          {content.content?.trim() ? (
            <LessonMarkdown
              key={content.id}
              content={content.content}
              media={content.media}
            />
          ) : (
            <GuiFeedback kind="info" title="No lesson content yet">
              <p>
                This concept has no saved lesson body. Return to the module and
                choose another lesson.
              </p>
            </GuiFeedback>
          )}
          <LessonVideos media={content.media} />
          <section
            className={styles.checkpoint}
            aria-labelledby="lesson-checkpoint"
          >
            <span className={styles.checkIcon}>
              <Check size={21} aria-hidden="true" />
            </span>
            <p className={styles.eyebrow}>Close the loop</p>
            <h2 id="lesson-checkpoint">
              {completed ? "A connection made." : "Make the idea stick."}
            </h2>
            <p>
              {completed
                ? "This lesson is marked complete. Revisit the explanation or continue through the roadmap."
                : "Reading starts your progress. Completion is a separate step, after prerequisites and any knowledge check are resolved."}
            </p>
            {quiz.pending && !quiz.data && (
              <p role="status">Checking your knowledge-check status…</p>
            )}
            {!quiz.error && quiz.data && (
              <p>
                {quiz.data.totalQuestions === 0
                  ? "No knowledge check is attached to this lesson."
                  : `${quiz.data.totalQuestions} questions · ${quiz.data.allQuestionsResolved ? "resolved" : "not yet resolved"}`}
              </p>
            )}
            {stale && (
              <GuiFeedback kind="error" title="Progress check unavailable">
                <p>
                  Current progress is needed before completion can be saved.
                </p>
                <button
                  type="button"
                  disabled={!!progress.refreshing || !!quiz.refreshing}
                  onClick={() => {
                    progress.retry();
                    quiz.retry();
                  }}
                >
                  Refresh progress checks
                </button>
              </GuiFeedback>
            )}
            {complete.error && (
              <GuiFeedback
                kind="error"
                title="Completion couldn’t be confirmed"
              >
                <p>{complete.error}</p>
              </GuiFeedback>
            )}
            {complete.success && (
              <GuiFeedback kind="success" title="Lesson marked complete">
                <p>Your completion has been saved.</p>
              </GuiFeedback>
            )}
            {!completed && (
              <>
                <p id="completion-requirement" className={styles.requirement}>
                  {block ||
                    "Ready to mark complete. We’ll check your latest progress before saving."}
                </p>
                <button
                  type="button"
                  className={shared.primary}
                  aria-describedby="completion-requirement"
                  disabled={
                    !!block ||
                    complete.pending ||
                    start.pending ||
                    !!start.error
                  }
                  onClick={complete.run}
                >
                  {complete.pending
                    ? "Checking and saving…"
                    : "Mark lesson complete"}
                </button>
              </>
            )}
            <div className={styles.cliActions}>
              {!!quiz.data?.totalQuestions && !quiz.error && (
                <Link
                  className={shared.primary}
                  href={`${lessonRoute(lesson.location)}/quiz`}
                >
                  {quiz.data.allQuestionsResolved
                    ? "Review knowledge check"
                    : "Start knowledge check"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              <LearningCliLink
                location={lesson.location}
                conceptId={content.id}
              >
                Open lesson in terminal
              </LearningCliLink>
            </div>
          </section>
          <nav className={styles.neighbors} aria-label="Adjacent lessons">
            {previous && (
              <Link href={lessonRoute(previous.location)}>
                <ArrowLeft size={17} aria-hidden="true" />
                <span>
                  <small>Previous lesson</small>
                  {previous.placement.concept.title}
                </span>
              </Link>
            )}
            {next && (
              <Link href={lessonRoute(next.location)}>
                <span>
                  <small>Next lesson</small>
                  {next.placement.concept.title}
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </article>
        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.eyebrow}>On this page</p>
          {outline.length ? (
            <nav aria-label="Lesson sections">
              {outline.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  data-nested={h.depth > 2 || undefined}
                >
                  {h.title}
                </a>
              ))}
            </nav>
          ) : (
            <p className={styles.quiet}>One idea, in one reading.</p>
          )}
          <a href="#lesson-checkpoint" className={styles.tocCheckpoint}>
            Knowledge & progress <ArrowRight size={14} aria-hidden="true" />
          </a>
          <span className={styles.connection} aria-hidden="true">
            <Terminal size={18} />
            <span />
            <BookOpen size={18} />
          </span>
          <p className={styles.quiet}>
            Different views.
            <br />
            The same learning journey.
          </p>
        </aside>
      </div>
    </div>
  );
}
