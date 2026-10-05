import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { CourseSourceChunk } from './course-source-chunk.entity';

/**
 * §8 research corpus. `roadmapId` null = global source, usable for every
 * roadmap; set = scoped to one curriculum. `license` is operator-asserted at
 * ingestion and constrained to the allowlist both in code and by CHECK.
 * `contentHash` powers idempotent re-ingestion (skip when unchanged).
 */
@Entity('course_sources')
export class CourseSource extends BaseEntity {
  @Column({ name: 'roadmap_id', type: 'uuid', nullable: true })
  roadmapId: string | null;

  @ManyToOne(() => Roadmap, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap | null;

  @Column({ type: 'varchar', length: 400 })
  title: string;

  @Column({ type: 'text', unique: true })
  url: string;

  @Column({ type: 'varchar', length: 32 })
  license: string;

  @Column({ name: 'source_type', type: 'varchar', length: 32 })
  sourceType: string;

  @Column({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash: string;

  @Column({ name: 'ingested_at', type: 'timestamptz', default: () => 'NOW()' })
  ingestedAt: Date;

  @OneToMany(() => CourseSourceChunk, (chunk) => chunk.source)
  chunks: CourseSourceChunk[];
}
