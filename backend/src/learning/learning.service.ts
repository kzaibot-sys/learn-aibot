import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, LessonType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type {
  LearnerActivityItem,
  LearnerActivityType,
} from './learner-activity.types';
import {
  evaluateQuiz,
  parseQuizDefinition,
  type QuizDefinition,
  QuizContentValidationError,
  sanitizeQuizPayload,
} from './quiz-content';

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async enroll(userId: string, courseId: string) {
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

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
      },
      update: {},
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        enrolledAt: true,
      },
    });

    await this.gamificationService.recordEnrollment(userId, courseId);
    return enrollment;
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            level: true,
            language: true,
            priceCents: true,
            status: true,
          },
        },
      },
    });
  }

  async getLessonForLearner(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.course.id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to access lesson',
      });
    }

    const progress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      contentUrl: lesson.contentUrl,
      content: lesson.content,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        order: lesson.module.order,
      },
      course: lesson.module.course,
      progress,
    };
  }

  async getCourseCurriculumForLearner(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        progress: true,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'COURSE_ACCESS_DENIED',
        message: 'Enrollment required to access curriculum',
      });
    }

    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        status: CourseStatus.PUBLISHED,
      },
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

    const lessonIds = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );

    const progressRows = await this.prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
      select: {
        lessonId: true,
        completed: true,
        watchedDuration: true,
        quizScore: true,
        updatedAt: true,
      },
    });

    const progressMap = new Map(
      progressRows.map((item) => [item.lessonId, item]),
    );
    let previousCompleted = true;

    const modules = course.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => {
        const progress = progressMap.get(lesson.id) ?? null;
        const unlocked = previousCompleted;
        const completed = Boolean(progress?.completed);
        previousCompleted = completed;

        return {
          ...lesson,
          unlocked,
          completed,
          progress,
        };
      });

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        lessons,
      };
    });

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      progress: enrollment.progress,
      modules,
    };
  }

  async getQuizForLearner(userId: string, lessonId: string) {
    const { lesson, def } = await this.loadQuizDefinitionForLearner(
      userId,
      lessonId,
    );
    return {
      lessonId: lesson.id,
      title: lesson.title,
      quiz: sanitizeQuizPayload(def),
    };
  }

  async submitQuiz(userId: string, lessonId: string, dto: SubmitQuizDto) {
    const answers = dto.answers;
    for (const value of Object.values(answers)) {
      if (typeof value !== 'string') {
        throw new BadRequestException({
          code: 'QUIZ_INVALID_ANSWERS',
          message: 'Each answer must be a string option id',
        });
      }
    }

    const { lesson, def } = await this.loadQuizDefinitionForLearner(
      userId,
      lessonId,
    );

    const { scorePercent, completed } = evaluateQuiz(def, answers);
    const previous = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      select: { completed: true },
    });

    const progress = await this.prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        watchedDuration: 0,
        completed,
        quizScore: scorePercent,
      },
      update: {
        completed,
        quizScore: scorePercent,
      },
    });

    const courseProgress = await this.recalculateEnrollmentProgress(
      userId,
      lesson.module.courseId,
    );

    if (completed && !previous?.completed) {
      await this.gamificationService.recordLessonCompletion(
        userId,
        lesson.module.courseId,
        lessonId,
      );
    }
    await this.gamificationService.recordCourseCompletion(
      userId,
      lesson.module.courseId,
      courseProgress,
    );

    return {
      score: scorePercent,
      completed,
      progress,
      courseProgress,
    };
  }

  private async loadQuizDefinitionForLearner(
    userId: string,
    lessonId: string,
  ): Promise<{
    lesson: { id: string; title: string; module: { courseId: string } };
    def: QuizDefinition;
  }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to access lesson',
      });
    }

    if (lesson.type !== LessonType.QUIZ) {
      throw new BadRequestException({
        code: 'QUIZ_NOT_QUIZ_TYPE',
        message: 'Lesson is not a quiz',
      });
    }

    try {
      const def = parseQuizDefinition(lesson.content);
      return {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          module: lesson.module,
        },
        def,
      };
    } catch (error) {
      if (error instanceof QuizContentValidationError) {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }

  async upsertLessonProgress(
    userId: string,
    lessonId: string,
    dto: UpsertProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException({
        code: 'LESSON_ACCESS_DENIED',
        message: 'Enrollment required to update progress',
      });
    }

    const previous = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      select: { completed: true },
    });

    const progress = await this.prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        watchedDuration: dto.watchedDuration,
        completed: dto.completed,
        quizScore: dto.quizScore,
      },
      update: {
        watchedDuration: dto.watchedDuration,
        completed: dto.completed,
        quizScore: dto.quizScore,
      },
    });

    const courseProgress = await this.recalculateEnrollmentProgress(
      userId,
      lesson.module.courseId,
    );

    if (dto.completed && !previous?.completed) {
      await this.gamificationService.recordLessonCompletion(
        userId,
        lesson.module.courseId,
        lessonId,
      );
    }
    await this.gamificationService.recordCourseCompletion(
      userId,
      lesson.module.courseId,
      courseProgress,
    );

    return { progress, courseProgress };
  }

  async getMyActivity(
    userId: string,
  ): Promise<{ items: LearnerActivityItem[] }> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: {
        enrolledAt: true,
        course: { select: { id: true, title: true } },
      },
    });

    const progressRows = await this.prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            type: true,
            module: {
              select: {
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    const activities: LearnerActivityItem[] = [];

    for (const row of enrollments) {
      activities.push({
        type: 'ENROLLED',
        courseId: row.course.id,
        courseTitle: row.course.title,
        lessonId: null,
        lessonTitle: null,
        timestamp: row.enrolledAt.toISOString(),
        meta: {},
      });
    }

    for (const p of progressRows) {
      const course = p.lesson.module.course;
      const activityType = this.resolveProgressActivityType(
        p.lesson.type,
        p.completed,
        p.quizScore,
      );

      const meta: Record<string, unknown> = {
        watchedDuration: p.watchedDuration,
        completed: p.completed,
      };
      if (p.quizScore != null) {
        meta.quizScore = p.quizScore;
      }

      activities.push({
        type: activityType,
        courseId: course.id,
        courseTitle: course.title,
        lessonId: p.lesson.id,
        lessonTitle: p.lesson.title,
        timestamp: p.updatedAt.toISOString(),
        meta,
      });
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return { items: activities.slice(0, 50) };
  }

  private resolveProgressActivityType(
    lessonType: LessonType,
    completed: boolean,
    quizScore: number | null,
  ): LearnerActivityType {
    if (lessonType === LessonType.QUIZ && quizScore != null) {
      return 'QUIZ_SUBMITTED';
    }
    if (completed) {
      return 'LESSON_COMPLETED';
    }
    return 'LESSON_PROGRESS';
  }

  async getMyProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true, order: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const progressRows = await this.prisma.progress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        watchedDuration: true,
        completed: true,
        quizScore: true,
        updatedAt: true,
      },
    });

    const progressMap = new Map(
      progressRows.map((item) => [item.lessonId, item]),
    );

    return enrollments.map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap((module) =>
        module.lessons.map((lesson) => ({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          status: progressMap.get(lesson.id)?.completed
            ? 'COMPLETED'
            : 'IN_PROGRESS',
          watchedDuration: progressMap.get(lesson.id)?.watchedDuration ?? 0,
          quizScore: progressMap.get(lesson.id)?.quizScore ?? null,
          updatedAt: progressMap.get(lesson.id)?.updatedAt ?? null,
        })),
      );

      return {
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress,
        lessons,
      };
    });
  }

  private async recalculateEnrollmentProgress(
    userId: string,
    courseId: string,
  ) {
    const lessonIds = await this.prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    });

    const totalLessons = lessonIds.length;
    if (totalLessons === 0) {
      await this.prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { progress: 0 },
      });
      return 0;
    }

    const completedLessons = await this.prisma.progress.count({
      where: {
        userId,
        completed: true,
        lessonId: { in: lessonIds.map((lesson) => lesson.id) },
      },
    });

    const value = Number(((completedLessons / totalLessons) * 100).toFixed(2));
    await this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progress: value },
    });

    return value;
  }
}
