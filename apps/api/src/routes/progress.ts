import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { cacheDelete } from '../services/redis';

const router = Router();

// All progress routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /progress/lesson/{lessonId}/complete:
 *   post:
 *     tags: [Progress]
 *     summary: Mark lesson as completed
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string }
 *         description: Lesson ID
 *     responses:
 *       200: { description: Lesson marked as completed }
 *       404: { description: Lesson not found }
 */
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

  // Invalidate user's progress cache
  await cacheDelete(`progress:${userId}`);

  res.json({
    success: true,
    data: { progress },
  });
}));

/**
 * @openapi
 * /progress/lesson/{lessonId}/watchtime:
 *   patch:
 *     tags: [Progress]
 *     summary: Update video watch time for a lesson
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string }
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [watchedSec]
 *             properties:
 *               watchedSec: { type: number, minimum: 0, description: Watched seconds }
 *     responses:
 *       200: { description: Watch time updated }
 *       400: { description: Invalid watchedSec value }
 */
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

/**
 * @openapi
 * /progress/course/{courseId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get course progress for current user
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *         description: Course ID
 *     responses:
 *       200: { description: Course progress with per-lesson details }
 *       403: { description: Not enrolled in course }
 *       404: { description: Course not found }
 */
router.get('/course/:courseId', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { courseId } = req.params;

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    throw new AppError(403, 'NOT_ENROLLED', 'Для доступа к урокам оплатите курс через бота @aibot_learn_bot');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      modules: {
        select: {
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
    select: {
      lessonId: true,
      completed: true,
      watchedSec: true,
      completedAt: true,
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
