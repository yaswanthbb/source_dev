import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConceptDifficulty } from '../../../common/enums/concept-difficulty.enum';

export class CreateConceptDto {
  @ApiProperty({
    example: 'Introduction to TypeScript',
    description: 'Concept title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'TypeScript adds static type definitions...',
    description: 'Concept content body',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: ConceptDifficulty,
    default: ConceptDifficulty.MEDIUM,
    description: 'Concept difficulty level',
  })
  @IsOptional()
  @IsEnum(ConceptDifficulty)
  difficulty?: ConceptDifficulty;

  @IsOptional()
  isAiGenerated?: boolean;
}
