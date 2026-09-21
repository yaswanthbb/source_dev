import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Concept } from '../../content/entities/concept.entity';
import { User } from '../../users/entities/user.entity';
import { Answer } from './answer.entity';

@Entity('questions')
export class Question extends BaseEntity {
  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ name: 'asker_id' })
  askerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asker_id' })
  asker: User;

  @Column({ type: 'text' })
  body: string;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];
}
