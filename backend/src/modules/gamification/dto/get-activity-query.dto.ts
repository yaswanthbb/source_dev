import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetActivityQueryDto {
  @ApiPropertyOptional({
    description:
      'Number of days of activity to return (default 14, max 371 — 53 weeks, the widest a year-view graph can need)',
    default: 14,
    minimum: 1,
    maximum: 371,
    example: 365,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(371)
  days?: number = 14;
}
