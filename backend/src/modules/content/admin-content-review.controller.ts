import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
import { RejectConceptDto } from './dto/reject-concept.dto';

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
  ) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all concepts pending review with roadmap context and questions' })
  @ApiResponse({ status: 200, description: 'Pending concepts retrieved successfully.' })
  async getPendingReviewConcepts(): Promise<Record<string, unknown>[]> {
    const pendingConcepts = await this.conceptRepository.find({
      where: { reviewStatus: ConceptReviewStatus.PENDING },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    if (pendingConcepts.length === 0) {
      return [];
    }

    const conceptIds = pendingConcepts.map((c) => c.id);

    // Fetch roadmap/module placements
    const moduleConcepts = await this.moduleConceptRepository.find({
      where: { conceptId: In(conceptIds) },
      relations: ['module', 'module.roadmap'],
    });

    const placementsMap = new Map<string, Array<{
      roadmapId?: string;
      roadmapTitle?: string;
      moduleId?: string;
      moduleTitle?: string;
      orderIndex?: number;
    }>>();

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
  @ApiOperation({ summary: 'Approve a concept to publish it live for students' })
  @ApiResponse({ status: 200, description: 'Concept approved successfully.' })
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

    concept.reviewStatus = ConceptReviewStatus.APPROVED;
    concept.rejectionReason = null;
    concept.reviewedByUserId = admin.id;
    concept.reviewedAt = new Date();

    return this.conceptRepository.save(concept);
  }

  @Patch(':conceptId/reject')
  @ApiOperation({ summary: 'Reject a concept with admin feedback reason' })
  @ApiResponse({ status: 200, description: 'Concept rejected successfully.' })
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

    concept.reviewStatus = ConceptReviewStatus.REJECTED;
    concept.rejectionReason = dto.reason;
    concept.reviewedByUserId = admin.id;
    concept.reviewedAt = new Date();

    return this.conceptRepository.save(concept);
  }
}
