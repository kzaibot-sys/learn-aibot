import { prisma } from '@lms/database';
import { ACHIEVEMENTS, UserStats, calculateLevel } from '../config/gamification';

/**
 * Returns aggregate stats for a user used in achievement checks.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, streak: true },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true },
  });

  // Count completed courses: courses where all published lessons are completed
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { courseId: true },
  });

  let completedCourses = 0;
  for (const enrollment of enrollments) {
    const totalLessons = await prisma.lesson.count({
      where: {
        isPublished: true,
        module: { courseId: enrollment.courseId },
      },
    });
    if (totalLessons === 0) continue;
    const completedInCourse = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: {
          isPublished: true,
          module: { courseId: enrollment.courseId },
        },
      },
    });
    if (completedInCourse >= totalLessons) {
      completedCourses++;
    }
  }

  // Count lessons completed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lessonsToday = await prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
      completedAt: { gte: todayStart },
    },
  });

  return {
    completedLessons,
    completedCourses,
    currentStreak: user?.streak ?? 0,
    lessonsToday,
    totalXp: user?.totalXp ?? 0,
  };
}

/**
 * Updates the streak based on lastActiveAt.
 * - If last active was today: no change
 * - If last active was yesterday: increment streak
 * - Otherwise: reset streak to 1
 * Returns the new streak value.
 */
export async function updateStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastActiveAt: true },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  let newStreak = user?.streak ?? 0;
  const lastActive = user?.lastActiveAt;

  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive >= todayStart) {
    // Already active today — streak unchanged
    newStreak = user?.streak ?? 1;
  } else if (lastActive >= yesterdayStart) {
    // Active yesterday — extend streak
    newStreak = (user?.streak ?? 0) + 1;
  } else {
    // Missed a day — reset
    newStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastActiveAt: now },
  });

  return newStreak;
}

export interface NewAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

/**
 * Checks all achievement conditions and awards any not yet earned.
 * Returns array of newly awarded achievements.
 */
export async function checkAndAwardAchievements(
  userId: string,
  stats: UserStats
): Promise<NewAchievement[]> {
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  const newAchievements: NewAchievement[] = [];
  let bonusXp = 0;

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (earnedIds.has(achievement.id)) continue;
    if (achievement.condition(stats)) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      bonusXp += achievement.xpReward;
      newAchievements.push({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
      });
    }
  }

  if (bonusXp > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: bonusXp } },
      select: { totalXp: true },
    });
    const newLevel = calculateLevel(updatedUser.totalXp);
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  return newAchievements;
}
