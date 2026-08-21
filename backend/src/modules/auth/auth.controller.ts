import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
