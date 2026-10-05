import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CourseSource } from './course-source.entity';

/**
 * §8 research chunks. `embedding` is a JSON-array string at the entity level;
 * the migration types the column `vector` when pgvector is available (the
 * driver reads it back as the same string format) and `text` otherwise.
 * Similarity runs through pgvector `<=>` when the extension exists, with a
 * JS cosine fallback — the pipeline never depends on the extension.
 */
@Entity('course_source_chunks')
@Unique(['sourceId', 'chunkIndex'])
export class CourseSourceChunk extends BaseEntity {
  @Column({ name: 'source_id' })
  sourceId: string;

  @ManyToOne(() => CourseSource, (source) => source.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'source_id' })
  source: CourseSource;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  embedding: string | null;

  @Column({ name: 'token_count', type: 'int' })
  tokenCount: number;
}
