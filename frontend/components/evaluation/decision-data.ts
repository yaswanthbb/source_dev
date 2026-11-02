import {
  DIMENSIONS,
  evaluationId,
  object,
  parseRun,
  parseRubric,
  parseMetrics,
  type EvalRun,
  type Rubric,
  type QuestionMetrics,
} from "./evaluation-data";
import { executionFingerprint } from "./execution-data";
export const REASON_CODES = [
  "accuracy",
  "clarity",
  "pedagogy",
  "difficulty",
  "evidence",
  "other",
] as const;
export const BLOOM_LEVELS = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const fail = (): never => {
  throw new Error("Decision data is incomplete or inconsistent.");
};
const text = (v: unknown): string => (typeof v === "string" ? v : fail());
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : fail());
const flag = (v: unknown): boolean => (typeof v === "boolean" ? v : fail());
const integer = (v: unknown, min = 0): number =>
  Number.isSafeInteger(v) && Number(v) >= min ? Number(v) : fail();
const date = (v: unknown): string =>
  typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : fail();
export interface ReviewPayload {
  decision: "approve" | "edit" | "reject";
  scores: Record<(typeof DIMENSIONS)[number], number>;
  reasonCodes: string[];
  reason: string;
  proposedRevision?: string;
}
export interface ReplacementOption {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  misconception?: string;
  distractorRationale?: string;
}
export interface ReplacementPayload {
  questionText: string;
  orderIndex: number;
  options: ReplacementOption[];
  reason: string;
  bloomLevel?: string;
  intendedDifficulty?: string;
  correctRationale?: string;
}
export interface CurrentQuestion {
  id: string;
  conceptId: string;
  questionText: string;
  orderIndex: number;
  updatedAt: string;
  options: (ReplacementOption & { id: string })[];
}
export interface DecisionConcept {
  id: string;
  title: string;
  reviewStatus: string;
  updatedAt: string;
  placements: { id: string; roadmapTitle: string; moduleTitle: string }[];
}
export type DecisionRecord =
  | { kind: "review"; run: EvalRun; rubric: Rubric }
  | {
      kind: "replacement";
      question: CurrentQuestion;
      concept: DecisionConcept;
      metrics: QuestionMetrics;
    };
export type DecisionAction =
  | {
      kind: "review";
      payload: ReviewPayload;
      record: Extract<DecisionRecord, { kind: "review" }>;
    }
  | {
      kind: "replacement";
      payload: ReplacementPayload;
      record: Extract<DecisionRecord, { kind: "replacement" }>;
    };
export interface DecisionOutcome {
  kind: DecisionAction["kind"];
  id: string;
  message: string;
  acknowledgement: unknown;
  checkedAt: string;
}
export function parseDecisionConcept(
  raw: unknown,
  id: string,
): DecisionConcept {
  const r = object(raw);
  if (
    r.id !== id ||
    !["pending", "approved", "rejected"].includes(text(r.reviewStatus))
  )
    fail();
  if (!Array.isArray(r.appearsIn)) fail();
  return {
    id,
    title: text(r.title),
    reviewStatus: text(r.reviewStatus),
    updatedAt: date(r.updatedAt),
    placements: array(r.appearsIn).map((v) => {
      const p = object(v);
      return {
        id: evaluationId(p.moduleConceptId),
        roadmapTitle: text(p.roadmapTitle),
        moduleTitle: text(p.moduleTitle),
      };
    }),
  };
}
export function parseCurrentQuestions(
  raw: unknown,
  conceptId: string,
): CurrentQuestion[] {
  if (!Array.isArray(raw)) fail();
  const rows = array(raw).map((v) => {
    const r = object(v),
      id = evaluationId(r.id);
    if (
      r.conceptId !== conceptId ||
      !Array.isArray(r.options) ||
      r.options.length < 2 ||
      r.options.length > 12
    )
      fail();
    const options = array(r.options)
      .map((v) => {
        const o = object(v);
        if (o.questionId !== id || typeof o.isCorrect !== "boolean") fail();
        return {
          id: evaluationId(o.id),
          optionText: text(o.optionText),
          isCorrect: flag(o.isCorrect),
          orderIndex: integer(o.orderIndex),
          ...(o.misconception == null
            ? {}
            : { misconception: text(o.misconception) }),
          ...(o.distractorRationale == null
            ? {}
            : { distractorRationale: text(o.distractorRationale) }),
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    if (
      new Set(options.map((o) => o.id)).size !== options.length ||
      options.filter((o) => o.isCorrect).length !== 1
    )
      fail();
    return {
      id,
      conceptId,
      questionText: text(r.questionText),
      orderIndex: integer(r.orderIndex),
      updatedAt: date(r.updatedAt),
      options,
    };
  });
  if (new Set(rows.map((r) => r.id)).size !== rows.length) fail();
  return rows;
}
export function checkQuestionMetrics(q: CurrentQuestion, m: QuestionMetrics) {
  if (
    q.id !== m.questionId ||
    q.options.length !== m.answerPositionDistribution.length
  )
    fail();
  q.options.forEach((o, i) => {
    const p = m.answerPositionDistribution[i];
    if (p.optionId !== o.id || p.isKey !== o.isCorrect || p.position !== i + 1)
      fail();
  });
}
export function decisionFingerprint(record: DecisionRecord): string {
  return executionFingerprint(
    record.kind === "review"
      ? record
      : {
          ...record,
          concept: {
            ...record.concept,
            placements: [...record.concept.placements].sort((a, b) =>
              a.id.localeCompare(b.id),
            ),
          },
        },
  );
}
export function reviewPayload(raw: unknown): ReviewPayload {
  const r = object(raw),
    s = object(r.scores);
  if (
    !["approve", "edit", "reject"].includes(text(r.decision)) ||
    Object.keys(s).length !== 4 ||
    DIMENSIONS.some(
      (d) => !Number.isInteger(s[d]) || Number(s[d]) < 1 || Number(s[d]) > 5,
    )
  )
    fail();
  if (
    !Array.isArray(r.reasonCodes) ||
    new Set(r.reasonCodes).size !== r.reasonCodes.length ||
    r.reasonCodes.some(
      (c) => !(REASON_CODES as readonly unknown[]).includes(c),
    ) ||
    (r.decision !== "approve" && !r.reasonCodes.length)
  )
    fail();
  const reason = text(r.reason);
  if (!reason.trim() || reason.length > 2000) fail();
  const proposedRevision =
    r.proposedRevision === undefined ? undefined : text(r.proposedRevision);
  if (
    (r.decision === "edit" && !proposedRevision?.trim()) ||
    (proposedRevision?.length ?? 0) > 60000
  )
    fail();
  return {
    decision: r.decision as ReviewPayload["decision"],
    scores: Object.fromEntries(
      DIMENSIONS.map((d) => [d, s[d]]),
    ) as ReviewPayload["scores"],
    reasonCodes: r.reasonCodes as string[],
    reason,
    ...(proposedRevision === undefined ? {} : { proposedRevision }),
  };
}
export function replacementPayload(raw: unknown): ReplacementPayload {
  const r = object(raw),
    questionText = text(r.questionText),
    reason = text(r.reason);
  if (
    !questionText.trim() ||
    questionText.length > 60000 ||
    !reason.trim() ||
    reason.length > 1000 ||
    !Array.isArray(r.options) ||
    r.options.length < 2 ||
    r.options.length > 12
  )
    fail();
  const options = array(r.options).map((v, i) => {
    const o = object(v);
    if (typeof o.isCorrect !== "boolean" || o.orderIndex !== i) fail();
    const optionText = text(o.optionText);
    if (!optionText.trim() || optionText.length > 60000) fail();
    const meta: Record<string, string> = {};
    for (const k of ["misconception", "distractorRationale"]) {
      if (o[k] !== undefined) {
        const value = text(o[k]);
        if (value.length > 60000 || o.isCorrect) fail();
        if (value) meta[k] = value;
      }
    }
    return { optionText, isCorrect: flag(o.isCorrect), orderIndex: i, ...meta };
  });
  if (options.filter((o) => o.isCorrect).length !== 1) fail();
  const optional: Record<string, string> = {};
  for (const k of ["bloomLevel", "intendedDifficulty", "correctRationale"]) {
    if (r[k] !== undefined) {
      const v = text(r[k]);
      if (
        v.length > 60000 ||
        (k === "bloomLevel" &&
          !(BLOOM_LEVELS as readonly string[]).includes(v)) ||
        (k === "intendedDifficulty" &&
          !(DIFFICULTIES as readonly string[]).includes(v))
      )
        fail();
      if (v) optional[k] = v;
    }
  }
  return {
    questionText,
    reason,
    orderIndex: integer(r.orderIndex),
    options,
    ...optional,
  };
}
export function checkedDecisionAction(action: DecisionAction): DecisionAction {
  if (action.kind === "review") {
    const run = parseRun(action.record.run, action.record.run.id),
      rubric = parseRubric(action.record.rubric);
    if (action.record.kind !== "review" || run.rubricVersion !== rubric.version)
      fail();
    return {
      kind: "review",
      record: { kind: "review", run, rubric },
      payload: reviewPayload(action.payload),
    };
  }
  if (action.kind !== "replacement" || action.record.kind !== "replacement")
    fail();
  const a = action.record,
    payload = replacementPayload(action.payload);
  evaluationId(a.question.id);
  evaluationId(a.concept.id);
  checkQuestionMetrics(
    a.question,
    parseMetrics(
      {
        ...a.metrics,
        correctPositions: a.metrics.answerPositionDistribution
          .filter((p) => p.isKey)
          .map((p) => p.position),
      },
      a.question.id,
    ),
  );
  if (
    a.question.conceptId !== a.concept.id ||
    payload.orderIndex !== a.question.orderIndex
  )
    fail();
  return { kind: "replacement", record: a, payload };
}
export function checkReviewAck(
  raw: unknown,
  a: Extract<DecisionAction, { kind: "review" }>,
  actor: string,
) {
  const r = object(raw),
    id = evaluationId(r.id);
  date(r.createdAt);
  date(r.updatedAt);
  const payload = reviewPayload({
    ...r,
    proposedRevision:
      r.proposedRevision === null ? undefined : r.proposedRevision,
  });
  if (
    r.evalRunId !== a.record.run.id ||
    r.expertId !== actor ||
    r.rubricVersion !== a.record.rubric.version ||
    executionFingerprint(payload) !== executionFingerprint(a.payload)
  )
    fail();
  return {
    id,
    evalRunId: r.evalRunId,
    rubricVersion: r.rubricVersion,
    createdAt: r.createdAt,
    ...payload,
  };
}
export function checkReplacementAck(
  raw: unknown,
  a: Extract<DecisionAction, { kind: "replacement" }>,
  actor: string,
) {
  const r = object(raw),
    id = evaluationId(r.id),
    prev = a.record.question;
  if (
    r.createdById !== actor ||
    id === prev.id ||
    r.conceptId !== prev.conceptId ||
    r.predecessorId !== prev.id ||
    r.versionNumber !== a.record.metrics.versionNumber + 1 ||
    r.retiredAt !== null ||
    r.lintResult !== null ||
    r.verificationResult !== null
  )
    fail();
  const provenance = object(r.generationProvenance);
  if (
    provenance.kind !== "expert_replacement" ||
    provenance.predecessorId !== prev.id ||
    provenance.reason !== a.payload.reason
  )
    fail();
  const q = parseCurrentQuestions([r], prev.conceptId)[0];
  const { reason: omitted, ...expected } = a.payload;
  void omitted;
  const actual = {
    questionText: q.questionText,
    orderIndex: q.orderIndex,
    options: q.options.map(({ id: omitted, ...o }) => {
      void omitted;
      return o;
    }),
    ...(r.bloomLevel == null ? {} : { bloomLevel: r.bloomLevel }),
    ...(r.intendedDifficulty == null
      ? {}
      : { intendedDifficulty: r.intendedDifficulty }),
    ...(r.correctRationale == null
      ? {}
      : { correctRationale: r.correctRationale }),
  };
  if (executionFingerprint(actual) !== executionFingerprint(expected)) fail();
  return q;
}
