import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import type { EvalArtifact, EvalContext, EvalCheck } from '../eval-checks';
import type { JudgeResult } from '../eval-rubric';

@Entity('eval_runs')
export class EvalRun extends BaseEntity {
  @Column({ type: 'text' }) task: string;
  @Column({ name: 'prompt_version', type: 'varchar', length: 32 })
  promptVersion: string;
  @Column({ name: 'prompt_hash', type: 'text' }) promptHash: string;
  @Column({ name: 'artifact_hash', type: 'text' }) artifactHash: string;
  @Column({ type: 'jsonb' }) artifact: EvalArtifact;
  @Column({ type: 'jsonb' }) context: EvalContext;
  @Column({ name: 'generator_model', type: 'text' }) generatorModel: string;
  @Column({ name: 'judge_model', type: 'text', nullable: true }) judgeModel:
    string | null;
  @Column({
    name: 'judge_prompt_version',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  judgePromptVersion: string | null;
  @Column({ name: 'judge_prompt_hash', type: 'text', nullable: true })
  judgePromptHash: string | null;
  @Column({ name: 'rubric_version', type: 'varchar', length: 32 })
  rubricVersion: string;
  @Column({ type: 'int', nullable: true }) seed: number | null;
  @Column({ name: 'judge_seed', type: 'int', nullable: true }) judgeSeed:
    number | null;
  @Column({ name: 'golden_id', type: 'text', nullable: true }) goldenId:
    string | null;
  @Column({ name: 'golden_set_hash', type: 'text', nullable: true })
  goldenSetHash: string | null;
  @Column({ type: 'text' }) mode:
    'shadow' | 'baseline' | 'candidate' | 'saved_artifact';
  @Column({ type: 'text' }) status: 'pending' | 'completed' | 'failed';
  @Column({ name: 'deterministic_result', type: 'jsonb' })
  deterministicResult: { passed: boolean; checks: EvalCheck[] };
  @Column({ name: 'judge_result', type: 'jsonb', nullable: true })
  judgeResult: JudgeResult | null;
  @Column({ name: 'judge_raw', type: 'text', nullable: true }) judgeRaw:
    string | null;
  @Column({ name: 'golden_diff', type: 'jsonb', nullable: true }) goldenDiff: {
    passed: boolean;
    differences: string[];
  } | null;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) warnings: string[];
  @Column({ type: 'jsonb', nullable: true }) source: Record<
    string,
    unknown
  > | null;
  @Column({ name: 'created_by_id', type: 'uuid', nullable: true }) createdById:
    string | null;
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;
}
