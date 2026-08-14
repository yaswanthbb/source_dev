import { IsInt, Min } from 'class-validator';

export class UpdateModuleConceptDto {
  @IsInt()
  @Min(0)
  orderIndex: number;
}
