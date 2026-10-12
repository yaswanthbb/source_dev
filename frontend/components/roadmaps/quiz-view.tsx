"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  LockKeyhole,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import type {
  Resource,
  RoadmapProgressData,
} from "@/components/dashboard/dashboard-data";
import {
  lessonRoute,
  moduleRoute,
  type CurriculumLesson,
  type CurriculumModule,
  type LearningRoadmap,
} from "./roadmap-data";
import {
  questionFingerprint,
  quizActionBlock,
  type KnowledgeCheck,
  type QuestionStatus,
  type QuizQuestion,
} from "./quiz-data";
import type { AnswerSelection, SavedAnswer } from "./quiz-client";
import { LearningCliLink } from "./roadmap-view";
import shared from "./roadmaps.module.css";
import styles from "./quiz.module.css";

type QuizProps = {
  roadmap: LearningRoadmap;
  name: string;
  entry: CurriculumModule;
  lesson: CurriculumLesson;
  data: KnowledgeCheck;
  progress: Resource<RoadmapProgressData>;
  pending?: boolean;
  refreshing?: boolean;
  canAnswer?: boolean;
  outcome?: SavedAnswer;
  error?: string;
  onAnswer(selection: AnswerSelection): void;
  onRefresh(): void;
  onNavigate?(): void;
};
function QuestionCard({
  question,
  status,
  index,
  total,
  blocked,
  pending,
  outcome,
  onAnswer,
}: {
  question: QuizQuestion;
  status: QuestionStatus;
  index: number;
  total: number;
  blocked?: string;
  pending: boolean;
  outcome?: SavedAnswer;
  onAnswer(selection: AnswerSelection): void;
}) {
  const [selected, setSelected] = useState("");
  const feedback = useRef<HTMLDivElement>(null);
  const saved =
    outcome?.questionId === question.id &&
    outcome.fingerprint === questionFingerprint(question)
      ? outcome
      : undefined;
  useEffect(() => {
    if (saved) feedback.current?.focus({ preventScroll: true });
  }, [saved]);
  const resolved =
    status.isResolved ||
    !!saved?.result.isCorrect ||
    saved?.result.attemptsRemaining === 0;
  const correctId = resolved
    ? (status.correctOptionId ?? saved?.result.correctOptionId)
    : undefined;
  return (
    <section
      className={styles.question}
      aria-labelledby="quiz-question-title"
      aria-busy={pending}
    >
      <p className={styles.eyebrow}>
        Question {index + 1} of {total}
      </p>
      <h2 id="quiz-question-title" tabIndex={-1}>
        {question.questionText}
      </h2>
      <p id="quiz-answer-hint" className={styles.hint}>
        {resolved
          ? status.isCorrect || saved?.result.isCorrect
            ? "Answered correctly · saved"
            : "Resolved · no attempts left"
          : `${status.attemptsRemaining} ${status.attemptsRemaining === 1 ? "attempt" : "attempts"} remaining. Choose one answer.`}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected && !blocked && !pending && !resolved)
            onAnswer({ questionId: question.id, selectedOptionId: selected });
        }}
      >
        <fieldset
          disabled={pending || resolved || !!blocked}
          aria-describedby="quiz-answer-hint quiz-submit-hint"
        >
          <legend className={styles.srOnly}>Choose your answer</legend>
          <div className={styles.options}>
            {question.options.map((option, i) => (
              <label
                key={option.id}
                className={styles.option}
                data-selected={selected === option.id || undefined}
                data-correct={correctId === option.id || undefined}
              >
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                <span className={styles.optionIndex} aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>
                  {option.optionText}
                  {correctId === option.id && (
                    <small>
                      <Check size={14} aria-hidden="true" /> Correct answer
                    </small>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {saved && (
          <GuiFeedback
            ref={feedback}
            kind={saved.result.isCorrect ? "success" : "info"}
            title={
              saved.result.isCorrect
                ? "That’s right. Answer saved."
                : saved.result.attemptsRemaining
                  ? "Not quite. Your attempt was saved."
                  : "No attempts left. Answer resolved."
            }
          >
            <p>
              {saved.result.isCorrect
                ? "You can move to the next question."
                : saved.result.attemptsRemaining
                  ? `${saved.result.attemptsRemaining} ${saved.result.attemptsRemaining === 1 ? "attempt remains" : "attempts remain"}. Revisit the lesson or choose another answer.`
                  : "Revisit the lesson to connect this answer with the explanation."}
            </p>
          </GuiFeedback>
        )}
        {resolved && !correctId && (
          <p className={styles.hint}>
            The correct answer isn’t available in this response. Refresh the
            check or revisit the lesson.
          </p>
        )}
        {!resolved && (
          <>
            <p id="quiz-submit-hint" className={styles.hint}>
              {blocked ||
                (selected
                  ? "Only Check answer spends an attempt. Selection alone doesn’t save."
                  : "Select an option to check your answer.")}
            </p>
            <button
              className={shared.primary}
              type="submit"
              disabled={!selected || !!blocked || pending}
            >
              {pending ? "Checking and saving…" : "Check answer"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </form>
    </section>
  );
}
export function QuizView({
  roadmap,
  name,
  entry,
  lesson,
  data,
  progress,
  pending = false,
  refreshing = false,
  canAnswer = true,
  outcome,
  error,
  onAnswer,
  onRefresh,
  onNavigate,
}: QuizProps) {
  const [at, setAt] = useState(() =>
    Math.max(
      0,
      data.questions.findIndex(
        (q) =>
          !data.status.questions.find((s) => s.questionId === q.id)?.isResolved,
      ),
    ),
  );
  const errorRef = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLDivElement>(null);
  const firstQuestion = useRef(true);
  useEffect(() => {
    if (error) errorRef.current?.focus({ preventScroll: true });
  }, [error]);
  const index = Math.min(at, Math.max(0, data.questions.length - 1));
  useEffect(() => {
    if (firstQuestion.current) {
      firstQuestion.current = false;
      return;
    }
    heading.current
      ?.querySelector<HTMLHeadingElement>("#quiz-question-title")
      ?.focus();
  }, [index]);
  const question = data.questions[index];
  const status =
    question && data.status.questions.find((s) => s.questionId === question.id);
  const resolvedCount = data.status.questions.filter(
    (s) => s.isResolved,
  ).length;
  const correctCount = data.status.questions.filter((s) => s.isCorrect).length;
  const completed =
    !progress.error &&
    !progress.refreshing &&
    progress.data?.concepts?.some(
      (p) =>
        p.conceptId === lesson.placement.conceptId && p.status === "completed",
    );
  const block = error
    ? "Refresh saved status before answering again."
    : !canAnswer
      ? "Confirming your current lesson and saved attempts before answering."
      : progress.error
        ? "Refresh roadmap progress before answering."
        : quizActionBlock(lesson, data, progress.data);
  const go = (next: number) => {
    if (pending) return;
    setAt(next);
    onNavigate?.();
  };
  return (
    <div className={styles.page}>
      <nav aria-label="Learning breadcrumb" className={shared.breadcrumb}>
        <Link href="/developer/roadmaps">Roadmaps</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/developer/roadmaps/${encodeURIComponent(name)}`}>
          {roadmap.title}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={moduleRoute(entry.location)}>{entry.module.title}</Link>
        <span aria-hidden="true">/</span>
        <Link href={lessonRoute(lesson.location)}>{data.content.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Knowledge check</span>
      </nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <CircleHelp size={15} aria-hidden="true" /> Close the loop
        </p>
        <h1>Put the idea to work.</h1>
        <p>{data.content.title}</p>
      </header>
      <div className={styles.layout}>
        <div className={styles.main} ref={heading} tabIndex={-1}>
          {error && (
            <GuiFeedback
              ref={errorRef}
              kind="error"
              title="Answer couldn’t be confirmed"
            >
              <p>{error}</p>
              <p>
                Counts below are the last confirmed status, not a new attempt
                balance.
              </p>
              <button
                type="button"
                onClick={onRefresh}
                disabled={pending || refreshing}
              >
                {refreshing ? "Checking saved status…" : "Refresh saved status"}
              </button>
            </GuiFeedback>
          )}
          {refreshing && (
            <p role="status" className={styles.hint}>
              Checking your saved attempts…
            </p>
          )}
          {progress.error && (
            <GuiFeedback kind="error" title="Roadmap progress unavailable">
              <p>Answering is paused until current progress can be checked.</p>
              <button
                type="button"
                onClick={progress.retry}
                disabled={!!progress.refreshing}
              >
                {progress.refreshing ? "Refreshing…" : "Refresh progress"}
              </button>
            </GuiFeedback>
          )}
          {!data.questions.length ? (
            <div className={styles.empty}>
              <BookMark />
              <h2>No knowledge check attached.</h2>
              <p>
                This lesson doesn’t have questions. Return to the reader to mark
                it complete when its prerequisites are ready.
              </p>
              <Link
                className={shared.primary}
                href={lessonRoute(lesson.location)}
              >
                Back to the lesson <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              {data.status.allQuestionsResolved && (
                <GuiFeedback kind="success" title="Knowledge check resolved">
                  <p>
                    {correctCount} of {data.questions.length} answered
                    correctly.{" "}
                    {completed
                      ? "Roadmap progress confirms this lesson is complete."
                      : "Refresh roadmap progress to confirm lesson completion."}{" "}
                    Questions resolved by exhausting attempts aren’t counted as
                    correct.
                  </p>
                </GuiFeedback>
              )}
              {question && status && (
                <QuestionCard
                  key={questionFingerprint(question)}
                  question={question}
                  status={status}
                  index={index}
                  total={data.questions.length}
                  blocked={block}
                  pending={pending}
                  outcome={outcome}
                  onAnswer={onAnswer}
                />
              )}
              <nav
                className={styles.navigation}
                aria-label="Question navigation"
              >
                <button
                  className={shared.secondary}
                  type="button"
                  onClick={() => go(index - 1)}
                  disabled={pending || index === 0}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Previous
                </button>
                {index + 1 < data.questions.length ? (
                  <button
                    className={shared.secondary}
                    type="button"
                    onClick={() => go(index + 1)}
                    disabled={pending}
                  >
                    {status?.isResolved ? "Next question" : "Skip for now"}{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    className={styles.returnLink}
                    href={lessonRoute(lesson.location)}
                  >
                    Return to lesson <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </nav>
            </>
          )}
        </div>
        <aside className={styles.summary} aria-label="Knowledge check progress">
          <p className={styles.eyebrow}>Your checkpoint</p>
          <h2>
            {resolvedCount}
            <span> / {data.questions.length}</span>
          </h2>
          <p>questions resolved</p>
          <progress
            max={data.questions.length || 1}
            value={resolvedCount}
            aria-label={`${resolvedCount} of ${data.questions.length} questions resolved`}
          />
          <p className={styles.correctCount}>
            <Check size={16} aria-hidden="true" /> {correctCount} answered
            correctly
          </p>
          <nav className={styles.questionList} aria-label="Choose a question">
            {data.questions.map((q, i) => {
              const s = data.status.questions.find(
                (s) => s.questionId === q.id,
              )!;
              return (
                <button
                  key={q.id}
                  type="button"
                  aria-current={index === i ? "step" : undefined}
                  disabled={pending}
                  onClick={() => go(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    Question {i + 1}
                    <small>
                      {s.isCorrect
                        ? "Correct"
                        : s.isResolved
                          ? "Out of attempts"
                          : `${s.attemptsRemaining} attempts left`}
                    </small>
                  </span>
                  {s.isCorrect ? (
                    <Check size={15} aria-hidden="true" />
                  ) : s.isResolved ? (
                    <LockKeyhole size={15} aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </nav>
          <p className={styles.hint}>
            Three attempts per question. Skipping and leaving won’t spend an
            attempt. Saved answers stay with your account.
          </p>
          <button
            className={styles.refresh}
            type="button"
            onClick={onRefresh}
            disabled={pending || refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh saved status"}
          </button>
          <Link
            className={styles.returnLink}
            href={lessonRoute(lesson.location)}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Revisit the explanation
          </Link>
          <LearningCliLink
            location={lesson.location}
            conceptId={lesson.placement.conceptId}
            quiz
          >
            Continue check in terminal
          </LearningCliLink>
        </aside>
      </div>
    </div>
  );
}
function BookMark() {
  return (
    <span className={styles.emptyIcon}>
      <CircleHelp size={28} aria-hidden="true" />
    </span>
  );
}
