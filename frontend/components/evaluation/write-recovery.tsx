"use client";
import { useEffect, useRef, useState } from "react";
import type { ExecutionRecovery } from "./execution-client";
import styles from "./execution.module.css";
export interface WriteRecoveryProps {
  paused: boolean;
  busy: boolean;
  recovery?: ExecutionRecovery & {
    decisionState?: string;
    releaseState?: string;
  };
  onRecover: () => void;
  onResume: () => void;
}
export function WriteRecovery(p: WriteRecoveryProps) {
  const [consent, setConsent] = useState(false),
    feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setConsent(false);
    if (p.recovery && !feedback.current?.closest("[hidden]"))
      feedback.current?.focus();
  }, [p.recovery]);
  if (!p.paused) return null;
  return (
    <section className={styles.recovery}>
      <h3>Check without replaying</h3>
      <p>
        All evaluation writes are paused. Check current admin access, references
        and known saved records. There is no expert-review lookup, global run
        list, candidate GET, comparison GET or release/serving GET. Unknown
        earlier writes cannot be ruled out.
      </p>
      <button type="button" disabled={p.busy} onClick={p.onRecover}>
        {p.busy ? "Checking saved state…" : "Check saved state only"}
      </button>
      {p.recovery && (
        <div ref={feedback} tabIndex={-1}>
          <p role="status">
            Current references and {p.recovery.runs.length} known runs checked.
            No write request was repeated.
          </p>
          {p.recovery.decisionState && <p>{p.recovery.decisionState}</p>}
          {p.recovery.releaseState && <p>{p.recovery.releaseState}</p>}
          {p.recovery.runs.length > 0 && (
            <ul>
              {p.recovery.runs.map((r) => (
                <li key={r.id}>
                  {r.id} · {r.status}
                </li>
              ))}
            </ul>
          )}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={consent}
              disabled={p.busy}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I understand this check may not identify earlier writes or charges.
          </label>
          <button
            type="button"
            disabled={p.busy || !consent}
            onClick={() => {
              if (consent) p.onResume();
            }}
          >
            Use checked references and resume
          </button>
        </div>
      )}
    </section>
  );
}
