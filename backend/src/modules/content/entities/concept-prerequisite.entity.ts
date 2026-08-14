import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Concept } from './concept.entity';

@Entity('concept_prerequisites')
export class ConceptPrerequisite {
  @PrimaryColumn('uuid', { name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @PrimaryColumn('uuid', { name: 'prerequisite_concept_id' })
  prerequisiteConceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prerequisite_concept_id' })
  prerequisiteConcept: Concept;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
