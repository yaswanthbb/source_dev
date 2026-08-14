import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Roadmap } from './roadmap.entity';
import { ModuleConcept } from './module-concept.entity';

@Entity('modules')
export class Module extends BaseEntity {
  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ManyToOne(() => Roadmap, (roadmap) => roadmap.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column()
  title: string;

  @Column({ type: 'int', name: 'order_index' })
  orderIndex: number;

  @OneToMany(() => ModuleConcept, (mc) => mc.module)
  moduleConcepts: ModuleConcept[];
}
