import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiProvider } from '../../../common/enums/ai-provider.enum';

export class AiGenerationOptions {
  @ApiPropertyOptional({
    enum: AiProvider,
    description:
      'Provider to run with (must match your default key when one is set; free tier is NVIDIA only)',
  })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  @ApiPropertyOptional({
    description: 'Model id, validated against the live model list',
  })
  @IsOptional()
  @IsString()
  model?: string;
}

export class GenerateRoadmapModulesDto extends AiGenerationOptions {
  @ApiProperty({
    description: 'ID of the roadmap to generate modules for',
    example: 'd9b2d63d-a233-4f9e-bbd8-4d519b7d8e20',
  })
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;
}

export class GenerateModuleConceptsDto extends AiGenerationOptions {
  @ApiProperty({
    description: 'ID of the module to generate concepts for',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;
}

export class GenerateModuleMcqsDto extends AiGenerationOptions {
  @ApiProperty({
    description: 'ID of the module whose concepts need MCQs',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;
}

export class GenerateConceptContentDto extends AiGenerationOptions {
  @ApiProperty({
    description: 'Title of the concept article to generate',
    example: 'Raft Consensus Algorithm: Leader Election & Log Replication',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Target difficulty level of the concept',
    example: 'hard',
    enum: ['easy', 'medium', 'hard'],
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Title of the parent roadmap curriculum',
    example: 'Backend Engineering & Distributed Systems',
  })
  @IsOptional()
  @IsString()
  roadmapTitle?: string;

  @ApiPropertyOptional({
    description: 'Description or learning objectives of the parent roadmap',
    example:
      'Master distributed primitives, consensus, and fault-tolerant architecture.',
  })
  @IsOptional()
  @IsString()
  roadmapDescription?: string;

  @ApiPropertyOptional({
    description: 'Title of the module containing this concept',
    example: 'Consensus Protocols',
  })
  @IsOptional()
  @IsString()
  moduleTitle?: string;

  @ApiPropertyOptional({
    description:
      'Titles of sibling concepts in the same module to avoid duplication',
    example: ['Paxos Foundations', 'Two-Phase Commit vs Consensus'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siblingConceptTitles?: string[];

  @ApiPropertyOptional({
    description:
      'Roadmap id for course-context hydration (§8 Phase 1). When set with COURSE_ENGINE_ENABLED=true, the context context block is appended to the prompt. Omit for legacy behavior.',
  })
  @IsOptional()
  @IsUUID()
  roadmapId?: string;

  @ApiPropertyOptional({
    description:
      'Concept id for course-context hydration (§8 Phase 1). Target card + prerequisite summaries load only when set.',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string;
}

export class GenerateConceptMcqsDto extends AiGenerationOptions {
  @ApiPropertyOptional({
    description:
      'Existing concept to scope inventory storage; author/admin only',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string;

  @ApiProperty({
    description: 'Title of the concept for assessment MCQ generation',
    example: 'Database Isolation Levels & Concurrency Control',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Article content of the concept to base questions upon',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class AcknowledgeJobsDto {
  @ApiPropertyOptional({
    description:
      'Specific finished job ids to mark as read. Omit to acknowledge all of the user’s unread results.',
    type: [String],
    example: ['d9b2d63d-a233-4f9e-bbd8-4d519b7d8e20'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  jobIds?: string[];
}
