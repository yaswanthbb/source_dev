import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { Concept } from '../../content/entities/concept.entity';

/**
 * Phase 1 context: canonical terminology per roadmap. Terms are matched by
 * normalized title (lowercased, punctuation-collapsed) in code; the DB
 * unique pair backs it for the common case.
 */
@Entity('course_terms')
@Unique(['roadmapId', 'term'])
export class CourseTerm extends BaseEntity {
  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ManyToOne(() => Roadmap, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column({ type: 'varchar', length: 200 })
  term: string;

  @Column({ type: 'text' })
  definition: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  aliases: string[];

  @Column({ name: 'introduced_in_concept_id', nullable: true })
  introducedInConceptId: string | null;

  @ManyToOne(() => Concept, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'introduced_in_concept_id' })
  introducedInConcept: Concept | null;
}
