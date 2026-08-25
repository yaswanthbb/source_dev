import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { ProgressService } from './progress.service';
import { UserConceptProgress } from './entities/user-concept-progress.entity';
import { Concept } from '../content/entities/concept.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../content/entities/module-concept-prerequisite.entity';
import { GamificationService } from '../gamification/gamification.service';
import { ReviewService } from '../review/review.service';

import { ProgressStatus } from '../../common/enums/progress-status.enum';
import { XpSource } from '../../common/enums/xp-source.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeConcept, makeProgress } from '../../common/testing/factories';

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepo: MockRepository;
  let conceptRepo: MockRepository;
  let roadmapRepo: MockRepository;
  let gamification: {
    awardXpForConceptCompletion: jest.Mock;
    updateStreak: jest.Mock;
    checkAndAwardBadges: jest.Mock;
  };
  let review: { populateReviewItemsForConcept: jest.Mock };

  beforeEach(async () => {
    gamification = {
      awardXpForConceptCompletion: jest.fn(),
      updateStreak: jest.fn(),
      checkAndAwardBadges: jest.fn(),
    };
    review = { populateReviewItemsForConcept: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(UserConceptProgress),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Roadmap),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConcept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConceptPrerequisite),
          useValue: createMockRepository(),
        },
        { provide: GamificationService, useValue: gamification },
        { provide: ReviewService, useValue: review },
      ],
    }).compile();

    service = module.get(ProgressService);
    progressRepo = module.get(getRepositoryToken(UserConceptProgress));
    conceptRepo = module.get(getRepositoryToken(Concept));
    roadmapRepo = module.get(getRepositoryToken(Roadmap));
  });

  afterEach(() => jest.clearAllMocks());

  describe('markConceptCompleted', () => {
    it('throws NotFound when the concept is missing', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.markConceptCompleted('user-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('fans out XP, streak, badges, and review seeding on a new completion', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(null);

      await service.markConceptCompleted('user-1', 'concept-1');

      expect(gamification.awardXpForConceptCompletion).toHaveBeenCalledWith(
        'user-1',
        'concept-1',
        XpSource.ASSIGNMENT_PASSED,
      );
      expect(gamification.updateStreak).toHaveBeenCalledWith('user-1');
      expect(gamification.checkAndAwardBadges).toHaveBeenCalledWith('user-1');
      expect(review.populateReviewItemsForConcept).toHaveBeenCalledWith(
        'user-1',
        'concept-1',
      );
    });

    it('promotes an in-progress record and still fans out', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(
        makeProgress({ status: ProgressStatus.IN_PROGRESS }),
      );

      await service.markConceptCompleted('user-1', 'concept-1');

      expect(progressRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProgressStatus.COMPLETED }),
      );
      expect(gamification.awardXpForConceptCompletion).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — a second completion neither saves nor re-fans-out', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(
        makeProgress({ status: ProgressStatus.COMPLETED }),
      );

      await service.markConceptCompleted('user-1', 'concept-1');

      expect(progressRepo.save).not.toHaveBeenCalled();
      expect(gamification.awardXpForConceptCompletion).not.toHaveBeenCalled();
      expect(review.populateReviewItemsForConcept).not.toHaveBeenCalled();
    });
  });

  describe('markConceptStarted', () => {
    it('creates an IN_PROGRESS record when none exists', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(null);

      await service.markConceptStarted('user-1', 'concept-1');

      expect(progressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProgressStatus.IN_PROGRESS }),
      );
      expect(progressRepo.save).toHaveBeenCalledTimes(1);
    });

    it('never downgrades an already IN_PROGRESS record', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(
        makeProgress({ status: ProgressStatus.IN_PROGRESS }),
      );

      await service.markConceptStarted('user-1', 'concept-1');

      expect(progressRepo.save).not.toHaveBeenCalled();
    });

    it('never downgrades a COMPLETED record', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(
        makeProgress({ status: ProgressStatus.COMPLETED }),
      );

      await service.markConceptStarted('user-1', 'concept-1');

      expect(progressRepo.save).not.toHaveBeenCalled();
    });

    it('promotes a NOT_STARTED record to IN_PROGRESS', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      progressRepo.findOne.mockResolvedValue(
        makeProgress({ status: ProgressStatus.NOT_STARTED }),
      );

      await service.markConceptStarted('user-1', 'concept-1');

      expect(progressRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProgressStatus.IN_PROGRESS }),
      );
    });
  });

  describe('getRoadmapProgress', () => {
    it('throws NotFound when the roadmap is missing', async () => {
      roadmapRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getRoadmapProgress('user-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns zeros when no approved concepts exist', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        title: 'R',
        modules: [
          {
            orderIndex: 1,
            moduleConcepts: [
              {
                conceptId: 'cP',
                orderIndex: 1,
                concept: { reviewStatus: ConceptReviewStatus.PENDING },
                prerequisites: [],
              },
            ],
          },
        ],
      });

      const result = await service.getRoadmapProgress('user-1', 'r1');

      expect(result).toMatchObject({ totalConcepts: 0, percentage: 0 });
    });

    it('counts only approved concepts, rounds the percentage, and flags completed prerequisites', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        title: 'R',
        modules: [
          {
            orderIndex: 1,
            moduleConcepts: [
              {
                conceptId: 'cA',
                orderIndex: 1,
                concept: {
                  reviewStatus: ConceptReviewStatus.APPROVED,
                  title: 'A',
                  slug: 'a',
                },
                prerequisites: [],
              },
              {
                conceptId: 'cB',
                orderIndex: 2,
                concept: {
                  reviewStatus: ConceptReviewStatus.APPROVED,
                  title: 'B',
                  slug: 'b',
                },
                prerequisites: [
                  {
                    prerequisiteModuleConcept: {
                      conceptId: 'cA',
                      orderIndex: 1,
                      concept: { title: 'A', slug: 'a' },
                    },
                  },
                ],
              },
              {
                conceptId: 'cP',
                orderIndex: 3,
                concept: { reviewStatus: ConceptReviewStatus.PENDING },
                prerequisites: [],
              },
            ],
          },
        ],
      });
      // Only concept cA is completed by this user.
      progressRepo.find.mockResolvedValue([
        makeProgress({ conceptId: 'cA', status: ProgressStatus.COMPLETED }),
      ]);

      const result: any = await service.getRoadmapProgress('user-1', 'r1');

      expect(result.totalConcepts).toBe(2); // cP filtered out
      expect(result.completedConcepts).toBe(1);
      expect(result.percentage).toBe(50);
      expect(result.concepts).toHaveLength(2);

      const conceptB = result.concepts.find((c: any) => c.conceptId === 'cB');
      expect(conceptB.prerequisites[0].isCompletedByCurrentUser).toBe(true);
    });
  });
});
