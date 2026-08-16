import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ModuleConcept } from './module-concept.entity';

@Entity('module_concept_prerequisites')
export class ModuleConceptPrerequisite {
  @PrimaryColumn('uuid', { name: 'module_concept_id' })
  moduleConceptId: string;

  @ManyToOne(() => ModuleConcept, (mc) => mc.prerequisites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_concept_id' })
  moduleConcept: ModuleConcept;

  @PrimaryColumn('uuid', { name: 'prerequisite_module_concept_id' })
  prerequisiteModuleConceptId: string;

  @ManyToOne(() => ModuleConcept, (mc) => mc.prerequisiteFor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prerequisite_module_concept_id' })
  prerequisiteModuleConcept: ModuleConcept;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
