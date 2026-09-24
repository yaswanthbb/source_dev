import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { RoadmapsService } from './roadmaps.service';
import { Roadmap } from './entities/roadmap.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { ModuleConceptPrerequisite } from './entities/module-concept-prerequisite.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';
import { RoadmapUnpublishStatus } from '../../common/enums/roadmap-unpublish-status.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser, makeConcept } from '../../common/testing/factories';

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let roadmapRepo: MockRepository;
  let moduleRepo: MockRepository;
  let conceptRepo: MockRepository;
  let moduleConceptRepo: MockRepository;
  let prereqRepo: MockRepository;
  let mcqRepo: MockRepository;

  const owner = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const otherDeveloper = makeUser({
    id: 'developer-2',
    role: UserRole.DEVELOPER,
  });

  // A module whose parent roadmap is owned by `owner`.
  const moduleWithOwner = () => ({
    id: 'm1',
    title: 'Module',
    roadmap: { createdById: 'author-1' },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
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
          provide: getRepositoryToken(ModuleConcept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConceptPrerequisite),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(RoadmapsService);
    roadmapRepo = module.get(getRepositoryToken(Roadmap));
    moduleRepo = module.get(getRepositoryToken(ModuleEntity));
    conceptRepo = module.get(getRepositoryToken(Concept));
    moduleConceptRepo = module.get(getRepositoryToken(ModuleConcept));
    prereqRepo = module.get(getRepositoryToken(ModuleConceptPrerequisite));
    mcqRepo = module.get(getRepositoryToken(McqQuestion));
  });

  afterEach(() => jest.clearAllMocks());

  describe('checkOwnership', () => {
    it('allows an admin regardless of owner', () => {
      expect(() => service.checkOwnership('someone-else', admin)).not.toThrow();
    });

    it('allows the owner', () => {
      expect(() => service.checkOwnership('author-1', owner)).not.toThrow();
    });

    it('forbids a non-owner non-admin', () => {
      expect(() =>
        service.checkOwnership('author-1', otherDeveloper),
      ).toThrow(ForbiddenException);
    });

    it('forbids when there is no owner id', () => {
      expect(() => service.checkOwnership(null, owner)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createRoadmap', () => {
    it('slugifies the title and persists for an admin', async () => {
      roadmapRepo.findOne.mockResolvedValue(null); // slug is unique

      await service.createRoadmap(admin, { title: 'My Roadmap' } as any);

      expect(roadmapRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-roadmap', title: 'My Roadmap' }),
      );
      expect(roadmapRepo.save).toHaveBeenCalledTimes(1);
    });

    it('disambiguates a slug that already exists', async () => {
      // First lookup finds a collision, second is free.
      roadmapRepo.findOne
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      await service.createRoadmap(admin, { title: 'My Roadmap' } as any);

      expect(roadmapRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-roadmap-1' }),
      );
    });
  });

  describe('calculateAndReserveOrderIndex', () => {
    it('appends to the end when no index is requested', async () => {
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { max: 3 } }),
      );

      const result = await service.calculateAndReserveOrderIndex('m1');

      expect(result).toBe(4);
      // Only the MAX query ran — no shift/update query builder.
      expect(moduleConceptRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('appends when the requested index is beyond the current max', async () => {
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { max: 3 } }),
      );

      const result = await service.calculateAndReserveOrderIndex('m1', 10);

      expect(result).toBe(4);
      expect(moduleConceptRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('treats an empty module (null max) as starting at 1', async () => {
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { max: null } }),
      );

      const result = await service.calculateAndReserveOrderIndex('m1');

      expect(result).toBe(1);
    });

    it('reserves an in-range index and shifts existing rows up', async () => {
      const maxQb = createMockQueryBuilder({ raw: { max: 3 } });
      const shiftQb = createMockQueryBuilder({ execute: {} });
      moduleConceptRepo.createQueryBuilder
        .mockReturnValueOnce(maxQb)
        .mockReturnValueOnce(shiftQb);

      const result = await service.calculateAndReserveOrderIndex('m1', 2);

      expect(result).toBe(2);
      expect(shiftQb.update).toHaveBeenCalled();
      expect(shiftQb.where).toHaveBeenCalledWith(
        'module_id = :moduleId AND order_index >= :targetIndex',
        { moduleId: 'm1', targetIndex: 2 },
      );
      expect(shiftQb.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('detachConceptFromModule', () => {
    it('throws NotFound when the module is missing', async () => {
      moduleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.detachConceptFromModule('m1', 'c1', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when the concept is not attached', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.detachConceptFromModule('m1', 'c1', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes the link and resequences the remaining concepts to 1..N', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne.mockResolvedValue({ id: 'mc-1' });
      // Remaining rows have gaps (2, 4); they must become 1, 2.
      moduleConceptRepo.find.mockResolvedValue([
        { id: 'mc-a', orderIndex: 2 },
        { id: 'mc-b', orderIndex: 4 },
      ]);

      await service.detachConceptFromModule('m1', 'c1', owner);

      expect(moduleConceptRepo.remove).toHaveBeenCalledWith({ id: 'mc-1' });
      expect(moduleConceptRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mc-a', orderIndex: 1 }),
      );
      expect(moduleConceptRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mc-b', orderIndex: 2 }),
      );
    });
  });

  describe('updateModuleConceptOrder', () => {
    const seedThree = () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.find.mockResolvedValue([
        { id: 'A', conceptId: 'cA', orderIndex: 1 },
        { id: 'B', conceptId: 'cB', orderIndex: 2 },
        { id: 'C', conceptId: 'cC', orderIndex: 3 },
      ]);
      const em = { update: jest.fn() };
      (moduleConceptRepo as any).manager = {
        transaction: jest.fn(async (cb: any) => cb(em)),
      };
      return em;
    };

    it('throws NotFound when the concept is not in the module', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.updateModuleConceptOrder('m1', 'cX', owner, {
          orderIndex: 1,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('moves a concept to the requested slot via a two-pass reorder', async () => {
      const em = seedThree();

      const result = await service.updateModuleConceptOrder('m1', 'cC', owner, {
        orderIndex: 1,
      } as any);

      // Two passes over three items = six writes (negatives, then finals).
      expect(em.update).toHaveBeenCalledTimes(6);
      expect(result.conceptId).toBe('cC');
      expect(result.orderIndex).toBe(1);
    });

    it('clamps an out-of-range target index to the end', async () => {
      seedThree();

      const result = await service.updateModuleConceptOrder('m1', 'cA', owner, {
        orderIndex: 99,
      } as any);

      expect(result.orderIndex).toBe(3);
    });
  });

  describe('attachPrerequisiteToModuleConcept', () => {
    it('rejects a concept being its own prerequisite', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());

      await expect(
        service.attachPrerequisiteToModuleConcept('m1', 'cA', 'cA', owner),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when the target concept is not attached', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.attachPrerequisiteToModuleConcept('m1', 'cA', 'cB', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a prerequisite from a different module', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne
        .mockResolvedValueOnce({ id: 'mc-target' })
        .mockResolvedValueOnce(null); // prereq not attached here

      await expect(
        service.attachPrerequisiteToModuleConcept('m1', 'cA', 'cB', owner),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a direct circular prerequisite', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne
        .mockResolvedValueOnce({ id: 'mc-target' })
        .mockResolvedValueOnce({ id: 'mc-prereq' });
      // The reverse link already exists.
      prereqRepo.findOne.mockResolvedValueOnce({
        moduleConceptId: 'mc-prereq',
      });

      await expect(
        service.attachPrerequisiteToModuleConcept('m1', 'cA', 'cB', owner),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the prerequisite link on the happy path', async () => {
      moduleRepo.findOne.mockResolvedValue(moduleWithOwner());
      moduleConceptRepo.findOne
        .mockResolvedValueOnce({ id: 'mc-target' })
        .mockResolvedValueOnce({ id: 'mc-prereq' });
      prereqRepo.findOne
        .mockResolvedValueOnce(null) // no reverse link
        .mockResolvedValueOnce(null); // no existing link

      await service.attachPrerequisiteToModuleConcept('m1', 'cA', 'cB', owner);

      expect(prereqRepo.create).toHaveBeenCalledWith({
        moduleConceptId: 'mc-target',
        prerequisiteModuleConceptId: 'mc-prereq',
      });
      expect(prereqRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteRoadmap', () => {
    it('forbids a non-admin', async () => {
      await expect(service.deleteRoadmap('r1', owner)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFound for a missing roadmap', async () => {
      roadmapRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteRoadmap('r1', admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('removes the roadmap for an admin', async () => {
      roadmapRepo.findOne.mockResolvedValue({ id: 'r1' });

      await service.deleteRoadmap('r1', admin);

      expect(roadmapRepo.remove).toHaveBeenCalledWith({ id: 'r1' });
    });
  });

  describe('submitRoadmap — §3 workflow', () => {
    const concept3 = (id: string, status = ConceptReviewStatus.PENDING) =>
      makeConcept({ id, reviewStatus: status });
    const module3 = (i: number) => ({
      id: `m${i}`,
      title: `M${i}`,
      moduleConcepts: [0, 1, 2].map((j) => ({
        concept: concept3(`c${i}-${j}`),
      })),
    });
    const tree3x3 = (overrides = {}) => ({
      id: 'r1',
      title: 'Roadmap',
      createdById: 'author-1',
      reviewStatus: RoadmapReviewStatus.DRAFT,
      rejectionReason: null,
      reviewedByUserId: null,
      reviewedAt: null,
      modules: [module3(0), module3(1), module3(2)],
      ...overrides,
    });

    it('submits a 3x3 roadmap', async () => {
      roadmapRepo.findOne.mockResolvedValue(tree3x3());

      const roadmap = await service.submitRoadmap('r1', owner);

      expect(roadmap.reviewStatus).toBe(RoadmapReviewStatus.SUBMITTED);
      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: RoadmapReviewStatus.SUBMITTED }),
      );
    });

    it('blocks fewer than 3 modules', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        ...tree3x3(),
        modules: [module3(0)],
      });

      await expect(service.submitRoadmap('r1', owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(roadmapRepo.save).not.toHaveBeenCalled();
    });

    it('blocks a module with fewer than 3 concepts', async () => {
      const t = tree3x3();
      t.modules[1].moduleConcepts = t.modules[1].moduleConcepts.slice(0, 2);
      roadmapRepo.findOne.mockResolvedValue(t);

      await expect(service.submitRoadmap('r1', owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(roadmapRepo.save).not.toHaveBeenCalled();
    });

    it('re-queues only rejected concepts on resubmit', async () => {
      const t = tree3x3();
      t.modules[0].moduleConcepts[0].concept = makeConcept({
        id: 'c-rej',
        reviewStatus: ConceptReviewStatus.REJECTED,
        rejectionReason: 'thin',
      });
      roadmapRepo.findOne.mockResolvedValue(t);

      await service.submitRoadmap('r1', owner);

      expect(conceptRepo.save).toHaveBeenCalledTimes(1);
      expect(conceptRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c-rej',
          reviewStatus: ConceptReviewStatus.PENDING,
          rejectionReason: null,
        }),
      );
    });

    it('refuses double submit and submit-when-published', async () => {
      roadmapRepo.findOne.mockResolvedValue(
        tree3x3({ reviewStatus: RoadmapReviewStatus.SUBMITTED }),
      );
      await expect(service.submitRoadmap('r1', owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      roadmapRepo.findOne.mockResolvedValue(
        tree3x3({ reviewStatus: RoadmapReviewStatus.PUBLISHED }),
      );
      await expect(service.submitRoadmap('r1', owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('forbids a non-owner submit', async () => {
      roadmapRepo.findOne.mockResolvedValue(tree3x3());

      await expect(
        service.submitRoadmap('r1', otherDeveloper),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('publishRoadmap — explicit admin click', () => {
    const approvedTree = (moduleCount: number) => ({
      id: 'r1',
      reviewStatus: RoadmapReviewStatus.SUBMITTED,
      modules: Array.from({ length: moduleCount }, (_, i) => ({
        id: `m${i}`,
        title: `M${i}`,
        moduleConcepts: [
          {
            concept: makeConcept({
              id: `c${i}`,
              reviewStatus: ConceptReviewStatus.APPROVED,
            }),
          },
        ],
      })),
    });

    it('publishes when all concepts approved and 3+ modules exist', async () => {
      roadmapRepo.findOne.mockResolvedValue(approvedTree(3));

      const result = await service.publishRoadmap('r1', admin);

      expect(result.reviewStatus).toBe(RoadmapReviewStatus.PUBLISHED);
    });

    it('blocks on pending concepts', async () => {
      const t = approvedTree(3);
      t.modules[0].moduleConcepts[0].concept.reviewStatus =
        ConceptReviewStatus.PENDING;
      roadmapRepo.findOne.mockResolvedValue(t);

      await expect(service.publishRoadmap('r1', admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('blocks on rejected concepts', async () => {
      const t = approvedTree(3);
      t.modules[0].moduleConcepts[0].concept.reviewStatus =
        ConceptReviewStatus.REJECTED;
      roadmapRepo.findOne.mockResolvedValue(t);

      await expect(service.publishRoadmap('r1', admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('does not count-check modules at publish (submit already guards structure)', async () => {
      roadmapRepo.findOne.mockResolvedValue(approvedTree(2));

      const result = await service.publishRoadmap('r1', admin);

      expect(result.reviewStatus).toBe(RoadmapReviewStatus.PUBLISHED);
    });

    it('blocks when not submitted', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        ...approvedTree(3),
        reviewStatus: RoadmapReviewStatus.DRAFT,
      });

      await expect(service.publishRoadmap('r1', admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('rejectRoadmap / unpublishRoadmap', () => {
    it('rejects a submitted roadmap back to draft with a reason', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        reviewStatus: RoadmapReviewStatus.SUBMITTED,
      });

      await service.rejectRoadmap('r1', admin, 'spam');

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewStatus: RoadmapReviewStatus.DRAFT,
          rejectionReason: 'spam',
          reviewedByUserId: 'admin-1',
        }),
      );
    });

    it('refuses to reject a non-submitted roadmap', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        reviewStatus: RoadmapReviewStatus.DRAFT,
      });

      await expect(
        service.rejectRoadmap('r1', admin, 'spam'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('unpublishes a published roadmap to draft', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        reviewStatus: RoadmapReviewStatus.PUBLISHED,
      });

      await service.unpublishRoadmap('r1', admin);

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: RoadmapReviewStatus.DRAFT }),
      );
    });
  });

  describe('attachConceptToModule — §2 ownership gate', () => {
    beforeEach(() => {
      moduleRepo.findOne.mockResolvedValue({
        id: 'm1',
        roadmap: { createdById: 'author-1' },
      });
      moduleConceptRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ raw: { max: 1 } }),
      );
      moduleConceptRepo.findOne.mockResolvedValue(null);
    });

    it("attaches the author's own concept", async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', authorId: 'author-1' }),
      );

      await service.attachConceptToModule('m1', owner, { conceptId: 'c1' } as any);

      expect(moduleConceptRepo.save).toHaveBeenCalled();
    });

    it("rejects another developer's concept", async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', authorId: 'someone-else' }),
      );

      await expect(
        service.attachConceptToModule('m1', owner, { conceptId: 'c1' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAllRoadmaps / findRoadmapById — publication gating', () => {
    it('hides draft roadmaps from non-owners', async () => {
      roadmapRepo.find.mockResolvedValue([
        {
          id: 'r-draft',
          reviewStatus: RoadmapReviewStatus.DRAFT,
          createdById: 'someone-else',
          modules: [],
        },
        {
          id: 'r-pub',
          reviewStatus: RoadmapReviewStatus.PUBLISHED,
          createdById: 'someone-else',
          modules: [],
        },
      ]);

      const result = await service.findAllRoadmaps(otherDeveloper);

      expect(result.map((r) => r.id)).toEqual(['r-pub']);
    });

    it('returns 404 for a draft roadmap read by a stranger', async () => {
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r-draft',
        reviewStatus: RoadmapReviewStatus.DRAFT,
        createdById: 'someone-else',
        modules: [],
      });

      await expect(
        service.findRoadmapById('r-draft', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('filters unapproved concepts inside a published roadmap', async () => {
      mcqRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ rawMany: [] }),
      );
      roadmapRepo.findOne.mockResolvedValue({
        id: 'r-pub',
        reviewStatus: RoadmapReviewStatus.PUBLISHED,
        createdById: 'someone-else',
        modules: [
          {
            id: 'm1',
            orderIndex: 1,
            moduleConcepts: [
              {
                conceptId: 'c-ok',
                orderIndex: 1,
                prerequisites: [],
                concept: makeConcept({
                  id: 'c-ok',
                  authorId: 'someone-else',
                  reviewStatus: ConceptReviewStatus.APPROVED,
                  draftContent: 'staged rewrite',
                }),
              },
              {
                conceptId: 'c-draft',
                orderIndex: 2,
                prerequisites: [],
                concept: makeConcept({
                  id: 'c-draft',
                  authorId: 'someone-else',
                  reviewStatus: ConceptReviewStatus.PENDING,
                }),
              },
            ],
          },
        ],
      });

      const result = await service.findRoadmapById('r-pub', otherDeveloper);

      expect(
        result.modules[0].moduleConcepts.map((mc: any) => mc.conceptId),
      ).toEqual(['c-ok']);
      // Staged draft stripped for strangers, live body intact.
      expect(result.modules[0].moduleConcepts[0].concept.draftContent).toBeNull();
    });
  });

  describe('detachConceptFromModule — published trees are append-only (§3.8)', () => {
    beforeEach(() => {
      moduleConceptRepo.findOne.mockResolvedValue({
        id: 'mc1',
        moduleId: 'm1',
        conceptId: 'c1',
      });
      moduleConceptRepo.find.mockResolvedValue([]);
    });

    it('blocks detaching from a published roadmap', async () => {
      moduleRepo.findOne.mockResolvedValue({
        id: 'm1',
        roadmap: {
          createdById: 'author-1',
          reviewStatus: RoadmapReviewStatus.PUBLISHED,
        },
      });

      await expect(
        service.detachConceptFromModule('m1', 'c1', owner),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(moduleConceptRepo.remove).not.toHaveBeenCalled();
    });

    it('allows detaching from a draft roadmap', async () => {
      moduleRepo.findOne.mockResolvedValue({
        id: 'm1',
        roadmap: {
          createdById: 'author-1',
          reviewStatus: RoadmapReviewStatus.DRAFT,
        },
      });

      await service.detachConceptFromModule('m1', 'c1', owner);

      expect(moduleConceptRepo.remove).toHaveBeenCalled();
    });
  });

  describe('unpublish request flow (§3.8)', () => {
    const publishedTree = (overrides = {}) => ({
      id: 'r1',
      createdById: 'author-1',
      reviewStatus: RoadmapReviewStatus.PUBLISHED,
      unpublishStatus: RoadmapUnpublishStatus.NONE,
      unpublishEffectiveAt: null,
      modules: [],
      ...overrides,
    });

    it('author requests, admin approves with a 30-day countdown', async () => {
      roadmapRepo.findOne.mockResolvedValue(publishedTree());

      await service.requestUnpublish('r1', owner);

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          unpublishStatus: RoadmapUnpublishStatus.REQUESTED,
        }),
      );

      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({ unpublishStatus: RoadmapUnpublishStatus.REQUESTED }),
      );

      await service.approveUnpublish('r1', admin);

      const saved = roadmapRepo.save.mock.calls.at(-1)[0];
      expect(saved.unpublishStatus).toBe(RoadmapUnpublishStatus.APPROVED);
      expect(saved.unpublishEffectiveAt.getTime()).toBeGreaterThan(
        Date.now() + 29 * 24 * 3600 * 1000,
      );
    });

    it('author cancels an open request, admin denies with NONE', async () => {
      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({ unpublishStatus: RoadmapUnpublishStatus.REQUESTED }),
      );

      await service.cancelUnpublishRequest('r1', owner);

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          unpublishStatus: RoadmapUnpublishStatus.NONE,
        }),
      );

      // Fresh fixture: cancel mutated the shared object in place.
      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({ unpublishStatus: RoadmapUnpublishStatus.REQUESTED }),
      );

      await service.denyUnpublish('r1', admin);

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          unpublishStatus: RoadmapUnpublishStatus.NONE,
        }),
      );
    });

    it('rejects requests on non-published roadmaps and double requests', async () => {      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({ reviewStatus: RoadmapReviewStatus.DRAFT }),
      );
      await expect(
        service.requestUnpublish('r1', owner),
      ).rejects.toBeInstanceOf(BadRequestException);

      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({ unpublishStatus: RoadmapUnpublishStatus.REQUESTED }),
      );
      await expect(
        service.requestUnpublish('r1', owner),
      ).rejects.toBeInstanceOf(BadRequestException);

      roadmapRepo.findOne.mockResolvedValue(publishedTree());
      await expect(
        service.approveUnpublish('r1', admin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('flips to draft once the countdown elapses (no cron)', async () => {
      roadmapRepo.findOne.mockResolvedValue(
        publishedTree({
          unpublishStatus: RoadmapUnpublishStatus.APPROVED,
          unpublishEffectiveAt: new Date(Date.now() - 1000),
        }),
      );

      const tree = await (service as any).loadRoadmapTree('r1');

      expect(tree.reviewStatus).toBe(RoadmapReviewStatus.DRAFT);
      expect(tree.unpublishStatus).toBe(RoadmapUnpublishStatus.NONE);
    });

    it('author and admin can abort an approved countdown', async () => {
      const countdown = () =>
        publishedTree({
          unpublishStatus: RoadmapUnpublishStatus.APPROVED,
          unpublishEffectiveAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        });

      roadmapRepo.findOne.mockResolvedValue(countdown());
      await service.cancelUnpublishRequest('r1', owner);
      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          unpublishStatus: RoadmapUnpublishStatus.NONE,
          unpublishEffectiveAt: null,
        }),
      );

      roadmapRepo.findOne.mockResolvedValue(countdown());
      await service.denyUnpublish('r1', admin);
      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          unpublishStatus: RoadmapUnpublishStatus.NONE,
          unpublishEffectiveAt: null,
        }),
      );
    });
  });

  describe('scheduled moderation deletion (§3.8)', () => {
    it('schedules, refuses doubles, cancels', async () => {
      roadmapRepo.findOne.mockResolvedValue({ id: 'r1' });

      await service.scheduleRoadmapDeletion('r1', admin);

      const saved = roadmapRepo.save.mock.calls.at(-1)[0];
      expect(saved.deleteEffectiveAt.getTime()).toBeGreaterThan(Date.now());

      roadmapRepo.findOne.mockResolvedValue({
        id: 'r1',
        deleteEffectiveAt: new Date(Date.now() + 1000),
      });
      await expect(
        service.scheduleRoadmapDeletion('r1', admin),
      ).rejects.toBeInstanceOf(BadRequestException);

      await service.cancelScheduledRoadmapDeletion('r1');

      expect(roadmapRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deleteEffectiveAt: null }),
      );
    });

    it('purges only overdue rows', async () => {
      const overdue = { id: 'r-old' };
      roadmapRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder({ many: [overdue] }),
      );

      const result = await service.purgeDeletedRoadmaps();

      expect(result).toEqual({ purged: 1 });
      expect(roadmapRepo.remove).toHaveBeenCalledWith(overdue);
    });
  });

  describe('findAllRoadmaps — origin labels and filter (§4)', () => {
    const conceptFlag = (id: string, isAi: boolean) =>
      makeConcept({
        id,
        authorId: 'someone-else',
        reviewStatus: ConceptReviewStatus.APPROVED,
        isAiGenerated: isAi,
      });
    const modWith = (id: string, flags: boolean[]) => ({
      id,
      orderIndex: 1,
      moduleConcepts: flags.map((f, j) => ({
        conceptId: `${id}-c${j}`,
        concept: conceptFlag(`${id}-c${j}`, f),
      })),
    });
    const pubRoadmap = (id: string, modules: any[]) => ({
      id,
      reviewStatus: RoadmapReviewStatus.PUBLISHED,
      createdById: 'someone-else',
      modules,
    });

    beforeEach(() => {
      roadmapRepo.find.mockResolvedValue([
        pubRoadmap('r-ai', [modWith('m1', [true, true])]),
        pubRoadmap('r-mix', [modWith('m2', [true]), modWith('m3', [false])]),
        pubRoadmap('r-hand', [modWith('m4', [false, false])]),
        pubRoadmap('r-empty', [{ id: 'm5', orderIndex: 1, moduleConcepts: [] }]),
      ]);
    });

    it('rolls labels bottom-up: ai, partial, handwritten, null', async () => {
      const result = await service.findAllRoadmaps(otherDeveloper);

      const byId = Object.fromEntries(result.map((r: any) => [r.id, r]));
      expect(byId['r-ai'].originLabel).toBe('ai');
      expect(byId['r-mix'].originLabel).toBe('partial');
      expect(byId['r-hand'].originLabel).toBe('handwritten');
      expect(byId['r-empty'].originLabel).toBeNull();
      expect(byId['r-mix'].modules[0].originLabel).toBe('ai');
      expect(byId['r-mix'].modules[1].originLabel).toBe('handwritten');
    });

    it('filters to partial, excluding unlabeled roadmaps', async () => {
      const result = await service.findAllRoadmaps(otherDeveloper, 'partial');

      expect(result.map((r) => r.id)).toEqual(['r-mix']);
    });

    it('rejects an invalid label', async () => {
      await expect(
        service.findAllRoadmaps(otherDeveloper, 'human'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
