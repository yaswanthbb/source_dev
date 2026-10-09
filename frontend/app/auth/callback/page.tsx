"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUiMode } from "@/providers/ui-mode-provider";
import type { User } from "@/lib/auth";
import { dashboardFor } from "@/lib/sign-in";
import {
  callbackProblem,
  completeOAuth,
  readCallbackInput,
} from "@/lib/oauth-callback";
import { CliOAuthCallback } from "@/components/auth/cli-oauth-callback";
import { GuiOAuthCallback } from "@/components/auth/gui-oauth-callback";
import { LoginPlaceholder } from "@/components/auth/login-placeholder";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode } = useUiMode();
  // Capture once: stripping the query must not restart the request or lose its token.
  const [input] = useState(() => readCallbackInput(searchParams));
  const [problem, setProblem] = useState(input.problem);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    window.history.replaceState(window.history.state, "", "/auth/callback");
    try {
      sessionStorage.removeItem("sd_oauth_in_flight");
    } catch {
      /* Optional marker. */
    }
    if (input.problem) return;
    const controller = new AbortController();
    void completeOAuth(input, controller.signal)
      .then((profile) => {
        if (!controller.signal.aborted) setUser(profile);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setProblem(callbackProblem(error));
      });
    return () => controller.abort();
  }, [input]);
  useEffect(() => {
    if (!user || mode !== "gui") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = setTimeout(
      () => router.replace(dashboardFor(user.role)),
      reduced ? 0 : 700,
    );
    return () => clearTimeout(timer);
  }, [user, mode, router]);
  return mode === "cli" ? (
    <CliOAuthCallback problem={problem?.message} user={user} />
  ) : (
    <GuiOAuthCallback problem={problem} user={user} />
  );
}

function ReadyCallback() {
  const { ready } = useUiMode();
  return ready ? (
    <CallbackHandler />
  ) : (
    <LoginPlaceholder title="Preparing provider sign-in" />
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<LoginPlaceholder title="Preparing provider sign-in" />}
    >
      <ReadyCallback />
    </Suspense>
  );
}
