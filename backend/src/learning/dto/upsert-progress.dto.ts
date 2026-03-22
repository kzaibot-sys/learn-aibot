import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class UpsertProgressDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  watchedDuration!: number;

  @Type(() => Boolean)
  @IsBoolean()
  completed!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  quizScore?: number;
}
