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
    enum: ['instructor', 'ai'],
    default: 'instructor',
    description: 'Target: ask a human instructor or get an immediate AI answer',
  })
  @IsOptional()
  @IsIn(['instructor', 'ai'])
  target?: 'instructor' | 'ai';
}

