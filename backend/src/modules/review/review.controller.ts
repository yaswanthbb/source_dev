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
    summary: 'Get all review items due today or overdue for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Due review items with questions and options retrieved.',
  })
  async getDueReviewItems(@CurrentUser() user: User) {
    return this.reviewService.getDueReviewItems(user.id);
  }

  @Get('due-count')
  @ApiOperation({
    summary: 'Get count of review items due today or overdue',
  })
  @ApiResponse({
    status: 200,
    description: 'Count of due items retrieved.',
  })
  async getDueCount(@CurrentUser() user: User) {
    return this.reviewService.getDueCount(user.id);
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
    return this.reviewService.answerReviewItem(reviewItemId, user.id, dto);
  }
}
