import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ReviewItem } from './entities/review-item.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';
import { XpSource } from '../../common/enums/xp-source.enum';
import { AnswerReviewItemDto } from './dto/answer-review-item.dto';
import { relativeDayIn, todayIn } from '../../common/utils/timezone.util';
import {
  FsrsScheduler,
  LegacyDoublingScheduler,
  gradeForAnswer,
  seedLegacyMemory,
} from './review-scheduler';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { canSeeConcept, canSeeRoadmap } from '../content/utils/visibility.util';
import { orderReviewSession } from './review-queue';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly legacy = new LegacyDoublingScheduler();
  private fsrsCache?: FsrsScheduler;
  constructor(
    @InjectRepository(ReviewItem)
    private readonly reviewItemRepository: Repository<ReviewItem>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    @InjectRepository(XpEvent)
    private readonly xpEventRepository: Repository<XpEvent>,
    @Optional() private readonly configService?: ConfigService,
    @Optional()
    @InjectRepository(ModuleConcept)
    private readonly placementRepository?: Repository<ModuleConcept>,
  ) {}

  private fsrsEnabled(): boolean {
    return this.configService?.get<string>('FSRS_ENABLED') === 'true';
  }

  private configNumber(
    key: string,
    fallback: number,
    min: number,
    max: number,
    integer = false,
  ): number {
    const raw = this.configService?.get<string>(key);
    const value = raw == null || raw === '' ? fallback : Number(raw);
    if (
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (integer && !Number.isInteger(value))
    )
      throw new Error(
        `${key} must be ${integer ? 'an integer ' : ''}between ${min} and ${max}`,
      );
    return value;
  }

  private fsrs(): FsrsScheduler {
    const retention = this.configNumber(
      'FSRS_REQUEST_RETENTION',
      0.9,
      0.7,
      0.99,
    );
    if (!this.fsrsCache || this.fsrsCache.retention !== retention)
      this.fsrsCache = new FsrsScheduler(retention);
    return this.fsrsCache;
  }

  private leechThreshold(): number {
    return this.configNumber('FSRS_LEECH_THRESHOLD', 8, 1, 100, true);
  }

  private queueCap(): number {
    return this.configNumber('FSRS_REVIEW_SESSION_CAP', 50, 1, 500, true);
  }

  private remediation(item: ReviewItem) {
    const isLeech = (item.lapses ?? 0) >= this.leechThreshold();
    const conceptId = item.mcqQuestion?.conceptId;
    return {
      isLeech,
      remediation:
        isLeech && conceptId
          ? {
              message:
                'This question has been difficult to retain. Revisit the lesson before trying again.',
              conceptId,
              href: `/developer/terminal?concept=${encodeURIComponent(conceptId)}`,
            }
          : null,
    };
  }

  private async availableItems(
    items: ReviewItem[],
    userId: string,
    role: UserRole,
  ): Promise<ReviewItem[]> {
    const sourced = items.filter((item) => !!item.mcqQuestion?.concept);
    if (!sourced.length) return [];
    if (!this.placementRepository)
      throw new Error(
        'FSRS review visibility requires the ModuleConcept repository',
      );
    const placements = await this.placementRepository.find({
      where: {
        conceptId: In([
          ...new Set(sourced.map((item) => item.mcqQuestion!.conceptId)),
        ]),
      },
      relations: ['module', 'module.roadmap'],
    });
    return sourced.filter((item) => {
      const question = item.mcqQuestion!;
      return canSeeConcept(
        question.concept,
        placements
          .filter((p) => p.conceptId === question.conceptId)
          .map((p) => ({
            // Honor effective unpublish/deletion dates through the existing shared predicate.
            roadmapReviewStatus:
              p.module?.roadmap && canSeeRoadmap(p.module.roadmap, undefined)
                ? p.module.roadmap.reviewStatus
                : null,
          })),
        { id: userId, role },
      );
    });
  }

  private async prepareQueue(
    items: ReviewItem[],
    userId: string,
    role: UserRole,
  ) {
    const available = await this.availableItems(items, userId, role);
    const scheduler = this.fsrs();
    const now = new Date();
    const ranked = available.map((item) => ({
      item,
      id: item.id,
      dueDate: item.dueDate,
      conceptId: item.mcqQuestion!.conceptId,
      createdAt: item.createdAt,
      retrievability: scheduler.retrievability(item, now),
    }));
    const session = orderReviewSession(ranked, this.queueCap()).map(
      ({ item }) => item,
    );
    const heldBackCount = available.length - session.length;
    const unavailableCount = items.length - available.length;
    const leechCount = available.filter(
      (item) => (item.lapses ?? 0) >= this.leechThreshold(),
    ).length;
    this.logger.debug(
      JSON.stringify({
        event: 'review_queue',
        userId,
        scheduler: scheduler.version,
        totalDue: items.length,
        sessionCount: session.length,
        heldBackCount,
        unavailableCount,
        leechCount,
      }),
    );
    return { items: session, heldBackCount, unavailableCount, leechCount };
  }

  /**
   * Review scheduling is a civil-date concept: an item due "tomorrow" means
   * tomorrow where the user lives. Computing these in UTC meant an
   * Asia/Kolkata user saw today's reviews appear at 05:30 local rather than
   * at midnight, and lost the 00:00–05:30 window to the anti-farming guard.
   */
  private getTodayDateString(timezone?: string | null): string {
    return todayIn(timezone);
  }

  private getTomorrowDateString(timezone?: string | null): string {
    return relativeDayIn(timezone, 1);
  }

  private getFutureDateString(days: number, timezone?: string | null): string {
    return relativeDayIn(timezone, days);
  }

  /**
   * Auto-populates review items for a newly completed concept's MCQ questions.
   * If zero questions exist, does nothing.
   * Avoids duplicate records with ON CONFLICT DO NOTHING.
   */
  async populateReviewItemsForConcept(
    userId: string,
    conceptId: string,
    timezone?: string | null,
  ): Promise<void> {
    const questions = await this.mcqQuestionRepository.find({
      where: { conceptId },
      ...(this.fsrsEnabled() ? { relations: ['concept'] } : {}),
    });

    if (!questions || questions.length === 0) {
      return;
    }

    const tomorrowStr = this.getTomorrowDateString(timezone);

    for (const question of questions) {
      await this.reviewItemRepository
        .createQueryBuilder()
        .insert()
        .into(ReviewItem)
        .values({
          userId,
          mcqQuestionId: question.id,
          intervalDays: 1,
          correctStreak: 0,
          dueDate: tomorrowStr,
          ...(this.fsrsEnabled()
            ? {
                ...seedLegacyMemory({
                  intervalDays: 1,
                  correctStreak: 0,
                  dueDate: tomorrowStr,
                  lastReviewedAt: null,
                }),
                sourceQuestionId: question.id,
                sourceConceptId: conceptId,
                sourceConceptTitle: question.concept?.title ?? null,
              }
            : {}),
        })
        .orIgnore() // Respect unique constraint on (userId, mcqQuestionId)
        .execute();
    }
  }

  /**
   * Returns all ReviewItems for current user where dueDate <= today (due today or overdue).
   * Strips isCorrect from options (student-facing).
   */
  async getDueReviewItems(
    userId: string,
    timezone?: string | null,
    role = UserRole.DEVELOPER,
  ) {
    const todayStr = this.getTodayDateString(timezone);

    let items = await this.reviewItemRepository.find({
      where: {
        userId,
        dueDate: LessThanOrEqual(todayStr),
      },
      relations: ['mcqQuestion', 'mcqQuestion.options', 'mcqQuestion.concept'],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });

    if (this.fsrsEnabled()) {
      const queue = await this.prepareQueue(items, userId, role);
      items = queue.items;
    } else {
      // Retained histories have no answerable source. Keep them counted and never dereference null.
      const missing = items.filter((item) => !item.mcqQuestion).length;
      if (missing)
        this.logger.warn(
          JSON.stringify({
            event: 'review_source_unavailable',
            userId,
            count: missing,
          }),
        );
      items = items.filter((item) => item.mcqQuestion);
    }

    return items.map((item) => {
      const question = item.mcqQuestion!;
      return {
        id: item.id,
        userId: item.userId,
        mcqQuestionId: item.mcqQuestionId,
        intervalDays: item.intervalDays,
        correctStreak: item.correctStreak,
        dueDate: item.dueDate,
        lastReviewedAt: item.lastReviewedAt,
        ...(this.fsrsEnabled() ? this.remediation(item) : {}),
        question: {
          id: question.id,
          conceptId: question.conceptId,
          conceptTitle: question.concept?.title || 'Concept',
          questionText: question.questionText,
          orderIndex: question.orderIndex,
          options: (question.options || [])
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
              orderIndex: opt.orderIndex,
            })),
        },
      };
    });
  }

  /**
   * Returns total count of review items due today or overdue.
   */
  async getDueCount(
    userId: string,
    timezone?: string | null,
    role = UserRole.DEVELOPER,
  ): Promise<{
    count: number;
    dueCount: number;
    sessionCount?: number;
    heldBackCount?: number;
    unavailableCount?: number;
    leechCount?: number;
  }> {
    const todayStr = this.getTodayDateString(timezone);
    if (this.fsrsEnabled()) {
      const items = await this.reviewItemRepository.find({
        where: { userId, dueDate: LessThanOrEqual(todayStr) },
        relations: ['mcqQuestion', 'mcqQuestion.concept'],
        order: { dueDate: 'ASC', createdAt: 'ASC' },
      });
      const queue = await this.prepareQueue(items, userId, role);
      return {
        count: items.length,
        dueCount: items.length,
        sessionCount: queue.items.length,
        heldBackCount: queue.heldBackCount,
        unavailableCount: queue.unavailableCount,
        leechCount: queue.leechCount,
      };
    }
    const count = await this.reviewItemRepository.count({
      where: {
        userId,
        dueDate: LessThanOrEqual(todayStr),
      },
    });

    return { count, dueCount: count };
  }

  /**
   * Answers a review item with strict anti-farming validation, interval computation, and XP award.
   */
  async answerReviewItem(
    reviewItemId: string,
    userId: string,
    dto: AnswerReviewItemDto,
    timezone?: string | null,
    role = UserRole.DEVELOPER,
  ) {
    const item = await this.reviewItemRepository.findOne({
      where: { id: reviewItemId },
      relations: [
        'mcqQuestion',
        'mcqQuestion.options',
        ...(this.fsrsEnabled() ? ['mcqQuestion.concept'] : []),
      ],
    });

    if (!item) {
      throw new NotFoundException('Review item not found');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this review item',
      );
    }

    const todayStr = this.getTodayDateString(timezone);

    // Anti-farming check: cannot review items that are not yet due
    if (item.dueDate > todayStr) {
      throw new BadRequestException(
        'This review item is not due yet and cannot be answered at this time',
      );
    }

    if (!item.mcqQuestion || !item.mcqQuestionId)
      throw new NotFoundException(
        'Review source is no longer available; history has been retained',
      );
    if (
      this.fsrsEnabled() &&
      !(await this.availableItems([item], userId, role)).length
    )
      throw new NotFoundException(
        'Review source is currently unavailable; history has been retained',
      );

    const options = item.mcqQuestion.options || [];
    const correctOption = options.find((opt) => opt.isCorrect);
    const selectedOption = options.find(
      (opt) => opt.id === dto.selectedOptionId,
    );

    if (!selectedOption) {
      throw new BadRequestException('Invalid option selected');
    }

    const isCorrect = selectedOption.isCorrect === true;
    const now = new Date();
    const enabled = this.fsrsEnabled();
    const scheduler = enabled ? this.fsrs() : this.legacy;
    const threshold = enabled ? this.leechThreshold() : 0;
    const wasLeech = enabled && (item.lapses ?? 0) >= threshold;
    const scheduled = scheduler.schedule(
      item,
      gradeForAnswer(isCorrect),
      now,
      timezone,
    );
    const newIntervalDays = scheduled.intervalDays;
    const nextDueDateStr = scheduled.dueDate;
    item.correctStreak = scheduled.correctStreak;
    item.intervalDays = newIntervalDays;
    item.dueDate = nextDueDateStr;
    if (scheduled.memory) Object.assign(item, scheduled.memory);

    if (isCorrect) {
      // Award 2 XP via XpEvent (isolated from streaks/badges)
      const xpEvent = this.xpEventRepository.create({
        userId,
        sourceType: XpSource.REVIEW_CORRECT,
        sourceId: item.mcqQuestionId,
        xpAmount: 2,
      });
      await this.xpEventRepository.save(xpEvent);
    }

    item.lastReviewedAt = now;
    await this.reviewItemRepository.save(item);
    this.logger.log(
      JSON.stringify({
        event: 'review_scheduled',
        userId,
        reviewItemId,
        fsrsEnabled: enabled,
        scheduler: scheduler.version,
        grade: gradeForAnswer(isCorrect),
        intervalDays: newIntervalDays,
        dueDate: nextDueDateStr,
        state: enabled ? item.state : null,
        rebased: scheduled.rebased ?? false,
      }),
    );
    if (enabled && !wasLeech && (item.lapses ?? 0) >= threshold)
      this.logger.warn(
        JSON.stringify({
          event: 'review_leech',
          userId,
          reviewItemId,
          conceptId: item.mcqQuestion.conceptId,
          lapses: item.lapses,
        }),
      );

    return {
      isCorrect,
      correctOptionId: correctOption?.id || null,
      newIntervalDays,
      nextDueDate: nextDueDateStr,
      xpAwarded: isCorrect ? 2 : 0,
      ...(enabled ? this.remediation(item) : {}),
    };
  }
}
