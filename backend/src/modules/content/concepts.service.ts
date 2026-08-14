import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { ConceptPrerequisite } from './entities/concept-prerequisite.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { slugify } from '../../common/utils/slugify.util';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConceptsService {
  constructor(
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    @InjectRepository(ConceptPrerequisite)
    private readonly conceptPrerequisiteRepository: Repository<ConceptPrerequisite>,
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

  private async generateUniqueConceptSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let count = 1;
    while (await this.conceptRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }
    return slug;
  }

  async createConcept(
    user: Omit<User, 'passwordHash'>,
    dto: CreateConceptDto,
  ): Promise<Concept> {
    await this.checkApprovedContentCreator(user);
    const slug = await this.generateUniqueConceptSlug(dto.title);
    const concept = this.conceptRepository.create({
      title: dto.title,
      content: dto.content,
      slug,
      difficulty: dto.difficulty,
      authorId: user.id,
    });
    return this.conceptRepository.save(concept);
  }

  async findAllConcepts(search?: string): Promise<Concept[]> {
    if (search) {
      return this.conceptRepository.find({
        where: { title: ILike(`%${search}%`) },
      });
    }
    return this.conceptRepository.find();
  }

  async findConceptById(id: string): Promise<Record<string, unknown>> {
    const concept = await this.conceptRepository.findOne({
      where: { id },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const prerequisites = await this.conceptPrerequisiteRepository.find({
      where: { conceptId: id },
      relations: ['prerequisiteConcept'],
    });

    const moduleConcepts = await this.moduleConceptRepository.find({
      where: { conceptId: id },
      relations: ['module', 'module.roadmap'],
    });

    return {
      ...concept,
      prerequisites,
      appearsIn: moduleConcepts.map((mc) => ({
        moduleId: mc.moduleId,
        moduleTitle: mc.module?.title,
        roadmapId: mc.module?.roadmapId,
        roadmapTitle: mc.module?.roadmap?.title,
        orderIndex: mc.orderIndex,
      })),
    };
  }

  async updateConcept(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateConceptDto,
  ): Promise<Concept> {
    const concept = await this.conceptRepository.findOne({ where: { id } });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    this.checkOwnership(concept.authorId, user);

    if (dto.title && dto.title !== concept.title) {
      concept.title = dto.title;
      concept.slug = await this.generateUniqueConceptSlug(dto.title);
    }
    if (dto.content !== undefined) {
      concept.content = dto.content;
    }
    if (dto.difficulty !== undefined) {
      concept.difficulty = dto.difficulty;
    }
    return this.conceptRepository.save(concept);
  }

  async deleteConcept(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const concept = await this.conceptRepository.findOne({ where: { id } });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    this.checkOwnership(concept.authorId, user);

    try {
      await this.conceptRepository.remove(concept);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (
        err.code === '23503' ||
        (err.message && err.message.includes('foreign key constraint'))
      ) {
        throw new ConflictException(
          'Cannot delete a concept with graded student submissions',
        );
      }
      throw error;
    }
  }

  async addPrerequisite(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: AddPrerequisiteDto,
  ): Promise<ConceptPrerequisite> {
    const concept = await this.conceptRepository.findOne({ where: { id } });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    this.checkOwnership(concept.authorId, user);

    if (dto.prerequisiteConceptId === id) {
      throw new BadRequestException('A concept cannot be its own prerequisite');
    }

    const prerequisiteConcept = await this.conceptRepository.findOne({
      where: { id: dto.prerequisiteConceptId },
    });
    if (!prerequisiteConcept) {
      throw new NotFoundException('Prerequisite concept not found');
    }

    const directCircular = await this.conceptPrerequisiteRepository.findOne({
      where: {
        conceptId: dto.prerequisiteConceptId,
        prerequisiteConceptId: id,
      },
    });
    if (directCircular) {
      throw new BadRequestException(
        'Direct circular prerequisite reference detected',
      );
    }

    let prerequisite = await this.conceptPrerequisiteRepository.findOne({
      where: {
        conceptId: id,
        prerequisiteConceptId: dto.prerequisiteConceptId,
      },
    });

    if (!prerequisite) {
      prerequisite = this.conceptPrerequisiteRepository.create({
        conceptId: id,
        prerequisiteConceptId: dto.prerequisiteConceptId,
      });
      prerequisite =
        await this.conceptPrerequisiteRepository.save(prerequisite);
    }

    return prerequisite;
  }

  async removePrerequisite(
    id: string,
    prerequisiteId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const concept = await this.conceptRepository.findOne({ where: { id } });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    this.checkOwnership(concept.authorId, user);

    const prerequisite = await this.conceptPrerequisiteRepository.findOne({
      where: {
        conceptId: id,
        prerequisiteConceptId: prerequisiteId,
      },
    });
    if (!prerequisite) {
      throw new NotFoundException('Prerequisite link not found');
    }

    await this.conceptPrerequisiteRepository.remove(prerequisite);
  }
}
