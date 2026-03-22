import { IsString, MinLength } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
