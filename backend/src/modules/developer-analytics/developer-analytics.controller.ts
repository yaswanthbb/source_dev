import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  DeveloperAnalyticsService,
  DeveloperOverviewAnalytics,
  DeveloperConceptAnalytics,
  DeveloperQuizQuestionAnalytics,
} from './developer-analytics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Developer Analytics')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.DEVELOPER, UserRole.ADMIN)
@Controller('developer/my-analytics')
export class DeveloperAnalyticsController {
  constructor(
    private readonly developerAnalyticsService: DeveloperAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get overview analytics for the current developer',
  })
  @ApiResponse({
    status: 200,
    description: 'Developer overview metrics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Developer access required).',
  })
  async getOverview(
    @CurrentUser() user: User,
  ): Promise<DeveloperOverviewAnalytics> {
    return this.developerAnalyticsService.getOverview(user);
  }

  @Get('concepts')
  @ApiOperation({
    summary:
      'Get performance breakdown for concepts authored by the current developer',
  })
  @ApiResponse({
    status: 200,
    description: 'Developer concept metrics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Developer access required).',
  })
  async getConcepts(
    @CurrentUser() user: User,
  ): Promise<DeveloperConceptAnalytics[]> {
    return this.developerAnalyticsService.getConcepts(user);
  }

  @Get('quiz-questions')
  @ApiOperation({
    summary:
      'Get quiz question analytics and distractor signals for questions authored by the developer',
  })
  @ApiResponse({
    status: 200,
    description: 'Developer quiz question analytics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Developer access required).',
  })
  async getQuizQuestions(
    @CurrentUser() user: User,
  ): Promise<DeveloperQuizQuestionAnalytics[]> {
    return this.developerAnalyticsService.getQuizQuestions(user);
  }
}
