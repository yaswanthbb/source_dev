import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';
import { canSeeConcept } from './utils/visibility.util';
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
    // Visibility gating (§2/§3): admins see everything; authors see approved
    // concepts plus their own drafts; everyone else sees approved concepts
    // placed in a PUBLISHED roadmap.
    if (user && user.role === UserRole.ADMIN) {
      if (search) {
        return this.conceptRepository.find({
          where: { title: ILike(`%${search}%`) },
        });
      }
      return this.conceptRepository.find();
    }

    // Straightforward two-query approach: approved concepts with a published
    // placement, plus the viewer's own drafts. Clearer than one mega-join
    // and cheap at this scale.
    const approved = await this.conceptRepository.find({
      where: { reviewStatus: ConceptReviewStatus.APPROVED },
    });

    let own: Concept[] = [];
    if (user && user.role === UserRole.DEVELOPER) {
      own = await this.conceptRepository.find({
        where: { authorId: user.id },
      });
    }

    let merged = [...approved, ...own.filter((c) => c.reviewStatus !== ConceptReviewStatus.APPROVED)];

    // Authors always keep their own concepts; everyone else's approved
    // concepts need a published placement.
    const ownIds = new Set(own.map((c) => c.id));
    if (approved.length > 0) {
      const approvedIds = approved.map((c) => c.id);
      const placements = await this.moduleConceptRepository
        .createQueryBuilder('mc')
        .innerJoin('mc.module', 'module')
        .innerJoin('module.roadmap', 'roadmap')
        .where('mc.concept_id IN (:...ids)', { ids: approvedIds })
        .andWhere('roadmap.review_status = :published', {
          published: RoadmapReviewStatus.PUBLISHED,
        })
        .select('mc.concept_id', 'conceptId')
        .getRawMany<{ conceptId: string }>();
      const publishedIds = new Set(placements.map((p) => p.conceptId));
      merged = merged.filter(
        (c) =>
          ownIds.has(c.id) ||
          (c.reviewStatus === ConceptReviewStatus.APPROVED &&
            publishedIds.has(c.id)),
      );
    }

    if (search) {
      const needle = search.toLowerCase();
      merged = merged.filter((c) =>
        c.title.toLowerCase().includes(needle),
      );
    }

    return merged.map((c) => ({
      ...c,
      // Staged drafts are author/admin-only; readers see live content only.
      draftContent:
        user &&
        (user.role === UserRole.ADMIN ||
          (c.authorId !== null && c.authorId === user.id))
          ? c.draftContent
          : null,
    }));
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

    // Visibility gating (§2/§3): unapproved concepts are hidden from
    // everyone except admins and the concept's own author; approved concepts
    // additionally need a PUBLISHED roadmap placement for non-authors.
    const placements = await this.moduleConceptRepository.find({
      where: { conceptId: id },
      relations: ['module', 'module.roadmap'],
    });
    if (
      !canSeeConcept(
        concept,
        placements.map((mc) => ({
          roadmapReviewStatus: mc.module?.roadmap?.reviewStatus ?? null,
        })),
        user,
      )
    ) {
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

    // Staged drafts are author/admin-only; readers see live content only.
    const canSeeDraft =
      !!user &&
      (user.role === UserRole.ADMIN ||
        (concept.authorId !== null && concept.authorId === user.id));

    return {
      ...concept,
      draftContent: canSeeDraft ? concept.draftContent : null,
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

      // §3.8 draft/live split: significant edits to a live (approved +
      // published) concept stage as a pending draft — readers keep seeing the
      // live body until admin approves. Small edits go live instantly.
      // Anything not live keeps the simple pending-reset flow.
      if (isSignificant && (await this.isLivePublished(concept))) {
        concept.draftContent = dto.content;
        if (isAiGen) {
          concept.isAiGenerated = true;
        }
        return this.conceptRepository.save(concept);
      }

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

    // §3.8: attached concepts are part of a tree — detach first so deletes
    // never silently gut modules (module deletes cascade-detach instead).
    const placements = await this.moduleConceptRepository.count({
      where: { conceptId: id },
    });
    if (placements > 0) {
      throw new BadRequestException(
        'Concept is attached to a module. Detach it first.',
      );
    }

    await this.conceptRepository.remove(concept);
  }

  /** Live = approved with at least one published-roadmap placement. */
  private async isLivePublished(concept: Concept): Promise<boolean> {
    if (concept.reviewStatus !== ConceptReviewStatus.APPROVED) return false;
    const placements = await this.moduleConceptRepository
      .createQueryBuilder('mc')
      .innerJoin('mc.module', 'module')
      .innerJoin('module.roadmap', 'roadmap')
      .where('mc.concept_id = :id', { id: concept.id })
      .andWhere('roadmap.review_status = :published', {
        published: RoadmapReviewStatus.PUBLISHED,
      })
      .getOne();
    return !!placements;
  }
}
