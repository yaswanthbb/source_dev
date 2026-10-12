"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoadmapProgress } from "@/lib/hooks/use-roadmap-progress";
import { useUiMode } from "@/providers/ui-mode-provider";
import { sameLocation } from "@/lib/terminal/location";
import { resource } from "@/components/dashboard/gui-dashboard";
import { DataState } from "./roadmap-view";
import type {
  CurriculumLesson,
  CurriculumModule,
  LearningRoadmap,
} from "./roadmap-data";
import {
  loadKnowledgeCheck,
  quizError,
  submitQuizAnswer,
  type AnswerSelection,
} from "./quiz-client";
import { QuizView } from "./quiz-view";

export function GuiQuiz({
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
  const quiz = useQuery({
    queryKey: ["concepts", lesson.placement.conceptId, "quiz"],
    queryFn: ({ signal }) =>
      loadKnowledgeCheck(lesson.placement.conceptId, signal),
    retry: 1,
  });
  const progress = useRoadmapProgress(roadmap.id);
  const cache = useQueryClient();
  const busy = useRef(false);
  const answer = useMutation({
    mutationFn: (selection: AnswerSelection) => {
      if (!quiz.data)
        throw new Error("Load the knowledge check before answering.");
      return submitQuizAnswer(
        roadmap,
        name,
        entry,
        lesson,
        quiz.data,
        selection,
      );
    },
    retry: false,
    onSettled: async (_data, error) => {
      // A failed POST may have saved. Keep answering locked until the user
      // explicitly reviews fresh status; never infer that an attempt was free.
      await cache
        .invalidateQueries({
          predicate: (q) =>
            q.queryKey.includes("progress") ||
            ["gamification", "badges", "review"].includes(
              String(q.queryKey[0]),
            ) ||
            (q.queryKey[0] === "concepts" &&
              q.queryKey[1] === lesson.placement.conceptId &&
              (q.queryKey[2] === "quiz-status" ||
                (!error && q.queryKey[2] === "quiz"))),
        })
        .catch(() => {});
      busy.current = false;
    },
  });
  const { ready, location, setLocation } = useUiMode();
  useEffect(() => {
    if (
      ready &&
      contextReady &&
      quiz.data &&
      !quiz.isError &&
      !quiz.isFetching &&
      !sameLocation(location, lesson.location)
    )
      setLocation(lesson.location);
  }, [
    ready,
    contextReady,
    quiz.data,
    quiz.isError,
    quiz.isFetching,
    location,
    lesson.location,
    setLocation,
  ]);
  const unavailable = [401, 403, 404].includes(
    (quiz.error as { response?: { status?: number } })?.response?.status ?? 0,
  );
  const refresh = async () => {
    const result = await quiz.refetch();
    void progress.refetch();
    if (!result.isError) answer.reset();
  };
  return (
    <DataState
      source={resource(quiz)}
      label="Knowledge check"
      unavailable={unavailable}
    >
      {quiz.data && (
        <QuizView
          roadmap={roadmap}
          name={name}
          entry={entry}
          lesson={lesson}
          data={quiz.data}
          progress={resource(progress)}
          pending={answer.isPending}
          refreshing={quiz.isFetching}
          canAnswer={
            contextReady &&
            !quiz.isError &&
            !quiz.isFetching &&
            !progress.isError &&
            !progress.isFetching &&
            !answer.isError
          }
          outcome={answer.data}
          error={answer.error ? quizError(answer.error) : undefined}
          onAnswer={(selection) => {
            if (
              busy.current ||
              answer.isPending ||
              answer.isError ||
              quiz.isError ||
              quiz.isFetching ||
              !contextReady ||
              progress.isError ||
              progress.isFetching
            )
              return;
            busy.current = true;
            answer.mutate(selection);
          }}
          onRefresh={() => void refresh()}
          onNavigate={() => {
            if (!answer.isError) answer.reset();
          }}
        />
      )}
    </DataState>
  );
}
