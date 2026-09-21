import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQaQuestionDto {
  @ApiProperty({
    example: 'How do decorators work in NestJS?',
    description: 'Question content body',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    enum: ['discussion', 'ai'],
    default: 'discussion',
    description:
      'Target: post publicly in the discussion, or ask AI privately (visible only to you)',
  })
  @IsOptional()
  @IsIn(['discussion', 'ai'])
  target?: 'discussion' | 'ai';
}
