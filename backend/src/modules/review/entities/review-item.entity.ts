import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { McqQuestion } from '../../quiz/entities/mcq-question.entity';

@Entity('review_items')
@Unique(['userId', 'mcqQuestionId'])
export class ReviewItem extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'mcq_question_id' })
  mcqQuestionId: string;

  @ManyToOne(() => McqQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mcq_question_id' })
  mcqQuestion: McqQuestion;

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
