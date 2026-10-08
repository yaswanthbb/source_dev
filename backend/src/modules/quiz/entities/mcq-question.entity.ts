import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Concept } from '../../content/entities/concept.entity';
import { User } from '../../users/entities/user.entity';
import { McqOption } from './mcq-option.entity';

@Entity('mcq_questions')
export class McqQuestion extends BaseEntity {
  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column({ name: 'bloom_level', type: 'text', nullable: true })
  bloomLevel: string | null;

  @Column({ name: 'intended_difficulty', type: 'text', nullable: true })
  intendedDifficulty: string | null;

  @Column({ name: 'correct_rationale', type: 'text', nullable: true })
  correctRationale: string | null;

  @Column({ name: 'lint_result', type: 'jsonb', nullable: true })
  lintResult: Record<string, unknown> | null;

  @Column({ name: 'verification_result', type: 'jsonb', nullable: true })
  verificationResult: Record<string, unknown> | null;

  @Column({ type: 'int', name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User | null;

  @OneToMany(() => McqOption, (option) => option.question)
  options: McqOption[];
}
