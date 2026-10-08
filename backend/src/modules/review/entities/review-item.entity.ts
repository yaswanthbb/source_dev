import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { McqQuestion } from '../../quiz/entities/mcq-question.entity';
import type { MemoryState, ReviewGrade } from '../review-scheduler';

@Entity('review_items')
@Unique(['userId', 'mcqQuestionId'])
export class ReviewItem extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'mcq_question_id', type: 'uuid', nullable: true })
  mcqQuestionId: string | null;

  @ManyToOne(() => McqQuestion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mcq_question_id' })
  mcqQuestion: McqQuestion | null;

  @Column({ type: 'double precision', nullable: true })
  stability: number | null;

  @Column({ type: 'double precision', nullable: true })
  difficulty: number | null;

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  @Column({ type: 'int', nullable: true })
  lapses: number | null;

  @Column({ type: 'text', nullable: true })
  state: MemoryState | null;

  @Column({ type: 'text', name: 'last_grade', nullable: true })
  lastGrade: ReviewGrade | null;

  @Column({ type: 'int', name: 'learning_steps', nullable: true })
  learningSteps: number | null;

  @Column({ type: 'timestamptz', name: 'fsrs_reviewed_at', nullable: true })
  fsrsReviewedAt: Date | null;

  @Column({ type: 'uuid', name: 'source_question_id', nullable: true })
  sourceQuestionId: string | null;

  @Column({ type: 'uuid', name: 'source_concept_id', nullable: true })
  sourceConceptId: string | null;

  @Column({ type: 'text', name: 'source_concept_title', nullable: true })
  sourceConceptTitle: string | null;

  @Column({ type: 'int', name: 'interval_days', default: 1 })
  intervalDays: number;

  @Column({ type: 'int', name: 'correct_streak', default: 0 })
  correctStreak: number;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: string;

  @Column({
    type: 'timestamptz',
    name: 'last_reviewed_at',
    nullable: true,
  })
  lastReviewedAt: Date | null;
}
