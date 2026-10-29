"use client";
import { useEffect, useRef, useState } from "react";
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
import { OwnArticlesView } from "./own-articles-view";
import { CliOwnArticles } from "./cli-own-articles";
import {
  loadOwnArticles,
  publishOwnArticle,
  deleteOwnArticle,
  checkOwnArticleAction,
  ArticleWriteFailure,
} from "./own-articles-client";
import type {
  OwnArticle,
  OwnArticleAction,
  OwnArticlesLibrary,
  ArticleRecovery,
} from "./own-articles-data";
const keyPrefix = ["articles", "own-library"];
const message = (error: unknown) =>
  error instanceof ContentFailure
    ? error.message
    : "Your articles couldn’t be checked. Your draft is kept; recheck before continuing.";
export function GuiOwnArticles() {
  const cachedAccount = getUser();
  const key = [
    ...keyPrefix,
    cachedAccount?.id ?? "unchecked",
    cachedAccount?.role ?? "unchecked",
  ];
  const [session] = useState(getToken),
    [bound] = useState(getUser);
  const busy = useRef(false),
    operation = useRef<
      | { before: OwnArticlesLibrary; action: OwnArticleAction; id?: string }
      | undefined
    >(undefined);
  const [sessionInvalid, setSessionInvalid] = useState(false),
    [pending, setPending] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState<unknown>(),
    [locked, setLocked] = useState(false),
    [recovery, setRecovery] = useState<ArticleRecovery>(),
    [previousUncertain, setPreviousUncertain] = useState(false),
    [result, setResult] = useState<OwnArticle>(),
    [notice, setNotice] = useState("");
  const cache = useQueryClient();
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadOwnArticles(signal, bound ?? undefined),
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
    contentUnavailable(error) ||
    !!(
      source.data &&
      bound &&
      (source.data.user.id !== bound.id || source.data.user.role !== bound.role)
    );
  const blocked =
    hidden ||
    pending ||
    checking ||
    locked ||
    source.isFetching ||
    source.isError ||
    !source.data;
  async function run(action: OwnArticleAction) {
    if (busy.current || blocked || !source.data) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    setRecovery(undefined);
    setNotice("");
    operation.current = { before: source.data, action };
    try {
      if (action.kind === "create") {
        const saved = await publishOwnArticle(source.data, action.draft);
        cache.setQueryData(key, saved.library);
        setResult(saved.article);
        setNotice(
          "Article published. Its public text and your article list were checked.",
        );
      } else {
        const library = await deleteOwnArticle(source.data, action.article);
        cache.setQueryData(key, library);
        setNotice(
          "Article removed. Its absence and your article list were checked.",
        );
        if (result?.id === action.article.id) setResult(undefined);
      }
      await cache
        .invalidateQueries({ queryKey: ["articles"], refetchType: "none" })
        .catch(() => {});
    } catch (failure) {
      setError(failure);
      if (failure instanceof ArticleWriteFailure && failure.uncertain) {
        setLocked(true);
        setPreviousUncertain(true);
        if (operation.current) operation.current.id = failure.articleId;
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function check() {
    if (busy.current || pending) return;
    busy.current = true;
    setChecking(true);
    setNotice("");
    try {
      const op = locked ? operation.current : undefined;
      if (op) {
        const checked = await checkOwnArticleAction(
          op.before,
          op.action,
          op.id,
        );
        cache.setQueryData(key, checked.library);
        setRecovery(checked);
        setNotice(
          checked.removed
            ? "This article is absent from the latest public read and your library."
            : "Saved articles checked. Review the results before resuming changes.",
        );
      } else {
        const library = await loadOwnArticles(
          undefined,
          bound ?? source.data?.user,
        );
        cache.setQueryData(key, library);
        setError(undefined);
        setNotice("Your article library is up to date.");
      }
    } catch (failure) {
      setError(failure);
      setRecovery(undefined);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : source.data?.user}
      section="My articles"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Article authoring unavailable">
          <p>
            Your session, ownership or authoring access changed. Cached articles
            and drafts are hidden. Reload this page to check access again.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload article workspace
          </button>
        </GuiFeedback>
      ) : (
        <OwnArticlesView
          data={source.data}
          loading={source.isPending}
          refreshing={source.isFetching || checking}
          pending={pending}
          blocked={blocked}
          locked={locked}
          recovery={recovery}
          previousUncertain={previousUncertain}
          result={result}
          error={
            error
              ? message(error)
              : source.isError
                ? message(source.error)
                : undefined
          }
          notice={notice}
          onCheck={() => void check()}
          onAction={(action) => void run(action)}
          onResume={() => {
            if (busy.current || !recovery) return;
            setLocked(false);
            setRecovery(undefined);
            setError(undefined);
            setNotice(
              "Changes resumed after your review. An earlier request may still finish; check for duplicates before publishing again.",
            );
          }}
          onNew={() => {
            setResult(undefined);
            setNotice("");
          }}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function OwnArticlesPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening your articles" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI article workspace
        </button>
      </div>
      <CliOwnArticles />
    </>
  ) : (
    <GuiOwnArticles />
  );
}
