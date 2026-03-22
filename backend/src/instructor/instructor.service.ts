import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(ownerId: string) {
    const courses = await this.prisma.course.findMany({
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

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      updatedAt: course.updatedAt,
      moduleCount: course._count.modules,
      lessonCount: course.modules.reduce(
        (total, module) => total + module._count.lessons,
        0,
      ),
    }));
  }

  async createCourse(ownerId: string, dto: CreateCourseDto) {
    try {
      return await this.prisma.course.create({
        data: {
          ...dto,
          ownerId,
          status: CourseStatus.DRAFT,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'COURSE_SLUG_EXISTS',
          message: 'Course slug already exists',
        });
      }
      throw error;
    }
  }

  async updateCourse(ownerId: string, courseId: string, dto: UpdateCourseDto) {
    await this.assertCourseOwnership(ownerId, courseId);
    try {
      return await this.prisma.course.update({
        where: { id: courseId },
        data: dto,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'COURSE_SLUG_EXISTS',
          message: 'Course slug already exists',
        });
      }
      throw error;
    }
  }

  async deleteCourse(ownerId: string, courseId: string) {
    const course = await this.assertCourseOwnership(ownerId, courseId);
    if (course.status !== CourseStatus.DRAFT) {
      throw new ForbiddenException({
        code: 'COURSE_DELETE_DENIED',
        message: 'Only draft courses can be deleted',
      });
    }

    await this.prisma.course.delete({ where: { id: courseId } });
    return { success: true };
  }

  async addModule(ownerId: string, courseId: string, dto: CreateModuleDto) {
    await this.assertCourseOwnership(ownerId, courseId);
    return this.createModule(courseId, dto);
  }

  async updateModule(ownerId: string, moduleId: string, dto: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) {
      throw new NotFoundException({
        code: 'MODULE_NOT_FOUND',
        message: 'Module not found',
      });
    }
    this.assertOwnership(module.course.ownerId, ownerId);

    try {
      return await this.prisma.module.update({
        where: { id: moduleId },
        data: dto,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'MODULE_ORDER_EXISTS',
          message: 'Module order is already used for this course',
        });
      }
      throw error;
    }
  }

  async addLesson(ownerId: string, moduleId: string, dto: CreateLessonDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) {
      throw new NotFoundException({
        code: 'MODULE_NOT_FOUND',
        message: 'Module not found',
      });
    }
    this.assertOwnership(module.course.ownerId, ownerId);

    return this.createLesson(moduleId, dto);
  }

  async updateLesson(ownerId: string, lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    }
    this.assertOwnership(lesson.module.course.ownerId, ownerId);

    try {
      return await this.prisma.lesson.update({
        where: { id: lessonId },
        data: dto,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'LESSON_ORDER_EXISTS',
          message: 'Lesson order is already used for this module',
        });
      }
      throw error;
    }
  }

  async publishCourse(ownerId: string, courseId: string) {
    const course = await this.assertCourseOwnership(ownerId, courseId);
    const modulesCount = await this.prisma.module.count({
      where: { courseId: course.id },
    });
    const lessonsCount = await this.prisma.lesson.count({
      where: { module: { courseId: course.id } },
    });

    if (modulesCount === 0 || lessonsCount === 0) {
      throw new ForbiddenException({
        code: 'COURSE_PUBLISH_VALIDATION_FAILED',
        message: 'Course requires at least one module and one lesson',
      });
    }

    return this.prisma.course.update({
      where: { id: course.id },
      data: {
        status: CourseStatus.PUBLISHED,
        moderationReason: null,
      },
    });
  }

  async unpublishCourse(ownerId: string, courseId: string) {
    const course = await this.assertCourseOwnership(ownerId, courseId);
    return this.prisma.course.update({
      where: { id: course.id },
      data: { status: CourseStatus.DRAFT },
    });
  }

  async getCourseStructure(ownerId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        ownerId: true,
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

    this.assertOwnership(course.ownerId, ownerId);

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      modules: course.modules,
    };
  }

  private async assertCourseOwnership(ownerId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }
    this.assertOwnership(course.ownerId, ownerId);
    return course;
  }

  private assertOwnership(actualOwnerId: string, ownerId: string) {
    if (actualOwnerId !== ownerId) {
      throw new ForbiddenException({
        code: 'COURSE_ACCESS_DENIED',
        message: 'You can mutate only your own course content',
      });
    }
  }

  private async createModule(courseId: string, dto: CreateModuleDto) {
    try {
      return await this.prisma.module.create({
        data: {
          courseId,
          title: dto.title,
          order: dto.order,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'MODULE_ORDER_EXISTS',
          message: 'Module order is already used for this course',
        });
      }
      throw error;
    }
  }

  private async createLesson(moduleId: string, dto: CreateLessonDto) {
    try {
      return await this.prisma.lesson.create({
        data: {
          moduleId,
          title: dto.title,
          type: dto.type,
          contentUrl: dto.contentUrl,
          content: dto.content,
          mediaAssetId: dto.mediaAssetId,
          order: dto.order,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'LESSON_ORDER_EXISTS',
          message: 'Lesson order is already used for this module',
        });
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
