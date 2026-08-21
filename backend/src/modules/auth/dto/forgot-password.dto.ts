import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the user requesting password reset',
  })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
