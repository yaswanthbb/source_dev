import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import {
  adminGuard,
  loadAdminAccount,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import {
  evaluationId,
  parseRubric,
  parseGoldens,
  parseRun,
  parseMetrics,
  type Rubric,
  type Golden,
} from "./evaluation-data";
export class EvaluationFailure extends Error {
  constructor(
    message: string,
    public unavailable = false,
  ) {
    super(message);
  }
}
export interface EvaluationLibrary {
  user: User;
  rubric?: Rubric;
  goldens?: Golden[];
  rubricError?: string;
  goldensError?: string;
  checkedAt: string;
}
const denied = (e: unknown) =>
  e instanceof AdminDashboardFailure
    ? e.unavailable
    : [401, 403].includes(
        (e as { response?: { status?: number } })?.response?.status ?? 0,
      );
export async function loadEvaluation(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
  session = getToken(),
): Promise<EvaluationLibrary> {
  try {
    const guard = adminGuard(session),
      user = await loadAdminAccount(expected, signal, session);
    const results = await Promise.allSettled([
      apiClient
        .get("/admin/eval/rubric", { timeout: 12000, signal })
        .then((r) => parseRubric(r.data)),
      apiClient
        .get("/admin/eval/goldens", { timeout: 12000, signal })
        .then((r) => parseGoldens(r.data)),
    ]);
    guard();
    if (results.some((r) => r.status === "rejected" && denied(r.reason)))
      throw new EvaluationFailure(
        "Your evaluation access changed. Cached data is hidden.",
        true,
      );
    await loadAdminAccount(user, signal, session);
    guard();
    const [rubric, goldens] = results;
    return {
      user,
      checkedAt: new Date().toISOString(),
      rubric: rubric.status === "fulfilled" ? rubric.value : undefined,
      goldens: goldens.status === "fulfilled" ? goldens.value : undefined,
      rubricError:
        rubric.status === "rejected"
          ? "The rubric couldn’t be checked. Refresh to try again."
          : undefined,
      goldensError:
        goldens.status === "rejected"
          ? "Golden cases couldn’t be checked. Refresh to try again."
          : undefined,
    };
  } catch (e) {
    if (e instanceof EvaluationFailure) throw e;
    throw new EvaluationFailure(
      "Your admin access and evaluation reference data couldn’t be checked. Refresh to try again.",
      denied(e),
    );
  }
}
export async function inspectEvaluation<K extends "run" | "question">(
  kind: K,
  value: string,
  user: Pick<User, "id" | "role">,
  session = getToken(),
  signal?: AbortSignal,
) {
  let id: string;
  try {
    id = evaluationId(value);
  } catch {
    throw new EvaluationFailure(
      "Enter a complete UUID before checking this record.",
    );
  }
  try {
    const guard = adminGuard(session);
    await loadAdminAccount(user, signal, session);
    guard();
    const path =
      kind === "run"
        ? `/admin/eval/runs/${encodeURIComponent(id)}`
        : `/eval/questions/${encodeURIComponent(id)}/psychometrics`;
    const raw = await apiClient.get(path, { timeout: 12000, signal });
    guard();
    const record =
      kind === "run"
        ? { kind: "run" as const, value: parseRun(raw.data, id) }
        : { kind: "question" as const, value: parseMetrics(raw.data, id) };
    await loadAdminAccount(user, signal, session);
    guard();
    return { ...record, checkedAt: new Date().toISOString() };
  } catch (e) {
    throw new EvaluationFailure(
      "This record is unavailable or couldn’t be fully checked. Confirm its ID and retry; previous details are hidden.",
      denied(e),
    );
  }
}
export type EvaluationInspection = Awaited<
  ReturnType<typeof inspectEvaluation>
>;
