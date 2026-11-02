"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  loadAdminArticles,
  inspectAdminArticle,
  removeAdminArticle,
  recoverAdminArticle,
  AdminArticlesFailure,
  type AdminArticleDetail,
  type AdminArticleRecovery,
  type ArticleRow,
  type AdminArticlesLibrary,
} from "./admin-articles-client";
import { AdminArticlesView } from "./admin-articles-view";
export function GuiAdminArticles() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState<AdminArticleDetail>(),
    [detailError, setDetailError] = useState(""),
    [notice, setNotice] = useState(""),
    [paused, setPaused] = useState<AdminArticleDetail>(),
    [earlier, setEarlier] = useState(false),
    [recovery, setRecovery] = useState<AdminArticleRecovery>(),
    [decisionVersion, setDecisionVersion] = useState(0);
  const lock = useRef(false),
    cache = useQueryClient(),
    key = [
      "admin",
      "articles",
      bound?.id ?? "unchecked",
      bound?.role ?? "unchecked",
    ];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      loadAdminArticles(bound ?? undefined, signal, session),
    enabled: !!session && !invalid,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    const changed = () => setInvalid(true),
      stored = (e: StorageEvent) => {
        if (e.key === null || e.key === "sd_user" || e.key === "sd_token")
          changed();
      };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
    };
  }, []);
  const hidden =
      invalid ||
      !session ||
      getToken() !== session ||
      (query.error instanceof AdminArticlesFailure && query.error.unavailable),
    library =
      hidden || query.isError || query.isFetching ? undefined : query.data;
  function current() {
    if (hidden || getToken() !== session) {
      setInvalid(true);
      return false;
    }
    return true;
  }
  async function run(action: () => Promise<void>) {
    if (lock.current || query.isFetching || !current()) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch (e) {
      if (e instanceof AdminArticlesFailure && e.unavailable) setInvalid(true);
      setNotice(
        e instanceof AdminArticlesFailure
          ? e.message
          : "The operation couldn’t be checked. Check current saved state before another decision.",
      );
    } finally {
      if (getToken() !== session) setInvalid(true);
      lock.current = false;
      setBusy(false);
    }
  }
  function storeLibrary(value: AdminArticlesLibrary) {
    if (current()) cache.setQueryData(key, value);
  }
  async function refresh() {
    setDetail(undefined);
    setDetailError("");
    setRecovery(undefined);
    const result = await query.refetch();
    if (current())
      setNotice(
        result.isError
          ? "The article list couldn’t be refreshed. Previous values are hidden."
          : "Public article metadata refreshed. Open an article to check its full current text.",
      );
  }
  async function inspect(row: ArticleRow) {
    if (!library) return;
    setDetail(undefined);
    setDetailError("");
    try {
      const checked = await inspectAdminArticle(library, row, session);
      if (current()) {
        setDetail(checked);
        setNotice(
          "Saved article checked. Read its full text before a moderation decision.",
        );
      }
    } catch (e) {
      if (e instanceof AdminArticlesFailure && e.unavailable) throw e;
      setDetailError(
        e instanceof AdminArticlesFailure
          ? e.message
          : "Article details couldn’t be checked.",
      );
    }
  }
  async function remove(value: AdminArticleDetail, reason: string) {
    if (!library || paused) return;
    setRecovery(undefined);
    try {
      const saved = await removeAdminArticle(library, value, reason, session);
      if (current()) {
        storeLibrary(saved);
        setDetail(undefined);
        setDetailError("");
        setDecisionVersion((n) => n + 1);
        setNotice(
          "Article removal checked: it is absent from the current detail endpoint and article list. Notification delivery is not verified.",
        );
        await cache
          .invalidateQueries({ queryKey: ["articles"], refetchType: "none" })
          .catch(() => {});
      }
    } catch (e) {
      if (e instanceof AdminArticlesFailure && e.uncertain) {
        setPaused(value);
        setEarlier(true);
        setDetail(undefined);
      }
      throw e;
    }
  }
  async function recover() {
    if (!paused) return;
    setRecovery(undefined);
    setDetail(undefined);
    setDetailError("");
    const actor = query.data?.user ?? bound;
    if (!actor)
      throw new AdminArticlesFailure(
        "Your admin account must be checked again.",
        false,
        true,
      );
    const result = await recoverAdminArticle(actor, paused.article.id, session);
    if (current()) {
      setRecovery(result);
      setDetail(result.detail);
      setNotice(
        "Saved state checked without repeating the delete. Review it and explicitly use the checked state to resume. An earlier request may still finish.",
      );
    }
  }
  function adopt() {
    if (lock.current || !recovery || !current()) return;
    storeLibrary(recovery.library);
    setDetail(recovery.detail);
    setPaused(undefined);
    setRecovery(undefined);
    setNotice(
      "Using the checked state. An earlier delete request may still finish; check changed records before another decision.",
    );
  }
  return (
    <GuiWorkspaceShell shell="admin" section="Articles" user={library?.user}>
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            Your session or admin access couldn’t be confirmed. Cached
            moderation data is hidden.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload articles
          </button>
          <Link href="/login">Sign in</Link>
        </GuiFeedback>
      ) : (
        <AdminArticlesView
          library={library}
          pending={query.isPending || query.isFetching}
          error={
            query.isError
              ? "Your admin access or the article library couldn’t be checked. Refresh to try again."
              : undefined
          }
          busy={busy}
          detail={library ? detail : undefined}
          detailError={detailError}
          notice={notice}
          paused={!!paused}
          earlier={earlier}
          recovery={recovery}
          decisionVersion={decisionVersion}
          onRefresh={() => void run(refresh)}
          onInspect={(row) => void run(() => inspect(row))}
          onDelete={(value, reason) => void run(() => remove(value, reason))}
          onRecover={() => void run(recover)}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function AdminArticlesPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening admin articles" />;
  if (isCli)
    return (
      <div className="p-6 font-mono">
        <p>Admin article commands remain available in the admin terminal.</p>
        <Link href="/admin/terminal?view=articles">
          Open admin articles terminal
        </Link>
        <button
          type="button"
          className="block border rounded px-4 min-h-11 mt-4"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI admin articles
        </button>
      </div>
    );
  return <GuiAdminArticles />;
}
