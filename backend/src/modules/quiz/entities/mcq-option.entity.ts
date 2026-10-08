import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { McqQuestion } from './mcq-question.entity';

@Entity('mcq_options')
export class McqOption extends BaseEntity {
  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => McqQuestion, (q) => q.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: McqQuestion;

  @Column({ type: 'text', name: 'option_text' })
  optionText: string;

  @Column({ type: 'text', nullable: true })
  misconception: string | null;

  @Column({ name: 'distractor_rationale', type: 'text', nullable: true })
  distractorRationale: string | null;

  @Column({ type: 'boolean', name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ type: 'int', name: 'order_index' })
  orderIndex: number;
}
