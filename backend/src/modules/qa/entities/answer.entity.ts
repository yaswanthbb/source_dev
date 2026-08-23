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

  @Column({ name: 'instructor_id', nullable: true })
  instructorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor: User | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_ai_answer', type: 'boolean', default: false })
  isAiAnswer: boolean;
}
