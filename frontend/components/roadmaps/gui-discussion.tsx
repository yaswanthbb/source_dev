"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { sameLocation } from "@/lib/terminal/location";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import type {
  CurriculumLesson,
  CurriculumModule,
  LearningRoadmap,
} from "./roadmap-data";
import type { DiscussionSnapshot } from "./discussion-data";
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
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [recovered, setRecovered] = useState(false),
    [checked, setChecked] = useState<DiscussionSnapshot>(),
    [checking, setChecking] = useState(false),
    [checkError, setCheckError] = useState(""),
    [validated, setValidated] = useState(false);
  const cache = useQueryClient(),
    busy = useRef(false),
    key = [
      "concepts",
      lesson.placement.conceptId,
      "discussion",
      bound?.id ?? "unchecked",
      bound?.role ?? "unchecked",
    ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      loadDiscussion(
        lesson.placement.conceptId,
        signal,
        bound ?? undefined,
        session,
      ),
    enabled: !!session && !invalid && contextReady,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const freshlyChecked =
    source.isFetchedAfterMount &&
    !source.isError &&
    !source.isFetching &&
    !!source.data;
  useEffect(() => {
    if (freshlyChecked) setValidated(true);
  }, [freshlyChecked]);
  useEffect(() => {
    if (discussionUnavailable(source.error)) setInvalid(true);
  }, [source.error]);
  useEffect(() => {
    const changed = () => setInvalid(true),
      stored = (e: StorageEvent) => {
        if (e.key === null || e.key === "sd_token" || e.key === "sd_user")
          changed();
      };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
    };
  }, []);
  function current() {
    if (invalid || !session || getToken() !== session) {
      setInvalid(true);
      return false;
    }
    return true;
  }
  const write = useMutation({
    retry: false,
    mutationFn: (action: DiscussionAction) => {
      if (!current() || !source.data)
        throw new DiscussionFailure(
          "Load your current discussion before saving.",
          false,
          true,
        );
      return submitDiscussionAction(
        roadmap,
        name,
        entry,
        lesson,
        source.data,
        action,
        session,
      );
    },
    onSettled: async (data) => {
      try {
        if (data && current()) {
          if (data.checked) cache.setQueryData(key, data.checked);
          else
            await cache
              .invalidateQueries({ queryKey: key, exact: true })
              .catch(() => {});
          if (data.action.kind === "ask" && data.action.target === "ai")
            await cache
              .invalidateQueries({
                predicate: (q) => q.queryKey.includes("quota"),
              })
              .catch(() => {});
        }
      } finally {
        busy.current = false;
      }
    },
  });
  const { ready, location, setLocation } = useUiMode();
  const uncertain =
    write.error instanceof DiscussionFailure && write.error.uncertain;
  const unavailable =
    invalid ||
    !session ||
    getToken() !== session ||
    discussionUnavailable(source.error) ||
    (discussionUnavailable(write.error) && !checked);
  const data = checked ?? source.data;
  useEffect(() => {
    if (
      ready &&
      contextReady &&
      source.isFetchedAfterMount &&
      data &&
      !unavailable &&
      !source.isError &&
      !source.isFetching &&
      !sameLocation(location, lesson.location)
    )
      setLocation(lesson.location);
  }, [
    ready,
    contextReady,
    source.isFetchedAfterMount,
    data,
    unavailable,
    source.isError,
    source.isFetching,
    location,
    lesson.location,
    setLocation,
  ]);
  async function refresh() {
    if (busy.current || write.isPending || !current() || !contextReady) return;
    busy.current = true;
    setChecking(true);
    setChecked(undefined);
    setCheckError("");
    try {
      if (uncertain) {
        const value = await loadDiscussion(
          lesson.placement.conceptId,
          undefined,
          source.data?.viewer ?? bound ?? undefined,
          session,
        );
        if (current()) setChecked(value);
        return;
      }
      const result = await source.refetch();
      if (!current() || result.isError || !result.data) return;
      write.reset();
      return result.data;
    } catch (error) {
      if (discussionUnavailable(error)) setInvalid(true);
      setCheckError(
        "Saved threads couldn’t be checked. Keep actions paused and try the read-only check again.",
      );
    } finally {
      if (getToken() !== session) setInvalid(true);
      busy.current = false;
      setChecking(false);
    }
  }
  function adopt() {
    if (busy.current || !checked || !current()) return;
    const value = checked;
    cache.setQueryData(key, value);
    write.reset();
    setChecked(undefined);
    setRecovered(true);
    setCheckError("");
    return value;
  }
  const recoveryControls = (
    <>
      {checkError && <p role="alert">{checkError}</p>}
      <button
        type="button"
        disabled={
          checking ||
          write.isPending ||
          invalid ||
          !session ||
          getToken() !== session
        }
        onClick={() => void refresh()}
      >
        {checking ? "Checking…" : "Check saved threads"}
      </button>
      {checked && (
        <button
          type="button"
          disabled={checking || write.isPending}
          onClick={adopt}
        >
          Use checked threads and resume
        </button>
      )}
    </>
  );
  if (unavailable)
    return (
      <GuiFeedback kind="error" title="Discussion unavailable">
        <p>
          This lesson, account or privacy contract changed. Private and cached
          threads have been hidden.
        </p>
        {invalid || !session || getToken() !== session ? (
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        ) : (
          recoveryControls
        )}
      </GuiFeedback>
    );
  if (
    !contextReady ||
    source.isPending ||
    (!validated && !freshlyChecked && !checked && !source.isError)
  )
    return <ModeAwareLoader guiTitle="Checking current lesson discussion" />;
  if (!data || (!validated && !freshlyChecked && !checked))
    return (
      <GuiFeedback kind="error" title="Discussion couldn’t load">
        <p>{discussionError(source.error)}</p>
        {recoveryControls}
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
        </GuiFeedback>
      )}
      {checkError && (
        <GuiFeedback kind="error" title="Saved threads couldn’t be checked">
          <p>{checkError}</p>
        </GuiFeedback>
      )}
      <DiscussionView
        roadmap={roadmap}
        entry={entry}
        lesson={lesson}
        data={data}
        pending={write.isPending}
        refreshing={source.isFetching || checking}
        canWrite={
          contextReady &&
          !source.isError &&
          !source.isFetching &&
          !checking &&
          !uncertain &&
          !checked
        }
        error={write.error ? discussionError(write.error) : undefined}
        uncertain={uncertain}
        recovered={recovered}
        checked={!!checked}
        outcome={write.data}
        onRefresh={refresh}
        onAdopt={adopt}
        onAction={(action) => {
          if (
            busy.current ||
            write.isPending ||
            source.isError ||
            source.isFetching ||
            !contextReady ||
            uncertain ||
            checked ||
            !current()
          )
            return;
          busy.current = true;
          setCheckError("");
          write.mutate(action);
        }}
      />
    </>
  );
}
