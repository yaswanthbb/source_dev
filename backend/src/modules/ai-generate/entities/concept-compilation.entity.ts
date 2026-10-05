import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { Concept } from '../../content/entities/concept.entity';

/**
 * §8 compiler stage traces: one row per (job, title) compilation, updated
 * in place on re-runs (retry re-runs the whole concept; writes downstream
 * are upserts, so this is safe). `conceptId` is null until publish creates
 * the concept (batch) or when the single-shot path runs scopeless.
 * The future eval harness reads `stages` + `warnings`.
 */
@Entity('concept_compilations')
@Unique(['jobId', 'title'])
export class ConceptCompilation extends BaseEntity {
  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  jobId: string | null;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ name: 'roadmap_id', type: 'uuid', nullable: true })
  roadmapId: string | null;

  @ManyToOne(() => Roadmap, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap | null;

  @Column({ name: 'concept_id', type: 'uuid', nullable: true })
  conceptId: string | null;

  @ManyToOne(() => Concept, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept | null;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  stages: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  warnings: string[];
}
