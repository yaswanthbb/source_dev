import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { ProgressStatus } from '../../common/enums/progress-status.enum';

export interface OverviewAnalytics {
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalRoadmaps: number;
  totalModules: number;
  totalConcepts: number;
  totalConceptCompletions: number;
  activeStudents: number;
  totalXpAwarded: number;
}

export interface RoadmapAnalytics {
  roadmapId: string;
  title: string;
  totalConcepts: number;
  totalEnrolledStudents: number;
  averageCompletionPercentage: number;
  totalCompletedConcepts: number;
}

export interface ConceptAnalytics {
  conceptId: string;
  title: string;
  difficulty: string;
  completionCount: number;
  startedButNotCompletedCount: number;
}

export interface InstructorAnalytics {
  instructorId: string;
  name: string;
  email: string;
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(UserConceptProgress)
    private readonly userConceptProgressRepository: Repository<UserConceptProgress>,
    @InjectRepository(XpEvent)
    private readonly xpEventRepository: Repository<XpEvent>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
  ) {}

  async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    const totalStudents = await this.userRepository.count({
      where: { role: UserRole.STUDENT },
    });

    const totalInstructors = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.instructorProfile', 'profile')
      .where('user.role = :role AND profile.status = :status', {
        role: UserRole.INSTRUCTOR,
        status: InstructorStatus.APPROVED,
      })
      .getCount();

    const totalAdmins = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });

    const totalRoadmaps = await this.roadmapRepository.count();
    const totalModules = await this.moduleRepository.count();
    const totalConcepts = await this.conceptRepository.count();

    const totalConceptCompletions = await this.userConceptProgressRepository
      .createQueryBuilder('ucp')
      .innerJoin('users', 'user', 'user.id = ucp.user_id')
      .where('ucp.status = :status AND user.role = :role', {
        status: ProgressStatus.COMPLETED,
        role: UserRole.STUDENT,
      })
      .getCount();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeResult =
      (await this.userConceptProgressRepository
        .createQueryBuilder('ucp')
        .innerJoin('users', 'user', 'user.id = ucp.user_id')
        .select('COUNT(DISTINCT ucp.user_id)', 'count')
        .where('ucp.updated_at >= :sevenDaysAgo AND user.role = :role', {
          sevenDaysAgo,
          role: UserRole.STUDENT,
        })
        .getRawOne<{ count?: string }>()) ?? {};

    const activeStudents = parseInt(activeResult.count || '0', 10);

    const xpResult =
      (await this.xpEventRepository
        .createQueryBuilder('xp')
        .select('SUM(xp.xp_amount)', 'sum')
        .getRawOne<{ sum?: string }>()) ?? {};

    const totalXpAwarded = parseInt(xpResult.sum || '0', 10);

    return {
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalRoadmaps,
      totalModules,
      totalConcepts,
      totalConceptCompletions,
      activeStudents,
      totalXpAwarded,
    };
  }

  async getRoadmapAnalytics(): Promise<RoadmapAnalytics[]> {
    const roadmaps = await this.roadmapRepository.find({
      relations: [
        'modules',
        'modules.moduleConcepts',
        'modules.moduleConcepts.concept',
      ],
    });

    const results: RoadmapAnalytics[] = [];

    for (const roadmap of roadmaps) {
      const conceptIdsSet = new Set<string>();
      if (roadmap.modules) {
        roadmap.modules.forEach((mod) => {
          if (mod.moduleConcepts) {
            mod.moduleConcepts.forEach((mc) => {
              if (mc.conceptId) {
                conceptIdsSet.add(mc.conceptId);
              }
            });
          }
        });
      }

      const roadmapConceptIds = Array.from(conceptIdsSet);
      const totalConcepts = roadmapConceptIds.length;

      if (totalConcepts === 0) {
        results.push({
          roadmapId: roadmap.id,
          title: roadmap.title,
          totalConcepts: 0,
          totalEnrolledStudents: 0,
          averageCompletionPercentage: 0,
          totalCompletedConcepts: 0,
        });
        continue;
      }

      const progressRows = await this.userConceptProgressRepository
        .createQueryBuilder('ucp')
        .innerJoin('users', 'user', 'user.id = ucp.user_id')
        .where('ucp.concept_id IN (:...conceptIds) AND user.role = :role', {
          conceptIds: roadmapConceptIds,
          role: UserRole.STUDENT,
        })
        .getMany();

      const userProgressMap = new Map<
        string,
        { completedCount: number; totalStarted: number }
      >();

      progressRows.forEach((row) => {
        if (!userProgressMap.has(row.userId)) {
          userProgressMap.set(row.userId, {
            completedCount: 0,
            totalStarted: 0,
          });
        }
        const stats = userProgressMap.get(row.userId)!;
        stats.totalStarted++;
        if (row.status === ProgressStatus.COMPLETED) {
          stats.completedCount++;
        }
      });

      const totalEnrolledStudents = userProgressMap.size;
      let totalPercentageSum = 0;
      let totalCompletedConcepts = 0;

      userProgressMap.forEach((stats) => {
        totalCompletedConcepts += stats.completedCount;
        const studentPercentage = (stats.completedCount / totalConcepts) * 100;
        totalPercentageSum += studentPercentage;
      });

      const averageCompletionPercentage =
        totalEnrolledStudents > 0
          ? Math.round((totalPercentageSum / totalEnrolledStudents) * 100) / 100
          : 0;

      results.push({
        roadmapId: roadmap.id,
        title: roadmap.title,
        totalConcepts,
        totalEnrolledStudents,
        averageCompletionPercentage,
        totalCompletedConcepts,
      });
    }

    return results;
  }

  async getConceptAnalytics(): Promise<ConceptAnalytics[]> {
    const rawProgress = await this.userConceptProgressRepository
      .createQueryBuilder('ucp')
      .innerJoin('users', 'user', 'user.id = ucp.user_id')
      .select('ucp.concept_id', 'conceptId')
      .addSelect('ucp.status', 'status')
      .addSelect('COUNT(ucp.id)', 'count')
      .where('user.role = :role', { role: UserRole.STUDENT })
      .groupBy('ucp.concept_id')
      .addGroupBy('ucp.status')
      .getRawMany<{
        conceptId: string;
        status: ProgressStatus;
        count: string;
      }>();

    const conceptStatsMap = new Map<
      string,
      { completionCount: number; startedButNotCompletedCount: number }
    >();

    rawProgress.forEach((row) => {
      const cId = row.conceptId;
      const count = parseInt(row.count || '0', 10);
      if (!conceptStatsMap.has(cId)) {
        conceptStatsMap.set(cId, {
          completionCount: 0,
          startedButNotCompletedCount: 0,
        });
      }
      const stats = conceptStatsMap.get(cId)!;
      if (row.status === ProgressStatus.COMPLETED) {
        stats.completionCount += count;
      } else if (row.status === ProgressStatus.IN_PROGRESS) {
        stats.startedButNotCompletedCount += count;
      }
    });

    const activeConceptIds = Array.from(conceptStatsMap.keys());

    if (activeConceptIds.length === 0) {
      return [];
    }

    const concepts = await this.conceptRepository.find({
      where: { id: In(activeConceptIds) },
    });

    const results: ConceptAnalytics[] = concepts.map((c) => {
      const stats = conceptStatsMap.get(c.id) || {
        completionCount: 0,
        startedButNotCompletedCount: 0,
      };
      return {
        conceptId: c.id,
        title: c.title,
        difficulty: c.difficulty,
        completionCount: stats.completionCount,
        startedButNotCompletedCount: stats.startedButNotCompletedCount,
      };
    });

    results.sort((a, b) => b.completionCount - a.completionCount);
    return results;
  }

  async getInstructorAnalytics(): Promise<InstructorAnalytics[]> {
    const approvedInstructors = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.instructorProfile', 'profile')
      .where('user.role = :role AND profile.status = :status', {
        role: UserRole.INSTRUCTOR,
        status: InstructorStatus.APPROVED,
      })
      .getMany();

    const results: InstructorAnalytics[] = [];

    for (const instructor of approvedInstructors) {
      const roadmapsCreated = await this.roadmapRepository.count({
        where: { createdById: instructor.id },
      });

      const conceptsAuthored = await this.conceptRepository.count({
        where: { authorId: instructor.id },
      });

      const questionsAnswered = await this.answerRepository.count({
        where: { instructorId: instructor.id },
      });

      const mcqQuestionsCreated = await this.mcqQuestionRepository.count({
        where: { createdById: instructor.id },
      });

      results.push({
        instructorId: instructor.id,
        name: instructor.name,
        email: instructor.email,
        roadmapsCreated,
        conceptsAuthored,
        questionsAnswered,
        mcqQuestionsCreated,
      });
    }

    return results;
  }
}
