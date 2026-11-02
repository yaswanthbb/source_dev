import {
  DIMENSIONS,
  TASKS,
  evaluationId,
  object,
  parseRun,
  type EvalRun,
  type Json,
} from "./evaluation-data";
import type { EvaluationLibrary } from "./evaluation-client";
import {
  executionAction,
  EMPTY_EXECUTION_DRAFT,
  executionFingerprint,
  executionCases,
  parseExecutionAck,
  checkExecutionReadback,
  type ExecutionAction,
  type ExecutionOutcome,
} from "./execution-data";
export interface ReleaseSource {
  action: Extract<ExecutionAction, { kind: "comparison" }>;
  outcome: ExecutionOutcome;
  library: EvaluationLibrary;
}
export interface GateSummary {
  n: number;
  layer1PassRate: number;
  goldenPassRate: number;
  checks: Record<string, number>;
  judgeScores: Record<string, number>;
}
export interface GateReport {
  passed: boolean;
  failures: string[];
  baseline: GateSummary;
  candidate: GateSummary;
  delta: {
    layer1PassRate: number;
    goldenPassRate: number;
    judgeScores: Record<string, number>;
  };
}
export interface ApprovalEvidence {
  source: ReleaseSource;
  comparisonId: string;
  task: string;
  baselinePromptId: string;
  candidatePromptId: string;
  baselineHash: string;
  candidateHash: string;
  goldenSetHash: string;
  report: GateReport;
  checkedAt: string;
}
export type ReleaseAction =
  | { kind: "approve"; evidence: ApprovalEvidence }
  | { kind: "rollback"; task: string };
export interface ReleaseOutcome {
  kind: ReleaseAction["kind"];
  id?: string;
  task: string;
  acknowledgement: Json;
  checkedAt: string;
  message: string;
}
function bad(): never {
  throw new Error("Release evidence is incomplete or inconsistent.");
}
const text = (v: unknown): string =>
  typeof v === "string" && !!v.trim() ? v : bad();
export function releaseTask(value: unknown): string {
  const t = text(value);
  if (!(TASKS as readonly string[]).includes(t)) bad();
  return t;
}
export function observedGate(
  a: EvalRun[],
  b: EvalRun[],
  expectedIds: string[],
  setHash: string,
  rubricVersion: string,
): GateReport {
  const failures: string[] = [];
  for (const [rows, name] of [
    [a, "baseline"],
    [b, "candidate"],
  ] as const) {
    if (
      !expectedIds.length ||
      rows.length !== expectedIds.length ||
      new Set(rows.map((r) => r.goldenId)).size !== rows.length ||
      rows.some(
        (r) =>
          !r.goldenId ||
          !expectedIds.includes(r.goldenId) ||
          r.goldenSetHash !== setHash ||
          r.status !== "completed" ||
          !r.judgeResult ||
          r.rubricVersion !== rubricVersion,
      )
    )
      failures.push(
        `${name}: incomplete/failed/mismatched golden cohort or judge evidence`,
      );
  }
  if (
    new Set(
      [...a, ...b].map(
        (r) =>
          `${r.generatorModel}|${r.judgeModel}|${r.seed}|${r.judgeSeed}|${r.judgePromptHash}|${r.rubricVersion}`,
      ),
    ).size !== 1
  )
    failures.push("Generator/judge/model/prompt/rubric/seed conditions differ");
  const summarize = (rows: EvalRun[]): GateSummary => ({
    n: rows.length,
    layer1PassRate: rows.length
      ? rows.filter((r) => r.deterministicResult.passed).length / rows.length
      : 0,
    goldenPassRate: rows.length
      ? rows.filter((r) => r.goldenDiff?.passed).length / rows.length
      : 0,
    checks: Object.fromEntries(
      [
        ...new Set(
          rows.flatMap((r) => r.deterministicResult.checks.map((c) => c.code)),
        ),
      ]
        .sort()
        .map((code) => {
          const obs = rows.flatMap((r) =>
            r.deterministicResult.checks.filter((c) => c.code === code),
          );
          return [code, obs.filter((c) => c.passed).length / obs.length];
        }),
    ),
    judgeScores: Object.fromEntries(
      DIMENSIONS.map((d) => [
        d,
        rows.length
          ? rows.reduce(
              (sum, r) => sum + (r.judgeResult?.dimensions[d].score ?? 0),
              0,
            ) / rows.length
          : 0,
      ]),
    ),
  });
  const baseline = summarize(a),
    candidate = summarize(b);
  if (candidate.layer1PassRate < baseline.layer1PassRate)
    failures.push("Layer 1 pass rate regressed");
  if (candidate.goldenPassRate < baseline.goldenPassRate)
    failures.push("Golden output pass rate regressed");
  for (const [code, rate] of Object.entries(baseline.checks))
    if ((candidate.checks[code] ?? -1) < rate)
      failures.push(`Protected check ${code} regressed`);
  for (const d of DIMENSIONS)
    if (candidate.judgeScores[d] < baseline.judgeScores[d])
      failures.push(`Judge ${d} regressed`);
  return {
    passed: !failures.length,
    failures,
    baseline,
    candidate,
    delta: {
      layer1PassRate: candidate.layer1PassRate - baseline.layer1PassRate,
      goldenPassRate: candidate.goldenPassRate - baseline.goldenPassRate,
      judgeScores: Object.fromEntries(
        DIMENSIONS.map((d) => [
          d,
          candidate.judgeScores[d] - baseline.judgeScores[d],
        ]),
      ),
    },
  };
}
export function releaseSourceFingerprint(source: ReleaseSource): string {
  return executionFingerprint({
    action: source.action,
    outcome: source.outcome,
    user: { id: source.library.user.id, role: source.library.user.role },
    rubric: source.library.rubric,
    goldens: source.library.goldens,
  });
}
export function approvalEvidence(
  source: ReleaseSource,
  checkedAt = new Date().toISOString(),
): ApprovalEvidence {
  const action = executionAction({
    ...EMPTY_EXECUTION_DRAFT,
    ...source.action,
  });
  if (
    action.kind !== "comparison" ||
    executionFingerprint(action) !== executionFingerprint(source.action) ||
    source.outcome.kind !== "comparison" ||
    source.outcome.proof !== "runs" ||
    !source.library.rubric ||
    !source.library.goldens
  )
    bad();
  const rows = source.outcome.runs.map((r) => parseRun(r, r.id)),
    parsed = parseExecutionAck(source.outcome.payload, action, source.library);
  checkExecutionReadback(parsed, rows, action, source.library);
  const meta = object(parsed.payload),
    r = object(meta.result),
    aIds = meta.baselineRunIds as string[],
    bIds = meta.candidateRunIds as string[],
    a = rows.filter((r) => aIds.includes(r.id)),
    b = rows.filter((r) => bIds.includes(r.id));
  const report = observedGate(
    a,
    b,
    executionCases(source.library, action).map((g) => g.id),
    text(meta.goldenSetHash),
    source.library.rubric!.version,
  );
  if (executionFingerprint(report) !== executionFingerprint(r)) bad();
  return {
    source: {
      ...source,
      outcome: { ...source.outcome, payload: parsed.payload, runs: rows },
    },
    comparisonId: evaluationId(meta.id),
    task: releaseTask(meta.task),
    baselinePromptId: evaluationId(meta.baselinePromptId),
    candidatePromptId: evaluationId(meta.candidatePromptId),
    baselineHash: text(a[0]?.promptHash),
    candidateHash: text(b[0]?.promptHash),
    goldenSetHash: text(meta.goldenSetHash),
    report,
    checkedAt,
  };
}
export function releaseAction(action: ReleaseAction): ReleaseAction {
  if (action.kind === "rollback")
    return { kind: "rollback", task: releaseTask(action.task) };
  if (action.kind !== "approve") bad();
  const evidence = approvalEvidence(
    action.evidence.source,
    action.evidence.checkedAt,
  );
  if (
    !evidence.report.passed ||
    executionFingerprint(evidence) !== executionFingerprint(action.evidence)
  )
    bad();
  return { kind: "approve", evidence };
}
export function releaseAck(
  raw: unknown,
  action: ReleaseAction,
  actor: string,
): Json {
  const r = object(raw);
  if (action.kind === "rollback") {
    if (r.task !== action.task || r.baselineRestored !== true) bad();
    return { task: action.task, baselineRestored: true };
  }
  const a = action.evidence,
    id = evaluationId(r.id),
    createdAt = text(r.createdAt),
    updatedAt = text(r.updatedAt);
  if (
    !Number.isFinite(Date.parse(createdAt)) ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    r.task !== a.task ||
    r.comparisonId !== a.comparisonId ||
    r.baselinePromptId !== a.baselinePromptId ||
    r.candidatePromptId !== a.candidatePromptId ||
    r.baselineHash !== a.baselineHash ||
    r.candidateHash !== a.candidateHash ||
    r.goldenSetHash !== a.goldenSetHash ||
    r.status !== "approved" ||
    r.approvedById !== actor
  )
    bad();
  return {
    id,
    task: a.task,
    comparisonId: a.comparisonId,
    baselinePromptId: a.baselinePromptId,
    candidatePromptId: a.candidatePromptId,
    baselineHash: a.baselineHash,
    candidateHash: a.candidateHash,
    goldenSetHash: a.goldenSetHash,
    status: "approved",
    createdAt,
    updatedAt,
  };
}
