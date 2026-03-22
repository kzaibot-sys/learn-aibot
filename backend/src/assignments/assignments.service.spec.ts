import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentSubmissionStatus } from '@prisma/client';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  const userId = 'u1';
  const instructorId = 'ins1';
  const assignmentId = 'asg1';
  const courseId = 'c1';

  describe('submitAssignment', () => {
    it('throws ASSIGNMENT_NOT_FOUND when assignment missing', async () => {
      const prisma = {
        assignment: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      const service = new AssignmentsService(prisma as never);

      await expect(
        service.submitAssignment(userId, assignmentId, { content: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws LESSON_ACCESS_DENIED when not enrolled', async () => {
      const prisma = {
        assignment: {
          findUnique: jest.fn().mockResolvedValue({
            id: assignmentId,
            lesson: { module: { courseId } },
          }),
        },
        enrollment: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      const service = new AssignmentsService(prisma as never);

      try {
        await service.submitAssignment(userId, assignmentId, { content: 'x' });
        throw new Error('expected rejection');
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toEqual(
          expect.objectContaining({ code: 'LESSON_ACCESS_DENIED' }),
        );
      }
    });

    it('throws ASSIGNMENT_ALREADY_GRADED when submission graded', async () => {
      const prisma = {
        assignment: {
          findUnique: jest.fn().mockResolvedValue({
            id: assignmentId,
            lesson: { module: { courseId } },
          }),
        },
        enrollment: {
          findUnique: jest.fn().mockResolvedValue({ id: 'e1' }),
        },
        assignmentSubmission: {
          findUnique: jest.fn().mockResolvedValue({
            status: AssignmentSubmissionStatus.GRADED,
          }),
          upsert: jest.fn(),
        },
      };
      const service = new AssignmentsService(prisma as never);

      try {
        await service.submitAssignment(userId, assignmentId, { content: 'x' });
        throw new Error('expected rejection');
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toEqual(
          expect.objectContaining({ code: 'ASSIGNMENT_ALREADY_GRADED' }),
        );
      }
      expect(prisma.assignmentSubmission.upsert).not.toHaveBeenCalled();
    });
  });

  describe('gradeAssignment', () => {
    it('throws ASSIGNMENT_GRADE_DENIED when instructor does not own course', async () => {
      const prisma = {
        assignment: {
          findUnique: jest.fn().mockResolvedValue({
            id: assignmentId,
            lesson: {
              module: {
                course: { ownerId: 'other' },
              },
            },
          }),
        },
      };
      const service = new AssignmentsService(prisma as never);

      try {
        await service.gradeAssignment(instructorId, assignmentId, {
          userId,
          score: 5,
        });
        throw new Error('expected rejection');
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toEqual(
          expect.objectContaining({ code: 'ASSIGNMENT_GRADE_DENIED' }),
        );
      }
    });

    it('throws ASSIGNMENT_SCORE_INVALID when score above maxScore', async () => {
      const prisma = {
        assignment: {
          findUnique: jest.fn().mockResolvedValue({
            id: assignmentId,
            maxScore: 10,
            lesson: {
              module: {
                course: { ownerId: instructorId },
              },
            },
          }),
        },
      };
      const service = new AssignmentsService(prisma as never);

      await expect(
        service.gradeAssignment(instructorId, assignmentId, {
          userId,
          score: 11,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
