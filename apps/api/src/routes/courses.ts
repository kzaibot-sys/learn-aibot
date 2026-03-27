import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { cacheGet, cacheSet } from '../services/redis';

const router = Router();

// GET /api/courses/my-progress — batch: enrolled courses with progress
router.get('/my-progress', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  // Try cache first (60s per user)
  const cacheKey = `progress:${userId}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      course: {
        select: {
          id: true, slug: true, title: true, description: true, coverUrl: true,
          modules: {
            where: { isPublished: true },
            select: {
              id: true, title: true, order: true,
              lessons: {
                where: { isPublished: true },
                select: { id: true },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  const allLessonIds = enrollments.flatMap(e =>
    e.course.modules.flatMap(m => m.lessons.map(l => l.id))
  );

  const progressRecords = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds } },
    select: { lessonId: true, completed: true },
  });

  const progressMap = new Map(progressRecords.map(p => [p.lessonId, p]));

  const data = enrollments.map(e => {
    const totalLessons = e.course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = e.course.modules.reduce((sum, m) =>
      sum + m.lessons.filter(l => progressMap.get(l.id)?.completed).length, 0
    );

    return {
      id: e.course.id,
      slug: e.course.slug,
      title: e.course.title,
      description: e.course.description,
      coverUrl: e.course.coverUrl,
      totalModules: e.course.modules.length,
      totalLessons,
      completedLessons,
      progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      enrolledAt: e.enrolledAt,
    };
  });

  const response = { success: true, data };
  await cacheSet(cacheKey, response, 60);
  res.json(response);
}));

// GET /api/courses — published courses list (optional ?search=term)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  // Use cache only when there is no search query
  if (!search) {
    const cached = await cacheGet<unknown>('courses:list');
    if (cached) {
      res.json(cached);
      return;
    }
  }

  const whereClause: Record<string, unknown> = { isPublished: true };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const courses = await prisma.course.findMany({
    where: whereClause,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      modules: {
        select: {
          id: true,
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const response = {
    success: true,
    data: courses.map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl,
      totalLessons: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      totalModules: c.modules.length,
    })),
  };

  // Only cache the full (non-filtered) list
  if (!search) {
    await cacheSet('courses:list', response, 300); // 5 min
  }

  res.json(response);
}));

// GET /api/courses/:slug — course details with modules and lessons
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const cacheKey = `courses:detail:${slug}`;

  // Try cache first
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      price: true,
      currency: true,
      isFree: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      modules: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          isPublished: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              order: true,
              isFree: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
  }

  const response = {
    success: true,
    data: {
      ...course,
      price: course.price.toString(),
    },
  };

  // Cache for 5 min
  await cacheSet(cacheKey, response, 300);

  res.json(response);
}));

// GET /api/courses/:slug/lessons/:lessonId — lesson detail (enrolled only)
router.get('/:slug/lessons/:lessonId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { slug, lessonId } = req.params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, isFree: true },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
  }

  // Check enrollment (unless course is free)
  if (!course.isFree) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new AppError(403, 'NOT_ENROLLED', 'У вас нет доступа к этому курсу');
    }
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, isPublished: true },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          maxScore: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Урок не найден');
  }

  // Get user progress for this lesson
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  res.json({
    success: true,
    data: {
      ...lesson,
      progress: progress
        ? { completed: progress.completed, watchedSec: progress.watchedSec, completedAt: progress.completedAt }
        : null,
    },
  });
}));

export { router as coursesRouter };
