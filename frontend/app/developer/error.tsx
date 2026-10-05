"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TerminalSurface } from "@/components/terminal/terminal-chrome";

/** The developer tree has no chrome above this, so the boundary brings its own
 *  surface — an error must render even when the frame around it is what
 *  failed. */
export default function DeveloperErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Developer Route Error:", error);
  }, [error]);

  return (
    <TerminalSurface className="sd-error-frame">
      <div className="sd-error-panel" role="alert">
        <div className="sd-dialog-heading">
          <span>source-dev://developer — process halted</span>
          <span aria-hidden="true">[!]</span>
        </div>
        <div className="sd-dialog-body">
          <p className="sd-line" data-kind="err">
            [ERR] SIGNAL_TRAP — the session hit an error
          </p>
          <p className="sd-line" data-kind="out">
            Something failed while loading this view. Retrying re-runs it from
            the last good state — your progress is saved on the server, not in
            this tab.
          </p>
          {error.digest && (
            <p className="sd-error-digest">
              <span>digest</span> {error.digest}
            </p>
          )}
          <div className="sd-dialog-actions">
            <Link href="/developer/dashboard" className="sd-token">
              [dashboard]
            </Link>
            <button
              type="button"
              onClick={() => reset()}
              className="sd-token"
            >
              [retry]
            </button>
          </div>
        </div>
      </div>
    </TerminalSurface>
  );
}
