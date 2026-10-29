"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser, setUser } from "@/lib/auth";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { CliProfile } from "./cli-profile";
import { ProfileView } from "./profile-view";
import {
  loadProfile,
  saveProfile,
  changeProfilePassword,
  ProfileFailure,
} from "./profile-client";
import {
  profileDraft,
  type Profile,
  type ProfileDraft,
  type PasswordDraft,
} from "./profile-data";
const message = (failure: unknown) =>
  failure instanceof ProfileFailure
    ? failure.message
    : "Your account details couldn’t be checked. Try again before saving.";
export function GuiProfile() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [draft, setDraft] = useState<ProfileDraft>(),
    [pending, setPending] = useState<"profile" | "password" | "check">(),
    [error, setError] = useState<ProfileFailure>(),
    [passwordError, setPasswordError] = useState<ProfileFailure>(),
    [locked, setLocked] = useState(false),
    [passwordLocked, setPasswordLocked] = useState(false),
    [earlierRequest, setEarlierRequest] = useState(false),
    [review, setReview] = useState<Profile>(),
    [notice, setNotice] = useState(""),
    [passwordNotice, setPasswordNotice] = useState("");
  const busy = useRef(false),
    cache = useQueryClient(),
    router = useRouter();
  const key = [
    "profile",
    "settings",
    bound?.id ?? "unchecked",
    bound?.role ?? "unchecked",
  ];
  const source = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadProfile(bound ?? undefined, signal),
    enabled: !!session,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    if (!session) router.replace("/login");
    const changed = () => setInvalid(true);
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    const stored = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === "sd_token" ||
        event.key === "sd_user"
      )
        changed();
    };
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
    };
  }, [router, session]);
  const hidden =
    invalid ||
    !session ||
    getToken() !== session ||
    !!error?.unavailable ||
    !!passwordError?.unavailable ||
    (source.error instanceof ProfileFailure && source.error.unavailable);
  useEffect(() => {
    if (source.data && !hidden) setUser(source.data);
  }, [source.data, hidden]);
  const blocked =
    hidden ||
    !!pending ||
    locked ||
    source.isFetching ||
    source.isError ||
    !source.data;
  const safeFailure = (failure: unknown) =>
    failure instanceof ProfileFailure
      ? failure
      : new ProfileFailure(message(failure));
  function sessionCurrent() {
    if (!invalid && session && getToken() === session) return true;
    setInvalid(true);
    return false;
  }
  async function save(value: ProfileDraft) {
    if (!sessionCurrent()) return;
    if (busy.current || blocked || !source.data) return;
    busy.current = true;
    setPending("profile");
    setError(undefined);
    setReview(undefined);
    setNotice("");
    try {
      const saved = await saveProfile(source.data, value);
      if (getToken() !== session)
        throw new ProfileFailure(
          "Your session changed. Reload before continuing.",
          false,
          true,
        );
      cache.setQueryData(key, saved);
      setUser(saved);
      setDraft(profileDraft(saved));
      setNotice("Profile saved and checked.");
      await cache
        .invalidateQueries({ queryKey: ["users", "me"], refetchType: "none" })
        .catch(() => {});
    } catch (failure) {
      const safe = safeFailure(failure);
      setError(safe);
      if (safe.uncertain || safe.conflict) setLocked(true);
      if (safe.uncertain) setEarlierRequest(true);
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  }
  async function check() {
    if (!sessionCurrent()) return;
    if (busy.current || hidden) return;
    busy.current = true;
    setPending("check");
    setReview(undefined);
    setNotice("");
    try {
      const checked = await loadProfile(source.data ?? bound ?? undefined);
      if (getToken() !== session)
        throw new ProfileFailure(
          "Your session changed. Reload before continuing.",
          false,
          true,
        );
      if (source.data) {
        setReview(checked);
        setLocked(true);
        setNotice(
          "Saved details checked. Your edits are unchanged; choose which version to keep.",
        );
      } else {
        cache.setQueryData(key, checked);
        setUser(checked);
      }
      setError(undefined);
    } catch (failure) {
      setError(safeFailure(failure));
      if (source.data) setLocked(true);
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  }
  function adopt(keep: boolean) {
    if (!sessionCurrent()) return;
    if (busy.current || hidden || !review) return;
    setDraft(
      keep
        ? (draft ??
            (source.data ? profileDraft(source.data) : profileDraft(review)))
        : profileDraft(review),
    );
    cache.setQueryData(key, review);
    setUser(review);
    setReview(undefined);
    setLocked(false);
    setError(undefined);
    setNotice(
      keep
        ? "Your edits are kept against the checked saved details. Review before saving."
        : "The checked saved details replaced your local edits. No save was sent.",
    );
  }
  async function password(value: PasswordDraft) {
    if (!sessionCurrent()) return;
    if (busy.current || blocked || passwordLocked || !source.data) return;
    busy.current = true;
    setPending("password");
    setPasswordError(undefined);
    setPasswordNotice("");
    try {
      await changeProfilePassword(source.data, value);
      setPasswordNotice(
        "The server confirmed your password change. Password fields have been cleared.",
      );
    } catch (failure) {
      const safe = safeFailure(failure);
      setPasswordError(safe);
      if (safe.uncertain) setPasswordLocked(true);
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  }
  return (
    <GuiWorkspaceShell
      user={hidden ? undefined : source.data}
      section="Profile"
    >
      {hidden ? (
        <GuiFeedback kind="error" title="Sign-in needs checking">
          <p>
            {error?.unavailable
              ? message(error)
              : passwordError?.unavailable
                ? message(passwordError)
                : "Your session changed or account access couldn’t be confirmed. Reload or sign in before continuing."}
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload profile
          </button>
          <Link href="/login">Sign in</Link>
        </GuiFeedback>
      ) : (
        <ProfileView
          user={source.data}
          draft={
            draft ??
            (source.data
              ? profileDraft(source.data)
              : { name: "", timezone: "UTC", profilePicture: null })
          }
          onDraft={setDraft}
          loading={source.isPending}
          pending={pending}
          blocked={blocked}
          locked={locked}
          passwordLocked={passwordLocked}
          review={review}
          earlierRequest={earlierRequest}
          error={
            error
              ? message(error)
              : source.isError
                ? message(source.error)
                : undefined
          }
          passwordError={passwordError ? message(passwordError) : undefined}
          notice={notice}
          passwordNotice={passwordNotice}
          onSave={(value) => void save(value)}
          onPassword={(value) => void password(value)}
          onCheck={() => void check()}
          onAdopt={adopt}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function ProfilePage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening your profile" />;
  return isCli ? (
    <>
      <div className="bg-background text-foreground p-3 font-mono">
        <button
          type="button"
          className="border border-current rounded px-4 min-h-11"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI profile
        </button>
      </div>
      <CliProfile />
    </>
  ) : (
    <GuiProfile />
  );
}
