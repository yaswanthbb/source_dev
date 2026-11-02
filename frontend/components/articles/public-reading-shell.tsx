"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun, Command, ArrowUpRight } from "lucide-react";
import { SourceMark } from "@/components/brand/source-mark";
import { useTheme } from "@/providers/theme-provider";
import gui from "@/components/gui/gui-theme.module.css";
import styles from "./public-reading-shell.module.css";
export function PublicReadingShell({
  children,
  onClassic,
  reader = false,
}: {
  children: ReactNode;
  onClassic: () => void;
  reader?: boolean;
}) {
  const { isDark, toggleTheme } = useTheme(),
    [menuOpen, setMenuOpen] = useState(false),
    menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menuOpen]);
  return (
    <div className={`${gui.theme} ${styles.root}`}>
      <a href="#public-articles-content" className={styles.skip}>
        {reader ? "Skip to article" : "Skip to articles"}
      </a>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <Link href="/" className={styles.brand} aria-label="source:dev home">
            <SourceMark size={32} />
            source:dev
          </Link>
          <nav className={styles.desktopNav} aria-label="Public navigation">
            <Link href="/articles" aria-current={reader ? undefined : "page"}>
              Articles
            </Link>
            <Link href="/developer/dashboard">
              Workspace
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </nav>
          <div className={styles.actions}>
            <button
              className={styles.iconButton}
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {isDark ? (
                <Sun size={19} aria-hidden="true" />
              ) : (
                <Moon size={19} aria-hidden="true" />
              )}
            </button>
            <button
              className={styles.classicButton}
              type="button"
              aria-label="Classic appearance"
              onClick={() => {
                setMenuOpen(false);
                onClassic();
              }}
            >
              <Command size={16} aria-hidden="true" />
              <span>Classic</span>
            </button>
            <Link href="/login" className={styles.login}>
              Log in
            </Link>
            <button
              ref={menuRef}
              className={`${styles.iconButton} ${styles.menuButton}`}
              type="button"
              aria-label={
                menuOpen
                  ? "Close reading navigation"
                  : "Open reading navigation"
              }
              aria-expanded={menuOpen}
              aria-controls="public-reading-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X size={21} aria-hidden="true" />
              ) : (
                <Menu size={21} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="public-reading-menu"
            className={styles.mobileNav}
            aria-label="Mobile reading navigation"
          >
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link
              href="/articles"
              aria-current={reader ? undefined : "page"}
              onClick={() => setMenuOpen(false)}
            >
              Articles
            </Link>
            <Link
              href="/developer/dashboard"
              onClick={() => setMenuOpen(false)}
            >
              Open workspace
            </Link>
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              Log in
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              Create an account
            </Link>
          </nav>
        )}
      </header>
      {children}
      <footer className={styles.footer}>
        <div>
          <Link href="/" className={styles.brand}>
            <SourceMark size={24} />
            source:dev
          </Link>
          <p>Learn. Connect. Recall.</p>
        </div>
        <nav aria-label="Reading footer">
          <Link href="/developer/articles">
            Write an article <span>(sign-in required)</span>
          </Link>
          <Link href="/register">
            Create an account
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </div>
  );
}
