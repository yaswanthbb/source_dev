import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AiGenerationType } from '../../../common/enums/ai-generation-type.enum';

@Entity('ai_generation_logs')
export class AiGenerationLog extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AiGenerationType,
    name: 'generation_type',
  })
  generationType: AiGenerationType;

  @Column({ type: 'timestamptz', name: 'generated_at', default: () => 'NOW()' })
  generatedAt: Date;

  @Column({ name: 'provider_key_id', type: 'uuid', nullable: true })
  providerKeyId: string | null;
}
