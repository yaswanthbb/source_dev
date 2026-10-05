import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AiGenerationType } from '../../../common/enums/ai-generation-type.enum';
import { AiPromptStatus } from '../../../common/enums/ai-prompt-status.enum';

/**
 * Phase 2 (report §7 eval): immutable prompt versions. A released row is
 * never mutated — new versions supersede. v1 rows snapshot the legacy
 * static constants verbatim so registry read-through changes nothing.
 */
@Entity('ai_prompt_versions')
@Unique(['task', 'version'])
export class AiPromptVersion extends BaseEntity {
  @Column({
    type: 'enum',
    enum: AiGenerationType,
    name: 'task',
  })
  task: AiGenerationType;

  @Column({ type: 'varchar', length: 32 })
  version: string;

  @Column({ name: 'system_template', type: 'text' })
  systemTemplate: string;

  @Column({ name: 'input_schema', type: 'jsonb', nullable: true })
  inputSchema: Record<string, unknown> | null;

  @Column({ name: 'output_schema', type: 'jsonb', nullable: true })
  outputSchema: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  changelog: string | null;

  @Column({
    type: 'enum',
    enum: AiPromptStatus,
    default: AiPromptStatus.DRAFT,
  })
  status: AiPromptStatus;

  @Column({ name: 'compatible_models', type: 'jsonb', nullable: true })
  compatibleModels: string[] | null;
}
