"use client";

/* ==========================================================================
   source:dev — interface mode
   --------------------------------------------------------------------------
   Which interface the user works in (gui | cli), where they are in the
   virtual filesystem, and the two one-time onboarding flags — held in one
   place because they change together.

   Persistence follows the pattern `theme-provider` already established, with
   one addition the brief asks for: as well as localStorage, which is read
   synchronously so there is no flash of the wrong mode, everything here syncs
   to the user record so a preference set on a laptop is there on a phone.

   The important rule, and the reason `lastLocation` lives here rather than
   being derived from the URL in GUI mode:

     GUI mode cannot express deep content. There is no page for a concept in
     this build. So when the user is inside a roadmap and switches to GUI, we
     show them the nearest real page — but we DO NOT move them. Their position
     stays exactly where it was, and switching back returns them to it.

   `guiFallback` answers "what do I render". `lastLocation` answers "where is
   the user". Conflating those is what makes two-system designs drift, so
   nothing in this file writes the former into the latter.
   ========================================================================== */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import {
  AUTH_CHANGED_EVENT,
  getToken,
  getUser,
  setUser,
  type UserPreferences,
} from "@/lib/auth";
import {
  deserializeLocation,
  fromCliParam,
  guiFallback,
  PATH_PARAM,
  ROOT,
  sameLocation,
  serializeLocation,
  toCliRoute,
  type Location,
  type Role,
} from "@/lib/terminal/location";

export type UiMode = "gui" | "cli";

/** The same shape the user record carries. Aliased rather than redeclared, so
 *  the provider's idea of a preference and the cached user's cannot drift. */
export type UiPreferences = UserPreferences;

const MODE_KEY = "sd_ui_mode";
const LOCATION_KEY = "sd_last_location";
const NUDGE_KEY = "sd_seen_cli_nudge";
const WELCOME_KEY = "sd_seen_cli_welcome";

/** New accounts open in the graphical mode. */
const DEFAULT_MODE: UiMode = "gui";

interface UiModeContextValue {
  mode: UiMode;
  isCli: boolean;
  /** Where the user is, whether or not the current mode can render it. */
  location: Location;
  /** True until the stored preferences have been read, so a consumer can hold
   *  off on a one-time animation rather than play it against a default. */
  ready: boolean;
  setMode: (mode: UiMode, options?: { navigate?: boolean }) => void;
  toggleMode: () => void;
  /** Record a move. The CLI calls this on every `cd`; it is the only writer of
   *  the user's position. */
  setLocation: (location: Location) => void;
  /** True the first time this account enters CLI mode — drives the one-time
   *  auto-typed welcome. Reading it does not clear it; call `markWelcomeSeen`. */
  needsCliWelcome: boolean;
  markWelcomeSeen: () => void;
  /** True when the one-time "try CLI mode" nudge is still owed. */
  needsCliNudge: boolean;
  markNudgeSeen: () => void;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage is optional — the server copy is the durable one. */
  }
}

export function UiModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mode, setModeState] = useState<UiMode>(DEFAULT_MODE);
  const [location, setLocationState] = useState<Location>(ROOT);
  const [seenWelcome, setSeenWelcome] = useState(true);
  const [seenNudge, setSeenNudge] = useState(true);
  const [ready, setReady] = useState(false);
  /** The server copy has been read at least once, so a later write is an
   *  update rather than a guess racing the fetch. */
  const synced = useRef(false);

  const role = (getUser()?.role ?? "developer") as Role;

  // ─── Local read, synchronous, first paint ────────────────────────────────
  useEffect(() => {
    const storedMode = readLocal(MODE_KEY);
    if (storedMode === "cli" || storedMode === "gui") setModeState(storedMode);
    setLocationState(deserializeLocation(readLocal(LOCATION_KEY)));
    setSeenWelcome(readLocal(WELCOME_KEY) === "1");
    setSeenNudge(readLocal(NUDGE_KEY) === "1");
    setReady(true);
  }, []);

  // ─── Server read, authoritative across devices ───────────────────────────
  const pullRemote = useCallback(async () => {
    if (!getToken()) return;
    try {
      const { data } = await apiClient.get<{ preferences?: UiPreferences }>(
        "/users/me",
      );
      const prefs = data?.preferences ?? {};
      synced.current = true;

      // The server wins on conflict: it is the shared truth, and a device that
      // has been away is the one more likely to be stale.
      if (prefs.uiMode === "cli" || prefs.uiMode === "gui") {
        setModeState(prefs.uiMode);
        writeLocal(MODE_KEY, prefs.uiMode);
      }
      if (prefs.lastLocation) {
        const remote = deserializeLocation(prefs.lastLocation);
        setLocationState(remote);
        writeLocal(LOCATION_KEY, serializeLocation(remote));
      }
      if (prefs.hasSeenCliWelcome) {
        setSeenWelcome(true);
        writeLocal(WELCOME_KEY, "1");
      }
      if (prefs.hasSeenCliNudge) {
        setSeenNudge(true);
        writeLocal(NUDGE_KEY, "1");
      }
    } catch {
      // Offline or unauthenticated: the local copy carries on unchanged.
    }
  }, []);

  useEffect(() => {
    pullRemote();
    window.addEventListener(AUTH_CHANGED_EVENT, pullRemote);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, pullRemote);
  }, [pullRemote]);

  /** Write through to the user record. Failures are silent by design: a
   *  preference that did not reach the server is still correct locally, and
   *  interrupting someone's work to report it would be worse than the drift. */
  const pushRemote = useCallback((patch: UiPreferences) => {
    if (!getToken()) return;
    apiClient
      .patch("/users/me", { preferences: patch })
      .then(({ data }) => {
        // Keep the cached user current so a later read of preferences — by the
        // navbar, or by a fresh mount — sees what was just written.
        const cached = getUser();
        if (cached && data) setUser({ ...cached, ...data });
      })
      .catch(() => {});
  }, []);

  // ─── The URL, while CLI mode owns it ─────────────────────────────────────
  // In CLI mode the address bar shows the true location, so a refresh, a
  // shared link and the back button all behave. Reading it back here keeps
  // browser navigation authoritative over our own state.
  const paramPath = searchParams.get(PATH_PARAM);
  useEffect(() => {
    if (mode !== "cli") return;
    const fromUrl = fromCliParam(paramPath);
    if (fromUrl && !sameLocation(fromUrl, location)) {
      setLocationState(fromUrl);
      writeLocal(LOCATION_KEY, serializeLocation(fromUrl));
    }
    // `location` is deliberately not a dependency: this effect exists to let
    // the URL drive state, and including it would make the two fight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paramPath]);

  const setLocation = useCallback(
    (next: Location) => {
      setLocationState(next);
      writeLocal(LOCATION_KEY, serializeLocation(next));
      pushRemote({ lastLocation: serializeLocation(next) });

      // In CLI mode the address bar *is* the location, so moving has to write
      // it. Without this, `cd` would change `pwd` while the URL went stale, and
      // a refresh would land the user somewhere they had already left — the two
      // values drifting apart is precisely what sharing one value is meant to
      // rule out.
      //
      // This cannot loop with the effect above: that effect only calls
      // `setLocationState` when the URL differs from `location`, and by the
      // time the new URL arrives they already agree.
      //
      // `push` rather than `replace` so the back button walks back through
      // directories, which is the behaviour a user gets for free once the route
      // and the path are the same thing.
      if (mode === "cli") router.push(toCliRoute(next, role));
    },
    [mode, pushRemote, role, router],
  );

  const setMode = useCallback(
    (next: UiMode, options?: { navigate?: boolean }) => {
      setModeState(next);
      writeLocal(MODE_KEY, next);
      pushRemote({ uiMode: next });

      // Public appearance controls can persist a preference without sending
      // guests into an authenticated workspace. Existing callers still navigate.
      if (options?.navigate === false) return;

      if (next === "cli") {
        // Resume exactly where they were, including the deep locations GUI
        // could not show.
        router.push(toCliRoute(location, role));
        return;
      }

      // Into GUI. `guiFallback` already returns the location's own page when
      // one exists and the nearest real page when it does not, so there is no
      // branch to make here. What matters is what is NOT done: `location` is
      // left alone. The fallback is what we render, never where the user now
      // is — writing it back is what would silently reset them to root.
      router.push(guiFallback(location, role));
    },
    [location, pushRemote, role, router],
  );

  const toggleMode = useCallback(() => {
    setMode(mode === "cli" ? "gui" : "cli");
  }, [mode, setMode]);

  const markWelcomeSeen = useCallback(() => {
    setSeenWelcome(true);
    writeLocal(WELCOME_KEY, "1");
    pushRemote({ hasSeenCliWelcome: true });
  }, [pushRemote]);

  const markNudgeSeen = useCallback(() => {
    setSeenNudge(true);
    writeLocal(NUDGE_KEY, "1");
    pushRemote({ hasSeenCliNudge: true });
  }, [pushRemote]);

  // Keep `<html data-ui-mode>` in step, so CSS can react to mode without every
  // component threading a prop down for it.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.uiMode = mode;
  }, [mode]);

  const value = useMemo<UiModeContextValue>(
    () => ({
      mode,
      isCli: mode === "cli",
      location,
      ready,
      setMode,
      toggleMode,
      setLocation,
      // Only ever true once the stored flags have actually been read, so the
      // animation cannot fire against a default during the first paint.
      needsCliWelcome: ready && !seenWelcome,
      markWelcomeSeen,
      needsCliNudge: ready && !seenNudge,
      markNudgeSeen,
    }),
    [
      mode,
      location,
      ready,
      setMode,
      toggleMode,
      setLocation,
      seenWelcome,
      markWelcomeSeen,
      seenNudge,
      markNudgeSeen,
    ],
  );

  void pathname; // Re-render on navigation; the value itself is URL-derived.

  return (
    <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>
  );
}

export function useUiMode() {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error("useUiMode must be used within a UiModeProvider");
  }
  return context;
}
