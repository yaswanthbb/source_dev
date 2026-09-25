import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AiProvider } from '../../../common/enums/ai-provider.enum';

@Entity('ai_provider_keys')
@Index(['userId'])
export class AiProviderKey extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: AiProvider })
  provider: AiProvider;

  /**
   * AES-256-GCM envelope, never decrypted client-side:
   * `v1:<ivHex>:<cipherHex>:<authTagHex>`. Plaintext exists only in memory
   * at call time. List/read endpoints expose metadata only.
   */
  @Column({ name: 'key_ciphertext', type: 'text' })
  keyCiphertext: string;

  /** Last 4 chars for UI identification (safe to return). */
  @Column({ name: 'key_hint', type: 'varchar', length: 8 })
  keyHint: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'daily_limit', type: 'int', default: 20 })
  dailyLimit: number;

  /**
   * Model picked from the provider's live list at save time. Used when a
   * generation omits `model` (request model wins first).
   */
  @Column({ name: 'default_model', type: 'varchar', length: 120, nullable: true })
  defaultModel: string | null;
}
