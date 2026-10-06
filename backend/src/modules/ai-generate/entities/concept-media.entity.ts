import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Concept } from '../../content/entities/concept.entity';

/**
 * §8 media: diagrams (original-generated Mermaid, authored by the pipeline)
 * and videos (embedded by reference only — IDs and metadata, never
 * downloaded or copied content). Rows are written at publish with the
 * concept attached; during the pipeline media lives in memory and content
 * references resolve against that inventory.
 */
@Entity('concept_media')
export class ConceptMedia extends BaseEntity {
  @Column({ name: 'concept_id' })
  conceptId: string;

  @ManyToOne(() => Concept, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept;

  @Column({ type: 'varchar', length: 16 })
  kind: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 128 })
  license: string;
}
