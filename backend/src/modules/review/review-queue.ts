export interface RankedReview {
  id: string;
  dueDate: string;
  conceptId: string;
  retrievability: number;
  createdAt: Date;
}

/** Civil due date is primary. Inside each date, take the lowest-retrievability
 * remaining item from a different concept if possible; ties use creation time then ID.
 * Stop at the session cap, without removing held-back work from storage.
 */
export function orderReviewSession<T extends RankedReview>(
  items: T[],
  cap: number,
): T[] {
  const remaining = [...items].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.retrievability - b.retrievability ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  const result: T[] = [];
  let lastConcept: string | undefined;
  while (remaining.length && result.length < cap) {
    const date = remaining[0].dueDate;
    const alternative = remaining.findIndex(
      (item) => item.dueDate === date && item.conceptId !== lastConcept,
    );
    const [next] = remaining.splice(alternative < 0 ? 0 : alternative, 1);
    result.push(next);
    lastConcept = next.conceptId;
  }
  return result;
}
