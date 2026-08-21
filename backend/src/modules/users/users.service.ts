import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { InstructorProfile } from './entities/instructor-profile.entity';
import {
  AccountDeletionRequest,
  DeletionRequestStatus,
} from './entities/account-deletion-request.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateInstructorBioDto } from './dto/update-instructor-bio.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ApplyInstructorDto } from './dto/apply-instructor.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepository: Repository<InstructorProfile>,
    @InjectRepository(AccountDeletionRequest)
    private readonly deletionRequestRepository: Repository<AccountDeletionRequest>,
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

    if (dto.profilePicture !== undefined) {
      if (dto.profilePicture === null || dto.profilePicture === '') {
        user.profilePicture = null;
      } else if (typeof dto.profilePicture === 'string') {
        const match = dto.profilePicture.match(
          /^data:image\/(jpeg|png|webp|jpg);base64,(.+)$/,
        );
        if (!match) {
          throw new BadRequestException(
            'Invalid profile picture format. Must be a JPEG, PNG, or WebP base64 data URI.',
          );
        }
        const base64Data = match[2];
        const approxBytes = Buffer.byteLength(base64Data, 'base64');
        if (approxBytes > 500 * 1024) {
          throw new BadRequestException(
            'Profile picture exceeds 500KB size limit. Please upload a smaller image.',
          );
        }
        user.profilePicture = dto.profilePicture;
      }
    }

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async updateInstructorBio(
    userId: string,
    dto: UpdateInstructorBioDto,
  ): Promise<{ message: string; bio: string | null }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['instructorProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only instructors and admins can update instructor bio',
      );
    }

    if (!user.instructorProfile) {
      const newProfile = this.instructorProfileRepository.create({
        userId: user.id,
        bio: dto.bio || null,
        status: InstructorStatus.APPROVED,
      });
      const saved = await this.instructorProfileRepository.save(newProfile);
      return { message: 'Instructor bio updated successfully', bio: saved.bio };
    }

    user.instructorProfile.bio =
      dto.bio !== undefined ? dto.bio || null : user.instructorProfile.bio;
    await this.instructorProfileRepository.save(user.instructorProfile);

    return {
      message: 'Instructor bio updated successfully',
      bio: user.instructorProfile.bio,
    };
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

  async getAllInstructorsAndApplicants(): Promise<
    Omit<User, 'passwordHash'>[]
  > {
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

  // 6. Direct User Deletion (Admin only)
  // Cascade deletes student personal data; preserves authored roadmaps/concepts/QA answers with author SET NULL
  async deleteUser(targetUserId: string, adminUserId?: string) {
    if (adminUserId && targetUserId === adminUserId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete an administrator account');
    }

    await this.userRepository.delete(targetUserId);

    return {
      success: true,
      message: `User ${user.name} (${user.email}) deleted successfully`,
    };
  }

  // 7. User submits an account deletion request
  async requestAccountDeletion(userId: string, dto: RequestDeletionDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Administrators cannot request account deletion',
      );
    }

    const existingPending = await this.deletionRequestRepository.findOne({
      where: { userId, status: DeletionRequestStatus.PENDING },
    });

    if (existingPending) {
      if (dto.reason !== undefined) {
        existingPending.reason = dto.reason;
        return this.deletionRequestRepository.save(existingPending);
      }
      return existingPending;
    }

    const request = this.deletionRequestRepository.create({
      userId,
      reason: dto.reason || null,
      status: DeletionRequestStatus.PENDING,
    });

    return this.deletionRequestRepository.save(request);
  }

  // 8. Get current user's deletion request status
  async getMyDeletionRequest(userId: string) {
    return this.deletionRequestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 9. Admin lists all account deletion requests
  async getAllDeletionRequests() {
    const requests = await this.deletionRequestRepository.find({
      relations: ['user', 'reviewedByAdmin'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((req) => ({
      ...req,
      user: req.user ? this.sanitizeUser(req.user) : null,
      reviewedByAdmin: req.reviewedByAdmin
        ? this.sanitizeUser(req.reviewedByAdmin)
        : null,
    }));
  }

  // 10. Admin approves account deletion request
  async approveDeletionRequest(requestId: string, adminUserId: string) {
    const request = await this.deletionRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    const targetUserId = request.userId;
    request.status = DeletionRequestStatus.APPROVED;
    request.reviewedByAdminId = adminUserId;
    request.reviewedAt = new Date();
    await this.deletionRequestRepository.save(request);

    // Perform the user deletion
    await this.deleteUser(targetUserId, adminUserId);

    return {
      success: true,
      message: 'Account deletion approved and user data deleted',
    };
  }

  // 11. Admin rejects account deletion request
  async rejectDeletionRequest(requestId: string, adminUserId: string) {
    const request = await this.deletionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    request.status = DeletionRequestStatus.REJECTED;
    request.reviewedByAdminId = adminUserId;
    request.reviewedAt = new Date();

    return this.deletionRequestRepository.save(request);
  }
}
