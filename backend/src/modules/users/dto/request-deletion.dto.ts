import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestDeletionDto {
  @ApiPropertyOptional({
    description: 'Optional reason or message explaining why the account is being requested for deletion',
    example: 'I have finished my course and wish to remove my account data.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
