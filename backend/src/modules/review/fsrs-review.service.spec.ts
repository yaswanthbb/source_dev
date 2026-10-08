import { ConfigService } from '@nestjs/config';
import { ReviewService } from './review.service';
import { seedLegacyMemory } from './review-scheduler';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../../common/testing/mock-repository';
import {
  makeConcept,
  makeQuestion,
  makeOption,
  makeReviewItem,
} from '../../common/testing/factories';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';
import { RoadmapUnpublishStatus } from '../../common/enums/roadmap-unpublish-status.enum';

function setup(
  env: Record<string, string | undefined> = { FSRS_ENABLED: 'true' },
) {
  const reviews = createMockRepository(),
    questions = createMockRepository(),
    xp = createMockRepository(),
    placements = createMockRepository();
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  placements.find.mockResolvedValue([]);
  const service = new ReviewService(
    reviews as any,
    questions as any,
    xp as any,
    config,
    placements as any,
  );
  for (const method of ['log', 'warn', 'debug'])
    jest
      .spyOn((service as any).logger, method)
      .mockImplementation(() => undefined);
  return { service, reviews, questions, xp, placements, env };
}
function card(
  id = 'r1',
  conceptId = 'c1',
  extra: Record<string, unknown> = {},
) {
  const item = makeReviewItem({
    id,
    userId: 'user-1',
    dueDate: '2026-10-08',
    intervalDays: 8,
    correctStreak: 3,
    lastReviewedAt: new Date('2026-09-30T12:00Z'),
    mcqQuestionId: `q-${id}`,
    mcqQuestion: makeQuestion({
      id: `q-${id}`,
      conceptId,
      concept: makeConcept({ id: conceptId, authorId: 'user-1' }),
      correctRationale: 'SECRET',
      verificationResult: { answerIndex: 0 },
      lintResult: { correctPosition: 1 },
      options: [
        makeOption({ id: 'right', isCorrect: true, distractorRationale: null }),
        makeOption({
          id: 'wrong',
          isCorrect: false,
          misconception: 'SECRET',
          distractorRationale: 'SECRET',
        }),
      ],
    }),
  });
  return Object.assign(item, seedLegacyMemory(item), extra);
}
describe('FSRS review integration', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  test('correct uses FSRS memory, preserves ownership/due/XP/answer response', async () => {
    const h = setup();
    const item = card();
    h.reviews.findOne.mockResolvedValue(item);
    const result = await h.service.answerReviewItem('r1', 'user-1', {
      selectedOptionId: 'right',
    });
    expect(result).toMatchObject({
      isCorrect: true,
      correctOptionId: 'right',
      xpAwarded: 2,
      isLeech: false,
    });
    expect(result.newIntervalDays).toBeGreaterThan(8);
    expect(item.stability).toBeGreaterThan(8);
    expect(item.reps).toBe(4);
    expect(h.xp.save).toHaveBeenCalledTimes(1);
    expect(item.fsrsReviewedAt).toEqual(item.lastReviewedAt);
  });
  test('wrong retains history, enters relearning and awards no XP', async () => {
    const h = setup();
    const item = card();
    h.reviews.findOne.mockResolvedValue(item);
    const result = await h.service.answerReviewItem('r1', 'user-1', {
      selectedOptionId: 'wrong',
    });
    expect(result).toMatchObject({
      isCorrect: false,
      newIntervalDays: 1,
      nextDueDate: '2026-10-09',
      xpAwarded: 0,
    });
    expect(item.state).toBe('relearning');
    expect(item.lapses).toBe(1);
    expect(h.xp.save).not.toHaveBeenCalled();
  });
  test('repeated lapse/recovery cycles preserve card and eventually flag leech with a working concept link', async () => {
    const h = setup({ FSRS_ENABLED: 'true', FSRS_LEECH_THRESHOLD: '3' });
    const item = card();
    h.reviews.findOne.mockResolvedValue(item);
    const warning = jest.spyOn((h.service as any).logger, 'warn');
    let result: any;
    for (let i = 0; i < 3; i++) {
      jest.setSystemTime(new Date(`${item.dueDate}T12:00Z`));
      result = await h.service.answerReviewItem('r1', 'user-1', {
        selectedOptionId: 'wrong',
      });
      expect(item.state).toBe('relearning');
      expect(item.lapses).toBe(i + 1);
      if (i < 2) {
        jest.setSystemTime(new Date(`${item.dueDate}T12:00Z`));
        await h.service.answerReviewItem('r1', 'user-1', {
          selectedOptionId: 'right',
        });
        expect(item.state).toBe('review');
      }
    }
    expect(result.isLeech).toBe(true);
    expect(result.remediation.href).toBe('/developer/terminal?concept=c1');
    expect(
      warning.mock.calls.some(([entry]) =>
        String(entry).includes('review_leech'),
      ),
    ).toBe(true);
    expect(h.reviews.delete).not.toHaveBeenCalled();
    expect(item.id).toBe('r1');
  });
  test('consecutive wrongs while already relearning do not invent additional FSRS lapses', async () => {
    const h = setup();
    const item = card();
    h.reviews.findOne.mockResolvedValue(item);
    for (let i = 0; i < 4; i++) {
      jest.setSystemTime(new Date(`${item.dueDate}T12:00Z`));
      await h.service.answerReviewItem('r1', 'user-1', {
        selectedOptionId: 'wrong',
      });
    }
    expect(item.lapses).toBe(1);
    expect(item.reps).toBe(7);
    expect(item.state).toBe('relearning');
  });
  test('queue cap exposes all held-back and unavailable work without leaking correctness', async () => {
    const h = setup({ FSRS_ENABLED: 'true', FSRS_REVIEW_SESSION_CAP: '2' });
    const items = [
      card('a1', 'A'),
      card('a2', 'A'),
      card('b1', 'B'),
      card('gone', 'gone', { mcqQuestion: null, mcqQuestionId: null }),
    ];
    h.reviews.find.mockResolvedValue(items);
    const session = await h.service.getDueReviewItems('user-1');
    expect(session).toHaveLength(2);
    expect(session.map((q) => q.question.conceptId)).toEqual(['A', 'B']);
    expect(JSON.stringify(session)).not.toMatch(
      /SECRET|isCorrect|correctRationale|verificationResult|lintResult|distractorRationale|misconception/,
    );
    expect(await h.service.getDueCount('user-1')).toEqual({
      count: 4,
      dueCount: 4,
      sessionCount: 2,
      heldBackCount: 1,
      unavailableCount: 1,
      leechCount: 0,
    });
    expect(h.reviews.delete).not.toHaveBeenCalled();
  });
  test('unpublished/expired sources are excluded and cannot be answered; owner/admin bypass remains', async () => {
    const h = setup();
    const item = card();
    item.mcqQuestion!.concept.authorId = 'other';
    item.mcqQuestion!.concept.reviewStatus = ConceptReviewStatus.APPROVED;
    h.reviews.find.mockResolvedValue([item]);
    h.reviews.findOne.mockResolvedValue(item);
    h.placements.find.mockResolvedValue([
      {
        conceptId: 'c1',
        module: {
          roadmap: {
            reviewStatus: RoadmapReviewStatus.PUBLISHED,
            createdById: 'other',
            unpublishStatus: RoadmapUnpublishStatus.APPROVED,
            unpublishEffectiveAt: new Date('2026-10-07'),
          },
        },
      },
    ]);
    expect(await h.service.getDueReviewItems('user-1')).toEqual([]);
    await expect(
      h.service.answerReviewItem('r1', 'user-1', { selectedOptionId: 'right' }),
    ).rejects.toThrow('currently unavailable');
    expect((await h.service.getDueCount('user-1')).unavailableCount).toBe(1);
    expect(
      await h.service.getDueReviewItems('user-1', undefined, UserRole.ADMIN),
    ).toHaveLength(1);
    expect(h.xp.save).not.toHaveBeenCalled();
  });
  test('published non-owner content remains reviewable and missing source errors retain the row', async () => {
    const h = setup();
    const item = card();
    item.mcqQuestion!.concept.authorId = 'other';
    item.mcqQuestion!.concept.reviewStatus = ConceptReviewStatus.APPROVED;
    h.placements.find.mockResolvedValue([
      {
        conceptId: 'c1',
        module: {
          roadmap: {
            reviewStatus: RoadmapReviewStatus.PUBLISHED,
            createdById: 'other',
          },
        },
      },
    ]);
    h.reviews.find.mockResolvedValue([item]);
    expect(await h.service.getDueReviewItems('user-1')).toHaveLength(1);
    h.reviews.findOne.mockResolvedValue(
      card('gone', 'gone', { mcqQuestion: null, mcqQuestionId: null }),
    );
    await expect(
      h.service.answerReviewItem('gone', 'user-1', {
        selectedOptionId: 'right',
      }),
    ).rejects.toThrow('history has been retained');
    expect(h.reviews.remove).not.toHaveBeenCalled();
  });
  test.each([undefined, 'false', 'TRUE', '1'])(
    'flag=%s keeps legacy payload, doubling and frozen FSRS fields',
    async (flag) => {
      const h = setup({
        FSRS_ENABLED: flag,
        FSRS_REQUEST_RETENTION: 'invalid',
      });
      const item = card();
      h.reviews.findOne.mockResolvedValue(item);
      h.reviews.count.mockResolvedValue(4);
      const result = await h.service.answerReviewItem('r1', 'user-1', {
        selectedOptionId: 'right',
      });
      expect(result).toEqual({
        isCorrect: true,
        correctOptionId: 'right',
        newIntervalDays: 16,
        nextDueDate: '2026-10-24',
        xpAwarded: 2,
      });
      expect(item.stability).toBe(8);
      expect(item.reps).toBe(3);
      expect(item.fsrsReviewedAt).toEqual(new Date('2026-09-30T12:00Z'));
      expect(await h.service.getDueCount('user-1')).toEqual({
        count: 4,
        dueCount: 4,
      });
      expect(h.placements.find).not.toHaveBeenCalled();
    },
  );
  test('flag rollback followed by re-enable preserves reps/lapses and resynchronizes state', async () => {
    const h = setup({ FSRS_ENABLED: 'true' });
    const item = card('r1', 'c1', { lapses: 9, reps: 12 });
    h.reviews.findOne.mockResolvedValue(item);
    await h.service.answerReviewItem('r1', 'user-1', {
      selectedOptionId: 'right',
    });
    h.env.FSRS_ENABLED = 'false';
    jest.setSystemTime(new Date(`${item.dueDate}T12:00Z`));
    await h.service.answerReviewItem('r1', 'user-1', {
      selectedOptionId: 'wrong',
    });
    expect(item.lapses).toBe(9);
    h.env.FSRS_ENABLED = 'true';
    jest.setSystemTime(new Date(`${item.dueDate}T12:00Z`));
    const result = await h.service.answerReviewItem('r1', 'user-1', {
      selectedOptionId: 'right',
    });
    expect(item.lapses).toBe(9);
    expect(item.reps).toBe(14);
    expect(result.isLeech).toBe(true);
    expect(item.fsrsReviewedAt).toEqual(item.lastReviewedAt);
  });
  test.each(['Asia/Kolkata', 'America/New_York'])(
    'early answers and tomorrow use %s civil dates at boundary',
    async (zone) => {
      const h = setup();
      const item = card('r1', 'c1', { dueDate: '2026-10-09' });
      h.reviews.findOne.mockResolvedValue(item);
      const before =
        zone === 'Asia/Kolkata'
          ? '2026-10-08T18:29:59Z'
          : '2026-10-09T03:59:59Z';
      const after =
        zone === 'Asia/Kolkata'
          ? '2026-10-08T18:30:00Z'
          : '2026-10-09T04:00:00Z';
      jest.setSystemTime(new Date(before));
      await expect(
        h.service.answerReviewItem(
          'r1',
          'user-1',
          { selectedOptionId: 'wrong' },
          zone,
        ),
      ).rejects.toThrow('not due yet');
      jest.setSystemTime(new Date(after));
      const result = await h.service.answerReviewItem(
        'r1',
        'user-1',
        { selectedOptionId: 'wrong' },
        zone,
      );
      expect(result.nextDueDate).toBe('2026-10-10');
    },
  );
  test.each([
    ['Asia/Kolkata', '2026-10-08T18:29:59Z', '2026-10-08'],
    ['Asia/Kolkata', '2026-10-08T18:30:00Z', '2026-10-09'],
    ['America/New_York', '2026-11-01T03:59:59Z', '2026-10-31'],
    ['America/New_York', '2026-11-01T04:00:00Z', '2026-11-01'],
  ])(
    'due reads use the civil-date boundary in %s at %s',
    async (zone, instant, today) => {
      const h = setup();
      h.reviews.find.mockResolvedValue([]);
      jest.setSystemTime(new Date(instant));
      await h.service.getDueReviewItems('user-1', zone);
      await h.service.getDueCount('user-1', zone);
      for (const [options] of h.reviews.find.mock.calls) {
        expect(options.where.userId).toBe('user-1');
        expect(options.where.dueDate.type).toBe('lessThanOrEqual');
        expect(options.where.dueDate.value).toBe(today);
      }
    },
  );
  test('DST fall-back and spring-forward tomorrow are calendar days, not 24-hour shifts', async () => {
    for (const [instant, today, tomorrow] of [
      ['2026-11-01T04:00Z', '2026-11-01', '2026-11-02'],
      ['2026-03-08T05:00Z', '2026-03-08', '2026-03-09'],
    ]) {
      const h = setup();
      const lastReview = new Date(new Date(instant).getTime() - 8 * 86_400_000);
      const item = card('r1', 'c1', {
        dueDate: today,
        lastReviewedAt: lastReview,
        fsrsReviewedAt: lastReview,
      });
      h.reviews.findOne.mockResolvedValue(item);
      jest.setSystemTime(new Date(instant));
      expect(
        (
          await h.service.answerReviewItem(
            'r1',
            'user-1',
            { selectedOptionId: 'wrong' },
            'America/New_York',
          )
        ).nextDueDate,
      ).toBe(tomorrow);
    }
  });
  test('invalid settings are rejected without awarding XP or persisting a schedule', async () => {
    for (const env of [
      { FSRS_REQUEST_RETENTION: 'NaN' },
      { FSRS_REQUEST_RETENTION: '0.5' },
      { FSRS_LEECH_THRESHOLD: '1.5' },
    ]) {
      const h = setup({ FSRS_ENABLED: 'true', ...env });
      h.reviews.findOne.mockResolvedValue(card());
      await expect(
        h.service.answerReviewItem('r1', 'user-1', {
          selectedOptionId: 'right',
        }),
      ).rejects.toThrow('FSRS_');
      expect(h.reviews.save).not.toHaveBeenCalled();
      expect(h.xp.save).not.toHaveBeenCalled();
    }
    const h = setup({ FSRS_ENABLED: 'true', FSRS_REVIEW_SESSION_CAP: '0' });
    h.reviews.find.mockResolvedValue([card()]);
    await expect(h.service.getDueReviewItems('user-1')).rejects.toThrow(
      'FSRS_REVIEW_SESSION_CAP',
    );
  });
  test('new FSRS cards start New due tomorrow with provenance and uniqueness preserved', async () => {
    const h = setup();
    h.questions.find.mockResolvedValue([card().mcqQuestion]);
    const qb = createMockQueryBuilder();
    h.reviews.createQueryBuilder.mockReturnValue(qb);
    await h.service.populateReviewItemsForConcept(
      'user-1',
      'c1',
      'Asia/Kolkata',
    );
    expect(qb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'new',
        reps: 0,
        lapses: 0,
        stability: 0,
        dueDate: '2026-10-09',
        sourceConceptId: 'c1',
      }),
    );
    expect(qb.orIgnore).toHaveBeenCalledTimes(1);
  });
});
