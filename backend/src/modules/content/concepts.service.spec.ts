import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

import { ConceptsService } from './concepts.service';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
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
    // Default: no published placements (not live). Draft/live tests override.
    moduleConceptRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder({ one: undefined }),
    );
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
    const publishedPlacement = [
      { module: { roadmap: { reviewStatus: RoadmapReviewStatus.PUBLISHED } } },
    ];

    beforeEach(() => {
      moduleConceptRepo.find.mockResolvedValue([]);
    });

    it('hides an unapproved concept from a non-author developer (404)', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );

      await expect(
        service.findConceptById('concept-1', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides an approved concept with no published placement (404)', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.APPROVED }),
      );

      await expect(
        service.findConceptById('concept-1', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('shows an approved concept with a published placement', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      // First find() call feeds the visibility check, the second feeds appearsIn.
      moduleConceptRepo.find
        .mockResolvedValueOnce(publishedPlacement)
        .mockResolvedValueOnce([]);

      await expect(
        service.findConceptById('concept-1', otherDeveloper),
      ).resolves.toMatchObject({ id: 'concept-1', appearsIn: [] });
    });

    it('hides the staged draft from non-authors (live body only)', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.APPROVED,
          draftContent: 'staged rewrite',
        }),
      );
      moduleConceptRepo.find
        .mockResolvedValueOnce(publishedPlacement)
        .mockResolvedValueOnce([]);

      const result: any = await service.findConceptById(
        'concept-1',
        otherDeveloper,
      );

      expect(result.draftContent).toBeNull();
      expect(result.content).toBe('Original concept content.');
    });

    it('shows the staged draft to the author', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          reviewStatus: ConceptReviewStatus.APPROVED,
          draftContent: 'staged rewrite',
        }),
      );
      moduleConceptRepo.find
        .mockResolvedValueOnce(publishedPlacement)
        .mockResolvedValueOnce([]);

      const result: any = await service.findConceptById('concept-1', owner);

      expect(result.draftContent).toBe('staged rewrite');
    });

    it('shows an unapproved concept to its author', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ reviewStatus: ConceptReviewStatus.PENDING }),
      );

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

      await expect(
        service.findConceptById('concept-1', admin),
      ).resolves.toBeDefined();
    });
  });

  describe('findAllConcepts — visibility filtering', () => {
    it('shows developers approved concepts with published placements plus their own drafts', async () => {
      const approvedPub = makeConcept({
        id: 'c-pub',
        authorId: 'someone-else',
        reviewStatus: ConceptReviewStatus.APPROVED,
      });
      const approvedUnpub = makeConcept({
        id: 'c-unpub',
        authorId: 'someone-else',
        reviewStatus: ConceptReviewStatus.APPROVED,
      });
      const ownDraft = makeConcept({
        id: 'c-draft',
        authorId: 'developer-2',
        reviewStatus: ConceptReviewStatus.PENDING,
      });
      conceptRepo.find
        .mockResolvedValueOnce([approvedPub, approvedUnpub])
        .mockResolvedValueOnce([ownDraft]);
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [{ conceptId: 'c-pub' }] }),
      );

      const result = await service.findAllConcepts(undefined, otherDeveloper);

      expect(result.map((c) => c.id).sort()).toEqual(['c-draft', 'c-pub']);
    });

    it('returns everything for an admin', async () => {
      conceptRepo.find.mockResolvedValue([]);

      await service.findAllConcepts(undefined, admin);

      expect(conceptRepo.find).toHaveBeenCalledWith();
    });

    it('filters a developer search by title', async () => {
      const sqlConcept = makeConcept({
        id: 'c-sql',
        title: 'SQL Joins',
        authorId: 'someone-else',
        reviewStatus: ConceptReviewStatus.APPROVED,
      });
      conceptRepo.find
        .mockResolvedValueOnce([sqlConcept])
        .mockResolvedValueOnce([]);
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [{ conceptId: 'c-sql' }] }),
      );

      const result = await service.findAllConcepts('sql', otherDeveloper);

      expect(result.map((c) => c.id)).toEqual(['c-sql']);
    });
  });

  describe('findAllConcepts — origin label filter (§4)', () => {
    beforeEach(() => {
      conceptRepo.find
        .mockResolvedValueOnce([
          makeConcept({ id: 'c-ai', authorId: 'someone-else', isAiGenerated: true, reviewStatus: ConceptReviewStatus.APPROVED }),
          makeConcept({ id: 'c-hand', authorId: 'someone-else', isAiGenerated: false, reviewStatus: ConceptReviewStatus.APPROVED }),
        ])
        .mockResolvedValueOnce([]);
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [{ conceptId: 'c-ai' }, { conceptId: 'c-hand' }] }),
      );
    });

    it('attaches origin labels and filters to ai', async () => {
      const result: any[] = await service.findAllConcepts(
        undefined,
        otherDeveloper,
        'ai',
      );

      expect(result.map((c) => c.id)).toEqual(['c-ai']);
      expect(result[0].originLabel).toBe('ai');
    });

    it('filters to handwritten', async () => {
      const result: any[] = await service.findAllConcepts(
        undefined,
        otherDeveloper,
        'handwritten',
      );

      expect(result.map((c) => c.id)).toEqual(['c-hand']);
    });

    it('returns nothing for partial (concepts are never partial)', async () => {
      const result: any[] = await service.findAllConcepts(
        undefined,
        otherDeveloper,
        'partial',
      );

      expect(result).toEqual([]);
    });

    it('rejects an invalid label', async () => {
      await expect(
        service.findAllConcepts(undefined, otherDeveloper, 'human'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateConcept — draft/live split (§3.8)', () => {
    const liveConcept = () =>
      makeConcept({
        authorId: 'author-1',
        content: 'Original concept content.',
        reviewStatus: ConceptReviewStatus.APPROVED,
      });
    const publishedPlacement = () =>
      createMockQueryBuilder({ one: { id: 'mc1' } });

    it('stages a significant edit as a draft, keeping live approved', async () => {
      conceptRepo.findOne.mockResolvedValue(liveConcept());
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        publishedPlacement(),
      );

      const result = await service.updateConcept('concept-1', owner, {
        content: 'X'.repeat(80),
      } as any);

      expect(result.draftContent).toBe('X'.repeat(80));
      expect(result.content).toBe('Original concept content.');
      expect(result.reviewStatus).toBe(ConceptReviewStatus.APPROVED);
    });

    it('applies a small edit to a live concept directly', async () => {
      conceptRepo.findOne.mockResolvedValue(liveConcept());
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        publishedPlacement(),
      );

      const result = await service.updateConcept('concept-1', owner, {
        content: 'Original concept content..',
      } as any);

      expect(result.content).toBe('Original concept content..');
      expect(result.draftContent).toBeNull();
    });

    it('keeps the old pending-reset for non-live concepts', async () => {
      conceptRepo.findOne.mockResolvedValue(liveConcept());
      // No published placement → not live.
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ one: undefined }),
      );

      const result = await service.updateConcept('concept-1', owner, {
        content: 'X'.repeat(80),
      } as any);

      expect(result.reviewStatus).toBe(ConceptReviewStatus.PENDING);
      expect(result.draftContent).toBeNull();
    });
  });

  describe('deleteConcept — attached guard (§3.8)', () => {
    it('refuses to delete an attached concept', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      moduleConceptRepo.count.mockResolvedValue(1);

      await expect(
        service.deleteConcept('concept-1', admin),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(conceptRepo.remove).not.toHaveBeenCalled();
    });

    it('deletes a detached concept', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept());
      moduleConceptRepo.count.mockResolvedValue(0);

      await service.deleteConcept('concept-1', admin);

      expect(conceptRepo.remove).toHaveBeenCalled();
    });
  });
});
