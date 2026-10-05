import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { Concept } from '../../content/entities/concept.entity';

/**
 * Phase 1 context: one card per concept. Misconceptions, sources, and examples
 * stay JSONB columns by decision (no dedicated tables this phase); a null
 * summary means "not yet distilled".
 */
@Entity('course_concept_cards')
@Unique(['conceptId'])
export class CourseConceptCard extends BaseEntity {
  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ManyToOne(() => Roadmap, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'key_claims', type: 'jsonb', default: () => "'[]'::jsonb" })
  keyClaims: string[];

  @Column({ name: 'bloom_level', type: 'varchar', length: 32, nullable: true })
  bloomLevel: string | null;

  @Column({ name: 'difficulty_phase', type: 'varchar', length: 32, nullable: true })
  difficultyPhase: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  misconceptions: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  sources: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  examples: Array<Record<string, unknown>>;
}
