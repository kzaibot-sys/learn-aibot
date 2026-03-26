import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { XP_PER_LESSON, STREAK_BONUS_XP, calculateLevel } from '../config/gamification';
import { updateStreak, checkAndAwardAchievements, getUserStats } from '../services/gamification';

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

  const existingProgress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const wasAlreadyCompleted = existingProgress?.completed ?? false;

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

  // Gamification: only award XP on first completion
  let xpEarned = 0;
  let streakBonus = 0;
  let totalXp = 0;
  let level = 1;
  let levelUp = false;
  let newAchievements: Awaited<ReturnType<typeof checkAndAwardAchievements>> = [];

  if (!wasAlreadyCompleted) {
    // Update streak and get new value
    const newStreak = await updateStreak(userId);
    streakBonus = newStreak > 1 ? STREAK_BONUS_XP : 0;
    xpEarned = XP_PER_LESSON + streakBonus;

    // Fetch current user level before update
    const userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, level: true },
    });
    const oldLevel = userBefore?.level ?? 1;

    // Update XP and level
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: xpEarned } },
      select: { totalXp: true },
    });
    totalXp = updatedUser.totalXp;
    level = calculateLevel(totalXp);
    levelUp = level > oldLevel;
    await prisma.user.update({ where: { id: userId }, data: { level } });

    // Check achievements
    const stats = await getUserStats(userId);
    newAchievements = await checkAndAwardAchievements(userId, stats);

    // Refresh totalXp after achievement bonuses
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, level: true },
    });
    totalXp = finalUser?.totalXp ?? totalXp;
    level = finalUser?.level ?? level;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, level: true },
    });
    totalXp = user?.totalXp ?? 0;
    level = user?.level ?? 1;
  }

  res.json({
    success: true,
    data: {
      progress,
      xpEarned,
      streakBonus,
      totalXp,
      level,
      levelUp,
      newAchievements,
    },
  });
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
