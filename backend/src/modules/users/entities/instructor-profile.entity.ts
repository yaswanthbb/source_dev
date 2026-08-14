import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InstructorStatus } from '../../../common/enums/instructor-status.enum';
import { User } from './user.entity';

@Entity('instructor_profiles')
export class InstructorProfile extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.instructorProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({
    type: 'enum',
    enum: InstructorStatus,
    default: InstructorStatus.PENDING,
  })
  status: InstructorStatus;

  @Column({ name: 'invited_by_user_id', nullable: true })
  invitedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy: User | null;

  @Column({ type: 'timestamptz', name: 'approved_at', nullable: true })
  approvedAt: Date | null;
}
