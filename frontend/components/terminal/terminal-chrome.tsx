"use client";

import type { CSSProperties, ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import apiClient from "@/lib/api-client";
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
      className={`sd-terminal-theme ${className}`}
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
  routes,
  notificationsHref,
}: {
  user?: User;
  active?: "dashboard" | "terminal";
  syncing?: boolean;
  uptime?: string;
  onLogout: () => void;
  onProfile?: () => void;
  routes?: { dashboard: string; terminal: string; profile?: string };
  /** Bell target (e.g. "/developer/terminal?view=notify"). Absent = no bell. */
  notificationsHref?: string;
}) {
  const dashboardHref = routes?.dashboard ?? "/developer/dashboard";
  const terminalHref = routes?.terminal ?? "/developer/terminal";
  const profileHref = routes?.profile ?? "/developer/terminal?view=profile";
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
      className="sd-topbar"
      style={{
        backgroundColor: c.panel,
        borderBottom: `1px solid ${c.line}`,
        color: c.text,
      }}
    >
      <div className="sd-topbar-brand">
        <Link
          href={dashboardHref}
          className="font-bold tracking-tight whitespace-nowrap"
          style={{ color: c.ink }}
        >
          <span style={{ color: c.primary }} aria-hidden="true">
            ■{" "}
          </span>
          source:dev
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
      <nav className="sd-view-tabs" aria-label="Workspace views">
        <Link
          href={dashboardHref}
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
          href={terminalHref}
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
      <div className="sd-account-actions">
        <span
          className="hidden 2xl:inline text-[11px] truncate max-w-40"
          style={{ color: c.dim }}
        >
          {user?.name}
        </span>
        {user?.role && (
          <span
            className="hidden md:inline text-[11px] font-bold"
            style={{ color: c.primary }}
            aria-label={`Role ${user.role}`}
            title={`Signed in as ${user.role}`}
          >
            [{user.role.toUpperCase()}]
          </span>
        )}
        {user?.role === "admin" &&
          (routes?.dashboard?.startsWith("/admin") ? (
            <Link
              href="/developer/dashboard"
              className="sd-account-control"
              style={controlStyle}
              aria-label="Switch to developer view"
              title="Switch to developer view"
            >
              <span className="hidden sm:inline">[SWITCH:DEV]</span>
              <span className="sm:hidden">[DEV]</span>
            </Link>
          ) : (
            <Link
              href="/admin/dashboard"
              className="sd-account-control"
              style={controlStyle}
              aria-label="Switch to admin view"
              title="Switch to admin view"
            >
              <span className="hidden sm:inline">[SWITCH:ADMIN]</span>
              <span className="sm:hidden">[ADM]</span>
            </Link>
          ))}
        {notificationsHref && <BellControl href={notificationsHref} style={controlStyle} />}
        <button
          type="button"
          onClick={toggleTheme}
          className="sd-account-control"
          style={controlStyle}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          [{isDark ? "DK" : "LT"}]
        </button>
        {onProfile ? (
          <button
            type="button"
            onClick={onProfile}
            className="sd-account-control"
            style={controlStyle}
            aria-label="Open profile"
          >
            {profileGlyph}
          </button>
        ) : (
          <Link
            href={profileHref}
            className="sd-account-control"
            style={controlStyle}
            aria-label="Open profile"
          >
            {profileGlyph}
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="sd-account-control"
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

/** Notifications menu: unread count polled lightly, click opens a themed
 *  dropdown with the newest items — the shell stays one link away. */
function BellControl({
  href,
  style,
}: {
  href: string;
  style: React.CSSProperties;
}) {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<
    Array<{
      id: string;
      type: string;
      payload?: Record<string, unknown>;
      createdAt: string;
      isRead: boolean;
    }>
  >([]);
  const boxRef = React.useRef<HTMLDivElement | null>(null);

  const readCount = React.useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ unread: number }>(
        "/notifications/unread-count",
      );
      setUnread(data.unread ?? 0);
    } catch {
      // The badge is decoration; a dead network must not break the header.
    }
  }, []);

  React.useEffect(() => {
    void readCount();
    const t = setInterval(readCount, 60_000);
    window.addEventListener("focus", readCount);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", readCount);
    };
  }, [readCount]);

  const openMenu = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    try {
      const { data } = await apiClient.get<
        Array<{
          id: string;
          type: string;
          payload?: Record<string, unknown>;
          createdAt: string;
          isRead: boolean;
        }>
      >("/notifications");
      setItems(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setItems([]);
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const markOne = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // Best effort; the shell command reports failures properly.
    }
  };

  const titleOf = (n: (typeof items)[number]): string => {
    const p = n.payload ?? {};
    return (
      (p.roadmapTitle as string) ||
      (p.conceptTitle as string) ||
      (p.title as string) ||
      (p.targetLabel as string) ||
      n.type
    );
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => void openMenu()}
        className="sd-account-control"
        style={
          unread > 0
            ? { ...style, color: "var(--sd-accent, currentColor)" }
            : style
        }
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={12} aria-hidden="true" />
        <span className="hidden sm:inline">
          {unread > 0 ? `[NOTIFICATIONS:${unread}]` : "[NOTIFICATIONS]"}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            maxWidth: "80vw",
            backgroundColor: c.panel,
            border: `1px solid ${c.line}`,
            boxShadow: `3px 3px 0px 0px ${c.shadow}`,
            zIndex: 60,
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              borderBottom: `1px solid ${c.line}`,
              color: c.faint,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ┌─[ notifications :: {unread} unread ]
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {items.length === 0 && (
              <div style={{ padding: "12px 10px", color: c.faint, fontSize: 12 }}>
                Nothing here.
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void markOne(n.id)}
                style={{
                  display: "flex",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderBottom: `1px solid ${c.line}`,
                  color: c.text,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    color: n.isRead ? c.faint : c.primary,
                    fontWeight: 700,
                  }}
                >
                  {n.isRead ? " " : "*"}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: c.faint,
                    }}
                  >
                    [{n.type}]
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {titleOf(n)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Link
            href={href}
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "8px 10px",
              color: c.primary,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            OPEN IN SHELL ➔
          </Link>
        </div>
      )}
    </div>
  );
}
// chips under the header — is gone, along with the shortcut table behind it.
// It was the last of the panelled dashboard showing through into CLI mode, and
// the shell's contract is that the window holds output and a prompt: a verb
// you can click is a verb you never learn to type. `help` lists them, TAB
// completes them, and ↑ recalls them.
