import { createHash } from 'node:crypto';
export const hashText = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export const hashValue = (value: unknown) => hashText(canonical(value));
/** Literal generated text, not JSON escaping, for validating quoted evidence. */
export function evidenceText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(evidenceText).join('\n');
  if (
    value &&
    typeof value === 'object' &&
    'kind' in value &&
    ['lesson', 'compilation', 'prose', 'mcq_set', 'structured'].includes(
      String(value.kind),
    )
  ) {
    const a = value as Record<string, any>;
    // Rubric evidence must quote generated content, never stage names or verifier verdicts.
    return [
      a.content,
      a.structured,
      Array.isArray(a.mcqs)
        ? a.mcqs.map((q: any) => ({
            questionText: q.questionText,
            correctRationale: q.correctRationale,
            options: q.options?.map((o: any) => ({
              optionText: o.optionText,
              misconception: o.misconception,
              distractorRationale: o.distractorRationale,
            })),
          }))
        : a.mcqs,
      a.diagrams?.map((d: any) => d.mermaid),
    ]
      .filter((entry) => entry != null)
      .map(evidenceText)
      .join('\n');
  }
  if (value && typeof value === 'object')
    return Object.values(value).map(evidenceText).join('\n');
  return String(value ?? '');
}
