"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiMode } from "@/providers/ui-mode-provider";
import { sameLocation } from "@/lib/terminal/location";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import type {
  CurriculumLesson,
  CurriculumModule,
  LearningRoadmap,
} from "./roadmap-data";
import {
  DiscussionFailure,
  discussionError,
  discussionUnavailable,
  loadDiscussion,
  submitDiscussionAction,
  type DiscussionAction,
} from "./discussion-client";
import { DiscussionView } from "./discussion-view";

export function GuiDiscussion({
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
  const source = useQuery({
    queryKey: ["concepts", lesson.placement.conceptId, "discussion"],
    queryFn: ({ signal }) => loadDiscussion(lesson.placement.conceptId, signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const cache = useQueryClient(),
    busy = useRef(false);
  const [recovered, setRecovered] = useState(false);
  const write = useMutation({
    retry: false,
    mutationFn: (action: DiscussionAction) => {
      if (!source.data)
        throw new DiscussionFailure("Load discussion before saving.");
      return submitDiscussionAction(
        roadmap,
        name,
        entry,
        lesson,
        source.data,
        action,
      );
    },
    onSettled: async (data) => {
      // Only confirmed writes invalidate automatically. Uncertain writes need
      // an explicit fresh read; never replay any write on a refetch.
      if (data)
        await cache
          .invalidateQueries({
            predicate: (q) =>
              (q.queryKey[0] === "concepts" &&
                q.queryKey[1] === lesson.placement.conceptId &&
                q.queryKey[2] === "discussion") ||
              q.queryKey.includes("quota"),
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
      source.data &&
      !source.isError &&
      !source.isFetching &&
      !sameLocation(location, lesson.location)
    )
      setLocation(lesson.location);
  }, [
    ready,
    contextReady,
    source.data,
    source.isError,
    source.isFetching,
    location,
    lesson.location,
    setLocation,
  ]);
  const uncertain =
    write.error instanceof DiscussionFailure && write.error.uncertain;
  const unavailable =
    discussionUnavailable(source.error) || discussionUnavailable(write.error);
  const refresh = async () => {
    if (busy.current || write.isPending) return;
    const result = await source.refetch();
    if (result.isError || !result.data) return;
    if (uncertain) setRecovered(true);
    write.reset();
    return result.data;
  };
  if (source.isPending)
    return <ModeAwareLoader guiTitle="Loading lesson discussion" />;
  if (unavailable || !source.data)
    return (
      <GuiFeedback
        kind="error"
        title={
          unavailable ? "Discussion unavailable" : "Discussion couldn’t load"
        }
      >
        <p>
          {unavailable
            ? "This lesson, account or privacy contract changed. Private and cached threads have been hidden."
            : discussionError(source.error)}
        </p>
        <button
          type="button"
          disabled={source.isFetching}
          onClick={() => void refresh()}
        >
          {source.isFetching ? "Checking…" : "Reload discussion"}
        </button>
      </GuiFeedback>
    );
  return (
    <>
      {source.isError && (
        <GuiFeedback kind="error" title="Showing previously loaded threads">
          <p>
            The refresh failed. Posting is paused until a fresh read succeeds;
            your draft is kept.
          </p>
          <button
            type="button"
            disabled={source.isFetching}
            onClick={() => void refresh()}
          >
            Reload discussion
          </button>
        </GuiFeedback>
      )}
      <DiscussionView
        roadmap={roadmap}
        entry={entry}
        lesson={lesson}
        data={source.data}
        pending={write.isPending}
        refreshing={source.isFetching}
        canWrite={
          contextReady && !source.isError && !source.isFetching && !uncertain
        }
        error={write.error ? discussionError(write.error) : undefined}
        uncertain={uncertain}
        recovered={recovered}
        outcome={write.data}
        onRefresh={refresh}
        onAction={(action) => {
          if (
            busy.current ||
            write.isPending ||
            source.isError ||
            source.isFetching ||
            !contextReady ||
            uncertain
          )
            return;
          busy.current = true;
          write.mutate(action);
        }}
      />
    </>
  );
}
