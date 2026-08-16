import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Module } from './module.entity';
import { Concept } from './concept.entity';
import { ModuleConceptPrerequisite } from './module-concept-prerequisite.entity';

@Entity('module_concepts')
@Unique(['moduleId', 'conceptId'])
@Unique(['moduleId', 'orderIndex'])
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

  @OneToMany(
    () => ModuleConceptPrerequisite,
    (mcp) => mcp.moduleConcept,
  )
  prerequisites: ModuleConceptPrerequisite[];

  @OneToMany(
    () => ModuleConceptPrerequisite,
    (mcp) => mcp.prerequisiteModuleConcept,
  )
  prerequisiteFor: ModuleConceptPrerequisite[];
}
