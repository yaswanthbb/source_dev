"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { useUiMode } from "@/providers/ui-mode-provider";
import { toCliRoute } from "@/lib/terminal/location";
import { contentUnavailable } from "@/components/content/content-client";
import type { ContentLibrary } from "@/components/content/content-data";
import { loadRoadmapEditor } from "@/components/content/editor-client";
import {
  GenerationFailure,
  loadGenerationLibrary,
  loadGenerationSettings,
  loadGenerationFeed,
  loadGenerationJob,
  loadGenerationModels,
  startGeneration,
  markGenerationReviewed,
} from "./generation-client";
import {
  generationUuid,
  type GenerationRequest,
  type GenerationModels,
  type GenerationJob,
  type GenerationIntent,
} from "./generation-data";
import { GenerationView } from "./generation-view";

const message = (error: unknown) =>
  error instanceof GenerationFailure
    ? error.message
    : "This check couldn't finish. Keep your selections and recheck before making a change.";
export function GuiGeneration({ request }: { request: GenerationRequest }) {
  const cache = useQueryClient(),
    { setMode } = useUiMode(),
    busy = useRef(false);
  const libraryKey = ["generation", "library"];
  const [autoRefresh, setAutoRefresh] = useState(true);
  const seenResults = useRef<{ userId: string; ids: Set<string> } | undefined>(
    undefined,
  );
  const [roadmapId, setRoadmapId] = useState(request.roadmapId ?? ""),
    [watchedId, setWatchedId] = useState(request.jobId ?? ""),
    [lookupError, setLookupError] = useState<string>(),
    [checking, setChecking] = useState(false),
    [checkError, setCheckError] = useState<unknown>(),
    [checkVersion, setCheckVersion] = useState(0),
    [recovered, setRecovered] = useState(false),
    [catalog, setCatalog] = useState<GenerationModels>(),
    [modelsLoading, setModelsLoading] = useState(false),
    [modelsError, setModelsError] = useState<unknown>();
  const library = useQuery({
    queryKey: libraryKey,
    queryFn: ({ signal }) =>
      loadGenerationLibrary(
        signal,
        cache.getQueryData<ContentLibrary>(libraryKey)?.user,
      ),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const user = library.data?.user,
    enabled = !!user && !library.isError;
  const settings = useQuery({
    queryKey: ["generation", "settings", user?.id, user?.role],
    enabled,
    queryFn: ({ signal }) => loadGenerationSettings(user!, signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const jobs = useQuery({
    queryKey: ["generation", "jobs", user?.id, user?.role],
    enabled,
    queryFn: ({ signal }) => loadGenerationFeed(user!, signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      autoRefresh && !query.state.error ? 5000 : false,
    refetchIntervalInBackground: false,
  });
  const owned = library.data?.roadmaps.some(
    (r) => r.id === roadmapId && r.status !== "removed",
  );
  const target = useQuery({
    queryKey: ["generation", "target", user?.id, user?.role, roadmapId],
    enabled: enabled && !!owned,
    queryFn: ({ signal }) => loadRoadmapEditor(roadmapId, signal, user),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const watched = useQuery({
    queryKey: ["generation", "job", user?.id, user?.role, watchedId],
    enabled: enabled && !!watchedId,
    queryFn: ({ signal }) => loadGenerationJob(user!, watchedId, signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const write = useMutation({
    retry: false,
    mutationFn: async (
      action:
        | { kind: "start"; intent: GenerationIntent }
        | { kind: "review"; job: GenerationJob },
    ) => {
      if (!user) throw new GenerationFailure("Recheck your account first.");
      if (action.kind === "review")
        return markGenerationReviewed(user, action.job).then((job) => ({
          kind: "review" as const,
          job,
        }));
      if (!target.data || !settings.data || !jobs.data)
        throw new GenerationFailure(
          "Check the target, default key, quota and jobs first.",
        );
      return startGeneration(
        target.data,
        settings.data,
        action.intent,
        catalog,
      ).then((job) => ({ kind: "start" as const, job }));
    },
    onSuccess: async (result) => {
      setRecovered(false);
      setWatchedId(result.job.id);
      cache.setQueryData(
        ["generation", "job", user?.id, user?.role, result.job.id],
        result.job,
      );
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["generation", "jobs"] }),
        cache.invalidateQueries({ queryKey: ["generation", "settings"] }),
        cache.invalidateQueries({ queryKey: ["ai-jobs"] }),
        cache.invalidateQueries({ queryKey: ["ai", "quota"] }),
        cache.invalidateQueries({ queryKey: ["content"] }),
        cache.invalidateQueries({ queryKey: ["roadmaps"] }),
        cache.invalidateQueries({ queryKey: ["concepts"] }),
      ]).catch(() => {});
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  useEffect(() => {
    if (!jobs.data || jobs.isError) return;
    const ids = new Set(jobs.data.results.map((job) => job.id));
    const previous = seenResults.current;
    seenResults.current = {
      userId: jobs.data.user.id,
      ids: new Set([
        ...(previous?.userId === jobs.data.user.id ? previous.ids : []),
        ...ids,
      ]),
    };
    if (
      !previous ||
      previous.userId !== jobs.data.user.id ||
      ![...ids].some((id) => !previous.ids.has(id))
    )
      return;
    void Promise.all(
      ["content", "roadmaps", "concepts"]
        .map((name) => cache.invalidateQueries({ queryKey: [name] }))
        .concat([
          cache.invalidateQueries({ queryKey: ["generation", "library"] }),
          cache.invalidateQueries({ queryKey: ["generation", "target"] }),
          cache.invalidateQueries({ queryKey: ["generation", "settings"] }),
        ]),
    ).catch(() => {});
  }, [jobs.data, jobs.isError, cache]);
  const watchedIdentityError =
    watched.error instanceof GenerationFailure
      ? watched.error.unavailable
      : [401, 403].includes(
          (watched.error as { response?: { status?: number } })?.response
            ?.status ?? 0,
        );
  const errors = [
    library.error,
    settings.error,
    jobs.error,
    owned ? target.error : undefined,
    write.error,
    checkError,
    modelsError,
    watchedIdentityError ? watched.error : undefined,
  ];
  const hidden = errors.some(contentUnavailable);
  const uncertain =
    write.error instanceof GenerationFailure && write.error.uncertain;
  const blocked =
    hidden ||
    !!write.error ||
    !!checkError ||
    checking ||
    modelsLoading ||
    write.isPending;
  const canStart =
    !blocked &&
    !!owned &&
    !!library.data &&
    !library.isError &&
    !library.isFetching &&
    !!target.data &&
    !target.isError &&
    !target.isFetching &&
    !!settings.data &&
    !settings.isError &&
    !settings.isFetching &&
    !!jobs.data &&
    !jobs.isError &&
    !jobs.isFetching;
  async function recheck() {
    if (busy.current || write.isPending) return;
    busy.current = true;
    setChecking(true);
    try {
      const source = await library.refetch();
      if (source.isError || !source.data) throw source.error;
      const [newSettings, newJobs] = await Promise.all([
        loadGenerationSettings(source.data.user),
        loadGenerationFeed(source.data.user),
      ]);
      const selected = source.data.roadmaps.some(
        (r) => r.id === roadmapId && r.status !== "removed",
      );
      const newTarget = selected
        ? await loadRoadmapEditor(roadmapId, undefined, source.data.user)
        : undefined;
      const id =
        write.error instanceof GenerationFailure && write.error.jobId
          ? write.error.jobId
          : watched.isError
            ? ""
            : watchedId;
      const checkedJob = id
        ? await loadGenerationJob(source.data.user, id)
        : undefined;
      cache.setQueryData(
        ["generation", "settings", source.data.user.id, source.data.user.role],
        newSettings,
      );
      cache.setQueryData(
        ["generation", "jobs", source.data.user.id, source.data.user.role],
        newJobs,
      );
      if (newTarget)
        cache.setQueryData(
          [
            "generation",
            "target",
            source.data.user.id,
            source.data.user.role,
            roadmapId,
          ],
          newTarget,
        );
      if (checkedJob) {
        setWatchedId(checkedJob.id);
        cache.setQueryData(
          [
            "generation",
            "job",
            source.data.user.id,
            source.data.user.role,
            checkedJob.id,
          ],
          checkedJob,
        );
      }
      setRecovered(uncertain);
      setCheckError(undefined);
      setModelsError(undefined);
      setCheckVersion((v) => v + 1);
      write.reset();
    } catch (error) {
      setCheckError(error);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  async function models() {
    if (
      busy.current ||
      blocked ||
      !settings.data ||
      settings.isError ||
      settings.isFetching
    )
      return;
    busy.current = true;
    setModelsLoading(true);
    try {
      setCatalog(await loadGenerationModels(settings.data));
      setModelsError(undefined);
    } catch (error) {
      setModelsError(error);
    } finally {
      busy.current = false;
      setModelsLoading(false);
    }
  }
  const watchedHidden = contentUnavailable(watched.error);
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : user}
      section="AI generation & jobs"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Generation workspace unavailable">
          <p>
            Your account, ownership or generation data changed. Cached private
            data is hidden.
          </p>
          <button
            type="button"
            disabled={checking || write.isPending}
            onClick={() => void recheck()}
          >
            Recheck workspace access
          </button>
          <Link href="/developer/content">Open My content</Link>
        </GuiFeedback>
      ) : (
        <GenerationView
          request={request}
          library={library.data}
          libraryLoading={library.isPending}
          libraryError={library.error ? message(library.error) : undefined}
          settings={settings.data}
          settingsLoading={enabled && settings.isPending}
          settingsError={settings.error ? message(settings.error) : undefined}
          feed={jobs.data}
          jobsLoading={enabled && jobs.isPending}
          jobsError={jobs.error ? message(jobs.error) : undefined}
          jobsRefreshing={jobs.isFetching}
          selectedRoadmapId={roadmapId}
          target={owned && !target.isError ? target.data : undefined}
          targetLoading={!!owned && target.isPending}
          targetError={
            owned && target.error ? message(target.error) : undefined
          }
          catalog={catalog}
          modelsLoading={modelsLoading}
          modelsError={modelsError ? message(modelsError) : undefined}
          refreshing={checking || library.isFetching}
          pending={write.isPending}
          canStart={canStart}
          canReview={
            !blocked &&
            !library.isError &&
            !library.isFetching &&
            !!jobs.data &&
            !jobs.isError &&
            !jobs.isFetching
          }
          error={
            checkError
              ? message(checkError)
              : write.error
                ? message(write.error)
                : undefined
          }
          uncertain={uncertain}
          knownJobId={
            write.error instanceof GenerationFailure
              ? write.error.jobId
              : undefined
          }
          result={write.data}
          checkVersion={checkVersion}
          recovered={recovered}
          autoRefresh={autoRefresh}
          onAutoRefresh={setAutoRefresh}
          watched={watchedHidden ? undefined : watched.data}
          watchedLoading={!!watchedId && watched.isPending}
          watchedError={
            lookupError ?? (watched.error ? message(watched.error) : undefined)
          }
          onRoadmap={(value) => {
            if (busy.current || write.isPending) return;
            setRoadmapId(value);
          }}
          onCheck={() => void recheck()}
          onLoadModels={() => void models()}
          onStart={(intent) => {
            if (busy.current || !canStart) return;
            busy.current = true;
            write.mutate({ kind: "start", intent });
          }}
          onReview={(job) => {
            if (
              busy.current ||
              blocked ||
              library.isError ||
              library.isFetching ||
              !jobs.data ||
              jobs.isError ||
              jobs.isFetching
            )
              return;
            busy.current = true;
            write.mutate({ kind: "review", job });
          }}
          onLookup={(id) => {
            if (busy.current || !user) return;
            try {
              generationUuid(id.trim());
              setLookupError(undefined);
              if (id.trim() === watchedId) void watched.refetch();
              else setWatchedId(id.trim());
            } catch {
              setLookupError("Enter a complete job UUID.");
            }
          }}
          onClassic={() => setMode("cli", { navigate: false })}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function GenerationPage({ request }: { request: GenerationRequest }) {
  const { ready, isCli, setMode, location } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening generation & jobs" />;
  // This new workspace has no legacy page to replace. Existing CLI authoring
  // remains available without changing its registry or learner position.
  if (isCli)
    return (
      <GuiWorkspaceShell section="AI generation & jobs">
        <GuiFeedback kind="info" title="Open the GUI generation workspace">
          <p>
            Batch generation and job results are available here in GUI
            appearance. Existing CLI single-lesson authoring is kept.
          </p>
          <button
            type="button"
            onClick={() => setMode("gui", { navigate: false })}
          >
            Open GUI generation & jobs
          </button>
          <Link href={toCliRoute(location, "developer")}>
            Open developer terminal
          </Link>
        </GuiFeedback>
      </GuiWorkspaceShell>
    );
  return <GuiGeneration request={request} />;
}
