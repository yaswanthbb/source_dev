import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOwnProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'IANA timezone string',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'data:image/jpeg;base64,...',
    description: 'Base64 image data URI or null to remove',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string | null;
}
