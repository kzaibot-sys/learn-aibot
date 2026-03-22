import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;
}
