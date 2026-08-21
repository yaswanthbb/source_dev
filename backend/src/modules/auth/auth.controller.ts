import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkOAuthDto } from './dto/link-oauth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { OAuthProfile } from './interfaces/oauth-profile.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already in use.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns token and profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset OTP code sent via email',
  })
  @ApiResponse({
    status: 200,
    description: 'Generic confirmation response (anti-enumeration).',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify 6-digit OTP code and receive a short-lived reset token',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, returns resetToken.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset account password using verified resetToken',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 sign in' })
  async googleAuth() {
    // Handled by Passport Google Strategy redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    try {
      const oauthProfile = req.user as OAuthProfile;
      const { accessToken } =
        await this.authService.handleOAuthLogin(oauthProfile);
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`,
      );
    } catch (err: any) {
      const message = err?.message || 'Authentication failed';
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Public()
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth sign in' })
  async githubAuth() {
    // Handled by Passport GitHub Strategy redirect
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    try {
      const oauthProfile = req.user as OAuthProfile;
      const { accessToken } =
        await this.authService.handleOAuthLogin(oauthProfile);
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`,
      );
    } catch (err: any) {
      const message = err?.message || 'Authentication failed';
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Patch('link-oauth')
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Link OAuth provider to authenticated account' })
  @ApiResponse({
    status: 200,
    description: 'OAuth account linked successfully.',
  })
  @ApiResponse({ status: 400, description: 'Account already linked.' })
  @ApiResponse({
    status: 409,
    description: 'OAuth account already used by another user.',
  })
  async linkOAuth(@CurrentUser() user: User, @Body() dto: LinkOAuthDto) {
    return this.usersService.linkOAuthProvider(
      user.id,
      dto.provider,
      dto.providerId,
    );
  }
}

