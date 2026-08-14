import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Selected option UUID',
  })
  @IsUUID()
  selectedOptionId: string;
}
