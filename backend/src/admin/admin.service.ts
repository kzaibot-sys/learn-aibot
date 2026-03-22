import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCourseAdminDto } from './dto/create-course-admin.dto';
import { CreateLessonAdminDto } from './dto/create-lesson-admin.dto';
import { CreateModuleAdminDto } from './dto/create-module-admin.dto';
import { RejectCourseDto } from './dto/reject-course.dto';
import { UpdateCourseAdminDto } from './dto/update-course-admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      paymentsTotal,
      streakUsers,
      topCourses,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      this.prisma.enrollment.count(),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amountCents: true },
      }),
      this.prisma.userGamificationProfile.count({
        where: { streakDays: { gte: 3 } },
      }),
      this.prisma.course.findMany({
        take: 5,
        orderBy: [{ enrollments: { _count: 'desc' } }, { updatedAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          priceCents: true,
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
      }),
    ]);

    return {
      widgets: {
        totalUsers,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeStreakUsers: streakUsers,
        totalRevenueCents: paymentsTotal._sum.amountCents ?? 0,
      },
      topCourses: topCourses.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        priceCents: course.priceCents,
        enrollmentCount: course._count.enrollments,
        moduleCount: course._count.modules,
      })),
    };
  }

  listUsersForAdmin() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        gamificationProfile: {
          select: {
            xp: true,
            level: true,
            streakDays: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            courses: true,
            payments: true,
            achievementAwards: true,
          },
        },
      },
    });
  }

  listCoursesForAdmin() {
    return this.prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        level: true,
        language: true,
        priceCents: true,
        status: true,
        moderationReason: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            payments: true,
          },
        },
        updatedAt: true,
        createdAt: true,
      },
    });
  }

  async getCourseStructure(courseId: string) {
    const course = await this.prisma.course.findUnique({
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

    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return course;
  }

  listPaymentsForAdmin() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        provider: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });
  }

  async createCourse(adminUserId: string, dto: CreateCourseAdminDto) {
    return this.prisma.course.create({
      data: {
        ownerId: adminUserId,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        category: dto.category,
        level: dto.level,
        language: dto.language,
        priceCents: dto.priceCents ?? 0,
        status: dto.status ?? CourseStatus.DRAFT,
      },
    });
  }

  async updateCourse(courseId: string, dto: UpdateCourseAdminDto) {
    const exists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        category: dto.category,
        level: dto.level,
        language: dto.language,
        priceCents: dto.priceCents,
        status: dto.status,
      },
    });
  }

  async deleteCourse(courseId: string) {
    const exists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    await this.prisma.course.delete({ where: { id: courseId } });
    return { success: true };
  }

  async addModule(courseId: string, dto: CreateModuleAdminDto) {
    const exists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return this.prisma.module.create({
      data: {
        courseId,
        title: dto.title,
        order: dto.order,
      },
    });
  }

  async addLesson(moduleId: string, dto: CreateLessonAdminDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });
    if (!module) {
      throw new NotFoundException({
        code: 'MODULE_NOT_FOUND',
        message: 'Module not found',
      });
    }

    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        contentUrl: dto.contentUrl,
        mediaAssetId: dto.mediaAssetId,
        order: dto.order,
      },
    });
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  listModerationCourses() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        slug: true,
        title: true,
        ownerId: true,
        status: true,
        moderationReason: true,
        updatedAt: true,
      },
    });
  }

  async rejectCourse(courseId: string, dto: RejectCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.DRAFT,
        moderationReason: dto.reason,
      },
    });
  }

  async approveCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        moderationReason: null,
      },
    });
  }
}
