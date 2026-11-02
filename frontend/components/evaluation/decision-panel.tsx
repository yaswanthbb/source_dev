"use client";
import { useEffect, useRef, useState } from "react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import type { EvaluationLibrary } from "./evaluation-client";
import { DIMENSIONS, DIMENSION_LABELS, evaluationId } from "./evaluation-data";
import { RunDetail } from "./evaluation-view";
import {
  BLOOM_LEVELS,
  DIFFICULTIES,
  REASON_CODES,
  reviewPayload,
  replacementPayload,
  decisionFingerprint,
  type DecisionAction,
  type DecisionRecord,
  type DecisionOutcome,
  type ReplacementOption,
} from "./decision-data";
import { WriteRecovery, type WriteRecoveryProps } from "./write-recovery";
import styles from "./execution.module.css";
import decisionStyles from "./decision.module.css";
export interface DecisionProps extends WriteRecoveryProps {
  library?: EvaluationLibrary;
  record?: DecisionRecord;
  error?: string;
  outcome?: DecisionOutcome;
  earlier: boolean;
  onInspect: (
    kind: DecisionRecord["kind"],
    id: string,
    conceptId: string,
  ) => Promise<void>;
  onSubmit: (action: DecisionAction) => Promise<void>;
}
const blankOption = (): ReplacementOption => ({
  optionText: "",
  isCorrect: false,
  orderIndex: 0,
});
export function DecisionPanel(p: DecisionProps) {
  const [kind, setKind] = useState<DecisionRecord["kind"]>("review"),
    [runId, setRunId] = useState(""),
    [questionId, setQuestionId] = useState(""),
    [conceptId, setConceptId] = useState(""),
    [decision, setDecision] = useState(""),
    [scores, setScores] = useState<Record<string, number>>({}),
    [codes, setCodes] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [revision, setRevision] = useState(""),
    [questionText, setQuestionText] = useState(""),
    [options, setOptions] = useState<ReplacementOption[]>([
      blankOption(),
      blankOption(),
    ]),
    [replacementReason, setReplacementReason] = useState(""),
    [bloom, setBloom] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [rationale, setRationale] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [confirmation, setConfirmation] = useState<DecisionAction>(),
    [consent, setConsent] = useState(false),
    [sending, setSending] = useState(false);
  const validation = useRef<HTMLDivElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    keep = useRef<HTMLButtonElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    pending = useRef<HTMLParagraphElement>(null),
    gate = useRef(false),
    returnFocus = useRef(false);
  const disabled = p.busy || !p.library || sending,
    writeDisabled = disabled || p.paused;
  const record = p.record?.kind === kind ? p.record : undefined;
  const matches =
    record &&
    (record.kind === "review"
      ? record.run.id === runId.trim()
      : record.question.id === questionId.trim() &&
        record.concept.id === conceptId.trim());
  useEffect(() => {
    if (confirmation) {
      dialog.current?.showModal();
      keep.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = 0;
    }
  }, [confirmation]);
  useEffect(() => {
    if (Object.keys(errors).length) validation.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (
      !confirmation &&
      !sending &&
      !returnFocus.current &&
      (p.error || p.outcome || p.record || p.earlier)
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
    p.record,
    p.earlier,
    p.paused,
  ]);
  useEffect(() => {
    if (sending) {
      const frame = requestAnimationFrame(() => pending.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [sending]);
  useEffect(() => {
    if (
      confirmation &&
      (!p.library ||
        !p.record ||
        decisionFingerprint(confirmation.record) !==
          decisionFingerprint(p.record))
    ) {
      dialog.current?.close();
      setConfirmation(undefined);
      setConsent(false);
      trigger.current?.focus();
    }
  }, [p.record, p.library, confirmation]);
  function fieldError(key: string) {
    return errors[key] ? (
      <small id={`decision-${key}-error`}>{errors[key]}</small>
    ) : null;
  }
  function attrs(key: string) {
    return {
      id: `decision-${key}`,
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key] ? `decision-${key}-error` : undefined,
    };
  }
  async function inspect() {
    if (disabled || gate.current) return;
    const e: Record<string, string> = {};
    try {
      evaluationId(kind === "review" ? runId : questionId);
    } catch {
      e[kind === "review" ? "runId" : "questionId"] = "Enter a complete UUID.";
    }
    if (kind === "replacement") {
      try {
        evaluationId(conceptId);
      } catch {
        e.conceptId = "Enter a complete concept UUID.";
      }
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    gate.current = true;
    returnFocus.current = false;
    try {
      await p.onInspect(
        kind,
        kind === "review" ? runId.trim() : questionId.trim(),
        conceptId.trim(),
      );
    } finally {
      gate.current = false;
    }
  }
  function review() {
    if (writeDisabled || !record || !matches) return;
    const e: Record<string, string> = {};
    let payload;
    if (kind === "review") {
      if (!decision) e.decision = "Choose a decision.";
      for (const d of DIMENSIONS)
        if (!scores[d]) e[d] = "Choose an anchored score from 1 to 5.";
      if (!reason.trim() || reason.length > 2000)
        e.reason = "Enter a reason of up to 2,000 characters.";
      if (decision !== "approve" && !codes.length)
        e.codes = "Select at least one reason code for edit or reject.";
      if ((decision === "edit" && !revision.trim()) || revision.length > 60000)
        e.revision = "Edits need proposed text, up to 60,000 characters.";
      if (!Object.keys(e).length)
        payload = reviewPayload({
          decision,
          scores,
          reasonCodes: codes,
          reason,
          ...(revision ? { proposedRevision: revision } : {}),
        });
    } else {
      if (!questionText.trim() || questionText.length > 60000)
        e.questionText =
          "Enter question text, up to 60,000 characters (GUI limit).";
      if (!replacementReason.trim() || replacementReason.length > 1000)
        e.replacementReason =
          "Enter a replacement reason of up to 1,000 characters.";
      if (options.filter((o) => o.isCorrect).length !== 1)
        e.key = "Select exactly one correct answer.";
      options.forEach((o, i) => {
        if (!o.optionText.trim() || o.optionText.length > 60000)
          e[`option-${i}`] =
            "Enter option text, up to 60,000 characters (GUI limit).";
      });
      if (!Object.keys(e).length && record.kind === "replacement")
        payload = replacementPayload({
          questionText,
          reason: replacementReason,
          orderIndex: record.question.orderIndex,
          options: options.map((o, i) => ({
            ...o,
            orderIndex: i,
            ...(o.isCorrect
              ? { misconception: undefined, distractorRationale: undefined }
              : {}),
          })),
          ...(bloom ? { bloomLevel: bloom } : {}),
          ...(difficulty ? { intendedDifficulty: difficulty } : {}),
          ...(rationale ? { correctRationale: rationale } : {}),
        });
    }
    setErrors(e);
    if (Object.keys(e).length || !payload) return;
    setConsent(false);
    returnFocus.current = false;
    setConfirmation({ kind, payload, record } as DecisionAction);
  }
  function close(restore: boolean) {
    returnFocus.current = restore;
    dialog.current?.close();
    setConfirmation(undefined);
    setConsent(false);
    if (restore) trigger.current?.focus();
  }
  async function submit() {
    if (!confirmation || !consent || gate.current || writeDisabled) return;
    gate.current = true;
    setSending(true);
    returnFocus.current = false;
    try {
      await p.onSubmit(confirmation);
    } finally {
      gate.current = false;
      setSending(false);
      close(false);
    }
  }
  function editOption(i: number, patch: Partial<ReplacementOption>) {
    setOptions((all) => all.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  }
  return (
    <section
      className={`${styles.page} ${decisionStyles.page}`}
      aria-busy={p.busy}
    >
      <header className={styles.heading}>
        <p>EXPERT DECISIONS</p>
        <h2>Review carefully. Change deliberately.</h2>
        <p>
          Record an independent review or create a new question version. No
          decision is sent until you review the exact fields and confirm.
        </p>
      </header>
      <div className={decisionStyles.switcher}>
        {(
          [
            ["review", "Expert review"],
            ["replacement", "Replace a question"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            disabled={disabled}
            onClick={() => {
              setKind(k);
              setErrors({});
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
                ? "Decision outcome uncertain"
                : "Evidence or decision couldn’t be checked"
            }
          >
            <p>{p.error}</p>
          </GuiFeedback>
        )}
        {p.outcome && !p.error && (
          <GuiFeedback
            kind="success"
            title={
              p.outcome.kind === "review"
                ? "Expert-review response checked"
                : "Question successor checked"
            }
          >
            <p>{p.outcome.message}</p>
            <p>Record ID: {p.outcome.id}</p>
            <details>
              <summary>Checked response details</summary>
              <pre tabIndex={0}>
                {JSON.stringify(p.outcome.acknowledgement, null, 2)}
              </pre>
            </details>
          </GuiFeedback>
        )}
        {p.earlier && (
          <GuiFeedback kind="info" title="Earlier decision may still finish">
            <p>
              Read-only checks cannot cancel a sent decision or prove it failed.
              Repeating it could create another review. The pause applies only
              to this mounted workspace.
            </p>
          </GuiFeedback>
        )}
        {record && matches && (
          <p role="status">
            Current{" "}
            {kind === "review"
              ? "run and rubric"
              : "question, version and concept"}{" "}
            checked. Review the evidence below.
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
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void inspect();
        }}
      >
        <h3>1. Check the original</h3>
        <div ref={validation} tabIndex={-1}>
          {Object.keys(errors).length > 0 && (
            <GuiFeedback kind="error" title="Check the decision fields">
              <ul>
                {Object.entries(errors).map(([k, m]) => (
                  <li key={k}>
                    <a href={`#decision-${k}`}>{m}</a>
                  </li>
                ))}
              </ul>
            </GuiFeedback>
          )}
        </div>
        {kind === "review" ? (
          <label htmlFor="decision-runId">
            Run ID
            <input
              {...attrs("runId")}
              value={runId}
              disabled={disabled}
              onChange={(e) => setRunId(e.target.value)}
            />
            {fieldError("runId")}
          </label>
        ) : (
          <>
            <label htmlFor="decision-conceptId">
              Concept ID
              <input
                {...attrs("conceptId")}
                value={conceptId}
                disabled={disabled}
                onChange={(e) => setConceptId(e.target.value)}
              />
              {fieldError("conceptId")}
            </label>
            <label htmlFor="decision-questionId">
              Current question ID
              <input
                {...attrs("questionId")}
                value={questionId}
                disabled={disabled}
                onChange={(e) => setQuestionId(e.target.value)}
              />
              {fieldError("questionId")}
            </label>
            <p className={styles.hint}>
              Use the concept and current question IDs from your authoring
              records. Retired questions cannot be replaced again. No global
              question catalog is available here.
            </p>
          </>
        )}
        <button type="submit" disabled={disabled}>
          Check original evidence
        </button>
      </form>
      {record && matches && p.library && (
        <>
          <section className={styles.outcome}>
            <h3>2. Read the checked evidence</h3>
            {record.kind === "review" ? (
              <>
                <p>Scoring rubric {record.rubric.version} matches this run.</p>
                <RunDetail
                  run={record.run}
                  rubricVersion={record.rubric.version}
                />
              </>
            ) : (
              <>
                <h4>{record.concept.title}</h4>
                <p>
                  Concept {record.concept.id} · {record.concept.reviewStatus} ·{" "}
                  {record.concept.placements.length} placements
                </p>
                <p>
                  Question {record.question.id} · version{" "}
                  {record.metrics.versionNumber}
                </p>
                <p>Predecessor: {record.metrics.predecessorId ?? "None"}</p>
                <pre tabIndex={0} aria-label="Original question">
                  {record.question.questionText}
                </pre>
                <ol>
                  {record.question.options.map((o) => (
                    <li key={o.id}>
                      {o.optionText}
                      {o.isCorrect ? " · correct answer" : ""}
                      {o.misconception && (
                        <p>Misconception: {o.misconception}</p>
                      )}
                      {o.distractorRationale && (
                        <p>Rationale: {o.distractorRationale}</p>
                      )}
                    </li>
                  ))}
                </ol>
                <details>
                  <summary>Shared concept placements</summary>
                  <ul>
                    {record.concept.placements.map((p) => (
                      <li key={p.id}>
                        {p.roadmapTitle} / {p.moduleTitle}
                      </li>
                    ))}
                  </ul>
                </details>
                <details>
                  <summary>Full question-quality observations</summary>
                  <p>
                    Descriptive statistics and review flags are heuristics.
                    Limited samples do not establish quality or a need to
                    replace.
                  </p>
                  <pre tabIndex={0}>
                    {JSON.stringify(record.metrics, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </section>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              review();
            }}
          >
            <h3>
              3. Prepare your {kind === "review" ? "review" : "replacement"}
            </h3>
            {kind === "review" && record.kind === "review" ? (
              <>
                <label htmlFor="decision-decision">
                  Decision
                  <select
                    {...attrs("decision")}
                    value={decision}
                    disabled={writeDisabled}
                    onChange={(e) => setDecision(e.target.value)}
                  >
                    <option value="">Choose a decision</option>
                    <option value="approve">Approve</option>
                    <option value="edit">Edit</option>
                    <option value="reject">Reject</option>
                  </select>
                  {fieldError("decision")}
                </label>
                <p className={styles.hint}>
                  Your scores are independent of judge observations. Select each
                  score explicitly using its recorded-version anchor.
                </p>
                <div className={decisionStyles.anchors}>
                  {DIMENSIONS.map((d) => (
                    <fieldset
                      key={d}
                      id={`decision-${d}`}
                      aria-invalid={!!errors[d]}
                      aria-describedby={
                        errors[d] ? `decision-${d}-error` : undefined
                      }
                      disabled={writeDisabled}
                    >
                      <legend>{DIMENSION_LABELS[d]}</legend>
                      {record.rubric.anchors[d].map((a, i) => (
                        <label className={styles.check} key={i}>
                          <input
                            type="radio"
                            name={`score-${d}`}
                            checked={scores[d] === i + 1}
                            onChange={() =>
                              setScores((s) => ({ ...s, [d]: i + 1 }))
                            }
                          />
                          <span>
                            <strong>{i + 1}</strong> · {a}
                          </span>
                        </label>
                      ))}
                      {fieldError(d)}
                    </fieldset>
                  ))}
                </div>
                <fieldset
                  id="decision-codes"
                  disabled={writeDisabled}
                  aria-invalid={!!errors.codes}
                  aria-describedby={
                    errors.codes ? "decision-codes-error" : undefined
                  }
                >
                  <legend>Reason codes</legend>
                  <div className={decisionStyles.codes}>
                    {REASON_CODES.map((c) => (
                      <label className={styles.check} key={c}>
                        <input
                          type="checkbox"
                          checked={codes.includes(c)}
                          onChange={(e) =>
                            setCodes((all) =>
                              e.target.checked
                                ? [...all, c]
                                : all.filter((x) => x !== c),
                            )
                          }
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                  {fieldError("codes")}
                </fieldset>
                <label htmlFor="decision-reason">
                  Reason
                  <textarea
                    {...attrs("reason")}
                    rows={4}
                    maxLength={2000}
                    value={reason}
                    disabled={writeDisabled}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {fieldError("reason")}
                </label>
                <label htmlFor="decision-revision">
                  Proposed revision
                  {decision === "edit" ? " (required)" : " (optional)"}
                  <textarea
                    {...attrs("revision")}
                    rows={6}
                    maxLength={60000}
                    value={revision}
                    disabled={writeDisabled}
                    onChange={(e) => setRevision(e.target.value)}
                  />
                  <small>
                    This records proposed text only. It does not edit content or
                    approve a prompt release.
                  </small>
                  {fieldError("revision")}
                </label>
              </>
            ) : (
              <>
                <p className={styles.hint}>
                  Write a complete new version. Existing Bloom level, intended
                  difficulty and correct rationale are unavailable from the
                  question-list API; optional fields below describe the new
                  version only. Blank fields become unrecorded. Old lint and
                  verification results are cleared.
                </p>
                <label htmlFor="decision-questionText">
                  New question text
                  <textarea
                    {...attrs("questionText")}
                    maxLength={60000}
                    rows={5}
                    value={questionText}
                    disabled={writeDisabled}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                  {fieldError("questionText")}
                </label>
                <fieldset
                  id="decision-key"
                  disabled={writeDisabled}
                  aria-invalid={!!errors.key}
                  aria-describedby={
                    errors.key ? "decision-key-error" : undefined
                  }
                >
                  <legend>Answer options · exactly one correct</legend>
                  {fieldError("key")}
                  {options.map((o, i) => (
                    <section className={decisionStyles.option} key={i}>
                      <label htmlFor={`decision-option-${i}`}>
                        Option {i + 1}
                        <textarea
                          {...attrs(`option-${i}`)}
                          maxLength={60000}
                          rows={3}
                          value={o.optionText}
                          onChange={(e) =>
                            editOption(i, { optionText: e.target.value })
                          }
                        />
                        {fieldError(`option-${i}`)}
                      </label>
                      <label className={styles.check}>
                        <input
                          type="radio"
                          name="replacement-key"
                          checked={o.isCorrect}
                          onChange={() =>
                            setOptions((all) =>
                              all.map((x, j) => ({
                                ...x,
                                isCorrect: j === i,
                                ...(j === i
                                  ? {
                                      misconception: undefined,
                                      distractorRationale: undefined,
                                    }
                                  : {}),
                              })),
                            )
                          }
                        />
                        Correct answer · option {i + 1}
                      </label>
                      {!o.isCorrect && (
                        <>
                          <label>
                            Misconception (optional)
                            <textarea
                              rows={2}
                              maxLength={60000}
                              value={o.misconception ?? ""}
                              onChange={(e) =>
                                editOption(i, { misconception: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            Distractor rationale (optional)
                            <textarea
                              rows={2}
                              maxLength={60000}
                              value={o.distractorRationale ?? ""}
                              onChange={(e) =>
                                editOption(i, {
                                  distractorRationale: e.target.value,
                                })
                              }
                            />
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={options.length <= 2 || writeDisabled}
                        onClick={() =>
                          setOptions((all) => all.filter((_, j) => i !== j))
                        }
                      >
                        Remove option {i + 1}
                      </button>
                    </section>
                  ))}
                  <button
                    type="button"
                    disabled={options.length >= 12 || writeDisabled}
                    onClick={() => setOptions((all) => [...all, blankOption()])}
                  >
                    Add option
                  </button>
                </fieldset>
                <div className={decisionStyles.anchors}>
                  <label>
                    Bloom level (optional)
                    <select
                      value={bloom}
                      disabled={writeDisabled}
                      onChange={(e) => setBloom(e.target.value)}
                    >
                      <option value="">Unrecorded</option>
                      {BLOOM_LEVELS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Intended difficulty (optional)
                    <select
                      value={difficulty}
                      disabled={writeDisabled}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="">Unrecorded</option>
                      {DIFFICULTIES.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Correct-answer rationale (optional)
                  <textarea
                    rows={3}
                    maxLength={60000}
                    value={rationale}
                    disabled={writeDisabled}
                    onChange={(e) => setRationale(e.target.value)}
                  />
                </label>
                <label htmlFor="decision-replacementReason">
                  Replacement reason
                  <textarea
                    {...attrs("replacementReason")}
                    rows={4}
                    maxLength={1000}
                    value={replacementReason}
                    disabled={writeDisabled}
                    onChange={(e) => setReplacementReason(e.target.value)}
                  />
                  {fieldError("replacementReason")}
                </label>
                <p className={styles.hint}>
                  Question, option and optional rationale fields have a
                  60,000-character GUI limit.
                </p>
              </>
            )}
            <button
              ref={trigger}
              type="submit"
              className={styles.primary}
              disabled={writeDisabled}
            >
              Review exact decision
            </button>
          </form>
        </>
      )}
      {!matches && record && (
        <GuiFeedback kind="info" title="IDs changed">
          <p>
            Check the new original before reviewing a decision. Your draft is
            retained.
          </p>
        </GuiFeedback>
      )}
      {p.busy && !sending && (
        <GuiFeedback kind="loading" title="Checking current decision state">
          <p>No write request is automatically repeated.</p>
        </GuiFeedback>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="decision-confirm-title"
        onCancel={(e) => {
          e.preventDefault();
          if (!sending) close(true);
        }}
        onClose={() => {
          if (returnFocus.current) trigger.current?.focus();
          else if (!sending)
            requestAnimationFrame(() => feedback.current?.focus());
        }}
      >
        {confirmation && (
          <>
            <div className={styles.modalHeading}>
              <h2 id="decision-confirm-title">
                {confirmation.kind === "review"
                  ? "Record this expert review?"
                  : "Replace this question version?"}
              </h2>
              <button
                ref={keep}
                type="button"
                disabled={sending}
                onClick={() => close(true)}
              >
                Keep editing
              </button>
            </div>
            {confirmation.kind === "review" ? (
              <>
                <p>
                  Run {confirmation.record.run.id} · rubric{" "}
                  {confirmation.record.rubric.version}
                </p>
                <p>
                  This records a new independent review. Proposed revisions are
                  not applied. It does not publish content or approve a prompt
                  release. The response can be checked, but there is no
                  independent review lookup.
                </p>
              </>
            ) : (
              <>
                <p>
                  Concept {confirmation.record.concept.title} (
                  {confirmation.record.concept.id})
                </p>
                <p>
                  Question {confirmation.record.question.id} · version{" "}
                  {confirmation.record.metrics.versionNumber} →{" "}
                  {confirmation.record.metrics.versionNumber + 1}
                </p>
                <p>
                  The original is retired and a successor is created at the same
                  position. The shared concept returns to pending review across
                  all {confirmation.record.concept.placements.length}{" "}
                  placements. Readers who are not the author or an admin may
                  lose access until it is reviewed. Existing lint and
                  verification evidence is cleared.
                </p>
                <details>
                  <summary>Original question and answer key</summary>
                  <pre tabIndex={0}>
                    {JSON.stringify(confirmation.record.question, null, 2)}
                  </pre>
                </details>
              </>
            )}
            <h3>Exact decision payload</h3>
            <pre tabIndex={0}>
              {JSON.stringify(confirmation.payload, null, 2)}
            </pre>
            <p>
              A timeout may occur after the decision is saved. Do not repeat an
              uncertain request. Separate preflight and readback checks do not
              provide isolation from other editors.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={consent}
                disabled={sending}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I reviewed the exact decision and understand its consequences.
            </label>
            <button
              type="button"
              className={styles.primary}
              disabled={!consent || sending || writeDisabled}
              onClick={() => void submit()}
            >
              {sending ? "Waiting for response…" : "Confirm decision"}
            </button>
            {sending && (
              <p ref={pending} tabIndex={-1} role="status">
                Waiting for the decision response. Closing this page does not
                cancel the server request.
              </p>
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
