import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ConceptsService } from './concepts.service';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
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
  let instructorProfileRepo: MockRepository;

  const owner = makeUser({ id: 'author-1', role: UserRole.INSTRUCTOR });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const student = makeUser({ id: 'student-1', role: UserRole.STUDENT });

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
        {
          provide: getRepositoryToken(InstructorProfile),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(ConceptsService);
    conceptRepo = module.get(getRepositoryToken(Concept));
    moduleConceptRepo = module.get(getRepositoryToken(ModuleConcept));
    instructorProfileRepo = module.get(getRepositoryToken(InstructorProfile));
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
        service.updateConcept('concept-1', student, { content: 'x' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound for a missing concept', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateConcept('missing', owner, { content: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('checkApprovedContentCreator', () => {
    it('allows an admin', async () => {
      await expect(
        service.checkApprovedContentCreator(admin),
      ).resolves.toBeUndefined();
    });

    it('allows an approved instructor', async () => {
      instructorProfileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.APPROVED,
      });

      await expect(
        service.checkApprovedContentCreator(owner),
      ).resolves.toBeUndefined();
    });

    it('forbids an instructor who is not approved', async () => {
      instructorProfileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.PENDING,
      });

      await expect(
        service.checkApprovedContentCreator(owner),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids a plain student', async () => {
      await expect(
        service.checkApprovedContentCreator(student),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findConceptById — student visibility gate', () => {
    it('hides an unapproved concept from a student (404)', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );

      await expect(
        service.findConceptById('concept-1', student),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('shows an approved concept to a student', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.findConceptById('concept-1', student),
      ).resolves.toMatchObject({ id: 'concept-1', appearsIn: [] });
    });

    it('shows an unapproved concept to its author/instructor', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.findConceptById('concept-1', owner),
      ).resolves.toBeDefined();
    });
  });

  describe('findAllConcepts — student filtering', () => {
    it('restricts students to approved concepts', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts(undefined, student);

      expect(conceptRepo.find).toHaveBeenCalledWith({
        where: { reviewStatus: ConceptReviewStatus.APPROVED },
      });
    });

    it('returns everything for a non-student', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts(undefined, owner);

      expect(conceptRepo.find).toHaveBeenCalledWith();
    });

    it('adds the approved filter to a student search', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts('sql', student);

      expect(conceptRepo.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      });
    });
  });
});
