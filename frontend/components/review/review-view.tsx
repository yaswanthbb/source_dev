"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { useUiMode } from "@/providers/ui-mode-provider";
import { toCliRoute } from "@/lib/terminal/location";
import type { SavedReview } from "./review-client";
import {
  reviewDate,
  reviewFingerprint,
  type ReviewItem,
  type ReviewQueue,
} from "./review-data";
import styles from "./review.module.css";

export function ReviewCliLink() {
  const { location, setMode } = useUiMode();
  const base = toCliRoute(location, "developer");
  return (
    <Link
      className={styles.textLink}
      href={`${base}${base.includes("?") ? "&" : "?"}view=review`}
      onClick={() => setMode("cli", { navigate: false })}
    >
      Review in terminal <span className={styles.badge}>CLI</span>
    </Link>
  );
}
function RecallMark() {
  return (
    <svg className={styles.recallMark} viewBox="0 0 180 180" aria-hidden="true">
      <circle cx="90" cy="90" r="72" />
      <path d="M127 66a44 44 0 1 0 7 38M127 43v23h-23" />
      <circle cx="90" cy="90" r="7" />
      <path d="M90 65v18M90 97v18M65 90h18M97 90h18" />
    </svg>
  );
}
function ReviewQuestion({
  item,
  pending,
  blocked,
  saved,
  onAnswer,
  onLesson,
  lessonPending,
}: {
  item: ReviewItem;
  pending: boolean;
  blocked: boolean;
  saved?: SavedReview;
  onAnswer(option: string): void;
  onLesson(conceptId: string): void;
  lessonPending: boolean;
}) {
  const [selected, setSelected] = useState("");
  const heading = useRef<HTMLHeadingElement>(null),
    feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (saved) feedback.current?.focus();
  }, [saved]);
  const leech = item.isLeech || saved?.result.isLeech;
  return (
    <section
      className={styles.question}
      aria-busy={pending}
      aria-labelledby="review-question-title"
    >
      <div className={styles.meta}>
        <span className={styles.eyebrow}>{item.question.conceptTitle}</span>
        <span>Due {reviewDate(item.dueDate)}</span>
      </div>
      <h2 ref={heading} id="review-question-title" tabIndex={-1}>
        {item.question.questionText}
      </h2>
      {leech && (
        <GuiFeedback kind="info" title="Give this idea another look">
          <p>
            This question has been difficult to retain. Revisit the lesson
            before trying again.
          </p>
          <button
            className={styles.textLink}
            type="button"
            disabled={pending || lessonPending}
            onClick={() => onLesson(item.question.conceptId)}
          >
            <BookOpen size={16} aria-hidden="true" />
            {lessonPending ? "Finding lesson…" : "Revisit lesson"}
          </button>
        </GuiFeedback>
      )}
      <p id="review-hint" className={styles.hint}>
        {saved
          ? "Answer saved. The server has updated this review’s schedule."
          : "Choose one answer. Submitting it updates this item’s review schedule."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selected && !blocked && !pending && !saved) onAnswer(selected);
        }}
      >
        <fieldset
          disabled={blocked || pending || !!saved}
          aria-describedby="review-hint"
        >
          <legend className={styles.srOnly}>Choose your answer</legend>
          <div className={styles.options}>
            {item.question.options.map((option, index) => (
              <label
                key={option.id}
                className={styles.option}
                data-selected={selected === option.id || undefined}
                data-correct={
                  saved?.result.correctOptionId === option.id || undefined
                }
              >
                <input
                  type="radio"
                  name={`review-${item.id}`}
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                <span className={styles.optionIndex}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>
                  {option.optionText}
                  {saved?.result.correctOptionId === option.id && (
                    <small>
                      <Check size={14} aria-hidden="true" />
                      Correct answer
                    </small>
                  )}
                  {saved?.selectedOptionId === option.id && (
                    <small>Your answer</small>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {!saved && (
          <button
            className={styles.primary}
            type="submit"
            disabled={!selected || blocked || pending}
          >
            {pending ? "Saving answer…" : "Submit answer"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </form>
      {saved && (
        <GuiFeedback
          ref={feedback}
          kind={saved.result.isCorrect ? "success" : "info"}
          title={
            saved.result.isCorrect
              ? "Correct · review saved"
              : "Not quite · review saved"
          }
        >
          {!saved.result.isCorrect && (
            <p>
              {saved.result.correctOptionId
                ? `Correct answer: ${item.question.options.find((o) => o.id === saved.result.correctOptionId)?.optionText}`
                : "The server did not return a correct answer."}
            </p>
          )}
          <p>
            Next review: <strong>{reviewDate(saved.result.nextDueDate)}</strong>{" "}
            · {saved.result.newIntervalDays}{" "}
            {saved.result.newIntervalDays === 1 ? "day" : "days"} · +
            {saved.result.xpAwarded} XP
          </p>
        </GuiFeedback>
      )}
    </section>
  );
}
export function ReviewView({
  queue,
  remaining,
  history = [],
  outcome,
  pending = false,
  refreshing = false,
  blocked = false,
  error,
  notice,
  lessonError,
  lessonPending = false,
  onStart,
  onFinish,
  onNext,
  onRefresh,
  onAnswer,
  onLesson,
}: {
  queue: ReviewQueue;
  remaining: ReviewItem[] | null;
  history?: SavedReview[];
  outcome?: SavedReview;
  pending?: boolean;
  refreshing?: boolean;
  blocked?: boolean;
  error?: string;
  notice?: string;
  lessonError?: string;
  lessonPending?: boolean;
  onStart(): void;
  onFinish(): void;
  onNext(): void;
  onRefresh(): void;
  onAnswer(option: string): void;
  onLesson(conceptId: string): void;
}) {
  const errorRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const remainingCount = remaining?.length;
  useEffect(() => {
    if (remainingCount === 0) summaryRef.current?.focus();
  }, [remainingCount]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const item = remaining?.[0],
    saved = outcome?.item.id === item?.id ? outcome : undefined;
  const ready = queue.items.filter((i) => i.question.options.length >= 2);
  const difficultCount =
    queue.counts.leechCount ??
    (queue.items.length > 0 && queue.items.every((i) => i.isLeech !== undefined)
      ? queue.items.filter((i) => i.isLeech).length
      : undefined);
  const concepts = new Map<
    string,
    { title: string; count: number; difficult: number }
  >();
  for (const i of ready) {
    const old = concepts.get(i.question.conceptId);
    concepts.set(i.question.conceptId, {
      title: i.question.conceptTitle,
      count: (old?.count ?? 0) + 1,
      difficult: (old?.difficult ?? 0) + Number(i.isLeech === true),
    });
  }
  const xp = history.reduce((sum, h) => sum + h.result.xpAwarded, 0);
  const answered = history.length;
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/developer/dashboard">
          <ArrowLeft size={15} aria-hidden="true" />
          Overview
        </Link>
        <ReviewCliLink />
      </div>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <RotateCcw size={16} aria-hidden="true" />
            The recall loop
          </p>
          <h1>
            {remaining === null
              ? "Make it stick."
              : "One idea. One more connection."}
          </h1>
          <p>
            {remaining === null
              ? "Return to what you’ve learned. Your review schedule decides what’s ready—not an endless feed."
              : "Take your time. Each saved answer sets the next time this idea returns."}
          </p>
        </div>
        <RecallMark />
      </header>
      {notice && (
        <GuiFeedback kind="info" title="Queue checked">
          <p>{notice}</p>
        </GuiFeedback>
      )}
      {lessonError && (
        <GuiFeedback kind="error" title="Lesson couldn’t open">
          <p>{lessonError}</p>
          <Link href="/developer/roadmaps" className={styles.textLink}>
            Browse roadmaps
          </Link>
        </GuiFeedback>
      )}
      {remaining === null ? (
        <>
          <div className={styles.stats} aria-label="Review queue counts">
            <div>
              <span>Total due</span>
              <strong>{queue.counts.dueCount}</strong>
              <small>Including held or unavailable histories</small>
            </div>
            <div>
              <span>In this session</span>
              <strong>{queue.items.length}</strong>
              <small>Returned by your review queue</small>
            </div>
            <div>
              <span>Needs another look</span>
              <strong>{difficultCount ?? "—"}</strong>
              <small>
                {difficultCount === undefined
                  ? "Not supplied by this scheduler"
                  : queue.counts.leechCount === undefined
                    ? "Difficult questions in this session"
                    : "Difficult questions across available due items"}
              </small>
            </div>
          </div>
          <div className={styles.layout}>
            <section
              className={styles.panel}
              aria-labelledby="review-queue-title"
            >
              <div className={styles.sectionHeading}>
                <h2 id="review-queue-title">
                  {ready.length
                    ? "Ready to revisit"
                    : queue.counts.dueCount === 0
                      ? "A little breathing room."
                      : "No answerable items right now."}
                </h2>
                <span className={styles.badge}>
                  {concepts.size} {concepts.size === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              {ready.length ? (
                <>
                  <p className={styles.hint}>
                    The server orders your questions. This overview groups them
                    by lesson; the session keeps their original order.
                  </p>
                  <ul className={styles.concepts}>
                    {[...concepts.entries()].map(([id, c], index) => (
                      <li key={id}>
                        <span className={styles.number}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{c.title}</h3>
                          <p>
                            {c.count} {c.count === 1 ? "question" : "questions"}
                            {c.difficult > 0
                              ? ` · ${c.difficult} needing another look`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.textLink}
                          disabled={lessonPending}
                          onClick={() => onLesson(id)}
                        >
                          Revisit lesson
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={blocked || refreshing}
                    onClick={onStart}
                  >
                    Start review
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.hint}>
                    {queue.counts.dueCount === 0
                      ? "Nothing is due right now. Completed lessons add questions to your schedule; come back when they’re ready."
                      : "Your due histories are retained, but the current queue has no questions you can answer. Refresh or return to learning."}
                  </p>
                  <Link href="/developer/roadmaps" className={styles.primary}>
                    Explore roadmaps
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </>
              )}
            </section>
            <aside className={styles.aside}>
              <h2>Learn. Connect. Recall.</h2>
              <p>
                Answer from memory. Revisit the lesson when an idea feels
                unfamiliar. Come back on its next due date.
              </p>
              {queue.counts.heldBackCount !== undefined &&
                queue.counts.heldBackCount > 0 && (
                  <p>
                    <strong>{queue.counts.heldBackCount}</strong> held for
                    another session.
                  </p>
                )}
              {queue.counts.unavailableCount !== undefined &&
                queue.counts.unavailableCount > 0 && (
                  <p>
                    <strong>{queue.counts.unavailableCount}</strong> unavailable
                    because their source is missing or not visible. History is
                    retained.
                  </p>
                )}
              {queue.items.length !== ready.length && (
                <p>
                  {queue.items.length - ready.length} returned questions have
                  too few answer options and won’t be submitted.
                </p>
              )}
              <button
                type="button"
                className={styles.secondary}
                onClick={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? "Checking queue…" : "Refresh queue"}
                <RotateCcw size={15} aria-hidden="true" />
              </button>
              <p className={styles.hint}>
                Counts and items are separate server snapshots and can change in
                another tab.
              </p>
            </aside>
          </div>
        </>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            {error && (
              <GuiFeedback
                ref={errorRef}
                kind="error"
                title="Answer not confirmed"
              >
                <p>{error}</p>
                <p>
                  No result or XP has been assumed. Check the queue before
                  continuing.
                </p>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={pending || refreshing}
                  onClick={onRefresh}
                >
                  {refreshing ? "Checking queue…" : "Check saved queue"}
                </button>
              </GuiFeedback>
            )}
            {item ? (
              <>
                <ReviewQuestion
                  key={reviewFingerprint(item)}
                  item={item}
                  pending={pending}
                  blocked={blocked || refreshing || !!error}
                  saved={saved}
                  onAnswer={onAnswer}
                  onLesson={onLesson}
                  lessonPending={lessonPending}
                />
                {saved && (
                  <button
                    className={styles.primary}
                    type="button"
                    onClick={onNext}
                    disabled={pending}
                  >
                    {remaining.length > 1
                      ? "Next question"
                      : "See session summary"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </>
            ) : (
              <section
                className={styles.panel}
                aria-labelledby="review-summary-title"
              >
                <Sparkles
                  size={28}
                  className={styles.orange}
                  aria-hidden="true"
                />
                <h2 ref={summaryRef} id="review-summary-title" tabIndex={-1}>
                  This session is finished.
                </h2>
                <p className={styles.hint}>
                  {answered} confirmed {answered === 1 ? "answer" : "answers"} ·
                  +{xp} XP. This is the end of this batch, not a claim that all
                  due histories are cleared.
                </p>
                {history.length > 0 && (
                  <ul className={styles.savedList}>
                    {history.map((h) => (
                      <li key={h.item.id}>
                        <span>{h.item.question.conceptTitle}</span>
                        <span>Next: {reviewDate(h.result.nextDueDate)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className={styles.primary}
                  onClick={onFinish}
                >
                  Back to queue
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </section>
            )}
          </div>
          <aside className={styles.aside}>
            <p className={styles.eyebrow}>Your session</p>
            <h2>{answered} saved</h2>
            <p>
              {remaining.length - Number(!!saved)} left in this batch · +{xp}{" "}
              confirmed XP
            </p>
            <p>
              There’s no need to rush. Saved answers stay on the server if you
              leave; unanswered items stay due.
            </p>
            <button
              className={styles.secondary}
              type="button"
              disabled={pending || refreshing}
              onClick={onFinish}
            >
              Finish for now
            </button>
            <ReviewCliLink />
          </aside>
        </div>
      )}
    </div>
  );
}
