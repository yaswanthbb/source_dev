import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { InstructorProfile } from './instructor-profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', name: 'auth_provider', nullable: true })
  authProvider: string | null;

  @Column({ type: 'varchar', name: 'auth_provider_id', nullable: true })
  authProviderId: string | null;

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
