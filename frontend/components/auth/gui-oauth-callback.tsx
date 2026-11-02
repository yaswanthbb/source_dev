"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import type { User } from "@/lib/auth";
import { dashboardFor, type SignInProblem } from "@/lib/sign-in";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { GuiAuthShell } from "./gui-auth-shell";
import styles from "./gui-auth.module.css";

export function GuiOAuthCallback({
  problem,
  user,
}: {
  problem?: SignInProblem;
  user: User | null;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (problem) notice.current?.focus();
  }, [problem]);
  return (
    <GuiAuthShell kind="callback">
      <span className={styles.eyebrow}>PROVIDER SIGN-IN</span>
      <h1 id="callback-title">
        {problem
          ? "Let’s try that again."
          : user
            ? "You’re signed in."
            : "Finishing sign-in."}
      </h1>
      <p className={styles.intro}>
        {problem
          ? "Your workspace is still here. Start again from sign in."
          : user
            ? "Your session is ready. Taking you to your workspace."
            : "Checking your account and preparing your workspace."}
      </p>
      {problem ? (
        <>
          <GuiFeedback ref={notice} kind="error" title={problem.title}>
            {problem.message}
          </GuiFeedback>
          <div className={styles.statusActions}>
            <Link href="/login" className={styles.submit}>
              Back to sign in <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : user ? (
        <>
          <GuiFeedback kind="success" title="Sign-in complete">
            Opening your {user.role === "admin" ? "admin" : "developer"}{" "}
            workspace.
          </GuiFeedback>
          <div className={styles.statusActions}>
            <Link href={dashboardFor(user.role)} className={styles.submit}>
              Open workspace <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : (
        <>
          <GuiFeedback kind="loading" title="Verifying your sign-in">
            Please wait. We’ll confirm your session before opening your
            workspace.
          </GuiFeedback>
          <p className={styles.registerPrompt}>
            <Link href="/login">Return to sign in</Link>
          </p>
        </>
      )}
    </GuiAuthShell>
  );
}
