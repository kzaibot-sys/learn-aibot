import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class GradeAssignmentDto {
  @IsString()
  userId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score!: number;
}
