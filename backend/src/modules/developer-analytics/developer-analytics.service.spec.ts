import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';

import { DeveloperAnalyticsService } from './developer-analytics.service';
import { User } from '../users/entities/user.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';

import { UserRole } from '../../common/enums/user-role.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

describe('DeveloperAnalyticsService', () => {
  let service: DeveloperAnalyticsService;
  let roadmapRepo: MockRepository;
  let conceptRepo: MockRepository;
  let progressRepo: MockRepository;
  let answerRepo: MockRepository;
  let mcqRepo: MockRepository;
  let mcqAttemptRepo: MockRepository;

  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const developer = makeUser({ id: 'd1', role: UserRole.DEVELOPER });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeveloperAnalyticsService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Roadmap),
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
          provide: getRepositoryToken(Answer),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqAttempt),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(DeveloperAnalyticsService);
    roadmapRepo = module.get(getRepositoryToken(Roadmap));
    conceptRepo = module.get(getRepositoryToken(Concept));
    progressRepo = module.get(getRepositoryToken(UserConceptProgress));
    answerRepo = module.get(getRepositoryToken(Answer));
    mcqRepo = module.get(getRepositoryToken(McqQuestion));
    mcqAttemptRepo = module.get(getRepositoryToken(McqAttempt));
  });

  afterEach(() => jest.clearAllMocks());

  describe('checkDeveloperAccess', () => {
    it('allows an admin', async () => {
      await expect(
        service.checkDeveloperAccess(admin),
      ).resolves.toBeUndefined();
    });

    it('allows a developer', async () => {
      await expect(
        service.checkDeveloperAccess(developer),
      ).resolves.toBeUndefined();
    });

    it('forbids any other role', async () => {
      const ghost = makeUser({ role: 'ghost' as never });

      await expect(service.checkDeveloperAccess(ghost)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('getOverview', () => {
    it('assembles the overview and coerces the engaged-developers count', async () => {
      roadmapRepo.count.mockResolvedValue(2);
      conceptRepo.count.mockResolvedValue(5);
      answerRepo.count.mockResolvedValue(1);
      mcqRepo.count.mockResolvedValue(3);
      progressRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { count: '6' } }),
      );

      const result = await service.getOverview(admin);

      expect(result).toEqual({
        roadmapsCreated: 2,
        conceptsAuthored: 5,
        questionsAnswered: 1,
        mcqQuestionsCreated: 3,
        developersEngaged: 6,
      });
    });
  });

  describe('getQuizQuestions', () => {
    it('computes correctRate, picks the top missed option per question, and sorts worst-first', async () => {
      mcqRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({
          rawMany: [
            {
              questionId: 'q1',
              questionText: 'Q1?',
              conceptTitle: 'Concept A',
              totalAttempts: '10',
              correctAttempts: '2',
            },
            {
              questionId: 'q2',
              questionText: 'Q2?',
              conceptTitle: 'Concept A',
              totalAttempts: '4',
              correctAttempts: '3',
            },
            {
              questionId: 'q3',
              questionText: 'Q3?',
              conceptTitle: 'Concept B',
              totalAttempts: '3',
              correctAttempts: '1',
            },
          ],
        }),
      );
      // Rows arrive already ordered by the SQL (count desc, order_index asc);
      // the service keeps only the first row it sees per question.
      mcqAttemptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({
          rawMany: [
            {
              questionId: 'q1',
              optionId: 'o1',
              optionText: 'Wrong A',
              orderIndex: 0,
              selectedCount: '8',
            },
            {
              questionId: 'q1',
              optionId: 'o2',
              optionText: 'Wrong B',
              orderIndex: 1,
              selectedCount: '3',
            },
            {
              questionId: 'q2',
              optionId: 'o3',
              optionText: 'Wrong C',
              orderIndex: 2,
              selectedCount: '1',
            },
          ],
        }),
      );

      const result = await service.getQuizQuestions(admin);

      // correctRate: q1=20, q2=75, q3=33 → ascending order [q1, q3, q2].
      expect(result.map((r) => r.questionId)).toEqual(['q1', 'q3', 'q2']);
      expect(result.map((r) => r.correctRate)).toEqual([20, 33, 75]);

      const q1 = result.find((r) => r.questionId === 'q1')!;
      expect(q1.mostMissedOption).toEqual({
        optionText: 'Wrong A',
        selectedCount: 8,
      });

      // q3 had no incorrect-option rows.
      const q3 = result.find((r) => r.questionId === 'q3')!;
      expect(q3.mostMissedOption).toBeNull();
    });

    it('returns an empty list and skips the option query when nothing was attempted', async () => {
      mcqRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [] }),
      );

      const result = await service.getQuizQuestions(admin);

      expect(result).toEqual([]);
      expect(mcqAttemptRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
