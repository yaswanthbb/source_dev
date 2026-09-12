import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIanaTimezone } from '../../../common/validators/is-iana-timezone.validator';

export class RegisterDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Asia/Kolkata',
    description:
      "Detected from the browser at sign-up. Falls back to the column default (UTC) when absent, e.g. for API clients that don't send it.",
  })
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string;
}
