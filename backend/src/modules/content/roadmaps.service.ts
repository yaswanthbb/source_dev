import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roadmap } from './entities/roadmap.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
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
import { User } from '../users/entities/user.entity';

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
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
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

  async findAllRoadmaps(): Promise<any[]> {
    const roadmaps = await this.roadmapRepository
      .createQueryBuilder('roadmap')
      .leftJoinAndSelect('roadmap.modules', 'module')
      .loadRelationCountAndMap('roadmap.moduleCount', 'roadmap.modules')
      .getMany();

    return roadmaps;
  }

  async findRoadmapById(id: string): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
      relations: [
        'modules',
        'modules.moduleConcepts',
        'modules.moduleConcepts.concept',
      ],
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    if (roadmap.modules) {
      roadmap.modules.sort((a, b) => a.orderIndex - b.orderIndex);
      roadmap.modules.forEach((mod) => {
        if (mod.moduleConcepts) {
          mod.moduleConcepts.sort((a, b) => a.orderIndex - b.orderIndex);
        }
      });
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
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    this.checkOwnership(roadmap.createdById, user);
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
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id },
      relations: ['roadmap'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.checkOwnership(moduleEntity.roadmap.createdById, user);
    await this.moduleRepository.remove(moduleEntity);
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

    let moduleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId: dto.conceptId },
    });

    if (moduleConcept) {
      moduleConcept.orderIndex = dto.orderIndex;
    } else {
      moduleConcept = this.moduleConceptRepository.create({
        moduleId,
        conceptId: dto.conceptId,
        orderIndex: dto.orderIndex,
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

    const moduleConcept = await this.moduleConceptRepository.findOne({
      where: { moduleId, conceptId },
    });
    if (!moduleConcept) {
      throw new NotFoundException('Concept is not attached to this module');
    }

    moduleConcept.orderIndex = dto.orderIndex;
    return this.moduleConceptRepository.save(moduleConcept);
  }
}
