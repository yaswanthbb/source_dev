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
