import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { config } from '../config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /api/bot/grant-access — bot grants course access by telegramId
router.post('/grant-access', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, courseSlug, botSecret } = req.body;

  // Verify bot secret
  if (!config.bot.secret || botSecret !== config.bot.secret) {
    throw new AppError(403, 'FORBIDDEN', 'Invalid bot secret');
  }

  if (!telegramId || !courseSlug) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and courseSlug are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
    include: { user: true },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: tgAccount.user.id, courseId: course.id } },
    create: { userId: tgAccount.user.id, courseId: course.id, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: tgAccount.user.id,
      title: 'Доступ к курсу открыт',
      message: `Вам открыт доступ к курсу "${course.title}"`,
      type: 'success',
    },
  });

  res.json({ success: true, data: { enrollment, userId: tgAccount.user.id } });
}));

export { router as botRouter };
