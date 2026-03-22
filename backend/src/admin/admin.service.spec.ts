import { NotFoundException } from '@nestjs/common';
import { LessonType } from '@prisma/client';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const courseId = 'course_1';

  it('returns ordered course structure', async () => {
    const course = {
      id: courseId,
      title: 'Course title',
      slug: 'course-title',
      modules: [
        {
          id: 'module_1',
          title: 'Module 1',
          order: 1,
          lessons: [
            {
              id: 'lesson_1',
              title: 'Lesson 1',
              type: LessonType.VIDEO,
              order: 1,
              mediaAssetId: 'asset_1',
              contentUrl: 'https://example.com/video.mp4',
            },
          ],
        },
      ],
    };
    const findUnique = jest.fn().mockResolvedValue(course);
    const prisma = {
      course: { findUnique },
    };
    const service = new AdminService(prisma as never);

    const result = await service.getCourseStructure(courseId);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                mediaAssetId: true,
                contentUrl: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual(course);
  });

  it('throws COURSE_NOT_FOUND when course is missing', async () => {
    const prisma = {
      course: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new AdminService(prisma as never);

    await expect(service.getCourseStructure(courseId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
