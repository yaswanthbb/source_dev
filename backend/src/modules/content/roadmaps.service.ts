import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roadmap } from './entities/roadmap.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { ModuleConceptPrerequisite } from './entities/module-concept-prerequisite.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { slugify } from '../../common/utils/slugify.util';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AttachConceptDto } from './dto/attach-concept.dto';
import { UpdateModuleConceptDto } from './dto/update-module-concept.dto';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { User } from '../users/entities/user.entity';

import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';

@Injectable()
export class RoadmapsService {
  constructor(
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    @InjectRepository(ModuleConceptPrerequisite)
    private readonly moduleConceptPrerequisiteRepository: Repository<ModuleConceptPrerequisite>,
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
  ) {}

  async checkApprovedContentCreator(
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.role === UserRole.INSTRUCTOR) {
      const profile = await this.instructorProfileRepository.findOne({
        where: { userId: user.id },
      });
      if (!profile || profile.status !== InstructorStatus.APPROVED) {
        throw new ForbiddenException(
          'Approved instructor or admin access required to create content',
        );
      }
      return;
    }
    throw new ForbiddenException(
      'Approved instructor or admin access required to create content',
    );
  }

  checkOwnership(
    ownerId: string | null,
    user: Omit<User, 'passwordHash'>,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (ownerId && ownerId === user.id) {
      return;
    }
    throw new ForbiddenException(
      'You do not have permission to modify this resource',
    );
  }

  private async generateUniqueRoadmapSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let count = 1;
    while (await this.roadmapRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }
    return slug;
  }

  async createRoadmap(
    user: Omit<User, 'passwordHash'>,
    dto: CreateRoadmapDto,
  ): Promise<Roadmap> {
    await this.checkApprovedContentCreator(user);
    const slug = await this.generateUniqueRoadmapSlug(dto.title);
    const roadmap = this.roadmapRepository.create({
      title: dto.title,
      description: dto.description || null,
      slug,
      createdById: user.id,
    });
    return this.roadmapRepository.save(roadmap);
  }

  async findAllRoadmaps(
    user?: User | Omit<User, 'passwordHash'>,
  ): Promise<Roadmap[]> {
    const roadmaps = await this.roadmapRepository.find({
      relations: [
        'modules',
        'modules.moduleConcepts',
        'modules.moduleConcepts.concept',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    const isStudent = user && user.role === UserRole.STUDENT;

    for (const roadmap of roadmaps) {
      if (roadmap.modules) {
        roadmap.modules.sort((a, b) => a.orderIndex - b.orderIndex);
        for (const mod of roadmap.modules) {
          if (mod.moduleConcepts) {
            if (isStudent) {
              mod.moduleConcepts = mod.moduleConcepts.filter(
                (mc) =>
                  mc.concept &&
                  mc.concept.reviewStatus === ConceptReviewStatus.APPROVED,
              );
            }
            mod.moduleConcepts.sort((a, b) => a.orderIndex - b.orderIndex);
          }
        }
      }
      (roadmap as any).moduleCount = roadmap.modules ? roadmap.modules.length : 0;
    }

    return roadmaps;
  }

  async findRoadmapById(
    id: string,
    user?: User | Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
      relations: [
        'modules',
        'modules.moduleConcepts',
        'modules.moduleConcepts.concept',
        'modules.moduleConcepts.prerequisites',
        'modules.moduleConcepts.prerequisites.prerequisiteModuleConcept',
        'modules.moduleConcepts.prerequisites.prerequisiteModuleConcept.concept',
      ],
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const isStudent = user && user.role === UserRole.STUDENT;

    // Filter unapproved concepts for student callers
    if (isStudent && roadmap.modules) {
      for (const mod of roadmap.modules) {
        if (mod.moduleConcepts) {
          mod.moduleConcepts = mod.moduleConcepts.filter(
            (mc) =>
              mc.concept &&
              mc.concept.reviewStatus === ConceptReviewStatus.APPROVED,
          );
        }
      }
    }

    // Collect all concept IDs in this roadmap
    const allConceptIds: string[] = [];
    if (roadmap.modules) {
      for (const mod of roadmap.modules) {
        if (mod.moduleConcepts) {
          for (const mc of mod.moduleConcepts) {
            if (mc.conceptId) {
              allConceptIds.push(mc.conceptId);
            }
          }
        }
      }
    }

    const questionCountMap = new Map<string, number>();
    if (allConceptIds.length > 0) {
      const counts = await this.mcqQuestionRepository
        .createQueryBuilder('q')
        .select('q.concept_id', 'conceptId')
        .addSelect('COUNT(q.id)', 'count')
        .where('q.concept_id IN (:...conceptIds)', {
          conceptIds: allConceptIds,
        })
        .groupBy('q.concept_id')
        .getRawMany<{ conceptId: string; count: string }>();

      for (const row of counts) {
        questionCountMap.set(row.conceptId, parseInt(row.count, 10) || 0);
      }
    }

    if (roadmap.modules) {
      roadmap.modules.sort((a, b) => a.orderIndex - b.orderIndex);
      for (const mod of roadmap.modules) {
        if (mod.moduleConcepts && mod.moduleConcepts.length > 0) {
          mod.moduleConcepts.sort((a, b) => a.orderIndex - b.orderIndex);
          for (const mc of mod.moduleConcepts) {
            if (mc.concept) {
              (mc.concept as any).questionCount =
                questionCountMap.get(mc.conceptId) || 0;
            }
            (mc as any).prerequisites = (mc.prerequisites || [])
              .filter((p) => {
                if (!isStudent) return true;
                const prereqReviewStatus =
                  p.prerequisiteModuleConcept?.concept?.reviewStatus;
                return (
                  !prereqReviewStatus ||
                  prereqReviewStatus === ConceptReviewStatus.APPROVED
                );
              })
              .map((p) => ({
                moduleConceptId: p.moduleConceptId,
                prerequisiteConceptId: p.prerequisiteModuleConcept?.conceptId,
                title: p.prerequisiteModuleConcept?.concept?.title,
                slug: p.prerequisiteModuleConcept?.concept?.slug,
                orderIndex: p.prerequisiteModuleConcept?.orderIndex,
              }));
          }
        }
      }
    }

    return roadmap;
  }

  async updateRoadmap(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateRoadmapDto,
  ): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    this.checkOwnership(roadmap.createdById, user);

    if (dto.title && dto.title !== roadmap.title) {
      roadmap.title = dto.title;
      roadmap.slug = await this.generateUniqueRoadmapSlug(dto.title);
    }
    if (dto.description !== undefined) {
      roadmap.description = dto.description || null;
    }
    return this.roadmapRepository.save(roadmap);
  }

  async deleteRoadmap(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete roadmaps');
    }
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    await this.roadmapRepository.remove(roadmap);
  }

  async createModule(
    roadmapId: string,
    user: Omit<User, 'passwordHash'>,
    dto: CreateModuleDto,
  ): Promise<ModuleEntity> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
    });
    if (!roadmap) {
      throw new NotFoundException('Parent roadmap not found');
    }
    this.checkOwnership(roadmap.createdById, user);

    const moduleEntity = this.moduleRepository.create({
      roadmapId,
      title: dto.title,
      orderIndex: dto.orderIndex,
    });
    return this.moduleRepository.save(moduleEntity);
  }

  async updateModule(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateModuleDto,
  ): Promise<ModuleEntity> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    if (dto.title !== undefined) {
      moduleEntity.title = dto.title;
    }
    if (dto.orderIndex !== undefined) {
      moduleEntity.orderIndex = dto.orderIndex;
    }
    return this.moduleRepository.save(moduleEntity);
  }

  async deleteModule(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete modules');
    }
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    await this.moduleRepository.remove(moduleEntity);
  }

  /**
   * Shared order-index assignment logic used by both "attach existing"
   * and "create new concept + auto-attach" flows.
   */
  async calculateAndReserveOrderIndex(
    moduleId: string,
    requestedOrderIndex?: number,
  ): Promise<number> {
    const maxRecord = await this.moduleConceptRepository
      .createQueryBuilder('mc')
      .select('MAX(mc.order_index)', 'max')
      .where('mc.module_id = :moduleId', { moduleId })
      .getRawOne<{ max: number | null }>();

    const currentMax = maxRecord?.max ? Number(maxRecord.max) : 0;

    if (
      requestedOrderIndex === undefined ||
      requestedOrderIndex === null ||
      requestedOrderIndex <= 0 ||
      requestedOrderIndex > currentMax
    ) {
      return currentMax + 1;
    }

    // Explicit order index provided inserting at/before currentMax: shift existing items up
    await this.moduleConceptRepository
      .createQueryBuilder()
      .update(ModuleConcept)
      .set({ orderIndex: () => 'order_index + 1' })
      .where('module_id = :moduleId AND order_index >= :targetIndex', {
        moduleId,
        targetIndex: requestedOrderIndex,
      })
      .execute();

    return requestedOrderIndex;
  }

  async attachConceptToModule(
    moduleId: string,
    user: Omit<User, 'passwordHash'>,
    dto: AttachConceptDto,
  ): Promise<ModuleConcept> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    const concept = await this.conceptRepository.findOne({
      where: { id: dto.conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const targetOrderIndex = await this.calculateAndReserveOrderIndex(
      moduleId,
      dto.orderIndex,
    );

    let moduleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId: dto.conceptId },
    });

    if (moduleConcept) {
      moduleConcept.orderIndex = targetOrderIndex;
    } else {
      moduleConcept = this.moduleConceptRepository.create({
        moduleId,
        conceptId: dto.conceptId,
        orderIndex: targetOrderIndex,
      });
    }

    return this.moduleConceptRepository.save(moduleConcept);
  }

  async detachConceptFromModule(
    moduleId: string,
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    const moduleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId },
    });
    if (!moduleConcept) {
      throw new NotFoundException('Concept is not attached to this module');
    }

    await this.moduleConceptRepository.remove(moduleConcept);

    // Resequence remaining concepts sequentially in this module
    const remaining = await this.moduleConceptRepository.find({
      where: { moduleId },
      order: { orderIndex: 'ASC' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i + 1) {
        remaining[i].orderIndex = i + 1;
        await this.moduleConceptRepository.save(remaining[i]);
      }
    }
  }

  async updateModuleConceptOrder(
    moduleId: string,
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateModuleConceptDto,
  ): Promise<ModuleConcept> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    const moduleConcepts = await this.moduleConceptRepository.find({
      where: { moduleId },
      order: { orderIndex: 'ASC' },
    });

    const targetIndex = moduleConcepts.findIndex(
      (mc) => mc.conceptId === conceptId,
    );
    if (targetIndex === -1) {
      throw new NotFoundException('Concept is not attached to this module');
    }

    const [movedItem] = moduleConcepts.splice(targetIndex, 1);
    const desiredIndex =
      Math.max(1, Math.min(dto.orderIndex, moduleConcepts.length + 1)) - 1;
    moduleConcepts.splice(desiredIndex, 0, movedItem);

    // Two-pass transaction update prevents unique constraint collisions
    await this.moduleConceptRepository.manager.transaction(async (em) => {
      for (let i = 0; i < moduleConcepts.length; i++) {
        await em.update(
          ModuleConcept,
          { id: moduleConcepts[i].id },
          { orderIndex: -(i + 1) },
        );
      }
      for (let i = 0; i < moduleConcepts.length; i++) {
        await em.update(
          ModuleConcept,
          { id: moduleConcepts[i].id },
          { orderIndex: i + 1 },
        );
      }
    });

    movedItem.orderIndex = desiredIndex + 1;
    return movedItem;
  }

  // --- Module-Scoped Prerequisites Methods ---

  async attachPrerequisiteToModuleConcept(
    moduleId: string,
    conceptId: string,
    prerequisiteConceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<ModuleConceptPrerequisite> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    if (conceptId === prerequisiteConceptId) {
      throw new BadRequestException('A concept cannot be its own prerequisite');
    }

    const targetModuleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId },
    });
    if (!targetModuleConcept) {
      throw new NotFoundException('Concept is not attached to this module');
    }

    const prereqModuleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId: prerequisiteConceptId },
    });
    if (!prereqModuleConcept) {
      throw new BadRequestException(
        'Prerequisite concept must be attached to the same module',
      );
    }

    // Check direct circular prerequisite reference in this module
    const directCircular =
      await this.moduleConceptPrerequisiteRepository.findOne({
        where: {
          moduleConceptId: prereqModuleConcept.id,
          prerequisiteModuleConceptId: targetModuleConcept.id,
        },
      });
    if (directCircular) {
      throw new BadRequestException(
        'Direct circular prerequisite reference detected within this module',
      );
    }

    let link = await this.moduleConceptPrerequisiteRepository.findOne({
      where: {
        moduleConceptId: targetModuleConcept.id,
        prerequisiteModuleConceptId: prereqModuleConcept.id,
      },
    });

    if (!link) {
      link = this.moduleConceptPrerequisiteRepository.create({
        moduleConceptId: targetModuleConcept.id,
        prerequisiteModuleConceptId: prereqModuleConcept.id,
      });
      link = await this.moduleConceptPrerequisiteRepository.save(link);
    }

    return link;
  }

  async detachPrerequisiteFromModuleConcept(
    moduleId: string,
    conceptId: string,
    prerequisiteConceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);

    const targetModuleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId },
    });
    if (!targetModuleConcept) {
      throw new NotFoundException('Concept is not attached to this module');
    }

    const prereqModuleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId: prerequisiteConceptId },
    });
    if (!prereqModuleConcept) {
      throw new BadRequestException(
        'Prerequisite concept is not attached to this module',
      );
    }

    const link = await this.moduleConceptPrerequisiteRepository.findOne({
      where: {
        moduleConceptId: targetModuleConcept.id,
        prerequisiteModuleConceptId: prereqModuleConcept.id,
      },
    });

    if (!link) {
      throw new NotFoundException(
        'Prerequisite link does not exist in this module',
      );
    }

    await this.moduleConceptPrerequisiteRepository.remove(link);
  }
}
