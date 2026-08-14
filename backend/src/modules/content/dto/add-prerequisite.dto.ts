import { IsUUID } from 'class-validator';

export class AddPrerequisiteDto {
  @IsUUID()
  prerequisiteConceptId: string;
}
