import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AiGenerationType } from '../../../common/enums/ai-generation-type.enum';
import { AiProvider } from '../../../common/enums/ai-provider.enum';

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

  @Column({ name: 'prompt_version', type: 'varchar', length: 32, nullable: true })
  promptVersion: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  model: string | null;

  @Column({ type: 'enum', enum: AiProvider, nullable: true })
  provider: AiProvider | null;

  @Column({ name: 'tokens_in', type: 'int', nullable: true })
  tokensIn: number | null;

  @Column({ name: 'tokens_out', type: 'int', nullable: true })
  tokensOut: number | null;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs: number | null;

  /**
   * §8 compiler: pipeline-internal stages (fact-check, critique, revise)
   * record telemetry but consume no quota — readQuota counts only
   * internal=false rows, so one slot per concept holds.
   */
  @Column({ type: 'boolean', default: false })
  internal: boolean;
}
