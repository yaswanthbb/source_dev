export const DIMENSIONS = [
  "accuracy",
  "clarity",
  "pedagogy",
  "difficultyCalibration",
] as const;
export const DIMENSION_LABELS = {
  accuracy: "Accuracy",
  clarity: "Clarity",
  pedagogy: "Pedagogy",
  difficultyCalibration: "Difficulty calibration",
};
export const TASKS = [
  "roadmap_modules",
  "module_concepts",
  "concept_content",
  "concept_mcqs",
  "qa_answer",
  "concept_outline",
  "concept_draft",
  "concept_factcheck",
  "concept_critique",
  "concept_revise",
  "concept_misconceptions",
  "concept_mcq_draft",
  "concept_mcq_verify",
  "eval_judge",
] as const;
type Dimension = (typeof DIMENSIONS)[number];
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
const bad = (): never => {
  throw new Error("Evaluation data is incomplete or inconsistent.");
};
export const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : bad();
const text = (v: unknown): string => (typeof v === "string" ? v : bad());
const nonempty = (v: unknown) => (text(v).trim() ? text(v) : bad());
const flag = (v: unknown): boolean => (typeof v === "boolean" ? v : bad());
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : bad());
const strings = (v: unknown) => list(v).map(text);
const integer = (v: unknown, min = 0): number =>
  Number.isSafeInteger(v) && Number(v) >= min ? Number(v) : bad();
const number = (v: unknown, min: number, max: number): number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? v
    : bad();
const nullableText = (v: unknown) => (v === null ? null : text(v));
const nullableInteger = (v: unknown) =>
  v === null ? null : Number.isSafeInteger(v) ? Number(v) : bad();
const nullableNumber = (v: unknown, min: number, max: number) =>
  v === null ? null : number(v, min, max);
export function evaluationId(v: unknown): string {
  const id = text(v).trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    bad();
  return id;
}
function unique<T>(rows: T[], key: (v: T) => string | number) {
  if (new Set(rows.map(key)).size !== rows.length) bad();
  return rows;
}
function task(v: unknown, golden = false) {
  const t = text(v);
  if (
    !(TASKS as readonly string[]).includes(t) &&
    !(golden && ["concept_research", "concept_diagram"].includes(t))
  )
    bad();
  return t;
}
export function json(v: unknown, depth = 0): Json {
  if (depth > 24) bad();
  if (v === null || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (Array.isArray(v)) return v.map((x) => json(x, depth + 1));
  const row = object(v);
  return Object.fromEntries(
    Object.entries(row).map(([k, x]) => [k, json(x, depth + 1)]),
  );
}
function document(v: unknown) {
  const value = json(v);
  if (JSON.stringify(value).length > 1000000) bad();
  return value;
}
export interface Rubric {
  version: string;
  anchors: Record<Dimension, string[]>;
}
export function parseRubric(raw: unknown): Rubric {
  const r = object(raw),
    a = object(r.anchors);
  return {
    version: nonempty(r.version),
    anchors: Object.fromEntries(
      DIMENSIONS.map((d) => {
        const scores = strings(a[d]);
        if (scores.length !== 5 || scores.some((s) => !s.trim())) bad();
        return [d, scores];
      }),
    ) as Rubric["anchors"],
  };
}
export interface Golden {
  id: string;
  task: string;
  registryTask: string;
  format: string;
  provenance: string;
  input: Json;
  expected: Json;
  claims: Json;
  forbidden: string[];
  sourceInput: string | null;
}
export function parseGoldens(raw: unknown): Golden[] {
  const rows = list(raw);
  if (rows.length > 50) bad();
  return unique(
    rows.map((v) => {
      const r = object(v);
      const t = task(r.task, true);
      const format = text(r.format);
      if (!["prose", "structured", "mcq_set", "lesson"].includes(format)) bad();
      return {
        id: nonempty(r.id),
        task: t,
        registryTask: r.registryTask === undefined ? t : task(r.registryTask),
        format,
        provenance: nonempty(r.provenance),
        input: document(object(r.input)),
        expected: document(r.expected),
        claims: r.claims === undefined ? null : document(list(r.claims)),
        forbidden: r.forbidden === undefined ? [] : strings(r.forbidden),
        sourceInput: r.sourceInput === undefined ? null : text(r.sourceInput),
      };
    }),
    (r) => r.id,
  );
}
export interface Judgement {
  score: number;
  evidence: string[];
  failureExplanation: string;
  suggestedRevision: string;
  confidence: string;
}
export interface EvalRun {
  id: string;
  task: string;
  mode: string;
  status: string;
  promptVersion: string;
  promptHash: string;
  artifactHash: string;
  generatorModel: string;
  judgeModel: string | null;
  judgePromptVersion: string | null;
  judgePromptHash: string | null;
  rubricVersion: string;
  seed: number | null;
  judgeSeed: number | null;
  goldenId: string | null;
  goldenSetHash: string | null;
  createdAt: string;
  deterministicResult: {
    passed: boolean;
    checks: { code: string; passed: boolean; detail: string }[];
  };
  judgeResult: {
    rubricVersion: string;
    dimensions: Record<Dimension, Judgement>;
  } | null;
  goldenDiff: { passed: boolean; differences: string[] } | null;
  warnings: string[];
  artifact: Json;
  context: Json;
  source: Json;
}
export function parseRun(raw: unknown, id: string): EvalRun {
  const r = object(raw),
    det = object(r.deterministicResult);
  if (evaluationId(r.id).toLowerCase() !== id.toLowerCase()) bad();
  const mode = text(r.mode),
    status = text(r.status),
    createdAt = text(r.createdAt);
  if (
    !["shadow", "baseline", "candidate", "saved_artifact"].includes(mode) ||
    !["pending", "completed", "failed"].includes(status) ||
    !Number.isFinite(Date.parse(createdAt))
  )
    bad();
  const artifact = object(r.artifact);
  if (
    !["lesson", "mcq_set", "compilation", "prose", "structured"].includes(
      text(artifact.kind),
    )
  )
    bad();
  let judgeResult: EvalRun["judgeResult"] = null;
  if (r.judgeResult !== null) {
    const j = object(r.judgeResult),
      dims = object(j.dimensions);
    const dimensions = Object.fromEntries(
      DIMENSIONS.map((d) => {
        const v = object(dims[d]),
          evidence = strings(v.evidence),
          score = integer(v.score, 1),
          confidence = text(v.confidence),
          failureExplanation = text(v.failureExplanation),
          suggestedRevision = text(v.suggestedRevision);
        if (
          score > 5 ||
          !evidence.length ||
          evidence.some((s) => !s.trim()) ||
          !["low", "medium", "high"].includes(confidence) ||
          (score < 4 &&
            (!failureExplanation.trim() || !suggestedRevision.trim()))
        )
          bad();
        return [
          d,
          {
            score,
            confidence,
            evidence,
            failureExplanation,
            suggestedRevision,
          },
        ];
      }),
    ) as Record<Dimension, Judgement>;
    judgeResult = { rubricVersion: nonempty(j.rubricVersion), dimensions };
    if (judgeResult.rubricVersion !== r.rubricVersion) bad();
  }
  const gd = r.goldenDiff === null ? null : object(r.goldenDiff);
  return {
    id: evaluationId(r.id),
    task: task(r.task),
    mode,
    status,
    createdAt,
    promptVersion: nonempty(r.promptVersion),
    promptHash: nonempty(r.promptHash),
    artifactHash: nonempty(r.artifactHash),
    generatorModel: nonempty(r.generatorModel),
    judgeModel: nullableText(r.judgeModel),
    judgePromptVersion: nullableText(r.judgePromptVersion),
    judgePromptHash: nullableText(r.judgePromptHash),
    rubricVersion: nonempty(r.rubricVersion),
    seed: nullableInteger(r.seed),
    judgeSeed: nullableInteger(r.judgeSeed),
    goldenId: nullableText(r.goldenId),
    goldenSetHash: nullableText(r.goldenSetHash),
    deterministicResult: {
      passed: flag(det.passed),
      checks: list(det.checks).map((v) => {
        const c = object(v);
        return {
          code: nonempty(c.code),
          passed: flag(c.passed),
          detail: text(c.detail),
        };
      }),
    },
    judgeResult,
    goldenDiff: gd && {
      passed: flag(gd.passed),
      differences: strings(gd.differences),
    },
    warnings: strings(r.warnings),
    artifact: document(artifact),
    context: document(object(r.context)),
    source: r.source === null ? null : document(object(r.source)),
  };
}
export interface Position {
  optionId: string;
  position: number;
  isKey: boolean;
  selected: number;
  rate: number | null;
}
export interface QuestionMetrics {
  questionId: string;
  n: number;
  minimumN: number;
  insufficient_data: boolean;
  difficultyIndex: number | null;
  discriminationIndex: number | null;
  pointBiserial: number | null;
  correlationN: number;
  groups: {
    fraction: number;
    lowerN: number;
    upperN: number;
    tiesIncluded: boolean;
  };
  answerPositionDistribution: Position[];
  flags: string[];
  reasons: string[];
  weakItem: boolean;
  versionNumber: number;
  predecessorId: string | null;
  cohortQuestionIds: string[];
  methodVersion: string;
  note: string;
}
export function parseMetrics(raw: unknown, id: string): QuestionMetrics {
  const r = object(raw),
    g = object(r.groups),
    n = integer(r.n),
    correlationN = integer(r.correlationN),
    minimumN = integer(r.minimumN, 20);
  if (
    evaluationId(r.questionId).toLowerCase() !== id.toLowerCase() ||
    correlationN > n
  )
    bad();
  const positions = unique(
    list(r.answerPositionDistribution).map((v) => {
      const p = object(v),
        selected = integer(p.selected),
        rate = nullableNumber(p.rate, 0, 1);
      if (
        selected > n ||
        (n === 0
          ? rate !== null || selected !== 0
          : rate === null || Math.abs(rate - selected / n) > 1e-9)
      )
        bad();
      return {
        optionId: evaluationId(p.optionId),
        position: integer(p.position, 1),
        isKey: flag(p.isKey),
        selected,
        rate,
      };
    }),
    (p) => p.optionId,
  );
  unique(positions, (p) => p.position);
  if (
    positions.length < 2 ||
    positions.length > 12 ||
    positions.filter((p) => p.isKey).length !== 1 ||
    positions.reduce((sum, p) => sum + p.selected, 0) !== n
  )
    bad();
  const correct = list(r.correctPositions).map((v) => integer(v, 1));
  if (
    correct.length !== 1 ||
    correct[0] !== positions.find((p) => p.isKey)?.position
  )
    bad();
  const difficultyIndex = nullableNumber(r.difficultyIndex, 0, 1),
    key = positions.find((p) => p.isKey)!;
  if (difficultyIndex !== key.rate) bad();
  const lowerN = integer(g.lowerN),
    upperN = integer(g.upperN);
  if (lowerN > correlationN || upperN > correlationN) bad();
  const insufficient_data = flag(r.insufficient_data),
    pointBiserial = nullableNumber(r.pointBiserial, -1, 1),
    discriminationIndex = nullableNumber(r.discriminationIndex, -1, 1);
  if (
    (!insufficient_data &&
      (n < minimumN || correlationN < minimumN || pointBiserial === null)) ||
    ((n < minimumN || correlationN < minimumN) &&
      (pointBiserial !== null || discriminationIndex !== null))
  )
    bad();
  const flags = strings(r.flags),
    weakItem = flag(r.weakItem);
  if (weakItem !== !!flags.length) bad();
  return {
    questionId: evaluationId(r.questionId),
    n,
    correlationN,
    minimumN,
    insufficient_data,
    difficultyIndex,
    discriminationIndex,
    pointBiserial,
    groups: {
      fraction: number(g.fraction, 0, 1),
      lowerN,
      upperN,
      tiesIncluded: flag(g.tiesIncluded),
    },
    answerPositionDistribution: positions,
    flags,
    reasons: strings(r.reasons),
    weakItem,
    versionNumber: integer(r.versionNumber, 1),
    predecessorId:
      r.predecessorId === null ? null : evaluationId(r.predecessorId),
    cohortQuestionIds: unique(
      strings(r.cohortQuestionIds).map(evaluationId),
      (x) => x,
    ),
    methodVersion: nonempty(r.methodVersion),
    note: nonempty(r.note),
  };
}
export function metric(value: number | null, percent = false) {
  return value === null
    ? "Not available"
    : percent
      ? `${(value * 100).toFixed(1)}%`
      : value.toFixed(3);
}
