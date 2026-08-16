import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { GetActivityQueryDto } from './dto/get-activity-query.dto';

@ApiTags('Gamification')
@ApiBearerAuth('bearer-auth')
@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('gamification/me')
  @ApiOperation({
    summary: 'Get current user gamification stats (XP, streaks, badges)',
  })
  @ApiResponse({ status: 200, description: 'Gamification stats retrieved.' })
  async getSelfGamification(
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.gamificationService.getSelfGamification(user.id);
  }

  @Get('gamification/activity')
  @ApiOperation({
    summary: 'Get activity heatmap array for the last N days (UTC-based)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity heatmap array retrieved successfully.',
  })
  async getActivityHeatmap(
    @CurrentUser() user: User,
    @Query() query: GetActivityQueryDto,
  ) {
    return this.gamificationService.getActivityHeatmap(
      user.id,
      query.days ?? 14,
    );
  }

  @Get('badges')
  @ApiOperation({ summary: 'List all achievable badges in the system' })
  @ApiResponse({ status: 200, description: 'All badges retrieved.' })
  async getAllBadges() {
    return this.gamificationService.getAllBadges();
  }
}
