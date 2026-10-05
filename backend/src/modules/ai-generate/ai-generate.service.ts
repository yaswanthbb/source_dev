import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In, IsNull } from 'typeorm';

import { AiGenerationLog } from './entities/ai-generation-log.entity';
import {
  AiGenerationJob,
  AiGenerationJobFailedItem,
  AiGenerationJobResultSummary,
} from './entities/ai-generation-job.entity';
import { AiProviderKey } from './entities/ai-provider-key.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import {
  AiGenerationJobType,
  AiGenerationJobStatus,
} from '../../common/enums/ai-generation-job.enum';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptDifficulty } from '../../common/enums/concept-difficulty.enum';
import {
  addCivilDays,
  civilDateIn,
  resolveZone,
  todayIn,
} from '../../common/utils/timezone.util';
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
  CONCEPT_OUTLINE_SYSTEM_PROMPT,
  buildOutlineUserPrompt,
  CONCEPT_DRAFT_SYSTEM_PROMPT,
  buildDraftUserPrompt,
  CONCEPT_FACTCHECK_SYSTEM_PROMPT,
  buildFactcheckUserPrompt,
  CONCEPT_CRITIQUE_SYSTEM_PROMPT,
  buildCritiqueUserPrompt,
  CONCEPT_REVISE_SYSTEM_PROMPT,
  buildReviseUserPrompt,
  CONCEPT_RESEARCH_SYSTEM_PROMPT,
  buildResearchBriefUserPrompt,
} from './constants/prompts';
import {
  ConceptOutline,
  objectivesWithoutBloomVerb,
  parseCritique,
  parseFactcheck,
  parseOutline,
  parseResearchBrief,
} from './compiler-stages';
import {
  RESEARCH_GROUNDING_MODE,
  CourseResearchService,
} from './course-research.service';
import { verbatimOverlap } from './research-text.util';

import {
  GenerateConceptContentDto,
  GenerateConceptMcqsDto,
} from './dto/ai-generate.dto';
import {
  AiProviderClients,
  CompletionOptions,
  defaultModelFor,
  isModelRetiredError,
  providerFailure,
} from './ai-provider-clients';
import {
  CourseTaskKey,
  resolveTierModel,
  taskRouteFor,
} from './task-routing';
import { AiKeysService } from './ai-keys.service';
import { AiPromptRegistry } from './ai-prompt-registry.service';
import { CourseContextBuilder } from './course-context-builder.service';
import { CourseContextService } from './course-context.service';
import { ConceptCompilation } from './entities/concept-compilation.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseTerm } from './entities/course-term.entity';
import { CourseEdgeType } from '../../common/enums/course-edge-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

interface ParsedMcqOption {
  optionText?: string;
  isCorrect?: boolean;
}

interface ParsedMcqQuestion {
  questionText?: string;
  options?: ParsedMcqOption[];
}

const FREE_DAILY_LIMIT = 5;
const OWN_KEY_DEFAULT_LIMIT = 20;

export type AiQuotaTier = 'free' | 'own-key' | 'admin';

/**
 * Credentials snapshot resolved once per operation (§5): which provider,
 * whose key (memory-only plaintext), which model, and which quota bucket.
 * keyId null = platform free tier. Threaded through detached job runners so
 * a job always uses the key it started with.
 */
export interface ResolvedAiCredentials {
  provider: AiProvider;
  apiKey: string;
  model: string;
  keyId: string | null;
  tier: AiQuotaTier;
  limit: number;
  unlimited: boolean;
}

export interface AiQuotaStatus {
  remaining: number;
  limit: number;
  unlimited: boolean;
}

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
    private readonly keysService: AiKeysService,
    private readonly clients: AiProviderClients,
    private readonly notificationsService: NotificationsService,
    private readonly promptRegistry: AiPromptRegistry,
    private readonly courseContext: CourseContextBuilder,
    private readonly courseContexts: CourseContextService,
    private readonly courseResearch: CourseResearchService,
    @InjectRepository(ConceptCompilation)
    private readonly compilationRepository: Repository<ConceptCompilation>,
    @InjectRepository(CourseConceptCard)
    private readonly conceptCardRepository: Repository<CourseConceptCard>,
    @InjectRepository(CourseTerm)
    private readonly courseTermRepository: Repository<CourseTerm>,
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
   * Resolve which credentials an operation runs with (§5):
   * - Admin: unlimited; default key when set, else the platform NVIDIA key.
   * - Developer with a default key: that key's provider (a conflicting
   *   `provider` request is rejected); caller model validated live.
   * - Developer without one: platform free tier (NVIDIA only, 5/day).
   *   Gemini is BYOK-only.
   */
  async resolveCredentials(
    user: User,
    opts?: { provider?: AiProvider; model?: string; taskKey?: CourseTaskKey },
  ): Promise<ResolvedAiCredentials> {
    const isAdmin = user.role === UserRole.ADMIN;
    const defaultKey = await this.keysService.getDefaultKey(user.id);

    let provider = opts?.provider;
    let key: AiProviderKey | null = null;
    if (defaultKey) {
      if (provider && provider !== defaultKey.provider) {
        throw new BadRequestException(
          `Requested provider does not match your default ${defaultKey.provider} key. Change your default key to switch providers.`,
        );
      }
      provider = defaultKey.provider;
      key = defaultKey;
    } else {
      provider ??= AiProvider.NVIDIA;
      if (provider === AiProvider.GEMINI) {
        throw new BadRequestException(
          'Gemini is available with your own key only. Add a Gemini API key to use it.',
        );
      }
    }

    const requestedModel = opts?.model?.trim() || undefined;
    // Priority: per-call model → key's saved default → task default (flag
    // on only) → provider default. Caller override always wins.
    const taskModel =
      opts?.taskKey && this.routingEnabled()
        ? resolveTierModel(
            provider,
            taskRouteFor(opts.taskKey).tier,
            (key) => this.configService.get<string>(key),
            (p) => this.clients.configuredDefaultModel(p),
          )
        : undefined;
    const model =
      requestedModel ||
      key?.defaultModel ||
      taskModel ||
      this.clients.configuredDefaultModel(provider);

    let apiKey: string;
    if (key) {
      apiKey = this.keysService.decryptForUse(key);
      if (requestedModel) {
        await this.assertKnownModel(provider, apiKey, requestedModel);
      }
    } else {
      const platformKey = this.configService
        .get<string>('NVIDIA_API_KEY')
        ?.trim();
      if (!platformKey) {
        throw new ServiceUnavailableException(
          'The shared AI service is not configured right now. Please wait until tomorrow, or add your own key to keep generating.',
        );
      }
      apiKey = platformKey;
    }

    if (isAdmin) {
      return {
        provider,
        apiKey,
        model,
        keyId: key?.id ?? null,
        tier: 'admin',
        limit: -1,
        unlimited: true,
      };
    }
    if (key) {
      return {
        provider,
        apiKey,
        model,
        keyId: key.id,
        tier: 'own-key',
        limit: key.dailyLimit || OWN_KEY_DEFAULT_LIMIT,
        unlimited: false,
      };
    }
    return {
      provider,
      apiKey,
      model,
      keyId: null,
      tier: 'free',
      limit: FREE_DAILY_LIMIT,
      unlimited: false,
    };
  }

  /** Rebuild credentials for a detached job run from its stored snapshot. */
  private async credentialsForJob(
    job: AiGenerationJob,
  ): Promise<ResolvedAiCredentials> {
    const provider = job.provider ?? AiProvider.NVIDIA;
    const model = job.model || this.clients.configuredDefaultModel(provider);

    if (!job.providerKeyId) {
      const platformKey = this.configService
        .get<string>('NVIDIA_API_KEY')
        ?.trim();
      if (!platformKey) {
        throw new ServiceUnavailableException(
          'The shared AI service is not configured right now. Please wait until tomorrow, or add your own key to keep generating.',
        );
      }
      return {
        provider,
        apiKey: platformKey,
        model,
        keyId: null,
        tier: 'free',
        limit: FREE_DAILY_LIMIT,
        unlimited: false,
      };
    }

    const key = await this.keysService.getKeyById(job.providerKeyId);
    if (!key) {
      throw new BadRequestException(
        'The API key this job started with no longer exists.',
      );
    }
    return {
      provider: key.provider,
      apiKey: this.keysService.decryptForUse(key),
      model: model || key.defaultModel || this.clients.configuredDefaultModel(key.provider),
      keyId: key.id,
      tier: 'own-key',
      limit: key.dailyLimit || OWN_KEY_DEFAULT_LIMIT,
      unlimited: false,
    };
  }

  private async assertKnownModel(
    provider: AiProvider,
    apiKey: string,
    model: string,
  ): Promise<void> {
    const { models } = await this.clients.listModels(provider, apiKey);
    if (!models.includes(model)) {
      throw new BadRequestException(
        `Unknown model "${model}" for this provider. Pick one from the live model list.`,
      );
    }
  }

  /**
   * Non-throwing quota read for badges and pre-flight UI. Same bucket math
   * as checkRateLimit, but exhaustion returns zeros instead of a 429.
   */
  async readQuota(
    userId: string,
    timezone?: string | null,
    creds?: ResolvedAiCredentials,
  ): Promise<AiQuotaStatus> {
    if (creds?.unlimited) {
      return { remaining: -1, limit: -1, unlimited: true };
    }
    const limit = creds?.limit ?? FREE_DAILY_LIMIT;
    const keyId = creds?.keyId ?? null;
    const zone = resolveZone(timezone);
    const todayStr = todayIn(zone);
    const windowStart = new Date(`${addCivilDays(todayStr, -1)}T00:00:00Z`);
    const rows = await this.aiGenerationLogRepository.find({
      where: {
        userId,
        generatedAt: MoreThanOrEqual(windowStart),
        providerKeyId: keyId ?? IsNull(),
        // Pipeline-internal stages (fact-check/critique/revise) are
        // telemetry-only: one quota slot per concept holds.
        internal: false,
      },
      select: { id: true, generatedAt: true },
    });
    const count = rows.filter(
      (row) => civilDateIn(zone, new Date(row.generatedAt)) === todayStr,
    ).length;
    return { remaining: Math.max(0, limit - count), limit, unlimited: false };
  }

  /**
   * Per-bucket daily quota in the caller's own timezone (see original note
   * about UTC boundaries below). Free tier and each own-key get their own
   * bucket; admins skip checks entirely. Every limit-hit shows the same
   * wait-or-switch prompt (§5).
   *
   * On a UTC day boundary an instructor in Asia/Kolkata saw their quota reset
   * at 05:30 local rather than at midnight, so the last few hours of their
   * working evening were still spending the previous day's allowance.
   *
   * Optional requiredSlots parameter ensures enough quota remains for batch operations.
   */
  async checkRateLimit(
    userId: string,
    requiredSlots = 1,
    timezone?: string | null,
    creds?: ResolvedAiCredentials,
  ): Promise<AiQuotaStatus> {
    // Unlimited buckets (admin) never gate. Bucket math lives in readQuota
    // so the badge and the gate can never disagree.
    if (creds?.unlimited) {
      return { remaining: -1, limit: -1, unlimited: true };
    }
    const { remaining, limit } = await this.readQuota(
      userId,
      timezone,
      creds,
    );

    if (remaining < requiredSlots) {
      const help =
        creds?.tier === 'own-key'
          ? "You have used today's allowance for this key. Please wait until tomorrow, raise this key's cap (max 50), or switch keys."
          : "You have used today's free allowance (5 generations per day). Please wait until tomorrow, or add your own key to keep generating.";
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            requiredSlots > 1
              ? `At least ${requiredSlots} AI generations remaining are required for this batch operation. ${help}`
              : `Daily AI generation limit reached. ${help}`,
          error: 'Too Many Requests',
          remaining,
          limit,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { remaining, limit, unlimited: false };
  }

  /**
   * Record a generation event in the log (per-bucket attribution via keyId,
   * per-call attribution via model/provider; prompt version lands when paths
   * resolve prompts through the registry).
   */
  async logGeneration(
    userId: string,
    type: AiGenerationType,
    keyId?: string | null,
    meta?: {
      promptVersion?: string;
      model?: string;
      provider?: AiProvider;
      tokensIn?: number | null;
      tokensOut?: number | null;
      latencyMs?: number | null;
      /** Pipeline-internal stages set this: telemetry without quota cost. */
      internal?: boolean;
    },
  ): Promise<AiGenerationLog> {
    const log = this.aiGenerationLogRepository.create({
      userId,
      generationType: type,
      generatedAt: new Date(),
      providerKeyId: keyId ?? null,
      promptVersion: meta?.promptVersion ?? null,
      model: meta?.model ?? null,
      provider: meta?.provider ?? null,
      tokensIn: meta?.tokensIn ?? null,
      tokensOut: meta?.tokensOut ?? null,
      latencyMs: meta?.latencyMs ?? null,
      internal: meta?.internal ?? false,
    });
    return this.aiGenerationLogRepository.save(log);
  }

  /**
   * System prompt resolution behind the COURSE_ENGINE flag (§8 Phase 1).
   * Flag off (default): the legacy static constant, version 'legacy-static'.
   * Flag on: the production registry row when one exists, else the fallback.
   * Every logged call carries whichever version actually ran.
   */
  private async systemFor(
    task: AiGenerationType,
    fallback: string,
  ): Promise<{ text: string; version: string }> {
    if (this.configService.get<string>('COURSE_ENGINE_ENABLED') === 'true') {
      const resolved = await this.promptRegistry.resolveSystem(task, fallback);
      return { text: resolved.systemTemplate, version: resolved.version };
    }
    return { text: fallback, version: 'legacy-static' };
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
   * Per-task routing gate (§8). Flag off = today's resolution, byte-identical:
   * no task defaults, no table params, no fallback chain.
   */
  private routingEnabled(): boolean {
    return this.configService.get<string>('COURSE_ENGINE_ENABLED') === 'true';
  }

  /**
   * Temperature/maxTokens for a task key. Flag on: the routing table.
   * Flag off: the passed legacy literals (today's behavior, unchanged).
   */
  private routeParams(
    taskKey: CourseTaskKey,
    legacy: { maxTokens: number; temperature: number; retryTemperature?: number },
  ): { maxTokens: number; temperature: number; retryTemperature?: number } {
    if (!this.routingEnabled()) return legacy;
    return { ...taskRouteFor(taskKey) };
  }

  /**
   * Fallback chain for a call: the task tier model and the provider default,
   * minus whatever is already primary. Flag off: no chain (single attempt).
   * Provider-pinned — a call never jumps providers mid-flight because the
   * apiKey belongs to one provider.
   */
  private fallbackModelsFor(
    taskKey: CourseTaskKey | undefined,
    creds: ResolvedAiCredentials,
  ): string[] {
    if (!taskKey || !this.routingEnabled()) return [];
    const candidates = [
      resolveTierModel(
        creds.provider,
        taskRouteFor(taskKey).tier,
        (key) => this.configService.get<string>(key),
        (p) => this.clients.configuredDefaultModel(p),
      ),
      this.clients.configuredDefaultModel(creds.provider),
    ];
    return [...new Set(candidates)].filter((m) => m !== creds.model);
  }

  /**
   * Single dispatch for every completion in the module (§5): runs against
   * the resolved provider/key/model and cleans output exactly like the old
   * NVIDIA-only path did.
   */
  async complete(
    creds: ResolvedAiCredentials,
    systemPrompt: string,
    userPrompt: string,
    options?: CompletionOptions,
    taskKey?: CourseTaskKey,
    signal?: AbortSignal,
    /**
     * Quota decision (§8 compiler, logged in §11): pipeline-internal stages
     * pass internal=true — telemetry is recorded but no quota slot is
     * consumed (one slot per concept, following the MCQ-retry precedent of
     * logging only the primary attempt as billable).
     */
    internal = false,
  ): Promise<{
    text: string;
    tokensIn: number | null;
    tokensOut: number | null;
    latencyMs: number;
    /** The model that actually served (primary or fallback). */
    model: string;
    /** Echo of the internal flag, for the log site to record. */
    internal: boolean;
  }> {
    const chain = [creds.model, ...this.fallbackModelsFor(taskKey, creds)];
    const startedAt = Date.now();
    let lastError: unknown = null;
    for (const model of chain) {
      try {
        const raw = await this.clients.complete(
          creds.provider,
          creds.apiKey,
          model,
          systemPrompt,
          userPrompt,
          options,
          signal,
        );
        if (model !== creds.model) {
          this.logger.warn(
            `Model fallback served this call: "${creds.model}" → "${model}".`,
          );
        }
        return {
          text: this.cleanModelOutput(raw.text),
          tokensIn: raw.tokensIn,
          tokensOut: raw.tokensOut,
          latencyMs: Date.now() - startedAt,
          model,
          internal,
        };
      } catch (err: unknown) {
        // Advance the chain only on retired-model errors; anything else
        // (auth, quota, transport) throws immediately, as before.
        if (isModelRetiredError(err)) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Pre-repairs malformed JSON containing unescaped backslashes (e.g. Windows paths)
   * or unescaped double quotes inside key/value strings.
   */

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
    opts?: { provider?: AiProvider; model?: string },
  ): Promise<{ jobId: string }> {
    // 0. Resolve credentials (tier, key, provider, model) — throws 400/503.
    // The job's primary task key seeds the task-default model slot.
    const jobTaskKey: CourseTaskKey =
      jobType === AiGenerationJobType.MODULE_CONCEPTS
        ? 'module_concept_titles'
        : jobType === AiGenerationJobType.MODULE_MCQS
          ? 'module_mcqs'
          : 'roadmap_titles';
    const creds = await this.resolveCredentials(user, {
      ...opts,
      taskKey: jobTaskKey,
    });

    // 1. Validate target + capacity + quota (throws 404 / 403 / 400 / 429)
    const { targetLabel } = await this.validateJobStart(
      jobType,
      targetId,
      user,
      creds,
    );

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

    // 3. Create the job row (key snapshot drives the deletion lock +
    // detached credential rebuild)
    const job = await this.aiGenerationJobRepository.save(
      this.aiGenerationJobRepository.create({
        requestedByUserId: user.id,
        jobType,
        targetId,
        status: AiGenerationJobStatus.PENDING,
        progressCurrent: 0,
        progressTotal: 0,
        provider: creds.provider,
        model: creds.model,
        providerKeyId: creds.keyId,
      }),
    );

    // 4. Fire-and-forget: run the generation without awaiting the HTTP response
    void this.executeJob(job.id, jobType, targetId, user, targetLabel, creds).catch(
      (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Unhandled error in generation job ${job.id}: ${msg}`,
        );
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
    creds: ResolvedAiCredentials,
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
      await this.checkRateLimit(user.id, 1, user.timezone, creds);
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
    this.roadmapsService.checkOwnership(
      moduleEntity.roadmap?.createdById,
      user,
    );

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
      await this.checkRateLimit(user.id, remainingSlots + 1, user.timezone, creds);
    } else {
      // MODULE_MCQS
      await this.checkRateLimit(user.id, 1, user.timezone, creds);
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
    creds?: ResolvedAiCredentials,
  ): Promise<void> {
    await this.aiGenerationJobRepository.update(jobId, {
      status: AiGenerationJobStatus.RUNNING,
    });

    try {
      // Detached runs rebuild credentials from the job's snapshot so the job
      // always uses the key it started with, even if the default changed.
      if (!creds) {
        const job = await this.aiGenerationJobRepository.findOne({
          where: { id: jobId },
        });
        if (!job) throw new Error(`Job ${jobId} not found.`);
        creds = await this.credentialsForJob(job);
      }
      let summary: AiGenerationJobResultSummary;
      switch (jobType) {
        case AiGenerationJobType.ROADMAP_MODULES:
          summary = await this.runRoadmapModulesJob(
            jobId,
            targetId,
            user,
            targetLabel,
            creds,
          );
          break;
        case AiGenerationJobType.MODULE_CONCEPTS:
          summary = await this.runModuleConceptsJob(
            jobId,
            targetId,
            user,
            targetLabel,
            creds,
          );
          break;
        case AiGenerationJobType.MODULE_MCQS:
          summary = await this.runModuleMcqsJob(
            jobId,
            targetId,
            user,
            targetLabel,
            creds,
          );
          break;
        default:
          throw new Error(`Unknown job type: ${String(jobType)}`);
      }

      await this.aiGenerationJobRepository.update(jobId, {
        status: AiGenerationJobStatus.COMPLETED,
        resultSummary: summary,
        failedCount: summary.failedCount,
        // Compiler jobs bump per stage (6 per concept); scale the final
        // totals the same way so the bar lands exactly at 100%.
        progressTotal: Math.max(
          (summary.createdCount + summary.failedCount + summary.skippedCount) *
            (this.compilerStageCount(jobType) || 1),
          0,
        ),
        progressCurrent:
          (summary.createdCount + summary.failedCount) *
          (this.compilerStageCount(jobType) || 1),
      });

      // Auto-retry (exactly once): if the completed job left some failed items,
      // spawn a BRAND-NEW job that re-attempts ONLY those items. The retry is
      // itself a job row (retryOfJobId set) and can never spawn a further retry.
      // Notification goes out only for terminal outcomes: clean completions
      // here, everything else on the retry's final result below.
      if (summary.failedItems.length === 0) {
        await this.notificationsService.safeNotify(
          user.id,
          NotificationType.AI_JOB_COMPLETED,
          {
            jobId,
            jobType,
            targetLabel,
            status: AiGenerationJobStatus.COMPLETED,
            createdCount: summary.createdCount,
            failedCount: summary.failedCount,
          },
        );
      }
      if (summary.failedItems.length > 0) {
        try {
          const retryJob = await this.aiGenerationJobRepository.save(
            this.aiGenerationJobRepository.create({
              requestedByUserId: user.id,
              jobType,
              targetId,
              status: AiGenerationJobStatus.PENDING,
              progressCurrent: 0,
              progressTotal: summary.failedItems.length,
              retryOfJobId: jobId,
              // Retry inherits the original's credentials snapshot.
              provider: creds.provider,
              model: creds.model,
              providerKeyId: creds.keyId,
            }),
          );

          // Hide the original from the results banner — the retry produces the
          // definitive outcome, so only its single combined card should surface.
          await this.aiGenerationJobRepository.update(jobId, {
            acknowledgedAt: new Date(),
          });

          void this.executeRetryJob(
            retryJob.id,
            jobType,
            targetId,
            user,
            targetLabel,
            summary,
            creds,
          ).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(
              `Unhandled error in retry job ${retryJob.id}: ${msg}`,
            );
          });
        } catch (retryErr: unknown) {
          // A failure to SET UP the retry must not corrupt the original's
          // COMPLETED result. Leave the original unread so its partial result
          // still surfaces in the banner as a fallback.
          const msg =
            retryErr instanceof Error ? retryErr.message : String(retryErr);
          this.logger.error(`Failed to spawn retry for job ${jobId}: ${msg}`);
          await this.notificationsService.safeNotify(
            user.id,
            NotificationType.AI_JOB_COMPLETED,
            {
              jobId,
              jobType,
              targetLabel,
              status: AiGenerationJobStatus.COMPLETED,
              createdCount: summary.createdCount,
              failedCount: summary.failedCount,
            },
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Generation job ${jobId} failed: ${msg}`);
      await this.aiGenerationJobRepository.update(jobId, {
        status: AiGenerationJobStatus.FAILED,
        errorMessage: msg,
      });
      await this.notificationsService.safeNotify(
        user.id,
        NotificationType.AI_JOB_FAILED,
        {
          jobId,
          jobType,
          targetLabel,
          status: AiGenerationJobStatus.FAILED,
          errorMessage: msg,
        },
      );
    }
  }

  /**
   * Detached worker for a RETRY job. Re-attempts ONLY the items that failed on
   * the original run, then records a COMBINED final summary (original successes
   * + retry outcome) so the single surviving banner card reflects the whole
   * generation. Structurally cannot spawn another retry.
   */
  private async executeRetryJob(
    retryJobId: string,
    jobType: AiGenerationJobType,
    targetId: string,
    user: User,
    targetLabel: string,
    originalSummary: AiGenerationJobResultSummary,
    creds?: ResolvedAiCredentials,
  ): Promise<void> {
    await this.aiGenerationJobRepository.update(retryJobId, {
      status: AiGenerationJobStatus.RUNNING,
    });

    try {
      if (!creds) {
        const retryJob = await this.aiGenerationJobRepository.findOne({
          where: { id: retryJobId },
        });
        if (!retryJob) throw new Error(`Job ${retryJobId} not found.`);
        creds = await this.credentialsForJob(retryJob);
      }
      const failedTitles = originalSummary.failedItems.map((f) => f.title);

      let retrySummary: AiGenerationJobResultSummary;
      switch (jobType) {
        case AiGenerationJobType.ROADMAP_MODULES:
          retrySummary = await this.retryRoadmapModulesJob(
            retryJobId,
            targetId,
            user,
            targetLabel,
            failedTitles,
            creds,
          );
          break;
        case AiGenerationJobType.MODULE_CONCEPTS:
          retrySummary = await this.retryModuleConceptsJob(
            retryJobId,
            targetId,
            user,
            targetLabel,
            failedTitles,
            creds,
          );
          break;
        case AiGenerationJobType.MODULE_MCQS:
          retrySummary = await this.retryModuleMcqsJob(
            retryJobId,
            targetId,
            user,
            targetLabel,
            failedTitles,
            creds,
          );
          break;
        default:
          throw new Error(`Unknown job type: ${String(jobType)}`);
      }

      // Merge the original run's successes with the retry outcome so the single
      // banner card tells the complete story of this generation.
      const finalSummary: AiGenerationJobResultSummary = {
        createdCount: originalSummary.createdCount + retrySummary.createdCount,
        failedCount: retrySummary.failedItems.length,
        skippedCount: originalSummary.skippedCount + retrySummary.skippedCount,
        failedItems: retrySummary.failedItems,
        targetLabel,
        itemNoun: originalSummary.itemNoun,
      };

      await this.aiGenerationJobRepository.update(retryJobId, {
        status: AiGenerationJobStatus.COMPLETED,
        resultSummary: finalSummary,
        failedCount: finalSummary.failedCount,
        progressTotal: Math.max(
          (retrySummary.createdCount +
            retrySummary.failedCount +
            retrySummary.skippedCount) *
            (this.compilerStageCount(jobType) || 1),
          0,
        ),
        progressCurrent:
          (retrySummary.createdCount + retrySummary.failedCount) *
          (this.compilerStageCount(jobType) || 1),
      });
      await this.notificationsService.safeNotify(
        user.id,
        NotificationType.AI_JOB_COMPLETED,
        {
          jobId: retryJobId,
          jobType,
          targetLabel,
          status: AiGenerationJobStatus.COMPLETED,
          createdCount: finalSummary.createdCount,
          failedCount: finalSummary.failedCount,
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Retry job ${retryJobId} failed: ${msg}`);
      await this.aiGenerationJobRepository.update(retryJobId, {
        status: AiGenerationJobStatus.FAILED,
        errorMessage: msg,
      });
      await this.notificationsService.safeNotify(
        user.id,
        NotificationType.AI_JOB_FAILED,
        {
          jobId: retryJobId,
          jobType,
          targetLabel,
          status: AiGenerationJobStatus.FAILED,
          errorMessage: msg,
        },
      );
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
   * Unread terminal (completed/failed) jobs for the current user — the source
   * for the persistent results banner. Newest first, capped for safety.
   */
  async getFinishedResults(user: User): Promise<AiGenerationJob[]> {
    return this.aiGenerationJobRepository.find({
      where: {
        requestedByUserId: user.id,
        status: In([
          AiGenerationJobStatus.COMPLETED,
          AiGenerationJobStatus.FAILED,
        ]),
        acknowledgedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  /**
   * Marks finished results as read so they stop re-appearing in the banner.
   * With no ids, acknowledges ALL of the user's unread terminal results;
   * otherwise only the given ids (still owner-scoped).
   */
  async acknowledgeJobs(
    user: User,
    jobIds?: string[],
  ): Promise<{ acknowledged: number }> {
    const result = await this.aiGenerationJobRepository.update(
      {
        requestedByUserId: user.id,
        status: In([
          AiGenerationJobStatus.COMPLETED,
          AiGenerationJobStatus.FAILED,
        ]),
        acknowledgedAt: IsNull(),
        ...(jobIds && jobIds.length ? { id: In(jobIds) } : {}),
      },
      { acknowledgedAt: new Date() },
    );
    return { acknowledged: result.affected ?? 0 };
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
    creds: ResolvedAiCredentials,
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

    const sysModules = await this.systemFor(
      AiGenerationType.ROADMAP_MODULES,
      ROADMAP_MODULES_SYSTEM_PROMPT,
    );
    const { text: responseText, tokensIn: ti1, tokensOut: to1, latencyMs: lm1, model: m1 } = await this.complete(creds,
      sysModules.text,
      userPrompt,
      this.routeParams('roadmap_titles', { maxTokens: 400, temperature: 0.5 }),
      'roadmap_titles',
    );

    await this.logGeneration(user.id, AiGenerationType.ROADMAP_MODULES, creds.keyId, {
        model: m1,
        provider: creds.provider,
        promptVersion: sysModules.version,
        tokensIn: ti1,
        tokensOut: to1,
        latencyMs: lm1,
      });

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
    creds: ResolvedAiCredentials,
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

    const sysConcepts = await this.systemFor(
      AiGenerationType.MODULE_CONCEPTS,
      MODULE_CONCEPTS_SYSTEM_PROMPT,
    );
    const { text: titlesResponse, tokensIn: ti2, tokensOut: to2, latencyMs: lm2, model: m2 } = await this.complete(creds,
      sysConcepts.text,
      userPrompt,
      this.routeParams('module_concept_titles', { maxTokens: 400, temperature: 0.5 }),
      'module_concept_titles',
    );

    await this.logGeneration(user.id, AiGenerationType.MODULE_CONCEPTS, creds.keyId, {
        model: m2,
        provider: creds.provider,
        promptVersion: sysConcepts.version,
        tokensIn: ti2,
        tokensOut: to2,
        latencyMs: lm2,
      });

    const parsedTitles = this.parseStringArray(titlesResponse);
    const conceptTitles = parsedTitles.slice(0, remainingSlots);
    if (conceptTitles.length === 0) {
      // Catastrophic: nothing could be processed
      throw new HttpException(
        'AI failed to produce a valid list of concept titles. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Phase 2: Generate full content for each concept sequentially with sibling awareness.
    // Flag on: each concept runs the staged compiler (6 stage bumps per
    // concept). Flag off: the legacy single-shot body below, untouched.
    const compilerStages =
      this.compilerStageCount(AiGenerationJobType.MODULE_CONCEPTS) || 1;
    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: conceptTitles.length * compilerStages,
    });

    // Phase 2: Generate full content for each concept sequentially with sibling awareness
    const cumulativeSiblingTitles = [...existingConceptTitles];
    const failedItems: AiGenerationJobFailedItem[] = [];
    let createdCount = 0;
    let skippedCount = 0;
    let processed = 0;
    const sysContent = await this.systemFor(
      AiGenerationType.CONCEPT_CONTENT,
      CONCEPT_CONTENT_SYSTEM_PROMPT,
    );

    for (let i = 0; i < conceptTitles.length; i++) {
      const title = conceptTitles[i];

      // Check quota before each individual content call
      try {
        await this.checkRateLimit(user.id, 1, user.timezone, creds);
      } catch {
        skippedCount = conceptTitles.length - processed;
        break;
      }

      try {
        if (compilerStages > 1) {
          await this.compileConcept({
            jobId,
            title,
            difficulty: 'medium',
            roadmapId: moduleEntity.roadmapId,
            roadmapTitle: moduleEntity.roadmap?.title,
            roadmapDescription: moduleEntity.roadmap?.description || undefined,
            moduleTitle: moduleEntity.title,
            siblingTitles: cumulativeSiblingTitles,
            publishConcept: true,
            moduleId,
            user,
            creds,
            onStage: async (done) => {
              await this.bumpProgress(jobId, processed * compilerStages + done);
            },
          });
          createdCount++;
          cumulativeSiblingTitles.push(title);
        } else {
          const contentPrompt = buildConceptContentUserPrompt({
            title,
            difficulty: 'medium',
            roadmapTitle: moduleEntity.roadmap?.title,
            roadmapDescription: moduleEntity.roadmap?.description || undefined,
            moduleTitle: moduleEntity.title,
            siblingConceptTitles: cumulativeSiblingTitles,
          });

          const { text: generatedContent, tokensIn: ti3, tokensOut: to3, latencyMs: lm3, model: m3 } = await this.complete(creds,
            sysContent.text,
            contentPrompt,
            this.routeParams('concept_draft', { maxTokens: 3000, temperature: 0.6 }),
            'concept_draft',
          );

          await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
          model: m3,
          provider: creds.provider,
          promptVersion: sysContent.version,
          tokensIn: ti3,
          tokensOut: to3,
          latencyMs: lm3,
        });

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
        }
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Failed generating content for concept "${title}": ${error.message}`,
        );
        failedItems.push({ title, reason: error.message });
      }

      processed++;
      if (compilerStages <= 1) {
        await this.bumpProgress(jobId, processed);
      }
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
    creds: ResolvedAiCredentials,
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
    const sysMcq = await this.systemFor(
      AiGenerationType.CONCEPT_MCQS,
      CONCEPT_MCQ_SYSTEM_PROMPT,
    );

    for (const concept of conceptsNeedingMcqs) {
      // Check quota before each concept MCQ generation
      try {
        await this.checkRateLimit(user.id, 1, user.timezone, creds);
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
            const mcqParams = this.routeParams('module_mcqs', {
              maxTokens: 2000,
              temperature: 0.3,
              retryTemperature: 0.4,
            });
            const { text: responseText, tokensIn: ti4, tokensOut: to4, latencyMs: lm4, model: m4 } = await this.complete(creds,
              sysMcq.text,
              userPrompt,
              {
                maxTokens: mcqParams.maxTokens,
                temperature: attempt === 1 ? mcqParams.temperature : (mcqParams.retryTemperature ?? 0.4),
                responseFormat: { type: 'json_object' },
              },
              'module_mcqs',
            );

            if (attempt === 1) {
              await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS, creds.keyId, {
        model: m4,
        provider: creds.provider,
        promptVersion: sysMcq.version,
        tokensIn: ti4,
        tokensOut: to4,
        latencyMs: lm4,
      });
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
            // The fallback chain inside complete() is already exhausted here —
            // retrying a retired model would just 404 again.
            if (isModelRetiredError(apiErr)) throw apiErr;
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
   * Retry runner: re-attempt the given failed module titles for a roadmap.
   * Reuses `roadmapsService.createModule`; respects the 6-module cap. Never
   * generates fresh titles — only re-creates the ones that failed the first run.
   */
  private async retryRoadmapModulesJob(
    jobId: string,
    roadmapId: string,
    user: User,
    targetLabel: string,
    titles: string[],
    creds: ResolvedAiCredentials,
  ): Promise<AiGenerationJobResultSummary> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
      relations: ['modules'],
    });
    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const existingModules = roadmap.modules || [];
    const startOrderIndex = existingModules.length;
    const remainingCount = Math.max(6 - existingModules.length, 0);
    // Never exceed the 6-module cap when retrying.
    const titlesToRetry = titles.slice(0, remainingCount);

    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: titlesToRetry.length,
    });

    const failedItems: AiGenerationJobFailedItem[] = [];
    let createdCount = 0;

    for (let i = 0; i < titlesToRetry.length; i++) {
      const title = titlesToRetry[i];
      try {
        await this.roadmapsService.createModule(roadmapId, user, {
          title,
          orderIndex: startOrderIndex + i + 1,
        });
        createdCount++;
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Retry failed creating module "${title}": ${error.message}`,
        );
        failedItems.push({ title, reason: error.message });
      }
      await this.bumpProgress(jobId, i + 1);
    }

    return {
      createdCount,
      failedCount: failedItems.length,
      skippedCount: titles.length - titlesToRetry.length,
      failedItems,
      targetLabel,
      itemNoun: 'module',
    };
  }

  /**
   * Retry runner: re-attempt the given failed concept titles for a module.
   * Rebuilds the same roadmap/sibling context the first run used (seeded with
   * whatever concepts already exist, including first-run successes). Reuses the
   * content-generation building blocks; respects the 6-concept cap and quota.
   */
  private async retryModuleConceptsJob(
    jobId: string,
    moduleId: string,
    user: User,
    targetLabel: string,
    titles: string[],
    creds: ResolvedAiCredentials,
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

    const remainingSlots = Math.max(6 - existingConceptTitles.length, 0);
    const titlesToRetry = titles.slice(0, remainingSlots);

    await this.aiGenerationJobRepository.update(jobId, {
      progressTotal: titlesToRetry.length,
    });

    // Compiler: retries re-run the whole concept (writes are idempotent).
    const retryCompilerStages =
      this.compilerStageCount(AiGenerationJobType.MODULE_CONCEPTS) || 1;
    if (retryCompilerStages > 1) {
      await this.aiGenerationJobRepository.update(jobId, {
        progressTotal: titlesToRetry.length * retryCompilerStages,
      });
    }

    // Seed sibling awareness with the concepts already on the module so the
    // retry gets the same context signal the first run built up.
    const cumulativeSiblingTitles = [...existingConceptTitles];
    const failedItems: AiGenerationJobFailedItem[] = [];
    let createdCount = 0;
    let skippedCount = titles.length - titlesToRetry.length;
    let processed = 0;

    for (let i = 0; i < titlesToRetry.length; i++) {
      const title = titlesToRetry[i];

      // Check quota before each individual content call (same as the first run).
      try {
        await this.checkRateLimit(user.id, 1, user.timezone, creds);
      } catch {
        skippedCount += titlesToRetry.length - processed;
        break;
      }

      try {
        if (retryCompilerStages > 1) {
          await this.compileConcept({
            jobId,
            title,
            difficulty: 'medium',
            roadmapId: moduleEntity.roadmapId,
            roadmapTitle: moduleEntity.roadmap?.title,
            roadmapDescription: moduleEntity.roadmap?.description || undefined,
            moduleTitle: moduleEntity.title,
            siblingTitles: cumulativeSiblingTitles,
            publishConcept: true,
            moduleId,
            user,
            creds,
            onStage: async (done) => {
              await this.bumpProgress(
                jobId,
                processed * retryCompilerStages + done,
              );
            },
          });
          createdCount++;
          cumulativeSiblingTitles.push(title);
        } else {
          const contentPrompt = buildConceptContentUserPrompt({
            title,
            difficulty: 'medium',
            roadmapTitle: moduleEntity.roadmap?.title,
            roadmapDescription: moduleEntity.roadmap?.description || undefined,
            moduleTitle: moduleEntity.title,
            siblingConceptTitles: cumulativeSiblingTitles,
          });

          const sysRetryContent = await this.systemFor(
            AiGenerationType.CONCEPT_CONTENT,
            CONCEPT_CONTENT_SYSTEM_PROMPT,
          );
          const { text: generatedContent, tokensIn: ti5, tokensOut: to5, latencyMs: lm5, model: m5 } = await this.complete(creds,
            sysRetryContent.text,
            contentPrompt,
            this.routeParams('concept_draft', { maxTokens: 3000, temperature: 0.6 }),
            'concept_draft',
          );

          await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
          model: m5,
          provider: creds.provider,
          promptVersion: sysRetryContent.version,
          tokensIn: ti5,
          tokensOut: to5,
          latencyMs: lm5,
        });

          const sanitizedContent =
            await this.validateAndSanitizeConceptLinks(generatedContent);

          const createdConcept = await this.conceptsService.createConcept(user, {
            title,
            content: sanitizedContent,
            difficulty: ConceptDifficulty.MEDIUM,
            isAiGenerated: true,
          });

          await this.roadmapsService.attachConceptToModule(moduleId, user, {
            conceptId: createdConcept.id,
          });

          createdCount++;
          cumulativeSiblingTitles.push(title);
        }
      } catch (err: unknown) {
        const error = err as Error;
        this.logger.error(
          `Retry failed generating content for concept "${title}": ${error.message}`,
        );
        failedItems.push({ title, reason: error.message });
      }

      processed++;
      if (retryCompilerStages <= 1) {
        await this.bumpProgress(jobId, processed);
      }
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
   * Retry runner: re-attempt MCQ generation for the given failed concept titles.
   * Selects module concepts whose title is in the retry set AND that still lack
   * MCQs, then reuses the same 2-attempt generate/parse/create loop.
   */
  private async retryModuleMcqsJob(
    jobId: string,
    moduleId: string,
    user: User,
    targetLabel: string,
    conceptTitles: string[],
    creds: ResolvedAiCredentials,
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

    // Only re-attempt concepts that failed the first time AND still lack MCQs.
    const retryTitleSet = new Set(conceptTitles);
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
      .filter(
        (mc) =>
          mc.concept &&
          retryTitleSet.has(mc.concept.title) &&
          !conceptsWithQuestions.has(mc.conceptId),
      )
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
      // Check quota before each concept MCQ generation.
      try {
        await this.checkRateLimit(user.id, 1, user.timezone, creds);
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
        const sysRetryMcq = await this.systemFor(
          AiGenerationType.CONCEPT_MCQS,
          CONCEPT_MCQ_SYSTEM_PROMPT,
        );

        while (attempt < maxAttempts && !parsedQuestions) {
          attempt++;
          try {
            const retryMcqParams = this.routeParams('module_mcqs', {
              maxTokens: 2000,
              temperature: 0.3,
              retryTemperature: 0.4,
            });
            const { text: responseText, tokensIn: ti6, tokensOut: to6, latencyMs: lm6, model: m6 } = await this.complete(creds,
              sysRetryMcq.text,
              userPrompt,
              {
                maxTokens: retryMcqParams.maxTokens,
                temperature: attempt === 1 ? retryMcqParams.temperature : (retryMcqParams.retryTemperature ?? 0.4),
                responseFormat: { type: 'json_object' },
              },
              'module_mcqs',
            );

            if (attempt === 1) {
              await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS, creds.keyId, {
        model: m6,
        provider: creds.provider,
        promptVersion: sysRetryMcq.version,
        tokensIn: ti6,
        tokensOut: to6,
        latencyMs: lm6,
      });
            }

            parsedQuestions = this.parseMcqQuestions(
              responseText,
              concept.title,
            );
            if (!parsedQuestions && attempt < maxAttempts) {
              this.logger.warn(
                `Retry parse failed on attempt 1 for concept "${concept.title}". Automatically retrying with fresh completion...`,
              );
            }
          } catch (apiErr: unknown) {
            // The fallback chain inside complete() is already exhausted here —
            // retrying a retired model would just 404 again.
            if (isModelRetiredError(apiErr)) throw apiErr;
            if (attempt >= maxAttempts) throw apiErr;
            const errMsg =
              apiErr instanceof Error ? apiErr.message : String(apiErr);
            this.logger.warn(
              `Retry API error on attempt 1 for concept "${concept.title}": ${errMsg}. Retrying...`,
            );
          }
        }

        if (!parsedQuestions || parsedQuestions.length === 0) {
          this.logger.error(
            `Retry invalid MCQ JSON response after ${maxAttempts} attempts for concept "${concept.title}"`,
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
          `Retry failed MCQ generation for concept "${concept.title}": ${error.message}`,
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
   * §8 compiler: staged concept pipeline replacing single-shot content
   * generation (outline → draft → fact-check → critique → revise → validate
   * → publish). Runs only behind COURSE_ENGINE_ENABLED; callers branch to
   * the legacy single-shot path when the flag is off.
   *
   * Quota: exactly one non-internal log per concept (the draft — the content
   * generation itself). Outline/fact-check/critique/revise log internal:true:
   * telemetry without quota cost. The upfront checkRateLimit(1) per concept
   * in the callers is unchanged, so consumption matches legacy exactly.
   *
   * Re-runs are whole-concept and safe: compilation rows upsert on
   * (jobId, title); cards/terms/edges downstream are upserts; only failed
   * titles (nothing published) ever re-run.
   */
  private static readonly COMPILER_STAGES_PER_CONCEPT = 7;

  /** Stage multiplier for job progress math (0 = legacy per-concept bumps). */
  private compilerStageCount(jobType: AiGenerationJobType): number {
    if (
      this.routingEnabled() &&
      jobType === AiGenerationJobType.MODULE_CONCEPTS
    ) {
      return AiGenerateService.COMPILER_STAGES_PER_CONCEPT;
    }
    return 0;
  }

  private outlineSummary(outline: ConceptOutline): string {
    return `${outline.title} — ${outline.objectives.join('; ')}`.slice(0, 1000);
  }

  private mapOutlineDifficulty(difficulty: string): ConceptDifficulty {
    if (difficulty === 'easy') return ConceptDifficulty.EASY;
    if (difficulty === 'hard') return ConceptDifficulty.HARD;
    return ConceptDifficulty.MEDIUM;
  }

  /** Registry snapshot for the outline prompt: valid builds_on ids + known terms. */
  private async registryContextText(roadmapId: string): Promise<string> {
    const [cards, terms] = await Promise.all([
      this.conceptCardRepository.find({ where: { roadmapId } }),
      this.courseTermRepository.find({
        where: { roadmapId },
        order: { term: 'ASC' },
        take: 30,
      }),
    ]);
    const lines: string[] = [];
    if (cards.length > 0) {
      const ids = [...new Set(cards.map((c) => c.conceptId))].sort();
      lines.push(`Known concept ids: ${ids.join(', ')}`);
    } else {
      lines.push('Known concept ids: (none yet — leave builds_on empty)');
    }
    if (terms.length > 0) {
      lines.push(
        `Known terms: ${terms.map((t) => `${t.term} (${t.definition})`).join('; ')}`,
      );
    }
    return lines.join('\n');
  }

  private async registryTermsText(roadmapId: string): Promise<string> {
    const terms = await this.courseTermRepository.find({
      where: { roadmapId },
      order: { term: 'ASC' },
      take: 50,
    });
    if (terms.length === 0) return '(term registry empty)';
    return terms.map((t) => `- ${t.term}: ${t.definition}`).join('\n');
  }

  /** All concept titles attached anywhere in this roadmap (recall scope). */
  private async roadmapConceptTitles(roadmapId: string): Promise<string[]> {
    const modules = await this.moduleRepository.find({ where: { roadmapId } });
    const titles: string[] = [];
    for (const module of modules) {
      const links = await this.moduleConceptRepository.find({
        where: { moduleId: module.id },
        relations: ['concept'],
      });
      for (const link of links) {
        if (link.concept?.title) titles.push(link.concept.title);
      }
    }
    return titles;
  }

  /**
   * The full staged pipeline for one concept. Returns the publishable
   * content plus accumulated warnings (empty on a clean run).
   */
  async compileConcept(input: {
    jobId: string | null;
    title: string;
    difficulty?: string;
    roadmapId: string;
    roadmapTitle?: string;
    roadmapDescription?: string;
    moduleTitle?: string;
    siblingTitles: string[];
    existingConceptId?: string | null;
    publishConcept: boolean;
    moduleId?: string;
    user: User;
    creds: ResolvedAiCredentials;
    onStage?: (done: number, total: number) => Promise<void> | void;
  }): Promise<{ content: string; warnings: string[]; conceptId: string | null }> {
    const { user, creds } = input;
    const total = AiGenerateService.COMPILER_STAGES_PER_CONCEPT;
    const warnings: string[] = [];
    const trace: Array<Record<string, unknown>> = [];
    let done = 0;
    const note = async (stage: string, ok: boolean, detail?: unknown) => {
      trace.push({ stage, ok, detail: detail ?? null });
      done += 1;
      if (input.onStage) await input.onStage(done, total);
    };

    let compilation = await this.compilationRepository.findOne({
      where: {
        title: input.title,
        ...(input.jobId ? { jobId: input.jobId } : { jobId: IsNull() }),
      },
    });
    if (!compilation) {
      compilation = this.compilationRepository.create({
        jobId: input.jobId,
        title: input.title,
        roadmapId: input.roadmapId,
        conceptId: input.existingConceptId ?? null,
        status: 'running',
        stages: [],
        warnings: [],
      });
    } else {
      compilation.status = 'running';
      compilation.stages = [];
      compilation.warnings = [];
    }
    await this.compilationRepository.save(compilation);

    const finish = async (
      status: 'succeeded' | 'succeeded_with_warnings' | 'failed',
      conceptId: string | null,
    ) => {
      compilation!.status = status;
      compilation!.stages = trace;
      compilation!.warnings = warnings;
      compilation!.conceptId = conceptId;
      await this.compilationRepository.save(compilation!);
    };

    try {
      // Stage 1: outline (internal — the draft carries the quota slot).
      const sysOutline = await this.systemFor(
        AiGenerationType.CONCEPT_CONTENT,
        CONCEPT_OUTLINE_SYSTEM_PROMPT,
      );
      const outlineParams = this.routeParams('concept_outline', {
        maxTokens: 800,
        temperature: 0.5,
      });
      // Registry context is read fresh (cheap, local) so builds_on ids validate.
      const registryContext = await this.registryContextText(input.roadmapId);
      const outlineWithContext = () =>
        this.complete(
          creds,
          sysOutline.text,
          buildOutlineUserPrompt({
            title: input.title,
            difficulty: input.difficulty,
            roadmapTitle: input.roadmapTitle,
            moduleTitle: input.moduleTitle,
            siblingConceptTitles: input.siblingTitles,
            registryContext,
          }),
          {
            ...outlineParams,
            responseFormat: { type: 'json_object' },
          },
          'concept_outline',
          undefined,
          true,
        );
      let outlineRaw = await outlineWithContext();
      await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
        model: outlineRaw.model,
        provider: creds.provider,
        promptVersion: sysOutline.version,
        tokensIn: outlineRaw.tokensIn,
        tokensOut: outlineRaw.tokensOut,
        latencyMs: outlineRaw.latencyMs,
        internal: outlineRaw.internal,
      });
      let outline: ConceptOutline;
      try {
        outline = parseOutline(outlineRaw.text);
      } catch {
        // One re-ask for malformed outlines (MCQ-retry precedent), then fail.
        this.logger.warn(`Outline parse failed for "${input.title}". Retrying once...`);
        outlineRaw = await outlineWithContext();
        await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
          model: outlineRaw.model,
          provider: creds.provider,
          promptVersion: sysOutline.version,
          tokensIn: outlineRaw.tokensIn,
          tokensOut: outlineRaw.tokensOut,
          latencyMs: outlineRaw.latencyMs,
          internal: outlineRaw.internal,
        });
        outline = parseOutline(outlineRaw.text);
      }
      // builds_on ids must already exist as cards; new key_terms register.
      for (const depId of outline.builds_on) {
        const card = await this.conceptCardRepository.findOne({
          where: { conceptId: depId },
        });
        if (!card) {
          throw new HttpException(
            `Outline for "${input.title}" references unknown concept id "${depId}" in builds_on.`,
            HttpStatus.BAD_GATEWAY,
          );
        }
      }
      for (const keyTerm of outline.key_terms) {
        await this.courseContexts.upsertTerm(
          input.roadmapId,
          keyTerm.term,
          keyTerm.definition,
        );
      }
      for (const objective of objectivesWithoutBloomVerb(outline.objectives)) {
        warnings.push(`Objective without a Bloom verb: "${objective}"`);
      }
      await note('outline', true);

      // Stage 1.5: research (internal) — "AI reads sources and reports to
      // itself" before drafting. Degrades to brief=null on empty corpus,
      // missing keys, or any failure: never fails a concept. Provenance
      // (source ids) lands in the compilation trace, never user-facing.
      let researchBrief: string | null = null;
      let researchChunkTexts: string[] = [];
      try {
        const retrieved = await this.courseResearch.retrieveForOutline(
          input.roadmapId,
          {
            terms: outline.key_terms.map((k) => `${k.term}: ${k.definition}`),
            objectives: outline.objectives,
          },
          creds.provider === AiProvider.NVIDIA ? creds.apiKey : undefined,
        );
        if (retrieved.chunks.length > 0) {
          const titles = new Map<string, string>();
          for (const chunk of retrieved.chunks) {
            if (!titles.has(chunk.sourceId)) {
              const source = await this.courseResearch.findSource(chunk.sourceId);
              titles.set(chunk.sourceId, source?.title ?? chunk.sourceId);
            }
          }
          const sysResearch = await this.systemFor(
            AiGenerationType.CONCEPT_CONTENT,
            CONCEPT_RESEARCH_SYSTEM_PROMPT,
          );
          const researchParams = this.routeParams('concept_research', {
            maxTokens: 800,
            temperature: 0.3,
          });
          const briefRaw = await this.complete(
            creds,
            sysResearch.text,
            buildResearchBriefUserPrompt({
              queries: [
                ...outline.key_terms.map((k) => k.term),
                ...outline.objectives,
              ],
              chunks: retrieved.chunks.map((c) => ({
                sourceTitle: titles.get(c.sourceId) ?? c.sourceId,
                content: c.content,
              })),
            }),
            { ...researchParams, responseFormat: { type: 'json_object' } },
            'concept_research',
            undefined,
            true,
          );
          await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
            model: briefRaw.model,
            provider: creds.provider,
            promptVersion: sysResearch.version,
            tokensIn: briefRaw.tokensIn,
            tokensOut: briefRaw.tokensOut,
            latencyMs: briefRaw.latencyMs,
            internal: briefRaw.internal,
          });
          try {
            researchBrief = parseResearchBrief(briefRaw.text).brief;
          } catch {
            warnings.push('Research brief malformed; continuing without it.');
            researchBrief = null;
          }
          researchChunkTexts = retrieved.chunks.map((c) => c.content);
          await note('research', true, {
            mode: RESEARCH_GROUNDING_MODE,
            sourceIds: retrieved.sourceIds,
            chunkIds: retrieved.chunks.map((c) => c.id),
            briefChars: researchBrief?.length ?? 0,
          });
        } else {
          await note('research', true, {
            mode: RESEARCH_GROUNDING_MODE,
            sourceIds: [],
            chunkIds: [],
            briefChars: 0,
            skipped: 'empty corpus',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Research unavailable (${msg}); continuing without a brief.`);
        researchBrief = null;
        researchChunkTexts = [];
        await note('research', false, msg);
      }

      // Stage 2: draft (the single billable call per concept).
      // Context hydration never fails the concept — without it we still
      // have the outline, so draft from that alone.
      let contextBlockText: string | undefined;
      try {
        const contextBlock = await this.courseContext.build(
          AiGenerationType.CONCEPT_CONTENT,
          input.roadmapId,
          { conceptId: input.existingConceptId ?? undefined },
        );
        contextBlockText = contextBlock.block || undefined;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Context hydration skipped: ${msg}`);
      }
      const sysDraft = await this.systemFor(
        AiGenerationType.CONCEPT_CONTENT,
        CONCEPT_DRAFT_SYSTEM_PROMPT,
      );
      const draftParams = this.routeParams('concept_draft', {
        maxTokens: 3000,
        temperature: 0.6,
      });
      const draftRaw = await this.complete(
        creds,
        sysDraft.text,
        buildDraftUserPrompt({
          outlineJson: JSON.stringify(outline),
          contextBlock: contextBlockText,
          researchBrief: researchBrief ?? undefined,
        }),
        { ...draftParams },
        'concept_draft',
      );
      await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
        model: draftRaw.model,
        provider: creds.provider,
        promptVersion: sysDraft.version,
        tokensIn: draftRaw.tokensIn,
        tokensOut: draftRaw.tokensOut,
        latencyMs: draftRaw.latencyMs,
        internal: draftRaw.internal,
      });
      let current = draftRaw.text;
      await note('draft', true);

      // Copyright guard: verbatim 8-gram overlap vs retrieved chunks above
      // threshold → warning + regenerate once with a paraphrase instruction,
      // then publish with a warning regardless. Skipped with no chunks.
      if (researchChunkTexts.length > 0) {
        const overlap = verbatimOverlap(current, researchChunkTexts);
        if (overlap.triggered) {
          warnings.push(
            `Verbatim overlap ${(overlap.ratio * 100).toFixed(1)}% vs sources (${overlap.hits} passages); regenerated once.`,
          );
          const paraphraseRaw = await this.complete(
            creds,
            sysDraft.text,
            buildReviseUserPrompt({
              draftContent: current,
              blockingIssues: [
                'Paraphrase passages that closely mirror the retrieved sources into your own words; keep every fact, example, and section intact.',
              ],
              factcheckFindings: [],
            }),
            { ...draftParams },
            'concept_draft',
            undefined,
            true,
          );
          await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
            model: paraphraseRaw.model,
            provider: creds.provider,
            promptVersion: sysDraft.version,
            tokensIn: paraphraseRaw.tokensIn,
            tokensOut: paraphraseRaw.tokensOut,
            latencyMs: paraphraseRaw.latencyMs,
            internal: paraphraseRaw.internal,
          });
          current = paraphraseRaw.text;
          const recheck = verbatimOverlap(current, researchChunkTexts);
          if (recheck.triggered) {
            warnings.push(
              `Verbatim overlap persists after regeneration (${(recheck.ratio * 100).toFixed(1)}%); published with warning.`,
            );
          }
        }
      }

      // Stage 3: fact-check (internal) — outline fidelity + registry terms.
      // Findings feed the revise must-fix list; a malformed fact-check
      // degrades to a warning rather than failing the concept.
      const sysFact = await this.systemFor(
        AiGenerationType.CONCEPT_CONTENT,
        CONCEPT_FACTCHECK_SYSTEM_PROMPT,
      );
      const factParams = this.routeParams('concept_factcheck', {
        maxTokens: 1500,
        temperature: 0.3,
      });
      const factRaw = await this.complete(
        creds,
        sysFact.text,
        buildFactcheckUserPrompt({
          outlineJson: JSON.stringify(outline),
          draftContent: current,
          registryTerms: await this.registryTermsText(input.roadmapId),
          researchBrief: researchBrief ?? undefined,
        }),
        { ...factParams, responseFormat: { type: 'json_object' } },
        'concept_factcheck',
        undefined,
        true,
      );
      await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
        model: factRaw.model,
        provider: creds.provider,
        promptVersion: sysFact.version,
        tokensIn: factRaw.tokensIn,
        tokensOut: factRaw.tokensOut,
        latencyMs: factRaw.latencyMs,
        internal: factRaw.internal,
      });
      let factFindings: string[] = [];
      try {
        const factcheck = parseFactcheck(factRaw.text);
        factFindings = [...factcheck.outline_drift, ...factcheck.term_issues];
        if (!factcheck.consistent && factFindings.length === 0) {
          factFindings = ['fact-check flagged inconsistency without details'];
        }
      } catch {
        warnings.push('Fact-check stage returned unusable JSON; skipped.');
      }
      await note('fact-check', true);

      // Stages 4+5: critique → revise, capped at 2 revises. Leftover
      // blocking issues publish as warnings, never hard-fail.
      const sysCritique = await this.systemFor(
        AiGenerationType.CONCEPT_CONTENT,
        CONCEPT_CRITIQUE_SYSTEM_PROMPT,
      );
      const critiqueParams = this.routeParams('concept_critique', {
        maxTokens: 2000,
        temperature: 0.3,
      });
      const sysRevise = await this.systemFor(
        AiGenerationType.CONCEPT_CONTENT,
        CONCEPT_REVISE_SYSTEM_PROMPT,
      );
      const reviseParams = this.routeParams('concept_draft', {
        maxTokens: 3000,
        temperature: 0.6,
      });
      let blocking: string[] = [];
      let critiques = 0;
      let revises = 0;
      for (let round = 0; round < 3; round += 1) {
        const critiqueRaw = await this.complete(
          creds,
          sysCritique.text,
          buildCritiqueUserPrompt({
            title: outline.title,
            draftContent: current,
            objectives: outline.objectives,
            difficulty: outline.difficulty,
          }),
          { ...critiqueParams, responseFormat: { type: 'json_object' } },
          'concept_critique',
          undefined,
          true,
        );
        await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
          model: critiqueRaw.model,
          provider: creds.provider,
          promptVersion: sysCritique.version,
          tokensIn: critiqueRaw.tokensIn,
          tokensOut: critiqueRaw.tokensOut,
          latencyMs: critiqueRaw.latencyMs,
          internal: critiqueRaw.internal,
        });
        critiques += 1;
        try {
          blocking = parseCritique(critiqueRaw.text).blocking_issues;
        } catch {
          warnings.push('Critique stage returned unusable JSON; skipped.');
          blocking = [];
          break;
        }
        if (blocking.length === 0 || round >= 2) break;
        const reviseRaw = await this.complete(
          creds,
          sysRevise.text,
          buildReviseUserPrompt({
            draftContent: current,
            blockingIssues: blocking,
            factcheckFindings: factFindings,
          }),
          { ...reviseParams },
          'concept_draft',
          undefined,
          true,
        );
        await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
          model: reviseRaw.model,
          provider: creds.provider,
          promptVersion: sysRevise.version,
          tokensIn: reviseRaw.tokensIn,
          tokensOut: reviseRaw.tokensOut,
          latencyMs: reviseRaw.latencyMs,
          internal: reviseRaw.internal,
        });
        current = reviseRaw.text;
        revises += 1;
        factFindings = [];
      }
      for (const issue of blocking) {
        warnings.push(`Unresolved blocking issue published as draft: "${issue}"`);
      }
      await note('critique-revise', true, `${critiques} critique(s), ${revises} revise(s)`);

      // Stage 6: validate — machine checks only, no model call.
      const knownTitles = await this.roadmapConceptTitles(input.roadmapId);
      const knownTerms = (
        await this.courseTermRepository.find({
          where: { roadmapId: input.roadmapId },
        })
      ).map((t) => t.term.toLowerCase());
      for (const hook of outline.recall_hooks) {
        const needle = hook.toLowerCase();
        const hit =
          knownTerms.some((t) => t.includes(needle) || needle.includes(t)) ||
          knownTitles.some(
            (t) => t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase()),
          );
        if (!hit) warnings.push(`Recall hook has no registry target: "${hook}"`);
      }
      for (const keyTerm of outline.key_terms) {
        if (!knownTerms.includes(keyTerm.term.toLowerCase())) {
          warnings.push(`Key term missing from registry: "${keyTerm.term}"`);
        }
      }
      const beforeLinks = current;
      current = await this.validateAndSanitizeConceptLinks(current);
      if (current !== beforeLinks) {
        warnings.push('Validate stripped dead links from the draft.');
      }
      await note('validate', true);

      // Stage 7: publish — the compounding loop. Batch creates + attaches;
      // single-shot only enriches the registry when it has a concept to pin.
      let conceptId: string | null = input.existingConceptId ?? null;
      if (input.publishConcept) {
        const createdConcept = await this.conceptsService.createConcept(user, {
          title: outline.title,
          content: current,
          difficulty: this.mapOutlineDifficulty(outline.difficulty),
          isAiGenerated: true,
        });
        if (input.moduleId) {
          await this.roadmapsService.attachConceptToModule(input.moduleId, user, {
            conceptId: createdConcept.id,
          });
        }
        conceptId = createdConcept.id;
      }
      if (conceptId) {
        await this.courseContexts.upsertCard(input.roadmapId, conceptId, {
          summary: this.outlineSummary(outline),
          keyClaims: outline.objectives,
        });
        for (const depId of outline.builds_on) {
          try {
            await this.courseContexts.addEdge(
              input.roadmapId,
              depId,
              conceptId,
              CourseEdgeType.BUILDS_ON,
            );
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            warnings.push(`Edge ${depId} → concept skipped: ${msg}`);
          }
        }
      }
      await note('publish', true);

      await finish(warnings.length > 0 ? 'succeeded_with_warnings' : 'succeeded', conceptId);
      return { content: current, warnings, conceptId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.push({ stage: 'failed', ok: false, detail: msg });
      compilation!.status = 'failed';
      compilation!.stages = trace;
      compilation!.warnings = warnings;
      await this.compilationRepository.save(compilation!);
      throw err;
    }
  }

  /**
   * Non-streaming single concept content generation helper
   */
  async generateSingleConceptContent(
    dto: GenerateConceptContentDto,
    user: User,
  ): Promise<{ content: string }> {
    const creds = await this.resolveCredentials(user, {
      provider: dto.provider,
      model: dto.model,
      taskKey: 'concept_draft',
    });
    await this.checkRateLimit(user.id, 1, user.timezone, creds);

    // Flag on with a roadmap scope: the staged compiler (no publish — the
    // caller only asked for content; registry enrichment pins to dto.conceptId
    // when one is provided). Otherwise the legacy single-shot below.
    if (this.routingEnabled() && dto.roadmapId) {
      const result = await this.compileConcept({
        jobId: null,
        title: dto.title,
        difficulty: dto.difficulty,
        roadmapId: dto.roadmapId,
        roadmapTitle: dto.roadmapTitle,
        roadmapDescription: dto.roadmapDescription,
        moduleTitle: dto.moduleTitle,
        siblingTitles: dto.siblingConceptTitles ?? [],
        existingConceptId: dto.conceptId ?? null,
        publishConcept: false,
        user,
        creds,
      });
      return { content: result.content };
    }

    const sysSingleContent = await this.systemFor(
      AiGenerationType.CONCEPT_CONTENT,
      CONCEPT_CONTENT_SYSTEM_PROMPT,
    );
    const systemPrompt = sysSingleContent.text;
    let userPrompt = buildConceptContentUserPrompt(dto);

    // §8 Phase 1 proof path (ONE path only): context hydration behind the
    // COURSE_ENGINE flag. Flag off or ids absent → byte-identical behavior.
    // Never throws — a builder failure logs and falls back to legacy.
    if (
      this.configService.get<string>('COURSE_ENGINE_ENABLED') === 'true' &&
      dto.roadmapId
    ) {
      try {
        const context = await this.courseContext.build(
          AiGenerationType.CONCEPT_CONTENT,
          dto.roadmapId,
          { conceptId: dto.conceptId },
        );
        if (context.block) userPrompt = `${userPrompt}\n\n${context.block}`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Context hydration skipped: ${msg}`);
      }
    }

    const { text: rawContent, tokensIn: ti7, tokensOut: to7, latencyMs: lm7, model: m7 } = await this.complete(creds,
      systemPrompt,
      userPrompt,
      this.routeParams('concept_draft', { maxTokens: 3000, temperature: 0.6 }),
      'concept_draft',
    );

    await this.logGeneration(user.id, AiGenerationType.CONCEPT_CONTENT, creds.keyId, {
        model: m7,
        provider: creds.provider,
        promptVersion: sysSingleContent.version,
        tokensIn: ti7,
        tokensOut: to7,
        latencyMs: lm7,
      });

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
    const creds = await this.resolveCredentials(user, {
      provider: dto.provider,
      model: dto.model,
      taskKey: 'single_concept_mcqs',
    });
    await this.checkRateLimit(user.id, 1, user.timezone, creds);

    const sysSingleMcq = await this.systemFor(
      AiGenerationType.CONCEPT_MCQS,
      CONCEPT_MCQ_SYSTEM_PROMPT,
    );
    const systemPrompt = sysSingleMcq.text;
    const userPrompt = buildConceptMcqUserPrompt(dto.title, dto.content);

    let parsedQuestions: ParsedMcqQuestion[] | null = null;
    let attempt = 0;
    const maxAttempts = 2;
    let lastResponseText = '';

    while (attempt < maxAttempts && !parsedQuestions) {
      attempt++;
      try {
        const singleMcqParams = this.routeParams('single_concept_mcqs', {
          maxTokens: 2000,
          temperature: 0.3,
          retryTemperature: 0.4,
        });
        const retryResult = await this.complete(creds,
          systemPrompt,
          userPrompt,
          {
            maxTokens: singleMcqParams.maxTokens,
            temperature: attempt === 1 ? singleMcqParams.temperature : (singleMcqParams.retryTemperature ?? 0.4),
            responseFormat: { type: 'json_object' },
          },
          'single_concept_mcqs',
        );
        lastResponseText = retryResult.text;

        if (attempt === 1) {
          await this.logGeneration(user.id, AiGenerationType.CONCEPT_MCQS, creds.keyId, {
        model: retryResult.model,
        provider: creds.provider,
        promptVersion: sysSingleMcq.version,
        tokensIn: retryResult.tokensIn,
        tokensOut: retryResult.tokensOut,
        latencyMs: retryResult.latencyMs,
      });
        }

        parsedQuestions = this.parseMcqQuestions(lastResponseText, dto.title);
        if (!parsedQuestions && attempt < maxAttempts) {
          this.logger.warn(
            `Single concept MCQ parse failed on attempt 1 for "${dto.title}". Retrying...`,
          );
        }
      } catch (err: unknown) {
        // Same as the batch loops: the chain is exhausted, don't 404 twice.
        if (isModelRetiredError(err)) throw err;
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
    const creds = await this.resolveCredentials(user, {
      taskKey: 'qa_answer',
    });
    await this.checkRateLimit(user.id, 1, user.timezone, creds);

    const sysQa = await this.systemFor(
      AiGenerationType.QA_ANSWER,
      QA_ANSWER_SYSTEM_PROMPT,
    );
    const systemPrompt = sysQa.text;
    const userPrompt = buildQaAnswerUserPrompt(
      conceptTitle,
      conceptContent,
      questionBody,
    );

    const { text: answer, tokensIn: ti8, tokensOut: to8, latencyMs: lm8, model: m8 } = await this.complete(creds,
      systemPrompt,
      userPrompt,
      this.routeParams('qa_answer', { maxTokens: 1500, temperature: 0.5 }),
      'qa_answer',
    );

    await this.logGeneration(user.id, AiGenerationType.QA_ANSWER, creds.keyId, {
        model: m8,
        provider: creds.provider,
        promptVersion: sysQa.version,
        tokensIn: ti8,
        tokensOut: to8,
        latencyMs: lm8,
      });

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
