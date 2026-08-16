import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachConceptDto {
  @ApiProperty({ description: 'ID of the concept to attach' })
  @IsUUID()
  conceptId: string;

  @ApiPropertyOptional({
    description: 'Target order index (calculated automatically if omitted)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
