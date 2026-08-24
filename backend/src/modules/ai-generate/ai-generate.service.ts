import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';

import { AiGenerationLog } from './entities/ai-generation-log.entity';
import {
  AiGenerationJob,
  AiGenerationJobFailedItem,
  AiGenerationJobResultSummary,
} from './entities/ai-generation-job.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import {
  AiGenerationJobType,
  AiGenerationJobStatus,
} from '../../common/enums/ai-generation-job.enum';
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
  QA_ANSWER_SYSTEM_PROMPT,
  buildQaAnswerUserPrompt,
} from './constants/prompts';

import {
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
} from './dto/ai-generate.dto';

interface ParsedMcqOption {
  optionText?: string;
  isCorrect?: boolean;
}

interface ParsedMcqQuestion {
  questionText?: string;
  options?: ParsedMcqOption[];
}

const DAILY_LIMIT = 20;

@Injectable()
export class AiGenerateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AiGenerateService.name);

  constructor(
    @InjectRepository(AiGenerationLog)
    private readonly aiGenerationLogRepository: Repository<AiGenerationLog>,
    @InjectRepository(AiGenerationJob)
    private readonly aiGenerationJobRepository: Repository<AiGenerationJob>,
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
   * On startup, reconcile jobs orphaned by a previous process exit.
   * Because generation runs as detached in-process work (no external queue),
   * any job still 'pending' or 'running' when the process died can never resume.
   * We mark them 'failed' so the UI reflects reality instead of a stuck spinner.
   */
  async onApplicationBootstrap(): Promise<void> {
    const result = await this.aiGenerationJobRepository.update(
      {
        status: In([
          AiGenerationJobStatus.PENDING,
          AiGenerationJobStatus.RUNNING,
        ]),
      },
      {
        status: AiGenerationJobStatus.FAILED,
        errorMessage: 'Interrupted by a server restart before completion.',
      },
    );
    if (result.affected && result.affected > 0) {
      this.logger.warn(
        `Marked ${result.affected} orphaned AI generation job(s) as failed after restart.`,
      );
    }
  }

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
    options?: {
      maxTokens?: number;
      temperature?: number;
      responseFormat?: { type: 'json_object' | 'text' };
    },
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

    const requestBody: Record<string, unknown> = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      temperature,
      top_p: 0.9,
      max_tokens: maxTokens,
    };

    if (options?.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = data.choices?.[0]?.message?.content || '';
    return this.cleanModelOutput(rawContent);
  }

  /**
   * Pre-repairs malformed JSON containing unescaped backslashes (e.g. Windows paths)
   * or unescaped double quotes inside key/value strings.
   */
  private repairMalformedJson(str: string): string {
    // 1. Fix unescaped backslashes (not followed by valid JSON escape chars)
    let fixed = str.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');

    // 2. Fix unescaped double quotes inside property values
    fixed = fixed.replace(
      /"(questionText|optionText|title|question|content)"\s*:\s*"([\s\S]*?)"\s*(,\s*"|,\s*\}|\s*\})/g,
      (_match: string, key: string, val: string, tail: string) => {
        const escapedVal = val.replace(/(?<!\\)"/g, '\\"');
        return `"${key}": "${escapedVal}"${tail}`;
      },
    );

    return fixed;
  }

  /**
   * Parses MCQ question output safely from direct arrays or wrapped JSON objects,
   * with multi-stage sanitization and detailed diagnostic logging on parse errors.
   */
  private parseMcqQuestions(
    raw: string,
    conceptTitle: string,
  ): ParsedMcqQuestion[] | null {
    let cleaned = this.cleanModelOutput(raw);

    // If response contains reasoning before JSON code fence
    if (cleaned.includes('```')) {
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
      }
    }

    const tryExtractQuestions = (
      parsedObj: unknown,
    ): ParsedMcqQuestion[] | null => {
      if (Array.isArray(parsedObj) && parsedObj.length > 0) {
        return parsedObj as ParsedMcqQuestion[];
      }
      if (parsedObj && typeof parsedObj === 'object') {
        const obj = parsedObj as Record<string, unknown>;
        if (Array.isArray(obj.questions) && obj.questions.length > 0) {
          return obj.questions as ParsedMcqQuestion[];
        }
        if (Array.isArray(obj.items) && obj.items.length > 0) {
          return obj.items as ParsedMcqQuestion[];
        }
        if (Array.isArray(obj.mcqs) && obj.mcqs.length > 0) {
          return obj.mcqs as ParsedMcqQuestion[];
        }
      }
      return null;
    };

    // 1. Direct JSON.parse
    try {
      const parsed: unknown = JSON.parse(cleaned);
      const qs = tryExtractQuestions(parsed);
      if (qs) return qs;
    } catch {
      // 2. Attempt with JSON repair
      try {
        const repaired = this.repairMalformedJson(cleaned);
        const parsed: unknown = JSON.parse(repaired);
        const qs = tryExtractQuestions(parsed);
        if (qs) return qs;
      } catch {
        // 3. Fallback: regex extraction of outermost array or object
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            const parsed: unknown = JSON.parse(arrayMatch[0]);
            const qs = tryExtractQuestions(parsed);
            if (qs) return qs;
          } catch {
            try {
              const parsed: unknown = JSON.parse(
                this.repairMalformedJson(arrayMatch[0]),
              );
              const qs = tryExtractQuestions(parsed);
              if (qs) return qs;
            } catch {
              // Ignore fallback failure
            }
          }
        }

        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try {
            const parsed: unknown = JSON.parse(objMatch[0]);
            const qs = tryExtractQuestions(parsed);
            if (qs) return qs;
          } catch {
            try {
              const parsed: unknown = JSON.parse(
                this.repairMalformedJson(objMatch[0]),
              );
              const qs = tryExtractQuestions(parsed);
              if (qs) return qs;
            } catch {
              // Ignore fallback failure
            }
          }
        }
      }
    }

    // Diagnostic logging when all parse stages fail
    this.logger.warn(
      `Failed to parse MCQ JSON for concept "${conceptTitle}". Raw snippet: ${cleaned.slice(0, 250)}...`,
    );
    return null;
  }

  /**
   * Helper to parse JSON array of strings from AI response
   */
  private parseStringArray(raw: string): string[] {
    const cleaned = this.cleanModelOutput(raw);
    try {
      const parsed: unknown = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      // Fallback: extract array using regex
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed: unknown = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            return parsed
              .map((item: unknown) =>
                typeof item === 'string' ? item.trim() : '',
              )
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
   * Entry point for the 3 batch generators. Runs synchronous pre-checks
   * (existence, ownership, capacity, rate-limit, duplicate-job) so the caller
   * gets an immediate error, then creates a job row and kicks off the actual
   * generation as detached in-process work (NOT awaited). Returns the job id.
   */
  async startGenerationJob(
    jobType: AiGenerationJobType,
    targetId: string,
    user: User,
  ): Promise<{ jobId: string }> {
    // 1. Validate target + capacity + quota (throws 404 / 403 / 400 / 429)
    const { targetLabel } = await this.validateJobStart(jobType, targetId, user);

    // 2. Reject if a generation is already pending/running for this target
    const existing = await this.aiGenerationJobRepository.findOne({
      where: {
        targetId,
        status: In([
          AiGenerationJobStatus.PENDING,
          AiGenerationJobStatus.RUNNING,
        ]),
      },
    });
    if (existing) {
      const noun =
        jobType === AiGenerationJobType.ROADMAP_MODULES ? 'roadmap' : 'module';
      throw new BadRequestException(
        `A generation is already in progress for this ${noun}. Please wait for it to finish.`,
      );
    }

    // 3. Create the job row
    const job = await this.aiGenerationJobRepository.save(
      this.aiGenerationJobRepository.create({
        requestedByUserId: user.id,
        jobType,
        targetId,
        status: AiGenerationJobStatus.PENDING,
        progressCurrent: 0,
        progressTotal: 0,
      }),
    );

    // 4. Fire-and-forget: run the generation without awaiting the HTTP response
    void this.executeJob(job.id, jobType, targetId, user, targetLabel).catch(
      (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Unhandled error in generation job ${job.id}: ${msg}`);
      },
    );

    return { jobId: job.id };
  }

  /**
   * Synchronous pre-flight validation shared by all 3 job types.
   * Returns a human-readable label for the target (used in completion toasts).
   */
  private async validateJobStart(
    jobType: AiGenerationJobType,
    targetId: string,
    user: User,
  ): Promise<{ targetLabel: string }> {
    if (jobType === AiGenerationJobType.ROADMAP_MODULES) {
      const roadmap = await this.roadmapRepository.findOne({
        where: { id: targetId },
        relations: ['modules'],
      });
      if (!roadmap) {
        throw new NotFoundException('Roadmap not found');
      }
      this.roadmapsService.checkOwnership(roadmap.createdById, user);
      const existingModules = roadmap.modules || [];
      if (existingModules.length >= 6) {
        throw new BadRequestException(
          'Roadmap module limit reached (6/6). Cannot generate more modules.',
        );
      }
      await this.checkRateLimit(user.id, 1);
      return { targetLabel: roadmap.title };
    }

    // Module-based jobs (concepts / mcqs)
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: targetId },
      relations: ['roadmap', 'moduleConcepts', 'moduleConcepts.concept'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }
    this.roadmapsService.checkOwnership(moduleEntity.roadmap?.createdById, user);

    if (jobType === AiGenerationJobType.MODULE_CONCEPTS) {
      const existingConceptTitles = (moduleEntity.moduleConcepts || [])
        .map((mc) => mc.concept?.title)
        .filter((t): t is string => Boolean(t));
      if (existingConceptTitles.length >= 6) {
        throw new BadRequestException(
          'Concept limit reached (6/6) for this module. Cannot generate more concepts.',
        );
      }
      const remainingSlots = 6 - existingConceptTitles.length;
      // 1 title-list call + up to remainingSlots content calls
      await this.checkRateLimit(user.id, remainingSlots + 1);
    } else {
      // MODULE_MCQS
      await this.checkRateLimit(user.id, 1);
    }

    return { targetLabel: moduleEntity.title };
  }

  /**
   * Detached worker: marks the job running, dispatches to the per-type runner,
   * and records the final result (completed + summary, or failed + errorMessage
   * for a catastrophic failure before any items could be processed).
   */
  private async executeJob(
    jobId: string,
    jobType: AiGenerationJobType,
    targetId: string,
    user: User,
    targetLabel: string,
  ): Promise<void> {
    await this.aiGenerationJobRepository.update(jobId, {
      status: AiGenerationJobStatus.RUNNING,
    });

    try {
      let summary: AiGenerationJobResultSummary;
      switch (jobType) {
        case AiGenerationJobType.ROADMAP_MODULES:
          summary = await this.runRoadmapModulesJob(
            jobId,
            targetId,
            user,
            targetLabel,
          );
          break;
        case AiGenerationJobType.MODULE_CONCEPTS:
          summary = await this.runModuleConceptsJob(
            jobId,
            targetId,
            user,
            targetLabel,
          );
          break;
        case AiGenerationJobType.MODULE_MCQS:
          summary = await this.runModuleMcqsJob(
            jobId,
            targetId,
            user,
            targetLabel,
          );
          break;
        default:
          throw new Error(`Unknown job type: ${String(jobType)}`);
      }

      await this.aiGenerationJobRepository.update(jobId, {
        status: AiGenerationJobStatus.COMPLETED,
        resultSummary: summary,
        progressTotal: Math.max(
          summary.createdCount + summary.failedCount + summary.skippedCount,
          0,
        ),
        progressCurrent: summary.createdCount + summary.failedCount,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Generation job ${jobId} failed: ${msg}`);
      await this.aiGenerationJobRepository.update(jobId, {
        status: AiGenerationJobStatus.FAILED,
        errorMessage: msg,
      });
    }
  }

  /**
   * Persists incremental progress after each individual item completes.
   */
  private async bumpProgress(jobId: string, current: number): Promise<void> {
    await this.aiGenerationJobRepository.update(jobId, {
      progressCurrent: current,
    });
  }

  /**
   * All pending/running jobs for the current user, newest first.
   */
  async getActiveJobs(user: User): Promise<AiGenerationJob[]> {
    return this.aiGenerationJobRepository.find({
      where: {
        requestedByUserId: user.id,
        status: In([
          AiGenerationJobStatus.PENDING,
          AiGenerationJobStatus.RUNNING,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * A single job by id. Only the requester (or an admin) may read it.
   */
  async getJob(jobId: string, user: User): Promise<AiGenerationJob> {
    const job = await this.aiGenerationJobRepository.findOne({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Generation job not found');
    }
    // Reuse the same owner-or-admin rule used across content endpoints
    this.roadmapsService.checkOwnership(job.requestedByUserId, user);
    return job;
  }

  /**
   * Runner: Generate Modules for a Roadmap (up to 6 total modules).
   * Updates job progress after each module is created.
   */
  private async runRoadmapModulesJob(
    jobId: string,
    roadmapId: string,
    user: User,
    targetLabel: string,
  ): Promise<AiGenerationJobResultSummary> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
      relations: ['modules'],
    });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const existingModules = roadmap.modules || [];
    const remainingCount = 6 - existingModules.length;
    const existingTitles = existingModules.map((m) => m.title);

    const userPrompt = buildRoadmapModulesUserPrompt(
      roadmap.title,
      roadmap.description || undefined,
      existingTitles,
      remainingCount,
    );

    const responseText = await this.generateNvidiaCompletion(
      ROADMAP_MODULES_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 400, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.ROADMAP_MODULES);

    const parsedTitles = this.parseStringArray(responseText);
    const moduleTitles = parsedTitles.slice(0, remainingCount);
    if (moduleTitles.length === 0) {
      // Catastrophic: nothing could be processed
      throw new HttpException(
        'AI failed to produce a valid list of module titles. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: moduleTitles.length,
    });

    const startOrderIndex = existingModules.length;
    const failedItems: AiGenerationJobFailedItem[] = [];
    let createdCount = 0;

    for (let i = 0; i < moduleTitles.length; i++) {
      const title = moduleTitles[i];
      try {
        await this.roadmapsService.createModule(roadmapId, user, {
          title,
          orderIndex: startOrderIndex + i + 1,
        });
        createdCount++;
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed creating module "${title}": ${error.message}`,
        );
        failedItems.push({ title, reason: error.message });
      }
      await this.bumpProgress(jobId, i + 1);
    }

    return {
      createdCount,
      failedCount: failedItems.length,
      skippedCount: 0,
      failedItems,
      targetLabel,
      itemNoun: 'module',
    };
  }


  /**
   * Runner: Generate Concepts (with content) for a Module in sequence
   * (up to 6 total concepts). Updates job progress after each concept
   * is processed (created or failed).
   */
  private async runModuleConceptsJob(
    jobId: string,
    moduleId: string,
    user: User,
    targetLabel: string,
  ): Promise<AiGenerationJobResultSummary> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap', 'moduleConcepts', 'moduleConcepts.concept'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }

    const existingConceptTitles = (moduleEntity.moduleConcepts || [])
      .map((mc) => mc.concept?.title)
      .filter((t): t is string => Boolean(t));

    const remainingSlots = 6 - existingConceptTitles.length;

    // Fetch all sibling modules belonging to this roadmap to enforce scope isolation and position pacing
    const allRoadmapModules = await this.moduleRepository.find({
      where: { roadmapId: moduleEntity.roadmapId },
      order: { orderIndex: 'ASC' },
    });

    const totalModuleCount = Math.max(allRoadmapModules.length, 1);
    const currentOrderIndex = moduleEntity.orderIndex || 1;
    const siblingModules = allRoadmapModules
      .filter((m) => m.id !== moduleId)
      .map((m) => ({ title: m.title, orderIndex: m.orderIndex }));

    // Phase 1: Generate concept title list with roadmap arc, top-up target, and sibling module awareness
    const userPrompt = buildModuleConceptsUserPrompt({
      roadmapTitle: moduleEntity.roadmap?.title,
      roadmapDescription: moduleEntity.roadmap?.description || undefined,
      moduleTitle: moduleEntity.title,
      moduleOrderIndex: currentOrderIndex,
      totalModuleCount,
      siblingModules,
      existingConceptTitles,
      targetCount: remainingSlots,
    });

    const titlesResponse = await this.generateNvidiaCompletion(
      MODULE_CONCEPTS_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 400, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.MODULE_CONCEPTS);

    const parsedTitles = this.parseStringArray(titlesResponse);
    const conceptTitles = parsedTitles.slice(0, remainingSlots);
    if (conceptTitles.length === 0) {
      // Catastrophic: nothing could be processed
      throw new HttpException(
        'AI failed to produce a valid list of concept titles. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: conceptTitles.length,
    });

    // Phase 2: Generate full content for each concept sequentially with sibling awareness
    const cumulativeSiblingTitles = [...existingConceptTitles];
    const failedItems: AiGenerationJobFailedItem[] = [];
    let createdCount = 0;
    let skippedCount = 0;
    let processed = 0;

    for (let i = 0; i < conceptTitles.length; i++) {
      const title = conceptTitles[i];

      // Check quota before each individual content call
      try {
        await this.checkRateLimit(user.id, 1);
      } catch {
        skippedCount = conceptTitles.length - processed;
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

        // Validate any links generated in the markdown before persisting
        const sanitizedContent =
          await this.validateAndSanitizeConceptLinks(generatedContent);

        // Create concept using existing service
        const createdConcept = await this.conceptsService.createConcept(user, {
          title,
          content: sanitizedContent,
          difficulty: ConceptDifficulty.MEDIUM,
          isAiGenerated: true,
        });

        // Attach concept to module using existing service (inherits order index & prerequisite logic)
        await this.roadmapsService.attachConceptToModule(moduleId, user, {
          conceptId: createdConcept.id,
        });

        createdCount++;
        cumulativeSiblingTitles.push(title);
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed generating content for concept "${title}": ${error.message}`,
        );
        failedItems.push({ title, reason: error.message });
      }

      processed++;
      await this.bumpProgress(jobId, processed);
    }

    return {
      createdCount,
      failedCount: failedItems.length,
      skippedCount,
      failedItems,
      targetLabel,
      itemNoun: 'concept',
    };
  }

  /**
   * Runner: Generate MCQs for a Module (for concepts lacking MCQs).
   * Updates job progress after each concept is processed.
   */
  private async runModuleMcqsJob(
    jobId: string,
    moduleId: string,
    user: User,
    targetLabel: string,
  ): Promise<AiGenerationJobResultSummary> {
    const moduleEntity = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['roadmap', 'moduleConcepts', 'moduleConcepts.concept'],
    });
    if (!moduleEntity) {
      throw new NotFoundException('Module not found');
    }

    const emptySummary: AiGenerationJobResultSummary = {
      createdCount: 0,
      failedCount: 0,
      skippedCount: 0,
      failedItems: [],
      targetLabel,
      itemNoun: 'MCQ set',
    };

    const moduleConcepts = moduleEntity.moduleConcepts || [];
    if (moduleConcepts.length === 0) {
      return emptySummary;
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
      return emptySummary;
    }

    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: conceptsNeedingMcqs.length,
    });

    const failedItems: AiGenerationJobFailedItem[] = [];
    let generatedCount = 0;
    let skippedCount = 0;
    let processed = 0;

    for (const concept of conceptsNeedingMcqs) {
      // Check quota before each concept MCQ generation
      try {
        await this.checkRateLimit(user.id, 1);
      } catch {
        skippedCount = conceptsNeedingMcqs.length - processed;
        break;
      }

      try {
        const userPrompt = buildConceptMcqUserPrompt(
          concept.title,
          concept.content,
        );

        let parsedQuestions: ParsedMcqQuestion[] | null = null;
        let attempt = 0;
        const maxAttempts = 2; // Initial attempt + 1 automatic retry

        while (attempt < maxAttempts && !parsedQuestions) {
          attempt++;
          try {
            const responseText = await this.generateNvidiaCompletion(
              CONCEPT_MCQ_SYSTEM_PROMPT,
              userPrompt,
              {
                maxTokens: 2000,
                temperature: attempt === 1 ? 0.3 : 0.4,
                responseFormat: { type: 'json_object' },
              },
            );

            if (attempt === 1) {
              await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS);
            }

            parsedQuestions = this.parseMcqQuestions(
              responseText,
              concept.title,
            );
            if (!parsedQuestions && attempt < maxAttempts) {
              this.logger.warn(
                `Parse failed on attempt 1 for concept "${concept.title}". Automatically retrying with fresh completion...`,
              );
            }
          } catch (apiErr: unknown) {
            if (attempt >= maxAttempts) throw apiErr;
            const errMsg =
              apiErr instanceof Error ? apiErr.message : String(apiErr);
            this.logger.warn(
              `API error on attempt 1 for concept "${concept.title}": ${errMsg}. Retrying...`,
            );
          }
        }

        if (!parsedQuestions || parsedQuestions.length === 0) {
          this.logger.error(
            `Invalid MCQ JSON response after ${maxAttempts} attempts for concept "${concept.title}"`,
          );
          failedItems.push({
            title: concept.title,
            reason: 'Model returned no valid questions after 2 attempts.',
          });
          processed++;
          await this.bumpProgress(jobId, processed);
          continue;
        }

        // Validate and create questions sequentially using QuizService
        let createdForConcept = 0;
        for (let qIdx = 0; qIdx < parsedQuestions.length; qIdx++) {
          const q = parsedQuestions[qIdx];
          if (
            !q.questionText ||
            !Array.isArray(q.options) ||
            q.options.length < 2
          ) {
            continue;
          }

          const correctOptions = q.options.filter(
            (o: ParsedMcqOption) => o.isCorrect === true,
          );
          if (correctOptions.length !== 1) {
            continue;
          }

          await this.quizService.createQuestion(concept.id, user, {
            questionText: q.questionText,
            orderIndex: qIdx + 1,
            options: q.options.map((opt: ParsedMcqOption, oIdx: number) => ({
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
          failedItems.push({
            title: concept.title,
            reason: 'No valid questions passed validation.',
          });
        }
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed MCQ generation for concept "${concept.title}": ${error.message}`,
        );
        failedItems.push({ title: concept.title, reason: error.message });
      }

      processed++;
      await this.bumpProgress(jobId, processed);
    }

    return {
      createdCount: generatedCount,
      failedCount: failedItems.length,
      skippedCount,
      failedItems,
      targetLabel,
      itemNoun: 'MCQ set',
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

    const rawContent = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 3000, temperature: 0.6 },
    );

    await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT);

    const content = await this.validateAndSanitizeConceptLinks(rawContent);

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

    let parsedQuestions: ParsedMcqQuestion[] | null = null;
    let attempt = 0;
    const maxAttempts = 2;
    let lastResponseText = '';

    while (attempt < maxAttempts && !parsedQuestions) {
      attempt++;
      try {
        lastResponseText = await this.generateNvidiaCompletion(
          systemPrompt,
          userPrompt,
          {
            maxTokens: 2000,
            temperature: attempt === 1 ? 0.3 : 0.4,
            responseFormat: { type: 'json_object' },
          },
        );

        if (attempt === 1) {
          await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS);
        }

        parsedQuestions = this.parseMcqQuestions(lastResponseText, dto.title);
        if (!parsedQuestions && attempt < maxAttempts) {
          this.logger.warn(
            `Single concept MCQ parse failed on attempt 1 for "${dto.title}". Retrying...`,
          );
        }
      } catch (err: unknown) {
        if (attempt >= maxAttempts) throw err;
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Single concept MCQ API error on attempt 1 for "${dto.title}": ${errMsg}. Retrying...`,
        );
      }
    }

    if (parsedQuestions && parsedQuestions.length > 0) {
      return { rawText: JSON.stringify(parsedQuestions, null, 2) };
    }

    return { rawText: this.cleanModelOutput(lastResponseText) };
  }

  /**
   * Generates an immediate AI answer for a student Q&A question on a concept.
   * Grounded in the concept content. Length adapts naturally to the question.
   */
  async generateQaAnswer(
    conceptTitle: string,
    conceptContent: string,
    questionBody: string,
    user: User,
  ): Promise<string> {
    await this.checkRateLimit(user.id, 1);

    const systemPrompt = QA_ANSWER_SYSTEM_PROMPT;
    const userPrompt = buildQaAnswerUserPrompt(
      conceptTitle,
      conceptContent,
      questionBody,
    );

    const answer = await this.generateNvidiaCompletion(
      systemPrompt,
      userPrompt,
      { maxTokens: 1500, temperature: 0.5 },
    );

    await this.logGeneration(user.id, AiGenerationType.QA_ANSWER);

    return answer;
  }

  /**
   * Performs a lightweight HTTP check (HEAD with GET fallback, 5s timeout)
   * to verify if a URL resolves with a successful status code.
   */
  private async checkUrlResolves(urlStr: string): Promise<boolean> {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
    } catch {
      return false;
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      let res: globalThis.Response;
      try {
        res = await fetch(urlStr, {
          method: 'HEAD',
          signal: controller.signal,
          headers,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          clearTimeout(timeoutId);
          return false;
        }
        res = await fetch(urlStr, {
          method: 'GET',
          signal: controller.signal,
          headers,
        });
      }

      if (res.status === 405 || res.status === 400 || res.status === 501) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 5000);
        try {
          res = await fetch(urlStr, {
            method: 'GET',
            signal: getController.signal,
            headers,
          });
          clearTimeout(getTimeoutId);
        } catch {
          clearTimeout(getTimeoutId);
          return false;
        }
      }

      clearTimeout(timeoutId);

      // Status 200-399 are valid
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return true;
      }

      // Status 401, 403, 429 indicate active server / anti-bot challenge (e.g. Cloudflare on LeetCode)
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        return true;
      }

      return false;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Validates all Markdown links in generated concept content.
   * Strips broken/unresolvable links line-by-line while preserving valid content.
   * Cleans up empty "## Practice & Further Reading" section if all links fail.
   */
  async validateAndSanitizeConceptLinks(content: string): Promise<string> {
    if (!content) return content;

    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const urlsToValidate = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      urlsToValidate.add(match[2]);
    }

    if (urlsToValidate.size === 0) {
      return content;
    }

    this.logger.log(
      `Validating ${urlsToValidate.size} external links in concept content...`,
    );

    // Validate URLs concurrently
    const urlValidationResults = new Map<string, boolean>();
    await Promise.all(
      Array.from(urlsToValidate).map(async (url) => {
        const isValid = await this.checkUrlResolves(url);
        urlValidationResults.set(url, isValid);
        if (!isValid) {
          this.logger.warn(
            `Stripped invalid link from concept content: "${url}"`,
          );
        }
      }),
    );

    // Filter lines: remove any line that contains an invalid URL
    const lines = content.split('\n');
    const sanitizedLines: string[] = [];

    for (const line of lines) {
      let lineValid = true;
      const lineLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let lineMatch: RegExpExecArray | null;

      while ((lineMatch = lineLinkRegex.exec(line)) !== null) {
        const url = lineMatch[2];
        if (urlValidationResults.get(url) === false) {
          lineValid = false;
          break;
        }
      }

      if (lineValid) {
        sanitizedLines.push(line);
      }
    }

    let sanitizedContent = sanitizedLines.join('\n');

    // If "## Practice & Further Reading" has no links remaining under it, clean up empty heading
    sanitizedContent = sanitizedContent.replace(
      /##\s+(?:Practice\s*(?:&|and)\s*Further\s*Reading|Further\s*Reading|Practice\s*Resources)\s*(?:\n\s*)*(?=\n##|\s*$)/i,
      '',
    );

    return sanitizedContent.trim();
  }
}
