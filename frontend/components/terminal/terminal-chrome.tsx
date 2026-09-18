"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import type { User } from "@/lib/auth";
import { DARK, LIGHT } from "@/components/terminal/themes";
import { useTheme } from "@/providers/theme-provider";
import "./terminal.css";

export function TerminalSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  return (
    <div
      className={`kip-terminal-theme ${className}`}
      style={
        {
          "--term-base": c.base,
          "--term-panel": c.panel,
          "--term-head": c.head,
          "--term-hover": c.hover,
          "--term-ink": c.ink,
          "--term-text": c.text,
          "--term-dim": c.dim,
          "--term-faint": c.faint,
          "--term-line": c.line,
          "--term-accent": c.primary,
          "--term-alert": c.alert,
          "--term-shadow": c.shadow,
          "--term-error": isDark ? "#fca5a5" : "#b91c1c",
          colorScheme: isDark ? "dark" : "light",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function TerminalHeader({
  user,
  active,
  syncing = false,
  uptime,
  onLogout,
  onProfile,
}: {
  user?: User;
  active?: "dashboard" | "terminal";
  syncing?: boolean;
  uptime?: string;
  onLogout: () => void;
  onProfile?: () => void;
}) {
  const { isDark, toggleTheme } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const controlStyle = {
    border: `1px solid ${c.line}`,
    color: c.dim,
    backgroundColor: c.head,
  };
  const profileGlyph = (
    <>
      <svg
        width="9"
        height="10"
        viewBox="0 0 9 10"
        fill="currentColor"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        <rect x="3" y="0" width="3" height="1" />
        <rect x="2" y="1" width="5" height="3" />
        <rect x="3" y="4" width="3" height="1" />
        <rect x="1" y="6" width="7" height="1" />
        <rect x="0" y="7" width="9" height="3" />
      </svg>
      <span className="hidden sm:inline">[USR]</span>
    </>
  );
  return (
    <header
      className="kip-topbar"
      style={{
        backgroundColor: c.panel,
        borderBottom: `1px solid ${c.line}`,
        color: c.text,
      }}
    >
      <div className="kip-topbar-brand">
        <Link
          href="/student/dashboard"
          className="font-bold tracking-tight whitespace-nowrap"
          style={{ color: c.ink }}
        >
          <span style={{ color: c.primary }} aria-hidden="true">
            ■{" "}
          </span>
          KIP
          <span className="hidden md:inline">{" // KNOWLEDGE IS POWER"}</span>
        </Link>
        <span
          className="hidden xl:inline text-[11px] whitespace-nowrap"
          style={{ color: syncing ? c.alert : c.primary }}
        >
          {syncing ? "[SYS: SYNC]" : "[SYS: OK]"}
        </span>
        {uptime && (
          <span
            className="hidden 2xl:inline text-[11px] whitespace-nowrap"
            style={{ color: c.dim }}
          >
            [UPTIME: {uptime}]
          </span>
        )}
      </div>
      <nav className="kip-view-tabs" aria-label="Workspace views">
        <Link
          href="/student/dashboard"
          aria-current={active === "dashboard" ? "page" : undefined}
          style={
            active === "dashboard"
              ? { backgroundColor: c.ink, color: c.base }
              : { color: c.dim }
          }
        >
          [1: <span className="hidden sm:inline">DASHBOARD</span>
          <span className="sm:hidden">DASH</span>]
        </Link>
        <Link
          href="/student/terminal"
          aria-current={active === "terminal" ? "page" : undefined}
          style={
            active === "terminal"
              ? { backgroundColor: c.ink, color: c.base }
              : { color: c.dim }
          }
        >
          [2: <span className="hidden sm:inline">TERMINAL </span>CLI]
        </Link>
      </nav>
      <div className="kip-account-actions">
        <span
          className="hidden 2xl:inline text-[11px] truncate max-w-40"
          style={{ color: c.dim }}
        >
          {user?.name}
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          className="kip-account-control"
          style={controlStyle}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          [{isDark ? "DK" : "LT"}]
        </button>
        {onProfile ? (
          <button
            type="button"
            onClick={onProfile}
            className="kip-account-control"
            style={controlStyle}
            aria-label="Open profile"
          >
            {profileGlyph}
          </button>
        ) : (
          <Link
            href="/student/terminal?view=profile"
            className="kip-account-control"
            style={controlStyle}
            aria-label="Open profile"
          >
            {profileGlyph}
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="kip-account-control"
          style={controlStyle}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={12} aria-hidden="true" />
          <span className="hidden sm:inline">[LOGOUT]</span>
        </button>
      </div>
    </header>
  );
}

// The `RUN:` strip that used to live here — a row of `[ROADMAPS]` `[REVIEW]`
// chips under the header — is gone, along with the shortcut table behind it.
// It was the last of the panelled dashboard showing through into CLI mode, and
// the shell's contract is that the window holds output and a prompt: a verb
// you can click is a verb you never learn to type. `help` lists them, TAB
// completes them, and ↑ recalls them.
