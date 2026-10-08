import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqOption } from '../quiz/entities/mcq-option.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';
import { Concept } from '../content/entities/concept.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { canSeeConcept } from '../content/utils/visibility.util';
import { CreateQuestionDto } from '../quiz/dto/create-question.dto';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { questionPsychometrics } from './eval-psychometrics';
import { EvalEvents } from './eval-events';

@Injectable()
export class EvalPsychometricsService {
  constructor(
    @InjectRepository(McqQuestion)
    private readonly questions: Repository<McqQuestion>,
    @InjectRepository(McqAttempt)
    private readonly attempts: Repository<McqAttempt>,
    private readonly db: DataSource,
    private readonly events: EvalEvents,
  ) {}
  private authorize(question: McqQuestion, actor: Pick<User, 'id' | 'role'>) {
    if (
      !question.concept ||
      !canSeeConcept(question.concept, [], actor) ||
      (actor.role !== UserRole.ADMIN && question.concept.authorId !== actor.id)
    )
      throw new ForbiddenException(
        'Question analytics and replacement require the concept author or admin',
      );
  }
  async stats(id: string, actor: Pick<User, 'id' | 'role'>) {
    const question = await this.questions.findOne({
      where: { id },
      relations: ['concept', 'options'],
    });
    if (!question) throw new NotFoundException('Question not found');
    this.authorize(question, actor);
    const versions = await this.questions.find({
      where: { conceptId: question.conceptId },
      relations: ['options'],
      order: { id: 'ASC' },
    });
    const byId = new Map(versions.map((q) => [q.id, q]));
    const family = (q: McqQuestion): string => {
      const seen = new Set<string>();
      while (q.predecessorId && byId.has(q.predecessorId) && !seen.has(q.id)) {
        seen.add(q.id);
        q = byId.get(q.predecessorId)!;
      }
      return q.id;
    };
    const targetFamily = family(question);
    // A replaced item is not a second ability measure. Use current rest items from other families.
    const cohort = [
      question,
      ...versions.filter((q) => !q.retiredAt && family(q) !== targetFamily),
    ];
    const attempts = await this.attempts.find({
      where: { questionId: In(cohort.map((q) => q.id)) },
      select: [
        'id',
        'questionId',
        'studentId',
        'selectedOptionId',
        'isCorrect',
        'attemptNumber',
        'createdAt',
      ],
    });
    return {
      ...questionPsychometrics(question, cohort, attempts),
      versionNumber: question.versionNumber,
      predecessorId: question.predecessorId,
      cohortQuestionIds: cohort.map((q) => q.id),
      note: 'Descriptive first-attempt statistics; complete current same-concept rest-item cohort required, excluding other versions of the target item. Historical cohorts may be insufficient. Review flags are heuristics, not automatic edits.',
    };
  }
  async replace(
    id: string,
    actor: Pick<User, 'id' | 'role'>,
    dto: CreateQuestionDto,
    reason: string,
  ) {
    if (
      !reason.trim() ||
      reason.length > 1000 ||
      !Array.isArray(dto.options) ||
      dto.options.filter((o) => o.isCorrect).length !== 1 ||
      dto.options.length < 2 ||
      dto.options.length > 12
    )
      throw new ConflictException(
        'Replacement needs a reason and exactly one key among two to twelve options',
      );
    const replacement = await this.db.transaction(async (manager) => {
      const parent = await manager.findOne(McqQuestion, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!parent) throw new NotFoundException('Question not found');
      parent.concept = (await manager.findOne(Concept, {
        where: { id: parent.conceptId },
      }))!;
      this.authorize(parent, actor);
      if (parent.retiredAt)
        throw new ConflictException(
          'Replace the current successor, not an already-retired version',
        );
      const next = await manager.save(
        McqQuestion,
        manager.create(McqQuestion, {
          conceptId: parent.conceptId,
          predecessorId: parent.id,
          versionNumber: (parent.versionNumber ?? 1) + 1,
          questionText: dto.questionText,
          orderIndex: parent.orderIndex,
          createdById: actor.id,
          bloomLevel: dto.bloomLevel ?? null,
          intendedDifficulty: dto.intendedDifficulty ?? null,
          correctRationale: dto.correctRationale ?? null,
          lintResult: null,
          verificationResult: null, // Never inherit stale evidence or trust a supplied verdict.
          generationProvenance: {
            kind: 'expert_replacement',
            predecessorId: parent.id,
            reason,
          },
        }),
      );
      next.options = await manager.save(
        McqOption,
        dto.options.map((o) =>
          manager.create(McqOption, {
            questionId: next.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            orderIndex: o.orderIndex,
            misconception: o.isCorrect ? null : (o.misconception ?? null),
            distractorRationale: o.isCorrect
              ? null
              : (o.distractorRationale ?? null),
          }),
        ),
      );
      await manager.update(McqQuestion, parent.id, { retiredAt: new Date() });
      await manager.update(Concept, parent.conceptId, {
        reviewStatus: ConceptReviewStatus.PENDING,
        rejectionReason: null,
        reviewedByUserId: null,
        reviewedAt: null,
      });
      return next;
    });
    this.events.emit({
      type: 'artifact_versioned',
      artifactId: replacement.id,
      version: String(replacement.versionNumber),
      predecessorId: id,
    });
    return replacement;
  }
}
