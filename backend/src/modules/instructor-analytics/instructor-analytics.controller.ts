import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  InstructorAnalyticsService,
  InstructorOverviewAnalytics,
  InstructorConceptAnalytics,
  InstructorQuizQuestionAnalytics,
} from './instructor-analytics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Instructor Analytics')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@Controller('instructor/my-analytics')
export class InstructorAnalyticsController {
  constructor(
    private readonly instructorAnalyticsService: InstructorAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get overview analytics for current approved instructor',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor overview metrics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Approved instructor access required).',
  })
  async getOverview(
    @CurrentUser() user: User,
  ): Promise<InstructorOverviewAnalytics> {
    return this.instructorAnalyticsService.getOverview(user);
  }

  @Get('concepts')
  @ApiOperation({
    summary:
      'Get performance breakdown for concepts authored by current instructor',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor concept metrics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Approved instructor access required).',
  })
  async getConcepts(
    @CurrentUser() user: User,
  ): Promise<InstructorConceptAnalytics[]> {
    return this.instructorAnalyticsService.getConcepts(user);
  }

  @Get('quiz-questions')
  @ApiOperation({
    summary:
      'Get quiz question analytics and distractor signals for questions authored by instructor',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor quiz question analytics retrieved.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Approved instructor access required).',
  })
  async getQuizQuestions(
    @CurrentUser() user: User,
  ): Promise<InstructorQuizQuestionAnalytics[]> {
    return this.instructorAnalyticsService.getQuizQuestions(user);
  }
}
