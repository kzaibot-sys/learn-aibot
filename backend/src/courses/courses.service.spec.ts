import { NotFoundException } from '@nestjs/common';
import { CourseStatus, type Prisma } from '@prisma/client';
import { CourseSortBy } from './dto/list-courses.query.dto';
import { CoursesService } from './courses.service';

const recommendationRow = {
  id: 'c1',
  slug: 'slug-a',
  title: 'Title A',
  description: 'Desc',
  category: 'cat',
  level: 'beginner',
  language: 'en',
  _count: { enrollments: 3 },
};

describe('CoursesService', () => {
  const userId = 'user_1';
  const courseId = 'course_1';

  it('returns existing enrollment without creating a duplicate', async () => {
    const existingEnrollment = {
      id: 'enroll_1',
      userId,
      courseId,
      progress: 0,
      enrolledAt: new Date(),
    };

    const prisma = {
      course: {
        findFirst: jest.fn().mockResolvedValue({ id: courseId }),
      },
      enrollment: {
        findUnique: jest.fn().mockResolvedValue(existingEnrollment),
        create: jest.fn(),
      },
    };

    const service = new CoursesService(prisma as never);
    const result = await service.enrollInCourse(userId, courseId);

    expect(prisma.course.findFirst).toHaveBeenCalledWith({
      where: { id: courseId, status: CourseStatus.PUBLISHED },
      select: { id: true },
    });
    expect(prisma.enrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_courseId: { userId, courseId } },
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        enrolledAt: true,
      },
    });
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      enrollment: existingEnrollment,
      enrolled: false,
    });
  });

  it('throws COURSE_NOT_FOUND when course is missing', async () => {
    const prisma = {
      course: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      enrollment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const service = new CoursesService(prisma as never);

    await expect(
      service.enrollInCourse(userId, courseId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.enrollment.findUnique).not.toHaveBeenCalled();
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  describe('listRecommendations', () => {
    it('uses default limit 10 and maps score and enrollmentCount', async () => {
      const findMany = jest.fn().mockResolvedValue([recommendationRow]);
      const prisma = { course: { findMany } };

      const service = new CoursesService(prisma as never);
      const result = await service.listRecommendations({});

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          where: { status: CourseStatus.PUBLISHED },
          orderBy: [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }],
        }),
      );
      expect(result).toEqual([
        {
          id: 'c1',
          slug: 'slug-a',
          title: 'Title A',
          description: 'Desc',
          category: 'cat',
          level: 'beginner',
          language: 'en',
          score: 3,
          enrollmentCount: 3,
        },
      ]);
    });

    it('respects explicit limit', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { course: { findMany } };

      const service = new CoursesService(prisma as never);
      await service.listRecommendations({ limit: 15 });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 15 }),
      );
    });
  });

  describe('listPublicCourses', () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);

    beforeEach(() => {
      findMany.mockClear();
      count.mockClear();
    });

    function makeService() {
      const prisma = {
        $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
        course: { findMany, count },
      };
      return new CoursesService(prisma as never);
    }

    it('orders by updatedAt desc for default relevance sort', async () => {
      const service = makeService();
      await service.listPublicCourses({});

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('orders by updatedAt desc when sortBy is relevance', async () => {
      const service = makeService();
      await service.listPublicCourses({ sortBy: CourseSortBy.RELEVANCE });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('orders by createdAt desc for newest', async () => {
      const service = makeService();
      await service.listPublicCourses({ sortBy: CourseSortBy.NEWEST });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('orders by enrollment count desc for popular', async () => {
      const service = makeService();
      await service.listPublicCourses({ sortBy: CourseSortBy.POPULAR });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }],
        }),
      );
    });

    it('applies search filter together with sort', async () => {
      const service = makeService();
      await service.listPublicCourses({
        search: 'algebra',
        sortBy: CourseSortBy.POPULAR,
      });

      const calls = findMany.mock.calls as Array<[Prisma.CourseFindManyArgs]>;
      const firstArg = calls[0]?.[0];
      expect(firstArg).toMatchObject({
        where: {
          OR: [
            { title: { contains: 'algebra', mode: 'insensitive' } },
            { description: { contains: 'algebra', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }],
      });
    });
  });
});
