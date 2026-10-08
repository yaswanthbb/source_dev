import { RankedReview, orderReviewSession } from './review-queue';

const item = (
  id: string,
  conceptId: string,
  retrievability: number,
  dueDate = '2026-10-08',
): RankedReview => ({
  id,
  conceptId,
  retrievability,
  dueDate,
  createdAt: new Date('2026-01-01T00:00Z'),
});
describe('review queue ordering', () => {
  test('due date outranks retrievability; inside a date lowest retrievability wins', () => {
    const result = orderReviewSession(
      [
        item('today', 'C', 0.1),
        item('old-high', 'A', 0.8, '2026-10-07'),
        item('old-low', 'B', 0.2, '2026-10-07'),
      ],
      50,
    );
    expect(result.map((q) => q.id)).toEqual(['old-low', 'old-high', 'today']);
  });
  test('interleaves concepts whenever another concept is available in the same due bucket', () => {
    const items = [
      item('a1', 'A', 0.1),
      item('a2', 'A', 0.2),
      item('a3', 'A', 0.3),
      item('b1', 'B', 0.4),
      item('b2', 'B', 0.5),
    ];
    expect(orderReviewSession(items, 50).map((q) => q.conceptId)).toEqual([
      'A',
      'B',
      'A',
      'B',
      'A',
    ]);
    expect(items).toHaveLength(5);
  });
  test('ties deterministic by creation time then ID, regardless of input order', () => {
    const items = [item('z', 'A', 0.5), item('a', 'B', 0.5)];
    expect(orderReviewSession(items, 50)).toEqual(
      orderReviewSession([...items].reverse(), 50),
    );
    expect(orderReviewSession(items, 50)[0].id).toBe('a');
  });
  test('cap does not mutate/discard the remainder; empty and single-concept queues work', () => {
    const items = [
      item('a', 'A', 0.1),
      item('b', 'A', 0.2),
      item('c', 'A', 0.3),
    ];
    expect(orderReviewSession(items, 2)).toHaveLength(2);
    expect(items).toHaveLength(3);
    expect(orderReviewSession([], 50)).toEqual([]);
    expect(orderReviewSession(items, 50)).toHaveLength(3);
  });
});
