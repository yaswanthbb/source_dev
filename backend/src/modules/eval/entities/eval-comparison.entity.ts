import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
@Entity('eval_comparisons')
export class EvalComparison extends BaseEntity {
  @Column({ type: 'text' }) task: string;
  @Column({ name: 'baseline_prompt_id', type: 'uuid' })
  baselinePromptId: string;
  @Column({ name: 'candidate_prompt_id', type: 'uuid' })
  candidatePromptId: string;
  @Column({ name: 'golden_set_hash', type: 'text' }) goldenSetHash: string;
  @Column({ name: 'baseline_run_ids', type: 'jsonb' }) baselineRunIds: string[];
  @Column({ name: 'candidate_run_ids', type: 'jsonb' })
  candidateRunIds: string[];
  @Column({ type: 'jsonb' }) result: Record<string, unknown>;
}
