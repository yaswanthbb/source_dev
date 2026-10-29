"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { NotificationFailure } from "@/components/notifications/notifications-client";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  loadAdminAccount,
  loadAdminSection,
  loadAdminFeed,
  AdminDashboardFailure,
} from "./admin-dashboard-client";
import {
  type AdminSections,
  type AdminResource,
  type Checked,
  type AdminUser,
} from "./admin-dashboard-data";
import { AdminDashboardView } from "./admin-dashboard-view";
import { CliAdminDashboard } from "./cli-admin-dashboard";
const denied = (e: unknown) =>
  (e instanceof AdminDashboardFailure || e instanceof NotificationFailure) &&
  e.unavailable;
function asResource<T>(q: UseQueryResult<Checked<T>>): AdminResource<T> {
  return {
    data: q.isError || q.isFetching ? undefined : q.data?.value,
    pending: q.isPending || q.isFetching,
    error: q.isError
      ? "This section couldn’t be checked. Its values are unavailable."
      : undefined,
    checkedAt: q.isError ? undefined : q.data?.checkedAt,
  };
}
function useAdminSection<K extends keyof AdminSections>(
  user: AdminUser | undefined,
  kind: K,
  enabled: boolean,
  session: string | null,
) {
  return useQuery({
    queryKey: [
      "admin",
      "dashboard",
      kind,
      user?.id ?? "unchecked",
      user?.role ?? "unchecked",
    ],
    queryFn: ({ signal }) => loadAdminSection(user!, kind, signal, session),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
}
export function GuiAdminDashboard() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [refreshing, setRefreshing] = useState(false),
    [notice, setNotice] = useState("");
  const busy = useRef(false);
  const actor = useQuery({
    queryKey: [
      "admin",
      "dashboard",
      "account",
      bound?.id ?? "unchecked",
      bound?.role ?? "unchecked",
    ],
    queryFn: ({ signal }) =>
      loadAdminAccount(bound ?? undefined, signal, session),
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
    };
  }, []);
  const gate =
    !!actor.data &&
    !actor.isFetching &&
    !actor.isError &&
    !invalid &&
    !!session &&
    getToken() === session;
  const overview = useAdminSection(actor.data, "overview", gate, session),
    queue = useAdminSection(actor.data, "queue", gate, session),
    roadmaps = useAdminSection(actor.data, "roadmaps", gate, session),
    concepts = useAdminSection(actor.data, "concepts", gate, session),
    developers = useAdminSection(actor.data, "developers", gate, session);
  const feed = useQuery({
    queryKey: [
      "notifications",
      "inbox",
      actor.data?.id ?? "unchecked",
      actor.data?.role ?? "unchecked",
    ],
    queryFn: ({ signal }) => loadAdminFeed(actor.data!, signal, session),
    enabled: gate,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
  const queries = { overview, queue, roadmaps, concepts, developers, feed },
    hidden =
      invalid ||
      !session ||
      getToken() !== session ||
      Object.values(queries).some((q) => denied(q.error)) ||
      actor.isError;
  const fetching =
    Object.values(queries).some((q) => q.isFetching) || actor.isFetching;
  async function refresh(kind: keyof typeof queries | "all") {
    if (busy.current || !gate || hidden || fetching || getToken() !== session)
      return;
    busy.current = true;
    setRefreshing(true);
    setNotice("");
    try {
      const selected =
        kind === "all" ? Object.values(queries) : [queries[kind]];
      const results = await Promise.allSettled(
        selected.map((q) => q.refetch()),
      );
      if (getToken() !== session) {
        setInvalid(true);
        return;
      }
      const failed = results.some(
        (r) => r.status === "rejected" || r.value.isError,
      );
      setNotice(
        failed
          ? "Some sections couldn’t be checked. Their values remain unavailable."
          : kind === "all"
            ? "Dashboard refreshed. These are the latest checked values."
            : "Section refreshed. Its checked values are updated.",
      );
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }
  return (
    <GuiWorkspaceShell
      shell="admin"
      user={gate && !hidden ? actor.data : undefined}
      section="Overview"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            {invalid || getToken() !== session
              ? "Your session changed. Cached admin data is hidden."
              : actor.error instanceof AdminDashboardFailure
                ? actor.error.message
                : "Your account or admin access couldn’t be confirmed. Cached dashboard data is hidden."}
          </p>
          <button
            type="button"
            disabled={invalid || getToken() !== session || actor.isFetching}
            onClick={() => void actor.refetch()}
          >
            Check admin access
          </button>
          <Link href="/developer/dashboard">Developer workspace</Link>
          <Link href="/login">Sign in</Link>
          <button type="button" onClick={() => window.location.reload()}>
            Reload dashboard
          </button>
        </GuiFeedback>
      ) : !gate ? (
        <ModeAwareLoader
          guiTitle="Checking admin access"
          guiDescription="Verifying your current account before loading platform data."
        />
      ) : (
        <AdminDashboardView
          user={actor.data!}
          overview={asResource(overview)}
          queue={asResource(queue)}
          roadmaps={asResource(roadmaps)}
          concepts={asResource(concepts)}
          developers={asResource(developers)}
          feed={{
            data: feed.isError || feed.isFetching ? undefined : feed.data,
            pending: feed.isPending || feed.isFetching,
            error: feed.isError
              ? "Your notifications couldn’t be checked. Use Refresh or the bell."
              : undefined,
            checkedAt: feed.data?.checkedAt,
          }}
          refreshing={refreshing || fetching}
          notice={notice}
          onRefresh={(kind) => void refresh(kind)}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function AdminDashboardPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening admin overview" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI admin dashboard
        </button>
      </div>
      <CliAdminDashboard />
    </>
  ) : (
    <GuiAdminDashboard />
  );
}
