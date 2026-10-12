"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PenLine,
  RotateCcw,
  Sparkles,
  Sun,
  Terminal,
  UserRound,
  X,
} from "lucide-react";
import { SourceMark } from "@/components/brand/source-mark";
import { clearAuth, type User } from "@/lib/auth";
import { clearTerminalSessions } from "@/lib/terminal/session";
import { toCliRoute } from "@/lib/terminal/location";
import { useUiMode } from "@/providers/ui-mode-provider";
import { useTheme } from "@/providers/theme-provider";
import theme from "./gui-theme.module.css";
import styles from "./gui-workspace-shell.module.css";

const NAVIGATION = [
  { href: "/developer/dashboard", title: "Overview", icon: LayoutDashboard },
  {
    href: "/developer/roadmaps",
    title: "Roadmaps",
    icon: BookOpen,
  },
  { href: "/developer/review", title: "Reviews", icon: RotateCcw },
  { href: "/developer/content", title: "My content", icon: PenLine },
  {
    href: "/developer/generate",
    title: "AI generation & jobs",
    icon: Sparkles,
  },
  { href: "/developer/articles", title: "My articles", icon: FileText },
  { href: "/developer/keys", title: "AI provider keys", icon: KeyRound },
];

/** Opt in page by page: unfinished legacy routes keep their own chrome and styling. */
export function GuiWorkspaceShell({
  user,
  children,
  section = "Overview",
}: {
  user?: User;
  children: ReactNode;
  section?: string;
}) {
  const { isDark, toggleTheme } = useTheme();
  const { setMode, location } = useUiMode();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);
  useEffect(() => {
    if (!logoutOpen || !logoutRef.current) return;
    const dialog = logoutRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    stayRef.current?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, [logoutOpen]);

  const enterCli = () => setMode("cli", { navigate: false });
  const confirmLogout = () => {
    clearTerminalSessions();
    clearAuth();
    queryClient.clear();
    router.replace("/login");
  };
  return (
    <div className={`${theme.theme} ${styles.shell}`}>
      <a href="#workspace-content" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.mobileHeader}>
        <Link href="/developer/dashboard" className={styles.brand}>
          <SourceMark />
          source:dev
        </Link>
        <button
          ref={menuRef}
          type="button"
          className={styles.iconButton}
          aria-label={
            menuOpen
              ? "Close workspace navigation"
              : "Open workspace navigation"
          }
          aria-expanded={menuOpen}
          aria-controls="workspace-sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </header>
      <aside
        id="workspace-sidebar"
        className={`${styles.sidebar} ${menuOpen ? styles.open : ""}`}
      >
        <Link
          href="/developer/dashboard"
          className={`${styles.brand} ${styles.desktopBrand}`}
        >
          <SourceMark />
          source:dev
        </Link>
        <span className={styles.workspaceLabel}>Your workspace</span>
        <nav aria-label="Workspace navigation" className={styles.navigation}>
          {NAVIGATION.map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={styles.navLink}
              aria-current={
                pathname === href ||
                (href === "/developer/content" &&
                  (pathname === "/developer/concepts/new" ||
                    /^\/developer\/concepts\/[^/]+\/edit$/.test(pathname))) ||
                ((href === "/developer/roadmaps" ||
                  href === "/developer/content") &&
                  pathname.startsWith(`${href}/`))
                  ? "page"
                  : undefined
              }
              onClick={() => {
                setMenuOpen(false);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {title}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.recipe}>
            <SourceMark size={24} />
            <p>
              Learn. Connect. Recall.<span>One concept at a time.</span>
            </p>
          </div>
          <button
            type="button"
            className={styles.navLink}
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
            {isDark ? "Light theme" : "Dark theme"}
          </button>
          <Link
            className={styles.navLink}
            href={toCliRoute(location, "developer")}
            onClick={enterCli}
          >
            <Terminal size={18} aria-hidden="true" />
            Switch to CLI
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <p>
            Workspace<span aria-hidden="true">/</span>
            <strong>{section}</strong>
          </p>
          <div className={styles.account}>
            {user?.role === "admin" && (
              <Link href="/admin/dashboard" className={styles.adminLink}>
                Admin view
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/developer/terminal?view=notify"
              onClick={enterCli}
              className={styles.iconButton}
              aria-label="Notifications — opens in CLI"
              title="Notifications — opens in CLI"
            >
              <Bell size={19} aria-hidden="true" />
            </Link>
            <Link
              href="/profile"
              className={styles.profile}
              aria-label="View your profile"
            >
              <span className={styles.avatar} aria-hidden="true">
                {user?.name?.trim().charAt(0).toUpperCase() || (
                  <UserRound size={17} />
                )}
              </span>
              <span>{user?.name || "Your account"}</span>
            </Link>
          </div>
        </header>
        <main id="workspace-content" tabIndex={-1} className={styles.content}>
          {children}
        </main>
      </div>
      <dialog
        ref={logoutRef}
        className={styles.dialog}
        aria-labelledby="gui-logout-title"
        aria-describedby="gui-logout-description"
        onCancel={(event) => {
          event.preventDefault();
          setLogoutOpen(false);
        }}
      >
        <span className={styles.dialogIcon}>
          <LogOut size={23} aria-hidden="true" />
        </span>
        <h2 id="gui-logout-title">Log out of source:dev?</h2>
        <p id="gui-logout-description">
          Your saved progress stays with your account. You can pick up where you
          left off when you sign in again.
        </p>
        <div className={styles.dialogActions}>
          <button
            ref={stayRef}
            type="button"
            onClick={() => setLogoutOpen(false)}
          >
            Stay here
          </button>
          <button type="button" onClick={confirmLogout}>
            Log out
          </button>
        </div>
      </dialog>
    </div>
  );
}
