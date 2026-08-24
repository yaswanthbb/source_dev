import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import {
  AiGenerationJobType,
  AiGenerationJobStatus,
} from '../../../common/enums/ai-generation-job.enum';

export interface AiGenerationJobFailedItem {
  title: string;
  reason: string;
}

export interface AiGenerationJobResultSummary {
  createdCount: number;
  failedCount: number;
  skippedCount: number;
  failedItems: AiGenerationJobFailedItem[];
  targetLabel: string;
  itemNoun: string;
}

@Entity('ai_generation_jobs')
@Index(['targetId', 'status'])
@Index(['requestedByUserId', 'status'])
export class AiGenerationJob extends BaseEntity {
  @Column({ name: 'requested_by_user_id' })
  requestedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy: User;

  @Column({
    type: 'enum',
    enum: AiGenerationJobType,
    name: 'job_type',
  })
  jobType: AiGenerationJobType;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({
    type: 'enum',
    enum: AiGenerationJobStatus,
    default: AiGenerationJobStatus.PENDING,
  })
  status: AiGenerationJobStatus;

  @Column({ name: 'progress_current', type: 'int', default: 0 })
  progressCurrent: number;

  @Column({ name: 'progress_total', type: 'int', default: 0 })
  progressTotal: number;

  @Column({ name: 'result_summary', type: 'jsonb', nullable: true })
  resultSummary: AiGenerationJobResultSummary | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount: number;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ name: 'retry_of_job_id', type: 'uuid', nullable: true })
  retryOfJobId: string | null;
}
