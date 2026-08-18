import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AiGenerateService } from './ai-generate.service';
import {
  GenerateRoadmapDescriptionDto,
  GenerateRoadmapModulesDto,
  GenerateModuleConceptsDto,
  GenerateModuleMcqsDto,
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
} from './dto/ai-generate.dto';
import {
  ROADMAP_DESCRIPTION_SYSTEM_PROMPT,
  buildRoadmapDescriptionUserPrompt,
} from './constants/prompts';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';

@ApiTags('AI Generate')
@ApiBearerAuth('bearer-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@Controller('ai-generate')
export class AiGenerateController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  @Get('quota')
  @ApiOperation({
    summary:
      'Get the remaining daily AI generation quota for the authenticated instructor/admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Remaining quota out of 20 daily generations.',
  })
  async getQuota(
    @CurrentUser() user: User,
  ): Promise<{ remaining: number; limit: number }> {
    const { remaining } = await this.aiGenerateService.checkRateLimit(user.id);
    return { remaining, limit: 20 };
  }

  @Post('roadmap-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Stream generated roadmap description via Server-Sent Events (live typing)',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of description text chunks.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily rate limit of 20 generations exceeded.',
  })
  async generateRoadmapDescription(
    @CurrentUser() user: User,
    @Body() dto: GenerateRoadmapDescriptionDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiGenerateService.checkRateLimit(user.id);
    await this.aiGenerateService.logGeneration(
      user.id,
      AiGenerationType.ROADMAP_DESCRIPTION,
    );

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const systemPrompt = ROADMAP_DESCRIPTION_SYSTEM_PROMPT;
    const userPrompt = buildRoadmapDescriptionUserPrompt(dto.title);

    await this.aiGenerateService.streamNvidiaCompletion(
      systemPrompt,
      userPrompt,
      res,
      { maxTokens: 120 },
      abortController.signal,
    );
  }

  @Post('roadmap-modules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate and create ordered modules for a roadmap using AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Created modules returned.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily rate limit exceeded.',
  })
  async generateRoadmapModules(
    @CurrentUser() user: User,
    @Body() dto: GenerateRoadmapModulesDto,
  ) {
    return this.aiGenerateService.generateRoadmapModules(dto.roadmapId, user);
  }

  @Post('module-concepts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate concept titles and full article content sequentially for a module',
  })
  @ApiResponse({
    status: 200,
    description: 'Created concepts with full content attached to module.',
  })
  @ApiResponse({
    status: 429,
    description: 'Insufficient remaining quota for batch concept generation.',
  })
  async generateModuleConcepts(
    @CurrentUser() user: User,
    @Body() dto: GenerateModuleConceptsDto,
  ) {
    return this.aiGenerateService.generateModuleConcepts(dto.moduleId, user);
  }

  @Post('module-mcqs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate and attach 5 assessment MCQs for every concept in a module lacking questions',
  })
  @ApiResponse({
    status: 200,
    description: 'MCQs generated and attached to concepts in the module.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily rate limit exceeded.',
  })
  async generateModuleMcqs(
    @CurrentUser() user: User,
    @Body() dto: GenerateModuleMcqsDto,
  ) {
    return this.aiGenerateService.generateModuleMcqs(dto.moduleId, user);
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
    description: 'Daily rate limit of 20 generations exceeded.',
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
    description: 'Daily rate limit of 20 generations exceeded.',
  })
  async generateConceptMcqs(
    @CurrentUser() user: User,
    @Body() dto: GenerateConceptMcqsDto,
  ) {
    return this.aiGenerateService.generateSingleConceptMcqs(dto, user);
  }
}
