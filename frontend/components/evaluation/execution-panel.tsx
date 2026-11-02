"use client";
import { useEffect, useRef, useState } from "react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { TASKS } from "./evaluation-data";
import { RunDetail } from "./evaluation-view";
import type { EvaluationLibrary } from "./evaluation-client";
import type { ExecutionRecovery } from "./execution-client";
import {
  EMPTY_EXECUTION_DRAFT,
  EXECUTION_LABELS,
  executionValidation,
  executionAction,
  executionReference,
  executionCases,
  paidExecution,
  type ExecutionDraft,
  type ExecutionAction,
  type ExecutionOutcome,
  type ExecutionKind,
} from "./execution-data";
import styles from "./execution.module.css";
import { WriteRecovery } from "./write-recovery";
export interface ExecutionProps {
  library?: EvaluationLibrary;
  busy: boolean;
  error?: string;
  outcome?: ExecutionOutcome;
  paused: boolean;
  knownRunIds: string[];
  recovery?: ExecutionRecovery;
  earlier: boolean;
  onExecute: (action: ExecutionAction) => Promise<void>;
  onRecover: () => void;
  onResume: () => void;
}
export function ExecutionPanel(p: ExecutionProps) {
  const [draft, setDraft] = useState<ExecutionDraft>(EMPTY_EXECUTION_DRAFT),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [confirmation, setConfirmation] = useState<{
      action: ExecutionAction;
      library: EvaluationLibrary;
    }>(),
    [consent, setConsent] = useState(false),
    [sending, setSending] = useState(false),
    [selected, setSelected] = useState(""),
    [page, setPage] = useState(1),
    [drafts, setDrafts] = useState<
      Partial<Record<ExecutionKind, ExecutionDraft>>
    >({});
  const dialog = useRef<HTMLDialogElement>(null),
    keep = useRef<HTMLButtonElement>(null),
    pendingMessage = useRef<HTMLParagraphElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    runHeading = useRef<HTMLHeadingElement>(null),
    validation = useRef<HTMLDivElement>(null),
    gate = useRef(false),
    returnFocus = useRef(false);
  useEffect(() => {
    if (confirmation) {
      dialog.current?.showModal();
      keep.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = 0;
    }
  }, [confirmation]);
  useEffect(() => {
    if (p.error || p.outcome) feedback.current?.focus();
    if (p.outcome) {
      setPage(1);
      setSelected("");
    }
  }, [p.error, p.outcome]);
  useEffect(() => {
    if (
      confirmation ||
      sending ||
      returnFocus.current ||
      (!p.error && !p.outcome)
    )
      return;
    const frame = requestAnimationFrame(() => feedback.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [confirmation, sending, p.error, p.outcome]);
  useEffect(() => {
    if (p.earlier && !p.paused) feedback.current?.focus();
  }, [p.paused, p.earlier]);
  useEffect(() => {
    if (!sending) return;
    const frame = requestAnimationFrame(() => pendingMessage.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [sending]);
  const disabled = p.busy || !p.library || p.paused || sending;
  function change<K extends keyof ExecutionDraft>(
    key: K,
    value: ExecutionDraft[K],
  ) {
    if (key === "kind") {
      const next = value as ExecutionKind;
      setDrafts((all) => ({ ...all, [draft.kind]: draft }));
      setDraft({ ...EMPTY_EXECUTION_DRAFT, ...drafts[next], kind: next });
    } else setDraft((d) => ({ ...d, [key]: value }));
    setErrors({});
  }
  function review() {
    const invalid = executionValidation(draft);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      validation.current?.focus();
      return;
    }
    if (!p.library || disabled) return;
    try {
      const action = executionAction(draft);
      executionReference(p.library, action);
      setConsent(false);
      setConfirmation({ action, library: p.library });
    } catch (e) {
      setErrors({
        references:
          e instanceof Error
            ? e.message
            : "Refresh references before reviewing.",
      });
      validation.current?.focus();
    }
  }
  function close(restore: boolean) {
    returnFocus.current = restore;
    dialog.current?.close();
    setConfirmation(undefined);
    setConsent(false);
    if (restore) trigger.current?.focus();
  }
  async function submit() {
    if (!confirmation || !consent || gate.current || disabled) return;
    gate.current = true;
    setSending(true);
    returnFocus.current = false;
    try {
      await p.onExecute(confirmation.action);
    } finally {
      gate.current = false;
      setSending(false);
      close(false);
    }
  }
  const field = (
    key: "version" | "baselineVersion" | "candidateVersion" | "compilationId",
    label: string,
  ) => (
    <label htmlFor={`execution-${key}`}>
      {label}
      <input
        id={`execution-${key}`}
        value={draft[key]}
        disabled={disabled}
        maxLength={key === "compilationId" ? 36 : 32}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `execution-error-${key}` : undefined}
        onChange={(e) => change(key, e.target.value)}
      />
      {errors[key] && <span id={`execution-error-${key}`}>{errors[key]}</span>}
    </label>
  );
  const returned = p.outcome?.runs ?? [],
    pages = Math.max(1, Math.ceil(returned.length / 6)),
    current = Math.min(page, pages),
    selectedRun = returned.find((r) => r.id === selected);
  return (
    <section className={styles.page} aria-busy={p.busy || sending}>
      <header className={styles.heading}>
        <p>EXPLICIT ACTIONS</p>
        <h2>Run with intent.</h2>
        <p>
          Create an immutable prompt draft or evaluate a deliberate selection.
          These actions persist records; model-backed evaluations can incur
          operator provider charges.
        </p>
      </header>
      <div ref={feedback} tabIndex={-1} className={styles.feedback}>
        {p.outcome && !p.error && (
          <GuiFeedback kind="success" title={p.outcome.title}>
            <p>
              {p.outcome.proof === "runs"
                ? "Returned run records were read back. Quality failures remain visible in the evidence."
                : "Matching acknowledgement received. The API has no independent lookup for this record."}
            </p>
          </GuiFeedback>
        )}
        {p.error && (
          <GuiFeedback
            kind="error"
            title={
              p.paused
                ? "Execution outcome uncertain"
                : "Action couldn’t be checked"
            }
          >
            <p>{p.error}</p>
          </GuiFeedback>
        )}
        {p.earlier && (
          <GuiFeedback kind="info" title="Earlier request may still finish">
            <p>
              Read-only checks cannot cancel an earlier request or rule out
              partial runs and charges. Another execution may duplicate work and
              provider costs. This pause applies only to this mounted workspace.
            </p>
          </GuiFeedback>
        )}
      </div>
      <WriteRecovery
        paused={p.paused}
        busy={p.busy}
        recovery={p.recovery}
        onRecover={p.onRecover}
        onResume={p.onResume}
      />
      {p.busy && (
        <GuiFeedback
          kind="loading"
          title={
            sending
              ? "Waiting for the execution response"
              : "Checking current state"
          }
        >
          <p>
            No request is automatically retried. A model-backed request can take
            several minutes; a timeout or closed page does not cancel server
            work.
          </p>
        </GuiFeedback>
      )}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          review();
        }}
      >
        <div ref={validation} tabIndex={-1}>
          {Object.keys(errors).length > 0 && (
            <GuiFeedback kind="error" title="Check the action fields">
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    {key === "references" ? (
                      message
                    ) : (
                      <a href={`#execution-${key}`}>{message}</a>
                    )}
                  </li>
                ))}
              </ul>
            </GuiFeedback>
          )}
        </div>
        <label htmlFor="execution-kind">
          Action
          <select
            id="execution-kind"
            disabled={disabled}
            value={draft.kind}
            onChange={(e) => change("kind", e.target.value as ExecutionKind)}
          >
            {(Object.keys(EXECUTION_LABELS) as ExecutionKind[]).map((k) => (
              <option key={k} value={k}>
                {EXECUTION_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        {draft.kind !== "regression" && draft.kind !== "compilation" && (
          <label htmlFor="execution-task">
            Registry task
            <select
              id="execution-task"
              disabled={disabled}
              value={draft.task}
              onChange={(e) => change("task", e.target.value)}
            >
              {TASKS.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        )}
        {(draft.kind === "candidate" || draft.kind === "shadow") &&
          field(
            "version",
            draft.kind === "candidate"
              ? "New immutable version"
              : "Existing prompt version",
          )}
        {draft.kind === "candidate" && (
          <>
            <label htmlFor="execution-systemTemplate">
              Complete system template
              <textarea
                id="execution-systemTemplate"
                rows={9}
                value={draft.systemTemplate}
                disabled={disabled}
                maxLength={30000}
                aria-invalid={!!errors.systemTemplate}
                aria-describedby={
                  errors.systemTemplate
                    ? "execution-error-systemTemplate"
                    : undefined
                }
                onChange={(e) => change("systemTemplate", e.target.value)}
              />
              {errors.systemTemplate && (
                <span id="execution-error-systemTemplate">
                  {errors.systemTemplate}
                </span>
              )}
              <small>
                {draft.systemTemplate.length.toLocaleString()} / 30,000
                characters
              </small>
            </label>
            <label htmlFor="execution-changelog">
              Changelog
              <textarea
                id="execution-changelog"
                rows={3}
                value={draft.changelog}
                disabled={disabled}
                maxLength={2000}
                aria-invalid={!!errors.changelog}
                aria-describedby={
                  errors.changelog ? "execution-error-changelog" : undefined
                }
                onChange={(e) => change("changelog", e.target.value)}
              />
              {errors.changelog && (
                <span id="execution-error-changelog">{errors.changelog}</span>
              )}
            </label>
            <p className={styles.hint}>
              A new draft does not change serving. Versions cannot be
              overwritten. There is no prompt catalog in this API; use a new
              known version.
            </p>
          </>
        )}
        {draft.kind === "comparison" && (
          <>
            {field("baselineVersion", "Existing baseline version")}
            {field("candidateVersion", "Existing candidate version")}
            <p className={styles.hint}>
              Both versions are evaluated on the task’s checked golden cohort. A
              comparison creates evidence; it does not approve or activate a
              release.
            </p>
          </>
        )}
        {draft.kind === "shadow" && (
          <p className={styles.hint}>
            Uses an existing task/version and creates shadow runs. It never
            serves generated artifacts.
          </p>
        )}
        {draft.kind === "regression" && (
          <p className={styles.hint}>
            Evaluates all {TASKS.length} registry tasks against their effective
            configured versions. Missing versions and uncovered tasks remain
            explicit failures. This is the full corpus, regardless of inspection
            filters.
          </p>
        )}
        {draft.kind === "compilation" && (
          <>
            {field("compilationId", "Saved compilation ID")}
            <label className={styles.check}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={draft.judge}
                onChange={(e) => change("judge", e.target.checked)}
              />
              Also request a model-backed judge (provider charges may apply)
            </label>
            <p className={styles.hint}>
              Even without a judge, this creates a new saved evaluation from the
              current compilation and may check public links. It does not edit
              or publish the lesson. Current artifact text is checked
              server-side; no compilation preview endpoint is available here.
            </p>
          </>
        )}
        {!p.library && (
          <p className={styles.hint}>
            Check current references and admin access before reviewing a new
            action.
          </p>
        )}
        <button
          ref={trigger}
          type="submit"
          className={styles.primary}
          disabled={disabled}
        >
          Review this action
        </button>
      </form>
      {p.outcome && (
        <section className={styles.outcome}>
          <h3>{p.outcome.title}</h3>
          <p>
            Response checked{" "}
            {new Date(p.outcome.checkedAt).toLocaleString("en-GB", {
              timeZone: "UTC",
            })}{" "}
            UTC.
          </p>
          <p>
            {p.outcome.proof === "runs"
              ? `${returned.length} returned run records were independently read back. Run status and quality checks are separate; inspect their evidence.`
              : "The response matches the requested action. There is no independent candidate/comparison read endpoint; acknowledgement is not a saved-state lookup."}
          </p>
          {p.outcome.kind === "comparison" && (
            <p>
              Comparison metadata and protected-metric result come from the
              response. Its run cohorts were read back; the comparison record
              itself has no GET endpoint. This does not activate serving.
            </p>
          )}
          <details>
            <summary>Checked response details</summary>
            <pre tabIndex={0} aria-label="Checked execution response">
              {JSON.stringify(p.outcome.payload, null, 2)}
            </pre>
          </details>
          {returned.length > 0 && (
            <>
              <h4 ref={runHeading} tabIndex={-1}>
                Checked runs
              </h4>
              <ul className={styles.runs}>
                {returned.slice((current - 1) * 6, current * 6).map((r) => (
                  <li key={r.id}>
                    <strong>
                      {r.task} · {r.goldenId ?? "saved artifact"}
                    </strong>
                    <p>
                      {r.id} · {r.status} · checks{" "}
                      {r.deterministicResult.passed ? "passed" : "not passed"}
                    </p>
                    <button
                      type="button"
                      disabled={p.busy}
                      onClick={() => setSelected(r.id)}
                    >
                      Read evidence · {r.id.slice(0, 8)}
                    </button>
                  </li>
                ))}
              </ul>
              <nav
                className={styles.paging}
                aria-label="Execution result pages"
              >
                <span>
                  {(current - 1) * 6 + 1}–
                  {Math.min(current * 6, returned.length)} of {returned.length}
                </span>
                <button
                  type="button"
                  disabled={current === 1 || p.busy}
                  onClick={() => {
                    setPage(current - 1);
                    runHeading.current?.focus();
                  }}
                >
                  Previous runs
                </button>
                <button
                  type="button"
                  disabled={current === pages || p.busy}
                  onClick={() => {
                    setPage(current + 1);
                    runHeading.current?.focus();
                  }}
                >
                  Next runs
                </button>
              </nav>
              {selectedRun && (
                <div className={styles.saved}>
                  <RunDetail
                    run={selectedRun}
                    rubricVersion={p.library?.rubric?.version}
                  />
                </div>
              )}
            </>
          )}
        </section>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="execution-confirm-title"
        onCancel={(e) => {
          e.preventDefault();
          if (!gate.current && !p.busy) close(true);
        }}
        onClose={() => {
          if (returnFocus.current) trigger.current?.focus();
          else if (p.error || p.outcome) feedback.current?.focus();
        }}
      >
        {confirmation && (
          <>
            <div className={styles.modalHeading}>
              <h2 id="execution-confirm-title">Confirm this exact action</h2>
              <button
                ref={keep}
                type="button"
                disabled={sending || p.busy}
                onClick={() => close(true)}
              >
                Keep editing
              </button>
            </div>
            <h3>{EXECUTION_LABELS[confirmation.action.kind]}</h3>
            <p>
              {paidExecution(confirmation.action)
                ? "This uses operator-configured provider credentials and models. Charges may apply even when an evaluation fails. User quota is not charged; the provider cost and exact call count are not available here."
                : confirmation.action.kind === "candidate"
                  ? "This saves a new immutable draft. It does not call a provider or release a prompt."
                  : "This saves a new deterministic evaluation run. No model judge will be requested."}
            </p>
            {confirmation.action.kind !== "candidate" &&
              confirmation.action.kind !== "compilation" && (
                <>
                  <p>
                    {
                      executionCases(confirmation.library, confirmation.action)
                        .length
                    }{" "}
                    checked golden cases{" "}
                    {confirmation.action.kind === "comparison"
                      ? "for each of two versions"
                      : "in scope"}
                    . Provider calls can exceed the case count because
                    verification and judging add work.
                  </p>
                  <details>
                    <summary>Review exact golden scope</summary>
                    <ul>
                      {executionCases(
                        confirmation.library,
                        confirmation.action,
                      ).map((g) => (
                        <li key={g.id}>
                          {g.id} · {g.registryTask}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
            <pre tabIndex={0} aria-label="Exact evaluation action">
              {JSON.stringify(confirmation.action, null, 2)}
            </pre>
            <p>
              The current admin and references will be checked again before one
              request. There is no atomic snapshot or prompt-catalog check. A
              timeout, navigation or closed page does not cancel server work,
              and partial records can exist before an error. No request is
              automatically repeated.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={consent}
                disabled={sending || p.busy}
                onChange={(e) => setConsent(e.target.checked)}
              />
              {paidExecution(confirmation.action)
                ? "I approve this scope and understand provider charges and partial outcomes may occur."
                : "I approve this exact persisted action and understand it is not a release."}
            </label>
            {sending && (
              <p ref={pendingMessage} role="status" tabIndex={-1}>
                Waiting for the response. Keep this confirmation open; an
                earlier request may still finish after a timeout.
              </p>
            )}
            <button
              className={styles.primary}
              type="button"
              disabled={!consent || sending || p.busy}
              onClick={() => void submit()}
            >
              {sending
                ? "Waiting for confirmation…"
                : paidExecution(confirmation.action)
                  ? "Start this paid evaluation"
                  : "Save this exact action"}
            </button>
          </>
        )}
      </dialog>
    </section>
  );
}
