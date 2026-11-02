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
import {
  acknowledgementRun,
  executionReference,
  executionFingerprint,
} from "./execution-data";
import { recoverExecution, type ExecutionRecovery } from "./execution-client";
import {
  approvalEvidence,
  releaseSourceFingerprint,
  releaseAction,
  releaseAck,
  type ApprovalEvidence,
  type ReleaseSource,
  type ReleaseAction,
  type ReleaseOutcome,
} from "./release-data";
const denied = (e: unknown) =>
  e instanceof EvaluationFailure || e instanceof AdminDashboardFailure
    ? e.unavailable
    : [401, 403].includes(
        (e as { response?: { status?: number } })?.response?.status ?? 0,
      );
export class ReleaseFailure extends EvaluationFailure {
  constructor(
    message: string,
    public uncertain = false,
    unavailable = false,
  ) {
    super(message, unavailable);
  }
}
export async function inspectApproval(
  source: ReleaseSource,
  session = getToken(),
): Promise<ApprovalEvidence> {
  try {
    const evidence = approvalEvidence(source),
      guard = adminGuard(session),
      fresh = await loadEvaluation(source.library.user, undefined, session);
    guard();
    if (
      executionReference(fresh, source.action) !==
      executionReference(source.library, source.action)
    )
      throw new Error();
    const rows = [];
    for (let i = 0; i < source.outcome.runs.length; i += 4) {
      const batch = await Promise.all(
        source.outcome.runs.slice(i, i + 4).map(async (r) => {
          const raw = await apiClient.get(
            `/admin/eval/runs/${encodeURIComponent(r.id)}`,
            { timeout: 12000 },
          );
          guard();
          const checked = acknowledgementRun(raw.data, fresh.user.id);
          if (checked.id !== r.id) throw new Error();
          return checked;
        }),
      );
      guard();
      rows.push(...batch);
    }
    if (
      executionFingerprint(rows) !==
      executionFingerprint(evidence.source.outcome.runs)
    )
      throw new Error();
    await loadAdminAccount(fresh.user, undefined, session);
    guard();
    const checked = approvalEvidence({
      ...source,
      outcome: { ...source.outcome, runs: rows },
    });
    if (
      releaseSourceFingerprint(checked.source) !==
      releaseSourceFingerprint(evidence.source)
    )
      throw new Error();
    return checked;
  } catch (e) {
    throw new ReleaseFailure(
      "Comparison evidence, current references or admin access couldn’t be checked. No release request was sent. Retained comparison metadata is response evidence; the API has no comparison lookup.",
      false,
      denied(e),
    );
  }
}
export async function submitRelease(
  library: EvaluationLibrary,
  input: ReleaseAction,
  session = getToken(),
): Promise<ReleaseOutcome> {
  let sent = false;
  try {
    const a = releaseAction(input),
      guard = adminGuard(session);
    await loadAdminAccount(library.user, undefined, session);
    guard();
    if (a.kind === "approve") {
      if (
        a.evidence.source.library.user.id !== library.user.id ||
        a.evidence.source.library.user.role !== library.user.role
      )
        throw new Error();
      const fresh = await inspectApproval(a.evidence.source, session);
      guard();
      if (
        releaseSourceFingerprint(fresh.source) !==
        releaseSourceFingerprint(a.evidence.source)
      )
        throw new Error();
    }
    const path =
      a.kind === "approve"
        ? `/admin/eval/comparisons/${encodeURIComponent(a.evidence.comparisonId)}/promote`
        : `/admin/eval/tasks/${encodeURIComponent(a.task)}/rollback`;
    guard();
    sent = true;
    const raw = await apiClient.post(path, {}, { timeout: 12000 });
    guard();
    const acknowledgement = releaseAck(raw.data, a, library.user.id);
    await loadAdminAccount(library.user, undefined, session);
    guard();
    return {
      kind: a.kind,
      task: a.kind === "approve" ? a.evidence.task : a.task,
      ...(a.kind === "approve"
        ? { id: (acknowledgement as { id: string }).id }
        : {}),
      acknowledgement,
      checkedAt: new Date().toISOString(),
      message:
        a.kind === "approve"
          ? "Matching release-approval response received. Prior approvals for this task were revoked by this operation. Serving depends on operator opt-in configuration and matching baseline, candidate and corpus fingerprints; active serving cannot be verified here."
          : "Task-wide revocation response received. The API reports baselineRestored; it does not expose a serving lookup or how many approvals were revoked. The baseline and operator configuration are unchanged.",
    };
  } catch (e) {
    throw new ReleaseFailure(
      sent
        ? "The release outcome couldn’t be fully confirmed. Approval or task-wide revocation may already have occurred. All evaluation writes are paused; check available records without repeating the release request."
        : "Current release scope, evidence or admin access couldn’t be checked. No release request was sent. Recheck the comparison or task before reviewing again.",
      sent,
      denied(e),
    );
  }
}
export interface ReleaseRecovery extends ExecutionRecovery {
  releaseState: string;
}
export async function recoverRelease(
  library: EvaluationLibrary,
  action: ReleaseAction,
  session = getToken(),
): Promise<ReleaseRecovery> {
  try {
    const checked = await recoverExecution(
      library,
      action.kind === "approve"
        ? action.evidence.source.outcome.runs.map((r) => r.id)
        : [],
      session,
    );
    return {
      ...checked,
      releaseState:
        "Current references and known run records were checked only. There is no comparison, release or serving-status GET. Whether the earlier approval/revocation completed and which prompt is serving remain unknown; an earlier request may still finish.",
    };
  } catch (e) {
    throw new ReleaseFailure(
      "Available saved records couldn’t be checked. All writes remain paused; retry this read-only check without repeating the release operation.",
      false,
      denied(e),
    );
  }
}
