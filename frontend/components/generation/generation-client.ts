import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import {
  parseContentUser,
  parseContentLibrary,
  type ContentLibrary,
} from "@/components/content/content-data";
import {
  ContentFailure,
  contentUnavailable,
} from "@/components/content/content-client";
import { loadRoadmapEditor } from "@/components/content/editor-client";
import {
  editorObject,
  type EditorData,
} from "@/components/content/editor-data";
import {
  GENERATION_TYPES,
  generationUuid,
  parseGenerationSettings,
  parseGenerationFeed,
  parseGenerationJob,
  parseGenerationModels,
  generationSettingsFingerprint,
  generationStartIssue,
  editorFingerprint,
  type GenerationSettings,
  type GenerationFeed,
  type GenerationIntent,
  type GenerationModels,
  type GenerationJob,
} from "./generation-data";

const timeout = 12000;
export class GenerationFailure extends ContentFailure {
  constructor(
    message: string,
    uncertain = false,
    unavailable = false,
    public jobId?: string,
  ) {
    super(message, uncertain, unavailable);
  }
}
async function account(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
) {
  const response = await apiClient.get("/users/me", { signal, timeout });
  try {
    const user = parseContentUser(response.data);
    if (expected && (user.id !== expected.id || user.role !== expected.role))
      throw new Error();
    return user;
  } catch {
    throw new GenerationFailure(
      "Your account or generation access changed. Cached private data is hidden.",
      false,
      true,
    );
  }
}
export async function loadGenerationLibrary(
  signal?: AbortSignal,
  expected?: User,
): Promise<ContentLibrary> {
  const user = await account(expected, signal),
    response = await apiClient.get("/roadmaps", { signal, timeout });
  try {
    return parseContentLibrary(user, response.data);
  } catch {
    throw new GenerationFailure(
      "Owned roadmap data couldn't be confirmed. Cached private data is hidden.",
      false,
      true,
    );
  }
}
export async function loadGenerationSettings(
  expected: User,
  signal?: AbortSignal,
) {
  const user = await account(expected, signal),
    options = { signal, timeout };
  const [keys, providers, quota] = await Promise.all([
    apiClient.get("/ai-keys", options),
    apiClient.get("/ai-providers", options),
    apiClient.get("/ai-generate/quota", options),
  ]);
  try {
    return parseGenerationSettings(user, keys.data, providers.data, quota.data);
  } catch {
    throw new GenerationFailure(
      "Default key, provider and quota couldn't be confirmed. Recheck before generating.",
      false,
      true,
    );
  }
}
export async function loadGenerationFeed(expected: User, signal?: AbortSignal) {
  const user = await account(expected, signal),
    options = { signal, timeout };
  const active = await apiClient.get("/ai-generate/jobs/active", options),
    results = await apiClient.get("/ai-generate/jobs/results", options);
  try {
    return parseGenerationFeed(user, active.data, results.data);
  } catch {
    throw new GenerationFailure(
      "Owned job records couldn't be confirmed. Cached private data is hidden.",
      false,
      true,
    );
  }
}
export async function loadGenerationJob(
  expected: User,
  id: string,
  signal?: AbortSignal,
) {
  try {
    generationUuid(id);
  } catch {
    throw new GenerationFailure("Enter a complete job UUID.");
  }
  const user = await account(expected, signal),
    response = await apiClient.get(`/ai-generate/jobs/${id}`, {
      signal,
      timeout,
    });
  try {
    const job = parseGenerationJob(response.data, user);
    if (job.id.toLowerCase() !== id.toLowerCase())
      throw new Error("Job identity changed.");
    return job;
  } catch {
    throw new GenerationFailure(
      "Job ownership or details couldn't be confirmed. Cached job data is hidden.",
      false,
      true,
    );
  }
}
export async function loadGenerationModels(before: GenerationSettings) {
  const fresh = await loadGenerationSettings(before.user);
  if (
    generationSettingsFingerprint(fresh) !==
    generationSettingsFingerprint(before)
  )
    throw new GenerationFailure(
      "Your default key or provider settings changed. Recheck before loading models.",
    );
  const key = fresh.keys.find((k) => k.isDefault),
    path = `/ai-providers/${fresh.quota.provider}/models${key ? `?keyId=${encodeURIComponent(key.id)}` : ""}`;
  const response = await apiClient.get(path, { timeout });
  try {
    return parseGenerationModels(response.data, fresh);
  } catch {
    throw new GenerationFailure(
      "The model catalog couldn't be confirmed. Choose Automatic or reload the catalog.",
    );
  }
}
export async function startGeneration(
  before: EditorData,
  settings: GenerationSettings,
  intent: GenerationIntent,
  catalog?: GenerationModels,
) {
  try {
    generationUuid(intent.roadmapId);
    generationUuid(intent.targetId);
  } catch {
    throw new GenerationFailure("Choose a valid owned roadmap or module.");
  }
  let fresh: EditorData,
    freshSettings: GenerationSettings,
    feed: GenerationFeed;
  try {
    fresh = await loadRoadmapEditor(intent.roadmapId, undefined, before.user);
    freshSettings = await loadGenerationSettings(before.user);
    feed = await loadGenerationFeed(before.user);
  } catch (error) {
    throw new GenerationFailure(
      "Current access, target, provider and jobs couldn't be checked. Recheck before starting a job.",
      false,
      contentUnavailable(error),
    );
  }
  if (
    editorFingerprint(fresh) !== editorFingerprint(before) ||
    generationSettingsFingerprint(freshSettings) !==
      generationSettingsFingerprint(settings)
  )
    throw new GenerationFailure(
      "The target or default key changed. Recheck and review a new confirmation before generating.",
    );
  const issue = generationStartIssue(
    fresh,
    freshSettings,
    feed,
    intent,
    catalog,
  );
  if (issue) throw new GenerationFailure(issue);
  const body = {
    ...(intent.kind === "roadmap_modules"
      ? { roadmapId: intent.targetId }
      : { moduleId: intent.targetId }),
    provider: freshSettings.quota.provider,
    ...(intent.model ? { model: intent.model } : {}),
  };
  let ack: unknown;
  try {
    ack = (
      await apiClient.post(
        `/ai-generate/${GENERATION_TYPES[intent.kind].endpoint}`,
        body,
        { timeout },
      )
    ).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    // Pre-check refusals precede worker creation. Transport/server failures can
    // lose the acceptance response after detached work has already begun.
    const uncertain = !status || status === 408 || status >= 500;
    throw new GenerationFailure(
      uncertain
        ? "The job may have started and consumed quota or provider charges. Check activity/results before another request; an earlier request may still finish."
        : "The server refused this job. Recheck target, quota and default key before another confirmed request.",
      uncertain,
      contentUnavailable(error),
    );
  }
  let jobId: string;
  try {
    jobId = generationUuid(editorObject(ack).jobId);
  } catch {
    throw new GenerationFailure(
      "The acceptance response was incomplete. A job may already be running or charging. Check activity/results before another request.",
      true,
    );
  }
  let job: GenerationJob;
  try {
    job = await loadGenerationJob(fresh.user, jobId);
  } catch (error) {
    throw new GenerationFailure(
      "The server returned a job ID, but its saved record couldn't be checked. Inspect this ID before another request.",
      true,
      contentUnavailable(error),
      jobId,
    );
  }
  const key = freshSettings.keys.find((k) => k.isDefault);
  if (
    job.jobType !== intent.kind ||
    job.targetId !== intent.targetId ||
    job.provider !== freshSettings.quota.provider ||
    job.providerKeyId !== (key?.id ?? null) ||
    !job.model ||
    (intent.model && job.model !== intent.model)
  )
    throw new GenerationFailure(
      "The saved job doesn't match the approved target or provider choice. Inspect its ID before making another request.",
      true,
      false,
      jobId,
    );
  return job;
}
export async function markGenerationReviewed(
  expected: User,
  before: GenerationJob,
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      before.id,
    )
  )
    throw new GenerationFailure(
      "The acknowledgement API requires a version 4 job UUID.",
    );
  const fresh = await loadGenerationJob(expected, before.id);
  if (!["completed", "failed"].includes(fresh.status))
    throw new GenerationFailure("Only a finished job can be marked reviewed.");
  if (fresh.acknowledgedAt) return fresh;
  if (JSON.stringify(fresh) !== JSON.stringify(before))
    throw new GenerationFailure(
      "This result changed. Check and read it before marking reviewed.",
    );
  let ack: unknown;
  try {
    ack = (
      await apiClient.post(
        "/ai-generate/jobs/acknowledge",
        { jobIds: [fresh.id] },
        { timeout },
      )
    ).data;
  } catch (error) {
    throw new GenerationFailure(
      "Review acknowledgement isn't confirmed. Check the job before trying again.",
      true,
      contentUnavailable(error),
      fresh.id,
    );
  }
  try {
    const count = editorObject(ack).acknowledged;
    if (count !== 0 && count !== 1) throw new Error();
  } catch {
    throw new GenerationFailure(
      "The review response was incomplete. Recheck the job before trying again.",
      true,
      false,
      fresh.id,
    );
  }
  let after: GenerationJob;
  try {
    after = await loadGenerationJob(expected, fresh.id);
  } catch (error) {
    throw new GenerationFailure(
      "Saved review state couldn't be checked. Recheck the job.",
      true,
      contentUnavailable(error),
      fresh.id,
    );
  }
  if (!after.acknowledgedAt || !["completed", "failed"].includes(after.status))
    throw new GenerationFailure(
      "The job isn't yet confirmed as reviewed. Check it before another acknowledgement.",
      true,
      false,
      fresh.id,
    );
  return after;
}
