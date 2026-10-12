import type { RoadmapProgressData } from "@/lib/hooks/use-roadmap-progress";
import type { CurriculumLesson } from "./roadmap-data";
import type { LessonContent, QuizStatus } from "./lesson-data";

export interface QuizQuestion {
  id: string;
  questionText: string;
  orderIndex: number;
  options: Array<{ id: string; optionText: string; orderIndex: number }>;
}
export interface QuestionStatus {
  questionId: string;
  attemptsUsed: number;
  attemptsRemaining: number;
  isCorrect: boolean;
  isResolved: boolean;
  correctOptionId?: string;
}
export interface KnowledgeCheckStatus extends QuizStatus {
  questions: QuestionStatus[];
}
export interface KnowledgeCheck {
  content: LessonContent;
  questions: QuizQuestion[];
  status: KnowledgeCheckStatus;
}
export interface AttemptResult {
  isCorrect: boolean;
  attemptNumber: number;
  attemptsRemaining: number;
  correctOptionId?: string;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  return value as Record<string, unknown>;
}
function fail(): never {
  throw new Error(
    "The knowledge check changed or returned incomplete data. Refresh before answering.",
  );
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) fail();
  return value;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 0 ||
    (value as number) > max
  )
    fail();
  return value as number;
}
function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") fail();
  return value;
}
// Project only student-facing fields. An author/admin response can contain the
// answer key and distractor metadata; never use those to grade or reveal early.
export function parseKnowledgeCheck(
  content: LessonContent,
  rawQuestions: unknown,
  rawStatus: unknown,
): KnowledgeCheck {
  if (!Array.isArray(rawQuestions)) fail();
  const questionIds = new Set<string>(),
    optionIds = new Set<string>();
  const questions = rawQuestions
    .map((raw) => {
      const q = record(raw),
        id = text(q.id);
      if (
        questionIds.has(id) ||
        (q.conceptId !== undefined && q.conceptId !== content.id)
      )
        fail();
      questionIds.add(id);
      if (!Array.isArray(q.options) || q.options.length < 2) fail();
      const options = q.options
        .map((rawOption) => {
          const o = record(rawOption),
            optionId = text(o.id);
          if (optionIds.has(optionId)) fail();
          optionIds.add(optionId);
          return {
            id: optionId,
            optionText: text(o.optionText),
            orderIndex: integer(o.orderIndex),
          };
        })
        .sort(
          (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
        );
      return {
        id,
        questionText: text(q.questionText),
        orderIndex: integer(q.orderIndex),
        options,
      };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
  const s = record(rawStatus);
  if (
    s.conceptId !== content.id ||
    !Array.isArray(s.questions) ||
    integer(s.totalQuestions) !== questions.length ||
    s.questions.length !== questions.length
  )
    fail();
  const seen = new Set<string>();
  const statuses = s.questions.map((raw) => {
    const r = record(raw),
      questionId = text(r.questionId);
    const question = questions.find((q) => q.id === questionId);
    if (
      !question ||
      seen.has(questionId) ||
      (r.questionText !== undefined && r.questionText !== question.questionText)
    )
      fail();
    seen.add(questionId);
    const attemptsUsed = integer(r.attemptsUsed, 3),
      attemptsRemaining = integer(r.attemptsRemaining, 3);
    const isCorrect = boolean(r.isCorrect),
      isResolved = boolean(r.isResolved);
    if (
      attemptsRemaining !== 3 - attemptsUsed ||
      isResolved !== (isCorrect || attemptsUsed === 3) ||
      (isCorrect && attemptsUsed === 0)
    )
      fail();
    const correctOptionId =
      isResolved &&
      typeof r.correctOptionId === "string" &&
      question.options.some((o) => o.id === r.correctOptionId)
        ? r.correctOptionId
        : undefined;
    return {
      questionId,
      attemptsUsed,
      attemptsRemaining,
      isCorrect,
      isResolved,
      correctOptionId,
    };
  });
  const allQuestionsResolved = boolean(s.allQuestionsResolved);
  if (
    allQuestionsResolved !==
    (questions.length > 0 && statuses.every((s) => s.isResolved))
  )
    fail();
  return {
    content,
    questions,
    status: {
      conceptId: content.id,
      totalQuestions: questions.length,
      allQuestionsResolved,
      questions: statuses,
    },
  };
}
export function parseAttemptResult(
  raw: unknown,
  question: QuizQuestion,
  selectedOptionId: string,
  previous: QuestionStatus,
): AttemptResult {
  const r = record(raw),
    isCorrect = boolean(r.isCorrect),
    attemptNumber = integer(r.attemptNumber, 3),
    attemptsRemaining = integer(r.attemptsRemaining, 3);
  if (
    attemptNumber !== previous.attemptsUsed + 1 ||
    attemptsRemaining !== 3 - attemptNumber
  )
    fail();
  const resolved = isCorrect || attemptsRemaining === 0;
  const correctOptionId =
    resolved &&
    typeof r.correctOptionId === "string" &&
    question.options.some((o) => o.id === r.correctOptionId)
      ? r.correctOptionId
      : undefined;
  if (isCorrect && correctOptionId && correctOptionId !== selectedOptionId)
    fail();
  return { isCorrect, attemptNumber, attemptsRemaining, correctOptionId };
}
export function questionFingerprint(question: QuizQuestion) {
  return JSON.stringify(question);
}
export function quizActionBlock(
  lesson: CurriculumLesson,
  data: KnowledgeCheck,
  progress?: RoadmapProgressData,
) {
  if (data.content.id !== lesson.placement.conceptId)
    return "The lesson response didn’t match. Refresh the module.";
  if (data.content.reviewStatus !== "approved")
    return "Author preview: only approved lessons accept learner attempts here.";
  if (!data.content.content?.trim())
    return "This lesson has no published content yet.";
  if (!progress?.concepts?.some((p) => p.conceptId === data.content.id))
    return "Current roadmap progress is needed before answering.";
  const missing = (lesson.placement.prerequisites ?? []).filter(
    (p) =>
      !progress.concepts?.some(
        (r) =>
          r.conceptId === p.prerequisiteConceptId && r.status === "completed",
      ),
  );
  if (missing.length)
    return `Complete the prerequisites first: ${missing.map((p) => p.title).join(", ")}.`;
  return undefined;
}
