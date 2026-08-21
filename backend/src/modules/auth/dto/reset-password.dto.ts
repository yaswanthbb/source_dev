import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT reset token obtained from verifying OTP',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  resetToken: string;

  @ApiProperty({
    example: 'newSecurePassword123!',
    description: 'New password for the user account (minimum 8 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
