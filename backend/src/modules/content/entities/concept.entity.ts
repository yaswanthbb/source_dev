import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ConceptDifficulty } from '../../../common/enums/concept-difficulty.enum';

@Entity('concepts')
export class Concept extends BaseEntity {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ConceptDifficulty,
    default: ConceptDifficulty.MEDIUM,
  })
  difficulty: ConceptDifficulty;

  @Column({ name: 'author_id', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;
}
