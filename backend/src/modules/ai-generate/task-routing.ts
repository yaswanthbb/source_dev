import { AiProvider } from '../../common/enums/ai-provider.enum';

/**
 * §8 per-task model routing (code-level table, no DB). Task keys cover both
 * today's generation paths and the compiler pipeline stages
 * (outline/critique/style) so the compiler phase can use them immediately.
 *
 * Tiers resolve through the existing live-model machinery — never hardcoded
 * IDs: `fast` is the operator-tunable provider default
 * (`configuredDefaultModel`, honoring NVIDIA_MODEL_ID); `strong` additionally
 * honors `<PROVIDER>_STRONG_MODEL_ID` and falls back to the same default.
 * By default both tiers are the same model, so enabling the flag changes
 * params, not models, until an operator sets a strong override.
 */
export type CourseTaskKey =
  | 'roadmap_titles'
  | 'module_concept_titles'
  | 'concept_outline'
  | 'concept_draft'
  | 'concept_factcheck'
  | 'concept_critique'
  | 'concept_style'
  | 'concept_research'
  | 'module_mcqs'
  | 'single_concept_mcqs'
  | 'qa_answer';

export type TaskModelTier = 'fast' | 'strong';

export interface TaskRoute {
  tier: TaskModelTier;
  maxTokens: number;
  temperature: number;
  /** Second-attempt temperature for parse-retry loops (MCQ paths). */
  retryTemperature?: number;
}

export const TASK_ROUTES: Record<CourseTaskKey, TaskRoute> = {
  // Title lists and grounded extraction → cheap/fast.
  roadmap_titles: { tier: 'fast', maxTokens: 400, temperature: 0.5 },
  module_concept_titles: { tier: 'fast', maxTokens: 400, temperature: 0.5 },
  module_mcqs: {
    tier: 'fast',
    maxTokens: 2000,
    temperature: 0.3,
    retryTemperature: 0.4,
  },
  single_concept_mcqs: {
    tier: 'fast',
    maxTokens: 2000,
    temperature: 0.3,
    retryTemperature: 0.4,
  },
  qa_answer: { tier: 'fast', maxTokens: 1500, temperature: 0.5 },
  // Long-form authoring and judgment → strongest available.
  concept_outline: { tier: 'strong', maxTokens: 800, temperature: 0.5 },
  concept_draft: { tier: 'strong', maxTokens: 3000, temperature: 0.6 },
  // Verification and judgment → strongest available.
  concept_factcheck: { tier: 'strong', maxTokens: 1500, temperature: 0.3 },
  concept_critique: { tier: 'strong', maxTokens: 2000, temperature: 0.3 },
  // Private research briefs are grounded extraction → cheap/fast.
  concept_research: { tier: 'fast', maxTokens: 800, temperature: 0.3 },
  concept_style: { tier: 'strong', maxTokens: 2000, temperature: 0.5 },
};

export const COURSE_TASK_KEYS: CourseTaskKey[] = Object.keys(
  TASK_ROUTES,
) as CourseTaskKey[];

export function isCourseTaskKey(value: unknown): value is CourseTaskKey {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(TASK_ROUTES, value)
  );
}

export function taskRouteFor(key: CourseTaskKey): TaskRoute {
  return TASK_ROUTES[key];
}

/**
 * Resolves a tier to a concrete model id without hardcoding any id here.
 * `get` reads env/config; `globalDefault` is the provider's
 * configuredDefaultModel. Strong prefers `<PROVIDER>_STRONG_MODEL_ID`
 * (e.g. NVIDIA_STRONG_MODEL_ID); blank/missing falls back to the default.
 */
export function resolveTierModel(
  provider: AiProvider,
  tier: TaskModelTier,
  get: (key: string) => string | undefined,
  globalDefault: (provider: AiProvider) => string,
): string {
  if (tier === 'strong') {
    const override = get(
      `${provider.toUpperCase()}_STRONG_MODEL_ID`,
    )?.trim();
    if (override) return override;
  }
  return globalDefault(provider);
}
