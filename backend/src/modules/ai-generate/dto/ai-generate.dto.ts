import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateRoadmapDescriptionDto {
  @ApiProperty({
    description: 'Title of the roadmap to generate a description for',
    example: 'Distributed Systems & Cloud Architecture in Go',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class GenerateConceptContentDto {
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
    example: 'Master distributed primitives, consensus, and fault-tolerant architecture.',
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
    description: 'Titles of sibling concepts in the same module to avoid duplication',
    example: ['Paxos Foundations', 'Two-Phase Commit vs Consensus'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siblingConceptTitles?: string[];
}

export class GenerateConceptMcqsDto {
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
