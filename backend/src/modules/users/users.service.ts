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

  async promoteToInstructor(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) {
      throw new BadRequestException('User is already an instructor or admin');
    }

    const existingProfile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });
    if (existingProfile) {
      throw new BadRequestException(
        'Instructor profile already exists for user',
      );
    }

    user.role = UserRole.INSTRUCTOR;
    const updatedUser = await this.userRepository.save(user);

    const profile = this.instructorProfileRepository.create({
      userId: updatedUser.id,
      status: InstructorStatus.PENDING,
      invitedById: adminId,
    });
    const savedProfile = await this.instructorProfileRepository.save(profile);

    return {
      user: this.sanitizeUser(updatedUser),
      instructorProfile: savedProfile,
    };
  }

  async approveInstructor(userId: string) {
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
    return this.instructorProfileRepository.save(profile);
  }

  async rejectInstructor(userId: string) {
    const profile = await this.instructorProfileRepository.findOne({
      where: { userId },
    });
    if (!profile || profile.status !== InstructorStatus.PENDING) {
      throw new BadRequestException(
        'No pending instructor profile found for user',
      );
    }

    profile.status = InstructorStatus.REJECTED;
    return this.instructorProfileRepository.save(profile);
  }
}
