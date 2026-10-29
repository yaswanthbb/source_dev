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
  loadReviewLibrary,
  loadRoadmapReview,
  performReviewAction,
  checkReviewState,
  ReviewFailure,
  reviewUnavailable,
  reviewError,
} from "./review-client";
import type {
  ReviewAction,
  RoadmapDetail,
  ReviewRecovery,
} from "./review-data";
import { ContentReviewView } from "./review-view";
import { CliContentReview } from "./cli-content-review";
export function GuiContentReview() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [pending, setPending] = useState(false),
    [checking, setChecking] = useState(false),
    [opening, setOpening] = useState<string>(),
    [detail, setDetail] = useState<RoadmapDetail>(),
    [error, setError] = useState<unknown>(),
    [locked, setLocked] = useState(false),
    [recovery, setRecovery] = useState<ReviewRecovery>(),
    [late, setLate] = useState(false),
    [notice, setNotice] = useState(""),
    [decisionVersion, setDecisionVersion] = useState(0);
  const busy = useRef(false),
    operation = useRef<ReviewAction | undefined>(undefined),
    detailAbort = useRef<AbortController | undefined>(undefined),
    cache = useQueryClient();
  const key = [
    "admin",
    "content-review",
    "library",
    bound?.id ?? "unchecked",
    bound?.role ?? "unchecked",
  ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      loadReviewLibrary(bound ?? undefined, signal, session),
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
        if (e.key === null || e.key === "sd_token" || e.key === "sd_user")
          changed();
      };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
      detailAbort.current?.abort();
    };
  }, []);
  const hidden =
      invalid ||
      !session ||
      getToken() !== session ||
      reviewUnavailable(source.error) ||
      reviewUnavailable(error),
    blocked =
      hidden ||
      pending ||
      checking ||
      !!opening ||
      locked ||
      source.isFetching ||
      source.isError ||
      !source.data;
  function current() {
    if (!invalid && session && getToken() === session) return true;
    setInvalid(true);
    return false;
  }
  async function openRoadmap(id: string) {
    if (!current() || busy.current || blocked || !source.data) return;
    if (detail?.roadmap.id === id) {
      setDetail(undefined);
      return;
    }
    busy.current = true;
    setOpening(id);
    setDetail(undefined);
    setError(undefined);
    setNotice("");
    detailAbort.current?.abort();
    const abort = new AbortController();
    detailAbort.current = abort;
    try {
      const checked = await loadRoadmapReview(
        source.data.user,
        id,
        abort.signal,
        session,
      );
      if (current()) setDetail(checked);
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setOpening(undefined);
    }
  }
  async function run(a: ReviewAction) {
    if (!current() || busy.current || blocked || !source.data) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    setRecovery(undefined);
    setNotice("");
    operation.current = a;
    try {
      const result = await performReviewAction(source.data, a, session);
      if (!current()) return;
      cache.setQueryData(key, result.library);
      setDetail(undefined);
      setNotice(result.message);
      setDecisionVersion((v) => v + 1);
      for (const prefix of [
        ["admin", "dashboard"],
        ["admin", "review"],
        ["admin", "analytics"],
        ["roadmaps"],
        ["content"],
      ])
        await cache
          .invalidateQueries({ queryKey: prefix, refetchType: "none" })
          .catch(() => {});
    } catch (e) {
      setError(e);
      if (e instanceof ReviewFailure && e.uncertain) {
        setLocked(true);
        setLate(true);
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function check() {
    if (!current() || busy.current || pending || source.isFetching) return;
    busy.current = true;
    setChecking(true);
    setRecovery(undefined);
    setNotice("");
    try {
      const expected = source.data?.user ?? bound;
      if (!expected) {
        const result = await source.refetch();
        if (result.isError) throw result.error;
        setError(undefined);
        setNotice("Review queue checked.");
        return;
      }
      const checked = await checkReviewState(
        expected,
        locked ? operation.current : undefined,
        session,
      );
      if (!current()) return;
      setError(undefined);
      if (locked) setRecovery(checked);
      else {
        cache.setQueryData(key, checked.library);
        setDetail(undefined);
        setNotice(checked.summary);
      }
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  function adopt() {
    if (!current() || busy.current || !locked || !recovery) return;
    cache.setQueryData(key, recovery.library);
    setDetail(undefined);
    setRecovery(undefined);
    setLocked(false);
    setError(undefined);
    operation.current = undefined;
    setNotice(
      "Checked queue adopted. Review current content before another decision. An earlier request may still finish.",
    );
  }
  const library =
    hidden || source.isError || source.isFetching ? undefined : source.data;
  return (
    <GuiWorkspaceShell
      shell="admin"
      section="Content review"
      user={library?.user}
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            Cached review content and answer keys are hidden.{" "}
            {invalid || getToken() !== session
              ? "Your session changed. Reload or sign in again."
              : reviewError(error ?? source.error)}
          </p>
          <button
            type="button"
            disabled={
              invalid || getToken() !== session || checking || source.isFetching
            }
            onClick={() => void check()}
          >
            Check admin access
          </button>
          <button type="button" onClick={() => window.location.reload()}>
            Reload content review
          </button>
          <Link href="/developer/dashboard">Developer workspace</Link>
        </GuiFeedback>
      ) : (
        <ContentReviewView
          library={library}
          loading={source.isPending || source.isFetching}
          busy={pending || checking || !!opening}
          pending={pending}
          blocked={blocked}
          detail={library ? detail : undefined}
          opening={opening}
          error={
            error || source.isError
              ? reviewError(error ?? source.error)
              : undefined
          }
          notice={notice}
          decisionVersion={decisionVersion}
          locked={locked}
          recovery={recovery}
          late={late}
          onOpen={(id) => void openRoadmap(id)}
          onAction={(a) => void run(a)}
          onCheck={() => void check()}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function ContentReviewPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening content review" />;
  return isCli ? (
    <>
      <div className="p-3 font-mono">
        <button
          className="border border-current rounded px-4 min-h-11"
          type="button"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI content review
        </button>
      </div>
      <CliContentReview />
    </>
  ) : (
    <GuiContentReview />
  );
}
