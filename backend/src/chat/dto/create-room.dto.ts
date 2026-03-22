import { ChatRoomType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateRoomDto {
  @IsEnum(ChatRoomType)
  type!: ChatRoomType;

  @ValidateIf((o: CreateRoomDto) => o.type === ChatRoomType.DIRECT)
  @IsString()
  @IsNotEmpty()
  peerUserId?: string;

  @ValidateIf((o: CreateRoomDto) => o.type === ChatRoomType.COURSE)
  @IsString()
  @IsNotEmpty()
  courseId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
