"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ContentFailure, contentUnavailable } from "./content-client";
import {
  loadRoadmapEditor,
  runEditorAction,
  searchOwnLessons,
  type EditorAction,
} from "./editor-client";
import { RoadmapEditorView } from "./editor-view";
import { CliRoadmapEditor } from "./cli-roadmap-editor";

const message = (error: unknown) =>
  error instanceof ContentFailure
    ? error.message
    : "Your roadmap couldn’t be checked. Reload to check access and saved state. Your draft is kept on this page.";
export function GuiRoadmapEditor({ roadmapId }: { roadmapId: string }) {
  const key = ["content", "editor", roadmapId];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadRoadmapEditor(roadmapId, signal),
    retry: false,
  });
  const cache = useQueryClient(),
    busy = useRef(false),
    { setMode } = useUiMode();
  const [search, setSearch] = useState(""),
    [recovered, setRecovered] = useState(false);
  const change = useMutation({
    retry: false,
    mutationFn: (action: EditorAction) => {
      if (!source.data) throw new ContentFailure("Load your roadmap first.");
      return runEditorAction(source.data, action);
    },
    onSuccess: async (outcome) => {
      cache.setQueryData(key, outcome.data);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["content", "mine"] }),
        cache.invalidateQueries({ queryKey: ["roadmaps"] }),
        cache.invalidateQueries({ queryKey: ["concepts"] }),
      ]).catch(() => {});
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  const uncertain =
    change.error instanceof ContentFailure && change.error.uncertain;
  const unavailable =
    contentUnavailable(source.error) || contentUnavailable(change.error);
  const lessons = useQuery({
    queryKey: [
      "content",
      "attach-search",
      roadmapId,
      source.data?.user.id,
      search,
    ],
    queryFn: ({ signal }) => searchOwnLessons(source.data!, search, signal),
    enabled:
      !!source.data &&
      !unavailable &&
      !source.isError &&
      !source.isFetching &&
      !change.isPending &&
      !uncertain &&
      search.trim().length >= 2,
    retry: false,
  });
  const hidden = unavailable || contentUnavailable(lessons.error);
  async function refresh() {
    if (busy.current || change.isPending) return;
    const result = await source.refetch();
    if (result.isError || !result.data) return;
    setSearch("");
    if (uncertain) setRecovered(true);
    change.reset();
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : source.data?.user}
      section="Roadmap authoring"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Authoring unavailable">
          <p>
            Your account, ownership or authoring data changed. Cached private
            content is hidden.
          </p>
          <button
            type="button"
            disabled={source.isFetching || change.isPending}
            onClick={() => void refresh()}
          >
            Reload roadmap
          </button>
        </GuiFeedback>
      ) : (
        <RoadmapEditorView
          data={source.data}
          loading={source.isPending}
          refreshing={source.isFetching}
          readError={source.isError ? message(source.error) : undefined}
          pending={change.isPending}
          error={change.error ? message(change.error) : undefined}
          uncertain={uncertain}
          recovered={recovered}
          outcome={change.data}
          canWrite={!source.isError && !source.isFetching && !uncertain}
          searchResults={
            search.trim().length >= 2 && !lessons.isError && !lessons.isFetching
              ? lessons.data
              : undefined
          }
          searchPending={
            search.trim().length >= 2 &&
            (lessons.isPending || lessons.isFetching)
          }
          searchError={lessons.isError ? message(lessons.error) : undefined}
          onSearch={(term) => {
            setSearch(term);
            if (term === search) void lessons.refetch();
          }}
          onRefresh={() => void refresh()}
          onClassic={() => setMode("cli", { navigate: false })}
          onAction={(action) => {
            if (
              busy.current ||
              change.isPending ||
              uncertain ||
              source.isError ||
              source.isFetching ||
              !source.data
            )
              return;
            busy.current = true;
            change.mutate(action);
          }}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function RoadmapEditorPage({ roadmapId }: { roadmapId: string }) {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening your roadmap editor" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI roadmap editor
        </button>
      </div>
      <CliRoadmapEditor roadmapId={roadmapId} />
    </>
  ) : (
    <GuiRoadmapEditor key={roadmapId} roadmapId={roadmapId} />
  );
}
