import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyInstructorDto {
  @ApiPropertyOptional({
    example: 'Senior Software Engineer with 8 years of experience in distributed systems and cloud architecture.',
    description: 'Background, teaching experience, and qualifications',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
