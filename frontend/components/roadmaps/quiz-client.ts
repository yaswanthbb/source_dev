import apiClient from "@/lib/api-client";
import {
  findLesson,
  findModule,
  type CurriculumLesson,
  type CurriculumModule,
  type LearningRoadmap,
} from "./roadmap-data";
import type { RoadmapProgressData } from "@/lib/hooks/use-roadmap-progress";
import type { LessonContent } from "./lesson-data";
import {
  parseAttemptResult,
  parseKnowledgeCheck,
  questionFingerprint,
  quizActionBlock,
  type KnowledgeCheck,
} from "./quiz-data";

export async function loadKnowledgeCheck(
  conceptId: string,
  signal?: AbortSignal,
) {
  const options = { timeout: 12000, signal };
  // Quiz endpoints don't enforce the shared visibility predicate themselves.
  // Read the guarded lesson first; this is a GUI safeguard, not authorization.
  const content = (
    await apiClient.get<LessonContent>(
      `/concepts/${encodeURIComponent(conceptId)}`,
      options,
    )
  ).data;
  if (content.id !== conceptId)
    throw new Error("The lesson response didn’t match. Refresh the module.");
  const [questions, status] = await Promise.all([
    apiClient.get(
      `/concepts/${encodeURIComponent(conceptId)}/questions`,
      options,
    ),
    apiClient.get(
      `/concepts/${encodeURIComponent(conceptId)}/quiz-status`,
      options,
    ),
  ]);
  return parseKnowledgeCheck(content, questions.data, status.data);
}
export interface AnswerSelection {
  questionId: string;
  selectedOptionId: string;
}
export async function submitQuizAnswer(
  roadmap: LearningRoadmap,
  name: string,
  entry: CurriculumModule,
  lesson: CurriculumLesson,
  snapshot: KnowledgeCheck,
  selection: AnswerSelection,
) {
  const options = { timeout: 12000 };
  const [currentRoadmap, current, progress] = await Promise.all([
    apiClient.get<LearningRoadmap>(
      `/roadmaps/${encodeURIComponent(roadmap.id)}`,
      options,
    ),
    loadKnowledgeCheck(lesson.placement.conceptId),
    apiClient.get<RoadmapProgressData>(
      `/roadmaps/${encodeURIComponent(roadmap.id)}/progress`,
      options,
    ),
  ]);
  const currentModule = findModule(currentRoadmap.data, name, entry.module.id);
  const currentLesson =
    currentModule && findLesson(currentModule, lesson.placement.id);
  if (
    !currentLesson ||
    currentLesson.placement.conceptId !== lesson.placement.conceptId
  )
    throw new Error(
      "This lesson placement is no longer available. Return to the module.",
    );
  const block = quizActionBlock(currentLesson, current, progress.data);
  if (block) throw new Error(block);
  const question = current.questions.find((q) => q.id === selection.questionId);
  const oldQuestion = snapshot.questions.find(
    (q) => q.id === selection.questionId,
  );
  const status = current.status.questions.find(
    (q) => q.questionId === selection.questionId,
  );
  const oldStatus = snapshot.status.questions.find(
    (q) => q.questionId === selection.questionId,
  );
  if (
    !question ||
    !oldQuestion ||
    !status ||
    !oldStatus ||
    questionFingerprint(question) !== questionFingerprint(oldQuestion) ||
    status.attemptsUsed !== oldStatus.attemptsUsed ||
    status.isResolved ||
    status.attemptsRemaining < 1
  )
    throw new Error(
      "Your question or saved attempts changed. Refresh the check before answering again.",
    );
  if (!question.options.some((o) => o.id === selection.selectedOptionId))
    throw new Error("Choose an option from the current question.");
  // Exactly one POST; never retry an attempt automatically after a timeout.
  const response = await apiClient.post(
    `/questions/${encodeURIComponent(question.id)}/attempt`,
    { selectedOptionId: selection.selectedOptionId },
    options,
  );
  try {
    return {
      ...selection,
      fingerprint: questionFingerprint(question),
      result: parseAttemptResult(
        response.data,
        question,
        selection.selectedOptionId,
        status,
      ),
    };
  } catch {
    throw new Error(
      "The answer response was incomplete. It may already have used an attempt. Refresh saved status before answering again.",
    );
  }
}
export type SavedAnswer = Awaited<ReturnType<typeof submitQuizAnswer>>;
export function quizError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 401 || status === 403)
    return "Your session or access changed. Sign in again if needed.";
  if (status === 404)
    return "This lesson, question or option is no longer available. Refresh the module.";
  if (status === 409)
    return "A newer question version is available. Refresh the check before answering.";
  if (status === 400)
    return "The server declined this answer. Check your saved attempts before continuing.";
  if (
    error instanceof Error &&
    !(error as { isAxiosError?: boolean }).isAxiosError
  )
    return error.message;
  return "The answer couldn’t be confirmed. It may already have used an attempt. Refresh saved status before answering again.";
}
