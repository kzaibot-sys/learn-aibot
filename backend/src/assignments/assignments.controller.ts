import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AssignmentsService } from './assignments.service';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post(':assignmentId/submit')
  @Roles(Role.STUDENT)
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submitAssignment(
      user.userId,
      assignmentId,
      dto,
    );
  }

  @Post(':assignmentId/grade')
  @Roles(Role.INSTRUCTOR)
  grade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: GradeAssignmentDto,
  ) {
    return this.assignmentsService.gradeAssignment(
      user.userId,
      assignmentId,
      dto,
    );
  }
}
