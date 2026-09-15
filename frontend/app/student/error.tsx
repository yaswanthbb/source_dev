"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TerminalSurface } from "@/components/terminal/terminal-chrome";

/** The student tree has no chrome above this, so the boundary brings its own
 *  surface — an error must render even when the frame around it is what
 *  failed. */
export default function StudentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student Route Error:", error);
  }, [error]);

  return (
    <TerminalSurface className="kip-error-frame">
      <div className="kip-error-panel" role="alert">
        <div className="kip-dialog-heading">
          <span>kip://student — process halted</span>
          <span aria-hidden="true">[!]</span>
        </div>
        <div className="kip-dialog-body">
          <p className="kip-line" data-kind="err">
            [ERR] SIGNAL_TRAP — the session hit an error
          </p>
          <p className="kip-line" data-kind="out">
            Something failed while loading this view. Retrying re-runs it from
            the last good state — your progress is saved on the server, not in
            this tab.
          </p>
          {error.digest && (
            <p className="kip-error-digest">
              <span>digest</span> {error.digest}
            </p>
          )}
          <div className="kip-dialog-actions">
            <Link href="/student/dashboard" className="kip-token">
              [dashboard]
            </Link>
            <button
              type="button"
              onClick={() => reset()}
              className="kip-token"
            >
              [retry]
            </button>
          </div>
        </div>
      </div>
    </TerminalSurface>
  );
}
