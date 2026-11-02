"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { UsersView } from "./admin-users-view";
import { CliAdminUsers } from "./cli-admin-users";
import {
  loadUsersLibrary,
  performUsersAction,
  checkUsersState,
  UsersFailure,
  usersUnavailable,
  safeUsersError,
} from "./admin-users-client";
import type { UsersAction, UsersRecovery } from "./admin-users-data";
export function GuiAdminUsers() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [pending, setPending] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState<unknown>(),
    [locked, setLocked] = useState(false),
    [recovery, setRecovery] = useState<UsersRecovery>(),
    [late, setLate] = useState(false),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    operation = useRef<UsersAction | undefined>(undefined),
    cache = useQueryClient();
  const key = [
    "admin",
    "users",
    "library",
    bound?.id ?? "unchecked",
    bound?.role ?? "unchecked",
  ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      loadUsersLibrary(bound ?? undefined, signal, session),
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
  const hidden =
      invalid ||
      !session ||
      getToken() !== session ||
      usersUnavailable(source.error) ||
      usersUnavailable(error),
    blocked =
      hidden ||
      pending ||
      checking ||
      locked ||
      source.isFetching ||
      source.isError ||
      !source.data;
  function currentSession() {
    if (!invalid && session && getToken() === session) return true;
    setInvalid(true);
    return false;
  }
  async function run(action: UsersAction) {
    if (!currentSession() || busy.current || blocked || !source.data) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    setRecovery(undefined);
    setNotice("");
    operation.current = action;
    try {
      const checked = await performUsersAction(source.data, action, session);
      if (!currentSession()) return;
      cache.setQueryData(key, checked);
      setNotice(
        action.kind === "reject"
          ? "Request rejected. The saved review and the account’s continued presence were checked."
          : "Developer account removed. Its absence from the directory and deletion requests was checked.",
      );
      await cache.invalidateQueries({
        queryKey: ["admin", "dashboard"],
        refetchType: "none",
      });
      await cache.invalidateQueries({
        queryKey: ["admin", "analytics"],
        refetchType: "none",
      });
    } catch (e) {
      setError(e);
      if (e instanceof UsersFailure && e.uncertain) {
        setLocked(true);
        setLate(true);
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function check() {
    if (!currentSession() || busy.current || pending || source.isFetching)
      return;
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
        setNotice("Directory and requests checked.");
        return;
      }
      const checked = await checkUsersState(
        expected,
        locked ? operation.current : undefined,
        session,
      );
      if (!currentSession()) return;
      setError(undefined);
      if (locked) setRecovery(checked);
      else {
        cache.setQueryData(key, checked.library);
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
    if (!currentSession() || busy.current || !locked || !recovery) return;
    cache.setQueryData(key, recovery.library);
    setRecovery(undefined);
    setLocked(false);
    setError(undefined);
    operation.current = undefined;
    setNotice(
      "Checked list adopted. Review an account or pending request again before any change. An earlier request may still finish.",
    );
  }
  const library =
    hidden || source.isError || source.isFetching ? undefined : source.data;
  return (
    <GuiWorkspaceShell shell="admin" section="Users" user={library?.user}>
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            Cached user details are hidden.{" "}
            {invalid || getToken() !== session
              ? "Your session changed; reload or sign in again."
              : safeUsersError(error ?? source.error)}
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
            Reload users
          </button>
          <Link href="/developer/dashboard">Developer workspace</Link>
        </GuiFeedback>
      ) : (
        <UsersView
          library={library}
          loading={source.isPending || source.isFetching}
          busy={pending || checking}
          blocked={blocked}
          error={
            error || source.isError
              ? safeUsersError(error ?? source.error)
              : undefined
          }
          notice={notice}
          locked={locked}
          recovery={recovery}
          late={late}
          onAction={(action) => void run(action)}
          onCheck={() => void check()}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function AdminUsersPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening users" />;
  return isCli ? (
    <>
      <div className="p-3 font-mono">
        <button
          className="border border-current rounded px-4 min-h-11"
          type="button"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI users
        </button>
      </div>
      <CliAdminUsers />
    </>
  ) : (
    <GuiAdminUsers />
  );
}
