import { Router } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getUserStats } from '../services/gamification';
import { ACHIEVEMENTS, xpForNextLevel } from '../config/gamification';

const router = Router();
router.use(authenticate);

// GET /api/leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      totalXp: true,
      level: true,
      streak: true,
      avatarUrl: true,
    },
    orderBy: { totalXp: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: users.map((u, i) => ({ ...u, rank: i + 1 })) });
}));

// GET /api/user/stats
router.get('/user/stats', asyncHandler(async (req, res) => {
  const userId = req.user!.sub;
  const stats = await getUserStats(userId);
  const levelInfo = xpForNextLevel(stats.totalXp);
  res.json({ success: true, data: { ...stats, ...levelInfo } });
}));

// GET /api/user/achievements
router.get('/user/achievements', asyncHandler(async (req, res) => {
  const userId = req.user!.sub;
  const earned = await prisma.userAchievement.findMany({ where: { userId } });
  const all = Object.values(ACHIEVEMENTS).map((a) => ({
    ...a,
    condition: undefined,
    earned: earned.some((e) => e.achievementId === a.id),
    earnedAt: earned.find((e) => e.achievementId === a.id)?.earnedAt ?? null,
  }));
  res.json({ success: true, data: all });
}));

export { router as gamificationRouter };
