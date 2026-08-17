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
   * Helper to get current calendar date in YYYY-MM-DD (UTC)
   */
  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Helper to get tomorrow's calendar date in YYYY-MM-DD (UTC)
   */
  private getTomorrowDateString(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Helper to get future date in YYYY-MM-DD (UTC) by adding days
   */
  private getFutureDateString(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Auto-populates review items for a newly completed concept's MCQ questions.
   * If zero questions exist, does nothing.
   * Avoids duplicate records with ON CONFLICT DO NOTHING.
   */
  async populateReviewItemsForConcept(
    userId: string,
    conceptId: string,
  ): Promise<void> {
    const questions = await this.mcqQuestionRepository.find({
      where: { conceptId },
    });

    if (!questions || questions.length === 0) {
      return;
    }

    const tomorrowStr = this.getTomorrowDateString();

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
  async getDueReviewItems(userId: string) {
    const todayStr = this.getTodayDateString();

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
  ): Promise<{ count: number; dueCount: number }> {
    const todayStr = this.getTodayDateString();
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

    const todayStr = this.getTodayDateString();

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
      nextDueDateStr = this.getFutureDateString(newIntervalDays);
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
      nextDueDateStr = this.getTomorrowDateString();
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
