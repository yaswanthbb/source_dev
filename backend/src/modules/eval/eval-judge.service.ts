import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiPromptRegistry } from '../ai-generate/ai-prompt-registry.service';
import {
  AiProviderClients,
  CompletionOptions,
} from '../ai-generate/ai-provider-clients';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { AiGenerationLog } from '../ai-generate/entities/ai-generation-log.entity';
import { EvalRun } from './entities/eval-run.entity';
import {
  EVAL_RUBRIC,
  EVAL_JUDGE_SYSTEM_PROMPT,
  RUBRIC_VERSION,
  parseJudgeBatch,
} from './eval-rubric';
import { hashText, evidenceText } from './eval-hash';
import { taskRouteFor, resolveTierModel } from '../ai-generate/task-routing';

@Injectable()
export class EvalJudgeService {
  private readonly logger = new Logger(EvalJudgeService.name);
  constructor(
    private readonly config: ConfigService,
    private readonly registry: AiPromptRegistry,
    private readonly clients: AiProviderClients,
    @InjectRepository(EvalRun) private readonly runs: Repository<EvalRun>,
    @InjectRepository(AiGenerationLog)
    private readonly logs: Repository<AiGenerationLog>,
  ) {}
  settings() {
    if (this.config.get('EVAL_ENABLED') !== 'true')
      throw new ServiceUnavailableException(
        'EVAL_ENABLED must be true for model-backed evaluations',
      );
    const provider =
      this.config.get<string>('EVAL_PROVIDER') ?? AiProvider.NVIDIA;
    if (!Object.values(AiProvider).includes(provider as AiProvider))
      throw new BadRequestException('Invalid EVAL_PROVIDER');
    const apiKey = this.config.get<string>('EVAL_PROVIDER_API_KEY');
    if (!apiKey?.trim())
      throw new ServiceUnavailableException(
        'Operator eval credentials are not configured',
      );
    const integer = (
      key: string,
      fallback: number,
      min: number,
      max: number,
    ) => {
      const raw = this.config.get<string>(key),
        value = raw == null || raw === '' ? fallback : Number(raw);
      if (!Number.isInteger(value) || value < min || value > max)
        throw new BadRequestException(
          `${key} must be an integer ${min}..${max}`,
        );
      return value;
    };
    const judgeModel =
      this.config.get<string>('EVAL_JUDGE_MODEL')?.trim() ||
      resolveTierModel(
        provider as AiProvider,
        taskRouteFor('eval_judge').tier,
        (key) => this.config.get<string>(key),
        (p) => this.clients.configuredDefaultModel(p),
      );
    const generatorModel =
      this.config.get<string>('EVAL_GENERATOR_MODEL')?.trim() ||
      this.clients.configuredDefaultModel(provider as AiProvider);
    return {
      provider: provider as AiProvider,
      apiKey,
      judgeModel,
      generatorModel,
      seed: integer('EVAL_SEED', 42, 0, 2147483647),
      batchSize: integer('EVAL_JUDGE_BATCH_SIZE', 2, 1, 4),
      timeoutMs: integer('EVAL_TIMEOUT_MS', 60000, 1000, 300000),
    };
  }
  /** Direct internal provider dispatch; never calls user quota or serves generated content. */
  async complete(
    userId: string,
    model: string,
    system: string,
    user: string,
    version: string,
    options: CompletionOptions,
  ) {
    const settings = this.settings(),
      started = Date.now();
    try {
      const result = await this.clients.complete(
        settings.provider,
        settings.apiKey,
        model,
        system,
        user,
        options,
        AbortSignal.timeout(settings.timeoutMs),
      );
      await this.logs.save(
        this.logs.create({
          userId,
          generationType: AiGenerationType.EVAL_JUDGE,
          model,
          provider: settings.provider,
          promptVersion: version,
          internal: true,
          providerKeyId: null,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          latencyMs: Date.now() - started,
        }),
      );
      return result.text;
    } catch {
      // Never persist provider errors/URLs that might include operator credentials.
      throw new ServiceUnavailableException(
        'EVAL_PROVIDER_FAILURE: completion or internal audit logging failed',
      );
    }
  }
  async judgeBatch(rows: EvalRun[], userId: string): Promise<EvalRun[]> {
    const settings = this.settings();
    if (!rows.length || rows.length > settings.batchSize)
      throw new BadRequestException('Judge batch outside configured bound');
    const prompt = await this.registry.resolveSystem(
      AiGenerationType.EVAL_JUDGE,
      EVAL_JUDGE_SYSTEM_PROMPT,
    );
    const artifacts = new Map(
      rows.map((run) => [run.id, evidenceText(run.artifact)]),
    );
    if ([...artifacts.values()].some((text) => text.length > 60000))
      throw new BadRequestException(
        'Eval artifact exceeds 60000 characters; split the artifact explicitly',
      );
    let raw: string | null = null;
    try {
      raw = await this.complete(
        userId,
        settings.judgeModel,
        prompt.systemTemplate,
        JSON.stringify({
          rubricVersion: RUBRIC_VERSION,
          rubric: EVAL_RUBRIC,
          artifacts: [...artifacts].map(([artifactId, text]) => ({
            artifactId,
            text,
          })),
        }),
        prompt.version,
        {
          ...taskRouteFor('eval_judge'),
          responseFormat: { type: 'json_object' },
          seed: settings.seed,
        },
      );
      const results = parseJudgeBatch(raw, artifacts);
      for (const row of rows) {
        row.judgeResult = results.get(row.id)!;
        row.status = 'completed';
      }
    } catch (error) {
      const reason =
        raw === null
          ? 'EVAL_PROVIDER_FAILURE'
          : error instanceof Error
            ? error.message
            : 'JUDGE_SCHEMA';
      for (const row of rows) {
        row.status = 'failed';
        row.judgeResult = null;
        row.warnings.push(reason);
      }
    }
    for (const row of rows) {
      row.judgeModel = settings.judgeModel;
      row.judgeSeed = settings.seed;
      row.judgePromptVersion = prompt.version;
      row.judgePromptHash = hashText(prompt.systemTemplate);
      row.judgeRaw = raw;
      if (row.generatorModel === settings.judgeModel) {
        row.warnings.push(
          'JUDGE_NOT_INDEPENDENT: generator and judge model IDs coincide',
        );
        this.logger.warn(
          JSON.stringify({
            event: 'eval_judge_not_independent',
            runId: row.id,
            model: settings.judgeModel,
          }),
        );
      }
      await this.runs.save(row);
    }
    return rows;
  }
}
