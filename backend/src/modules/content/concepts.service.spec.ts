import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ConceptsService } from './concepts.service';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser, makeConcept } from '../../common/testing/factories';

describe('ConceptsService', () => {
  let service: ConceptsService;
  let conceptRepo: MockRepository;
  let moduleConceptRepo: MockRepository;

  const owner = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const otherDeveloper = makeUser({
    id: 'developer-2',
    role: UserRole.DEVELOPER,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConceptsService,
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConcept),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(ConceptsService);
    conceptRepo = module.get(getRepositoryToken(Concept));
    moduleConceptRepo = module.get(getRepositoryToken(ModuleConcept));
  });

  afterEach(() => jest.clearAllMocks());

  const approvedConcept = (overrides = {}) =>
    makeConcept({
      authorId: 'author-1',
      content: 'Original concept content.',
      reviewStatus: ConceptReviewStatus.APPROVED,
      rejectionReason: 'was rejected once',
      reviewedByUserId: 'admin-1',
      ...overrides,
    });

  describe('updateConcept — review re-trigger', () => {
    it('resets an approved concept to PENDING on a significant edit and clears review fields', async () => {
      conceptRepo.findOne.mockResolvedValue(approvedConcept());

      const result = await service.updateConcept('concept-1', owner, {
        content: 'X'.repeat(80),
      } as any);

      expect(result.reviewStatus).toBe(ConceptReviewStatus.PENDING);
      expect(result.rejectionReason).toBeNull();
      expect(result.reviewedByUserId).toBeNull();
      expect(result.reviewedAt).toBeNull();
    });

    it('keeps an approved concept approved on a trivial edit', async () => {
      conceptRepo.findOne.mockResolvedValue(approvedConcept());

      const result = await service.updateConcept('concept-1', owner, {
        content: 'Original concept content..',
      } as any);

      expect(result.reviewStatus).toBe(ConceptReviewStatus.APPROVED);
    });

    it('forces re-review when the edit is flagged AI-generated, even if unchanged', async () => {
      conceptRepo.findOne.mockResolvedValue(approvedConcept());

      const result = await service.updateConcept('concept-1', owner, {
        content: 'Original concept content.',
        isAiGenerated: true,
      } as any);

      expect(result.reviewStatus).toBe(ConceptReviewStatus.PENDING);
      expect(result.isAiGenerated).toBe(true);
    });

    it('forbids a non-owner from editing', async () => {
      conceptRepo.findOne.mockResolvedValue(
        approvedConcept({ authorId: 'someone-else' }),
      );

      await expect(
        service.updateConcept(
          'concept-1',
          otherDeveloper,
          { content: 'x' } as any,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound for a missing concept', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateConcept('missing', owner, { content: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('checkContentCreator', () => {
    it('allows an admin', async () => {
      await expect(service.checkContentCreator(admin)).resolves.toBeUndefined();
    });

    it('allows a developer', async () => {
      await expect(service.checkContentCreator(owner)).resolves.toBeUndefined();
    });
  });

  describe('findConceptById — visibility gate', () => {
    it('hides an unapproved concept from a non-author developer (404)', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );

      await expect(
        service.findConceptById('concept-1', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('shows an approved concept to a developer', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.findConceptById('concept-1', otherDeveloper),
      ).resolves.toMatchObject({ id: 'concept-1', appearsIn: [] });
    });

    it('shows an unapproved concept to its author', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.findConceptById('concept-1', owner),
      ).resolves.toBeDefined();
    });

    it('shows an unapproved concept to an admin', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.PENDING,
        }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.findConceptById('concept-1', admin),
      ).resolves.toBeDefined();
    });
  });

  describe('findAllConcepts — visibility filtering', () => {
    it('restricts developers to approved concepts plus their own drafts', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts(undefined, otherDeveloper);

      expect(conceptRepo.find).toHaveBeenCalledWith({
        where: [
          { reviewStatus: ConceptReviewStatus.APPROVED },
          { authorId: 'developer-2' },
        ],
      });
    });

    it('returns everything for an admin', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts(undefined, admin);

      expect(conceptRepo.find).toHaveBeenCalledWith();
    });

    it('adds the visibility filter to a developer search', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts('sql', otherDeveloper);

      expect(conceptRepo.find).toHaveBeenCalledWith({
        where: expect.arrayContaining([
          expect.objectContaining({
            reviewStatus: ConceptReviewStatus.APPROVED,
          }),
          expect.objectContaining({ authorId: 'developer-2' }),
        ]),
      });
    });
  });
});
