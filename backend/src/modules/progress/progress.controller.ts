import { Controller, Get, Post, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Progress')
@ApiBearerAuth('bearer-auth')
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('concepts/:conceptId/complete')
  @ApiOperation({ summary: 'Manually mark a concept as completed' })
  @ApiResponse({ status: 200, description: 'Concept marked as completed.' })
  async markConceptCompleted(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ) {
    return this.progressService.markConceptCompleted(user.id, conceptId);
  }

  @Post('concepts/:conceptId/start')
  @ApiOperation({ summary: 'Mark a concept as started (in_progress)' })
  @ApiResponse({ status: 200, description: 'Concept marked as in_progress.' })
  async markConceptStarted(
    @Param('conceptId') conceptId: string,
    @CurrentUser() user: User,
  ) {
    return this.progressService.markConceptStarted(user.id, conceptId);
  }

  @Get('progress/me')
  @ApiOperation({ summary: 'Get overall progress list for current user' })
  @ApiResponse({ status: 200, description: 'User progress retrieved.' })
  async getSelfProgress(@CurrentUser() user: User) {
    return this.progressService.getSelfProgress(user.id);
  }

  @Get('roadmaps/:roadmapId/progress')
  @ApiOperation({
    summary:
      'Get current user roadmap progress & soft prerequisite completion status',
  })
  @ApiResponse({ status: 200, description: 'Roadmap progress retrieved.' })
  async getRoadmapProgress(
    @Param('roadmapId') roadmapId: string,
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.progressService.getRoadmapProgress(user.id, roadmapId);
  }
}
