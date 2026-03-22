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
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { InstructorService } from './instructor.service';

@Controller('instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR)
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get('courses')
  listCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.instructorService.listCourses(user.userId);
  }

  @Post('courses')
  createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.instructorService.createCourse(user.userId, dto);
  }

  @Patch('courses/:courseId')
  updateCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.instructorService.updateCourse(user.userId, courseId, dto);
  }

  @Delete('courses/:courseId')
  deleteCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorService.deleteCourse(user.userId, courseId);
  }

  @Post('courses/:courseId/modules')
  addModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.instructorService.addModule(user.userId, courseId, dto);
  }

  @Patch('modules/:moduleId')
  updateModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.instructorService.updateModule(user.userId, moduleId, dto);
  }

  @Post('modules/:moduleId/lessons')
  addLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.instructorService.addLesson(user.userId, moduleId, dto);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.instructorService.updateLesson(user.userId, lessonId, dto);
  }

  @Post('courses/:courseId/publish')
  publishCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorService.publishCourse(user.userId, courseId);
  }

  @Post('courses/:courseId/unpublish')
  unpublishCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorService.unpublishCourse(user.userId, courseId);
  }

  @Get('courses/:courseId/structure')
  getCourseStructure(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorService.getCourseStructure(user.userId, courseId);
  }
}
