import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import {
  adminGuard,
  loadAdminAccount,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import { editorObject } from "@/components/content/editor-data";
import {
  generationUuid,
  parseGenerationFeed,
  parseGenerationJob,
  type GenerationJob,
} from "@/components/generation/generation-data";

export class AdminJobsFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
const options = { timeout: 12000 };
const denied = (error: unknown) =>
  error instanceof AdminDashboardFailure || error instanceof AdminJobsFailure
    ? error.unavailable
    : [401, 403].includes(
        (error as { response?: { status?: number } })?.response?.status ?? 0,
      );
function failure(error: unknown, message: string, uncertain = false) {
  return new AdminJobsFailure(message, uncertain, denied(error));
}
function jobsGuard(session: string | null) {
  try {
    const check = adminGuard(session);
    return () => {
      try {
        check();
      } catch (error) {
        throw failure(error, "Your session changed. Cached jobs are hidden.");
      }
    };
  } catch (error) {
    throw failure(error, "Your session changed. Cached jobs are hidden.");
  }
}
export async function loadAdminJobs(
  expected?: User,
  signal?: AbortSignal,
  session = getToken(),
) {
  const guard = jobsGuard(session);
  try {
    const user = await loadAdminAccount(expected, signal, session);
    const active = await apiClient.get("/ai-generate/jobs/active", {
      ...options,
      signal,
    });
    guard();
    const results = await apiClient.get("/ai-generate/jobs/results", {
      ...options,
      signal,
    });
    guard();
    const feed = parseGenerationFeed(user, active.data, results.data);
    await loadAdminAccount(user, signal, session);
    guard();
    return feed;
  } catch (error) {
    throw failure(
      error,
      "Your jobs couldn’t be checked. Their previous values are hidden.",
    );
  }
}
export async function inspectAdminJob(
  user: User,
  id: string,
  session = getToken(),
): Promise<GenerationJob> {
  try {
    generationUuid(id);
  } catch {
    throw new AdminJobsFailure("Enter a complete job UUID.");
  }
  const guard = jobsGuard(session);
  try {
    await loadAdminAccount(user, undefined, session);
    const response = await apiClient.get(`/ai-generate/jobs/${id}`, options);
    guard();
    // Admin lookup permits any requester. Feed and acknowledgement remain owner scoped.
    const owner = generationUuid(editorObject(response.data).requestedByUserId);
    const job = parseGenerationJob(response.data, { ...user, id: owner });
    if (job.id.toLowerCase() !== id.toLowerCase()) throw new Error();
    await loadAdminAccount(user, undefined, session);
    guard();
    return job;
  } catch (error) {
    throw failure(
      error,
      "This job couldn’t be checked. It may be missing or inaccessible; previous details are hidden.",
    );
  }
}
export async function acknowledgeAdminJob(
  user: User,
  before: GenerationJob,
  session = getToken(),
) {
  if (
    before.requestedByUserId !== user.id ||
    !["completed", "failed"].includes(before.status) ||
    before.acknowledgedAt ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      before.id,
    )
  )
    throw new AdminJobsFailure(
      "Only your own unread finished result with a version 4 UUID can be marked reviewed.",
    );
  const guard = jobsGuard(session);
  const fresh = await inspectAdminJob(user, before.id, session);
  if (JSON.stringify(fresh) !== JSON.stringify(before))
    throw new AdminJobsFailure(
      "This job changed. Check and read its current result before marking reviewed.",
    );
  guard();
  try {
    const response = await apiClient.post(
      "/ai-generate/jobs/acknowledge",
      { jobIds: [before.id] },
      options,
    );
    guard();
    const count = editorObject(response.data).acknowledged;
    if (count !== 0 && count !== 1) throw new Error();
    const saved = await inspectAdminJob(user, before.id, session);
    const stable = (job: GenerationJob) => ({
      ...job,
      acknowledgedAt: null,
      updatedAt: null,
    });
    const stamp = saved.acknowledgedAt,
      after = stable(saved),
      previous = stable(before);
    if (!stamp || JSON.stringify(after) !== JSON.stringify(previous))
      throw new Error();
    const feed = await loadAdminJobs(user, undefined, session);
    if (feed.results.some((job) => job.id === before.id)) throw new Error();
    return { job: saved, feed };
  } catch (error) {
    throw failure(
      error,
      "Acknowledgement isn’t confirmed. Pause further acknowledgements and check saved state; the earlier request may still finish.",
      true,
    );
  }
}
