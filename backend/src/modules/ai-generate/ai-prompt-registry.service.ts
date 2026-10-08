import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvalPromptRelease } from '../eval/entities/eval-prompt-release.entity';
import { hashText } from '../eval/eval-hash';
import { goldenSetHash, loadEvalGoldens } from '../eval/eval-goldens';
import { EVAL_JUDGE_SYSTEM_PROMPT } from '../eval/eval-rubric';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AiPromptVersion } from './entities/ai-prompt-version.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import {
  ASSESSMENT_DRAFT_PROMPT,
  ASSESSMENT_VERIFY_PROMPT,
  MISCONCEPTIONS_PROMPT,
} from './constants/assessment-prompts';
import { AiPromptStatus } from '../../common/enums/ai-prompt-status.enum';
import {
  ROADMAP_MODULES_SYSTEM_PROMPT,
  MODULE_CONCEPTS_SYSTEM_PROMPT,
  CONCEPT_CONTENT_SYSTEM_PROMPT,
  CONCEPT_MCQ_SYSTEM_PROMPT,
  QA_ANSWER_SYSTEM_PROMPT,
  CONCEPT_OUTLINE_SYSTEM_PROMPT,
  CONCEPT_DRAFT_SYSTEM_PROMPT,
  CONCEPT_FACTCHECK_SYSTEM_PROMPT,
  CONCEPT_CRITIQUE_SYSTEM_PROMPT,
  CONCEPT_REVISE_SYSTEM_PROMPT,
} from './constants/prompts';

export interface ResolvedPrompt {
  version: string;
  systemTemplate: string;
  fromRegistry: boolean;
}

/**
 * Phase 2 prompt ops (§8). Reads the production row per task; falls back to
 * the legacy static constant when the registry has nothing released, so
 * enabling the table can never change generation behavior by itself.
 * `{{var}}` interpolation is reserved for future templated versions —
 * v1 rows carry no variables.
 */
@Injectable()
export class AiPromptRegistry implements OnModuleInit {
  private readonly logger = new Logger(AiPromptRegistry.name);

  constructor(
    @InjectRepository(AiPromptVersion)
    private readonly promptRepository: Repository<AiPromptVersion>,
    @Optional() private readonly config?: ConfigService,
    @Optional()
    @InjectRepository(EvalPromptRelease)
    private readonly releases?: Repository<EvalPromptRelease>,
  ) {}

  /**
   * v1 seed integrity: the migration snapshots were byte-exact copies of the
   * static constants. If the constants drift afterwards (or a migration ran
   * stale), v1 no longer means what it claims. Warning only — a prompt text
   * change must never take down the API.
   */
  async onModuleInit(): Promise<void> {
    const live: Array<[AiGenerationType, string]> = [
      [AiGenerationType.EVAL_JUDGE, EVAL_JUDGE_SYSTEM_PROMPT],
      [AiGenerationType.ROADMAP_MODULES, ROADMAP_MODULES_SYSTEM_PROMPT],
      [AiGenerationType.MODULE_CONCEPTS, MODULE_CONCEPTS_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_CONTENT, CONCEPT_CONTENT_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_MCQS, CONCEPT_MCQ_SYSTEM_PROMPT],
      [AiGenerationType.QA_ANSWER, QA_ANSWER_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_OUTLINE, CONCEPT_OUTLINE_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_DRAFT, CONCEPT_DRAFT_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_FACTCHECK, CONCEPT_FACTCHECK_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_CRITIQUE, CONCEPT_CRITIQUE_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_REVISE, CONCEPT_REVISE_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_MISCONCEPTIONS, MISCONCEPTIONS_PROMPT],
      [AiGenerationType.CONCEPT_MCQ_DRAFT, ASSESSMENT_DRAFT_PROMPT],
      [AiGenerationType.CONCEPT_MCQ_VERIFY, ASSESSMENT_VERIFY_PROMPT],
    ];
    let checked = 0;
    try {
      for (const [task, text] of live) {
        const row = await this.promptRepository.findOne({
          where: { task, version: '1.0.0' },
        });
        if (!row) continue;
        checked++;
        const liveHash = createHash('sha256')
          .update(text, 'utf8')
          .digest('hex');
        const storedHash = createHash('sha256')
          .update(row.systemTemplate, 'utf8')
          .digest('hex');
        if (liveHash !== storedHash) {
          this.logger.warn(
            `PROMPT SEED DIVERGENCE: stored v1 seed for task "${task}" does not match the live constants/prompts.ts template (live sha256 ${liveHash.slice(0, 12)} vs stored ${storedHash.slice(0, 12)}). v1 no longer reproduces current behavior — cut a new prompt version instead of editing history.`,
          );
        }
      }
      if (checked > 0) {
        this.logger.log(
          `Prompt seed integrity checked against ${checked} v1 row(s).`,
        );
      }
    } catch (err: unknown) {
      // Table may not exist yet (migrations pending) — never fail boot.
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Prompt seed integrity check skipped: ${msg}`);
    }
  }

  async getProduction(task: AiGenerationType): Promise<AiPromptVersion | null> {
    return this.promptRepository.findOne({
      where: { task, status: AiPromptStatus.PRODUCTION },
      order: { createdAt: 'DESC' },
    });
  }

  async resolveSystem(
    task: AiGenerationType,
    fallback: string,
  ): Promise<ResolvedPrompt> {
    let row = await this.getProduction(task);
    // Config opt-in only; no learner bucketing/experiments, and rollback never mutates the baseline.
    if (row && this.config?.get('EVAL_PROMPT_SELECTION_ENABLED') === 'true') {
      try {
        const selection: unknown = JSON.parse(
          this.config.get<string>('EVAL_PROMPT_VERSIONS') ?? '{}',
        );
        if (
          !selection ||
          typeof selection !== 'object' ||
          Array.isArray(selection) ||
          Object.entries(selection).some(
            ([key, value]) =>
              !Object.values(AiGenerationType).includes(
                key as AiGenerationType,
              ) || typeof value !== 'string',
          )
        )
          throw new Error('Invalid per-task version config');
        const selected = (selection as Record<string, string>)[task];
        if (selected && selected !== row.version) {
          const candidate = await this.promptRepository.findOne({
            where: { task, version: selected },
          });
          const approval =
            candidate &&
            (await this.releases?.findOne({
              where: {
                task,
                baselinePromptId: row.id,
                candidatePromptId: candidate.id,
                status: 'approved',
              },
            }));
          if (
            !candidate ||
            candidate.status === AiPromptStatus.ARCHIVED ||
            !approval ||
            approval.baselineHash !== hashText(row.systemTemplate) ||
            approval.candidateHash !== hashText(candidate.systemTemplate) ||
            approval.goldenSetHash !==
              goldenSetHash(
                loadEvalGoldens().filter(
                  (g) => (g.registryTask ?? g.task) === task,
                ),
              )
          )
            throw new Error(
              'Candidate lacks a current fingerprint-matching eval approval',
            );
          row = candidate;
        }
      } catch {
        this.logger.warn(
          `Eval prompt selection refused for ${task}; serving the unchanged production baseline.`,
        );
      }
    }
    if (!row) {
      return {
        version: 'legacy-static',
        systemTemplate: fallback,
        fromRegistry: false,
      };
    }
    return {
      version: row.version,
      systemTemplate: row.systemTemplate,
      fromRegistry: true,
    };
  }

  renderSystem(template: string, vars: Record<string, string> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
    );
  }
}
