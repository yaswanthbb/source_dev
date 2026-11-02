"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Command,
  MessageSquare,
  Menu,
  Moon,
  PenLine,
  Route,
  RotateCcw,
  Sun,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { SourceMark } from "@/components/brand/source-mark";
import { HOMEPAGE_FAQ, LEARNING_RECIPE, PRODUCT_FEATURES } from "./homepage-data";
import { ConnectionLab } from "./connection-lab";
import { WorkspacePreview } from "./workspace-preview";
import gui from "@/components/gui/gui-theme.module.css";
import styles from "./gui-homepage.module.css";
import experiment from "./homepage-experiment.module.css";

export function GuiHomepage({ onSwitchToCli }: { onSwitchToCli: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const elements =
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!elements || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "visible";
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    const revealAll = () => {
      if (motion.matches) {
        elements.forEach((element) => {
          element.dataset.reveal = "visible";
        });
        observer.disconnect();
      }
    };
    elements.forEach((element) => {
      if (
        !motion.matches &&
        element.getBoundingClientRect().top > window.innerHeight
      ) {
        element.dataset.reveal = "pending";
        observer.observe(element);
      }
    });
    motion.addEventListener("change", revealAll);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", revealAll);
    };
  }, []);

  const sectionLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = document.getElementById(event.currentTarget.hash.slice(1));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "instant" });
        target.focus({ preventScroll: true });
        window.history.replaceState(null, "", event.currentTarget.hash);
      }
    }
  };

  return (
    <div
      ref={root}
      className={`${gui.theme} ${styles.root} ${experiment.experiment}`}
    >
      <a href="#main-content" className={styles.skipLink} onClick={sectionLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <Link href="/" className={styles.brand} aria-label="source:dev home">
            <span className={`${styles.brandMark} ${experiment.brandIcon}`}>
              <SourceMark size={32} />
            </span>
            source<span className={styles.brandColon}>:</span>dev
          </Link>
          <nav className={styles.desktopNav} aria-label="Main navigation">
            <a href="#how-it-works" onClick={sectionLink}>
              How it works
            </a>
            <a href="#workspace" onClick={sectionLink}>
              The workspace
            </a>
            <Link href="/articles">Articles</Link>
          </nav>
          <div className={styles.navActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className={styles.cliButton}
              onClick={onSwitchToCli}
            >
              <Command size={15} />
              <span>CLI</span>
              <span className={styles.srOnly}> appearance</span>
            </button>
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>
            <Link
              href="/register"
              className={`${styles.button} ${styles.navCta}`}
            >
              Start learning <ArrowRight size={15} />
            </Link>
            <button
              ref={menuButton}
              type="button"
              className={`${styles.iconButton} ${styles.menuButton}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="homepage-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="homepage-menu"
            className={styles.mobileNav}
            aria-label="Mobile navigation"
          >
            <a href="#how-it-works" onClick={sectionLink}>
              How it works
            </a>
            <a href="#workspace" onClick={sectionLink}>
              The workspace
            </a>
            <Link href="/articles">Articles</Link>
            <Link href="/login">Log in</Link>
            <Link href="/register">
              Start learning <ArrowRight size={16} />
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className={experiment.hero} aria-labelledby="hero-title">
          <div className={experiment.heroCopy}>
            <div className={experiment.heroKicker}>
              <span aria-hidden="true" /> KNOWLEDGE FOR DEVELOPERS, BUILT BY
              DEVELOPERS
            </div>
            <h1 id="hero-title">
              Learn with
              <br />
              <span>a roadmap.</span>
            </h1>
            <p>
              Explore developer roadmaps, or generate a course with AI.
              Work through focused concept lessons, check your understanding
              with quizzes, and keep practicing with scheduled reviews.
            </p>
            <div className={experiment.heroActions}>
              <Link href="/register" className={styles.button}>
                Start learning <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className={experiment.quietLink}
                onClick={sectionLink}
              >
                Our learning recipe <ArrowDown size={15} aria-hidden="true" />
              </a>
            </div>
            <div className={experiment.heroFootnote}>
              <Route size={16} aria-hidden="true" /> Roadmaps → modules →
              concepts → practice
            </div>
          </div>
          <ConnectionLab />
        </section>
        <div className={experiment.recipeRibbon}>
          <p>
            One topic. A connected course.{" "}
            <span>Lessons, questions and reviews.</span>
          </p>
          <div className={experiment.ribbonSteps}>
            {LEARNING_RECIPE.map((item, index) => (
              <span key={item.id}>
                <span>{item.number}</span>
                <b>{item.verb.toLowerCase()}</b>
                {index < 2 && <ArrowRight size={13} aria-hidden="true" />}
              </span>
            ))}
          </div>
        </div>
        <section
          id="how-it-works"
          tabIndex={-1}
          className={styles.section}
          data-reveal="visible"
          aria-labelledby="how-title"
        >
          <div className={experiment.recipeHeading}>
            <div>
              <span className={styles.eyebrow}>THE SOURCE RECIPE</span>
              <h2 id="how-title">
                From the big picture{" "}
                <br />
                to what you remember.
              </h2>
            </div>
            <p>
              Our learning recipe brings structure, questions and practice
              together. Here’s how source:dev helps you work through a topic.
            </p>
          </div>
          <div className={experiment.recipeCards}>
            {LEARNING_RECIPE.map((item, index) => {
              const Icon = [Route, BookOpen, RotateCcw][index];
              return (
                <article className={experiment.recipeCard} key={item.id}>
                  <div className={experiment.recipeNumber}>
                    <span>
                      {item.number} / {item.verb.toUpperCase()}
                    </span>
                    <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              );
            })}
          </div>
        </section>
        <div className={experiment.workspaceIntro}>
          <h2>A lesson. A check. A different view.</h2>
          <p>
            Try a Git concept, answer a quiz question, or open the terminal
            example. These previews are local—not a live learner session.
          </p>
        </div>
        <section
          id="workspace"
          tabIndex={-1}
          className={styles.workspace}
          aria-label="Try the learning workspace"
        >
          <h2 className={styles.srOnly}>Explore the learning workspace</h2>
          <div className={styles.previewBackdrop} aria-hidden="true">
            <svg viewBox="0 0 1100 540" preserveAspectRatio="none">
              <path d="M-60 440 C120 500 100 100 360 60 S750 500 1160 160" />
              <path d="M-60 490 C140 550 120 150 380 110 S770 550 1160 210" />
            </svg>
          </div>
          <WorkspacePreview />
          <p className={styles.previewCaption}>
            Try the Lesson, Quick check and Terminal controls. No account
            needed; no progress saved.
          </p>
        </section>
        <section
          className={styles.section}
          data-reveal="visible"
          aria-labelledby="features-title"
        >
          <div className={experiment.recipeHeading}>
            <div>
              <span className={styles.eyebrow}>MORE THAN A LESSON LIBRARY</span>
              <h2 id="features-title">
                Learn, ask and author.{" "}
                <br />
                In the same place.
              </h2>
            </div>
            <p>
              Use a published roadmap or create your own. The tools support
              both sides of learning.
            </p>
          </div>
          <div className={experiment.featureCards}>
            {PRODUCT_FEATURES.map((feature, index) => {
              const Icon = [Sparkles, MessageSquare, PenLine][index];
              return (
                <article key={feature.id} className={experiment.featureCard}>
                  <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                  <span className={styles.eyebrow}>{feature.label}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.detail}</p>
                  <span className={experiment.featureNote}>{feature.note}</span>
                </article>
              );
            })}
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.splitSection}`}
          data-reveal="visible"
          aria-labelledby="pace-title"
        >
          <div className={styles.splitCopy}>
            <span className={styles.eyebrow}>
              TWO INTERFACES. ONE ACCOUNT.
            </span>
            <h2 id="pace-title">
              Visual workspace.{" "}
              <br />
              Terminal workflow.
            </h2>
            <p>
              Choose the GUI for a visual view or the CLI for a keyboard-first
              workflow. Your account, learning content and saved progress
              stay the same when you switch.
            </p>
            <button
              type="button"
              className={styles.textButton}
              onClick={onSwitchToCli}
            >
              Explore the CLI appearance <ArrowRight size={17} />
            </button>
          </div>
          <div className={styles.interfaceCard}>
            <div className={styles.interfaceTitle}>
              <SourceMark size={24} /> One workspace. Two perspectives.
            </div>
            <div className={styles.interfaceRow}>
              <span className={styles.interfaceIcon}>
                <BookOpen size={24} />
              </span>
              <div>
                <strong>Click, read and explore.</strong>
                <p>A graphical view of your learning workspace.</p>
              </div>
              <span className={styles.interfaceBadge}>GUI</span>
            </div>
            <div className={styles.interfaceRow}>
              <span className={styles.interfaceIcon}>
                <Terminal size={24} />
              </span>
              <div>
                <strong>Navigate with commands.</strong>
                <p>Keyboard-first, with help and completion.</p>
              </div>
              <span className={styles.interfaceBadge}>CLI</span>
            </div>
            <div className={styles.interfaceBottom}>
              <span className={styles.statusDot} /> Shared account, content and
              progress.
            </div>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.faqSection}`}
          data-reveal="visible"
          aria-labelledby="faq-title"
        >
          <div>
            <span className={styles.eyebrow}>A FEW THINGS TO KNOW</span>
            <h2 id="faq-title">Before you start.</h2>
          </div>
          <div className={styles.faqList}>
            {HOMEPAGE_FAQ.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={18} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.finalCta} data-reveal="visible">
          <div className={experiment.markDecoration} aria-hidden="true">
            <SourceMark size={140} />
          </div>
          <span className={experiment.finalNote}>
            <RotateCcw size={14} aria-hidden="true" /> YOUR NEXT TOPIC, STEP BY
            STEP.
          </span>
          <h2 className={experiment.finalHeading}>
            Pick a roadmap.{" "}
            <br />
            Start with one concept.
          </h2>
          <p>
            Create an account to explore roadmaps, practice with quizzes and
            save your progress.
          </p>
          <Link href="/register" className={styles.button}>
            Create your account <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}>
          <SourceMark size={27} /> source:dev
        </Link>
        <span>Knowledge for developers, built by developers.</span>
        <nav aria-label="Footer navigation">
          <Link href="/articles">Articles</Link>
          <Link href="/login">Log in</Link>
          <Link href="/register">
            Get started <ArrowRight size={14} />
          </Link>
        </nav>
      </footer>
    </div>
  );
}
