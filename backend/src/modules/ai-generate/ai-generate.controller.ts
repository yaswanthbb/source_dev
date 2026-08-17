import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
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
import type { Response, Request } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import {
  GenerateRoadmapDescriptionDto,
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
} from './dto/ai-generate.dto';
import {
  ROADMAP_DESCRIPTION_SYSTEM_PROMPT,
  buildRoadmapDescriptionUserPrompt,
  CONCEPT_CONTENT_SYSTEM_PROMPT,
  buildConceptContentUserPrompt,
  CONCEPT_MCQ_SYSTEM_PROMPT,
  buildConceptMcqUserPrompt,
} from './constants/prompts';

@ApiTags('AI Content Generation')
@ApiBearerAuth('bearer-auth')
@UseGuards(RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@Controller('ai-generate')
export class AiGenerateController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  @Get('quota')
  @ApiOperation({
    summary: 'Check remaining daily AI generations for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns remaining generation quota for today (UTC).',
  })
  async getQuota(@CurrentUser() user: User) {
    const { remaining } = await this.aiGenerateService.checkRateLimit(user.id);
    return { remaining, limit: 20 };
  }

  @Post('roadmap-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stream generated roadmap description via Server-Sent Events',
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

  @Post('concept-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Stream generated Markdown concept article via Server-Sent Events with curriculum context',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of Markdown content chunks.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily rate limit of 20 generations exceeded.',
  })
  async generateConceptContent(
    @CurrentUser() user: User,
    @Body() dto: GenerateConceptContentDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiGenerateService.checkRateLimit(user.id);
    await this.aiGenerateService.logGeneration(
      user.id,
      AiGenerationType.CONCEPT_CONTENT,
    );

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const systemPrompt = CONCEPT_CONTENT_SYSTEM_PROMPT;
    const userPrompt = buildConceptContentUserPrompt(dto);

    await this.aiGenerateService.streamNvidiaCompletion(
      systemPrompt,
      userPrompt,
      res,
      { maxTokens: 3000 },
      abortController.signal,
    );
  }

  @Post('concept-mcqs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Stream generated assessment MCQs in JSON format via Server-Sent Events',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of raw JSON array chunks matching Auto-Mapper.',
  })
  @ApiResponse({
    status: 429,
    description: 'Daily rate limit of 20 generations exceeded.',
  })
  async generateConceptMcqs(
    @CurrentUser() user: User,
    @Body() dto: GenerateConceptMcqsDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiGenerateService.checkRateLimit(user.id);
    await this.aiGenerateService.logGeneration(
      user.id,
      AiGenerationType.CONCEPT_MCQS,
    );

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const systemPrompt = CONCEPT_MCQ_SYSTEM_PROMPT;
    const userPrompt = buildConceptMcqUserPrompt(dto.title, dto.content);

    await this.aiGenerateService.streamNvidiaCompletion(
      systemPrompt,
      userPrompt,
      res,
      { maxTokens: 1200 },
      abortController.signal,
    );
  }
}
