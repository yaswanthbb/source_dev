import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { McqQuestion } from './entities/mcq-question.entity';
import { McqOption } from './entities/mcq-option.entity';
import { McqAttempt } from './entities/mcq-attempt.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ProgressService } from '../progress/progress.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import type { AssessmentItem } from '../ai-generate/assessment';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    @InjectRepository(McqOption)
    private readonly mcqOptionRepository: Repository<McqOption>,
    @InjectRepository(McqAttempt)
    private readonly mcqAttemptRepository: Repository<McqAttempt>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    private readonly progressService: ProgressService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  private async resetConceptReviewStatus(conceptId: string): Promise<void> {
    await this.conceptRepository.update(conceptId, {
      reviewStatus: ConceptReviewStatus.PENDING,
      rejectionReason: null,
      reviewedByUserId: null,
      reviewedAt: null,
    });
  }

  private checkOwnership(
    authorId: string | null,
    user: Omit<User, 'passwordHash'>,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (authorId && authorId === user.id) {
      return;
    }
    throw new ForbiddenException(
      'You do not have permission to modify this quiz',
    );
  }

  async createQuestion(
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
    dto: CreateQuestionDto,
    assessment?: AssessmentItem,
  ): Promise<McqQuestion> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    this.checkOwnership(concept.authorId, user);

    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('A question must have at least 2 options');
    }

    const correctCount = dto.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException(
        'A question must have exactly one correct option',
      );
    }

    const question = this.mcqQuestionRepository.create({
      conceptId,
      questionText: dto.questionText,
      orderIndex: dto.orderIndex,
      createdById: user.id,
      ...(assessment
        ? {
            bloomLevel: assessment.bloomLevel,
            intendedDifficulty: assessment.intendedDifficulty,
            correctRationale: assessment.correctRationale,
            lintResult: assessment.lintResult,
            verificationResult: assessment.verificationResult,
          }
        : this.configService?.get('COURSE_ENGINE_ENABLED') === 'true' &&
            dto.bloomLevel
          ? {
              bloomLevel: dto.bloomLevel,
              intendedDifficulty: dto.intendedDifficulty,
              correctRationale: dto.correctRationale,
              lintResult: dto.lintResult,
              verificationResult: dto.verificationResult,
            }
          : {}),
    });
    const savedQuestion = await this.mcqQuestionRepository.save(question);

    const options = dto.options.map((opt, index) =>
      this.mcqOptionRepository.create({
        questionId: savedQuestion.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        orderIndex: opt.orderIndex,
        ...(assessment ||
        (this.configService?.get('COURSE_ENGINE_ENABLED') === 'true' &&
          dto.bloomLevel)
          ? {
              misconception: opt.isCorrect
                ? null
                : (assessment?.options[index]?.misconception ??
                  opt.misconception ??
                  null),
              distractorRationale: opt.isCorrect
                ? null
                : (assessment?.options[index]?.distractorRationale ??
                  opt.distractorRationale ??
                  null),
            }
          : {}),
      }),
    );
    savedQuestion.options = await this.mcqOptionRepository.save(options);

    await this.resetConceptReviewStatus(conceptId);

    return savedQuestion;
  }

  async getQuestionsForConcept(
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Record<string, unknown>[]> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const questions = await this.mcqQuestionRepository.find({
      where: { conceptId },
      relations: ['options'],
      order: { orderIndex: 'ASC' },
    });

    const isStudent =
      user.role !== UserRole.ADMIN && concept.authorId !== user.id;

    return questions.map((q) => {
      if (q.options) {
        q.options.sort((a, b) => a.orderIndex - b.orderIndex);
      }
      return {
        id: q.id,
        conceptId: q.conceptId,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        options: (q.options || []).map((opt) => {
          if (isStudent) {
            const studentOpt = { ...opt } as Record<string, unknown>;
            delete studentOpt.isCorrect;
            delete studentOpt.misconception;
            delete studentOpt.distractorRationale;
            return studentOpt;
          }
          // Keep legacy author responses unchanged when metadata is absent.
          const authorOpt = { ...opt } as Record<string, unknown>;
          if (authorOpt.misconception == null) delete authorOpt.misconception;
          if (authorOpt.distractorRationale == null)
            delete authorOpt.distractorRationale;
          return authorOpt;
        }),
      };
    });
  }

  async updateQuestion(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateQuestionDto,
  ): Promise<McqQuestion> {
    const question = await this.mcqQuestionRepository.findOne({
      where: { id },
      relations: ['concept'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    this.checkOwnership(question.concept.authorId, user);

    if (dto.questionText !== undefined) {
      question.questionText = dto.questionText;
    }
    if (dto.orderIndex !== undefined) {
      question.orderIndex = dto.orderIndex;
    }

    const saved = await this.mcqQuestionRepository.save(question);
    await this.resetConceptReviewStatus(question.conceptId);
    return saved;
  }

  async deleteQuestion(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const question = await this.mcqQuestionRepository.findOne({
      where: { id },
      relations: ['concept'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    this.checkOwnership(question.concept.authorId, user);

    const conceptId = question.conceptId;
    await this.mcqQuestionRepository.remove(question);
    await this.resetConceptReviewStatus(conceptId);
  }

  async updateOption(
    questionId: string,
    optionId: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateOptionDto,
  ): Promise<McqOption> {
    const question = await this.mcqQuestionRepository.findOne({
      where: { id: questionId },
      relations: ['concept', 'options'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    this.checkOwnership(question.concept.authorId, user);

    const option = await this.mcqOptionRepository.findOne({
      where: { id: optionId, questionId },
    });
    if (!option) {
      throw new NotFoundException('Option not found for this question');
    }

    if (dto.isCorrect === true) {
      for (const opt of question.options) {
        if (opt.id !== optionId && opt.isCorrect) {
          opt.isCorrect = false;
          await this.mcqOptionRepository.save(opt);
        }
      }
      option.isCorrect = true;
    } else if (dto.isCorrect === false && option.isCorrect) {
      const otherCorrectExists = question.options.some(
        (o) => o.id !== optionId && o.isCorrect,
      );
      if (!otherCorrectExists) {
        throw new BadRequestException(
          'A question must have exactly one correct option',
        );
      }
      option.isCorrect = false;
    }

    if (dto.optionText !== undefined) {
      option.optionText = dto.optionText;
    }

    const savedOption = await this.mcqOptionRepository.save(option);
    await this.resetConceptReviewStatus(question.conceptId);
    return savedOption;
  }

  private async checkAndTriggerConceptCompletion(
    studentId: string,
    conceptId: string,
    timezone?: string | null,
  ): Promise<void> {
    const allQuestions = await this.mcqQuestionRepository.find({
      where: { conceptId },
    });
    if (allQuestions.length === 0) {
      return;
    }

    const questionIds = allQuestions.map((q) => q.id);
    const attempts = await this.mcqAttemptRepository.find({
      where: { studentId, questionId: In(questionIds) },
    });

    const attemptsMap = new Map<string, McqAttempt[]>();
    attempts.forEach((att) => {
      if (!attemptsMap.has(att.questionId)) {
        attemptsMap.set(att.questionId, []);
      }
      attemptsMap.get(att.questionId)!.push(att);
    });

    const allResolved = allQuestions.every((q) => {
      const qAttempts = attemptsMap.get(q.id) || [];
      const isCorrect = qAttempts.some((a) => a.isCorrect);
      return isCorrect || qAttempts.length >= 3;
    });

    if (allResolved) {
      await this.progressService.markConceptCompletedFromAssignment(
        studentId,
        conceptId,
        timezone,
      );
    }
  }

  async submitAttempt(
    questionId: string,
    user: Omit<User, 'passwordHash'>,
    dto: SubmitAttemptDto,
  ) {
    const question = await this.mcqQuestionRepository.findOne({
      where: { id: questionId },
      relations: ['options', 'concept'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existingAttempts = await this.mcqAttemptRepository.find({
      where: { questionId, studentId: user.id },
    });

    if (existingAttempts.length >= 3) {
      throw new BadRequestException('No attempts remaining for this question');
    }

    if (existingAttempts.some((a) => a.isCorrect)) {
      throw new BadRequestException('Already answered correctly');
    }

    const selectedOption = (question.options || []).find(
      (o) => o.id === dto.selectedOptionId,
    );
    if (!selectedOption) {
      throw new NotFoundException(
        'Selected option not found for this question',
      );
    }

    const attemptNumber = existingAttempts.length + 1;
    const isCorrect = selectedOption.isCorrect;

    const attempt = this.mcqAttemptRepository.create({
      questionId,
      studentId: user.id,
      selectedOptionId: dto.selectedOptionId,
      isCorrect,
      attemptNumber,
    });
    await this.mcqAttemptRepository.save(attempt);

    const attemptsRemaining = 3 - attemptNumber;
    const correctOption = (question.options || []).find((o) => o.isCorrect);
    const revealAnswer = isCorrect || attemptsRemaining === 0;

    await this.checkAndTriggerConceptCompletion(
      user.id,
      question.conceptId,
      user.timezone,
    );

    return {
      isCorrect,
      attemptNumber,
      attemptsRemaining,
      correctOptionId: revealAnswer ? correctOption?.id : undefined,
    };
  }

  async getQuizStatus(
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<Record<string, unknown>> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const questions = await this.mcqQuestionRepository.find({
      where: { conceptId },
      relations: ['options'],
      order: { orderIndex: 'ASC' },
    });

    if (questions.length === 0) {
      return {
        conceptId,
        totalQuestions: 0,
        allQuestionsResolved: false,
        questions: [],
      };
    }

    const questionIds = questions.map((q) => q.id);
    const attempts = await this.mcqAttemptRepository.find({
      where: { studentId: user.id, questionId: In(questionIds) },
    });

    const attemptsMap = new Map<string, McqAttempt[]>();
    attempts.forEach((att) => {
      if (!attemptsMap.has(att.questionId)) {
        attemptsMap.set(att.questionId, []);
      }
      attemptsMap.get(att.questionId)!.push(att);
    });

    const questionStatuses = questions.map((q) => {
      const qAttempts = attemptsMap.get(q.id) || [];
      const isCorrect = qAttempts.some((a) => a.isCorrect);
      const attemptsUsed = qAttempts.length;
      const isResolved = isCorrect || attemptsUsed >= 3;
      const correctOption = (q.options || []).find((o) => o.isCorrect);

      return {
        questionId: q.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        attemptsUsed,
        attemptsRemaining: Math.max(0, 3 - attemptsUsed),
        isCorrect,
        isResolved,
        correctOptionId: isResolved ? correctOption?.id : undefined,
      };
    });

    const allQuestionsResolved =
      questions.length > 0 && questionStatuses.every((qs) => qs.isResolved);

    return {
      conceptId,
      totalQuestions: questions.length,
      allQuestionsResolved,
      questions: questionStatuses,
    };
  }
}
