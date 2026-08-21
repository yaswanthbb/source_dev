import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric OTP code received via email',
  })
  @IsNotEmpty({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit numeric code' })
  otp: string;
}
