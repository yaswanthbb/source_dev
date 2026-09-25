import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'Why Closures Clicked For Me' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Hand-written article body (Markdown)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Optional further-reading roadmap link',
  })
  @IsOptional()
  @IsUUID()
  roadmapId?: string;

  @ApiPropertyOptional({
    description: 'Optional further-reading concept link',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string;
}

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'Why Closures Clicked For Me' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Hand-written article body (Markdown)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    description: 'Further-reading roadmap link (null clears)',
  })
  @IsOptional()
  @IsUUID()
  roadmapId?: string | null;

  @ApiPropertyOptional({
    description: 'Further-reading concept link (null clears)',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string | null;
}

export class DeleteArticleDto {
  @ApiProperty({
    example: 'Spam / plagiarism / off-topic.',
    description: 'Specific reason, delivered to the author via notifications',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
