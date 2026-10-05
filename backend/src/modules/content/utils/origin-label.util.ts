/**
 * §4 content labeling, computed bottom-up.
 *
 * - Concept: `ai` when generated, `handwritten` otherwise.
 * - Module / roadmap: `ai` only when every non-empty child is `ai`;
 *   `handwritten` only when every non-empty child is `handwritten`;
 *   `partial` on any mix. Empty children are ignored; all-empty → null
 *   (no label — excluded from label-filtered results).
 */
export type LeafOriginLabel = 'ai' | 'handwritten';
export type OriginLabel = LeafOriginLabel | 'partial';

export function conceptOriginLabel(isAiGenerated: boolean): LeafOriginLabel {
  return isAiGenerated ? 'ai' : 'handwritten';
}

export function rollupOriginLabel(
  childLabels: OriginLabel[],
): OriginLabel | null {
  const effective = childLabels.filter(
    (l): l is OriginLabel => l !== null && l !== undefined,
  );
  if (effective.length === 0) return null;
  if (effective.every((l) => l === 'ai')) return 'ai';
  if (effective.every((l) => l === 'handwritten')) return 'handwritten';
  return 'partial';
}

const VALID_LABELS: OriginLabel[] = ['ai', 'handwritten', 'partial'];

export function parseOriginLabel(value: string | undefined): OriginLabel | undefined {
  if (value === undefined) return undefined;
  if (!(VALID_LABELS as string[]).includes(value)) {
    throw new Error(
      `Invalid origin label "${value}". Expected one of: ai, handwritten, partial.`,
    );
  }
  return value as OriginLabel;
}
