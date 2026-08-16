import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { Concept } from '../content/entities/concept.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { User } from '../users/entities/user.entity';
import { CreateQaQuestionDto } from './dto/create-qa-question.dto';
import { UpdateQaQuestionDto } from './dto/update-qa-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
  ) {}

  private async checkApprovedContentCreator(
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.role === UserRole.INSTRUCTOR) {
      const profile = await this.instructorProfileRepository.findOne({
        where: { userId: user.id },
      });
      if (profile && profile.status === InstructorStatus.APPROVED) {
        return;
      }
    }
    throw new ForbiddenException(
      'Only approved instructors or admins can post answers',
    );
  }

  private checkOwnership(
    ownerId: string | null | undefined,
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

  async createQuestion(
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
    dto: CreateQaQuestionDto,
  ): Promise<Question> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const question = this.questionRepository.create({
      conceptId,
      studentId: user.id,
      body: dto.body,
    });
    return this.questionRepository.save(question);
  }

  async getQuestionsForConcept(conceptId: string): Promise<any[]> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }

    const questions = await this.questionRepository.find({
      where: { conceptId },
      relations: ['student', 'answers', 'answers.instructor'],
      order: { createdAt: 'ASC' },
    });

    return questions.map((q) => {
      const sortedAnswers = (q.answers || []).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      return {
        id: q.id,
        conceptId: q.conceptId,
        studentId: q.studentId,
        studentName: q.student?.name || null,
        body: q.body,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        answers: sortedAnswers.map((ans) => ({
          id: ans.id,
          questionId: ans.questionId,
          instructorId: ans.instructorId,
          instructorName: ans.instructor?.name || null,
          body: ans.body,
          createdAt: ans.createdAt,
          updatedAt: ans.updatedAt,
        })),
      };
    });
  }

  async updateQuestion(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateQaQuestionDto,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['answers'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    this.checkOwnership(question.studentId, user);

    if (
      user.role !== UserRole.ADMIN &&
      question.answers &&
      question.answers.length > 0
    ) {
      throw new ForbiddenException(
        'Questions that have already been answered by an instructor cannot be edited',
      );
    }

    question.body = dto.body;
    return this.questionRepository.save(question);
  }

  async deleteQuestion(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    this.checkOwnership(question.studentId, user);

    await this.questionRepository.remove(question);
  }

  async createAnswer(
    questionId: string,
    user: Omit<User, 'passwordHash'>,
    dto: CreateAnswerDto,
  ): Promise<Answer> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.checkApprovedContentCreator(user);

    const answer = this.answerRepository.create({
      questionId,
      instructorId: user.id,
      body: dto.body,
    });
    return this.answerRepository.save(answer);
  }

  async updateAnswer(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateAnswerDto,
  ): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id },
    });
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }
    this.checkOwnership(answer.instructorId, user);

    answer.body = dto.body;
    return this.answerRepository.save(answer);
  }

  async deleteAnswer(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id },
    });
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }
    this.checkOwnership(answer.instructorId, user);

    await this.answerRepository.remove(answer);
  }
}
