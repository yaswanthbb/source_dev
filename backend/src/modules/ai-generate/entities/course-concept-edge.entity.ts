import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { Concept } from '../../content/entities/concept.entity';
import { CourseEdgeType } from '../../../common/enums/course-edge-type.enum';

/**
 * Phase 1 context: directed edges between concepts of one roadmap.
 * Prerequisite/builds-on edges must stay acyclic (enforced in service).
 */
@Entity('course_concept_edges')
@Unique(['fromConceptId', 'toConceptId', 'type'])
export class CourseConceptEdge extends BaseEntity {
  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ManyToOne(() => Roadmap, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column({ name: 'from_concept_id' })
  fromConceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_concept_id' })
  fromConcept: Concept;

  @Column({ name: 'to_concept_id' })
  toConceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_concept_id' })
  toConcept: Concept;

  @Column({ type: 'enum', enum: CourseEdgeType })
  type: CourseEdgeType;
}
