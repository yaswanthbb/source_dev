import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ConceptDifficulty } from '../../../common/enums/concept-difficulty.enum';
import { ConceptReviewStatus } from '../../../common/enums/concept-review-status.enum';

@Entity('concepts')
export class Concept extends BaseEntity {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ConceptDifficulty,
    default: ConceptDifficulty.MEDIUM,
  })
  difficulty: ConceptDifficulty;

  @Column({
    type: 'enum',
    enum: ConceptReviewStatus,
    default: ConceptReviewStatus.PENDING,
    name: 'review_status',
  })
  reviewStatus: ConceptReviewStatus;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_ai_generated',
  })
  isAiGenerated: boolean;

  @Column({
    type: 'text',
    nullable: true,
    name: 'rejection_reason',
  })
  rejectionReason: string | null;

  /**
   * Pending draft body for the draft/live split (§3.8): significant edits to
   * an approved concept in a published roadmap land here. Readers keep seeing
   * `content` until admin approves, which promotes the draft into `content`.
   */
  @Column({
    type: 'text',
    nullable: true,
    name: 'draft_content',
  })
  draftContent: string | null;

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

  @Column({ name: 'author_id', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  questionCount?: number;
}
