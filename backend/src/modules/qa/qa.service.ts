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
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { canSeeConcept } from '../content/utils/visibility.util';
import { User } from '../users/entities/user.entity';
import { AiGenerateService } from '../ai-generate/ai-generate.service';
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
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    private readonly aiGenerateService: AiGenerateService,
  ) {}

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

  /**
   * Discussion visibility mirrors concept visibility (§2/§3): if you cannot
   * see the concept ( someone else's draft, or an approved concept in an
   * unpublished roadmap ), you cannot list, ask, or answer on it either.
   * 404 (not 403) so unpublished work is not leaked.
   */
  private async checkConceptVisible(
    concept: Concept,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const placements = await this.moduleConceptRepository.find({
      where: { conceptId: concept.id },
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
  }

  /**
   * Only the concept's author or an admin may (un)verify answers. Legacy
   * concepts with no author fall back to admin-only.
   */
  private async checkVerifier(
    conceptId: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (
      !concept ||
      concept.authorId === null ||
      concept.authorId !== user.id
    ) {
      throw new ForbiddenException(
        'Only the concept author or an admin can verify answers',
      );
    }
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
    await this.checkConceptVisible(concept, user);

    const question = this.questionRepository.create({
      conceptId,
      askerId: user.id,
      body: dto.body,
    });
    const savedQuestion = await this.questionRepository.save(question);

    // "Ask AI" is private: the generated answer is visible only to the asking
    // developer (see getQuestionsForConcept), never in the public discussion.
    if (dto.target === 'ai') {
      const aiAnswerText = await this.aiGenerateService.generateQaAnswer(
        concept.title,
        concept.content,
        dto.body,
        user as User,
      );

      const aiAnswer = this.answerRepository.create({
        questionId: savedQuestion.id,
        responderId: null,
        body: aiAnswerText,
        isAiAnswer: true,
      });
      await this.answerRepository.save(aiAnswer);

      savedQuestion.answers = [aiAnswer];
    }

    return savedQuestion;
  }

  async getQuestionsForConcept(
    conceptId: string,
    user?: Omit<User, 'passwordHash'> | User,
  ): Promise<any[]> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found');
    }
    if (user) {
      await this.checkConceptVisible(concept, user);
    }

    const questions = await this.questionRepository.find({
      where: { conceptId },
      relations: ['asker', 'answers', 'answers.responder'],
      order: { createdAt: 'ASC' },
    });

    // AI answers are private to the developer who asked (admins excepted).
    // Everyone else sees only the human discussion.
    const canSeeAiAnswer = (q: Question): boolean => {
      if (!user) return false;
      if (user.role === UserRole.ADMIN) return true;
      return q.askerId === user.id;
    };

    return questions.map((q) => {
      const visibleAnswers = (q.answers || []).filter(
        (a) => !a.isAiAnswer || canSeeAiAnswer(q),
      );
      // Verified answers first, then oldest-first within each group.
      const sortedAnswers = visibleAnswers.sort(
        (a, b) =>
          Number(b.isVerified) - Number(a.isVerified) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );

      return {
        id: q.id,
        conceptId: q.conceptId,
        askerId: q.askerId,
        askerName: q.asker?.name || null,
        body: q.body,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        answers: sortedAnswers.map((ans) => ({
          id: ans.id,
          questionId: ans.questionId,
          responderId: ans.responderId,
          responderName: ans.isAiAnswer
            ? 'AI Assistant'
            : ans.responder?.name || null,
          isAiAnswer: Boolean(ans.isAiAnswer),
          isVerified: Boolean(ans.isVerified),
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
    this.checkOwnership(question.askerId, user);

    // Any existing answer freezes the question: editing would orphan the
    // replies people already wrote — and for AI answers it would leave a
    // stale generated answer attached to a question it no longer answers.
    if (
      user.role !== UserRole.ADMIN &&
      question.answers &&
      question.answers.length > 0
    ) {
      throw new ForbiddenException(
        'Questions that have already been answered cannot be edited',
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
    this.checkOwnership(question.askerId, user);

    await this.questionRepository.remove(question);
  }

  async createAnswer(
    questionId: string,
    user: Omit<User, 'passwordHash'>,
    dto: CreateAnswerDto,
  ): Promise<Answer> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['concept'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (!question.concept) {
      throw new NotFoundException('Concept not found');
    }
    await this.checkConceptVisible(question.concept, user);

    // Discussion model (§12): any authenticated developer may answer.
    // Authoritative answers are verified on arrival: the concept's author
    // and admins speak for the content, so their answers carry the badge
    // without a second verify step. Everyone else's answers start
    // unverified until the author or an admin marks them.
    const isAuthoritative =
      user.role === UserRole.ADMIN ||
      (question.concept.authorId !== null &&
        question.concept.authorId === user.id);
    const now = new Date();
    const answer = this.answerRepository.create({
      questionId,
      responderId: user.id,
      body: dto.body,
      isVerified: isAuthoritative,
      verifiedByUserId: isAuthoritative ? user.id : null,
      verifiedAt: isAuthoritative ? now : null,
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
    this.checkOwnership(answer.responderId, user);

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
    this.checkOwnership(answer.responderId, user);

    await this.answerRepository.remove(answer);
  }

  async setAnswerVerified(
    id: string,
    user: Omit<User, 'passwordHash'>,
    verified: boolean,
  ): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['question'],
    });
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }
    if (answer.isAiAnswer) {
      throw new ForbiddenException('AI answers cannot be verified');
    }
    await this.checkVerifier(answer.question.conceptId, user);

    answer.isVerified = verified;
    answer.verifiedByUserId = verified ? user.id : null;
    answer.verifiedAt = verified ? new Date() : null;
    return this.answerRepository.save(answer);
  }
}
