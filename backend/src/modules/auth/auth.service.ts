import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OAuthProfile } from './interfaces/oauth-profile.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectRepository(PasswordResetOtp)
    private readonly otpRepository: Repository<PasswordResetOtp>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmailWithPassword(
      dto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const userWithPassword = await this.usersService.findOneByEmailWithPassword(
      dto.email,
    );
    if (!userWithPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!userWithPassword.passwordHash) {
      throw new UnauthorizedException(
        'This account uses social sign-in. Please log in with Google or GitHub, or use forgot password to set a password.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      userWithPassword.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sanitizedUser = { ...userWithPassword };
    delete (sanitizedUser as Record<string, unknown>).passwordHash;
    const payload = {
      sub: sanitizedUser.id,
      email: sanitizedUser.email,
      role: sanitizedUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: sanitizedUser,
      accessToken,
    };
  }

  async handleOAuthLogin(oauthProfile: OAuthProfile) {
    if (!oauthProfile.email) {
      throw new BadRequestException(
        'Email address is required from OAuth provider',
      );
    }

    const normalizedEmail = oauthProfile.email.toLowerCase().trim();

    // 1. Check if user already exists by OAuth provider & providerId
    const user = await this.usersService.findByOAuthProvider(
      oauthProfile.provider,
      oauthProfile.providerId,
    );

    if (user) {
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      return {
        user,
        accessToken,
      };
    }

    // 2. Check if a user with this email already exists
    const existingByEmail =
      await this.usersService.findOneByEmailWithPassword(normalizedEmail);

    if (existingByEmail) {
      if (!existingByEmail.authProvider) {
        throw new ConflictException(
          `An account with email ${normalizedEmail} already exists. Please log in with your password and connect ${oauthProfile.provider === 'google' ? 'Google' : 'GitHub'} from your Profile settings.`,
        );
      } else {
        throw new ConflictException(
          `This email is linked to another sign-in method (${existingByEmail.authProvider}).`,
        );
      }
    }

    // 3. Auto-register new user via OAuth
    const newUser = await this.usersService.createOAuthUser({
      email: normalizedEmail,
      name: oauthProfile.name,
      authProvider: oauthProfile.provider,
      authProviderId: oauthProfile.providerId,
      profilePicture: oauthProfile.photo || null,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: newUser,
      accessToken,
    };
  }


  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const genericResponse = {
      message:
        "If an account with this email exists, we've sent a reset code.",
    };

    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      return genericResponse;
    }

    // Rate limit: count OTP requests in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpsCount = await this.otpRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThanOrEqual(oneHourAgo),
      },
    });

    if (recentOtpsCount >= 3) {
      // Rate limited: return generic response without generating or sending email
      return genericResponse;
    }

    // Invalidate any existing unused OTPs
    await this.otpRepository.update(
      { userId: user.id, used: false },
      { used: true },
    );

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpEntity = this.otpRepository.create({
      userId: user.id,
      otpHash,
      expiresAt,
      attemptsUsed: 0,
      used: false,
    });

    await this.otpRepository.save(otpEntity);

    // Send email via Resend
    await this.emailService.sendOtpEmail(user.email, otp);

    return genericResponse;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ resetToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    // Find the latest active, non-expired, unused OTP record
    const otpRecord = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (otpRecord.attemptsUsed >= 5) {
      otpRecord.used = true;
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException(
        'Too many attempts, request a new code',
      );
    }

    const isMatch = await bcrypt.compare(dto.otp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attemptsUsed += 1;
      if (otpRecord.attemptsUsed >= 5) {
        otpRecord.used = true;
      }
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException('Invalid code');
    }

    // Mark OTP as used
    otpRecord.used = true;
    await this.otpRepository.save(otpRecord);

    // Issue short-lived reset JWT token (10 minutes)
    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        purpose: 'password_reset',
      },
      {
        expiresIn: '10m',
      },
    );

    return { resetToken };
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    let payload: { sub?: string; email?: string; purpose?: string };
    try {
      payload = this.jwtService.verify(dto.resetToken);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!payload || payload.purpose !== 'password_reset' || !payload.sub) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });

    // Invalidate all remaining OTPs for this user
    await this.otpRepository.update(
      { userId: user.id, used: false },
      { used: true },
    );

    return {
      message:
        'Password reset successfully. You can now log in with your new password.',
    };
  }
}
