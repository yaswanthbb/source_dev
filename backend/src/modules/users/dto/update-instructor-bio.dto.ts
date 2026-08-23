import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstructorBioDto {
  @ApiPropertyOptional({
    example:
      'Experienced software engineer with 10+ years in full-stack architecture.',
    description: 'Instructor biography text',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Bio cannot exceed 2000 characters' })
  bio?: string | null;
}
