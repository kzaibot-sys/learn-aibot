import { ForbiddenException } from '@nestjs/common';
import { CourseStatus, LessonType } from '@prisma/client';
import { InstructorService } from './instructor.service';

describe('InstructorService', () => {
  const ownerId = 'user_1';
  const otherOwnerId = 'user_2';
  const courseId = 'course_1';

  it('lists only owned courses with module and lesson counts', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: courseId,
        title: 'Course title',
        slug: 'course-title',
        status: CourseStatus.DRAFT,
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
        _count: { modules: 2 },
        modules: [{ _count: { lessons: 3 } }, { _count: { lessons: 1 } }],
      },
    ]);
    const prisma = {
      course: { findMany },
    };
    const service = new InstructorService(prisma as never);

    const result = await service.listCourses(ownerId);

    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        _count: {
          select: {
            modules: true,
          },
        },
        modules: {
          select: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual([
      {
        id: courseId,
        title: 'Course title',
        slug: 'course-title',
        status: CourseStatus.DRAFT,
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
        moduleCount: 2,
        lessonCount: 4,
      },
    ]);
  });

  it('throws COURSE_ACCESS_DENIED when course is not owned by instructor', async () => {
    const prisma = {
      course: {
        findUnique: jest.fn().mockResolvedValue({
          id: courseId,
          title: 'Course title',
          slug: 'course-title',
          ownerId: otherOwnerId,
          modules: [],
        }),
      },
    };
    const service = new InstructorService(prisma as never);

    await expect(
      service.getCourseStructure(ownerId, courseId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns ordered owned course structure', async () => {
    const course = {
      id: courseId,
      title: 'Course title',
      slug: 'course-title',
      ownerId,
      modules: [
        {
          id: 'module_1',
          title: 'Module 1',
          order: 1,
          lessons: [
            {
              id: 'lesson_1',
              title: 'Lesson 1',
              type: LessonType.TEXT,
              order: 1,
              mediaAssetId: null,
              contentUrl: null,
            },
          ],
        },
      ],
    };
    const prisma = {
      course: {
        findUnique: jest.fn().mockResolvedValue(course),
      },
    };
    const service = new InstructorService(prisma as never);

    const result = await service.getCourseStructure(ownerId, courseId);

    expect(result).toEqual({
      id: courseId,
      title: 'Course title',
      slug: 'course-title',
      modules: course.modules,
    });
  });
});
