"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  type GenerationJob,
  type GenerationFeed,
} from "@/components/generation/generation-data";
import {
  loadAdminJobs,
  inspectAdminJob,
  acknowledgeAdminJob,
  AdminJobsFailure,
} from "./admin-jobs-client";
import { AdminJobsView } from "./admin-jobs-view";

export function GuiAdminJobs() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [busy, setBusy] = useState(false),
    [lookup, setLookup] = useState<GenerationJob>(),
    [lookupError, setLookupError] = useState(""),
    [notice, setNotice] = useState(""),
    [paused, setPaused] = useState<GenerationJob>(),
    [earlier, setEarlier] = useState(false),
    [recovery, setRecovery] = useState<{
      feed: GenerationFeed;
      job: GenerationJob;
    }>();
  const lock = useRef(false),
    queryClient = useQueryClient();
  const key = [
    "admin",
    "jobs",
    bound?.id ?? "unchecked",
    bound?.role ?? "unchecked",
  ];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadAdminJobs(bound ?? undefined, signal, session),
    enabled: !!session && !invalid,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    const changed = () => setInvalid(true),
      stored = (event: StorageEvent) => {
        if (
          event.key === null ||
          event.key === "sd_token" ||
          event.key === "sd_user"
        )
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
    (query.error instanceof AdminJobsFailure && query.error.unavailable);
  const feed =
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
    } catch (error) {
      if (error instanceof AdminJobsFailure && error.unavailable)
        setInvalid(true);
      setNotice(
        error instanceof AdminJobsFailure
          ? error.message
          : "This check couldn’t finish. Check again before relying on these values.",
      );
    } finally {
      if (getToken() !== session) setInvalid(true);
      lock.current = false;
      setBusy(false);
    }
  }
  function adoptFeed(value: GenerationFeed) {
    if (current()) queryClient.setQueryData(key, value);
  }
  async function refresh() {
    setLookup(undefined);
    setLookupError("");
    setRecovery(undefined);
    const result = await query.refetch();
    if (current())
      setNotice(
        result.isError
          ? "Jobs couldn’t be refreshed. Previous values are hidden."
          : "Jobs refreshed. These are checked values, not live updates.",
      );
  }
  async function inspect(id: string) {
    if (!feed) return;
    setLookup(undefined);
    setLookupError("");
    try {
      const job = await inspectAdminJob(feed.user, id, session);
      if (current()) {
        setLookup(job);
        setNotice("Job checked. Read its saved status and result below.");
      }
    } catch (error) {
      if (error instanceof AdminJobsFailure && error.unavailable) throw error;
      setLookupError(
        error instanceof AdminJobsFailure
          ? error.message
          : "This job couldn’t be checked.",
      );
    }
  }
  async function review(job: GenerationJob) {
    if (!feed || paused) return;
    setRecovery(undefined);
    try {
      const result = await acknowledgeAdminJob(feed.user, job, session);
      if (current()) {
        adoptFeed(result.feed);
        setLookup(result.job);
        setNotice(
          "Result marked reviewed. Generated content has not been approved or changed.",
        );
      }
    } catch (error) {
      if (error instanceof AdminJobsFailure && error.uncertain) {
        setPaused(job);
        setEarlier(true);
        setLookup(undefined);
      }
      throw error;
    }
  }
  async function recover() {
    if (!paused) return;
    setRecovery(undefined);
    setLookup(undefined);
    const checked = await loadAdminJobs(bound ?? undefined, undefined, session),
      job = await inspectAdminJob(checked.user, paused.id, session);
    if (current()) {
      setRecovery({ feed: checked, job });
      setLookup(job);
      setNotice(
        "Saved state checked. Review it, then explicitly use the checked state to resume. The earlier request may still finish.",
      );
    }
  }
  function adopt() {
    if (lock.current || !recovery || !current()) return;
    adoptFeed(recovery.feed);
    setLookup(recovery.job);
    setPaused(undefined);
    setRecovery(undefined);
    setNotice(
      "Using the checked state. An earlier acknowledgement may still finish; check a changed result before another action.",
    );
  }
  return (
    <GuiWorkspaceShell shell="admin" section="AI jobs" user={feed?.user}>
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            Your session or admin access couldn’t be confirmed. Cached jobs are
            hidden.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload jobs
          </button>
          <Link href="/login">Sign in</Link>
        </GuiFeedback>
      ) : (
        <AdminJobsView
          feed={feed}
          pending={query.isPending || query.isFetching}
          error={
            query.isError
              ? "Your admin account or jobs couldn’t be checked. Refresh to try again."
              : undefined
          }
          busy={busy}
          lookup={feed ? lookup : undefined}
          lookupError={lookupError}
          notice={notice}
          paused={!!paused}
          earlier={earlier}
          recovered={!!recovery}
          onRefresh={() => void run(refresh)}
          onLookup={(id) => void run(() => inspect(id))}
          onReview={(job) => void run(() => review(job))}
          onRecover={() => void run(recover)}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function AdminJobsPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening admin jobs" />;
  if (isCli)
    return (
      <div className="p-6 font-mono">
        <p>Admin job commands remain available in the admin terminal.</p>
        <Link href="/admin/terminal?view=jobs">Open admin jobs terminal</Link>
        <button
          type="button"
          className="block border rounded px-4 min-h-11 mt-4"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI admin jobs
        </button>
      </div>
    );
  return <GuiAdminJobs />;
}
