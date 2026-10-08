/** Typed author-side assessment shape. Never serialize this to learners. */
export const BLOOM_LEVELS = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export interface AssessmentOption {
  optionText: string;
  isCorrect: boolean;
  misconception: string | null;
  distractorRationale: string | null;
}
export interface AssessmentItem {
  questionText: string;
  options: AssessmentOption[];
  bloomLevel: BloomLevel;
  intendedDifficulty: string;
  correctRationale: string;
  nullSetCorrect?: boolean;
  lintResult?: Record<string, unknown>;
  verificationResult?: Record<string, unknown>;
}
export const DEFAULT_BLOOM_TARGET_PERCENT = 40;
export function bloomTarget(value: unknown): number {
  if (value === undefined || value === null || value === '')
    return DEFAULT_BLOOM_TARGET_PERCENT;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100
    ? n
    : DEFAULT_BLOOM_TARGET_PERCENT;
}
export function auditBloom(
  items: AssessmentItem[],
  target = DEFAULT_BLOOM_TARGET_PERCENT,
) {
  const higher = items.filter(
    (q) => BLOOM_LEVELS.indexOf(q.bloomLevel) >= 2,
  ).length;
  const percent = items.length ? (higher * 100) / items.length : 0;
  return {
    target,
    total: items.length,
    higher,
    percent,
    passed: items.length > 0 && percent >= target,
    positions: items.reduce<Record<string, number>>((counts, q) => {
      const position = String(q.options.findIndex((o) => o.isCorrect) + 1);
      counts[position] = (counts[position] ?? 0) + 1;
      return counts;
    }, {}),
  };
}
export function parseAssessment(value: unknown): AssessmentItem[] | null {
  if (!Array.isArray(value) || !value.length) return null;
  const result: AssessmentItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const q = raw as Record<string, unknown>;
    if (
      typeof q.questionText !== 'string' ||
      !q.questionText.trim() ||
      !BLOOM_LEVELS.includes(q.bloomLevel as BloomLevel) ||
      typeof q.intendedDifficulty !== 'string' ||
      !['easy', 'medium', 'hard'].includes(q.intendedDifficulty) ||
      typeof q.correctRationale !== 'string' ||
      !q.correctRationale.trim() ||
      !Array.isArray(q.options) ||
      q.options.length < 2
    )
      return null;
    const options: AssessmentOption[] = [];
    for (const rawOption of q.options) {
      if (!rawOption || typeof rawOption !== 'object') return null;
      const o = rawOption as Record<string, unknown>;
      if (
        typeof o.optionText !== 'string' ||
        !o.optionText.trim() ||
        typeof o.isCorrect !== 'boolean'
      )
        return null;
      if (
        !o.isCorrect &&
        (typeof o.distractorRationale !== 'string' ||
          !o.distractorRationale.trim())
      )
        return null;
      options.push({
        optionText: o.optionText.trim(),
        isCorrect: o.isCorrect,
        misconception: o.isCorrect
          ? null
          : typeof o.misconception === 'string'
            ? o.misconception.trim()
            : null,
        distractorRationale: o.isCorrect
          ? null
          : (o.distractorRationale as string),
      });
    }
    if (options.filter((o) => o.isCorrect).length !== 1) return null;
    result.push({
      questionText: q.questionText.trim(),
      options,
      bloomLevel: q.bloomLevel as BloomLevel,
      intendedDifficulty: q.intendedDifficulty,
      correctRationale: q.correctRationale.trim(),
      nullSetCorrect: q.nullSetCorrect === true,
    });
  }
  return result;
}
