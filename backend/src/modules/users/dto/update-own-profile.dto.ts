import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIanaTimezone } from '../../../common/validators/is-iana-timezone.validator';

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
  @IsIanaTimezone()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'data:image/jpeg;base64,...',
    description: 'Base64 image data URI or null to remove',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string | null;
}
