import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EvalRun } from './eval-run.entity';
import type { RubricDimension } from '../eval-rubric';
@Entity('eval_expert_reviews')
export class EvalExpertReview extends BaseEntity {
  @Column({ name: 'eval_run_id', type: 'uuid' }) evalRunId: string;
  @ManyToOne(() => EvalRun, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'eval_run_id' })
  evalRun: EvalRun;
  @Column({ name: 'expert_id', type: 'uuid', nullable: true }) expertId:
    string | null;
  @Column({ type: 'text' }) decision: 'approve' | 'edit' | 'reject';
  @Column({ name: 'reason_codes', type: 'jsonb' }) reasonCodes: string[];
  @Column({ type: 'text' }) reason: string;
  @Column({ name: 'rubric_version', type: 'varchar', length: 32 })
  rubricVersion: string;
  @Column({ type: 'jsonb' }) scores: Record<RubricDimension, number>;
  @Column({ name: 'proposed_revision', type: 'text', nullable: true })
  proposedRevision: string | null;
}
