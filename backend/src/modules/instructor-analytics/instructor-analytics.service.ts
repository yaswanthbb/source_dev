import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { ProgressStatus } from '../../common/enums/progress-status.enum';

export interface InstructorOverviewAnalytics {
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
  studentsEngaged: number;
}

export interface InstructorConceptAnalytics {
  conceptId: string;
  title: string;
  difficulty: string;
  completionCount: number;
  startedButNotCompletedCount: number;
}

export interface MostMissedOption {
  optionText: string;
  selectedCount: number;
}

export interface InstructorQuizQuestionAnalytics {
  questionId: string;
  questionText: string;
  conceptTitle: string;
  totalAttempts: number;
  correctRate: number;
  mostMissedOption: MostMissedOption | null;
}

@Injectable()
export class InstructorAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(UserConceptProgress)
    private readonly userConceptProgressRepository: Repository<UserConceptProgress>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    @InjectRepository(McqAttempt)
    private readonly mcqAttemptRepository: Repository<McqAttempt>,
  ) {}

  async checkApprovedInstructor(
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException('Instructor access required');
    }

    const profile = await this.instructorProfileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile || profile.status !== InstructorStatus.APPROVED) {
      throw new ForbiddenException('Approved instructor access required');
    }
  }

  async getOverview(
    user: Omit<User, 'passwordHash'>,
  ): Promise<InstructorOverviewAnalytics> {
    await this.checkApprovedInstructor(user);

    const roadmapsCreated = await this.roadmapRepository.count({
      where: { createdById: user.id },
    });

    const conceptsAuthored = await this.conceptRepository.count({
      where: { authorId: user.id },
    });

    const questionsAnswered = await this.answerRepository.count({
      where: { instructorId: user.id },
    });

    const mcqQuestionsCreated = await this.mcqQuestionRepository.count({
      where: { createdById: user.id },
    });

    // Count distinct students who have progress on any concept authored by current instructor
    const rawEngaged = await this.userConceptProgressRepository
      .createQueryBuilder('ucp')
      .innerJoin('concepts', 'concept', 'concept.id = ucp.concept_id')
      .innerJoin('users', 'student', 'student.id = ucp.user_id')
      .where('concept.author_id = :instructorId', { instructorId: user.id })
      .andWhere('student.role = :studentRole', {
        studentRole: UserRole.STUDENT,
      })
      .select('COUNT(DISTINCT ucp.user_id)', 'count')
      .getRawOne<{ count: string }>();

    const studentsEngaged = parseInt(rawEngaged?.count || '0', 10);

    return {
      roadmapsCreated,
      conceptsAuthored,
      questionsAnswered,
      mcqQuestionsCreated,
      studentsEngaged,
    };
  }

  async getConcepts(
    user: Omit<User, 'passwordHash'>,
  ): Promise<InstructorConceptAnalytics[]> {
    await this.checkApprovedInstructor(user);

    const rawConcepts = await this.conceptRepository
      .createQueryBuilder('concept')
      .innerJoin('user_concept_progress', 'ucp', 'ucp.concept_id = concept.id')
      .innerJoin('users', 'student', 'student.id = ucp.user_id')
      .where('concept.author_id = :instructorId', { instructorId: user.id })
      .andWhere('student.role = :studentRole', {
        studentRole: UserRole.STUDENT,
      })
      .select('concept.id', 'conceptId')
      .addSelect('concept.title', 'title')
      .addSelect('concept.difficulty', 'difficulty')
      .addSelect(
        `COUNT(CASE WHEN ucp.status = '${ProgressStatus.COMPLETED}' THEN 1 END)`,
        'completionCount',
      )
      .addSelect(
        `COUNT(CASE WHEN ucp.status = '${ProgressStatus.IN_PROGRESS}' THEN 1 END)`,
        'startedButNotCompletedCount',
      )
      .groupBy('concept.id')
      .addGroupBy('concept.title')
      .addGroupBy('concept.difficulty')
      .having('COUNT(ucp.id) > 0')
      .orderBy(
        `COUNT(CASE WHEN ucp.status = '${ProgressStatus.COMPLETED}' THEN 1 END)`,
        'DESC',
      )
      .getRawMany<{
        conceptId: string;
        title: string;
        difficulty: string;
        completionCount: string;
        startedButNotCompletedCount: string;
      }>();

    return rawConcepts.map((c) => ({
      conceptId: c.conceptId,
      title: c.title,
      difficulty: c.difficulty,
      completionCount: parseInt(c.completionCount || '0', 10),
      startedButNotCompletedCount: parseInt(
        c.startedButNotCompletedCount || '0',
        10,
      ),
    }));
  }

  async getQuizQuestions(
    user: Omit<User, 'passwordHash'>,
  ): Promise<InstructorQuizQuestionAnalytics[]> {
    await this.checkApprovedInstructor(user);

    // 1. Fetch all McqQuestions authored by current user with at least one McqAttempt
    const rawQuestions = await this.mcqQuestionRepository
      .createQueryBuilder('question')
      .innerJoin('concepts', 'concept', 'concept.id = question.concept_id')
      .innerJoin('mcq_attempts', 'attempt', 'attempt.question_id = question.id')
      .where('question.created_by_user_id = :instructorId', {
        instructorId: user.id,
      })
      .select('question.id', 'questionId')
      .addSelect('question.question_text', 'questionText')
      .addSelect('concept.title', 'conceptTitle')
      .addSelect('COUNT(attempt.id)', 'totalAttempts')
      .addSelect(
        'COUNT(CASE WHEN attempt.is_correct = true THEN 1 END)',
        'correctAttempts',
      )
      .groupBy('question.id')
      .addGroupBy('question.question_text')
      .addGroupBy('concept.title')
      .having('COUNT(attempt.id) > 0')
      .getRawMany<{
        questionId: string;
        questionText: string;
        conceptTitle: string;
        totalAttempts: string;
        correctAttempts: string;
      }>();

    if (rawQuestions.length === 0) {
      return [];
    }

    const questionIds = rawQuestions.map((q) => q.questionId);

    // 2. Fetch incorrect option distribution for mostMissedOption
    // Tie-break rule: If multiple wrong options are chosen equally often,
    // order by COUNT DESC, then option.order_index ASC, then option.id ASC.
    const rawMissed = await this.mcqAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin(
        'mcq_options',
        'option',
        'option.id = attempt.selected_option_id',
      )
      .where('attempt.question_id IN (:...questionIds)', { questionIds })
      .andWhere('attempt.is_correct = false')
      .select('attempt.question_id', 'questionId')
      .addSelect('option.id', 'optionId')
      .addSelect('option.option_text', 'optionText')
      .addSelect('option.order_index', 'orderIndex')
      .addSelect('COUNT(attempt.id)', 'selectedCount')
      .groupBy('attempt.question_id')
      .addGroupBy('option.id')
      .addGroupBy('option.option_text')
      .addGroupBy('option.order_index')
      .orderBy('COUNT(attempt.id)', 'DESC')
      .addOrderBy('option.order_index', 'ASC')
      .getRawMany<{
        questionId: string;
        optionId: string;
        optionText: string;
        orderIndex: number;
        selectedCount: string;
      }>();

    // Map the single most-missed option per question (first one in sorted list)
    const mostMissedMap = new Map<string, MostMissedOption>();
    rawMissed.forEach((row) => {
      if (!mostMissedMap.has(row.questionId)) {
        mostMissedMap.set(row.questionId, {
          optionText: row.optionText,
          selectedCount: parseInt(row.selectedCount || '0', 10),
        });
      }
    });

    // 3. Assemble and calculate correctRate
    const result: InstructorQuizQuestionAnalytics[] = rawQuestions.map((q) => {
      const totalAttempts = parseInt(q.totalAttempts || '0', 10);
      const correctAttempts = parseInt(q.correctAttempts || '0', 10);
      const correctRate =
        totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0;

      return {
        questionId: q.questionId,
        questionText: q.questionText,
        conceptTitle: q.conceptTitle,
        totalAttempts,
        correctRate,
        mostMissedOption: mostMissedMap.get(q.questionId) || null,
      };
    });

    // Sort by correctRate ascending (worst-performing questions first)
    return result.sort((a, b) => a.correctRate - b.correctRate);
  }
}
