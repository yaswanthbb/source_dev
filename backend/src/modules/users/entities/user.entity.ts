import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * Cross-device UI state. Kept as one JSONB blob rather than a column each: the
 * presentation layer is built so a new theme needs no schema change, and this
 * set will grow with it. Shape mirrors `UserPreferencesDto`, which is what
 * validates anything arriving from a client.
 */
export interface UserPreferences {
  /** Which interface the user works in. Absent means gui — new accounts
   *  default to the graphical mode. */
  uiMode?: 'gui' | 'cli';
  /** Visual theme id. One theme ships today; the field exists so adding
   *  another is a write here rather than a migration. */
  themeId?: string;
  /** Where they were in the virtual filesystem, as a path string. Stored in
   *  the same form `pwd` prints, so it stays readable and survives a change to
   *  the internal location shape. */
  lastLocation?: string;
  hasSeenCliNudge?: boolean;
  hasSeenCliWelcome?: boolean;
}

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
    default: UserRole.DEVELOPER,
  })
  role: UserRole;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'text', name: 'profile_picture', nullable: true })
  profilePicture: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  preferences: UserPreferences;
}
