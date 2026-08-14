import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

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

  @Get('badges')
  @ApiOperation({ summary: 'List all achievable badges in the system' })
  @ApiResponse({ status: 200, description: 'All badges retrieved.' })
  async getAllBadges() {
    return this.gamificationService.getAllBadges();
  }
}
