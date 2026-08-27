import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { InstructorProfile } from './entities/instructor-profile.entity';
import { AccountDeletionRequest } from './entities/account-deletion-request.entity';

import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: MockRepository;
  let profileRepo: MockRepository;
  let deletionRepo: MockRepository;

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(InstructorProfile),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AccountDeletionRequest),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    profileRepo = module.get(getRepositoryToken(InstructorProfile));
    deletionRepo = module.get(getRepositoryToken(AccountDeletionRequest));
  });

  afterEach(() => jest.clearAllMocks());

  describe('sanitizeUser (via findOneById)', () => {
    it('strips the password hash and reports hasPassword', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ passwordHash: 'secret' }));

      const result: any = await service.findOneById('user-1');

      expect(result.passwordHash).toBeUndefined();
      expect(result.hasPassword).toBe(true);
    });

    it('reports hasPassword=false for a social account', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ passwordHash: null }));

      const result: any = await service.findOneById('user-1');

      expect(result.hasPassword).toBe(false);
    });

    it('returns null when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneById('missing')).resolves.toBeNull();
    });
  });

  describe('changePassword', () => {
    const dto: any = { currentPassword: 'old', newPassword: 'new' };

    it('throws NotFound for a missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a social account that has no password', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ passwordHash: null }));

      await expect(
        service.changePassword('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an incorrect current password', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', dto),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('re-hashes and saves the new password', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await service.changePassword('user-1', dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed' }),
      );
    });
  });

  describe('updateSelfProfile — profile picture validation', () => {
    it('throws NotFound for a missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateSelfProfile('user-1', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates name and timezone', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await service.updateSelfProfile('user-1', {
        name: 'New Name',
        timezone: 'Asia/Kolkata',
      } as any);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name', timezone: 'Asia/Kolkata' }),
      );
    });

    it('clears the picture when passed null', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ profilePicture: 'old' }));

      await service.updateSelfProfile('user-1', {
        profilePicture: null,
      } as any);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ profilePicture: null }),
      );
    });

    it('rejects a non data-URI picture', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.updateSelfProfile('user-1', {
          profilePicture: 'https://example.com/me.png',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a picture over the 500KB limit', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      // ~525KB of decoded bytes (base64 length * 3/4).
      const huge = 'data:image/png;base64,' + 'A'.repeat(700_000);

      await expect(
        service.updateSelfProfile('user-1', { profilePicture: huge } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a small valid data-URI picture', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      const small = 'data:image/png;base64,AAAAAAAA';

      await service.updateSelfProfile('user-1', {
        profilePicture: small,
      } as any);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ profilePicture: small }),
      );
    });
  });

  describe('applyForInstructor — state machine', () => {
    const dto: any = { bio: 'teach me' };

    it('throws NotFound for a missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.applyForInstructor('user-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a user who is already an instructor', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({ role: UserRole.INSTRUCTOR }),
      );

      await expect(
        service.applyForInstructor('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a second application while one is pending', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.PENDING,
      });

      await expect(
        service.applyForInstructor('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an application from an already-approved instructor profile', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.APPROVED,
      });

      await expect(
        service.applyForInstructor('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('re-opens a previously rejected profile back to PENDING', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.REJECTED,
        approvedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.applyForInstructor('user-1', dto);

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InstructorStatus.PENDING,
          approvedAt: null,
        }),
      );
    });

    it('creates a fresh PENDING profile when none exists', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue(null);

      await service.applyForInstructor('user-1', dto);

      expect(profileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: InstructorStatus.PENDING }),
      );
      expect(profileRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('approveInstructor', () => {
    it('requires a pending profile', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.APPROVED,
      });

      await expect(service.approveInstructor('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('promotes the user and approves the profile', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.PENDING,
      });

      const result: any = await service.approveInstructor('user-1');

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InstructorStatus.APPROVED }),
      );
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.INSTRUCTOR }),
      );
      expect(result.user.role).toBe(UserRole.INSTRUCTOR);
    });
  });

  describe('rejectInstructor', () => {
    it('rejects the profile and keeps the user a student', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.PENDING,
      });

      await service.rejectInstructor('user-1');

      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InstructorStatus.REJECTED }),
      );
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.STUDENT }),
      );
    });
  });

  describe('promoteToInstructor', () => {
    it('refuses to change an admin', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));

      await expect(
        service.promoteToInstructor('user-1', 'admin-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('promotes directly and stamps the inviting admin on an existing profile', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.REJECTED,
      });

      await service.promoteToInstructor('user-1', 'admin-1');

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.INSTRUCTOR }),
      );
      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InstructorStatus.APPROVED,
          invitedById: 'admin-1',
        }),
      );
    });

    it('creates an approved profile when the user has none', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      profileRepo.findOne.mockResolvedValue(null);

      await service.promoteToInstructor('user-1', 'admin-1');

      expect(profileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InstructorStatus.APPROVED,
          invitedById: 'admin-1',
        }),
      );
    });
  });

  describe('demoteToStudent', () => {
    it('refuses to demote an admin', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));

      await expect(service.demoteToStudent('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects demoting someone who is already a student', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.STUDENT }));

      await expect(service.demoteToStudent('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('demotes an instructor and rejects their profile', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({ role: UserRole.INSTRUCTOR }),
      );
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.APPROVED,
      });

      await service.demoteToStudent('user-1');

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.STUDENT }),
      );
      expect(profileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InstructorStatus.REJECTED }),
      );
    });
  });

  describe('deleteUser — guards', () => {
    it('refuses to let an admin delete their own account', async () => {
      await expect(
        service.deleteUser('admin-1', 'admin-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepo.delete).not.toHaveBeenCalled();
    });

    it('throws NotFound for a missing target', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteUser('user-1', 'admin-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to delete an administrator', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));

      await expect(
        service.deleteUser('user-1', 'admin-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deletes an ordinary user', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ id: 'user-1' }));

      const result = await service.deleteUser('user-1', 'admin-1');

      expect(userRepo.delete).toHaveBeenCalledWith('user-1');
      expect(result.success).toBe(true);
    });
  });

  describe('requestAccountDeletion', () => {
    const dto: any = { reason: 'done learning' };

    it('refuses an admin', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));

      await expect(
        service.requestAccountDeletion('user-1', dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a pending request when none is open', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      deletionRepo.findOne.mockResolvedValue(null);

      await service.requestAccountDeletion('user-1', dto);

      expect(deletionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', reason: 'done learning' }),
      );
      expect(deletionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('updates the reason on an existing pending request instead of duplicating', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      deletionRepo.findOne.mockResolvedValue({ id: 'req-1', reason: 'old' });

      await service.requestAccountDeletion('user-1', dto);

      expect(deletionRepo.create).not.toHaveBeenCalled();
      expect(deletionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'done learning' }),
      );
    });
  });
});
