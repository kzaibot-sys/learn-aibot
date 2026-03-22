import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AssignmentsService } from '../assignments/assignments.service';
import { CertificatesService } from '../certificates/certificates.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { LearningService } from './learning.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningController {
  constructor(
    private readonly learningService: LearningService,
    private readonly assignmentsService: AssignmentsService,
    private readonly certificatesService: CertificatesService,
  ) {}

  @Post('courses/:courseId/certificate/issue')
  @Roles(Role.STUDENT)
  issueCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.certificatesService.issueCertificate(user.userId, courseId);
  }

  @Get('users/me/enrollments')
  @Roles(Role.STUDENT)
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.learningService.getMyEnrollments(user.userId);
  }

  @Get('courses/:courseId/curriculum')
  @Roles(Role.STUDENT)
  getCurriculum(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.learningService.getCourseCurriculumForLearner(
      user.userId,
      courseId,
    );
  }

  @Get('lessons/:lessonId/assignment')
  @Roles(Role.STUDENT)
  getAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
  ) {
    return this.assignmentsService.getAssignmentForLearner(
      user.userId,
      lessonId,
    );
  }

  @Get('lessons/:lessonId/quiz')
  @Roles(Role.STUDENT)
  getQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
  ) {
    return this.learningService.getQuizForLearner(user.userId, lessonId);
  }

  @Post('lessons/:lessonId/quiz/submit')
  @Roles(Role.STUDENT)
  submitQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.learningService.submitQuiz(user.userId, lessonId, dto);
  }

  @Get('lessons/:lessonId')
  @Roles(Role.STUDENT)
  getLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
  ) {
    return this.learningService.getLessonForLearner(user.userId, lessonId);
  }

  @Put('lessons/:lessonId/progress')
  @Roles(Role.STUDENT)
  upsertProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.learningService.upsertLessonProgress(
      user.userId,
      lessonId,
      dto,
    );
  }

  @Get('users/me/progress')
  @Roles(Role.STUDENT)
  getMyProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.learningService.getMyProgress(user.userId);
  }

  @Get('users/me/activity')
  @Roles(Role.STUDENT)
  getMyActivity(@CurrentUser() user: AuthenticatedUser) {
    return this.learningService.getMyActivity(user.userId);
  }
}
