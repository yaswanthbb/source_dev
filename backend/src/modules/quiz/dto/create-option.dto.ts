import { IsBoolean, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({ example: 'TypeScript', description: 'Option text' })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({
    example: true,
    description: 'Whether this option is the correct answer',
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: 0, description: 'Display order index' })
  @IsInt()
  @Min(0)
  orderIndex: number;
}
