import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';

import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { slugify } from '../../common/utils/slugify.util';
import { hasSignificantContentChange } from '../../common/utils/content-diff.util';
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
  ) {}

  async checkContentCreator(
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) {
      return;
    }
    throw new ForbiddenException(
      'Developer or admin access required to create content',
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
    await this.checkContentCreator(user);
    const slug = await this.generateUniqueConceptSlug(dto.title);
    const concept = this.conceptRepository.create({
      title: dto.title,
      content: dto.content,
      slug,
      difficulty: dto.difficulty,
      authorId: user.id,
      reviewStatus: ConceptReviewStatus.PENDING,
      isAiGenerated: Boolean(dto.isAiGenerated),
      rejectionReason: null,
      reviewedByUserId: null,
      reviewedAt: null,
    });
    return this.conceptRepository.save(concept);
  }

  async findAllConcepts(
    search?: string,
    user?: User | Omit<User, 'passwordHash'>,
  ): Promise<Concept[]> {
    // Visibility gating (§1 interim, full rules land in §2/§3): admins see
    // everything; developers see approved concepts plus their own drafts;
    // unauthenticated callers see approved concepts only.
    const isAdmin = user && user.role === UserRole.ADMIN;

    if (isAdmin) {
      if (search) {
        return this.conceptRepository.find({
          where: { title: ILike(`%${search}%`) },
        });
      }
      return this.conceptRepository.find();
    }

    const visibleWhere: FindOptionsWhere<Concept>[] = [
      { reviewStatus: ConceptReviewStatus.APPROVED },
    ];
    if (user) {
      visibleWhere.push({ authorId: user.id });
    }

    if (search) {
      return this.conceptRepository.find({
        where: visibleWhere.map((w) => ({
          ...w,
          title: ILike(`%${search}%`),
        })),
      });
    }

    return this.conceptRepository.find({ where: visibleWhere });
  }

  async findConceptById(
    id: string,
    user?: User | Omit<User, 'passwordHash'>,
  ): Promise<Record<string, unknown>> {
    const concept = await this.conceptRepository.findOne({
      where: { id },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    // Visibility gating: unapproved concepts are hidden from everyone
    // except admins and the concept's own author.
    const isAdmin = user && user.role === UserRole.ADMIN;
    const isAuthor =
      user && concept.authorId !== null && concept.authorId === user.id;
    if (!isAdmin && !isAuthor && concept.reviewStatus !== ConceptReviewStatus.APPROVED) {
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
      const isAiGen = Boolean(dto.isAiGenerated);
      const isSignificant =
        isAiGen ||
        hasSignificantContentChange(concept.content, dto.content, 40);

      concept.content = dto.content;

      if (isSignificant) {
        concept.reviewStatus = ConceptReviewStatus.PENDING;
        concept.rejectionReason = null;
        concept.reviewedByUserId = null;
        concept.reviewedAt = null;
      }

      if (isAiGen) {
        concept.isAiGenerated = true;
      }
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
