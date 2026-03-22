import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('rooms')
  listRooms(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listMyRooms(user.userId);
  }

  @Post('rooms')
  createRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoomDto,
  ) {
    return this.chatService.createRoom(user.userId, dto);
  }

  @Get('rooms/:roomId/messages')
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    const limit = query.limit ?? 50;
    return this.chatService.listMessages(
      user.userId,
      roomId,
      limit,
      query.before,
    );
  }

  @Post('rooms/:roomId/messages')
  async postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.chatService.createMessage(
      user.userId,
      roomId,
      dto.content,
    );
    this.chatGateway.emitMessageCreated(roomId, message);
    return message;
  }
}
