import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { ListCoursesQueryDto } from './dto/list-courses.query.dto';
import { RecommendationsQueryDto } from './dto/recommendations.query.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listCourses(@Query() query: ListCoursesQueryDto) {
    return this.coursesService.listPublicCourses(query);
  }

  @Get('recommendations')
  listRecommendations(@Query() query: RecommendationsQueryDto) {
    return this.coursesService.listRecommendations(query);
  }

  @Get(':courseId')
  getCourse(@Param('courseId') courseId: string) {
    return this.coursesService.getPublicCourseById(courseId);
  }

  @Post(':courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  enrollInCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.enrollInCourse(user.userId, courseId);
  }
}
