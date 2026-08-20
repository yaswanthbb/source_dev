import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectConceptDto {
  @ApiProperty({
    example: 'Content requires more code examples and accurate command syntax.',
    description: 'Admin feedback explaining why the concept was rejected',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
