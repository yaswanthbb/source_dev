import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_otps')
@Index(['userId', 'used', 'expiresAt'])
export class PasswordResetOtp extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'otp_hash' })
  otpHash: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0, name: 'attempts_used' })
  attemptsUsed: number;

  @Column({ type: 'boolean', default: false })
  used: boolean;
}
