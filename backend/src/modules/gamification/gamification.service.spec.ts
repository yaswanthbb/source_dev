import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GamificationService } from './gamification.service';
import { XpEvent } from './entities/xp-event.entity';
import { Streak } from './entities/streak.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';

import { ConceptDifficulty } from '../../common/enums/concept-difficulty.enum';
import { XpSource } from '../../common/enums/xp-source.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../common/testing/mock-repository';
import {
  makeBadge,
  makeConcept,
  makeStreak,
  makeUserBadge,
  makeXpEvent,
} from '../../common/testing/factories';

describe('GamificationService', () => {
  let service: GamificationService;
  let xpRepo: MockRepository;
  let streakRepo: MockRepository;
  let badgeRepo: MockRepository;
  let userBadgeRepo: MockRepository;
  let conceptRepo: MockRepository;
  let progressRepo: MockRepository;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: getRepositoryToken(XpEvent),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Streak),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserBadge),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserConceptProgress),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(GamificationService);
    xpRepo = module.get(getRepositoryToken(XpEvent));
    streakRepo = module.get(getRepositoryToken(Streak));
    badgeRepo = module.get(getRepositoryToken(Badge));
    userBadgeRepo = module.get(getRepositoryToken(UserBadge));
    conceptRepo = module.get(getRepositoryToken(Concept));
    progressRepo = module.get(getRepositoryToken(UserConceptProgress));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('awardXpForConceptCompletion', () => {
    it.each<[ConceptDifficulty, number]>([
      [ConceptDifficulty.EASY, 10],
      [ConceptDifficulty.MEDIUM, 20],
      [ConceptDifficulty.HARD, 35],
    ])('awards %s difficulty as %i XP', async (difficulty, expectedXp) => {
      conceptRepo.findOne.mockResolvedValue(makeConcept({ difficulty }));
      xpRepo.findOne.mockResolvedValue(null);

      await service.awardXpForConceptCompletion(
        'user-1',
        'concept-1',
        XpSource.ASSIGNMENT_PASSED,
      );

      expect(xpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          sourceId: 'concept-1',
          sourceType: XpSource.ASSIGNMENT_PASSED,
          xpAmount: expectedXp,
        }),
      );
      expect(xpRepo.save).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the concept does not exist', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await service.awardXpForConceptCompletion(
        'user-1',
        'missing',
        XpSource.ASSIGNMENT_PASSED,
      );

      expect(xpRepo.create).not.toHaveBeenCalled();
      expect(xpRepo.save).not.toHaveBeenCalled();
    });

    it('is idempotent — a prior XP event for the same concept blocks a second award', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      xpRepo.findOne.mockResolvedValue(makeXpEvent());

      await service.awardXpForConceptCompletion(
        'user-1',
        'concept-1',
        XpSource.ASSIGNMENT_PASSED,
      );

      expect(xpRepo.create).not.toHaveBeenCalled();
      expect(xpRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStreak', () => {
    it('creates a fresh streak at 1/1 when none exists', async () => {
      streakRepo.findOne.mockResolvedValue(null);

      await service.updateStreak('user-1');

      expect(streakRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: '2026-08-25',
      });
      expect(streakRepo.save).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when already active today', async () => {
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastActivityDate: '2026-08-25',
          currentStreak: 3,
          longestStreak: 5,
        }),
      );

      await service.updateStreak('user-1');

      expect(streakRepo.save).not.toHaveBeenCalled();
    });

    it('increments the streak when the last activity was yesterday', async () => {
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastActivityDate: '2026-08-24',
          currentStreak: 2,
          longestStreak: 2,
        }),
      );

      await service.updateStreak('user-1');

      expect(streakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 3,
          longestStreak: 3,
          lastActivityDate: '2026-08-25',
        }),
      );
    });

    it('resets the current streak after a gap but keeps the longest', async () => {
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastActivityDate: '2026-08-20',
          currentStreak: 9,
          longestStreak: 9,
        }),
      );

      await service.updateStreak('user-1');

      expect(streakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 1,
          longestStreak: 9,
          lastActivityDate: '2026-08-25',
        }),
      );
    });
  });

  describe('checkAndAwardBadges', () => {
    const primeXp = (sum: string | undefined) =>
      xpRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({
          raw: sum === undefined ? undefined : { sum },
        }),
      );

    it('returns early and reads nothing else when no badges are configured', async () => {
      badgeRepo.find.mockResolvedValue([]);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.find).not.toHaveBeenCalled();
      expect(userBadgeRepo.save).not.toHaveBeenCalled();
    });

    it('awards a concept-count badge once its threshold is reached', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'b1', criteriaKey: 'first_concept' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([]);
      progressRepo.count.mockResolvedValue(1);
      streakRepo.findOne.mockResolvedValue(null);
      primeXp('0');

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        badgeId: 'b1',
      });
      expect(userBadgeRepo.save).toHaveBeenCalledTimes(1);
    });

    it('does not re-award a badge the user already earned', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'b1', criteriaKey: 'first_concept' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([makeUserBadge({ badgeId: 'b1' })]);
      progressRepo.count.mockResolvedValue(1);
      streakRepo.findOne.mockResolvedValue(null);
      primeXp('0');

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.save).not.toHaveBeenCalled();
    });

    it('respects the exact concept-count threshold (4 → no, 5 → yes)', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'b5', criteriaKey: 'five_concepts' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([]);
      streakRepo.findOne.mockResolvedValue(null);
      primeXp('0');

      progressRepo.count.mockResolvedValue(4);
      await service.checkAndAwardBadges('user-1');
      expect(userBadgeRepo.save).not.toHaveBeenCalled();

      progressRepo.count.mockResolvedValue(5);
      await service.checkAndAwardBadges('user-1');
      expect(userBadgeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ badgeId: 'b5' }),
      );
    });

    it('awards streak badges from the current streak', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'b3', criteriaKey: 'three_day_streak' }),
        makeBadge({ id: 'b7', criteriaKey: 'seven_day_streak' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([]);
      progressRepo.count.mockResolvedValue(0);
      streakRepo.findOne.mockResolvedValue(makeStreak({ currentStreak: 3 }));
      primeXp('0');

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.save).toHaveBeenCalledTimes(1);
      expect(userBadgeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ badgeId: 'b3' }),
      );
    });

    it('awards XP badges from the summed XP', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'h', criteriaKey: 'hundred_xp' }),
        makeBadge({ id: 'f', criteriaKey: 'five_hundred_xp' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([]);
      progressRepo.count.mockResolvedValue(0);
      streakRepo.findOne.mockResolvedValue(null);
      primeXp('100');

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.save).toHaveBeenCalledTimes(1);
      expect(userBadgeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ badgeId: 'h' }),
      );
    });

    it('treats a null XP SUM as zero (no XP badge)', async () => {
      badgeRepo.find.mockResolvedValue([
        makeBadge({ id: 'h', criteriaKey: 'hundred_xp' }),
      ]);
      userBadgeRepo.find.mockResolvedValue([]);
      progressRepo.count.mockResolvedValue(0);
      streakRepo.findOne.mockResolvedValue(null);
      primeXp(undefined);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getActivityHeatmap', () => {
    it('returns one entry per requested day, flagging active days from XP rows', async () => {
      xpRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [{ date: '2026-08-25' }] }),
      );

      const result = await service.getActivityHeatmap('user-1', 5);

      expect(result).toHaveLength(5);
      expect(result[result.length - 1]).toEqual({
        date: '2026-08-25',
        active: true,
      });
      expect(result[0].active).toBe(false);
    });

    it('clamps the window to a maximum of 90 days', async () => {
      xpRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder({}));

      const result = await service.getActivityHeatmap('user-1', 1000);

      expect(result).toHaveLength(90);
    });

    it('falls back to 14 days for a falsy day count', async () => {
      xpRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder({}));

      const result = await service.getActivityHeatmap('user-1', 0);

      expect(result).toHaveLength(14);
    });
  });
});
