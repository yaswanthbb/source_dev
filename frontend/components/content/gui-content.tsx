"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  loadContentLibrary,
  createPrivateRoadmap,
  ContentFailure,
  contentError,
  contentUnavailable,
  type RoadmapDraft,
} from "./content-client";
import { ContentLibraryView } from "./content-view";
import { CliContent } from "./cli-content";

export function GuiContent() {
  const source = useQuery({
    queryKey: ["content", "mine"],
    queryFn: ({ signal }) => loadContentLibrary(signal),
    retry: false,
  });
  const cache = useQueryClient(),
    busy = useRef(false),
    [recovered, setRecovered] = useState(false);
  const create = useMutation({
    retry: false,
    mutationFn: (draft: RoadmapDraft) => {
      if (!source.data)
        throw new ContentFailure("Load your account and library first.");
      return createPrivateRoadmap(source.data.user, draft);
    },
    onSettled: async (outcome) => {
      if (outcome)
        await Promise.all([
          cache.invalidateQueries({ queryKey: ["content", "mine"] }),
          cache.invalidateQueries({ queryKey: ["roadmaps"] }),
        ]).catch(() => {});
      busy.current = false;
    },
  });
  const { setMode } = useUiMode();
  const uncertain =
    create.error instanceof ContentFailure && create.error.uncertain;
  const unavailable =
    contentUnavailable(source.error) || contentUnavailable(create.error);
  async function refresh() {
    if (busy.current || create.isPending) return;
    const result = await source.refetch();
    if (result.isError || !result.data) return;
    if (uncertain) setRecovered(true);
    create.reset();
  }
  return (
    <GuiWorkspaceShell
      user={unavailable ? undefined : source.data?.user}
      section="My content"
    >
      {unavailable ? (
        <GuiFeedback kind="error" title="Content unavailable">
          <p>
            Your account or content access changed. Cached private roadmaps are
            hidden.
          </p>
          <button
            type="button"
            disabled={source.isFetching}
            onClick={() => void refresh()}
          >
            Reload my content
          </button>
        </GuiFeedback>
      ) : (
        <ContentLibraryView
          data={source.data}
          loading={source.isPending}
          refreshing={source.isFetching}
          readError={source.isError ? contentError(source.error) : undefined}
          pending={create.isPending}
          canCreate={!source.isError && !source.isFetching && !uncertain}
          error={create.error ? contentError(create.error) : undefined}
          uncertain={uncertain}
          recovered={recovered}
          outcome={create.data}
          onRefresh={() => void refresh()}
          onClassic={() => setMode("cli", { navigate: false })}
          onCreate={(draft) => {
            if (
              busy.current ||
              create.isPending ||
              uncertain ||
              source.isError ||
              source.isFetching ||
              !source.data
            )
              return;
            busy.current = true;
            create.mutate(draft);
          }}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function ContentPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening your content" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          className="border border-current rounded px-4 min-h-11"
          type="button"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI content library
        </button>
      </div>
      <CliContent />
    </>
  ) : (
    <GuiContent />
  );
}
