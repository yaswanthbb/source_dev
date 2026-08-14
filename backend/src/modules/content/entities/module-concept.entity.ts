import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Module } from './module.entity';
import { Concept } from './concept.entity';

@Entity('module_concepts')
@Unique(['moduleId', 'conceptId'])
export class ModuleConcept extends BaseEntity {
  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ type: 'int', name: 'order_index' })
  orderIndex: number;
}
