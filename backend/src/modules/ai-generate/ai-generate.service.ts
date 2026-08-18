import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import type { Response } from 'express';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { ConceptDifficulty } from '../../common/enums/concept-difficulty.enum';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { RoadmapsService } from '../content/roadmaps.service';
import { ConceptsService } from '../content/concepts.service';
import { QuizService } from '../quiz/quiz.service';
import { User } from '../users/entities/user.entity';
import {
  ROADMAP_MODULES_SYSTEM_PROMPT,
  buildRoadmapModulesUserPrompt,
  MODULE_CONCEPTS_SYSTEM_PROMPT,
  buildModuleConceptsUserPrompt,
  CONCEPT_CONTENT_SYSTEM_PROMPT,
  buildConceptContentUserPrompt,
  CONCEPT_MCQ_SYSTEM_PROMPT,
  buildConceptMcqUserPrompt,
} from './constants/prompts';
import {
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
} from './dto/ai-generate.dto';

const DAILY_LIMIT = 20;

@Injectable()
export class AiGenerateService {
  private readonly logger = new Logger(AiGenerateService.name);

  constructor(
    @InjectRepository(AiGenerationLog)
    private readonly aiGenerationLogRepository: Repository<AiGenerationLog>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConceptRepository: Repository<ModuleConcept>,
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
    private readonly configService: ConfigService,
    private readonly roadmapsService: RoadmapsService,
    private readonly conceptsService: ConceptsService,
    private readonly quizService: QuizService,
  ) {}

  /**
   * Check if the user has reached their daily limit (UTC calendar day).
   * Optional requiredSlots parameter ensures enough quota remains for batch operations.
   */
  async checkRateLimit(
    userId: string,
    requiredSlots = 1,
  ): Promise<{ remaining: number }> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const count = await this.aiGenerationLogRepository.count({
      where: {
        userId,
        generatedAt: MoreThanOrEqual(startOfDay),
      },
    });

    const remaining = Math.max(0, DAILY_LIMIT - count);

    if (remaining < requiredSlots) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            requiredSlots > 1
              ? `At least ${requiredSlots} AI generations remaining are required for this batch operation. You have ${remaining}/${DAILY_LIMIT} remaining today.`
              : `Daily AI generation limit reached (${DAILY_LIMIT} generations per day). Please try again tomorrow (UTC).`,
          error: 'Too Many Requests',
          remaining,
          limit: DAILY_LIMIT,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { remaining };
  }

  /**
   * Record a generation event in the log
   */
  async logGeneration(
    userId: string,
    type: AiGenerationType,
  ): Promise<AiGenerationLog> {
    const log = this.aiGenerationLogRepository.create({
      userId,
      generationType: type,
      generatedAt: new Date(),
    });
    return this.aiGenerationLogRepository.save(log);
  }

  /**
   * Cleans model output by removing markdown code fences and extraneous whitespace
   */
  private cleanModelOutput(raw: string): string {
    let text = raw.trim();
    if (text.startsWith('```')) {
      // Remove opening fence (e.g. ```json or ```markdown or ```)
      text = text.replace(/^```[a-zA-Z]*\s*\n?/, '');
      // Remove closing fence
      text = text.replace(/\n?```\s*$/, '');
    }
    return text.trim();
  }

  /**
   * Executes a non-streaming completion request against NVIDIA NIM API
   */
  async generateNvidiaCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; temperature?: number },
    signal?: AbortSignal,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('NVIDIA_API_KEY')?.trim();
    const apiUrl =
      this.configService.get<string>('NVIDIA_API_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1/chat/completions';
    const modelId =
      this.configService.get<string>('NVIDIA_MODEL_ID')?.trim() ||
      'meta/llama-3.1-70b-instruct';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'NVIDIA API key (NVIDIA_API_KEY) is not configured on the server.',
      );
    }

    const maxTokens = options?.maxTokens ?? 2048;
    const temperature = options?.temperature ?? 0.6;

    let response: globalThis.Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          temperature,
          top_p: 0.9,
          max_tokens: maxTokens,
        }),
        signal,
      });
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to reach NVIDIA NIM API: ${error.message}`);
      throw new HttpException(
        `Unable to reach NVIDIA NIM API: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `NVIDIA NIM API error HTTP ${response.status}: ${errorBody}`,
      );
      throw new HttpException(
        `NVIDIA NIM API Error (${response.status}): ${errorBody}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as any;
    const rawContent = data.choices?.[0]?.message?.content || '';
    return this.cleanModelOutput(rawContent);
  }

  /**
   * Proxies streaming completion request to NVIDIA NIM API and pipes SSE chunks to client response.
   * Kept for Roadmap Description generation.
   */
  async streamNvidiaCompletion(
    systemPrompt: string,
    userPrompt: string,
    res: Response,
    options?: { maxTokens?: number; temperature?: number },
    signal?: AbortSignal,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('NVIDIA_API_KEY')?.trim();
    const apiUrl =
      this.configService.get<string>('NVIDIA_API_URL')?.trim() ||
      'https://integrate.api.nvidia.com/v1/chat/completions';
    const modelId =
      this.configService.get<string>('NVIDIA_MODEL_ID')?.trim() ||
      'meta/llama-3.1-70b-instruct';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'NVIDIA API key (NVIDIA_API_KEY) is not configured on the server.',
      );
    }

    const maxTokens = options?.maxTokens ?? 2048;
    const temperature = options?.temperature ?? 0.6;

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let nvidiaRes: globalThis.Response;

    try {
      nvidiaRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          temperature,
          top_p: 0.9,
          max_tokens: maxTokens,
        }),
        signal,
      });
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to connect to NVIDIA NIM API: ${error.message}`);
      if (!res.headersSent) {
        throw new HttpException(
          `Unable to reach NVIDIA NIM API: ${error.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      res.write(
        `data: ${JSON.stringify({ error: `Connection failed: ${error.message}` })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (!nvidiaRes.ok) {
      const errorBody = await nvidiaRes.text();
      this.logger.error(
        `NVIDIA NIM API returned error HTTP ${nvidiaRes.status}: ${errorBody}`,
      );
      res.write(
        `data: ${JSON.stringify({ error: `NVIDIA API Error (${nvidiaRes.status}): ${errorBody}` })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (!nvidiaRes.body) {
      res.write(
        `data: ${JSON.stringify({ error: 'Empty response body from NVIDIA API' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = nvidiaRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                res.write(
                  `data: ${JSON.stringify({ content: deltaContent })}\n\n`,
                );
              }
            } catch {
              // Non-JSON line, continue buffering
            }
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
        } else if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              res.write(
                `data: ${JSON.stringify({ content: deltaContent })}\n\n`,
              );
            }
          } catch {
            // ignore malformed tail
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.warn(`Stream reading error or client abort: ${error.message}`);
      try {
        res.write('data: [DONE]\n\n');
        res.end();
      } catch {
        // response may already be closed
      }
    }
  }

  /**
   * Helper to parse JSON array of strings from AI response
   */
  private parseStringArray(raw: string): string[] {
    const cleaned = this.cleanModelOutput(raw);
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      // Fallback: extract array using regex
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => (typeof item === 'string' ? item.trim() : ''))
              .filter(Boolean);
          }
        } catch {
          // ignore fallback failure
        }
      }
    }
    return [];
  }

  /**
   * Part 3: Generate Modules for a Roadmap
   */
  async generateRoadmapModules(
    roadmapId: string,
    user: User,
  ): Promise<{ modules: ModuleEntity[]; count: number }> {
    await this.checkRateLimit(user.id);

    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
      relations: ['modules'],
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    this.roadmapsService.checkOwnership(roadmap.createdById, user);

    const existingModules = roadmap.modules || [];
    const existingTitles = existingModules.map((m) => m.title);

    const systemPrompt = ROADMAP_MODULES_SYSTEM_PROMPT;
    const userPrompt = buildRoadmapModulesUserPrompt(
      roadmap.title,
      roadmap.description || undefined,
      existingTitles,
    );

    const responseText = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 400, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.ROADMAP_MODULES);

    const moduleTitles = this.parseStringArray(responseText);
    if (moduleTitles.length === 0) {
      throw new HttpException(
        'AI failed to produce a valid list of module titles. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const createdModules: ModuleEntity[] = [];
    const startOrderIndex = existingModules.length;

    for (let i = 0; i < moduleTitles.length; i++) {
      const title = moduleTitles[i];
      const created = await this.roadmapsService.createModule(roadmapId, user, {
        title,
        orderIndex: startOrderIndex + i + 1,
      });
      createdModules.push(created);
    }

    return {
      modules: createdModules,
      count: createdModules.length,
    };
  }

  /**
   * Part 4: Generate Concepts (with content) for a Module in sequence
   */
  async generateModuleConcepts(
    moduleId: string,
    user: User,
  ): Promise<{
    createdConcepts: Concept[];
    totalRequested: number;
    createdCount: number;
    skippedCount: number;
    error?: string;
  }> {
    // Upfront check: require at least 7 generation slots remaining
    await this.checkRateLimit(user.id, 7);

    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap', 'moduleConcepts', 'moduleConcepts.concept'],
    });

    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }

    this.roadmapsService.checkOwnership(moduleEntity.roadmap?.createdById, user);

    const existingConceptTitles = (moduleEntity.moduleConcepts || [])
      .map((mc) => mc.concept?.title)
      .filter((t): t is string => Boolean(t));

    // Phase 1: Generate concept title list
    const systemPrompt = MODULE_CONCEPTS_SYSTEM_PROMPT;
    const userPrompt = buildModuleConceptsUserPrompt(
      moduleEntity.roadmap?.title || '',
      moduleEntity.roadmap?.description || undefined,
      moduleEntity.title,
      existingConceptTitles,
    );

    const titlesResponse = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 400, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.MODULE_CONCEPTS);

    const conceptTitles = this.parseStringArray(titlesResponse);
    if (conceptTitles.length === 0) {
      throw new HttpException(
        'AI failed to produce a valid list of concept titles. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Phase 2: Generate full content for each concept sequentially with sibling awareness
    const createdConcepts: Concept[] = [];
    const cumulativeSiblingTitles = [...existingConceptTitles];
    let skippedCount = 0;
    let quotaError: string | undefined;

    for (let i = 0; i < conceptTitles.length; i++) {
      const title = conceptTitles[i];

      // Check quota before each individual content call
      try {
        await this.checkRateLimit(user.id, 1);
      } catch {
        quotaError = 'Daily AI generation limit reached mid-batch.';
        skippedCount = conceptTitles.length - createdConcepts.length;
        break;
      }

      try {
        const contentPrompt = buildConceptContentUserPrompt({
          title,
          difficulty: 'medium',
          roadmapTitle: moduleEntity.roadmap?.title,
          roadmapDescription: moduleEntity.roadmap?.description || undefined,
          moduleTitle: moduleEntity.title,
          siblingConceptTitles: cumulativeSiblingTitles,
        });

        const generatedContent = await this.generateNvidiaCompletion(
          CONCEPT_CONTENT_SYSTEM_PROMPT,
          contentPrompt,
          { maxTokens: 3000, temperature: 0.6 },
        );

        await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT);

        // Create concept using existing service
        const createdConcept = await this.conceptsService.createConcept(user, {
          title,
          content: generatedContent,
          difficulty: ConceptDifficulty.MEDIUM,
        });

        // Attach concept to module using existing service (inherits order index & prerequisite logic)
        await this.roadmapsService.attachConceptToModule(moduleId, user, {
          conceptId: createdConcept.id,
        });

        createdConcepts.push(createdConcept);
        cumulativeSiblingTitles.push(title);
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed generating content for concept "${title}": ${error.message}`,
        );
        // Continue with remaining concepts if one fails
      }
    }

    return {
      createdConcepts,
      totalRequested: conceptTitles.length,
      createdCount: createdConcepts.length,
      skippedCount: skippedCount > 0 ? skippedCount : conceptTitles.length - createdConcepts.length,
      error: quotaError,
    };
  }

  /**
   * Part 5: Generate MCQs for a Module (for concepts lacking MCQs)
   */
  async generateModuleMcqs(
    moduleId: string,
    user: User,
  ): Promise<{
    generatedCount: number;
    totalConcepts: number;
    skippedCount: number;
    failedCount: number;
    error?: string;
  }> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap', 'moduleConcepts', 'moduleConcepts.concept'],
    });

    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }

    this.roadmapsService.checkOwnership(moduleEntity.roadmap?.createdById, user);

    const moduleConcepts = moduleEntity.moduleConcepts || [];
    if (moduleConcepts.length === 0) {
      return {
        generatedCount: 0,
        totalConcepts: 0,
        skippedCount: 0,
        failedCount: 0,
      };
    }

    // Find concepts in this module that do NOT have any questions
    const conceptIds = moduleConcepts.map((mc) => mc.conceptId);
    const existingQuestionCounts = await this.mcqQuestionRepository
      .createQueryBuilder('q')
      .select('q.concept_id', 'conceptId')
      .addSelect('COUNT(q.id)', 'count')
      .where('q.concept_id IN (:...conceptIds)', { conceptIds })
      .groupBy('q.concept_id')
      .getRawMany<{ conceptId: string; count: string }>();

    const conceptsWithQuestions = new Set(
      existingQuestionCounts
        .filter((row) => parseInt(row.count, 10) > 0)
        .map((row) => row.conceptId),
    );

    const conceptsNeedingMcqs = moduleConcepts
      .filter((mc) => !conceptsWithQuestions.has(mc.conceptId) && mc.concept)
      .map((mc) => mc.concept);

    if (conceptsNeedingMcqs.length === 0) {
      return {
        generatedCount: 0,
        totalConcepts: 0,
        skippedCount: 0,
        failedCount: 0,
      };
    }

    let generatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let quotaError: string | undefined;

    for (const concept of conceptsNeedingMcqs) {
      // Check quota before each concept MCQ generation
      try {
        await this.checkRateLimit(user.id, 1);
      } catch {
        quotaError = 'Daily AI generation limit reached mid-batch.';
        skippedCount = conceptsNeedingMcqs.length - (generatedCount + failedCount);
        break;
      }

      try {
        const userPrompt = buildConceptMcqUserPrompt(
          concept.title,
          concept.content,
        );

        const responseText = await this.generateNvidiaCompletion(
          CONCEPT_MCQ_SYSTEM_PROMPT,
          userPrompt,
          { maxTokens: 1200, temperature: 0.5 },
        );

        await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS);

        const cleaned = this.cleanModelOutput(responseText);
        let parsedQuestions: any[] = [];

        try {
          parsedQuestions = JSON.parse(cleaned);
        } catch {
          const match = cleaned.match(/\[[\s\S]*\]/);
          if (match) {
            parsedQuestions = JSON.parse(match[0]);
          }
        }

        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
          this.logger.warn(
            `Invalid MCQ JSON response for concept "${concept.title}"`,
          );
          failedCount++;
          continue;
        }

        // Validate and create questions sequentially using QuizService
        let createdForConcept = 0;
        for (let qIdx = 0; qIdx < parsedQuestions.length; qIdx++) {
          const q = parsedQuestions[qIdx];
          if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
            continue;
          }

          const correctOptions = q.options.filter(
            (o: any) => o.isCorrect === true,
          );
          if (correctOptions.length !== 1) {
            continue;
          }

          await this.quizService.createQuestion(concept.id, user, {
            questionText: q.questionText,
            orderIndex: qIdx + 1,
            options: q.options.map((opt: any, oIdx: number) => ({
              optionText: opt.optionText || '',
              isCorrect: Boolean(opt.isCorrect),
              orderIndex: oIdx + 1,
            })),
          });
          createdForConcept++;
        }

        if (createdForConcept > 0) {
          generatedCount++;
        } else {
          failedCount++;
        }
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed MCQ generation for concept "${concept.title}": ${error.message}`,
        );
        failedCount++;
      }
    }

    return {
      generatedCount,
      totalConcepts: conceptsNeedingMcqs.length,
      skippedCount,
      failedCount,
      error: quotaError,
    };
  }

  /**
   * Non-streaming single concept content generation helper
   */
  async generateSingleConceptContent(
    dto: GenerateConceptContentDto,
    user: User,
  ): Promise<{ content: string }> {
    await this.checkRateLimit(user.id);

    const systemPrompt = CONCEPT_CONTENT_SYSTEM_PROMPT;
    const userPrompt = buildConceptContentUserPrompt(dto);

    const content = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 3000, temperature: 0.6 },
    );

    await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT);

    return { content };
  }

  /**
   * Non-streaming single concept MCQs generation helper
   */
  async generateSingleConceptMcqs(
    dto: GenerateConceptMcqsDto,
    user: User,
  ): Promise<{ rawText: string }> {
    await this.checkRateLimit(user.id);

    const systemPrompt = CONCEPT_MCQ_SYSTEM_PROMPT;
    const userPrompt = buildConceptMcqUserPrompt(dto.title, dto.content);

    const rawResponse = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 1200, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS);

    const cleaned = this.cleanModelOutput(rawResponse);
    let formatted = cleaned;

    // Validate and format JSON nicely
    try {
      const parsed = JSON.parse(cleaned);
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          formatted = JSON.stringify(parsed, null, 2);
        } catch {
          // fallback to cleaned string
        }
      }
    }

    return { rawText: formatted };
  }
}
