import apiClient from "@/lib/api-client";
import {
  catalogEntries,
  curriculum,
  lessonRoute,
  type LearningRoadmap,
} from "@/components/roadmaps/roadmap-data";
import {
  parseReviewCounts,
  parseReviewItems,
  parseReviewResult,
  reviewFingerprint,
  type ReviewItem,
} from "./review-data";

export async function loadReviewQueue(signal?: AbortSignal) {
  const options = { signal, timeout: 12000 };
  const [items, counts] = await Promise.all([
    apiClient.get("/review/due", options),
    apiClient.get("/review/due-count", options),
  ]);
  // Separate reads can race another tab. Display both snapshots honestly;
  // never reconcile by inventing missing/unavailable histories.
  return {
    items: parseReviewItems(items.data),
    counts: parseReviewCounts(counts.data),
  };
}
export async function submitReviewAnswer(
  item: ReviewItem,
  selectedOptionId: string,
) {
  const current = parseReviewItems(
    (await apiClient.get("/review/due", { timeout: 12000 })).data,
  ).find((i) => i.id === item.id);
  if (!current || reviewFingerprint(current) !== reviewFingerprint(item))
    throw new Error(
      "This item or its schedule changed. Refresh the queue before answering again.",
    );
  if (!current.question.options.some((o) => o.id === selectedOptionId))
    throw new Error("Choose an option from this question.");
  // The legacy scheduler doesn't apply the FSRS shared visibility filter.
  // This read is a GUI safeguard, not a replacement for backend authorization.
  await apiClient.get(
    `/concepts/${encodeURIComponent(current.question.conceptId)}`,
    { timeout: 12000 },
  );
  // Exactly one explicit write. Scheduling and XP come only from its acknowledgement.
  const response = await apiClient.post(
    `/review/${encodeURIComponent(item.id)}/answer`,
    { selectedOptionId },
    { timeout: 12000 },
  );
  try {
    return {
      item,
      selectedOptionId,
      result: parseReviewResult(response.data, item, selectedOptionId),
    };
  } catch {
    throw new Error(
      "The answer response was incomplete. It may already have been saved. Refresh the queue before continuing.",
    );
  }
}
export type SavedReview = Awaited<ReturnType<typeof submitReviewAnswer>>;
export function reviewError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 401 || status === 403)
    return "Your session or access changed. Sign in again if needed, then refresh the queue.";
  if (status === 404)
    return "This question is no longer available. Refresh the queue; its review history is retained.";
  if (status === 400)
    return "This item may already have been reviewed or its options changed. Refresh the queue before continuing.";
  if (
    error instanceof Error &&
    !(error as { isAxiosError?: boolean }).isAxiosError
  )
    return error.message;
  return "The answer couldn’t be confirmed. It may already have been saved. Refresh the queue before continuing; don’t submit it again yet.";
}
// Explicit read-only navigation: resolve a real visible placement, not a guessed slug.
export async function reviewLessonRoute(
  conceptId: string,
  signal?: AbortSignal,
) {
  const deadline = Date.now() + 12000;
  const read = <T>(path: string) => {
    const timeout = deadline - Date.now();
    if (timeout <= 0)
      throw new Error(
        "Finding the lesson took too long. Try again or browse your roadmaps.",
      );
    return apiClient.get<T>(path, { signal, timeout });
  };
  await read(`/concepts/${encodeURIComponent(conceptId)}`);
  const catalog = (await read<LearningRoadmap[]>("/roadmaps")).data;
  for (const { roadmap, name } of catalogEntries(catalog)) {
    const detail = (
      await read<LearningRoadmap>(`/roadmaps/${encodeURIComponent(roadmap.id)}`)
    ).data;
    for (const entry of curriculum(detail, name)) {
      const lesson = entry.concepts.find(
        (c) => c.placement.conceptId === conceptId,
      );
      if (lesson) return lessonRoute(lesson.location);
    }
  }
  throw new Error(
    "No visible roadmap placement was found for this lesson. Browse your roadmaps or try again later.",
  );
}
