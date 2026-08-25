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
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';

import { UserRole } from '../../common/enums/user-role.enum';

import {
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let roadmapRepo: MockRepository;
  let moduleRepo: MockRepository;
  let moduleConceptRepo: MockRepository;
  let prereqRepo: MockRepository;

  const owner = makeUser({ id: 'author-1', role: UserRole.INSTRUCTOR });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const student = makeUser({ id: 'student-1', role: UserRole.STUDENT });

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
          provide: getRepositoryToken(InstructorProfile),
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
    moduleConceptRepo = module.get(getRepositoryToken(ModuleConcept));
    prereqRepo = module.get(getRepositoryToken(ModuleConceptPrerequisite));
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
      expect(() => service.checkOwnership('author-1', student)).toThrow(
        ForbiddenException,
      );
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
      prereqRepo.findOne.mockResolvedValueOnce({ moduleConceptId: 'mc-prereq' });

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
      await expect(
        service.deleteRoadmap('r1', owner),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound for a missing roadmap', async () => {
      roadmapRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteRoadmap('r1', admin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes the roadmap for an admin', async () => {
      roadmapRepo.findOne.mockResolvedValue({ id: 'r1' });

      await service.deleteRoadmap('r1', admin);

      expect(roadmapRepo.remove).toHaveBeenCalledWith({ id: 'r1' });
    });
  });
});
