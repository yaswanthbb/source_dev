"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { ContentFailure, contentUnavailable } from "./content-client";
import {
  loadNewLessonContext,
  createNewLesson,
  attachCreatedLesson,
  checkNewLessonState,
  type NewLessonResult,
} from "./new-lesson-client";
import type {
  LessonTargetRequest,
  LessonDraft,
  SavedNewLesson,
} from "./new-lesson-data";
import { NewLessonView } from "./new-lesson-view";
import { CliNewLesson } from "./cli-new-lesson";

const errorMessage = (error: unknown) =>
  error instanceof ContentFailure
    ? error.message
    : "Authoring state couldn’t be checked. Recheck access and saved state; your draft is kept.";
export function GuiNewLesson({ request }: { request: LessonTargetRequest }) {
  const key = [
    "content",
    "new-lesson",
    request.moduleId,
    request.roadmapId,
    request.invalid,
  ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadNewLessonContext(request, signal),
    retry: false,
  });
  const cache = useQueryClient(),
    busy = useRef(false),
    submitted = useRef<LessonDraft | undefined>(undefined),
    { setMode } = useUiMode();
  const [result, setResult] = useState<NewLessonResult>(),
    [candidates, setCandidates] = useState<SavedNewLesson[]>();
  const [checking, setChecking] = useState(false),
    [checkError, setCheckError] = useState<unknown>(),
    [recovered, setRecovered] = useState(false),
    [attachmentChecked, setAttachmentChecked] = useState(false),
    [resetVersion, setResetVersion] = useState(0),
    [checkedTitle, setCheckedTitle] = useState<string>();
  const write = useMutation({
    retry: false,
    mutationFn: (
      action: { kind: "create"; draft: LessonDraft } | { kind: "attach" },
    ) => {
      if (!source.data)
        throw new ContentFailure(
          "Check your authoring account and module first.",
        );
      if (action.kind === "create")
        return createNewLesson(source.data, action.draft);
      if (!result) throw new ContentFailure("Check your saved lesson first.");
      return attachCreatedLesson(source.data, result.lesson);
    },
    onSuccess: async (outcome) => {
      setResult(outcome);
      setAttachmentChecked(outcome.attachment !== "unconfirmed");
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["content", "mine"] }),
        cache.invalidateQueries({ queryKey: ["roadmaps"] }),
        cache.invalidateQueries({ queryKey: ["concepts"] }),
        cache.invalidateQueries({ queryKey: ["content", "editor"] }),
      ]).catch(() => {});
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  const uncertain =
    (write.error instanceof ContentFailure && write.error.uncertain) ||
    !!result?.uncertain;
  const hidden =
    contentUnavailable(source.error) ||
    contentUnavailable(write.error) ||
    contentUnavailable(checkError) ||
    !!result?.unavailable;
  const paused =
    source.isError ||
    source.isFetching ||
    write.isPending ||
    checking ||
    uncertain ||
    hidden;
  const hasTarget = !request.moduleId || !!source.data?.target;
  async function check(draft: LessonDraft) {
    if (busy.current || write.isPending) return;
    busy.current = true;
    setChecking(true);
    setCheckError(undefined);
    try {
      if (!source.data || (!uncertain && !result)) {
        const refreshed = await source.refetch();
        if (refreshed.isError || !refreshed.data) throw refreshed.error;
        if (
          source.data &&
          (refreshed.data.user.id !== source.data.user.id ||
            refreshed.data.user.role !== source.data.user.role)
        )
          throw new ContentFailure(
            "Your account changed. Reload before authoring with this draft.",
            false,
            true,
          );
        write.reset();
        return;
      }
      const checked = await checkNewLessonState(
        source.data,
        submitted.current ?? draft,
        result,
      );
      cache.setQueryData(key, checked.context);
      setCandidates(checked.candidates);
      setResult(checked.result);
      setAttachmentChecked(!!checked.result);
      setRecovered(true);
      write.reset();
    } catch (error) {
      setCheckError(error);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  async function startAnother() {
    if (busy.current || write.isPending || checking) return;
    busy.current = true;
    setChecking(true);
    setCheckError(undefined);
    try {
      const refreshed = await source.refetch();
      if (refreshed.isError || !refreshed.data) throw refreshed.error;
      if (
        source.data &&
        (refreshed.data.user.id !== source.data.user.id ||
          refreshed.data.user.role !== source.data.user.role)
      )
        throw new ContentFailure(
          "Your account changed. Reload before starting a new lesson.",
          false,
          true,
        );
      submitted.current = undefined;
      setCheckedTitle(undefined);
      setResult(undefined);
      setCandidates(undefined);
      setAttachmentChecked(false);
      setRecovered(false);
      write.reset();
      setResetVersion((v) => v + 1);
    } catch (error) {
      setCheckError(error);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : source.data?.user}
      section="New lesson"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Lesson authoring unavailable">
          <p>
            Your account, target module or authoring data changed. Cached
            private content and drafts are hidden. A previously confirmed lesson
            is kept on the server.
          </p>
          <button
            type="button"
            disabled={source.isFetching || checking || write.isPending}
            onClick={() =>
              void check({ title: "", content: "", difficulty: "medium" })
            }
          >
            Recheck authoring access
          </button>
          <Link href="/developer/content">Open My content</Link>
        </GuiFeedback>
      ) : (
        <NewLessonView
          context={
            result?.targetUnavailable && source.data
              ? { ...source.data, target: undefined }
              : source.data
          }
          loading={source.isPending}
          refreshing={source.isFetching || checking}
          readError={source.isError ? errorMessage(source.error) : undefined}
          pending={write.isPending}
          error={write.error ? errorMessage(write.error) : undefined}
          checkError={checkError ? errorMessage(checkError) : undefined}
          uncertain={uncertain}
          result={result}
          candidates={candidates}
          recovered={recovered}
          resetVersion={resetVersion}
          checkedTitle={checkedTitle}
          canCreate={!paused && hasTarget && !result}
          canAttach={
            !paused &&
            hasTarget &&
            attachmentChecked &&
            result?.attachment === "unconfirmed" &&
            !result.targetUnavailable
          }
          onCheck={(draft) => void check(draft)}
          onClassic={() => setMode("cli", { navigate: false })}
          onStartAnother={() => void startAnother()}
          onCreate={(draft) => {
            if (busy.current || paused || !hasTarget || result || !source.data)
              return;
            busy.current = true;
            submitted.current = { ...draft };
            setCheckedTitle(draft.title.trim());
            setCheckError(undefined);
            write.mutate({ kind: "create", draft });
          }}
          onAttach={() => {
            if (
              busy.current ||
              paused ||
              !hasTarget ||
              !attachmentChecked ||
              result?.attachment !== "unconfirmed" ||
              result.targetUnavailable
            )
              return;
            busy.current = true;
            setCheckError(undefined);
            write.mutate({ kind: "attach" });
          }}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function NewLessonPage({ request }: { request: LessonTargetRequest }) {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening lesson authoring" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI lesson authoring
        </button>
      </div>
      <CliNewLesson />
    </>
  ) : (
    <GuiNewLesson request={request} />
  );
}
