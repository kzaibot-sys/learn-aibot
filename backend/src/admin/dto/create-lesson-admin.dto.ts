import { LessonType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLessonAdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsEnum(LessonType)
  type!: LessonType;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;
}
