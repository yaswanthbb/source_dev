import {
  TASKS,
  DIMENSIONS,
  evaluationId,
  object,
  json,
  parseRun,
  type Json,
  type EvalRun,
} from "./evaluation-data";
import type { EvaluationLibrary } from "./evaluation-client";
export type ExecutionKind =
  "candidate" | "shadow" | "regression" | "comparison" | "compilation";
export const EXECUTION_LABELS: Record<ExecutionKind, string> = {
  candidate: "Create a prompt candidate",
  shadow: "Shadow evaluation",
  regression: "Full regression",
  comparison: "Compare two versions",
  compilation: "Evaluate a saved compilation",
};
export type ExecutionAction =
  | {
      kind: "candidate";
      task: string;
      version: string;
      systemTemplate: string;
      changelog: string;
    }
  | { kind: "shadow"; task: string; version: string }
  | { kind: "regression" }
  | {
      kind: "comparison";
      task: string;
      baselineVersion: string;
      candidateVersion: string;
    }
  | { kind: "compilation"; compilationId: string; judge: boolean };
export interface ExecutionDraft {
  kind: ExecutionKind;
  task: string;
  version: string;
  systemTemplate: string;
  changelog: string;
  baselineVersion: string;
  candidateVersion: string;
  compilationId: string;
  judge: boolean;
}
export const EMPTY_EXECUTION_DRAFT: ExecutionDraft = {
  kind: "candidate",
  task: "concept_draft",
  version: "",
  systemTemplate: "",
  changelog: "",
  baselineVersion: "",
  candidateVersion: "",
  compilationId: "",
  judge: false,
};
export function executionValidation(d: ExecutionDraft) {
  const errors: Record<string, string> = {};
  if (!Object.hasOwn(EXECUTION_LABELS, d.kind))
    errors.kind = "Choose an evaluation action.";
  if (
    d.kind !== "regression" &&
    d.kind !== "compilation" &&
    !(TASKS as readonly string[]).includes(d.task)
  )
    errors.task = "Choose a supported registry task.";
  const version = (key: "version" | "baselineVersion" | "candidateVersion") => {
    if (!d[key].trim() || d[key].trim().length > 32)
      errors[key] = "Enter an existing version, up to 32 characters.";
  };
  if (d.kind === "candidate" || d.kind === "shadow") version("version");
  if (d.kind === "candidate") {
    if (
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(d.version.trim()) ||
      d.version.trim().length > 32
    )
      errors.version =
        "Use a new semantic version, up to 32 characters (for example 1.2.0).";
    if (!d.systemTemplate.trim() || d.systemTemplate.length > 30000)
      errors.systemTemplate =
        "Enter the complete system template, up to 30,000 characters.";
    if (!d.changelog.trim() || d.changelog.length > 2000)
      errors.changelog = "Explain the change in 1–2,000 characters.";
  }
  if (d.kind === "comparison") {
    version("baselineVersion");
    version("candidateVersion");
    if (d.baselineVersion.trim() === d.candidateVersion.trim())
      errors.candidateVersion = "Compare distinct existing versions.";
  }
  if (d.kind === "compilation") {
    try {
      evaluationId(d.compilationId);
    } catch {
      errors.compilationId = "Enter the complete compilation UUID.";
    }
  }
  return errors;
}
export function executionAction(d: ExecutionDraft): ExecutionAction {
  if (Object.keys(executionValidation(d)).length)
    throw new Error("Check the action fields before reviewing.");
  switch (d.kind) {
    case "candidate":
      return {
        kind: d.kind,
        task: d.task,
        version: d.version.trim(),
        systemTemplate: d.systemTemplate,
        changelog: d.changelog,
      };
    case "shadow":
      return { kind: d.kind, task: d.task, version: d.version.trim() };
    case "comparison":
      return {
        kind: d.kind,
        task: d.task,
        baselineVersion: d.baselineVersion.trim(),
        candidateVersion: d.candidateVersion.trim(),
      };
    case "compilation":
      return {
        kind: d.kind,
        compilationId: evaluationId(d.compilationId),
        judge: d.judge,
      };
    default:
      return { kind: "regression" };
  }
}
export function paidExecution(a: ExecutionAction) {
  return a.kind !== "candidate" && !(a.kind === "compilation" && !a.judge);
}
export function executionCases(l: EvaluationLibrary, a: ExecutionAction) {
  return (l.goldens ?? []).filter(
    (g) =>
      a.kind === "regression" || ("task" in a && g.registryTask === a.task),
  );
}
export function executionFingerprint(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
}
export function executionReference(
  l: EvaluationLibrary,
  a: ExecutionAction,
): string {
  if (a.kind === "candidate") return "candidate";
  if (!l.rubric || (a.kind !== "compilation" && !l.goldens))
    throw new Error(
      "Refresh the current rubric and golden cases before this evaluation.",
    );
  if (a.kind !== "compilation" && !executionCases(l, a).length)
    throw new Error(
      "No checked golden cases cover this selection. Choose a covered task or refresh references.",
    );
  return executionFingerprint({
    rubric: l.rubric,
    goldens: a.kind === "compilation" ? undefined : l.goldens,
  });
}
export interface ExecutionOutcome {
  kind: ExecutionKind;
  title: string;
  proof: "ack" | "runs";
  payload: Json;
  runs: EvalRun[];
  checkedAt: string;
}
const bad = (): never => {
  throw new Error("Evaluation acknowledgement is inconsistent.");
};
const text = (v: unknown): string =>
  typeof v === "string" && !!v.trim() ? v : bad();
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(text) : bad();
const bool = (v: unknown): boolean => (typeof v === "boolean" ? v : bad());
const array = (v: unknown): unknown[] =>
  Array.isArray(v) && v.length <= 100 ? v : bad();
const unique = (ids: string[]) =>
  new Set(ids).size === ids.length ? ids : bad();
const rate = (v: unknown, min = 0, max = 1) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? v
    : bad();
export function acknowledgementRun(raw: unknown, userId: string): EvalRun {
  const r = object(raw);
  if (r.createdById !== userId) bad();
  return parseRun({ ...r, judgeSeed: r.judgeSeed ?? null }, evaluationId(r.id));
}
export function checkCohort(
  rows: EvalRun[],
  a: ExecutionAction,
  l: EvaluationLibrary,
  mode: string,
  version: string,
  hash?: string,
) {
  const ids = executionCases(l, a).map((g) => g.id);
  if (
    rows.length !== ids.length ||
    !rows.length ||
    unique(rows.map((r) => r.id)).length !== rows.length ||
    new Set(rows.map((r) => r.goldenId)).size !== rows.length ||
    rows.some(
      (r) =>
        r.task !== (a as { task: string }).task ||
        r.mode !== mode ||
        r.promptVersion !== version ||
        !r.goldenId ||
        !ids.includes(r.goldenId) ||
        r.rubricVersion !== l.rubric?.version ||
        (hash && r.goldenSetHash !== hash),
    ) ||
    new Set(rows.map((r) => r.promptHash)).size !== 1 ||
    new Set(rows.map((r) => r.goldenSetHash)).size !== 1 ||
    rows.some((r) => !r.goldenSetHash)
  )
    bad();
}
function summary(v: unknown, n: number) {
  const r = object(v);
  if (r.n !== n) bad();
  const checks = object(r.checks),
    scores = object(r.judgeScores);
  return {
    n,
    layer1PassRate: rate(r.layer1PassRate),
    goldenPassRate: rate(r.goldenPassRate),
    checks: Object.fromEntries(
      Object.entries(checks).map(([k, v]) => [k, rate(v)]),
    ),
    judgeScores: Object.fromEntries(
      DIMENSIONS.map((d) => [d, rate(scores[d], 0, 5)]),
    ),
  };
}
export interface ParsedExecution {
  payload: Json;
  ids: string[];
  ackRuns?: EvalRun[];
  comparison?: { baselineIds: string[]; candidateIds: string[]; hash: string };
  regression?: {
    task: string;
    version: string | null;
    passed: boolean;
    ids: string[];
    summaries: Record<string, unknown>[];
  }[];
}
export function parseExecutionAck(
  raw: unknown,
  a: ExecutionAction,
  l: EvaluationLibrary,
): ParsedExecution {
  if (a.kind === "candidate") {
    const r = object(raw);
    if (
      r.task !== a.task ||
      r.version !== a.version ||
      r.systemTemplate !== a.systemTemplate ||
      r.changelog !== a.changelog ||
      r.status !== "draft"
    )
      bad();
    return {
      ids: [],
      payload: {
        id: evaluationId(r.id),
        task: a.task,
        version: a.version,
        status: "draft",
        systemTemplate: a.systemTemplate,
        changelog: a.changelog,
      },
    };
  }
  if (a.kind === "shadow" || a.kind === "compilation") {
    const rows = (a.kind === "shadow" ? array(raw) : [raw]).map((v) =>
      acknowledgementRun(v, l.user.id),
    );
    if (a.kind === "shadow") checkCohort(rows, a, l, "shadow", a.version);
    else {
      const r = rows[0],
        source = object(r.source);
      if (
        r.mode !== "saved_artifact" ||
        source.compilationId !== a.compilationId ||
        r.rubricVersion !== l.rubric?.version ||
        (!a.judge &&
          (r.judgeResult !== null ||
            r.judgeModel !== null ||
            r.status !== "completed"))
      )
        bad();
    }
    return {
      ids: unique(rows.map((r) => r.id)),
      ackRuns: rows,
      payload: { runIds: rows.map((r) => r.id) },
    };
  }
  if (a.kind === "comparison") {
    const r = object(raw),
      result = object(r.result),
      n = executionCases(l, a).length;
    const baselineIds = unique(strings(r.baselineRunIds).map(evaluationId)),
      candidateIds = unique(strings(r.candidateRunIds).map(evaluationId));
    if (
      r.task !== a.task ||
      baselineIds.length !== n ||
      candidateIds.length !== n ||
      baselineIds.some((id) => candidateIds.includes(id)) ||
      evaluationId(r.baselinePromptId) === evaluationId(r.candidatePromptId)
    )
      bad();
    const failures = strings(result.failures),
      passed = bool(result.passed);
    if (passed !== (failures.length === 0)) bad();
    const delta = object(result.delta),
      judge = object(delta.judgeScores);
    const payload = {
      id: evaluationId(r.id),
      task: a.task,
      baselinePromptId: evaluationId(r.baselinePromptId),
      candidatePromptId: evaluationId(r.candidatePromptId),
      goldenSetHash: text(r.goldenSetHash),
      baselineRunIds: baselineIds,
      candidateRunIds: candidateIds,
      result: {
        passed,
        failures,
        baseline: summary(result.baseline, n),
        candidate: summary(result.candidate, n),
        delta: {
          layer1PassRate: rate(delta.layer1PassRate, -1, 1),
          goldenPassRate: rate(delta.goldenPassRate, -1, 1),
          judgeScores: Object.fromEntries(
            DIMENSIONS.map((d) => [d, rate(judge[d], -5, 5)]),
          ),
        },
      },
    };
    return {
      payload: json(payload),
      ids: [...baselineIds, ...candidateIds],
      comparison: { baselineIds, candidateIds, hash: payload.goldenSetHash },
    };
  }
  const r = object(raw),
    tasks = array(r.tasks);
  if (tasks.length !== TASKS.length) bad();
  const regression = tasks.map((v) => {
    const t = object(v),
      task = text(t.task),
      passed = bool(t.passed);
    if (!(TASKS as readonly string[]).includes(task)) bad();
    if (t.version === undefined) {
      if (passed || !strings(t.differences).length || t.runs !== undefined)
        bad();
      return {
        task,
        version: null,
        passed,
        ids: [],
        summaries: [],
        differences: strings(t.differences),
      };
    }
    const version = text(t.version),
      summaries = array(t.runs).map((v) => {
        const s = object(v);
        evaluationId(s.id);
        text(s.goldenId);
        if (!["pending", "completed", "failed"].includes(text(s.status))) bad();
        array(s.checks).forEach((c) => {
          const x = object(c);
          text(x.code);
          bool(x.passed);
          if (typeof x.detail !== "string") bad();
        });
        strings(s.warnings);
        if (s.differences !== undefined) strings(s.differences);
        return {
          id: evaluationId(s.id),
          goldenId: s.goldenId,
          status: s.status,
          checks: json(s.checks),
          differences: s.differences === undefined ? null : json(s.differences),
          judge: json(s.judge),
          warnings: json(s.warnings),
        };
      });
    const expected = (l.goldens ?? []).filter((g) => g.registryTask === task);
    if (
      summaries.length !== expected.length ||
      new Set(summaries.map((s) => s.goldenId)).size !== summaries.length ||
      summaries.some((s) => !expected.some((g) => g.id === s.goldenId))
    )
      bad();
    return {
      task,
      version,
      passed,
      ids: unique(summaries.map((s) => s.id)),
      summaries,
      differences: [],
    };
  });
  unique(regression.map((t) => t.task));
  if (bool(r.passed) !== regression.every((t) => t.passed)) bad();
  return {
    payload: json({ passed: r.passed, tasks: regression }),
    ids: unique(regression.flatMap((t) => t.ids)),
    regression,
  };
}
export function checkExecutionReadback(
  parsed: ParsedExecution,
  rows: EvalRun[],
  a: ExecutionAction,
  l: EvaluationLibrary,
) {
  if (
    rows.length !== parsed.ids.length ||
    unique(rows.map((r) => r.id)).length !== rows.length ||
    rows.some((r) => !parsed.ids.includes(r.id))
  )
    bad();
  if (
    parsed.ackRuns &&
    executionFingerprint(parsed.ackRuns) !== executionFingerprint(rows)
  )
    bad();
  if (a.kind === "comparison" && parsed.comparison) {
    const c = parsed.comparison;
    checkCohort(
      rows.filter((r) => c.baselineIds.includes(r.id)),
      a,
      l,
      "baseline",
      a.baselineVersion,
      c.hash,
    );
    checkCohort(
      rows.filter((r) => c.candidateIds.includes(r.id)),
      a,
      l,
      "candidate",
      a.candidateVersion,
      c.hash,
    );
  }
  if (a.kind === "regression" && parsed.regression)
    for (const t of parsed.regression) {
      const runs = rows.filter((r) => t.ids.includes(r.id));
      if (t.version !== null) {
        if (
          runs.some(
            (r) =>
              r.task !== t.task ||
              r.promptVersion !== t.version ||
              r.mode !== "baseline" ||
              r.rubricVersion !== l.rubric?.version,
          )
        )
          bad();
        for (const s of t.summaries) {
          const r = runs.find((r) => r.id === s.id);
          if (
            !r ||
            r.goldenId !== s.goldenId ||
            r.status !== s.status ||
            executionFingerprint(r.deterministicResult.checks) !==
              executionFingerprint(s.checks) ||
            executionFingerprint(r.goldenDiff?.differences ?? null) !==
              executionFingerprint(s.differences) ||
            executionFingerprint(r.judgeResult) !==
              executionFingerprint(s.judge) ||
            executionFingerprint(r.warnings) !==
              executionFingerprint(s.warnings)
          )
            bad();
        }
        if (
          t.passed !==
          (runs.length > 0 &&
            runs.every(
              (r) =>
                r.status === "completed" &&
                r.deterministicResult.passed &&
                r.goldenDiff?.passed,
            ))
        )
          bad();
      }
    }
}
