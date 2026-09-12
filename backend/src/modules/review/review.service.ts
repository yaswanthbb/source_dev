import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReviewItem } from './entities/review-item.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';
import { XpSource } from '../../common/enums/xp-source.enum';
import { AnswerReviewItemDto } from './dto/answer-review-item.dto';
import { relativeDayIn, todayIn } from '../../common/utils/timezone.util';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewItem)
    private readonly reviewItemRepository: Repository<ReviewItem>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    @InjectRepository(XpEvent)
    private readonly xpEventRepository: Repository<XpEvent>,
  ) {}

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
        })
        .orIgnore() // Respect unique constraint on (userId, mcqQuestionId)
        .execute();
    }
  }

  /**
   * Returns all ReviewItems for current user where dueDate <= today (due today or overdue).
   * Strips isCorrect from options (student-facing).
   */
  async getDueReviewItems(userId: string, timezone?: string | null) {
    const todayStr = this.getTodayDateString(timezone);

    const items = await this.reviewItemRepository.find({
      where: {
        userId,
        dueDate: LessThanOrEqual(todayStr),
      },
      relations: ['mcqQuestion', 'mcqQuestion.options', 'mcqQuestion.concept'],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      userId: item.userId,
      mcqQuestionId: item.mcqQuestionId,
      intervalDays: item.intervalDays,
      correctStreak: item.correctStreak,
      dueDate: item.dueDate,
      lastReviewedAt: item.lastReviewedAt,
      question: {
        id: item.mcqQuestion.id,
        conceptId: item.mcqQuestion.conceptId,
        conceptTitle: item.mcqQuestion.concept?.title || 'Concept',
        questionText: item.mcqQuestion.questionText,
        orderIndex: item.mcqQuestion.orderIndex,
        options: (item.mcqQuestion.options || [])
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            orderIndex: opt.orderIndex,
          })),
      },
    }));
  }

  /**
   * Returns total count of review items due today or overdue.
   */
  async getDueCount(
    userId: string,
    timezone?: string | null,
  ): Promise<{ count: number; dueCount: number }> {
    const todayStr = this.getTodayDateString(timezone);
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
  ) {
    const item = await this.reviewItemRepository.findOne({
      where: { id: reviewItemId },
      relations: ['mcqQuestion', 'mcqQuestion.options'],
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

    const options = item.mcqQuestion.options || [];
    const correctOption = options.find((opt) => opt.isCorrect);
    const selectedOption = options.find(
      (opt) => opt.id === dto.selectedOptionId,
    );

    if (!selectedOption) {
      throw new BadRequestException('Invalid option selected');
    }

    const isCorrect = selectedOption.isCorrect === true;
    let newIntervalDays = 1;
    let nextDueDateStr = '';

    if (isCorrect) {
      item.correctStreak += 1;
      newIntervalDays = Math.min(item.intervalDays * 2, 60);
      item.intervalDays = newIntervalDays;
      nextDueDateStr = this.getFutureDateString(newIntervalDays, timezone);
      item.dueDate = nextDueDateStr;

      // Award 2 XP via XpEvent (isolated from streaks/badges)
      const xpEvent = this.xpEventRepository.create({
        userId,
        sourceType: XpSource.REVIEW_CORRECT,
        sourceId: item.mcqQuestionId,
        xpAmount: 2,
      });
      await this.xpEventRepository.save(xpEvent);
    } else {
      item.correctStreak = 0;
      newIntervalDays = 1;
      item.intervalDays = 1;
      nextDueDateStr = this.getTomorrowDateString(timezone);
      item.dueDate = nextDueDateStr;
    }

    item.lastReviewedAt = new Date();
    await this.reviewItemRepository.save(item);

    return {
      isCorrect,
      correctOptionId: correctOption?.id || null,
      newIntervalDays,
      nextDueDate: nextDueDateStr,
      xpAwarded: isCorrect ? 2 : 0,
    };
  }
}
