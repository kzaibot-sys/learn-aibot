import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentSubmissionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import type { GradeAssignmentDto } from './dto/grade-assignment.dto';
import type { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignmentForLearner(userId: string, lessonId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { lessonId },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                courseId: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found for this lesson',
      });
    }

    const courseId = assignment.lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to access assignment',
      });
    }

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId: assignment.id,
          userId,
        },
      },
    });

    return {
      assignment: {
        id: assignment.id,
        lessonId: assignment.lessonId,
        title: assignment.title,
        description: assignment.description,
        maxScore: assignment.maxScore,
        dueAt: assignment.dueAt,
        createdAt: assignment.createdAt,
      },
      submission: submission
        ? {
            id: submission.id,
            content: submission.content,
            score: submission.score,
            status: submission.status,
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt,
          }
        : null,
    };
  }

  async submitAssignment(
    userId: string,
    assignmentId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: { select: { courseId: true } },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    const courseId = assignment.lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to submit assignment',
      });
    }

    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId,
        },
      },
    });

    if (existing?.status === AssignmentSubmissionStatus.GRADED) {
      throw new ForbiddenException({
        code: 'ASSIGNMENT_ALREADY_GRADED',
        message: 'Assignment is already graded',
      });
    }

    const now = new Date();
    return this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId,
        },
      },
      create: {
        assignmentId,
        userId,
        content: dto.content,
        status: AssignmentSubmissionStatus.SUBMITTED,
      },
      update: {
        content: dto.content,
        submittedAt: now,
        status: AssignmentSubmissionStatus.SUBMITTED,
      },
      select: {
        id: true,
        assignmentId: true,
        userId: true,
        content: true,
        score: true,
        status: true,
        submittedAt: true,
        gradedAt: true,
      },
    });
  }

  async gradeAssignment(
    instructorId: string,
    assignmentId: string,
    dto: GradeAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { ownerId: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    if (assignment.lesson.module.course.ownerId !== instructorId) {
      throw new ForbiddenException({
        code: 'ASSIGNMENT_GRADE_DENIED',
        message: 'Only the course owner can grade this assignment',
      });
    }

    if (dto.score < 0 || dto.score > assignment.maxScore) {
      throw new BadRequestException({
        code: 'ASSIGNMENT_SCORE_INVALID',
        message: `Score must be between 0 and ${assignment.maxScore}`,
      });
    }

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: dto.userId,
        },
      },
    });

    if (!submission) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_SUBMISSION_NOT_FOUND',
        message: 'Submission not found for this learner',
      });
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        score: dto.score,
        status: AssignmentSubmissionStatus.GRADED,
        gradedAt: new Date(),
      },
      select: {
        id: true,
        assignmentId: true,
        userId: true,
        content: true,
        score: true,
        status: true,
        submittedAt: true,
        gradedAt: true,
      },
    });
  }
}
