import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQaQuestionDto {
  @ApiProperty({
    example: 'How do decorators work in NestJS?',
    description: 'Question content body',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}
