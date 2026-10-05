import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AiGenerateService } from './ai-generate.service';
import {
  GenerateRoadmapModulesDto,
  GenerateModuleConceptsDto,
  GenerateModuleMcqsDto,
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
  AcknowledgeJobsDto,
} from './dto/ai-generate.dto';
import { AiGenerationJobType } from '../../common/enums/ai-generation-job.enum';
import { AiGenerationJob } from './entities/ai-generation-job.entity';

@ApiTags('AI Generate')
@ApiBearerAuth('bearer-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER, UserRole.ADMIN)
@Controller('ai-generate')
export class AiGenerateController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  @Get('quota')
  @ApiOperation({
    summary:
      'Remaining daily quota for what the next generation would use (free tier, own default key, or unlimited admin)',
  })
  @ApiResponse({
    status: 200,
    description:
      "Remaining quota in the applicable bucket, counted against the user's own timezone.",
  })
  async getQuota(@CurrentUser() user: User): Promise<{
    remaining: number;
    limit: number;
    unlimited: boolean;
    tier: string;
    provider: string;
  }> {
    const creds = await this.aiGenerateService.resolveCredentials(user);
    // Non-throwing read: exhaustion surfaces as zeros, never a 429, so the
    // badge (and any other reader) keeps rendering at the limit.
    const { remaining, limit, unlimited } =
      await this.aiGenerateService.readQuota(
        user.id,
        user.timezone,
        creds,
      );
    return {
      remaining,
      limit,
      unlimited,
      tier: creds.tier,
      provider: creds.provider,
    };
  }

  @Get('jobs/active')
  @ApiOperation({
    summary:
      'List all pending/running AI generation jobs for the current developer',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of active generation jobs (newest first).',
  })
  async getActiveJobs(@CurrentUser() user: User): Promise<AiGenerationJob[]> {
    return this.aiGenerateService.getActiveJobs(user);
  }

  @Get('jobs/results')
  @ApiOperation({
    summary:
      'List unread finished (completed/failed) generation results for the persistent results banner',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of unread finished jobs (newest first).',
  })
  async getFinishedResults(
    @CurrentUser() user: User,
  ): Promise<AiGenerationJob[]> {
    return this.aiGenerateService.getFinishedResults(user);
  }

  @Post('jobs/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mark finished generation results as read so they stop re-appearing in the banner',
  })
  @ApiResponse({
    status: 200,
    description: 'Number of results marked as acknowledged.',
  })
  async acknowledgeJobs(
    @CurrentUser() user: User,
    @Body() dto: AcknowledgeJobsDto,
  ): Promise<{ acknowledged: number }> {
    return this.aiGenerateService.acknowledgeJobs(user, dto.jobIds);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get the current status, progress, and result of a generation job',
  })
  @ApiResponse({
    status: 200,
    description: 'The generation job record.',
  })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async getJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ): Promise<AiGenerationJob> {
    return this.aiGenerateService.getJob(jobId, user);
  }

  @Post('roadmap-modules')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Start a background job to generate and create ordered modules for a roadmap',
  })
  @ApiResponse({
    status: 202,
    description: 'Job accepted. Returns the job id to poll for progress.',
  })
  @ApiResponse({
    status: 400,
    description: 'A generation is already in progress for this roadmap.',
  })
  @ApiResponse({ status: 429, description: 'Daily rate limit exceeded.' })
  async generateRoadmapModules(
    @CurrentUser() user: User,
    @Body() dto: GenerateRoadmapModulesDto,
  ): Promise<{ jobId: string }> {
    return this.aiGenerateService.startGenerationJob(
      AiGenerationJobType.ROADMAP_MODULES,
      dto.roadmapId,
      user,
      { provider: dto.provider, model: dto.model },
    );
  }

  @Post('module-concepts')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Start a background job to generate concept titles and full article content for a module',
  })
  @ApiResponse({
    status: 202,
    description: 'Job accepted. Returns the job id to poll for progress.',
  })
  @ApiResponse({
    status: 400,
    description: 'A generation is already in progress for this module.',
  })
  @ApiResponse({
    status: 429,
    description: 'Insufficient remaining quota for batch concept generation.',
  })
  async generateModuleConcepts(
    @CurrentUser() user: User,
    @Body() dto: GenerateModuleConceptsDto,
  ): Promise<{ jobId: string }> {
    return this.aiGenerateService.startGenerationJob(
      AiGenerationJobType.MODULE_CONCEPTS,
      dto.moduleId,
      user,
      { provider: dto.provider, model: dto.model },
    );
  }

  @Post('module-mcqs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Start a background job to generate and attach assessment MCQs for every concept in a module lacking questions',
  })
  @ApiResponse({
    status: 202,
    description: 'Job accepted. Returns the job id to poll for progress.',
  })
  @ApiResponse({
    status: 400,
    description: 'A generation is already in progress for this module.',
  })
  @ApiResponse({ status: 429, description: 'Daily rate limit exceeded.' })
  async generateModuleMcqs(
    @CurrentUser() user: User,
    @Body() dto: GenerateModuleMcqsDto,
  ): Promise<{ jobId: string }> {
    return this.aiGenerateService.startGenerationJob(
      AiGenerationJobType.MODULE_MCQS,
      dto.moduleId,
      user,
      { provider: dto.provider, model: dto.model },
    );
  }

  @Post('concept-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate full Markdown concept article with curriculum context in one shot',
  })
  @ApiResponse({
    status: 200,
    description: 'Generated Markdown concept content.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily quota for the applicable bucket exceeded.',
  })
  async generateConceptContent(
    @CurrentUser() user: User,
    @Body() dto: GenerateConceptContentDto,
  ) {
    return this.aiGenerateService.generateSingleConceptContent(dto, user);
  }

  @Post('concept-mcqs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate complete, valid assessment MCQs JSON for Swagger Auto-Mapper in one shot',
  })
  @ApiResponse({
    status: 200,
    description: 'Generated valid JSON array of questions for auto-mapper.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily quota for the applicable bucket exceeded.',
  })
  async generateConceptMcqs(
    @CurrentUser() user: User,
    @Body() dto: GenerateConceptMcqsDto,
  ) {
    return this.aiGenerateService.generateSingleConceptMcqs(dto, user);
  }
}
