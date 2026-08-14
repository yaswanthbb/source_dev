import { IsInt, IsUUID, Min } from 'class-validator';

export class AttachConceptDto {
  @IsUUID()
  conceptId: string;

  @IsInt()
  @Min(0)
  orderIndex: number;
}
