import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AiPromptVersion } from './entities/ai-prompt-version.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { AiPromptStatus } from '../../common/enums/ai-prompt-status.enum';
import {
  ROADMAP_MODULES_SYSTEM_PROMPT,
  MODULE_CONCEPTS_SYSTEM_PROMPT,
  CONCEPT_CONTENT_SYSTEM_PROMPT,
  CONCEPT_MCQ_SYSTEM_PROMPT,
  QA_ANSWER_SYSTEM_PROMPT,
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
  ) {}

  /**
   * v1 seed integrity: the migration snapshots were byte-exact copies of the
   * static constants. If the constants drift afterwards (or a migration ran
   * stale), v1 no longer means what it claims. Warning only — a prompt text
   * change must never take down the API.
   */
  async onModuleInit(): Promise<void> {
    const live: Array<[AiGenerationType, string]> = [
      [AiGenerationType.ROADMAP_MODULES, ROADMAP_MODULES_SYSTEM_PROMPT],
      [AiGenerationType.MODULE_CONCEPTS, MODULE_CONCEPTS_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_CONTENT, CONCEPT_CONTENT_SYSTEM_PROMPT],
      [AiGenerationType.CONCEPT_MCQS, CONCEPT_MCQ_SYSTEM_PROMPT],
      [AiGenerationType.QA_ANSWER, QA_ANSWER_SYSTEM_PROMPT],
    ];
    let checked = 0;
    try {
      for (const [task, text] of live) {
        const row = await this.promptRepository.findOne({
          where: { task, version: '1.0.0' },
        });
        if (!row) continue;
        checked++;
        const liveHash = createHash('sha256').update(text, 'utf8').digest('hex');
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
        this.logger.log(`Prompt seed integrity checked against ${checked} v1 row(s).`);
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
    const row = await this.getProduction(task);
    if (!row) {
      return { version: 'legacy-static', systemTemplate: fallback, fromRegistry: false };
    }
    return { version: row.version, systemTemplate: row.systemTemplate, fromRegistry: true };
  }

  renderSystem(template: string, vars: Record<string, string> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
    );
  }
}
