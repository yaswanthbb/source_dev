import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { slugify } from '../../common/utils/slugify.util';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConceptsService {
  constructor(
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

    const moduleConcepts = await this.moduleConceptRepository.find({
      where: { conceptId: id },
      relations: [
        'module',
        'module.roadmap',
        'prerequisites',
        'prerequisites.prerequisiteModuleConcept',
        'prerequisites.prerequisiteModuleConcept.concept',
      ],
    });

    return {
      ...concept,
      appearsIn: moduleConcepts.map((mc) => ({
        moduleConceptId: mc.id,
        moduleId: mc.moduleId,
        moduleTitle: mc.module?.title,
        roadmapId: mc.module?.roadmapId,
        roadmapTitle: mc.module?.roadmap?.title,
        orderIndex: mc.orderIndex,
        prerequisites:
          mc.prerequisites?.map((p) => ({
            prerequisiteConceptId: p.prerequisiteModuleConcept?.conceptId,
            title: p.prerequisiteModuleConcept?.concept?.title,
            slug: p.prerequisiteModuleConcept?.concept?.slug,
            orderIndex: p.prerequisiteModuleConcept?.orderIndex,
          })) || [],
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
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete concepts');
    }

    const concept = await this.conceptRepository.findOne({ where: { id } });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    await this.conceptRepository.remove(concept);
  }
}
