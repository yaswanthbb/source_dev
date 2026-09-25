import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Roadmap } from '../../content/entities/roadmap.entity';
import { Concept } from '../../content/entities/concept.entity';

@Entity('articles')
export class Article extends BaseEntity {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  /**
   * Optional "further reading" link to a roadmap. Independent of review
   * state — authors may link drafts they own; readers follow the normal
   * visibility rules when opening the target.
   */
  @Column({ name: 'roadmap_id', nullable: true })
  roadmapId: string | null;

  @ManyToOne(() => Roadmap, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap | null;

  /** Optional "further reading" link to a concept (same rules as above). */
  @Column({ name: 'concept_id', nullable: true })
  conceptId: string | null;

  @ManyToOne(() => Concept, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'concept_id' })
  concept: Concept | null;
}
