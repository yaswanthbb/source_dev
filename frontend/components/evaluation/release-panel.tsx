"use client";
import { useEffect, useRef, useState } from "react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { TASKS, DIMENSIONS, DIMENSION_LABELS } from "./evaluation-data";
import { RunDetail } from "./evaluation-view";
import {
  releaseTask,
  releaseSourceFingerprint,
  type ReleaseSource,
  type ReleaseAction,
  type ApprovalEvidence,
  type ReleaseOutcome,
} from "./release-data";
import type { EvaluationLibrary } from "./evaluation-client";
import { WriteRecovery, type WriteRecoveryProps } from "./write-recovery";
import styles from "./execution.module.css";
import releaseStyles from "./release.module.css";
export interface ReleaseProps extends WriteRecoveryProps {
  library?: EvaluationLibrary;
  source?: ReleaseSource;
  evidence?: ApprovalEvidence;
  outcome?: ReleaseOutcome;
  error?: string;
  earlier: boolean;
  onCheck: () => Promise<void>;
  onSubmit: (action: ReleaseAction) => Promise<void>;
}
export function ProtectedMetrics({ evidence }: { evidence: ApprovalEvidence }) {
  const r = evidence.report,
    percent = (v: number) => `${(v * 100).toFixed(1)}%`,
    score = (v: number) => v.toFixed(2),
    delta = (v: number, rate = false) =>
      `${v > 0 ? "+" : ""}${(v * (rate ? 100 : 1)).toFixed(2)}${rate ? " pp" : ""}`;
  const rows: [string, number, number, boolean][] = [
    [
      "Deterministic pass rate",
      r.baseline.layer1PassRate,
      r.candidate.layer1PassRate,
      true,
    ],
    [
      "Golden pass rate",
      r.baseline.goldenPassRate,
      r.candidate.goldenPassRate,
      true,
    ],
    ...DIMENSIONS.map(
      (d) =>
        [
          DIMENSION_LABELS[d],
          r.baseline.judgeScores[d],
          r.candidate.judgeScores[d],
          false,
        ] as [string, number, number, boolean],
    ),
  ];
  return (
    <>
      <p>
        Baseline {evidence.source.action.baselineVersion} → candidate{" "}
        {evidence.source.action.candidateVersion} · {r.baseline.n} reference
        cases per cohort
      </p>
      <div
        className={releaseStyles.tableScroll}
        tabIndex={0}
        role="region"
        aria-label="Protected metric observations"
      >
        <table>
          <caption>
            Observed protected metrics · baseline versus candidate
          </caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Baseline</th>
              <th scope="col">Candidate</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, a, b, rate]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{rate ? percent(a) : score(a)}</td>
                <td>{rate ? percent(b) : score(b)}</td>
                <td>{delta(b - a, rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Individual deterministic checks</summary>
        <ul>
          {Object.keys(r.baseline.checks).length ? (
            Object.entries(r.baseline.checks).map(([code, rate]) => (
              <li key={code}>
                {code}: baseline {percent(rate)} · candidate{" "}
                {r.candidate.checks[code] === undefined
                  ? "Not observed"
                  : percent(r.candidate.checks[code])}
              </li>
            ))
          ) : (
            <li>No individual baseline checks recorded.</li>
          )}
        </ul>
      </details>
      <p className={styles.hint}>
        Non-regression can pass when both versions have the same failures. These
        observations do not establish absolute quality, learner outcomes or
        current serving eligibility. The server rechecks stored source, judge
        evidence, prompt hashes, corpus and current baseline on approval.
      </p>
    </>
  );
}
export function ReleasePanel(p: ReleaseProps) {
  const [kind, setKind] = useState<ReleaseAction["kind"]>("approve"),
    [task, setTask] = useState(""),
    [validation, setValidation] = useState(""),
    [confirmation, setConfirmation] = useState<ReleaseAction>(),
    [consent, setConsent] = useState(false),
    [sending, setSending] = useState(false),
    [selected, setSelected] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    keep = useRef<HTMLButtonElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    errors = useRef<HTMLDivElement>(null),
    pending = useRef<HTMLParagraphElement>(null),
    gate = useRef(false),
    restore = useRef(false);
  const disabled = p.busy || !p.library || sending,
    writeDisabled = disabled || p.paused;
  const evidence =
    p.evidence &&
    p.source &&
    releaseSourceFingerprint(p.evidence.source) ===
      releaseSourceFingerprint(p.source)
      ? p.evidence
      : undefined;
  useEffect(() => {
    if (confirmation) {
      dialog.current?.showModal();
      keep.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = 0;
    }
  }, [confirmation]);
  useEffect(() => {
    if (
      confirmation &&
      (!p.library ||
        (confirmation.kind === "approve" &&
          (!evidence ||
            releaseSourceFingerprint(evidence.source) !==
              releaseSourceFingerprint(confirmation.evidence.source))))
    ) {
      dialog.current?.close();
      setConfirmation(undefined);
      setConsent(false);
      trigger.current?.focus();
    }
  }, [confirmation, p.library, evidence]);
  useEffect(() => {
    if (validation) errors.current?.focus();
  }, [validation]);
  useEffect(() => {
    if (
      !confirmation &&
      !sending &&
      !restore.current &&
      (p.error || p.outcome || p.evidence || p.earlier)
    ) {
      const frame = requestAnimationFrame(() => {
        if (!feedback.current?.closest("[hidden]")) feedback.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [
    confirmation,
    sending,
    p.error,
    p.outcome,
    p.evidence,
    p.earlier,
    p.paused,
  ]);
  useEffect(() => {
    if (sending) {
      const frame = requestAnimationFrame(() => pending.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [sending]);
  function review() {
    if (writeDisabled) return;
    setValidation("");
    let action: ReleaseAction;
    if (kind === "approve") {
      if (!evidence || !evidence.report.passed) {
        setValidation(
          "Check a retained comparison with non-regressing observed metrics before reviewing approval.",
        );
        return;
      }
      action = { kind, evidence };
    } else {
      try {
        releaseTask(task);
      } catch {
        setValidation("Choose the task whose approvals you intend to revoke.");
        return;
      }
      action = { kind, task };
    }
    restore.current = false;
    setConsent(false);
    setConfirmation(action);
  }
  function close(returnFocus: boolean) {
    restore.current = returnFocus;
    dialog.current?.close();
    setConfirmation(undefined);
    setConsent(false);
    if (returnFocus) trigger.current?.focus();
  }
  async function submit() {
    if (!confirmation || !consent || writeDisabled || gate.current) return;
    gate.current = true;
    setSending(true);
    restore.current = false;
    try {
      await p.onSubmit(confirmation);
    } finally {
      gate.current = false;
      setSending(false);
      close(false);
    }
  }
  return (
    <section className={styles.page} aria-busy={p.busy}>
      <header className={styles.heading}>
        <p>PROMPT RELEASES</p>
        <h2>Approve the evidence. Understand the serving path.</h2>
        <p>
          Approval and rollback affect which prompt may be selected. Opening
          this view, checking runs and reviewing scope do not change a release.
        </p>
      </header>
      <section className={styles.outcome}>
        <h3>Approval is one part of serving</h3>
        <ol className={releaseStyles.steps}>
          <li>
            <strong>Approve a comparison</strong>
            <p>
              The server validates protected metrics and records approval,
              replacing prior approvals for the task.
            </p>
          </li>
          <li>
            <strong>Operator selects the candidate</strong>
            <p>
              Selection must be enabled and configured for this task. This
              workspace cannot view or change that configuration.
            </p>
          </li>
          <li>
            <strong>Serving guards must match</strong>
            <p>
              The current baseline, candidate text hashes and reference corpus
              must match the approved release. Otherwise the registry keeps the
              production baseline.
            </p>
          </li>
        </ol>
        <p className={styles.hint}>
          There is no release, comparison or active-serving lookup API. A
          matching response is an acknowledgement, not a verified active-prompt
          readback.
        </p>
      </section>
      <div className={releaseStyles.switcher}>
        {(
          [
            ["approve", "Approve a comparison"],
            ["rollback", "Roll back a task"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setValidation("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={feedback} tabIndex={-1} className={styles.feedback}>
        {p.error && (
          <GuiFeedback
            kind="error"
            title={
              p.paused
                ? "Release outcome uncertain"
                : "Release scope couldn’t be checked"
            }
          >
            <p>{p.error}</p>
          </GuiFeedback>
        )}
        {p.outcome && !p.error && (
          <GuiFeedback
            kind="success"
            title={
              p.outcome.kind === "approve"
                ? "Approval response checked"
                : "Task rollback response checked"
            }
          >
            <p>{p.outcome.message}</p>
            <p>
              Task: {p.outcome.task}
              {p.outcome.id ? ` · Release ID: ${p.outcome.id}` : ""}
            </p>
            <details>
              <summary>Checked response details</summary>
              <pre tabIndex={0}>
                {JSON.stringify(p.outcome.acknowledgement, null, 2)}
              </pre>
            </details>
          </GuiFeedback>
        )}
        {p.earlier && (
          <GuiFeedback
            kind="info"
            title="Earlier release request may still finish"
          >
            <p>
              Read-only checks cannot cancel a sent release operation or
              establish the active prompt. A later approval or rollback can race
              with the earlier request. This pause applies only to this mounted
              workspace.
            </p>
          </GuiFeedback>
        )}
        {evidence && !p.error && (
          <p role="status">
            Known comparison runs and current references checked. Comparison
            metadata remains the retained response.
          </p>
        )}
      </div>
      <WriteRecovery
        paused={p.paused}
        busy={p.busy}
        recovery={p.recovery}
        onRecover={p.onRecover}
        onResume={p.onResume}
      />
      {kind === "approve" ? (
        <section className={styles.form}>
          <h3>Check the retained comparison</h3>
          {p.source ? (
            <>
              <p>
                Comparison{" "}
                {String((p.source.outcome.payload as { id?: string }).id ?? "")}{" "}
                · {p.source.action.task}
              </p>
              <p>
                {p.source.action.baselineVersion} →{" "}
                {p.source.action.candidateVersion}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  restore.current = false;
                  setValidation("");
                  void p.onCheck();
                }}
              >
                Check comparison runs and references
              </button>
            </>
          ) : (
            <GuiFeedback kind="info" title="No comparison response retained">
              <p>
                A checked comparison response from Run evaluations is needed. No
                comparison GET or catalog exists, so an arbitrary historical ID
                cannot be previewed safely here. This view does not start or
                repeat a paid comparison. Retained responses last only in this
                mounted workspace.
              </p>
            </GuiFeedback>
          )}
          {evidence && (
            <>
              <h3>Observed comparison evidence</h3>
              <GuiFeedback
                kind={evidence.report.passed ? "info" : "error"}
                title={
                  evidence.report.passed
                    ? "Observed non-regression checks passed"
                    : "Observed checks block approval"
                }
              >
                <p>
                  Backend approval eligibility is checked again when you
                  confirm.
                </p>
                {evidence.report.failures.length > 0 && (
                  <ul>
                    {evidence.report.failures.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </GuiFeedback>
              <ProtectedMetrics evidence={evidence} />
              <details>
                <summary>Comparison fingerprints and response</summary>
                <pre tabIndex={0}>
                  {JSON.stringify(
                    {
                      comparisonId: evidence.comparisonId,
                      baselinePromptId: evidence.baselinePromptId,
                      candidatePromptId: evidence.candidatePromptId,
                      baselineHash: evidence.baselineHash,
                      candidateHash: evidence.candidateHash,
                      goldenSetHash: evidence.goldenSetHash,
                      comparisonResponse: evidence.source.outcome.payload,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <details>
                <summary>Inspect an individual saved run</summary>
                <label htmlFor="release-run">
                  Saved run
                  <select
                    id="release-run"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">Choose a run</option>
                    {evidence.source.outcome.runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.mode} · {r.goldenId} · {r.id}
                      </option>
                    ))}
                  </select>
                </label>
                {evidence.source.outcome.runs
                  .filter((r) => r.id === selected)
                  .map((r) => (
                    <RunDetail
                      key={r.id}
                      run={r}
                      rubricVersion={evidence.source.library.rubric?.version}
                    />
                  ))}
              </details>
            </>
          )}
        </section>
      ) : (
        <section className={styles.form}>
          <h3>Choose the complete rollback scope</h3>
          <label htmlFor="release-task">
            Task
            <select
              id="release-task"
              value={task}
              disabled={writeDisabled}
              aria-invalid={!!validation}
              aria-describedby={validation ? "release-validation" : undefined}
              onChange={(e) => {
                setTask(e.target.value);
                setValidation("");
              }}
            >
              <option value="">Choose a task</option>
              {TASKS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p>
            This revokes all currently approved releases for the selected task.
            It does not choose a historical release, edit the production
            baseline or rewrite operator configuration. The API does not list
            affected approvals or report how many were changed.
          </p>
        </section>
      )}
      <div ref={errors} tabIndex={-1}>
        {validation && (
          <GuiFeedback kind="error" title="Check the release scope">
            <p id="release-validation">{validation}</p>
          </GuiFeedback>
        )}
      </div>
      <button
        ref={trigger}
        type="button"
        className={styles.primary}
        disabled={
          writeDisabled ||
          (kind === "approve" && (!evidence || !evidence.report.passed))
        }
        onClick={review}
      >
        Review release scope
      </button>
      {p.busy && !sending && (
        <GuiFeedback kind="loading" title="Checking release records">
          <p>
            Current access, references and known runs are checked without
            replaying any write.
          </p>
        </GuiFeedback>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="release-confirm-title"
        onCancel={(e) => {
          e.preventDefault();
          if (!sending) close(true);
        }}
        onClose={() => {
          if (restore.current) trigger.current?.focus();
          else if (!sending)
            requestAnimationFrame(() => feedback.current?.focus());
        }}
      >
        {confirmation && (
          <>
            <div className={styles.modalHeading}>
              <h2 id="release-confirm-title">
                {confirmation.kind === "approve"
                  ? "Approve this prompt release?"
                  : "Revoke approvals for this task?"}
              </h2>
              <button
                ref={keep}
                type="button"
                disabled={sending}
                onClick={() => close(true)}
              >
                Keep reviewing
              </button>
            </div>
            {confirmation.kind === "approve" ? (
              <>
                <p>
                  Task {confirmation.evidence.task} · comparison{" "}
                  {confirmation.evidence.comparisonId}
                </p>
                <p>
                  Baseline {confirmation.evidence.source.action.baselineVersion}{" "}
                  → candidate{" "}
                  {confirmation.evidence.source.action.candidateVersion}
                </p>
                <p>
                  This replaces prior approved releases for this task. The
                  candidate may become eligible for serving when operator
                  selection and fingerprint guards match. This action does not
                  enable selection, change configuration or rewrite the
                  production baseline.
                </p>
                <ProtectedMetrics evidence={confirmation.evidence} />
              </>
            ) : (
              <>
                <p>Task: {confirmation.task}</p>
                <p>
                  All approved releases for this task are revoked, including
                  approvals created since this review began. This is task-wide;
                  no affected-release list or count is available. The registry
                  then falls back to its production baseline for future
                  resolutions. This does not cancel in-flight generation or
                  change operator configuration.
                </p>
              </>
            )}
            <h3>Exact request scope</h3>
            <pre tabIndex={0}>
              {JSON.stringify(
                confirmation.kind === "approve"
                  ? {
                      comparisonId: confirmation.evidence.comparisonId,
                      task: confirmation.evidence.task,
                      payload: {},
                    }
                  : { task: confirmation.task, payload: {} },
                null,
                2,
              )}
            </pre>
            <p>
              A timeout can occur after a release change is saved. No
              independent release or serving readback is available, and
              concurrent changes may occur. An uncertain request will pause all
              evaluation writes.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={consent}
                disabled={sending}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I reviewed this release scope and understand its serving and
              recovery limits.
            </label>
            <button
              type="button"
              className={styles.primary}
              disabled={!consent || writeDisabled || sending}
              onClick={() => void submit()}
            >
              {sending
                ? "Waiting for release response…"
                : "Confirm release action"}
            </button>
            {sending && (
              <p ref={pending} tabIndex={-1} role="status">
                Waiting for the release response. Closing this page does not
                cancel the server operation.
              </p>
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
