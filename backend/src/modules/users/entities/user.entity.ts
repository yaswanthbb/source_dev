import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { InstructorProfile } from './instructor-profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'text', name: 'profile_picture', nullable: true })
  profilePicture: string | null;

  @OneToOne(() => InstructorProfile, (profile) => profile.user)
  instructorProfile: InstructorProfile;
}
