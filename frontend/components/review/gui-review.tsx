"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { toCliRoute } from "@/lib/terminal/location";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { resource } from "@/components/dashboard/gui-dashboard";
import { DataState } from "@/components/roadmaps/roadmap-view";
import { ReviewView } from "./review-view";
import {
  loadReviewQueue,
  reviewError,
  reviewLessonRoute,
  submitReviewAnswer,
  type SavedReview,
} from "./review-client";
import { reconcileReviewBatch, type ReviewItem } from "./review-data";

export function GuiReview() {
  const router = useRouter(),
    cache = useQueryClient();
  const user = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async ({ signal }) =>
      (await apiClient.get<User>("/users/me", { signal, timeout: 12000 })).data,
    retry: 1,
  });
  const queue = useQuery({
    queryKey: ["review", "queue"],
    queryFn: ({ signal }) => loadReviewQueue(signal),
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const [remaining, setRemaining] = useState<ReviewItem[] | null>(null);
  const [history, setHistory] = useState<SavedReview[]>([]);
  const [notice, setNotice] = useState<string>();
  const busy = useRef(false);
  const mounted = useRef(true),
    lessonAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      lessonAbort.current?.abort();
    };
  }, []);
  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [remaining]);
  const answer = useMutation({
    mutationFn: (option: string) => {
      if (!remaining?.[0]) throw new Error("Start a session before answering.");
      return submitReviewAnswer(remaining[0], option);
    },
    retry: false,
    onSuccess: (saved) =>
      setHistory((old) =>
        old.some((h) => h.item.id === saved.item.id) ? old : [...old, saved],
      ),
    onSettled: async () => {
      // Do not replace the frozen batch or auto-retry an uncertain write.
      await cache
        .invalidateQueries({
          predicate: (q) =>
            ["gamification", "badges"].includes(String(q.queryKey[0])) ||
            (q.queryKey[0] === "review" && q.queryKey[1] !== "queue"),
        })
        .catch(() => {});
      busy.current = false;
    },
  });
  const lesson = useMutation({
    mutationFn: (id: string) => {
      lessonAbort.current?.abort();
      lessonAbort.current = new AbortController();
      return reviewLessonRoute(id, lessonAbort.current.signal);
    },
    retry: false,
    onSuccess: (route) => {
      if (mounted.current) router.push(route);
    },
  });
  const refresh = async () => {
    if (busy.current || answer.isPending) return;
    busy.current = true;
    try {
      const fresh = await queue.refetch();
      if (!fresh.isError && fresh.data) {
        if (remaining !== null) {
          const savedIds = new Set(history.map((h) => h.item.id));
          const next = reconcileReviewBatch(
            remaining,
            savedIds,
            fresh.data.items,
          );
          setRemaining(next);
          setNotice(
            "Only items still present in the fresh queue remain in this batch. Removed or rescheduled items aren’t counted as confirmed answers.",
          );
        }
        answer.reset();
      }
    } finally {
      busy.current = false;
    }
  };
  const finish = () => {
    if (busy.current || answer.isPending) return;
    setRemaining(null);
    answer.reset();
    setNotice(undefined);
    void queue.refetch();
  };
  const unavailable = [401, 403, 404].includes(
    (queue.error as { response?: { status?: number } })?.response?.status ?? 0,
  );
  return (
    <GuiWorkspaceShell user={user.data} section="Reviews">
      <DataState
        source={resource(queue)}
        label="Review queue"
        unavailable={unavailable}
      >
        {queue.data && (
          <ReviewView
            queue={queue.data}
            remaining={remaining}
            history={history}
            outcome={answer.data}
            pending={answer.isPending}
            refreshing={queue.isFetching}
            blocked={
              queue.isError ||
              answer.isError ||
              queue.isFetching ||
              lesson.isPending
            }
            error={answer.error ? reviewError(answer.error) : undefined}
            notice={notice}
            lessonError={
              lesson.error
                ? "The lesson link couldn’t be resolved. Try again or choose it from your visible roadmaps."
                : undefined
            }
            lessonPending={lesson.isPending}
            onStart={() => {
              if (
                busy.current ||
                queue.isError ||
                queue.isFetching ||
                lesson.isPending ||
                !queue.data
              )
                return;
              setRemaining(
                queue.data.items.filter((i) => i.question.options.length >= 2),
              );
              setHistory([]);
              answer.reset();
              setNotice(undefined);
            }}
            onAnswer={(option) => {
              if (
                busy.current ||
                answer.isPending ||
                answer.isError ||
                answer.data ||
                queue.isError ||
                queue.isFetching ||
                lesson.isPending
              )
                return;
              busy.current = true;
              answer.mutate(option);
            }}
            onNext={() => {
              if (busy.current || advancing.current || !answer.data) return;
              advancing.current = true;
              setRemaining((old) => old?.slice(1) ?? null);
              answer.reset();
            }}
            onFinish={finish}
            onRefresh={() => void refresh()}
            onLesson={(id) => {
              if (!lesson.isPending && !answer.isPending) lesson.mutate(id);
            }}
          />
        )}
      </DataState>
    </GuiWorkspaceShell>
  );
}
export function ReviewPage() {
  const { ready, isCli, location } = useUiMode();
  const router = useRouter(),
    guiWasShown = useRef(false);
  useEffect(() => {
    if (ready && !isCli) guiWasShown.current = true;
  }, [ready, isCli]);
  useEffect(() => {
    if (!ready || !isCli || guiWasShown.current) return;
    const base = toCliRoute(location, "developer");
    router.replace(`${base}${base.includes("?") ? "&" : "?"}view=review`);
  }, [ready, isCli, location, router]);
  // Review is a workspace view, not a filesystem move. Never overwrite lastLocation.
  if (!ready || isCli) return <ModeAwareLoader />;
  return <GuiReview />;
}
