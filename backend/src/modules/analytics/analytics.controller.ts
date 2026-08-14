import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AnalyticsService,
  OverviewAnalytics,
  RoadmapAnalytics,
  ConceptAnalytics,
  InstructorAnalytics,
} from './analytics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin Analytics')
@ApiBearerAuth('bearer-auth')
@Controller('admin/analytics')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform-wide overview metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overview metrics retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    return this.analyticsService.getOverviewAnalytics();
  }

  @Get('roadmaps')
  @ApiOperation({
    summary: 'Get per-roadmap enrolment and completion analytics (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Roadmap analytics retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async getRoadmapAnalytics(): Promise<RoadmapAnalytics[]> {
    return this.analyticsService.getRoadmapAnalytics();
  }

  @Get('concepts')
  @ApiOperation({
    summary:
      'Get per-concept completion breakdown for touched concepts (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Concept analytics retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async getConceptAnalytics(): Promise<ConceptAnalytics[]> {
    return this.analyticsService.getConceptAnalytics();
  }

  @Get('instructors')
  @ApiOperation({
    summary:
      'Get per-instructor content creation and Q&A activity breakdown (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor analytics retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async getInstructorAnalytics(): Promise<InstructorAnalytics[]> {
    return this.analyticsService.getInstructorAnalytics();
  }
}
