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
import { UserRole } from '../../common/enums/user-role.enum';
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
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';
import { RoadmapUnpublishStatus } from '../../common/enums/roadmap-unpublish-status.enum';
import { canSeeConcept, canSeeRoadmap, isUnpublishDue } from './utils/visibility.util';
import {
  conceptOriginLabel,
  rollupOriginLabel,
  parseOriginLabel,
  OriginLabel,
} from './utils/origin-label.util';

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
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
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
    await this.checkContentCreator(user);
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
    label?: string,
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

    // Visibility gating (§2/§3): unpublished roadmaps are owner/admin-only;
    // inside a visible roadmap, concepts follow the shared predicate
    // (approved + published placement, authors keep own drafts).
    const visibleRoadmaps = roadmaps.filter((r) => canSeeRoadmap(r, user));

    let parsedLabel: OriginLabel | undefined;
    try {
      parsedLabel = parseOriginLabel(label);
    } catch {
      throw new BadRequestException(
        'Invalid label filter. Expected one of: ai, handwritten, partial.',
      );
    }

    for (const roadmap of visibleRoadmaps) {
      const placement = [
        { roadmapReviewStatus: roadmap.reviewStatus },
      ];
      const canSeeDrafts =
        !!user &&
        (user.role === UserRole.ADMIN ||
          (roadmap.createdById !== null && roadmap.createdById === user.id));
      if (roadmap.modules) {
        roadmap.modules.sort((a, b) => a.orderIndex - b.orderIndex);
        for (const mod of roadmap.modules) {
          if (mod.moduleConcepts) {
            mod.moduleConcepts = mod.moduleConcepts.filter(
              (mc) => mc.concept && canSeeConcept(mc.concept, placement, user),
            );
            for (const mc of mod.moduleConcepts) {
              // Staged drafts are author/admin-only; readers see live only.
              // (Serialization-only mutation — never saved.)
              if (
                mc.concept &&
                !canSeeDrafts &&
                mc.concept.authorId !== user?.id
              ) {
                mc.concept.draftContent = null;
              }
            }
            mod.moduleConcepts.sort((a, b) => a.orderIndex - b.orderIndex);
          }
        }
      }
      roadmap.moduleCount = roadmap.modules ? roadmap.modules.length : 0;
    }

    // §4 labels, computed bottom-up from the visible concepts (hidden
    // drafts never skew a reader's label).
    for (const roadmap of visibleRoadmaps) {
      const moduleLabels: (OriginLabel | null)[] = [];
      if (roadmap.modules) {
        for (const mod of roadmap.modules) {
          const conceptLabels = (mod.moduleConcepts ?? [])
            .filter((mc) => mc.concept)
            .map((mc) => conceptOriginLabel(mc.concept.isAiGenerated));
          mod.originLabel = rollupOriginLabel(conceptLabels);
          moduleLabels.push(mod.originLabel);
        }
      }
      roadmap.originLabel = rollupOriginLabel(
        moduleLabels.filter((l): l is OriginLabel => l !== null),
      );
    }

    // Unlabeled (empty) roadmaps never match a label filter.
    return parsedLabel === undefined
      ? visibleRoadmaps
      : visibleRoadmaps.filter((r) => r.originLabel === parsedLabel);
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
    if (!canSeeRoadmap(roadmap, user)) {
      throw new NotFoundException('Roadmap not found');
    }

    const placement = [{ roadmapReviewStatus: roadmap.reviewStatus }];

    // Filter concepts for non-privileged callers (authors keep own drafts)
    if (roadmap.modules) {
      for (const mod of roadmap.modules) {
        if (mod.moduleConcepts) {
          mod.moduleConcepts = mod.moduleConcepts.filter(
            (mc) => mc.concept && canSeeConcept(mc.concept, placement, user),
          );
          for (const mc of mod.moduleConcepts) {
            // Staged drafts are author/admin-only; readers see live only.
            // (Serialization-only mutation — never saved.)
            if (
              mc.concept &&
              !(
                user &&
                (user.role === UserRole.ADMIN ||
                  (mc.concept.authorId !== null &&
                    mc.concept.authorId === user.id))
              )
            ) {
              mc.concept.draftContent = null;
            }
          }
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
              mc.concept.questionCount =
                questionCountMap.get(mc.conceptId) || 0;
              mc.concept.originLabel = conceptOriginLabel(
                mc.concept.isAiGenerated,
              );
            }
            // Prereqs live in the same module, so the parent roadmap's
            // status is one of their placements — the shared predicate
            // applies directly.
            const filteredPrereqs = (mc.prerequisites || []).filter((p) => {
              const prereqConcept = p.prerequisiteModuleConcept?.concept;
              if (!prereqConcept) return false;
              return canSeeConcept(prereqConcept, placement, user);
            });
            (mc as unknown as { prerequisites: unknown[] }).prerequisites =
              filteredPrereqs.map((p) => ({
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

    // §4 labels, bottom-up from the visible concepts.
    const moduleLabels: (OriginLabel | null)[] = [];
    if (roadmap.modules) {
      for (const mod of roadmap.modules) {
        const conceptLabels = (mod.moduleConcepts ?? [])
          .filter((mc) => mc.concept)
          .map((mc) => conceptOriginLabel(mc.concept.isAiGenerated));
        mod.originLabel = rollupOriginLabel(conceptLabels);
        moduleLabels.push(mod.originLabel);
      }
    }
    roadmap.originLabel = rollupOriginLabel(
      moduleLabels.filter((l): l is OriginLabel => l !== null),
    );

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

  // --- §3 publishing / review workflow ---

  private async loadRoadmapTree(id: string): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
      relations: ['modules', 'modules.moduleConcepts', 'modules.moduleConcepts.concept'],
    });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    // No cron exists: an elapsed unpublish countdown flips to draft here,
    // on the write/review paths that all funnel through this loader.
    if (isUnpublishDue(roadmap)) {
      roadmap.reviewStatus = RoadmapReviewStatus.DRAFT;
      roadmap.unpublishStatus = RoadmapUnpublishStatus.NONE;
      roadmap.unpublishEffectiveAt = null;
      await this.roadmapRepository.save(roadmap);
    }
    return roadmap;
  }

  private distinctConcepts(roadmap: Roadmap): Concept[] {
    const seen = new Map<string, Concept>();
    for (const mod of roadmap.modules ?? []) {
      for (const mc of mod.moduleConcepts ?? []) {
        if (mc.concept && !seen.has(mc.concept.id)) {
          seen.set(mc.concept.id, mc.concept);
        }
      }
    }
    return [...seen.values()];
  }

  /**
   * Whole-roadmap submit for review. Structure minimums (3 modules ×
   * 3 concepts) are hard guards here at submit time — not at publish —
   * so the author fixes structure before review starts. Resubmission
   * re-queues only previously-rejected concepts.
   */
  async submitRoadmap(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);
    this.checkOwnership(roadmap.createdById, user);

    if (roadmap.reviewStatus === RoadmapReviewStatus.PUBLISHED) {
      throw new BadRequestException(
        'Roadmap is already published. Unpublish it first to resubmit.',
      );
    }
    if (roadmap.reviewStatus === RoadmapReviewStatus.SUBMITTED) {
      throw new BadRequestException('Roadmap is already submitted for review.');
    }

    const modules = roadmap.modules ?? [];
    if (modules.length < 3) {
      throw new BadRequestException(
        `Submission requires at least 3 modules (found ${modules.length}).`,
      );
    }
    for (const mod of modules) {
      const count = mod.moduleConcepts?.length ?? 0;
      if (count < 3) {
        throw new BadRequestException(
          `Module "${mod.title}" has ${count} concept(s); at least 3 are required to submit.`,
        );
      }
    }

    for (const concept of this.distinctConcepts(roadmap)) {
      if (concept.reviewStatus === ConceptReviewStatus.REJECTED) {
        concept.reviewStatus = ConceptReviewStatus.PENDING;
        concept.rejectionReason = null;
        concept.reviewedByUserId = null;
        concept.reviewedAt = null;
        await this.conceptRepository.save(concept);
      }
    }

    roadmap.reviewStatus = RoadmapReviewStatus.SUBMITTED;
    roadmap.rejectionReason = null;
    roadmap.reviewedByUserId = null;
    roadmap.reviewedAt = null;
    return this.roadmapRepository.save(roadmap);
  }

  /**
   * Compiled review response for the author/admin: per-module rollup with a
   * derived `approved` flag (all concepts approved — display only, no stored
   * module state) plus publish readiness.
   */
  async getReviewStatus(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Record<string, unknown>> {
    const roadmap = await this.loadRoadmapTree(id);
    this.checkOwnership(roadmap.createdById, user);

    const modules = (roadmap.modules ?? []).map((mod) => {
      const concepts = (mod.moduleConcepts ?? [])
        .filter((mc) => mc.concept)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((mc) => ({
          id: mc.concept.id,
          title: mc.concept.title,
          reviewStatus: mc.concept.reviewStatus,
          rejectionReason: mc.concept.rejectionReason,
          hasPendingDraft: mc.concept.draftContent !== null,
          originLabel: conceptOriginLabel(mc.concept.isAiGenerated),
        }));
      const moduleLabel = rollupOriginLabel(
        concepts.map((c) => c.originLabel),
      );
      return {
        moduleId: mod.id,
        title: mod.title,
        approved:
          concepts.length > 0 &&
          concepts.every(
            (c) => c.reviewStatus === ConceptReviewStatus.APPROVED,
          ),
        originLabel: moduleLabel,
        concepts,
      };
    });

    const allConcepts = modules.flatMap((m) => m.concepts);
    const pendingCount = allConcepts.filter(
      (c) => c.reviewStatus === ConceptReviewStatus.PENDING,
    ).length;
    const rejectedCount = allConcepts.filter(
      (c) => c.reviewStatus === ConceptReviewStatus.REJECTED,
    ).length;

    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      reviewStatus: roadmap.reviewStatus,
      rejectionReason: roadmap.rejectionReason,
      reviewedAt: roadmap.reviewedAt,
      modules,
      moduleCount: modules.length,
      conceptCount: allConcepts.length,
      pendingCount,
      rejectedCount,
      canPublish:
        roadmap.reviewStatus === RoadmapReviewStatus.SUBMITTED &&
        pendingCount === 0 &&
        rejectedCount === 0,
    };
  }

  /**
   * Explicit admin publish click. Unlocks only when every concept is
   * approved (structure minimums were enforced at submit).
   */
  async publishRoadmap(
    id: string,
    admin: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);

    if (roadmap.reviewStatus !== RoadmapReviewStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only a submitted roadmap can be published.',
      );
    }
    const concepts = this.distinctConcepts(roadmap);
    const pending = concepts.filter(
      (c) => c.reviewStatus === ConceptReviewStatus.PENDING,
    ).length;
    if (pending > 0) {
      throw new BadRequestException(
        `${pending} concept(s) are still pending review.`,
      );
    }
    const rejected = concepts.filter(
      (c) => c.reviewStatus === ConceptReviewStatus.REJECTED,
    ).length;
    if (rejected > 0) {
      throw new BadRequestException(
        `${rejected} concept(s) are rejected. Reject the roadmap with a reason or wait for fixes and resubmission.`,
      );
    }

    roadmap.reviewStatus = RoadmapReviewStatus.PUBLISHED;
    roadmap.rejectionReason = null;
    roadmap.reviewedByUserId = admin.id;
    roadmap.reviewedAt = new Date();
    return this.roadmapRepository.save(roadmap);
  }

  /**
   * Outright roadmap rejection (e.g. spam): back to draft with a reason.
   * Per-concept marks are left untouched.
   */
  async rejectRoadmap(
    id: string,
    admin: Omit<User, 'passwordHash'>,
    reason: string,
  ): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    if (roadmap.reviewStatus !== RoadmapReviewStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only a submitted roadmap can be rejected.',
      );
    }

    roadmap.reviewStatus = RoadmapReviewStatus.DRAFT;
    roadmap.rejectionReason = reason;
    roadmap.reviewedByUserId = admin.id;
    roadmap.reviewedAt = new Date();
    return this.roadmapRepository.save(roadmap);
  }

  /** Takedown: published roadmap goes back to draft, approvals intact. */
  async unpublishRoadmap(
    id: string,
    _admin: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    if (roadmap.reviewStatus !== RoadmapReviewStatus.PUBLISHED) {
      throw new BadRequestException('Only a published roadmap can be unpublished.');
    }

    roadmap.reviewStatus = RoadmapReviewStatus.DRAFT;
    return this.roadmapRepository.save(roadmap);
  }

  // --- §3.8 published-edit model: unpublish request flow ---

  /** Author asks for takedown of a published roadmap (30-day countdown on approval). */
  async requestUnpublish(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);
    this.checkOwnership(roadmap.createdById, user);

    if (roadmap.reviewStatus !== RoadmapReviewStatus.PUBLISHED) {
      throw new BadRequestException('Only a published roadmap can be unpublished.');
    }
    if (roadmap.unpublishStatus !== RoadmapUnpublishStatus.NONE) {
      throw new BadRequestException('An unpublish request is already open.');
    }

    roadmap.unpublishStatus = RoadmapUnpublishStatus.REQUESTED;
    return this.roadmapRepository.save(roadmap);
  }

  /** Author withdraws a pending unpublish request (or an approved one still in countdown). */
  async cancelUnpublishRequest(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);
    this.checkOwnership(roadmap.createdById, user);

    if (
      roadmap.unpublishStatus !== RoadmapUnpublishStatus.REQUESTED &&
      !this.isCountdownActive(roadmap)
    ) {
      throw new BadRequestException('No open unpublish request to cancel.');
    }

    roadmap.unpublishStatus = RoadmapUnpublishStatus.NONE;
    roadmap.unpublishEffectiveAt = null;
    return this.roadmapRepository.save(roadmap);
  }

  /** Admin approves takedown: roadmap stays fully public for 30 more days. */
  async approveUnpublish(
    id: string,
    admin: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);

    if (roadmap.unpublishStatus !== RoadmapUnpublishStatus.REQUESTED) {
      throw new BadRequestException('No open unpublish request to approve.');
    }

    roadmap.unpublishStatus = RoadmapUnpublishStatus.APPROVED;
    roadmap.unpublishEffectiveAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    roadmap.reviewedByUserId = admin.id;
    roadmap.reviewedAt = new Date();
    return this.roadmapRepository.save(roadmap);
  }

  /** Admin denies takedown: request closed, roadmap stays published. */
  async denyUnpublish(
    id: string,
    _admin: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.loadRoadmapTree(id);

    if (
      roadmap.unpublishStatus !== RoadmapUnpublishStatus.REQUESTED &&
      !this.isCountdownActive(roadmap)
    ) {
      throw new BadRequestException('No open unpublish request to deny.');
    }

    roadmap.unpublishStatus = RoadmapUnpublishStatus.NONE;
    roadmap.unpublishEffectiveAt = null;
    return this.roadmapRepository.save(roadmap);
  }

  /**
   * Countdown still running: approved but effective date in the future.
   * (Expired countdowns never reach here — loadRoadmapTree flips them.)
   */
  private isCountdownActive(roadmap: Roadmap): boolean {
    return (
      roadmap.reviewStatus === RoadmapReviewStatus.PUBLISHED &&
      roadmap.unpublishStatus === RoadmapUnpublishStatus.APPROVED &&
      !!roadmap.unpublishEffectiveAt &&
      new Date(roadmap.unpublishEffectiveAt).getTime() > Date.now()
    );
  }

  /**
   * Admin moderation delete with 30-day delay. Visible until the date, then
   * hidden for everyone except admins; rows purged via purgeDeletedRoadmaps.
   */
  async scheduleRoadmapDeletion(
    id: string,
    admin: Omit<User, 'passwordHash'>,
  ): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    if (roadmap.deleteEffectiveAt) {
      throw new BadRequestException('Deletion is already scheduled.');
    }

    roadmap.deleteEffectiveAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    roadmap.reviewedByUserId = admin.id;
    roadmap.reviewedAt = new Date();
    return this.roadmapRepository.save(roadmap);
  }

  /** Admin cancels a scheduled moderation deletion. */
  async cancelScheduledRoadmapDeletion(id: string): Promise<Roadmap> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id } });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }
    if (!roadmap.deleteEffectiveAt) {
      throw new BadRequestException('No scheduled deletion to cancel.');
    }

    roadmap.deleteEffectiveAt = null;
    return this.roadmapRepository.save(roadmap);
  }

  /** Maintenance purge for rows past their scheduled deletion date. */
  async purgeDeletedRoadmaps(): Promise<{ purged: number }> {
    const overdue = await this.roadmapRepository
      .createQueryBuilder('roadmap')
      .where('roadmap.delete_effective_at IS NOT NULL')
      .andWhere('roadmap.delete_effective_at <= now()')
      .getMany();

    for (const roadmap of overdue) {
      await this.roadmapRepository.remove(roadmap);
    }
    return { purged: overdue.length };
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

    // §2 ownership & reuse: concepts live only inside their own author's
    // content — never across developers. Strict, no admin bypass.
    if (concept.authorId !== moduleEntity.roadmap.createdById) {
      throw new ForbiddenException(
        'Concepts can only be attached inside their own author\u2019s content',
      );
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

    // §3.8: published trees are append-only for developers — detach would
    // silently gut live content. Unpublish (or wait out the countdown) first.
    if (moduleEntity.roadmap.reviewStatus === RoadmapReviewStatus.PUBLISHED) {
      throw new BadRequestException(
        'Concepts cannot be detached from a published roadmap.',
      );
    }

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
