"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, Check, GitBranch, Terminal } from "lucide-react";
import { checkDemoAnswer, DEMO_QUIZ } from "./homepage-data";
import styles from "./gui-homepage.module.css";

export function WorkspacePreview() {
  const [view, setView] = useState<"lesson" | "quiz" | "terminal">("lesson");
  const [answer, setAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<boolean | null>(null);

  return (
    <div className={styles.preview}>
      <div className={styles.windowBar}>
        <span className={styles.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>source:dev / learning workspace</span>
        <span className={styles.exampleBadge}>Example</span>
      </div>
      <div className={styles.previewBody}>
        <aside className={styles.previewSidebar} aria-label="Example roadmap">
          <div className={styles.sidebarHeading}>
            <GitBranch size={18} /> Foundations of Git
          </div>
          <span className={styles.sidebarLabel}>YOUR ROADMAP</span>
          <div className={styles.sidebarItem}>
            <Check size={15} /> Commit objects
          </div>
          <div className={`${styles.sidebarItem} ${styles.sidebarActive}`}>
            <span className={styles.smallDot} /> Branches
          </div>
          <div className={styles.sidebarItem}>
            <span className={styles.emptyDot} /> Merging
          </div>
          <div className={styles.sidebarNote}>
            Roadmap → module → concept.
            <br />Build understanding step by step.
          </div>
        </aside>
        <div className={styles.previewContent}>
          <div
            className={styles.previewToolbar}
            aria-label="Explore the example"
          >
            {(
              [
                { id: "lesson", label: "Lesson", icon: BookOpen },
                { id: "quiz", label: "Quick check", icon: Check },
                { id: "terminal", label: "Terminal", icon: Terminal },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <div className={styles.demoPanel} key={view}>
            {view === "lesson" && (
              <>
                <span className={styles.eyebrow}>GIT FUNDAMENTALS / 02</span>
                <h3>The idea behind a branch.</h3>
                <p>
                  Think of a branch as a bookmark, not a photocopy. It points to
                  a commit and moves forward as your work evolves.
                </p>
                <div
                  className={styles.branchDiagram}
                  aria-label="Three connected commits, with a branch pointing to the latest commit"
                >
                  <div className={styles.commitLine} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={styles.branchLabel}>
                    <GitBranch size={15} /> main → latest commit
                  </div>
                  <div className={styles.commitCaptions} aria-hidden="true">
                    <span>commit 1</span>
                    <span>commit 2</span>
                    <span>commit 3</span>
                  </div>
                </div>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => setView("quiz")}
                >
                  Got the idea? Try a quick check <ArrowRight size={16} />
                </button>
              </>
            )}
            {view === "quiz" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (answer !== null) setResult(checkDemoAnswer(answer));
                }}
              >
                <span className={styles.eyebrow}>A LITTLE ACTIVE RECALL</span>
                <fieldset className={styles.quizFieldset}>
                  <legend>{DEMO_QUIZ.question}</legend>
                  {DEMO_QUIZ.options.map((option, index) => (
                    <label className={styles.quizOption} key={option}>
                      <input
                        type="radio"
                        name="demo-answer"
                        checked={answer === index}
                        onChange={() => {
                          setAnswer(index);
                          setResult(null);
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
                <button
                  className={styles.checkButton}
                  disabled={answer === null}
                  type="submit"
                >
                  Check understanding <ArrowRight size={15} />
                </button>
                <div aria-live="polite" className={styles.quizResult}>
                  {result !== null && (
                    <>
                      <strong>
                        {result
                          ? "Exactly right."
                          : "Not quite — try the bookmark idea."}
                      </strong>{" "}
                      {DEMO_QUIZ.explanation}
                    </>
                  )}
                </div>
              </form>
            )}
            {view === "terminal" && (
              <>
                <span className={styles.eyebrow}>ANOTHER WAY TO EXPLORE</span>
                <h3>Prefer a keyboard? Feel at home.</h3>
                <div className={styles.terminalDemo}>
                  <div>
                    <span>developer@source:dev</span> ~
                  </div>
                  <pre>
                    {
                      "$ help\n\nExplore roadmaps. Read concepts.\nCheck your understanding.\n\nSame knowledge. A different interface."
                    }
                  </pre>
                  <span className={styles.terminalCursor} aria-hidden="true">
                    ▌
                  </span>
                </div>
                <p className={styles.demoFootnote}>
                  This is an illustrative preview, not a live terminal.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={styles.previewFooter}>
        <span>
          <span className={styles.statusDot} /> Concept lesson · illustrative example
        </span>
        <span>Illustrative workspace · no progress saved</span>
      </div>
    </div>
  );
}
