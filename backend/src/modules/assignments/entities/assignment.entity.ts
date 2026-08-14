import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Concept } from '../../content/entities/concept.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignments')
export class Assignment extends BaseEntity {
  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  rubric: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User | null;
}
