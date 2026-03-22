import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AdminService } from './admin.service';
import { CreateCourseAdminDto } from './dto/create-course-admin.dto';
import { CreateLessonAdminDto } from './dto/create-lesson-admin.dto';
import { CreateModuleAdminDto } from './dto/create-module-admin.dto';
import { RejectCourseDto } from './dto/reject-course.dto';
import { UpdateCourseAdminDto } from './dto/update-course-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsersForAdmin();
  }

  @Get('courses')
  listCourses() {
    return this.adminService.listCoursesForAdmin();
  }

  @Get('courses/:courseId/structure')
  getCourseStructure(@Param('courseId') courseId: string) {
    return this.adminService.getCourseStructure(courseId);
  }

  @Get('payments')
  listPayments() {
    return this.adminService.listPaymentsForAdmin();
  }

  @Post('courses')
  createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseAdminDto,
  ) {
    return this.adminService.createCourse(user.userId, dto);
  }

  @Patch('courses/:courseId')
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseAdminDto,
  ) {
    return this.adminService.updateCourse(courseId, dto);
  }

  @Delete('courses/:courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return this.adminService.deleteCourse(courseId);
  }

  @Post('courses/:courseId/modules')
  addModule(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleAdminDto,
  ) {
    return this.adminService.addModule(courseId, dto);
  }

  @Post('modules/:moduleId/lessons')
  addLesson(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonAdminDto,
  ) {
    return this.adminService.addLesson(moduleId, dto);
  }

  @Patch('users/:userId/role')
  updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Get('courses/moderation')
  getModerationCourses() {
    return this.adminService.listModerationCourses();
  }

  @Post('courses/:courseId/reject')
  rejectCourse(
    @Param('courseId') courseId: string,
    @Body() dto: RejectCourseDto,
  ) {
    return this.adminService.rejectCourse(courseId, dto);
  }

  @Post('courses/:courseId/approve')
  approveCourse(@Param('courseId') courseId: string) {
    return this.adminService.approveCourse(courseId);
  }
}
