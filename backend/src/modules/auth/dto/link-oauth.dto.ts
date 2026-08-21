import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkOAuthDto {
  @ApiProperty({
    example: 'google',
    description: 'OAuth provider name',
    enum: ['google', 'github'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'github'])
  provider: 'google' | 'github';

  @ApiProperty({
    example: '1234567890',
    description: 'Unique user ID provided by OAuth provider',
  })
  @IsString()
  @IsNotEmpty()
  providerId: string;
}
