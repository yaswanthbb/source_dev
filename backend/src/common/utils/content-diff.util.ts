/**
 * High-performance bounded Levenshtein distance calculation.
 * Computes character-level differences between two strings up to maxThreshold.
 * Runs in O(maxThreshold * min(N, M)) time with O(min(N, M)) memory.
 */
export function boundedLevenshtein(
  s1: string,
  s2: string,
  maxThreshold: number = 40,
): number {
  if (s1 === s2) return 0;
  if (!s1) return Math.min(s2?.length || 0, maxThreshold);
  if (!s2) return Math.min(s1?.length || 0, maxThreshold);

  const len1 = s1.length;
  const len2 = s2.length;

  // If the length difference itself is >= maxThreshold, exit immediately
  if (Math.abs(len1 - len2) >= maxThreshold) {
    return maxThreshold;
  }

  // Ensure 'a' is the shorter string to minimize array allocations
  let a = s1;
  let b = s2;
  if (a.length > b.length) {
    a = s2;
    b = s1;
  }

  const n = a.length;
  const m = b.length;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let i = 0; i <= n; i++) {
    prev[i] = i;
  }

  for (let j = 1; j <= m; j++) {
    curr[0] = j;
    let minRowVal = curr[0];

    for (let i = 1; i <= n; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1, // deletion
        curr[i - 1] + 1, // insertion
        prev[i - 1] + cost, // substitution
      );
      if (curr[i] < minRowVal) {
        minRowVal = curr[i];
      }
    }

    // Early exit if the minimum edit distance in the current row exceeds threshold
    if (minRowVal >= maxThreshold) {
      return maxThreshold;
    }

    for (let i = 0; i <= n; i++) {
      prev[i] = curr[i];
    }
  }

  return Math.min(prev[n], maxThreshold);
}

/**
 * Determines whether the content edit exceeds the significant change threshold (>= 40 changed characters).
 */
export function hasSignificantContentChange(
  oldContent: string,
  newContent: string,
  threshold: number = 40,
): boolean {
  if (oldContent === newContent) return false;
  const distance = boundedLevenshtein(
    oldContent || '',
    newContent || '',
    threshold,
  );
  return distance >= threshold;
}
