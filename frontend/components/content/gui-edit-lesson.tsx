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
  loadEditLesson,
  saveLessonEdit,
  type LessonEditResult,
} from "./edit-lesson-client";
import type { LessonEdit } from "./edit-lesson-data";
import { EditLessonView } from "./edit-lesson-view";
import { CliEditLesson } from "./cli-edit-lesson";

const message = (error: unknown) =>
  error instanceof ContentFailure
    ? error.message
    : "The saved lesson couldn't be checked. Recheck access and saved state; your writing is kept.";
export function GuiEditLesson({ id }: { id: string }) {
  const key = ["content", "lesson-edit", id];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadEditLesson(id, signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const cache = useQueryClient(),
    busy = useRef(false),
    { setMode } = useUiMode();
  const [checking, setChecking] = useState(false),
    [checkError, setCheckError] = useState<unknown>(),
    [recoveryWarning, setRecoveryWarning] = useState(false),
    [result, setResult] = useState<LessonEditResult>(),
    [checkVersion, setCheckVersion] = useState(0);
  const write = useMutation({
    retry: false,
    mutationFn: (action: LessonEdit) => {
      if (!source.data)
        throw new ContentFailure("Check the lesson before saving.");
      return saveLessonEdit(source.data, action);
    },
    onSuccess: async (saved) => {
      cache.setQueryData(key, saved.data);
      setResult(saved);
      setRecoveryWarning(false);
      setCheckVersion(0);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["content", "mine"] }),
        cache.invalidateQueries({ queryKey: ["content", "editor"] }),
        cache.invalidateQueries({ queryKey: ["concepts"] }),
        cache.invalidateQueries({ queryKey: ["roadmaps"] }),
      ]).catch(() => {});
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  const uncertain =
    write.error instanceof ContentFailure && write.error.uncertain;
  const hidden =
    contentUnavailable(source.error) ||
    contentUnavailable(write.error) ||
    contentUnavailable(checkError);
  const paused =
    source.isError ||
    source.isFetching ||
    checking ||
    write.isPending ||
    !!write.error ||
    !!checkError ||
    hidden;
  async function check() {
    if (busy.current || write.isPending) return;
    busy.current = true;
    setChecking(true);
    try {
      const data = source.data
        ? await loadEditLesson(id, undefined, source.data.user)
        : await source.refetch().then((value) => {
            if (value.isError || !value.data) throw value.error;
            return value.data;
          });
      cache.setQueryData(key, data);
      setRecoveryWarning(uncertain);
      setCheckError(undefined);
      setCheckVersion((value) => value + 1);
      write.reset();
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
      section="Edit lesson"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Lesson editing unavailable">
          <p>
            Your account, lesson access or saved data changed. Cached lesson
            text is hidden.
          </p>
          <button
            type="button"
            disabled={checking || source.isFetching || write.isPending}
            onClick={() => void check()}
          >
            Recheck editing access
          </button>
          <Link href="/developer/content">Open My content</Link>
        </GuiFeedback>
      ) : source.data ? (
        <EditLessonView
          key={`${source.data.user.id}/${id}`}
          data={source.data}
          refreshing={source.isFetching || checking}
          pending={write.isPending}
          readError={source.error ? message(source.error) : undefined}
          error={
            checkError
              ? message(checkError)
              : write.error
                ? message(write.error)
                : undefined
          }
          uncertain={uncertain}
          recoveryWarning={recoveryWarning}
          checkVersion={checkVersion}
          canSave={!paused}
          result={result}
          onCheck={() => void check()}
          onClassic={() => setMode("cli", { navigate: false })}
          onSave={(action) => {
            if (busy.current || paused || !source.data) return;
            busy.current = true;
            write.mutate(action);
          }}
        />
      ) : (
        <GuiFeedback
          kind={source.isPending ? "loading" : "error"}
          title={
            source.isPending
              ? "Opening the lesson editor"
              : "Lesson couldn't load"
          }
        >
          <p>
            {source.error
              ? message(source.error)
              : "Checking your account, saved body and any pending draft."}
          </p>
          {!source.isPending && (
            <button
              type="button"
              disabled={checking || source.isFetching}
              onClick={() => void check()}
            >
              Recheck lesson
            </button>
          )}
        </GuiFeedback>
      )}
    </GuiWorkspaceShell>
  );
}
export function EditLessonPage({ id }: { id: string }) {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening lesson editing" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI lesson editor
        </button>
      </div>
      <CliEditLesson id={id} />
    </>
  ) : (
    <GuiEditLesson id={id} />
  );
}
