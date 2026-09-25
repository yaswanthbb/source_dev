import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiProvider } from '../../../common/enums/ai-provider.enum';
import { Type } from 'class-transformer';

export class CreateAiKeyDto {
  @ApiProperty({
    enum: AiProvider,
    example: AiProvider.NVIDIA,
    description: 'Provider this key belongs to (nvidia or gemini)',
  })
  @IsEnum(AiProvider)
  provider: AiProvider;

  @ApiProperty({
    description: 'The provider API key. Stored encrypted, never returned.',
    example: 'nvapi-...',
  })
  @IsString()
  @MinLength(8)
  apiKey: string;

  @ApiPropertyOptional({
    description: 'Optional friendly label',
    example: 'personal NVIDIA key',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({
    description:
      'Default model for this key, picked from the live model list (dropdown source: POST /ai-providers/:provider/models/lookup)',
    example: 'gemini-3.6-flash',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultModel?: string;
}

export class UpdateAiKeyDto {
  @ApiPropertyOptional({ description: 'Friendly label' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @ApiPropertyOptional({
    description: 'Daily generation cap for this key (1–50)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  dailyLimit?: number;

  @ApiPropertyOptional({
    description: 'Set as the default key used for all generations',
  })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Default model for this key (validated against the live list)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultModel?: string | null;
}

export interface AiKeyMetadata {
  id: string;
  provider: AiProvider;
  label: string | null;
  keyHint: string;
  isDefault: boolean;
  dailyLimit: number;
  defaultModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LookupModelsDto {
  @ApiProperty({
    description:
      'A not-yet-saved provider API key. Verified live, never stored or logged.',
    example: 'nvapi-...',
  })
  @IsString()
  @MinLength(8)
  apiKey: string;
}
