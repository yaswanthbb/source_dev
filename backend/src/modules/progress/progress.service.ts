import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserConceptProgress } from './entities/user-concept-progress.entity';
import { Concept } from '../content/entities/concept.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../content/entities/module-concept-prerequisite.entity';
import { GamificationService } from '../gamification/gamification.service';
import { ReviewService } from '../review/review.service';
import { ProgressStatus } from '../../common/enums/progress-status.enum';
import { XpSource } from '../../common/enums/xp-source.enum';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserConceptProgress)
    private readonly userConceptProgressRepository: Repository<UserConceptProgress>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    @InjectRepository(ModuleConceptPrerequisite)
    private readonly moduleConceptPrerequisiteRepository: Repository<ModuleConceptPrerequisite>,
    private readonly gamificationService: GamificationService,
    private readonly reviewService: ReviewService,
  ) {}

  async markConceptCompleted(
    userId: string,
    conceptId: string,
  ): Promise<UserConceptProgress> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    let progress = await this.userConceptProgressRepository.findOne({
      where: { userId, conceptId },
    });

    const isNewCompletion =
      !progress || progress.status !== ProgressStatus.COMPLETED;

    if (progress) {
      if (progress.status === ProgressStatus.COMPLETED) {
        return progress;
      }
      progress.status = ProgressStatus.COMPLETED;
      progress.completedAt = new Date();
    } else {
      progress = this.userConceptProgressRepository.create({
        userId,
        conceptId,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      });
    }

    const savedProgress =
      await this.userConceptProgressRepository.save(progress);

    if (isNewCompletion) {
      await this.gamificationService.awardXpForConceptCompletion(
        userId,
        conceptId,
        XpSource.ASSIGNMENT_PASSED,
      );
      await this.gamificationService.updateStreak(userId);
      await this.gamificationService.checkAndAwardBadges(userId);
      await this.reviewService.populateReviewItemsForConcept(userId, conceptId);
    }

    return savedProgress;
  }

  async markConceptCompletedFromAssignment(
    userId: string,
    conceptId: string,
  ): Promise<UserConceptProgress> {
    return this.markConceptCompleted(userId, conceptId);
  }

  async markConceptStarted(
    userId: string,
    conceptId: string,
  ): Promise<UserConceptProgress> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    let progress = await this.userConceptProgressRepository.findOne({
      where: { userId, conceptId },
    });

    if (progress) {
      if (
        progress.status === ProgressStatus.IN_PROGRESS ||
        progress.status === ProgressStatus.COMPLETED
      ) {
        return progress;
      }
      progress.status = ProgressStatus.IN_PROGRESS;
    } else {
      progress = this.userConceptProgressRepository.create({
        userId,
        conceptId,
        status: ProgressStatus.IN_PROGRESS,
      });
    }

    return this.userConceptProgressRepository.save(progress);
  }

  async getSelfProgress(userId: string): Promise<UserConceptProgress[]> {
    return this.userConceptProgressRepository.find({
      where: { userId },
      relations: ['concept'],
    });
  }

  async getRoadmapProgress(
    userId: string,
    roadmapId: string,
  ): Promise<Record<string, unknown>> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
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

    const moduleConceptsList: ModuleConcept[] = [];
    if (roadmap.modules) {
      const sortedModules = [...roadmap.modules].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      sortedModules.forEach((mod) => {
        if (mod.moduleConcepts) {
          const sortedConcepts = [...mod.moduleConcepts].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          moduleConceptsList.push(...sortedConcepts);
        }
      });
    }

    const conceptIds = Array.from(
      new Set(moduleConceptsList.map((mc) => mc.conceptId)),
    );

    if (conceptIds.length === 0) {
      return {
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
        totalConcepts: 0,
        completedConcepts: 0,
        completedConceptsCount: 0,
        percentage: 0,
        completionPercentage: 0,
        concepts: [],
      };
    }

    const userProgressRows = await this.userConceptProgressRepository.find({
      where: { userId, conceptId: In(conceptIds) },
    });

    const userProgressMap = new Map<string, UserConceptProgress>();
    const completedConceptIds = new Set<string>();

    userProgressRows.forEach((row) => {
      userProgressMap.set(row.conceptId, row);
      if (row.status === ProgressStatus.COMPLETED) {
        completedConceptIds.add(row.conceptId);
      }
    });

    let completedCount = 0;
    const resultConcepts = moduleConceptsList.map((mc) => {
      const progress = userProgressMap.get(mc.conceptId);
      const status = progress ? progress.status : ProgressStatus.NOT_STARTED;
      if (status === ProgressStatus.COMPLETED) {
        completedCount++;
      }

      const formattedPrereqs = (mc.prerequisites || []).map((p) => {
        const prereqConcept = p.prerequisiteModuleConcept?.concept;
        const prereqConceptId =
          p.prerequisiteModuleConcept?.conceptId || '';
        return {
          prerequisiteConceptId: prereqConceptId,
          title: prereqConcept?.title || 'Prerequisite concept',
          slug: prereqConcept?.slug,
          orderIndex: p.prerequisiteModuleConcept?.orderIndex,
          isCompletedByCurrentUser: completedConceptIds.has(prereqConceptId),
        };
      });

      return {
        conceptId: mc.conceptId,
        conceptTitle: mc.concept?.title || '',
        conceptSlug: mc.concept?.slug || '',
        status,
        completedAt: progress?.completedAt || null,
        prerequisites: formattedPrereqs,
      };
    });

    const totalConcepts = moduleConceptsList.length;
    const percentage =
      totalConcepts > 0
        ? Math.round((completedCount / totalConcepts) * 100)
        : 0;

    return {
      roadmapId: roadmap.id,
      roadmapTitle: roadmap.title,
      totalConcepts,
      completedConcepts: completedCount,
      completedConceptsCount: completedCount,
      percentage,
      completionPercentage: percentage,
      concepts: resultConcepts,
    };
  }
}
