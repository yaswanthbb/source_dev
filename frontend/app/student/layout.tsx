"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_CHANGED_EVENT, getToken } from "@/lib/auth";
import { clearTerminalSessions } from "@/lib/terminal/session";
import { MinimalTerminalLoader } from "@/components/loaders/minimal-terminal-loader";
import "./dashboard/terminal-dashboard.css";

/** Auth guard only. Every student surface — the dashboard and the terminal —
 *  owns its own full-screen frame, so this shell adds no chrome of its own. */
export default function StudentAppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoaderDone, setIsLoaderDone] = useState(false);
  useEffect(() => {
    const check = () => {
      const authenticated = Boolean(getToken());
      setIsAuthChecked(authenticated);
      if (!authenticated) {
        clearTerminalSessions();
        router.replace("/login");
      }
    };
    check();
    window.addEventListener(AUTH_CHANGED_EVENT, check);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, check);
  }, [router]);
  useEffect(() => {
    try {
      const recent = sessionStorage.getItem("sd_just_logged_in");
      if (recent && Date.now() - Number(recent) < 30000) setIsLoaderDone(true);
    } catch {
      /* Storage is optional. */
    }
    const timer = setTimeout(() => {
      try {
        sessionStorage.removeItem("sd_just_logged_in");
      } catch {}
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  if (!isAuthChecked || !isLoaderDone)
    return (
      <MinimalTerminalLoader
        minDuration={2000}
        isAsyncComplete={isAuthChecked}
        onComplete={() => setIsLoaderDone(true)}
        title="student // auth_guard"
        stage="STAGE_01"
      />
    );
  return <>{children}</>;
}
