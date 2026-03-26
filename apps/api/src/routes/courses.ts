import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/courses — published courses list
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
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

  res.json({
    success: true,
    data: courses.map(c => ({ ...c, price: c.price.toString() })),
  });
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
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  res.json({
    success: true,
    data: {
      ...course,
      price: course.price.toString(),
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
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  // Check enrollment (unless course is free)
  if (!course.isFree) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new AppError(403, 'NOT_ENROLLED', 'You are not enrolled in this course');
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
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
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
