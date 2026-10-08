import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @IsOptional()
  @IsIn(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
  bloomLevel?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  intendedDifficulty?: string;

  @IsOptional()
  @IsString()
  correctRationale?: string;

  @IsOptional()
  @IsObject()
  lintResult?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  verificationResult?: Record<string, unknown>;

  @ApiProperty({
    example: 'What language is NestJS written in?',
    description: 'MCQ Question text',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ example: 0, description: 'Display order index' })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({
    type: [CreateOptionDto],
    description: 'List of options (at least 2 options, exactly 1 correct)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
