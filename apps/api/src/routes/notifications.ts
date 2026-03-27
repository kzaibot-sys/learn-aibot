import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { cacheGet, cacheSet, cacheDelete } from '../services/redis';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications — list user notifications (newest first)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  res.json({
    success: true,
    data: { notifications, total, page, perPage },
  });
}));

// GET /api/notifications/unread-count
router.get('/unread-count', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  // Cache unread count for 15s (polled every 30s)
  const unreadCacheKey = `notifications:unread:${userId}`;
  const cachedCount = await cacheGet<unknown>(unreadCacheKey);
  if (cachedCount) {
    res.json(cachedCount);
    return;
  }

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  const unreadResponse = { success: true, data: { count } };
  await cacheSet(unreadCacheKey, unreadResponse, 15);
  res.json(unreadResponse);
}));

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  await cacheDelete(`notifications:unread:${userId}`);
  res.json({ success: true, data: { ok: true } });
}));

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  await cacheDelete(`notifications:unread:${userId}`);
  res.json({ success: true, data: { ok: true } });
}));

export { router as notificationsRouter };
