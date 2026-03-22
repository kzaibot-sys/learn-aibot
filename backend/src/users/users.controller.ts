import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CertificatesService } from '../certificates/certificates.service';
import { PresenceService } from '../presence/presence.service';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly certificatesService: CertificatesService,
    private readonly presenceService: PresenceService,
  ) {}

  @Get('me')
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.findById(user.userId);
    if (!profile) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  @Get('me/dashboard')
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getDashboardSummary(user.userId);
  }

  @Patch('me')
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ) {
    const profile = await this.usersService.updateProfile(user.userId, dto);
    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  @Post('me/presence/heartbeat')
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  touchPresence(@CurrentUser() user: AuthenticatedUser) {
    this.presenceService.markHeartbeat(user.userId);
    return this.presenceService.getPresence(user.userId);
  }

  @Get('search')
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  searchUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q: string = '',
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number(limitRaw);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 12;
    return this.usersService.searchUsers(q, user.userId, limit);
  }

  @Get('me/enrollments')
  @Roles(Role.STUDENT)
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listEnrollmentsByUserId(user.userId);
  }

  @Get('me/certificates')
  @Roles(Role.STUDENT)
  getMyCertificates(@CurrentUser() user: AuthenticatedUser) {
    return this.certificatesService.listCertificatesForUser(user.userId);
  }
}
