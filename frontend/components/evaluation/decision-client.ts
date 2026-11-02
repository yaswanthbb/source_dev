import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import {
  adminGuard,
  loadAdminAccount,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import { EvaluationFailure, loadEvaluation } from "./evaluation-client";
import { evaluationId, parseRun, parseMetrics } from "./evaluation-data";
import { executionFingerprint } from "./execution-data";
import type { ExecutionRecovery } from "./execution-client";
import {
  parseCurrentQuestions,
  parseDecisionConcept,
  checkQuestionMetrics,
  decisionFingerprint,
  checkedDecisionAction,
  checkReviewAck,
  checkReplacementAck,
  type DecisionRecord,
  type DecisionAction,
  type DecisionOutcome,
} from "./decision-data";
const denied = (e: unknown) =>
  e instanceof EvaluationFailure || e instanceof AdminDashboardFailure
    ? e.unavailable
    : [401, 403].includes(
        (e as { response?: { status?: number } })?.response?.status ?? 0,
      );
export class DecisionFailure extends EvaluationFailure {
  constructor(
    message: string,
    public uncertain = false,
    public successorId?: string,
    unavailable = false,
  ) {
    super(message, unavailable);
  }
}
async function questionState(conceptId: string, session: string | null) {
  const guard = adminGuard(session);
  const [c, q] = await Promise.all([
    apiClient.get(`/concepts/${encodeURIComponent(conceptId)}`, {
      timeout: 12000,
    }),
    apiClient.get(`/concepts/${encodeURIComponent(conceptId)}/questions`, {
      timeout: 12000,
    }),
  ]);
  guard();
  return {
    concept: parseDecisionConcept(c.data, conceptId),
    questions: parseCurrentQuestions(q.data, conceptId),
  };
}
export async function inspectDecision(
  kind: DecisionRecord["kind"],
  idValue: string,
  conceptValue: string,
  user: Pick<User, "id" | "role">,
  session = getToken(),
): Promise<DecisionRecord> {
  try {
    const id = evaluationId(idValue),
      conceptId = kind === "replacement" ? evaluationId(conceptValue) : "",
      guard = adminGuard(session);
    await loadAdminAccount(user, undefined, session);
    guard();
    let record: DecisionRecord;
    if (kind === "review") {
      const l = await loadEvaluation(user, undefined, session);
      const r = await apiClient.get(
        `/admin/eval/runs/${encodeURIComponent(id)}`,
        { timeout: 12000 },
      );
      guard();
      if (!l.rubric) throw new Error();
      const run = parseRun(r.data, id);
      if (run.rubricVersion !== l.rubric.version) throw new Error();
      record = { kind, run, rubric: l.rubric };
    } else {
      const s = await questionState(conceptId, session),
        q = s.questions.find((q) => q.id === id);
      if (!q) throw new Error();
      const raw = await apiClient.get(
        `/eval/questions/${encodeURIComponent(id)}/psychometrics`,
        { timeout: 12000 },
      );
      guard();
      const metrics = parseMetrics(raw.data, id);
      checkQuestionMetrics(q, metrics);
      record = { kind, question: q, concept: s.concept, metrics };
    }
    await loadAdminAccount(user, undefined, session);
    guard();
    return record;
  } catch (e) {
    throw new DecisionFailure(
      "Current evidence couldn’t be checked. Confirm the complete IDs, current question and matching rubric, then retry. Earlier evidence is hidden; your local draft is retained.",
      false,
      undefined,
      denied(e),
    );
  }
}
export async function submitDecision(
  input: DecisionAction,
  user: Pick<User, "id" | "role">,
  session = getToken(),
): Promise<DecisionOutcome> {
  let sent = false,
    successorId: string | undefined;
  try {
    const a = checkedDecisionAction(input);
    if (executionFingerprint(a.payload) !== executionFingerprint(input.payload))
      throw new Error();
    const guard = adminGuard(session),
      fresh = await inspectDecision(
        a.kind,
        a.kind === "review" ? a.record.run.id : a.record.question.id,
        a.kind === "replacement" ? a.record.concept.id : "",
        user,
        session,
      );
    guard();
    if (decisionFingerprint(fresh) !== decisionFingerprint(a.record))
      throw new Error();
    const path =
      a.kind === "review"
        ? `/admin/eval/runs/${encodeURIComponent(a.record.run.id)}/expert-reviews`
        : `/eval/questions/${encodeURIComponent(a.record.question.id)}/replacements`;
    guard();
    sent = true;
    const raw = await apiClient.post(path, a.payload, { timeout: 12000 });
    guard();
    if (a.kind === "review") {
      const ack = checkReviewAck(raw.data, a, user.id);
      await loadAdminAccount(user, undefined, session);
      guard();
      return {
        kind: a.kind,
        id: ack.id,
        acknowledgement: ack,
        message:
          "Matching expert-review response received. No independent review lookup exists. Proposed text was recorded only; content and prompt releases were not changed by this action.",
        checkedAt: new Date().toISOString(),
      };
    }
    const ack = checkReplacementAck(raw.data, a, user.id);
    successorId = ack.id;
    const read = await inspectDecision(
      "replacement",
      ack.id,
      a.record.concept.id,
      user,
      session,
    );
    guard();
    if (
      read.kind !== "replacement" ||
      executionFingerprint(read.question) !== executionFingerprint(ack) ||
      read.metrics.predecessorId !== a.record.question.id ||
      read.metrics.versionNumber !== a.record.metrics.versionNumber + 1 ||
      read.concept.reviewStatus !== "pending"
    )
      throw new Error();
    const state = await questionState(a.record.concept.id, session);
    guard();
    if (
      state.questions.some((q) => q.id === a.record.question.id) ||
      state.concept.reviewStatus !== "pending"
    )
      throw new Error();
    await loadAdminAccount(user, undefined, session);
    guard();
    return {
      kind: a.kind,
      id: ack.id,
      acknowledgement: {
        question: read.question,
        versionNumber: read.metrics.versionNumber,
        predecessorId: read.metrics.predecessorId,
        conceptReviewStatus: read.concept.reviewStatus,
      },
      message:
        "The successor was read back, the original is absent from the current-question list, and the shared concept is pending review. These separate reads cannot guarantee an unchanged concurrent state.",
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    throw new DecisionFailure(
      sent
        ? "The decision outcome couldn’t be fully confirmed. A review or replacement may already exist. All evaluation writes are paused; check saved state without repeating this request."
        : "Current access, evidence or decision fields changed or couldn’t be checked. No decision request was sent. Recheck the evidence and review again.",
      sent,
      successorId,
      denied(e),
    );
  }
}
export interface DecisionRecovery extends ExecutionRecovery {
  decisionState: string;
}
export async function recoverDecision(
  record: DecisionRecord,
  user: User,
  successorId?: string,
  session = getToken(),
): Promise<DecisionRecovery> {
  try {
    const guard = adminGuard(session),
      library = await loadEvaluation(user, undefined, session);
    guard();
    if (!library.rubric || !library.goldens) throw new Error();
    let decisionState: string;
    if (record.kind === "review") {
      const raw = await apiClient.get(
        `/admin/eval/runs/${encodeURIComponent(record.run.id)}`,
        { timeout: 12000 },
      );
      guard();
      parseRun(raw.data, record.run.id);
      decisionState =
        "Original run checked. Expert-review records have no independent GET; whether the earlier review was saved remains unknown.";
    } else {
      const state = await questionState(record.concept.id, session);
      guard();
      const current = state.questions.some((q) => q.id === record.question.id);
      if (successorId) {
        if (current) throw new Error();
        const next = await inspectDecision(
          "replacement",
          successorId,
          record.concept.id,
          user,
          session,
        );
        if (
          next.kind !== "replacement" ||
          next.metrics.predecessorId !== record.question.id
        )
          throw new Error();
        decisionState = `Known successor ${successorId} is current; concept is ${next.concept.reviewStatus}.`;
      } else
        decisionState = current
          ? "The original is still listed as current. An earlier request may still finish; this does not prove the replacement failed."
          : "The original is no longer listed as current. No successor ID was confirmed; this check cannot identify which request changed it.";
    }
    await loadAdminAccount(user, undefined, session);
    guard();
    return {
      library,
      runs: [],
      decisionState,
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    throw new DecisionFailure(
      "Saved state couldn’t be checked. Writes remain paused. Retry this read-only check without repeating the decision.",
      false,
      successorId,
      denied(e),
    );
  }
}
