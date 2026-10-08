import {
  FsrsScheduler,
  LegacyDoublingScheduler,
  SchedulerCard,
  gradeForAnswer,
  seedLegacyMemory,
} from './review-scheduler';

const now = new Date('2026-10-08T12:00:00Z');
const legacy = (): SchedulerCard => ({
  intervalDays: 8,
  correctStreak: 3,
  dueDate: '2026-10-08',
  lastReviewedAt: new Date('2026-09-30T12:00:00Z'),
});
describe('review scheduler abstraction', () => {
  test('binary mapping uses only Again/Good', () => {
    expect(gradeForAnswer(false)).toBe('Again');
    expect(gradeForAnswer(true)).toBe('Good');
  });
  test('legacy doubles, caps at 60 and resets wrong to tomorrow verbatim', () => {
    const scheduler = new LegacyDoublingScheduler();
    expect(scheduler.schedule(legacy(), 'Good', now)).toEqual({
      intervalDays: 16,
      correctStreak: 4,
      dueDate: '2026-10-24',
    });
    expect(
      scheduler.schedule({ ...legacy(), intervalDays: 40 }, 'Good', now)
        .intervalDays,
    ).toBe(60);
    expect(scheduler.schedule(legacy(), 'Again', now)).toEqual({
      intervalDays: 1,
      correctStreak: 0,
      dueDate: '2026-10-09',
    });
  });
  test('deterministic migration seed preserves interval/due fields', () => {
    const card = legacy();
    expect(seedLegacyMemory(card)).toMatchObject({
      stability: 8,
      difficulty: 5,
      reps: 3,
      lapses: 0,
      state: 'review',
      lastGrade: 'Good',
    });
    expect(card.dueDate).toBe('2026-10-08');
    expect(
      seedLegacyMemory({
        ...legacy(),
        intervalDays: 1,
        correctStreak: 0,
        lastReviewedAt: null,
      }),
    ).toMatchObject({ stability: 0, difficulty: 0, reps: 0, state: 'new' });
  });
  test('FSRS Good grows memory and interval sanely on migrated card', () => {
    const result = new FsrsScheduler().schedule(legacy(), 'Good', now);
    expect(result.memory!.stability).toBeGreaterThan(8);
    expect(result.memory!.reps).toBe(4);
    expect(result.intervalDays).toBeGreaterThan(8);
    expect(result.intervalDays).toBeLessThanOrEqual(60);
    expect(result.dueDate > '2026-10-16').toBe(true);
    expect(result.dueDate <= '2026-12-07').toBe(true);
  });
  test('FSRS lapse enters relearning and preserves a nonzero memory estimate', () => {
    const result = new FsrsScheduler().schedule(legacy(), 'Again', now);
    expect(result.memory).toMatchObject({
      state: 'relearning',
      lapses: 1,
      lastGrade: 'Again',
    });
    expect(result.memory!.stability).toBeGreaterThan(0);
    expect(result.memory!.stability).toBeLessThan(8);
    expect(result.intervalDays).toBe(1);
  });
  test('retention validation and higher retention shortens interval', () => {
    for (const value of [NaN, 0.69, 1])
      expect(() => new FsrsScheduler(value)).toThrow('FSRS_REQUEST_RETENTION');
    expect(
      new FsrsScheduler(0.95).schedule(legacy(), 'Good', now).intervalDays,
    ).toBeLessThan(
      new FsrsScheduler(0.8).schedule(legacy(), 'Good', now).intervalDays,
    );
  });
  test('legacy→FSRS re-enable rebases estimates without resetting lifetime lapses/reps', () => {
    const card = {
      ...legacy(),
      ...seedLegacyMemory(legacy()),
      lapses: 9,
      reps: 12,
      intervalDays: 4,
      lastReviewedAt: new Date('2026-10-04T12:00:00Z'),
    };
    const result = new FsrsScheduler().schedule(card, 'Good', now);
    expect(result.rebased).toBe(true);
    expect(result.memory!.lapses).toBe(9);
    expect(result.memory!.reps).toBe(13);
  });
  test('retrievability falls as elapsed time grows', () => {
    const f = new FsrsScheduler();
    expect(f.retrievability(legacy(), now)).toBeGreaterThan(
      f.retrievability(legacy(), new Date('2026-11-08T12:00Z')),
    );
  });
});
