import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';
import { RejectConceptDto } from './dto/reject-concept.dto';
import { RoadmapsService } from './roadmaps.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

@ApiTags('Admin Content Review')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/content-review')
export class AdminContentReviewController {
  constructor(
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    private readonly roadmapsService: RoadmapsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Concepts are reviewable inside a SUBMITTED roadmap (first review) or a
   * PUBLISHED one (re-review of a staged draft after a live edit — no
   * resubmit needed for single-concept fixes).
   */
  private async requireReviewablePlacement(conceptId: string): Promise<void> {
    const placement = await this.moduleConceptRepository
      .createQueryBuilder('mc')
      .innerJoin('mc.module', 'module')
      .innerJoin('module.roadmap', 'roadmap')
      .where('mc.concept_id = :conceptId', { conceptId })
      .andWhere('roadmap.review_status IN (:...statuses)', {
        statuses: [
          RoadmapReviewStatus.SUBMITTED,
          RoadmapReviewStatus.PUBLISHED,
        ],
      })
      .getOne();
    if (!placement) {
      throw new BadRequestException(
        'Concept is not part of a submitted or published roadmap.',
      );
    }
  }

  @Get('pending')
  @ApiOperation({
    summary:
      'Review queue: pending concepts in submitted roadmaps plus staged drafts on published roadmaps, with roadmap context and questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending concepts retrieved successfully.',
  })
  async getPendingReviewConcepts(): Promise<Record<string, unknown>[]> {
    // Reviewable = placed in a SUBMITTED or PUBLISHED roadmap.
    const reviewablePlacements = await this.moduleConceptRepository
      .createQueryBuilder('mc')
      .innerJoin('mc.module', 'module')
      .innerJoin('module.roadmap', 'roadmap')
      .where('roadmap.review_status IN (:...statuses)', {
        statuses: [
          RoadmapReviewStatus.SUBMITTED,
          RoadmapReviewStatus.PUBLISHED,
        ],
      })
      .select('mc.concept_id', 'conceptId')
      .getRawMany<{ conceptId: string }>();

    if (reviewablePlacements.length === 0) {
      return [];
    }

    const reviewableIds = [...new Set(reviewablePlacements.map((p) => p.conceptId))];
    const queuedConcepts = await this.conceptRepository.find({
      where: {
        id: In(reviewableIds),
        reviewStatus: ConceptReviewStatus.PENDING,
      },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    // Approved concepts carrying a staged draft (draft/live split).
    const draftedConcepts = await this.conceptRepository
      .createQueryBuilder('concept')
      .where('concept.id IN (:...ids)', { ids: reviewableIds })
      .andWhere('concept.review_status = :approved', {
        approved: ConceptReviewStatus.APPROVED,
      })
      .andWhere('concept.draft_content IS NOT NULL')
      .leftJoinAndSelect('concept.author', 'author')
      .orderBy('concept.created_at', 'ASC')
      .getMany();

    const pendingConcepts = [...queuedConcepts, ...draftedConcepts];

    if (pendingConcepts.length === 0) {
      return [];
    }

    const conceptIds = pendingConcepts.map((c) => c.id);

    // Fetch roadmap/module placements
    const moduleConcepts = await this.moduleConceptRepository.find({
      where: { conceptId: In(conceptIds) },
      relations: ['module', 'module.roadmap'],
    });

    const placementsMap = new Map<
      string,
      Array<{
        roadmapId?: string;
        roadmapTitle?: string;
        moduleId?: string;
        moduleTitle?: string;
        orderIndex?: number;
      }>
    >();

    moduleConcepts.forEach((mc) => {
      const existing = placementsMap.get(mc.conceptId) || [];
      existing.push({
        roadmapId: mc.module?.roadmapId,
        roadmapTitle: mc.module?.roadmap?.title,
        moduleId: mc.moduleId,
        moduleTitle: mc.module?.title,
        orderIndex: mc.orderIndex,
      });
      placementsMap.set(mc.conceptId, existing);
    });

    // Fetch MCQ questions with options
    const questions = await this.mcqQuestionRepository.find({
      where: { conceptId: In(conceptIds) },
      relations: ['options'],
      order: { orderIndex: 'ASC' },
    });

    const questionsMap = new Map<string, any[]>();
    questions.forEach((q) => {
      if (q.options) {
        q.options.sort((a, b) => a.orderIndex - b.orderIndex);
      }
      const existing = questionsMap.get(q.conceptId) || [];
      existing.push({
        id: q.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        options: (q.options || []).map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          orderIndex: opt.orderIndex,
        })),
      });
      questionsMap.set(q.conceptId, existing);
    });

    return pendingConcepts.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      content: c.content,
      draftContent: c.draftContent,
      difficulty: c.difficulty,
      reviewStatus: c.reviewStatus,
      isAiGenerated: c.isAiGenerated,
      rejectionReason: c.rejectionReason,
      reviewedAt: c.reviewedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.author
        ? {
            id: c.author.id,
            name: c.author.name,
            email: c.author.email,
          }
        : null,
      placements: placementsMap.get(c.id) || [],
      questions: questionsMap.get(c.id) || [],
    }));
  }

  @Patch(':conceptId/approve')
  @ApiOperation({
    summary:
      'Approve a concept inside a submitted or published roadmap (promotes any staged draft into live content)',
  })
  @ApiResponse({ status: 200, description: 'Concept approved successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Concept is not part of a submitted or published roadmap.',
  })
  async approveConcept(
    @Param('conceptId') conceptId: string,
    @CurrentUser() admin: User,
  ): Promise<Concept> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    await this.requireReviewablePlacement(conceptId);

    // Draft/live split: approving publishes the staged draft.
    if (concept.draftContent !== null) {
      concept.content = concept.draftContent;
      concept.draftContent = null;
    }
    concept.reviewStatus = ConceptReviewStatus.APPROVED;
    concept.rejectionReason = null;
    concept.reviewedByUserId = admin.id;
    concept.reviewedAt = new Date();

    const approved = await this.conceptRepository.save(concept);

    await this.notificationsService.safeNotify(
      concept.authorId && concept.authorId !== admin.id
        ? concept.authorId
        : null,
      NotificationType.CONCEPT_APPROVED,
      {
        conceptId: concept.id,
        conceptTitle: concept.title,
        reviewStatus: ConceptReviewStatus.APPROVED,
        reviewedBy: admin.name ?? admin.id,
        reviewedAt: new Date().toISOString(),
      },
    );

    return approved;
  }

  @Patch(':conceptId/reject')
  @ApiOperation({
    summary:
      'Reject a concept inside a submitted or published roadmap with admin feedback reason',
  })
  @ApiResponse({ status: 200, description: 'Concept rejected successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Concept is not part of a submitted or published roadmap.',
  })
  async rejectConcept(
    @Param('conceptId') conceptId: string,
    @CurrentUser() admin: User,
    @Body() dto: RejectConceptDto,
  ): Promise<Concept> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    await this.requireReviewablePlacement(conceptId);

    // Draft/live split: rejecting a staged draft discards it and keeps the
    // approved live body (with the reason attached for the author). Only
    // draft-less concepts flip to REJECTED.
    if (concept.draftContent !== null) {
      concept.draftContent = null;
    } else {
      concept.reviewStatus = ConceptReviewStatus.REJECTED;
    }
    concept.rejectionReason = dto.reason;
    concept.reviewedByUserId = admin.id;
    concept.reviewedAt = new Date();

    const rejected = await this.conceptRepository.save(concept);

    await this.notificationsService.safeNotify(
      concept.authorId && concept.authorId !== admin.id
        ? concept.authorId
        : null,
      NotificationType.CONCEPT_REJECTED,
      {
        conceptId: concept.id,
        conceptTitle: concept.title,
        reviewStatus: concept.reviewStatus,
        reason: dto.reason,
        reviewedBy: admin.name ?? admin.id,
        reviewedAt: new Date().toISOString(),
      },
    );

    return rejected;
  }

  @Patch('roadmaps/:id/publish')
  @ApiOperation({
    summary:
      'Publish a submitted roadmap (all concepts approved, 3+ modules)',
  })
  @ApiResponse({ status: 200, description: 'Roadmap published successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Roadmap is not publishable yet (pending/rejected concepts or fewer than 3 modules).',
  })
  async publishRoadmap(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.roadmapsService.publishRoadmap(id, admin);
  }

  @Patch('roadmaps/:id/reject')
  @ApiOperation({
    summary:
      'Reject a submitted roadmap outright with a reason (e.g. spam)',
  })
  @ApiResponse({ status: 200, description: 'Roadmap rejected successfully.' })
  async rejectRoadmap(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: RejectConceptDto,
  ) {
    return this.roadmapsService.rejectRoadmap(id, admin, dto.reason);
  }

  @Patch('roadmaps/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish a roadmap (takedown, approvals intact)' })
  @ApiResponse({ status: 200, description: 'Roadmap unpublished successfully.' })
  async unpublishRoadmap(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.roadmapsService.unpublishRoadmap(id, admin);
  }

  @Patch('roadmaps/:id/approve-unpublish')
  @ApiOperation({
    summary:
      'Approve an author unpublish request: roadmap stays fully public for 30 days, then goes private',
  })
  @ApiResponse({ status: 200, description: 'Unpublish approved.' })
  @ApiResponse({ status: 400, description: 'No open unpublish request.' })
  async approveUnpublish(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.roadmapsService.approveUnpublish(id, admin);
  }

  @Patch('roadmaps/:id/deny-unpublish')
  @ApiOperation({
    summary: 'Deny an author unpublish request (roadmap stays published)',
  })
  @ApiResponse({ status: 200, description: 'Unpublish request denied.' })
  async denyUnpublish(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.roadmapsService.denyUnpublish(id, admin);
  }

  @Patch('roadmaps/:id/schedule-delete')
  @ApiOperation({
    summary:
      'Moderation delete with 30-day delay: visible until the date, then hidden; row purged via purge-deleted',
  })
  @ApiResponse({ status: 200, description: 'Deletion scheduled.' })
  async scheduleRoadmapDeletion(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.roadmapsService.scheduleRoadmapDeletion(id, admin);
  }

  @Patch('roadmaps/:id/cancel-scheduled-delete')
  @ApiOperation({ summary: 'Cancel a scheduled moderation deletion' })
  @ApiResponse({ status: 200, description: 'Scheduled deletion cancelled.' })
  async cancelScheduledRoadmapDeletion(@Param('id') id: string) {
    return this.roadmapsService.cancelScheduledRoadmapDeletion(id);
  }

  @Delete('roadmaps/purge-deleted')
  @ApiOperation({
    summary:
      'Maintenance purge: hard-deletes roadmaps past their scheduled deletion date',
  })
  @ApiResponse({ status: 200, description: 'Overdue deletions purged.' })
  async purgeDeletedRoadmaps() {
    return this.roadmapsService.purgeDeletedRoadmaps();
  }
}
