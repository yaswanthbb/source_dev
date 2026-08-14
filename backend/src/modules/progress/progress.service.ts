import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserConceptProgress } from './entities/user-concept-progress.entity';
import { Concept } from '../content/entities/concept.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { ConceptPrerequisite } from '../content/entities/concept-prerequisite.entity';
import { ProgressStatus } from '../../common/enums/progress-status.enum';
import { XpSource } from '../../common/enums/xp-source.enum';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserConceptProgress)
    private readonly userConceptProgressRepository: Repository<UserConceptProgress>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(ConceptPrerequisite)
    private readonly conceptPrerequisiteRepository: Repository<ConceptPrerequisite>,
    private readonly gamificationService: GamificationService,
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
        XpSource.CONCEPT_COMPLETED,
      );
      await this.gamificationService.updateStreak(userId);
      await this.gamificationService.checkAndAwardBadges(userId);
    }

    return savedProgress;
  }

  async markConceptCompletedFromAssignment(
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
    }

    return savedProgress;
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
      ],
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const conceptsMap = new Map<string, Concept>();
    if (roadmap.modules) {
      roadmap.modules.forEach((mod) => {
        if (mod.moduleConcepts) {
          mod.moduleConcepts.forEach((mc) => {
            if (mc.concept) {
              conceptsMap.set(mc.concept.id, mc.concept);
            }
          });
        }
      });
    }

    const conceptList = Array.from(conceptsMap.values());
    const conceptIds = conceptList.map((c) => c.id);

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
    userProgressRows.forEach((row) => userProgressMap.set(row.conceptId, row));

    const prerequisiteRows = await this.conceptPrerequisiteRepository.find({
      where: { conceptId: In(conceptIds) },
      relations: ['prerequisiteConcept'],
    });

    const prereqConceptIds = Array.from(
      new Set(prerequisiteRows.map((p) => p.prerequisiteConceptId)),
    );

    let completedPrereqIds = new Set<string>();
    if (prereqConceptIds.length > 0) {
      const userPrereqProgressRows =
        await this.userConceptProgressRepository.find({
          where: {
            userId,
            conceptId: In(prereqConceptIds),
            status: ProgressStatus.COMPLETED,
          },
        });
      completedPrereqIds = new Set(
        userPrereqProgressRows.map((r) => r.conceptId),
      );
    }

    const prereqMap = new Map<string, ConceptPrerequisite[]>();
    prerequisiteRows.forEach((prereq) => {
      if (!prereqMap.has(prereq.conceptId)) {
        prereqMap.set(prereq.conceptId, []);
      }
      prereqMap.get(prereq.conceptId)!.push(prereq);
    });

    let completedCount = 0;
    const resultConcepts = conceptList.map((concept) => {
      const progress = userProgressMap.get(concept.id);
      const status = progress ? progress.status : ProgressStatus.NOT_STARTED;
      if (status === ProgressStatus.COMPLETED) {
        completedCount++;
      }

      const conceptPrereqs = prereqMap.get(concept.id) || [];
      const formattedPrereqs = conceptPrereqs.map((prereq) => ({
        prerequisiteConceptId: prereq.prerequisiteConceptId,
        title: prereq.prerequisiteConcept?.title,
        slug: prereq.prerequisiteConcept?.slug,
        isCompletedByCurrentUser: completedPrereqIds.has(
          prereq.prerequisiteConceptId,
        ),
      }));

      return {
        conceptId: concept.id,
        conceptTitle: concept.title,
        conceptSlug: concept.slug,
        status,
        completedAt: progress?.completedAt || null,
        prerequisites: formattedPrereqs,
      };
    });

    const totalConcepts = conceptList.length;
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
