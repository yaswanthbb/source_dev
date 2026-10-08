import { QueryRunner } from 'typeorm';
import { FsrsReviewState1788080000000 } from '../../migrations/1788080000000-FsrsReviewState';
import { seedLegacyMemory } from './review-scheduler';

describe('FSRS migration contracts (not a live PostgreSQL round trip)', () => {
  test('8-day/3-streak seed is deterministic; historyless card is New', () => {
    const card = {
      intervalDays: 8,
      correctStreak: 3,
      dueDate: '2026-10-08',
      lastReviewedAt: null,
    };
    expect(seedLegacyMemory(card)).toMatchObject({
      stability: 8,
      difficulty: 5,
      reps: 3,
      lapses: 0,
      state: 'review',
      lastGrade: null,
    });
    expect(
      seedLegacyMemory({ ...card, intervalDays: 1, correctStreak: 0 }).state,
    ).toBe('new');
  });
  test('up backfills only new columns, preserves served dates and live uniqueness, retains histories on delete', async () => {
    const query = jest.fn();
    await new FsrsReviewState1788080000000().up({
      query,
    } as unknown as QueryRunner);
    const sql = query.mock.calls.map(([s]) => s).join('\n');
    expect(sql).toMatch(/GREATEST\(interval_days,1\)/);
    expect(sql).toMatch(/fsrs_reviewed_at = last_reviewed_at/);
    expect(sql).toMatch(/ON DELETE SET NULL/);
    expect(sql).not.toMatch(
      /DELETE FROM|DROP TABLE|DROP CONSTRAINT.*UQ_review_items|SET\s+due_date\s*=|SET\s+interval_days\s*=/i,
    );
  });
  test('down restores FK and removes all new columns; refuses destructive tombstone handling', async () => {
    const query = jest.fn();
    await new FsrsReviewState1788080000000().down({
      query,
    } as unknown as QueryRunner);
    const sql = query.mock.calls.map(([s]) => s).join('\n');
    for (const column of [
      'stability',
      'difficulty',
      'reps',
      'lapses',
      'state',
      'last_grade',
      'learning_steps',
      'fsrs_reviewed_at',
      'source_question_id',
      'source_concept_id',
      'source_concept_title',
    ])
      expect(sql).toContain(`DROP COLUMN ${column}`);
    expect(sql).toMatch(/SET NOT NULL/);
    expect(sql).toMatch(/ON DELETE CASCADE/);
    expect(sql).not.toMatch(/DELETE FROM|DROP TABLE/i);
    expect(query.mock.calls[0][0]).toMatch(/RAISE EXCEPTION/);
  });
});
