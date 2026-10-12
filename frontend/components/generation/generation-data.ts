import type { User } from "@/lib/auth";
import type {
  AiGenerationJob,
  AiGenerationJobType,
} from "@/providers/ai-jobs-provider";
import { contentId } from "@/components/content/content-data";
import {
  editorObject,
  editorText,
  editorCount,
  editorFingerprint,
  type EditorData,
} from "@/components/content/editor-data";

export const GENERATION_TYPES = {
  roadmap_modules: {
    label: "Roadmap modules",
    description: "Add ordered modules to an owned roadmap, up to six in total.",
    endpoint: "roadmap-modules",
  },
  module_concepts: {
    label: "Module lessons",
    description:
      "Generate and attach lesson titles and full bodies, up to six lessons in the module.",
    endpoint: "module-concepts",
  },
  module_mcqs: {
    label: "Module questions",
    description:
      "Add assessment questions to eligible lessons. Existing question sets are skipped.",
    endpoint: "module-mcqs",
  },
} as const;
export type GenerationKind = AiGenerationJobType;
export type GenerationProvider = "nvidia" | "gemini";
export interface GenerationRequest {
  roadmapId: string | null;
  moduleId: string | null;
  jobId: string | null;
  invalid: boolean;
}
export interface GenerationKey {
  id: string;
  provider: GenerationProvider;
  label: string | null;
  keyHint: string;
  isDefault: boolean;
  dailyLimit: number;
  defaultModel: string | null;
  updatedAt: string;
}
export interface GenerationSettings {
  user: User;
  providers: Array<{
    provider: GenerationProvider;
    displayName: string;
    byokOnly: boolean;
    defaultModel: string;
  }>;
  keys: GenerationKey[];
  quota: {
    remaining: number;
    limit: number;
    unlimited: boolean;
    tier: "free" | "own-key" | "admin";
    provider: GenerationProvider;
  };
  loadedAt: string;
}
export interface GenerationJob extends AiGenerationJob {
  requestedByUserId: string;
  provider: GenerationProvider | null;
  model: string | null;
  providerKeyId: string | null;
  acknowledgedAt: string | null;
  retryOfJobId: string | null;
}
export interface GenerationFeed {
  user: User;
  active: GenerationJob[];
  results: GenerationJob[];
  loadedAt: string;
}
export interface GenerationIntent {
  kind: GenerationKind;
  roadmapId: string;
  targetId: string;
  model: string;
}
export interface GenerationModels {
  models: string[];
  live: boolean;
  defaultModel: string;
  settingsFingerprint: string;
}
function date(value: unknown) {
  const result = editorText(value);
  if (!Number.isFinite(Date.parse(result)))
    throw new Error("Generation dates are incomplete.");
  return result;
}
function nullableText(value: unknown) {
  return value === null ? null : editorText(value);
}
function provider(value: unknown): GenerationProvider {
  if (value !== "nvidia" && value !== "gemini")
    throw new Error("Provider metadata is incomplete.");
  return value;
}
export function generationUuid(value: unknown) {
  const id = contentId(value);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new Error("Use a complete job or content UUID.");
  return id;
}
export function generationRequest(
  query: Record<string, string | string[] | undefined>,
): GenerationRequest {
  try {
    const read = (key: string) =>
      query[key] === undefined ? null : generationUuid(query[key]);
    const roadmapId = read("roadmapId"),
      moduleId = read("moduleId"),
      jobId = read("jobId");
    if (moduleId && !roadmapId) throw new Error();
    return { roadmapId, moduleId, jobId, invalid: false };
  } catch {
    return { roadmapId: null, moduleId: null, jobId: null, invalid: true };
  }
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Generation list is incomplete.");
  return value;
}
function unique<T extends { id: string }>(rows: T[]) {
  if (new Set(rows.map((r) => r.id)).size !== rows.length)
    throw new Error("Duplicate generation records.");
  return rows;
}
export function parseGenerationSettings(
  user: User,
  keysValue: unknown,
  providersValue: unknown,
  quotaValue: unknown,
): GenerationSettings {
  const keys = unique(
    array(keysValue).map((value) => {
      const row = editorObject(value),
        dailyLimit = editorCount(row.dailyLimit);
      if (
        typeof row.isDefault !== "boolean" ||
        dailyLimit < 1 ||
        dailyLimit > 50
      )
        throw new Error("Default key metadata is incomplete.");
      const keyHint = editorText(row.keyHint),
        defaultModel = nullableText(row.defaultModel);
      if (
        keyHint.length > 8 ||
        !keyHint ||
        (defaultModel !== null &&
          (!defaultModel.trim() || defaultModel.length > 120))
      )
        throw new Error("Key metadata is incomplete.");
      return {
        id: generationUuid(row.id),
        provider: provider(row.provider),
        label: nullableText(row.label),
        keyHint,
        isDefault: row.isDefault,
        dailyLimit,
        defaultModel,
        updatedAt: date(row.updatedAt),
      };
    }),
  ).sort((a, b) => a.id.localeCompare(b.id));
  if (keys.length > 2 || keys.filter((k) => k.isDefault).length > 1)
    throw new Error("Default key selection is incomplete.");
  const providers = array(providersValue)
    .map((value) => {
      const row = editorObject(value);
      if (typeof row.byokOnly !== "boolean")
        throw new Error("Provider metadata is incomplete.");
      return {
        provider: provider(row.provider),
        displayName: editorText(row.displayName),
        byokOnly: row.byokOnly,
        defaultModel: editorText(row.defaultModel),
      };
    })
    .sort((a, b) => a.provider.localeCompare(b.provider));
  if (
    !providers.length ||
    new Set(providers.map((p) => p.provider)).size !== providers.length
  )
    throw new Error("Provider metadata is incomplete.");
  const row = editorObject(quotaValue),
    selected = keys.find((k) => k.isDefault),
    quotaProvider = provider(row.provider);
  if (
    row.unlimited !== (user.role === "admin") ||
    row.tier !==
      (user.role === "admin" ? "admin" : selected ? "own-key" : "free") ||
    quotaProvider !== (selected?.provider ?? "nvidia") ||
    !providers.some((p) => p.provider === quotaProvider)
  )
    throw new Error("Quota and default key disagree.");
  const unlimited = row.unlimited as boolean;
  const remaining = unlimited ? row.remaining : editorCount(row.remaining),
    limit = unlimited ? row.limit : editorCount(row.limit);
  if (
    unlimited
      ? remaining !== -1 || limit !== -1
      : !limit ||
        Number(remaining) > Number(limit) ||
        (selected && limit !== selected.dailyLimit)
  )
    throw new Error("Quota metadata is incomplete.");
  return {
    user,
    keys,
    providers,
    quota: {
      remaining: remaining as number,
      limit: limit as number,
      unlimited,
      tier: row.tier as GenerationSettings["quota"]["tier"],
      provider: quotaProvider,
    },
    loadedAt: new Date().toISOString(),
  };
}
export function generationSettingsFingerprint(settings: GenerationSettings) {
  return JSON.stringify({
    user: [settings.user.id, settings.user.role],
    keys: settings.keys,
    providers: settings.providers,
    tier: settings.quota.tier,
    provider: settings.quota.provider,
    limit: settings.quota.limit,
    unlimited: settings.quota.unlimited,
  });
}
export function parseGenerationModels(
  value: unknown,
  settings: GenerationSettings,
): GenerationModels {
  const row = editorObject(value),
    models = array(row.models).map((value) => editorText(value).trim());
  if (
    typeof row.live !== "boolean" ||
    models.some((m) => !m.trim() || m.length > 120) ||
    new Set(models).size !== models.length
  )
    throw new Error("Model catalog is incomplete.");
  return {
    models,
    live: row.live,
    defaultModel: editorText(row.defaultModel),
    settingsFingerprint: generationSettingsFingerprint(settings),
  };
}
export function parseGenerationJob(value: unknown, user: User): GenerationJob {
  const row = editorObject(value);
  if (
    row.requestedByUserId !== user.id ||
    !Object.hasOwn(GENERATION_TYPES, String(row.jobType)) ||
    !["pending", "running", "completed", "failed"].includes(String(row.status))
  )
    throw new Error("Job ownership or status is incomplete.");
  const progressCurrent = editorCount(row.progressCurrent),
    progressTotal = editorCount(row.progressTotal);
  if (progressCurrent > progressTotal)
    throw new Error("Reported job progress is incomplete.");
  let resultSummary: AiGenerationJob["resultSummary"] = null;
  if (row.resultSummary !== null) {
    const summary = editorObject(row.resultSummary);
    const failedItems = array(summary.failedItems).map((value) => {
      const item = editorObject(value);
      return { title: editorText(item.title), reason: editorText(item.reason) };
    });
    const failedCount = editorCount(summary.failedCount);
    if (failedItems.length !== failedCount)
      throw new Error("Job failure summary is incomplete.");
    resultSummary = {
      createdCount: editorCount(summary.createdCount),
      failedCount,
      skippedCount: editorCount(summary.skippedCount),
      failedItems,
      targetLabel: editorText(summary.targetLabel),
      itemNoun: editorText(summary.itemNoun),
    };
  }
  return {
    id: generationUuid(row.id),
    requestedByUserId: user.id,
    jobType: row.jobType as GenerationKind,
    targetId: generationUuid(row.targetId),
    status: row.status as GenerationJob["status"],
    progressCurrent,
    progressTotal,
    resultSummary,
    errorMessage: nullableText(row.errorMessage),
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
    acknowledgedAt:
      row.acknowledgedAt === null ? null : date(row.acknowledgedAt),
    retryOfJobId:
      row.retryOfJobId === null ? null : generationUuid(row.retryOfJobId),
    provider: row.provider === null ? null : provider(row.provider),
    model: nullableText(row.model),
    providerKeyId:
      row.providerKeyId === null ? null : generationUuid(row.providerKeyId),
  };
}
export function parseGenerationFeed(
  user: User,
  activeValue: unknown,
  resultsValue: unknown,
): GenerationFeed {
  const active = unique(
      array(activeValue).map((v) => parseGenerationJob(v, user)),
    ),
    results = unique(
      array(resultsValue).map((v) => parseGenerationJob(v, user)),
    );
  if (
    active.some((j) => !["pending", "running"].includes(j.status)) ||
    results.some(
      (j) =>
        !["completed", "failed"].includes(j.status) ||
        j.acknowledgedAt !== null,
    )
  )
    throw new Error("Job list state is incomplete.");
  // A job can finish between the two GETs. The later finished row wins.
  const finished = new Set(results.map((j) => j.id));
  return {
    user,
    active: active.filter((j) => !finished.has(j.id)),
    results,
    loadedAt: new Date().toISOString(),
  };
}
export function generationTargetLabel(
  editor: EditorData,
  intent: GenerationIntent,
) {
  return intent.kind === "roadmap_modules"
    ? editor.roadmap.title
    : (editor.modules.find((m) => m.id === intent.targetId)?.title ??
        "Unavailable module");
}
export function generationStartIssue(
  editor: EditorData,
  settings: GenerationSettings,
  feed: GenerationFeed,
  intent: GenerationIntent,
  catalog?: GenerationModels,
) {
  if (
    editor.user.id !== settings.user.id ||
    editor.user.role !== settings.user.role ||
    editor.user.id !== feed.user.id ||
    editor.user.role !== feed.user.role
  )
    return "Your account changed. Recheck before generating.";
  if (
    editor.roadmap.id !== intent.roadmapId ||
    editor.roadmap.status === "removed"
  )
    return "Choose an available owned roadmap.";
  if (!Object.hasOwn(GENERATION_TYPES, intent.kind))
    return "Choose a generation action.";
  const selectedModule = editor.modules.find((m) => m.id === intent.targetId);
  if (
    intent.kind === "roadmap_modules"
      ? intent.targetId !== editor.roadmap.id
      : !selectedModule
  )
    return "Choose a module in this roadmap.";
  const count =
    intent.kind === "roadmap_modules"
      ? editor.modules.length
      : (selectedModule?.lessons.length ?? 0);
  if (intent.kind !== "module_mcqs" && count >= 6)
    return "This target is already at its six-item generation limit.";
  if (intent.kind === "module_mcqs" && !count)
    return "Add lessons to this module before generating questions.";
  if (feed.active.some((j) => j.targetId === intent.targetId))
    return "A job is already active for this target. Wait for its result.";
  const required = generationRequiredSlots(editor, intent);
  if (!settings.quota.unlimited && settings.quota.remaining < required)
    return `At least ${required} quota slots must remain to start this action. Check your allowance or default key.`;
  if (
    intent.model &&
    (!catalog ||
      catalog.settingsFingerprint !== generationSettingsFingerprint(settings) ||
      !catalog.models.includes(intent.model))
  )
    return "Load a current model catalog or choose Automatic.";
}
export function generationRequiredSlots(
  editor: EditorData,
  intent: GenerationIntent,
) {
  return intent.kind === "module_concepts"
    ? 7 -
        (editor.modules.find((m) => m.id === intent.targetId)?.lessons.length ??
          0)
    : 1;
}
export { editorFingerprint };
