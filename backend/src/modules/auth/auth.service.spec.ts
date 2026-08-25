import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

jest.mock('bcrypt');

const NOW = new Date('2026-08-25T12:00:00.000Z');

describe('AuthService', () => {
  let service: AuthService;
  let otpRepo: MockRepository;
  let userRepo: MockRepository;
  let usersService: {
    findOneByEmailWithPassword: jest.Mock;
    createUser: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let emailService: { sendOtpEmail: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    usersService = {
      findOneByEmailWithPassword: jest.fn(),
      createUser: jest.fn(),
    };
    jwtService = { sign: jest.fn(() => 'token'), verify: jest.fn() };
    emailService = { sendOtpEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        {
          provide: getRepositoryToken(PasswordResetOtp),
          useValue: createMockRepository(),
        },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get(AuthService);
    otpRepo = module.get(getRepositoryToken(PasswordResetOtp));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: any = { email: 'a@b.dev', password: 'pw', name: 'A' };

    it('rejects a duplicate email with 409', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(makeUser());

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('hashes the password, creates the user, and returns a token', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(makeUser());

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.dev', passwordHash: 'hashed' }),
      );
      expect(result.accessToken).toBe('token');
    });
  });

  describe('login', () => {
    const dto: any = { email: 'a@b.dev', password: 'pw' };

    it('rejects unknown credentials', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('steers social-only accounts away from password login', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(
        makeUser({ passwordHash: null }),
      );

      await expect(service.login(dto)).rejects.toThrow(/social/i);
    });

    it('rejects a wrong password', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns a sanitized user (no passwordHash) and a token on success', async () => {
      usersService.findOneByEmailWithPassword.mockResolvedValue(makeUser());

      const result: any = await service.login(dto);

      expect(result.accessToken).toBe('token');
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.user.hasPassword).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    const dto: any = { email: 'a@b.dev' };
    const generic =
      "If an account with this email exists, we've sent a reset code.";

    it('returns the generic response and sends nothing for an unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword(dto)).resolves.toEqual({
        message: generic,
      });
      expect(otpRepo.create).not.toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('rate-limits after 3 requests in the last hour', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      otpRepo.count.mockResolvedValue(3);

      await expect(service.forgotPassword(dto)).resolves.toEqual({
        message: generic,
      });
      expect(otpRepo.create).not.toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('creates a hashed, 10-minute OTP and emails it', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ email: 'a@b.dev' }));
      otpRepo.count.mockResolvedValue(0);

      await service.forgotPassword(dto);

      expect(otpRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', used: false },
        { used: true },
      );
      expect(otpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          otpHash: 'hashed',
          attemptsUsed: 0,
          used: false,
          expiresAt: new Date(NOW.getTime() + 10 * 60 * 1000),
        }),
      );
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'a@b.dev',
        expect.stringMatching(/^\d{6}$/),
      );
    });
  });

  describe('verifyOtp', () => {
    const dto: any = { email: 'a@b.dev', otp: '123456' };

    it('rejects an unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when there is no active OTP', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      otpRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('locks out after 5 attempts', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      otpRepo.findOne.mockResolvedValue({
        attemptsUsed: 5,
        otpHash: 'x',
        used: false,
      });

      await expect(service.verifyOtp(dto)).rejects.toThrow(/too many/i);
      expect(otpRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
    });

    it('increments attempts and rejects a wrong code', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      otpRepo.findOne.mockResolvedValue({
        attemptsUsed: 0,
        otpHash: 'x',
        used: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyOtp(dto)).rejects.toThrow(/invalid code/i);
      expect(otpRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ attemptsUsed: 1 }),
      );
    });

    it('marks the OTP used and issues a purpose-scoped reset token', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      otpRepo.findOne.mockResolvedValue({
        attemptsUsed: 0,
        otpHash: 'x',
        used: false,
      });
      jwtService.sign.mockReturnValue('reset-token');

      const result = await service.verifyOtp(dto);

      expect(result).toEqual({ resetToken: 'reset-token' });
      expect(otpRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'password_reset' }),
        { expiresIn: '10m' },
      );
    });
  });

  describe('resetPassword', () => {
    const dto: any = { resetToken: 'tok', newPassword: 'newpw' };

    it('rejects an unverifiable token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad');
      });

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a token without the password_reset purpose', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'login' });

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('re-hashes the password and invalidates outstanding OTPs', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        purpose: 'password_reset',
      });
      userRepo.findOne.mockResolvedValue(makeUser());

      await service.resetPassword(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpw', 10);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'hashed',
      });
      expect(otpRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', used: false },
        { used: true },
      );
    });
  });
});
