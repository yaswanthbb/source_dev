import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { ReviewService } from './review.service';
import { ReviewItem } from './entities/review-item.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';

import { XpSource } from '../../common/enums/xp-source.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
  MockQueryBuilder,
} from '../../common/testing/mock-repository';
import {
  makeReviewItem,
  makeQuestion,
  makeOption,
} from '../../common/testing/factories';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: MockRepository;
  let questionRepo: MockRepository;
  let xpRepo: MockRepository;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(ReviewItem),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
        { provide: getRepositoryToken(XpEvent), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get(ReviewService);
    reviewRepo = module.get(getRepositoryToken(ReviewItem));
    questionRepo = module.get(getRepositoryToken(McqQuestion));
    xpRepo = module.get(getRepositoryToken(XpEvent));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const itemDueToday = (overrides = {}) =>
    makeReviewItem({
      dueDate: '2026-08-25',
      mcqQuestion: makeQuestion({
        options: [
          makeOption({ id: 'c', isCorrect: true }),
          makeOption({ id: 'w', isCorrect: false }),
        ],
      }),
      ...overrides,
    } as any);

  describe('answerReviewItem', () => {
    it('throws NotFound when the item is missing', async () => {
      reviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.answerReviewItem('missing', 'user-1', {
          selectedOptionId: 'c',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids answering another user’s item', async () => {
      reviewRepo.findOne.mockResolvedValue(itemDueToday({ userId: 'other' }));

      await expect(
        service.answerReviewItem('review-1', 'user-1', {
          selectedOptionId: 'c',
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an item that is not yet due (anti-farming)', async () => {
      reviewRepo.findOne.mockResolvedValue(
        itemDueToday({ dueDate: '2026-08-26' }),
      );

      await expect(
        service.answerReviewItem('review-1', 'user-1', {
          selectedOptionId: 'c',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an option that does not belong to the question', async () => {
      reviewRepo.findOne.mockResolvedValue(itemDueToday());

      await expect(
        service.answerReviewItem('review-1', 'user-1', {
          selectedOptionId: 'nope',
        } as any),
      ).rejects.toThrow('Invalid option selected');
    });

    it('grows the interval, advances the due date, and awards 2 XP on a correct answer', async () => {
      reviewRepo.findOne.mockResolvedValue(
        itemDueToday({ intervalDays: 2, correctStreak: 1 }),
      );

      const result = await service.answerReviewItem('review-1', 'user-1', {
        selectedOptionId: 'c',
      } as any);

      expect(result).toEqual({
        isCorrect: true,
        correctOptionId: 'c',
        newIntervalDays: 4, // min(2 * 2, 60)
        nextDueDate: '2026-08-29', // today + 4
        xpAwarded: 2,
      });
      expect(xpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          sourceType: XpSource.REVIEW_CORRECT,
          xpAmount: 2,
        }),
      );
      expect(xpRepo.save).toHaveBeenCalledTimes(1);
      expect(reviewRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ correctStreak: 2, intervalDays: 4 }),
      );
    });

    it('caps the interval at 60 days', async () => {
      reviewRepo.findOne.mockResolvedValue(
        itemDueToday({ intervalDays: 40, correctStreak: 5 }),
      );

      const result = await service.answerReviewItem('review-1', 'user-1', {
        selectedOptionId: 'c',
      } as any);

      expect(result.newIntervalDays).toBe(60);
      expect(result.nextDueDate).toBe('2026-10-24'); // today + 60
    });

    it('resets the interval to 1 and awards no XP on a wrong answer', async () => {
      reviewRepo.findOne.mockResolvedValue(
        itemDueToday({ intervalDays: 8, correctStreak: 3 }),
      );

      const result = await service.answerReviewItem('review-1', 'user-1', {
        selectedOptionId: 'w',
      } as any);

      expect(result).toEqual({
        isCorrect: false,
        correctOptionId: 'c',
        newIntervalDays: 1,
        nextDueDate: '2026-08-26', // tomorrow
        xpAwarded: 0,
      });
      expect(xpRepo.save).not.toHaveBeenCalled();
      expect(reviewRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ correctStreak: 0, intervalDays: 1 }),
      );
    });
  });

  describe('populateReviewItemsForConcept', () => {
    it('does nothing when the concept has no questions', async () => {
      questionRepo.find.mockResolvedValue([]);

      await service.populateReviewItemsForConcept('user-1', 'concept-1');

      expect(reviewRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('inserts one review item per question, due tomorrow, ignoring conflicts', async () => {
      questionRepo.find.mockResolvedValue([
        makeQuestion({ id: 'q1' }),
        makeQuestion({ id: 'q2' }),
      ]);
      const qb: MockQueryBuilder = createMockQueryBuilder({});
      reviewRepo.createQueryBuilder.mockReturnValue(qb);

      await service.populateReviewItemsForConcept('user-1', 'concept-1');

      expect(reviewRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(qb.orIgnore).toHaveBeenCalledTimes(2);
      expect(qb.execute).toHaveBeenCalledTimes(2);
      expect(qb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          intervalDays: 1,
          correctStreak: 0,
          dueDate: '2026-08-26',
        }),
      );
    });
  });

  describe('getDueReviewItems', () => {
    it('maps due items and strips isCorrect from options (sorted)', async () => {
      reviewRepo.find.mockResolvedValue([
        makeReviewItem({
          mcqQuestion: makeQuestion({
            options: [
              makeOption({ id: 'b', isCorrect: true, orderIndex: 2 }),
              makeOption({ id: 'a', isCorrect: false, orderIndex: 1 }),
            ],
          }),
        } as any),
      ]);

      const result = await service.getDueReviewItems('user-1');

      expect(result[0].question.options).toEqual([
        { id: 'a', optionText: 'An option', orderIndex: 1 },
        { id: 'b', optionText: 'An option', orderIndex: 2 },
      ]);
    });
  });

  describe('getDueCount', () => {
    it('returns the count under both keys', async () => {
      reviewRepo.count.mockResolvedValue(4);

      await expect(service.getDueCount('user-1')).resolves.toEqual({
        count: 4,
        dueCount: 4,
      });
    });
  });

  describe('date helpers', () => {
    it('compute UTC calendar dates from the fixed clock', () => {
      const svc = service as any;
      expect(svc.getTodayDateString()).toBe('2026-08-25');
      expect(svc.getTomorrowDateString()).toBe('2026-08-26');
      expect(svc.getFutureDateString(7)).toBe('2026-09-01');
    });
  });
});
