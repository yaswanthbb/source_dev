"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import {
  ContentFailure,
  contentUnavailable,
} from "@/components/content/content-client";
import { ArticleEditorView } from "./article-editor-view";
import { CliEditArticle } from "./cli-edit-article";
import {
  loadArticleEditor,
  saveArticleEdit,
  ArticleEditorFailure,
} from "./article-editor-client";
import {
  articleEditDraft,
  type ArticleEditorContext,
} from "./article-editor-data";
import type { ArticleDraft } from "./own-articles-data";
const message = (error: unknown) =>
  error instanceof ContentFailure
    ? error.message
    : "Saved article state couldn’t be checked. Keep your draft and check again before saving.";
export function GuiArticleEditor({ id }: { id: string }) {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [sessionInvalid, setSessionInvalid] = useState(false),
    [draft, setDraft] = useState<ArticleDraft>(),
    [pending, setPending] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState<unknown>(),
    [locked, setLocked] = useState(false),
    [review, setReview] = useState<ArticleEditorContext>(),
    [earlierRequest, setEarlierRequest] = useState(false),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    cache = useQueryClient(),
    key = [
      "articles",
      "editor",
      id,
      bound?.id ?? "unchecked",
      bound?.role ?? "unchecked",
    ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadArticleEditor(id, signal, bound ?? undefined),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    const changed = () => setSessionInvalid(true);
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, changed);
  }, []);
  const hidden =
    sessionInvalid ||
    getToken() !== session ||
    contentUnavailable(source.error) ||
    contentUnavailable(error);
  const missing =
    (error instanceof ArticleEditorFailure && error.missing) ||
    (source.error instanceof ArticleEditorFailure && source.error.missing);
  const blocked =
    hidden ||
    pending ||
    checking ||
    locked ||
    source.isFetching ||
    source.isError ||
    !source.data;
  async function save(value: ArticleDraft) {
    if (busy.current || blocked || !source.data) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    setReview(undefined);
    setNotice("");
    try {
      const saved = await saveArticleEdit(source.data, value);
      cache.setQueryData(key, saved);
      setNotice("Changes saved and checked. This version is public now.");
      await cache
        .invalidateQueries({ queryKey: ["articles"], refetchType: "none" })
        .catch(() => {});
    } catch (failure) {
      setError(failure);
      if (
        (failure instanceof ContentFailure && failure.uncertain) ||
        (failure instanceof ArticleEditorFailure && failure.conflict)
      )
        setLocked(true);
      if (failure instanceof ContentFailure && failure.uncertain)
        setEarlierRequest(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function check() {
    if (busy.current) return;
    busy.current = true;
    setChecking(true);
    setReview(undefined);
    setNotice("");
    try {
      const checked = await loadArticleEditor(
        id,
        undefined,
        source.data?.user ?? bound ?? undefined,
      );
      if (source.data) {
        setReview(checked);
        setLocked(true);
        setNotice(
          "Saved version checked. Your draft is unchanged; choose which text to keep.",
        );
      } else {
        cache.setQueryData(key, checked);
        setNotice("Saved article loaded. You can now edit it.");
      }
      setError(undefined);
    } catch (failure) {
      setError(failure);
      if (source.data) setLocked(true);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  function adopt(keepDraft: boolean) {
    if (busy.current || !review || !source.data) return;
    setDraft(
      keepDraft
        ? (draft ?? articleEditDraft(source.data.article))
        : articleEditDraft(review.article),
    );
    cache.setQueryData(key, review);
    setReview(undefined);
    setLocked(false);
    setError(undefined);
    setNotice(
      keepDraft
        ? "Your draft is kept against the checked saved version. Review it before saving."
        : "The checked saved text replaced your local draft. No save was sent.",
    );
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : source.data?.user}
      section="Edit article"
    >
      {hidden ? (
        <>
          <GuiFeedback
            kind="error"
            title={
              missing ? "Article not found" : "Article editing unavailable"
            }
          >
            <p>
              {error
                ? message(error)
                : source.error
                  ? message(source.error)
                  : "Your session changed. Cached text and your draft are hidden. Reload before continuing."}
            </p>
            <button
              type="button"
              disabled={pending || checking}
              onClick={() => void check()}
            >
              Check article access
            </button>
            <button type="button" onClick={() => window.location.reload()}>
              Reload editor
            </button>
            <Link href="/developer/articles">My articles</Link>
          </GuiFeedback>
          {earlierRequest && (
            <GuiFeedback kind="info" title="Earlier save may still finish">
              A read cannot cancel an earlier save. Check public state before
              editing again.
            </GuiFeedback>
          )}
        </>
      ) : (
        <ArticleEditorView
          context={source.data}
          draft={
            draft ??
            (source.data
              ? articleEditDraft(source.data.article)
              : { title: "", content: "", roadmapId: "", conceptId: "" })
          }
          onDraft={setDraft}
          loading={source.isPending}
          refreshing={source.isFetching || checking}
          pending={pending}
          blocked={blocked}
          locked={locked}
          review={review}
          earlierRequest={earlierRequest}
          error={
            error
              ? message(error)
              : source.isError
                ? message(source.error)
                : undefined
          }
          notice={notice}
          onSave={(value) => void save(value)}
          onCheck={() => void check()}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function ArticleEditorPage({ id }: { id: string }) {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening article editor" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI article editor
        </button>
      </div>
      <CliEditArticle id={id} />
    </>
  ) : (
    <GuiArticleEditor key={id} id={id} />
  );
}
