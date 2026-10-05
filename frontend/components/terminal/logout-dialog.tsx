"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuth } from "@/lib/auth";
import { clearTerminalSessions } from "@/lib/terminal/session";
import { TerminalSurface } from "./terminal-chrome";

function LogoutDialog({
  open,
  onDecision,
}: {
  open: boolean;
  onDecision: (confirmed: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, [open]);
  return (
    <TerminalSurface>
      <dialog
        ref={ref}
        className="sd-logout-dialog"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        onCancel={(event) => {
          event.preventDefault();
          onDecision(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              onDecision(false);
          }
        }}
      >
        <div className="sd-dialog-heading">
          <span>┌─[ session :: logout ]</span>
          <button
            type="button"
            onClick={() => onDecision(false)}
            aria-label="Close logout confirmation"
          >
            [×]
          </button>
        </div>
        <div className="sd-dialog-body">
          <p className="sd-line" data-kind="cmd">
            <span className="sd-prompt-user">developer@source-dev</span>
            <span className="sd-prompt-path">:~$</span> logout
          </p>
          <p className="sd-line" data-kind="out" id="logout-description">
            This closes the session and returns to the login screen. Progress is
            stored on the server, not in this tab.
          </p>
          <p className="sd-line" data-kind="head" id="logout-title">
            Confirm? [y/N]
          </p>
          <div className="sd-dialog-actions">
            <button
              type="button"
              className="sd-token"
              autoFocus
              onClick={() => onDecision(false)}
            >
              [N: stay]
            </button>
            <button
              type="button"
              className="sd-token"
              onClick={() => onDecision(true)}
            >
              [y: log out]
            </button>
          </div>
          <p className="sd-dialog-hint">ESC to cancel</p>
        </div>
      </dialog>
    </TerminalSurface>
  );
}

export function useTerminalLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pending = useRef<{
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  } | null>(null);
  const confirmLogout = useCallback(() => {
    if (pending.current) return pending.current.promise;
    let resolve!: (value: boolean) => void;
    const promise = new Promise<boolean>((done) => {
      resolve = done;
    });
    pending.current = { promise, resolve };
    setOpen(true);
    return promise;
  }, []);
  const decide = useCallback((confirmed: boolean) => {
    const request = pending.current;
    pending.current = null;
    setOpen(false);
    request?.resolve(confirmed);
  }, []);
  useEffect(
    () => () => {
      pending.current?.resolve(false);
      pending.current = null;
    },
    [],
  );
  const logout = useCallback(() => {
    clearTerminalSessions();
    clearAuth();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);
  const requestLogout = useCallback(async () => {
    if (await confirmLogout()) logout();
  }, [confirmLogout, logout]);
  return {
    logout,
    confirmLogout,
    requestLogout,
    dialog: <LogoutDialog open={open} onDecision={decide} />,
  };
}
