import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InstructorProfile } from './entities/instructor-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ApplyInstructorDto } from './dto/apply-instructor.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
  ) {}

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    if (!user) return user;
    const sanitized = { ...user };
    delete (sanitized as Partial<User>).passwordHash;
    return sanitized;
  }

  async findOneById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['instructorProfile'],
    });
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['instructorProfile'],
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    const user = this.userRepository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: UserRole.STUDENT,
    });
    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async getSelfProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateSelfProfile(
    userId: string,
    dto: UpdateOwnProfileDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.timezone !== undefined) {
      user.timezone = dto.timezone;
    }

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async findUsers(
    query: GetUsersQueryDto,
  ): Promise<Omit<User, 'passwordHash'>[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.instructorProfile', 'instructorProfile');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.instructorStatus) {
      qb.andWhere('instructorProfile.status = :instructorStatus', {
        instructorStatus: query.instructorStatus,
      });
    }

    if (query.search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const users = await qb.getMany();
    return users.map((user) => this.sanitizeUser(user));
  }

  async getAllInstructorsAndApplicants(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.instructorProfile', 'instructorProfile')
      .where('user.role = :role OR instructorProfile.id IS NOT NULL', {
        role: UserRole.INSTRUCTOR,
      })
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return users.map((user) => this.sanitizeUser(user));
  }

  // 1. Student initiates request to become an instructor
  async applyForInstructor(userId: string, dto: ApplyInstructorDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) {
      throw new BadRequestException('User is already an instructor or admin');
    }

    let profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      if (profile.status === InstructorStatus.PENDING) {
        throw new BadRequestException(
          'You already have a pending instructor application under review',
        );
      }
      if (profile.status === InstructorStatus.APPROVED) {
        throw new BadRequestException('You are already an approved instructor');
      }

      // Re-apply if previously rejected
      profile.status = InstructorStatus.PENDING;
      if (dto.bio !== undefined) {
        profile.bio = dto.bio;
      }
      profile.approvedAt = null;
      profile = await this.instructorProfileRepository.save(profile);
    } else {
      profile = this.instructorProfileRepository.create({
        userId: user.id,
        status: InstructorStatus.PENDING,
        bio: dto.bio || null,
      });
      profile = await this.instructorProfileRepository.save(profile);
    }

    return {
      user: this.sanitizeUser(user),
      instructorProfile: profile,
    };
  }

  // 2. Admin approves a pending instructor application -> role becomes INSTRUCTOR
  async approveInstructor(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });
    if (!profile || profile.status !== InstructorStatus.PENDING) {
      throw new BadRequestException(
        'No pending instructor profile found for user',
      );
    }

    profile.status = InstructorStatus.APPROVED;
    profile.approvedAt = new Date();
    const savedProfile = await this.instructorProfileRepository.save(profile);

    user.role = UserRole.INSTRUCTOR;
    const savedUser = await this.userRepository.save(user);

    return {
      user: this.sanitizeUser(savedUser),
      instructorProfile: savedProfile,
    };
  }

  // 3. Admin rejects a pending instructor application -> user remains/returns to STUDENT
  async rejectInstructor(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });
    if (!profile || profile.status !== InstructorStatus.PENDING) {
      throw new BadRequestException(
        'No pending instructor profile found for user',
      );
    }

    profile.status = InstructorStatus.REJECTED;
    const savedProfile = await this.instructorProfileRepository.save(profile);

    user.role = UserRole.STUDENT;
    const savedUser = await this.userRepository.save(user);

    return {
      user: this.sanitizeUser(savedUser),
      instructorProfile: savedProfile,
    };
  }

  // 4. Admin direct promotion (bypass application queue) -> direct INSTRUCTOR + APPROVED
  async promoteToInstructor(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot change role of an admin user');
    }

    user.role = UserRole.INSTRUCTOR;
    const updatedUser = await this.userRepository.save(user);

    let profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      profile.status = InstructorStatus.APPROVED;
      profile.approvedAt = new Date();
      profile.invitedById = adminId;
      profile = await this.instructorProfileRepository.save(profile);
    } else {
      profile = this.instructorProfileRepository.create({
        userId: updatedUser.id,
        status: InstructorStatus.APPROVED,
        approvedAt: new Date(),
        invitedById: adminId,
      });
      profile = await this.instructorProfileRepository.save(profile);
    }

    return {
      user: this.sanitizeUser(updatedUser),
      instructorProfile: profile,
    };
  }

  // 5. Admin demotes / degrades an instructor back to student
  async demoteToStudent(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot demote an admin user');
    }

    if (user.role === UserRole.STUDENT) {
      throw new BadRequestException('User is already a student');
    }

    user.role = UserRole.STUDENT;
    const updatedUser = await this.userRepository.save(user);

    const profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      profile.status = InstructorStatus.REJECTED;
      await this.instructorProfileRepository.save(profile);
    }

    return {
      user: this.sanitizeUser(updatedUser),
      instructorProfile: profile,
    };
  }
}
