"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useRoadmapProgress } from "@/lib/hooks/use-roadmap-progress";
import { resource } from "@/components/dashboard/gui-dashboard";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { useUiMode } from "@/providers/ui-mode-provider";
import { sameLocation } from "@/lib/terminal/location";
import { DataState } from "./roadmap-view";
import {
  findLesson,
  findModule,
  type CurriculumModule,
  type CurriculumLesson,
  type LearningRoadmap,
} from "./roadmap-data";
import {
  completionBlock,
  type LessonContent,
  type QuizStatus,
} from "./lesson-data";
import { LessonView } from "./lesson-view";

export async function saveLessonCompletion(
  roadmap: LearningRoadmap,
  name: string,
  entry: CurriculumModule,
  lesson: CurriculumLesson,
) {
  const options = { timeout: 12000 };
  // The completion endpoint itself doesn't enforce quiz/prerequisites. Never
  // trust cached button state: recheck visible placement and current gates first.
  const [currentRoadmap, content, progress, quiz] = await Promise.all([
    apiClient.get<LearningRoadmap>(`/roadmaps/${roadmap.id}`, options),
    apiClient.get<LessonContent>(
      `/concepts/${lesson.placement.conceptId}`,
      options,
    ),
    apiClient.get<Parameters<typeof completionBlock>[2]>(
      `/roadmaps/${roadmap.id}/progress`,
      options,
    ),
    apiClient.get<QuizStatus>(
      `/concepts/${lesson.placement.conceptId}/quiz-status`,
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
  const block = completionBlock(
    currentLesson,
    content.data,
    progress.data,
    quiz.data,
  );
  if (block) throw new Error(block);
  return apiClient.post(
    `/concepts/${lesson.placement.conceptId}/complete`,
    {},
    options,
  );
}
function actionError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  if (status === 404)
    return "This lesson is no longer available. Refresh the module.";
  if (status === 401 || status === 403)
    return "Your session or access changed. Sign in again if needed.";
  if (
    error instanceof Error &&
    !(error as { isAxiosError?: boolean }).isAxiosError
  )
    return error.message;
  return "The request failed. Refresh progress before retrying; a timed-out request may already have saved.";
}
export function GuiLesson({
  roadmap,
  name,
  entry,
  lesson,
  contextReady = true,
}: {
  roadmap: LearningRoadmap;
  name: string;
  entry: CurriculumModule;
  lesson: CurriculumLesson;
  contextReady?: boolean;
}) {
  const content = useQuery<LessonContent>({
    queryKey: ["concepts", lesson.placement.conceptId, "lesson"],
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<LessonContent>(
          `/concepts/${lesson.placement.conceptId}`,
          { signal, timeout: 12000 },
        )
      ).data,
    retry: 1,
  });
  const quiz = useQuery<QuizStatus>({
    queryKey: ["concepts", lesson.placement.conceptId, "quiz-status"],
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<QuizStatus>(
          `/concepts/${lesson.placement.conceptId}/quiz-status`,
          { signal, timeout: 12000 },
        )
      ).data,
    enabled: !!content.data && !content.isError,
    retry: 1,
  });
  const progress = useRoadmapProgress(roadmap.id);
  const cache = useQueryClient();
  const refreshProgress = () => {
    void cache
      .invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes("progress") ||
          ["gamification", "badges", "review"].includes(
            String(query.queryKey[0]),
          ),
      })
      .catch(() => {});
  };
  const start = useMutation({
    mutationFn: () =>
      apiClient.post(
        `/concepts/${lesson.placement.conceptId}/start`,
        {},
        { timeout: 12000 },
      ),
    retry: false,
    onSuccess: refreshProgress,
  });
  const complete = useMutation({
    mutationFn: () => saveLessonCompletion(roadmap, name, entry, lesson),
    retry: false,
    onSuccess: refreshProgress,
  });
  const started = useRef(false);
  const { mutate: startReading } = start;
  const { ready, location, setLocation } = useUiMode();
  const unavailable = [401, 403, 404].includes(
    (content.error as { response?: { status?: number } })?.response?.status ??
      0,
  );
  useEffect(() => {
    if (
      !contextReady ||
      content.isFetching ||
      !content.data ||
      content.isError ||
      content.data.id !== lesson.placement.conceptId
    )
      return;
    if (ready && !sameLocation(location, lesson.location))
      setLocation(lesson.location);
    if (
      !started.current &&
      content.data.reviewStatus === "approved" &&
      content.data.content?.trim()
    ) {
      started.current = true;
      startReading();
    }
  }, [
    content.data,
    content.isError,
    content.isFetching,
    contextReady,
    lesson,
    ready,
    location,
    setLocation,
    startReading,
  ]);
  return (
    <DataState
      source={resource(content)}
      label="Lesson"
      unavailable={unavailable}
    >
      {content.data &&
        (content.data.id === lesson.placement.conceptId ? (
          <LessonView
            roadmap={roadmap}
            name={name}
            entry={entry}
            lesson={lesson}
            content={content.data}
            progress={resource(progress)}
            quiz={resource(quiz)}
            start={{
              pending: start.isPending,
              error: start.error ? actionError(start.error) : undefined,
              success: start.isSuccess,
              run: () => start.mutate(),
            }}
            complete={{
              pending: complete.isPending,
              error: complete.error ? actionError(complete.error) : undefined,
              success: complete.isSuccess,
              run: () => complete.mutate(),
            }}
            canSave={contextReady && !content.isFetching && !content.isError}
          />
        ) : (
          <GuiFeedback kind="error" title="Lesson response didn’t match">
            <p>Refresh this module before continuing.</p>
          </GuiFeedback>
        ))}
    </DataState>
  );
}
