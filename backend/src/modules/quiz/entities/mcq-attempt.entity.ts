import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { McqQuestion } from './mcq-question.entity';
import { McqOption } from './mcq-option.entity';
import { User } from '../../users/entities/user.entity';

@Entity('mcq_attempts')
export class McqAttempt extends BaseEntity {
  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => McqQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: McqQuestion;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'selected_option_id' })
  selectedOptionId: string;

  @ManyToOne(() => McqOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'selected_option_id' })
  selectedOption: McqOption;

  @Column({ type: 'boolean', name: 'is_correct' })
  isCorrect: boolean;

  @Column({ type: 'int', name: 'attempt_number' })
  attemptNumber: number;
}
