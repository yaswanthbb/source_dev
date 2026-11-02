"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  DIMENSIONS,
  DIMENSION_LABELS,
  evaluationId,
  metric,
  type EvalRun,
  type QuestionMetrics,
  type Json,
} from "./evaluation-data";
import type {
  EvaluationLibrary,
  EvaluationInspection,
} from "./evaluation-client";
import styles from "./evaluation.module.css";
export interface EvaluationProps {
  execution?: ReactNode;
  decisions?: ReactNode;
  releases?: ReactNode;
  library?: EvaluationLibrary;
  pending: boolean;
  busy: boolean;
  error?: string;
  inspection?: EvaluationInspection;
  lookupError?: string;
  onRefresh: () => void;
  onInspect: (kind: "run" | "question", id: string) => void;
}
function Evidence({ title, value }: { title: string; value: Json }) {
  return (
    <details className={styles.evidence}>
      <summary>{title}</summary>
      <pre tabIndex={0} aria-label={title}>
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
function Metadata({ rows }: { rows: [string, string | number | null][] }) {
  return (
    <dl className={styles.metadata}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value === null ? "Not recorded" : value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function RunDetail({
  run,
  rubricVersion,
}: {
  run: EvalRun;
  rubricVersion?: string;
}) {
  return (
    <>
      <div className={styles.sectionTop}>
        <h3>Saved run</h3>
        <span className={styles.badge}>
          {run.status} · {run.mode.replaceAll("_", " ")}
        </span>
      </div>
      <p className={styles.hint}>
        Run status, deterministic checks, golden differences and judge scores
        are separate observations. They do not prove learner outcomes or
        authorize a release.
      </p>
      {run.warnings.length > 0 && (
        <GuiFeedback kind="info" title="Recorded warnings">
          <ul>
            {run.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </GuiFeedback>
      )}
      <Metadata
        rows={[
          ["Run ID", run.id],
          ["Task", run.task],
          ["Created", run.createdAt],
          ["Prompt version", run.promptVersion],
          ["Rubric version", run.rubricVersion],
          ["Generator model", run.generatorModel],
          ["Judge model", run.judgeModel],
          ["Generator seed", run.seed],
          ["Judge seed", run.judgeSeed],
          ["Judge prompt version", run.judgePromptVersion],
          ["Golden case", run.goldenId],
        ]}
      />
      <h4>
        Deterministic checks ·{" "}
        {run.deterministicResult.passed ? "passed" : "not passed"}
      </h4>
      {run.deterministicResult.checks.length ? (
        <ul className={styles.checks}>
          {run.deterministicResult.checks.map((c, i) => (
            <li key={i}>
              <strong>
                {c.passed ? "Pass" : "Fail"} · {c.code}
              </strong>
              <p>{c.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No individual checks recorded.</p>
      )}
      <h4>Golden comparison</h4>
      {run.goldenDiff ? (
        <>
          <p>
            {run.goldenDiff.passed
              ? "Recorded comparison passed."
              : "Recorded comparison did not pass."}
          </p>
          <ul>
            {run.goldenDiff.differences.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No golden comparison recorded for this run.</p>
      )}
      <h4>Judge observations</h4>
      {run.judgeResult ? (
        <>
          {rubricVersion !== run.rubricVersion && (
            <p className={styles.callout}>
              This run uses rubric {run.rubricVersion}. Current anchors{" "}
              {rubricVersion ? `(${rubricVersion})` : "are unavailable and"}{" "}
              must not be substituted for its recorded rubric.
            </p>
          )}
          <div className={styles.grid}>
            {DIMENSIONS.map((d) => {
              const j = run.judgeResult!.dimensions[d];
              return (
                <section className={styles.judgement} key={d}>
                  <h5>
                    {DIMENSION_LABELS[d]} <span>{j.score} / 5</span>
                  </h5>
                  <p>Stated confidence: {j.confidence}</p>
                  <h6>Recorded evidence</h6>
                  {j.evidence.map((e, i) => (
                    <blockquote key={i}>{e}</blockquote>
                  ))}
                  {j.failureExplanation && (
                    <p>
                      <strong>Failure explanation:</strong>{" "}
                      {j.failureExplanation}
                    </p>
                  )}
                  {j.suggestedRevision && (
                    <p>
                      <strong>Suggested revision:</strong> {j.suggestedRevision}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <p>
          No judge result recorded. A completed run can contain deterministic
          checks without a judge.
        </p>
      )}
      <Evidence title="Saved artifact · literal source" value={run.artifact} />
      <Evidence title="Recorded context" value={run.context} />
      <Evidence title="Source and provenance" value={run.source} />
      <details className={styles.evidence}>
        <summary>Fingerprints</summary>
        <Metadata
          rows={[
            ["Prompt hash", run.promptHash],
            ["Artifact hash", run.artifactHash],
            ["Judge prompt hash", run.judgePromptHash],
            ["Golden set hash", run.goldenSetHash],
          ]}
        />
      </details>
    </>
  );
}
function QuestionDetail({ metrics: m }: { metrics: QuestionMetrics }) {
  return (
    <>
      <div className={styles.sectionTop}>
        <h3>Question quality · version {m.versionNumber}</h3>
        <span className={styles.badge}>
          {m.insufficient_data ? "Limited data" : "Descriptive statistics"}
        </span>
      </div>
      <p className={styles.hint}>{m.note}</p>
      <Metadata
        rows={[
          ["Question ID", m.questionId],
          ["Previous version", m.predecessorId],
          ["First-attempt sample", m.n],
          ["Minimum sample", m.minimumN],
          ["Complete item-rest cohort", m.correlationN],
          ["Method", m.methodVersion],
        ]}
      />
      <div className={styles.metrics}>
        <div>
          <span>Difficulty index · fraction correct</span>
          <strong>{metric(m.difficultyIndex, true)}</strong>
        </div>
        <div>
          <span>Discrimination index</span>
          <strong>{metric(m.discriminationIndex)}</strong>
        </div>
        <div>
          <span>Corrected point-biserial</span>
          <strong>{metric(m.pointBiserial)}</strong>
        </div>
      </div>
      <p className={styles.hint}>
        Higher difficulty-index values mean more correct responses. Missing
        metrics are not zero. Flags are review heuristics; they never replace a
        question automatically.
      </p>
      <h4>Review flags</h4>
      {m.flags.length ? (
        <ul>
          {m.flags.map((f) => (
            <li key={f}>{f.replaceAll("_", " ").toLowerCase()}</li>
          ))}
        </ul>
      ) : (
        <p>
          {m.insufficient_data
            ? "No flags recorded; limited data does not establish item quality."
            : "No heuristic flags recorded; this is not a quality certification."}
        </p>
      )}
      {m.reasons.length > 0 && (
        <>
          <h4>Data limitations</h4>
          <ul>
            {m.reasons.map((r) => (
              <li key={r}>{r.replaceAll("_", " ").toLowerCase()}</li>
            ))}
          </ul>
        </>
      )}
      <h4>Answer positions</h4>
      <p className={styles.hint}>
        Positions are shown without learner identities. The correct position is
        administrative answer-key information.
      </p>
      <div className={styles.positions}>
        {m.answerPositionDistribution.map((p) => (
          <div key={p.optionId}>
            <strong>
              Position {p.position} {p.isKey ? "· answer key" : "· distractor"}
            </strong>
            <span>
              {p.selected} selected · {metric(p.rate, true)}
            </span>
          </div>
        ))}
      </div>
      <Metadata
        rows={[
          ["Lower group", m.groups.lowerN],
          ["Upper group", m.groups.upperN],
          ["Target group fraction", metric(m.groups.fraction, true)],
          [
            "Boundary ties",
            m.groups.tiesIncluded ? "Included" : "Not included",
          ],
        ]}
      />
      <Evidence title="Cohort question IDs" value={m.cohortQuestionIds} />
    </>
  );
}
const SECTIONS = {
  rubric: "Rubric",
  goldens: "Golden cases",
  run: "Inspect a run",
  question: "Question quality",
  execute: "Run evaluations",
  decisions: "Expert decisions",
  releases: "Prompt releases",
};
type Section = keyof typeof SECTIONS;
export function EvaluationView(p: EvaluationProps) {
  const [section, setSection] = useState<Section>("rubric"),
    [search, setSearch] = useState(""),
    [task, setTask] = useState("all"),
    [page, setPage] = useState(1),
    [runId, setRunId] = useState(""),
    [questionId, setQuestionId] = useState(""),
    [validation, setValidation] = useState("");
  const input = useRef<HTMLInputElement>(null),
    result = useRef<HTMLDivElement>(null),
    pageHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (p.inspection || p.lookupError) result.current?.focus();
  }, [p.inspection, p.lookupError]);
  const rows = (p.library?.goldens ?? []).filter(
    (g) =>
      (task === "all" || g.registryTask === task) &&
      `${g.id} ${g.task} ${g.registryTask} ${g.provenance}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 6)),
    current = Math.min(page, pages),
    disabled = p.busy || p.pending || !p.library;
  function inspect(kind: "run" | "question") {
    const id = kind === "run" ? runId : questionId;
    try {
      evaluationId(id);
    } catch {
      setValidation("Enter a complete UUID, including all hyphens.");
      input.current?.focus();
      return;
    }
    setValidation("");
    p.onInspect(kind, id.trim());
  }
  const selected = p.inspection?.kind === section ? p.inspection : undefined;
  return (
    <div className={styles.page} aria-busy={p.busy || p.pending}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ADMIN WORKSPACE / EVALUATION</p>
          <h1>
            Look at the evidence.
            <br />
            <span>Understand the result.</span>
          </h1>
          <p>
            Inspect the rubric, reference cases and saved quality observations.
          </p>
        </div>
        <svg
          className={styles.art}
          width="200"
          height="150"
          viewBox="0 0 200 150"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="23"
            y="16"
            width="100"
            height="119"
            rx="13"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M43 43H94M43 65H85M43 87H73M43 109H82"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="133"
            cy="88"
            r="31"
            fill="var(--gui-bg)"
            stroke="var(--gui-accent)"
            strokeWidth="3"
          />
          <path
            d="M155 111L177 133M119 88L129 98L147 77"
            stroke="var(--gui-accent)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </header>
      <div className={styles.toolbar}>
        <p>
          {p.library
            ? `References checked ${new Date(p.library.checkedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC`
            : "Reference data is checked against your current admin access."}
        </p>
        <button
          type="button"
          disabled={p.busy || p.pending}
          onClick={p.onRefresh}
        >
          <RefreshCw size={15} aria-hidden="true" /> Refresh references
        </button>
      </div>
      <p className={styles.callout}>
        Inspection is read-only. Opening this page does not start generation,
        spend provider quota, create a review, replace a question or change a
        prompt release.
      </p>
      <nav className={styles.tabs} aria-label="Evaluation views">
        {(Object.keys(SECTIONS) as Section[])
          .filter(
            (s) =>
              (s !== "execute" || !!p.execution) &&
              (s !== "decisions" || !!p.decisions) &&
              (s !== "releases" || !!p.releases),
          )
          .map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={section === s}
              disabled={p.busy}
              onClick={() => {
                setSection(s);
                setValidation("");
              }}
            >
              {SECTIONS[s]}
            </button>
          ))}
      </nav>
      {p.pending ? (
        <GuiFeedback kind="loading" title="Checking evaluation references">
          <p>
            Saved values stay hidden until current access and references are
            checked.
          </p>
        </GuiFeedback>
      ) : p.error ? (
        <GuiFeedback kind="error" title="Evaluation couldn’t load">
          <p>{p.error}</p>
        </GuiFeedback>
      ) : !p.library ? (
        <GuiFeedback kind="info" title="References unavailable">
          <p>Refresh to check your current access and reference data.</p>
        </GuiFeedback>
      ) : (
        <>
          {section === "rubric" && (
            <section className={styles.card}>
              <h2>Four dimensions. Observable anchors.</h2>
              <p className={styles.hint}>
                Each dimension is scored independently from 1 to 5. These are
                the current reference anchors, not a score for your content.
              </p>
              {p.library.rubric ? (
                <>
                  <p className={styles.badge}>
                    Rubric {p.library.rubric.version}
                  </p>
                  <div className={styles.grid}>
                    {DIMENSIONS.map((d) => (
                      <section key={d} className={styles.anchor}>
                        <h3>{DIMENSION_LABELS[d]}</h3>
                        <ol>
                          {p.library!.rubric!.anchors[d].map((a, i) => (
                            <li key={i}>
                              <strong>{i + 1}</strong>
                              <p>{a}</p>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ))}
                  </div>
                </>
              ) : (
                <GuiFeedback kind="error" title="Rubric unavailable">
                  <p>{p.library.rubricError}</p>
                </GuiFeedback>
              )}
            </section>
          )}
          {section === "goldens" && (
            <section className={styles.card}>
              <div className={styles.sectionTop}>
                <h2 ref={pageHeading} tabIndex={-1}>
                  Reference cases
                </h2>
                {p.library.goldens && (
                  <span>{p.library.goldens.length} checked cases</span>
                )}
              </div>
              <p className={styles.hint}>
                Synthetic reference inputs and expected outputs. These cases are
                not successful runs or learner outcomes. Task filters use the
                registry task; original task aliases stay visible.
              </p>
              {p.library.goldens ? (
                <>
                  <div className={styles.filters}>
                    <label>
                      Search cases
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                      />
                    </label>
                    <label>
                      Registry task
                      <select
                        value={task}
                        onChange={(e) => {
                          setTask(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All tasks</option>
                        {[
                          ...new Set(
                            p.library.goldens.map((g) => g.registryTask),
                          ),
                        ]
                          .sort()
                          .map((t) => (
                            <option key={t} value={t}>
                              {t.replaceAll("_", " ")}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  {rows.length ? (
                    <ul className={styles.cases}>
                      {rows.slice((current - 1) * 6, current * 6).map((g) => (
                        <li key={g.id}>
                          <details>
                            <summary>
                              <span>{g.id}</span>
                              <small>
                                {g.task.replaceAll("_", " ")} · {g.format}
                              </small>
                            </summary>
                            <p>{g.provenance}</p>
                            {g.registryTask !== g.task && (
                              <p>Registry task: {g.registryTask}</p>
                            )}
                            {g.sourceInput && (
                              <p>Input source: {g.sourceInput}</p>
                            )}
                            <Evidence title="Input" value={g.input} />
                            <Evidence
                              title="Expected output"
                              value={g.expected}
                            />
                            {g.claims !== null && (
                              <Evidence
                                title="Claim contracts"
                                value={g.claims}
                              />
                            )}
                            <Evidence
                              title="Forbidden output"
                              value={g.forbidden}
                            />
                          </details>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {p.library.goldens.length
                        ? "No cases match these filters."
                        : "The checked golden corpus is empty."}
                    </p>
                  )}
                  <nav className={styles.paging} aria-label="Golden case pages">
                    <span>
                      {rows.length
                        ? `${(current - 1) * 6 + 1}–${Math.min(current * 6, rows.length)} of ${rows.length}`
                        : "0 matching cases"}
                    </span>
                    <div>
                      <button
                        type="button"
                        disabled={current === 1}
                        onClick={() => {
                          setPage(current - 1);
                          pageHeading.current?.focus();
                        }}
                      >
                        Previous cases
                      </button>
                      <button
                        type="button"
                        disabled={current === pages}
                        onClick={() => {
                          setPage(current + 1);
                          pageHeading.current?.focus();
                        }}
                      >
                        Next cases
                      </button>
                    </div>
                  </nav>
                </>
              ) : (
                <GuiFeedback kind="error" title="Golden cases unavailable">
                  <p>{p.library.goldensError}</p>
                </GuiFeedback>
              )}
            </section>
          )}
          {(section === "run" || section === "question") && (
            <section className={styles.card}>
              <h2>
                {section === "run"
                  ? "Check a known run"
                  : "Inspect a question version"}
              </h2>
              <p className={styles.hint}>
                {section === "run"
                  ? "Enter the complete ID of a saved evaluation run. There is no global run list in this API."
                  : "Enter the complete question ID. Statistics describe first attempts for this version and a complete current same-concept rest-item cohort."}
              </p>
              <form
                className={styles.lookup}
                onSubmit={(e) => {
                  e.preventDefault();
                  inspect(section);
                }}
              >
                <label htmlFor="evaluation-lookup">
                  {section === "run" ? "Evaluation run ID" : "Question ID"}
                  <input
                    ref={input}
                    id="evaluation-lookup"
                    value={section === "run" ? runId : questionId}
                    onChange={(e) => {
                      if (section === "run") setRunId(e.target.value);
                      else setQuestionId(e.target.value);
                      setValidation("");
                    }}
                    disabled={disabled}
                    aria-invalid={!!validation}
                    aria-describedby={
                      validation
                        ? "evaluation-validation"
                        : "evaluation-id-help"
                    }
                    spellCheck={false}
                    autoComplete="off"
                  />
                </label>
                <button
                  className={styles.primary}
                  disabled={disabled}
                  type="submit"
                >
                  <Search size={15} aria-hidden="true" />
                  {p.busy ? "Checking…" : "Check saved record"}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </form>
              <p id="evaluation-id-help" className={styles.hint}>
                Complete UUID only. Checking never starts a run or changes this
                record.
              </p>
              {validation && (
                <p id="evaluation-validation" role="alert">
                  {validation}
                </p>
              )}
              <div ref={result} tabIndex={-1} className={styles.result}>
                {p.lookupError && (
                  <GuiFeedback kind="error" title="Record couldn’t be checked">
                    <p>{p.lookupError}</p>
                  </GuiFeedback>
                )}
                {selected && (
                  <>
                    <p className={styles.hint}>
                      Record checked{" "}
                      {new Date(selected.checkedAt).toLocaleString("en-GB", {
                        timeZone: "UTC",
                      })}{" "}
                      UTC. Values describe that saved snapshot.
                    </p>
                    {selected.kind === "run" ? (
                      <RunDetail
                        run={selected.value}
                        rubricVersion={p.library.rubric?.version}
                      />
                    ) : (
                      <QuestionDetail metrics={selected.value} />
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </>
      )}
      {p.execution && <div hidden={section !== "execute"}>{p.execution}</div>}
      {p.decisions && <div hidden={section !== "decisions"}>{p.decisions}</div>}
      {p.releases && <div hidden={section !== "releases"}>{p.releases}</div>}
      <footer className={styles.footer}>
        <h2>Keep inspection deliberate.</h2>
        <p>
          Start an evaluation only from Run evaluations with explicit scope
          confirmation. Expert decisions, question replacement and
          serving-release changes remain separate workflows.
        </p>
      </footer>
    </div>
  );
}
