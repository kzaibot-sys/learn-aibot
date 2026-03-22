import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CourseSortBy,
  ListCoursesQueryDto,
} from './dto/list-courses.query.dto';
import { RecommendationsQueryDto } from './dto/recommendations.query.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async listPublicCourses(query: ListCoursesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      category: query.category || undefined,
      level: query.level || undefined,
      language: query.language || undefined,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                description: { contains: query.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const sortBy = query.sortBy ?? CourseSortBy.RELEVANCE;
    let orderBy:
      | Prisma.CourseOrderByWithRelationInput
      | Prisma.CourseOrderByWithRelationInput[];
    switch (sortBy) {
      case CourseSortBy.POPULAR:
        orderBy = [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }];
        break;
      case CourseSortBy.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case CourseSortBy.RELEVANCE:
      default:
        // Same filter as search; tie-break by recency (simple relevance proxy).
        orderBy = { updatedAt: 'desc' };
        break;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          level: true,
          language: true,
          priceCents: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async listRecommendations(query: RecommendationsQueryDto) {
    const limit = query.limit ?? 10;

    const rows = await this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      take: limit,
      orderBy: [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        level: true,
        language: true,
        priceCents: true,
        _count: { select: { enrollments: true } },
      },
    });

    return rows.map((course) => {
      const enrollmentCount = course._count.enrollments;
      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language,
        priceCents: course.priceCents,
        score: enrollmentCount,
        enrollmentCount,
      };
    });
  }

  async getPublicCourseById(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: CourseStatus.PUBLISHED },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return course;
  }

  async enrollInCourse(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: CourseStatus.PUBLISHED },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        enrolledAt: true,
      },
    });

    if (existingEnrollment) {
      return {
        enrollment: existingEnrollment,
        enrolled: false,
      };
    }

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId },
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        enrolledAt: true,
      },
    });

    await this.gamificationService.recordEnrollment(userId, courseId);

    return {
      enrollment,
      enrolled: true,
    };
  }
}
