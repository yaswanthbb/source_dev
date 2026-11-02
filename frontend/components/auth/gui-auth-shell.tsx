"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Command,
  Moon,
  Sun,
  BookOpen,
  FileText,
  Layers,
  PenLine,
} from "lucide-react";
import { SourceMark } from "@/components/brand/source-mark";
import { useTheme } from "@/providers/theme-provider";
import gui from "@/components/gui/gui-theme.module.css";
import styles from "./gui-auth.module.css";

export function GuiAuthShell({
  children,
  onSwitchToCli,
  busy = false,
  kind = "login",
}: {
  children: ReactNode;
  onSwitchToCli?: () => void;
  busy?: boolean;
  kind?: "login" | "register" | "recovery" | "callback";
}) {
  const { theme, toggleTheme } = useTheme();
  const isRegister = kind === "register";
  const isRecovery = kind === "recovery";
  const isCallback = kind === "callback";
  const formId = isRegister
    ? "sign-up"
    : isRecovery
      ? "account-recovery"
      : isCallback
        ? "auth-callback"
        : "sign-in";
  return (
    <div className={`${gui.theme} ${styles.root}`}>
      <a href={`#${formId}`} className={styles.skipLink}>
        {isRegister
          ? "Skip to sign up"
          : isRecovery
            ? "Skip to account recovery"
            : isCallback
              ? "Skip to sign-in status"
              : "Skip to sign in"}
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="source:dev home">
          <SourceMark size={32} />{" "}
          <span>
            source<span className={styles.colon}>:</span>dev
          </span>
        </Link>
        <div className={styles.headerActions}>
          <Link href="/" className={styles.homeLink}>
            <ArrowLeft size={15} aria-hidden="true" /> Home
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.iconButton}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
          >
            {theme === "dark" ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>
          {onSwitchToCli && (
            <button
              type="button"
              onClick={onSwitchToCli}
              disabled={busy}
              className={styles.modeButton}
            >
              <Command size={15} aria-hidden="true" /> CLI{" "}
              <span className={styles.srOnly}>appearance</span>
            </button>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <aside className={styles.story} aria-labelledby="auth-story-title">
          <span className={styles.eyebrow}>
            {isRecovery
              ? "ACCOUNT RECOVERY"
              : isCallback
                ? "BACK TO SOURCE:DEV"
                : isRegister
                  ? "A WORKSPACE FOR YOUR CURIOSITY"
                  : "YOUR DEVELOPER WORKSPACE"}
          </span>
          <h2 id="auth-story-title">
            {isRecovery ? (
              <>
                A fresh start.
                <br />
                Same workspace.
              </>
            ) : isCallback ? (
              <>
                Your workspace
                <br />
                is one step away.
              </>
            ) : isRegister ? (
              <>
                Your next idea
                <br />
                starts here.
              </>
            ) : (
              <>
                One place to learn,
                <br />
                practice and build.
              </>
            )}
          </h2>
          <p>
            {isRecovery
              ? "Confirm your email with a code, choose a new password, and return to your roadmaps and reviews."
              : isCallback
                ? "We’re completing your provider sign-in so you can return to learning, practice and your own content."
                : isRegister
                  ? "Follow a roadmap, connect the concepts, and revisit what you’ve learned. Or share your knowledge by writing a course."
                  : "Pick up a roadmap, revisit a concept, or work on a course of your own."}
          </p>
          {isRegister ? (
            <div className={styles.authorCanvas} aria-hidden="true">
              <div className={styles.canvasAnnotation}>
                <PenLine size={14} /> Make it your own
              </div>
              <div className={styles.canvasSheet}>
                <div className={styles.canvasTop}>
                  <BookOpen size={18} />
                  <span>YOUR ROADMAP</span>
                  <span className={styles.draftStamp}>Draft</span>
                </div>
                <div className={styles.canvasHeading}>
                  From idea to learning path.
                </div>
                <div className={styles.canvasModule}>
                  <Layers size={15} />
                  <span>Module</span>
                  <span>01</span>
                </div>
                <div className={styles.canvasConcepts}>
                  <span>
                    <FileText size={14} /> A clear concept
                    <i />
                  </span>
                  <span>
                    <FileText size={14} /> A practical example
                    <i />
                  </span>
                </div>
                <div className={styles.canvasBottom}>
                  <span>Write · Connect · Share</span>
                  <SourceMark size={27} />
                </div>
              </div>
            </div>
          ) : isRecovery ? (
            <div className={styles.recoveryIllustration} aria-hidden="true">
              {[
                ["01", "Your email", "Start with your account"],
                ["02", "Email code", "Confirm it’s you"],
                ["03", "New password", "Return to your workspace"],
              ].map(([number, title, detail]) => (
                <div key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.learningPath} aria-hidden="true">
              <svg
                viewBox="0 0 440 245"
                fill="none"
                className={styles.pathDrawing}
              >
                <path d="M65 62H288C366 62 379 166 303 166H115" />
                <path d="m124 157-9 9 9 9" />
              </svg>
              <div className={`${styles.pathCard} ${styles.pathRoadmap}`}>
                <span>01</span> Roadmap <span>Learn</span>
              </div>
              <div className={`${styles.pathCard} ${styles.pathConcept}`}>
                <span>02</span> Concept <span>Connect</span>
              </div>
              <div className={`${styles.pathCard} ${styles.pathPractice}`}>
                <span>03</span> Practice <span>Recall</span>
              </div>
              <div className={styles.pathMark}>
                <SourceMark size={52} />
              </div>
            </div>
          )}
          <div className={styles.storyFootnote}>
            <span /> Your account. Both interfaces.
          </div>
        </aside>
        <section
          id={formId}
          tabIndex={-1}
          className={styles.formPanel}
          aria-labelledby={`${kind}-title`}
        >
          {children}
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Knowledge for developers, built by developers.</span>
        <Link href="/articles">
          Read public articles <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  );
}
