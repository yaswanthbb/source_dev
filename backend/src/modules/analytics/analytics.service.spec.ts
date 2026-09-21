import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { ProgressStatus } from '../../common/enums/progress-status.enum';
import { ConceptDifficulty } from '../../common/enums/concept-difficulty.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser, makeConcept } from '../../common/testing/factories';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let userRepo: MockRepository;
  let roadmapRepo: MockRepository;
  let moduleRepo: MockRepository;
  let conceptRepo: MockRepository;
  let progressRepo: MockRepository;
  let xpRepo: MockRepository;
  let answerRepo: MockRepository;
  let mcqRepo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Roadmap),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleEntity),
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
        {
          provide: getRepositoryToken(XpEvent),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    userRepo = module.get(getRepositoryToken(User));
    roadmapRepo = module.get(getRepositoryToken(Roadmap));
    moduleRepo = module.get(getRepositoryToken(ModuleEntity));
    conceptRepo = module.get(getRepositoryToken(Concept));
    progressRepo = module.get(getRepositoryToken(UserConceptProgress));
    xpRepo = module.get(getRepositoryToken(XpEvent));
    answerRepo = module.get(getRepositoryToken(Answer));
    mcqRepo = module.get(getRepositoryToken(McqQuestion));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getOverviewAnalytics', () => {
    it('aggregates platform-wide counts and coerces raw SQL strings to numbers', async () => {
      // count() is called twice: DEVELOPER total, then ADMIN total.
      userRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
      roadmapRepo.count.mockResolvedValue(5);
      moduleRepo.count.mockResolvedValue(10);
      conceptRepo.count.mockResolvedValue(20);
      // Two progress builders in order: completions (getCount) then active (getRawOne).
      progressRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQueryBuilder({ count: 7 }))
        .mockReturnValueOnce(createMockQueryBuilder({ raw: { count: '4' } }));
      xpRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { sum: '999' } }),
      );

      const result = await service.getOverviewAnalytics();

      expect(result).toEqual({
        totalDevelopers: 3,
        totalAdmins: 1,
        totalRoadmaps: 5,
        totalModules: 10,
        totalConcepts: 20,
        totalConceptCompletions: 7,
        activeDevelopers: 4,
        totalXpAwarded: 999,
      });
    });

    it('defaults the active-developer and XP sums to zero when the raw query returns nothing', async () => {
      userRepo.count.mockResolvedValue(0);
      roadmapRepo.count.mockResolvedValue(0);
      moduleRepo.count.mockResolvedValue(0);
      conceptRepo.count.mockResolvedValue(0);
      progressRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQueryBuilder({ count: 0 }))
        .mockReturnValueOnce(createMockQueryBuilder({ raw: undefined }));
      xpRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: undefined }),
      );

      const result = await service.getOverviewAnalytics();

      expect(result.activeDevelopers).toBe(0);
      expect(result.totalXpAwarded).toBe(0);
    });
  });

  describe('getRoadmapAnalytics', () => {
    it('reports zeros for a roadmap with no concepts and skips the progress query', async () => {
      roadmapRepo.find.mockResolvedValue([
        { id: 'r0', title: 'Empty', modules: [] },
      ]);

      const result = await service.getRoadmapAnalytics();

      expect(result[0]).toEqual({
        roadmapId: 'r0',
        title: 'Empty',
        totalConcepts: 0,
        totalEnrolledDevelopers: 0,
        averageCompletionPercentage: 0,
        totalCompletedConcepts: 0,
      });
      expect(progressRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('dedupes concept ids and rounds the average completion to two decimals', async () => {
      roadmapRepo.find.mockResolvedValue([
        {
          id: 'r1',
          title: 'Roadmap One',
          modules: [
            { moduleConcepts: [{ conceptId: 'c1' }, { conceptId: 'c2' }] },
            // c1 repeats across modules — it must be counted once.
            { moduleConcepts: [{ conceptId: 'c3' }, { conceptId: 'c1' }] },
          ],
        },
      ]);
      // Developer A finished 2 of 3 concepts; developer B has one in-progress (0 done).
      progressRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({
          many: [
            { userId: 'sA', status: ProgressStatus.COMPLETED },
            { userId: 'sA', status: ProgressStatus.COMPLETED },
            { userId: 'sB', status: ProgressStatus.IN_PROGRESS },
          ],
        }),
      );

      const result = await service.getRoadmapAnalytics();

      expect(result[0]).toEqual({
        roadmapId: 'r1',
        title: 'Roadmap One',
        totalConcepts: 3,
        totalEnrolledDevelopers: 2,
        // A = (2/3)*100 = 66.67, B = 0; mean = 33.33 after rounding.
        averageCompletionPercentage: 33.33,
        totalCompletedConcepts: 2,
      });
    });
  });

  describe('getConceptAnalytics', () => {
    it('groups progress rows into per-concept counts sorted by completions desc', async () => {
      progressRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({
          rawMany: [
            { conceptId: 'c1', status: ProgressStatus.COMPLETED, count: '5' },
            { conceptId: 'c1', status: ProgressStatus.IN_PROGRESS, count: '2' },
            { conceptId: 'c2', status: ProgressStatus.COMPLETED, count: '10' },
          ],
        }),
      );
      conceptRepo.find.mockResolvedValue([
        makeConcept({
          id: 'c1',
          title: 'C1',
          difficulty: ConceptDifficulty.EASY,
        }),
        makeConcept({
          id: 'c2',
          title: 'C2',
          difficulty: ConceptDifficulty.HARD,
        }),
      ]);

      const result = await service.getConceptAnalytics();

      // c2 (10 completions) outranks c1 (5).
      expect(result.map((r) => r.conceptId)).toEqual(['c2', 'c1']);
      expect(result[1]).toEqual({
        conceptId: 'c1',
        title: 'C1',
        difficulty: ConceptDifficulty.EASY,
        completionCount: 5,
        startedButNotCompletedCount: 2,
      });
    });

    it('returns an empty list without hitting the concept table when there is no progress', async () => {
      progressRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [] }),
      );

      const result = await service.getConceptAnalytics();

      expect(result).toEqual([]);
      expect(conceptRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('getDeveloperAnalytics', () => {
    it('counts authored artifacts per developer', async () => {
      userRepo.find.mockResolvedValue([
        makeUser({
          id: 'd1',
          name: 'Dev',
          email: 'dev@test.dev',
          role: UserRole.DEVELOPER,
        }),
      ]);
      roadmapRepo.count.mockResolvedValue(2);
      conceptRepo.count.mockResolvedValue(7);
      answerRepo.count.mockResolvedValue(3);
      mcqRepo.count.mockResolvedValue(4);

      const result = await service.getDeveloperAnalytics();

      expect(result).toEqual([
        {
          developerId: 'd1',
          name: 'Dev',
          email: 'dev@test.dev',
          roadmapsCreated: 2,
          conceptsAuthored: 7,
          questionsAnswered: 3,
          mcqQuestionsCreated: 4,
        },
      ]);
    });
  });
});
