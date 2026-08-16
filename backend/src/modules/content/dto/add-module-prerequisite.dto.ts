import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddModulePrerequisiteDto {
  @ApiProperty({
    description:
      'ID of the prerequisite concept (must be attached to the same module)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  prerequisiteConceptId: string;
}
