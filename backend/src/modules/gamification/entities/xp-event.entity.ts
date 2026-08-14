import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { XpSource } from '../../../common/enums/xp-source.enum';
import { User } from '../../users/entities/user.entity';

@Entity('xp_events')
export class XpEvent extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: XpSource,
    name: 'source_type',
  })
  sourceType: XpSource;

  @Column({ type: 'uuid', name: 'source_id' })
  sourceId: string;

  @Column({ type: 'int', name: 'xp_amount' })
  xpAmount: number;
}
