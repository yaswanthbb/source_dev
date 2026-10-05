import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RoadmapReviewStatus } from '../../../common/enums/roadmap-review-status.enum';
import { RoadmapUnpublishStatus } from '../../../common/enums/roadmap-unpublish-status.enum';
import type { OriginLabel } from '../utils/origin-label.util';
import { Module } from './module.entity';

@Entity('roadmaps')
export class Roadmap extends BaseEntity {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User | null;

  @Column({
    type: 'enum',
    enum: RoadmapReviewStatus,
    default: RoadmapReviewStatus.DRAFT,
    name: 'review_status',
  })
  reviewStatus: RoadmapReviewStatus;

  @Column({
    type: 'text',
    nullable: true,
    name: 'rejection_reason',
  })
  rejectionReason: string | null;

  @Column({ name: 'reviewed_by_user_id', nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedBy: User | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'reviewed_at',
  })
  reviewedAt: Date | null;

  @Column({
    type: 'enum',
    enum: RoadmapUnpublishStatus,
    default: RoadmapUnpublishStatus.NONE,
    name: 'unpublish_status',
  })
  unpublishStatus: RoadmapUnpublishStatus;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'unpublish_effective_at',
  })
  unpublishEffectiveAt: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'delete_effective_at',
  })
  deleteEffectiveAt: Date | null;

  @OneToMany(() => Module, (module) => module.roadmap)
  modules: Module[];

  moduleCount?: number;

  /** §4 transient rollup label (ai/handwritten/partial/null), set at read time. */
  originLabel?: OriginLabel | null;
}
