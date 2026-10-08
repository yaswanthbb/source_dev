import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
@Entity('eval_prompt_releases')
export class EvalPromptRelease extends BaseEntity {
  @Column({ type: 'text' }) task: string;
  @Column({ name: 'baseline_prompt_id', type: 'uuid' })
  baselinePromptId: string;
  @Column({ name: 'candidate_prompt_id', type: 'uuid' })
  candidatePromptId: string;
  @Column({ name: 'comparison_id', type: 'uuid' }) comparisonId: string;
  @Column({ name: 'baseline_hash', type: 'text' }) baselineHash: string;
  @Column({ name: 'candidate_hash', type: 'text' }) candidateHash: string;
  @Column({ name: 'golden_set_hash', type: 'text' }) goldenSetHash: string;
  @Column({ type: 'text' }) status: 'approved' | 'revoked';
  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById: string | null;
}
