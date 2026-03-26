import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All progress routes require authentication
router.use(authenticate);

// POST /api/progress/lesson/:lessonId/complete
router.post('/lesson/:lessonId/complete', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { lessonId } = req.params;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  });

  res.json({ success: true, data: progress });
}));

// PATCH /api/progress/lesson/:lessonId/watchtime
router.patch('/lesson/:lessonId/watchtime', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { lessonId } = req.params;
  const { watchedSec } = req.body;

  if (typeof watchedSec !== 'number' || watchedSec < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'watchedSec must be a non-negative number');
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      watchedSec: Math.floor(watchedSec),
    },
    update: {
      watchedSec: Math.floor(watchedSec),
    },
  });

  res.json({ success: true, data: progress });
}));

// GET /api/progress/course/:courseId
router.get('/course/:courseId', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const lessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const totalLessons = lessonIds.length;

  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
    },
  });

  const completedLessons = progressRecords.filter(p => p.completed).length;

  res.json({
    success: true,
    data: {
      courseId,
      totalLessons,
      completedLessons,
      progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      lessons: progressRecords.map(p => ({
        lessonId: p.lessonId,
        completed: p.completed,
        watchedSec: p.watchedSec,
        completedAt: p.completedAt,
      })),
    },
  });
}));

export { router as progressRouter };
