import apiClient from "@/lib/api-client";
import { getToken } from "@/lib/auth";
import {
  adminGuard,
  loadAdminAccount,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import {
  EvaluationFailure,
  loadEvaluation,
  type EvaluationLibrary,
} from "./evaluation-client";
import { evaluationId, type EvalRun } from "./evaluation-data";
import {
  executionAction,
  executionReference,
  paidExecution,
  parseExecutionAck,
  acknowledgementRun,
  checkExecutionReadback,
  EXECUTION_LABELS,
  type ExecutionAction,
  type ExecutionDraft,
  type ExecutionOutcome,
} from "./execution-data";
const denied = (e: unknown) =>
  e instanceof EvaluationFailure || e instanceof AdminDashboardFailure
    ? e.unavailable
    : [401, 403].includes(
        (e as { response?: { status?: number } })?.response?.status ?? 0,
      );
export class ExecutionFailure extends EvaluationFailure {
  constructor(
    message: string,
    public uncertain = false,
    public knownRunIds: string[] = [],
    unavailable = false,
  ) {
    super(message, unavailable);
  }
}
async function readRuns(
  ids: string[],
  l: EvaluationLibrary,
  session: string | null,
): Promise<EvalRun[]> {
  const guard = adminGuard(session),
    rows: EvalRun[] = [];
  for (let i = 0; i < ids.length; i += 4) {
    const results = await Promise.allSettled(
      ids.slice(i, i + 4).map(async (id) => {
        const raw = await apiClient.get(
          `/admin/eval/runs/${encodeURIComponent(id)}`,
          { timeout: 12000 },
        );
        guard();
        const r = acknowledgementRun(raw.data, l.user.id);
        if (r.id !== id) throw new Error("Wrong saved run");
        return r;
      }),
    );
    guard();
    for (const r of results) {
      if (r.status === "rejected") throw r.reason;
      rows.push(r.value);
    }
  }
  await loadAdminAccount(l.user, undefined, session);
  guard();
  return rows;
}
export async function executeEvaluation(
  l: EvaluationLibrary,
  action: ExecutionAction,
  session = getToken(),
): Promise<ExecutionOutcome> {
  let sent = false,
    knownRunIds: string[] = [];
  try {
    // Runtime validation also protects direct/controller callers; confirmation uses this exact action.
    const checked = executionAction({
      ...action,
      kind: action.kind,
      task: "task" in action ? action.task : "concept_draft",
      version: "version" in action ? action.version : "",
      systemTemplate: "systemTemplate" in action ? action.systemTemplate : "",
      changelog: "changelog" in action ? action.changelog : "",
      baselineVersion:
        "baselineVersion" in action ? action.baselineVersion : "",
      candidateVersion:
        "candidateVersion" in action ? action.candidateVersion : "",
      compilationId: "compilationId" in action ? action.compilationId : "",
      judge: action.kind === "compilation" ? action.judge : false,
    } as ExecutionDraft);
    if (
      JSON.stringify(Object.entries(checked).sort()) !==
      JSON.stringify(Object.entries(action).sort())
    )
      throw new Error("Review the normalized action again.");
    const guard = adminGuard(session),
      before = executionReference(l, action),
      fresh = await loadEvaluation(l.user, undefined, session);
    guard();
    if (executionReference(fresh, action) !== before)
      throw new Error(
        "References changed. Refresh and review this action again.",
      );
    let path: string, payload: unknown;
    switch (action.kind) {
      case "candidate":
        path = "/admin/eval/candidates";
        payload = {
          task: action.task,
          version: action.version,
          systemTemplate: action.systemTemplate,
          changelog: action.changelog,
        };
        break;
      case "shadow":
        path = "/admin/eval/shadow";
        payload = { task: action.task, version: action.version };
        break;
      case "comparison":
        path = "/admin/eval/comparisons";
        payload = {
          task: action.task,
          baselineVersion: action.baselineVersion,
          candidateVersion: action.candidateVersion,
        };
        break;
      case "regression":
        path = "/admin/eval/regression";
        payload = {};
        break;
      default:
        path = `/admin/eval/compilations/${encodeURIComponent(action.compilationId)}`;
        payload = { judge: action.judge };
    }
    guard();
    sent = true;
    const raw = await apiClient.post(path, payload, {
      timeout: paidExecution(action) ? 300000 : 12000,
    });
    guard();
    const parsed = parseExecutionAck(raw.data, action, fresh);
    knownRunIds = parsed.ids;
    const rows = await readRuns(parsed.ids, fresh, session);
    guard();
    checkExecutionReadback(parsed, rows, action, fresh);
    return {
      kind: action.kind,
      title: `${EXECUTION_LABELS[action.kind]} · response checked`,
      proof: rows.length ? "runs" : "ack",
      payload: parsed.payload,
      runs: rows,
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    throw new ExecutionFailure(
      sent
        ? "The write outcome couldn’t be fully confirmed. Partial runs, a draft or provider charges may already exist. Keep writes paused and check saved state; never automatically repeat this request."
        : "Current access, references or action fields couldn’t be checked. No execution request was sent; refresh and review the action again.",
      sent,
      knownRunIds,
      denied(e),
    );
  }
}
export interface ExecutionRecovery {
  library: EvaluationLibrary;
  runs: EvalRun[];
  checkedAt: string;
}
export async function recoverExecution(
  l: EvaluationLibrary,
  ids: string[],
  session = getToken(),
): Promise<ExecutionRecovery> {
  try {
    const guard = adminGuard(session);
    if (ids.length > 100 || new Set(ids).size !== ids.length) throw new Error();
    ids.forEach(evaluationId);
    const library = await loadEvaluation(l.user, undefined, session);
    guard();
    // Both reference resources must be checked before explicit resumption, even after an ACK-only write.
    if (!library.rubric || !library.goldens) throw new Error();
    const runs = await readRuns(ids, library, session);
    guard();
    return { library, runs, checkedAt: new Date().toISOString() };
  } catch (e) {
    throw new ExecutionFailure(
      "Saved state couldn’t be checked. Writes remain paused; retry this read-only check without repeating the earlier action.",
      false,
      ids,
      denied(e),
    );
  }
}
