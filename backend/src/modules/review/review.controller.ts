import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AnswerReviewItemDto } from './dto/answer-review-item.dto';

@ApiTags('Spaced Repetition Review')
@ApiBearerAuth('bearer-auth')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('due')
  @ApiOperation({
    summary: "Get the current user's due review session",
  })
  @ApiResponse({
    status: 200,
    description:
      'Due items with redacted options. FSRS caps and interleaves the session; use due-count for held-back and unavailable totals. FSRS items include isLeech and remediation.',
  })
  async getDueReviewItems(@CurrentUser() user: User) {
    return this.reviewService.getDueReviewItems(
      user.id,
      user.timezone,
      user.role,
    );
  }

  @Get('due-count')
  @ApiOperation({
    summary: 'Get count of review items due today or overdue',
  })
  @ApiResponse({
    status: 200,
    description:
      'count and dueCount include all due histories. FSRS additionally returns sessionCount, heldBackCount, unavailableCount and leechCount.',
  })
  async getDueCount(@CurrentUser() user: User) {
    return this.reviewService.getDueCount(user.id, user.timezone, user.role);
  }

  @Post(':reviewItemId/answer')
  @ApiOperation({
    summary:
      'Submit an answer for a due review item with anti-farming validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Review answered and schedule recalculated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Item is not due yet or invalid option selected.',
  })
  async answerReviewItem(
    @Param('reviewItemId') reviewItemId: string,
    @CurrentUser() user: User,
    @Body() dto: AnswerReviewItemDto,
  ) {
    return this.reviewService.answerReviewItem(
      reviewItemId,
      user.id,
      dto,
      user.timezone,
      user.role,
    );
  }
}
