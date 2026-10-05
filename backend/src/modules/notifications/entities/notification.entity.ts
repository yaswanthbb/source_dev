import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from '../../../common/enums/notification-type.enum';

export interface ContentDecisionPayload {
  roadmapId?: string;
  roadmapTitle?: string;
  conceptId?: string;
  conceptTitle?: string;
  reviewStatus?: string;
  reason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface DeletionPayload {
  what: string;
  whatId: string;
  title?: string | null;
  removedBy: string;
  removedAt: string;
  reason: string;
  effectiveAt?: string | null;
}

export interface AiJobPayload {
  jobId: string;
  jobType: string;
  targetLabel?: string | null;
  status: string;
  createdCount?: number;
  failedCount?: number;
  errorMessage?: string | null;
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'type'])
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  /** Type-specific data (ids, titles, reasons, counts — see payload interfaces). */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt: Date | null;
}
