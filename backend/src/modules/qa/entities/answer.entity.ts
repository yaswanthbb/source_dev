import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Question } from './question.entity';
import { User } from '../../users/entities/user.entity';

@Entity('answers')
export class Answer extends BaseEntity {
  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'responder_id', nullable: true })
  responderId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'responder_id' })
  responder: User | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_ai_answer', type: 'boolean', default: false })
  isAiAnswer: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_by_user_id', nullable: true })
  verifiedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by_user_id' })
  verifiedBy: User | null;

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt: Date | null;
}
