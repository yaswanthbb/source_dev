import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days of activity to return (default 14, max 90)',
    default: 14,
    minimum: 1,
    maximum: 90,
    example: 14,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 14;
}
