import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({
    example: 'Decorators annotate class declarations and methods at runtime.',
    description: 'Answer content body',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}
