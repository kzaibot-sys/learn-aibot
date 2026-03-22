import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friends/requests')
  listFriendRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.listFriendRequests(user.userId);
  }

  @Get('friends')
  listFriends(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.listFriends(user.userId);
  }

  @Post('friends/request')
  sendFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(user.userId, dto.targetUserId);
  }

  @Post('friends/:requestId/accept')
  acceptFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptFriendRequest(user.userId, requestId);
  }

  @Post('friends/:requestId/decline')
  declineFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.declineFriendRequest(user.userId, requestId);
  }

  @Post('friends/:friendUserId/block')
  blockUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('friendUserId') friendUserId: string,
  ) {
    return this.socialService.blockUser(user.userId, friendUserId);
  }
}
