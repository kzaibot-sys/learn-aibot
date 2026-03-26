import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';
import { cacheGet, cacheSet } from '../services/redis';

const router = Router();

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
      price: true,
      currency: true,
      isFree: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const paymentEnabled = config.payment.enabled;
  const response = {
    success: true,
    data: courses.map(c => ({ ...c, price: c.price.toString(), paymentEnabled })),
  };

  // Only cache the full (non-filtered) list
  if (!search) {
    await cacheSet('courses:list', response, 300); // 5 min
  }

  res.json(response);
}));

// GET /api/courses/:slug — course details with modules and lessons
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug, isPublished: true },
    include: {
      modules: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        include: {
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

  res.json({
    success: true,
    data: {
      ...course,
      price: course.price.toString(),
      paymentEnabled: config.payment.enabled,
    },
  });
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
