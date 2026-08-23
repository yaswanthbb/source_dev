import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConceptDifficulty } from '../../../common/enums/concept-difficulty.enum';

export class UpdateConceptDto {
  @ApiPropertyOptional({
    example: 'Advanced TypeScript Types',
    description: 'Updated concept title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    example: 'Generics and conditional types...',
    description: 'Updated content body',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    enum: ConceptDifficulty,
    description: 'Updated concept difficulty level',
  })
  @IsOptional()
  @IsEnum(ConceptDifficulty)
  difficulty?: ConceptDifficulty;

  @IsOptional()
  isAiGenerated?: boolean;
}
