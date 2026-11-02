"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import {
  keyFingerprint,
  type KeyAction,
  type Provider,
} from "./provider-keys-data";
import {
  ProviderKeyFailure,
  loadKeyWorkspace,
  loadKeyQuota,
  changeProviderKey,
  lookupNewKey,
  loadStoredKeyModels,
} from "./provider-keys-client";
import { ProviderKeysView } from "./provider-keys-view";
import { CliProviderKeys } from "./cli-provider-keys";
const message = (e: unknown) =>
  e instanceof ProviderKeyFailure
    ? e.message
    : "The request could not be confirmed. Recheck your saved key settings.";
export function GuiProviderKeys() {
  const cache = useQueryClient(),
    key = ["provider-keys", "workspace"];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      loadKeyWorkspace(cache.getQueryData<User>(["users", "me"]), signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const data = source.data;
  const quota = useQuery({
    queryKey: [
      "provider-keys",
      "quota",
      data?.user.id,
      data?.user.role,
      data ? keyFingerprint(data) : "",
    ],
    enabled: !!data && !source.isError,
    queryFn: ({ signal }) => loadKeyQuota(data!, signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const busy = useRef(false),
    [pending, setPending] = useState(""),
    [error, setError] = useState<ProviderKeyFailure>(),
    [notice, setNotice] = useState<{ text: string; version: number }>(),
    [checkVersion, setCheckVersion] = useState(0),
    { setMode } = useUiMode();
  const hidden = [source.error, quota.error, error].some(
    (e) => e instanceof ProviderKeyFailure && e.unavailable,
  );
  const blocked =
    !data ||
    source.isError ||
    source.isFetching ||
    !!pending ||
    !!error ||
    hidden;
  async function invalidate() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["ai", "keys"] }),
      cache.invalidateQueries({ queryKey: ["ai", "quota"] }),
      cache.invalidateQueries({ queryKey: ["provider-keys", "quota"] }),
      cache.invalidateQueries({ queryKey: ["generation", "settings"] }),
    ]).catch(() => {});
  }
  async function action(next: KeyAction) {
    if (busy.current || blocked || !data) return false;
    busy.current = true;
    setPending(next.kind);
    setNotice(undefined);
    try {
      const saved = await changeProviderKey(data, next);
      cache.setQueryData(key, saved);
      setNotice({
        text:
          next.kind === "delete"
            ? "Key removed from source:dev. Your provider key has not been revoked at the provider."
            : next.kind === "create"
              ? "Key stored encrypted. Saved metadata is confirmed; the full key is not returned."
              : "Your saved key setting is confirmed.",
        version: Date.now(),
      });
      await invalidate();
      return true;
    } catch (e) {
      setError(
        e instanceof ProviderKeyFailure
          ? e
          : new ProviderKeyFailure(message(e), true),
      );
      return false;
    } finally {
      busy.current = false;
      setPending("");
    }
  }
  async function check() {
    if (busy.current) return;
    busy.current = true;
    setPending("check");
    setNotice(undefined);
    try {
      const saved = await loadKeyWorkspace(data?.user);
      cache.setQueryData(key, saved);
      const wasUncertain = error?.uncertain;
      setError(undefined);
      setCheckVersion((v) => v + 1);
      setNotice({
        text: wasUncertain
          ? "Saved keys rechecked. An earlier request may still finish; compare the current list before submitting again."
          : "Your current key settings have been checked.",
        version: Date.now(),
      });
      await invalidate();
    } catch (e) {
      setError(
        e instanceof ProviderKeyFailure
          ? e
          : new ProviderKeyFailure(message(e)),
      );
    } finally {
      busy.current = false;
      setPending("");
    }
  }
  async function models(provider?: Provider, secret?: string, id?: string) {
    if (busy.current || blocked || !data) return;
    busy.current = true;
    setPending("models");
    setNotice(undefined);
    try {
      return id
        ? await loadStoredKeyModels(data, id)
        : await lookupNewKey(data, provider!, secret!);
    } catch (e) {
      setError(
        e instanceof ProviderKeyFailure
          ? e
          : new ProviderKeyFailure(message(e)),
      );
    } finally {
      busy.current = false;
      setPending("");
    }
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : data?.user}
      section="AI provider keys"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Provider keys unavailable">
          <p>
            Current account access or saved metadata could not be confirmed.
            Cached key details and unsaved key input are hidden.
          </p>
          <button
            type="button"
            disabled={!!pending || source.isFetching}
            onClick={() => void check()}
          >
            Recheck key access
          </button>
          <Link href="/developer/dashboard">Open overview</Link>
        </GuiFeedback>
      ) : data ? (
        <ProviderKeysView
          key={`${data.user.id}/${data.user.role}`}
          data={data}
          quota={quota.isError ? undefined : quota.data}
          quotaLoading={quota.isPending || quota.isFetching}
          quotaError={quota.error ? message(quota.error) : undefined}
          pending={pending}
          blocked={blocked}
          readError={source.error ? message(source.error) : undefined}
          error={error?.message}
          uncertain={error?.uncertain}
          notice={notice}
          checkVersion={checkVersion}
          onCheck={() => void check()}
          onAction={action}
          onLookup={(provider, secret) => models(provider, secret)}
          onModels={(id) => models(undefined, undefined, id)}
          onClassic={() => setMode("cli", { navigate: false })}
        />
      ) : source.isError ? (
        <GuiFeedback kind="error" title="Provider keys could not load">
          <p>{message(source.error)}</p>
          <button
            type="button"
            disabled={!!pending || source.isFetching}
            onClick={() => void check()}
          >
            Recheck key settings
          </button>
        </GuiFeedback>
      ) : (
        <ModeAwareLoader guiTitle="Checking your provider keys" />
      )}
    </GuiWorkspaceShell>
  );
}
export function ProviderKeysPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening provider keys" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI provider keys
        </button>
      </div>
      <CliProviderKeys />
    </>
  ) : (
    <GuiProviderKeys />
  );
}
