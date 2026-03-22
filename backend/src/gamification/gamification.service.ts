import { Injectable } from '@nestjs/common';
import { AchievementKey } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

const DAILY_ACTIVITY_XP = 5;
const ENROLL_XP = 20;
const LESSON_COMPLETE_XP = 35;
const COURSE_COMPLETE_XP = 80;

const ACHIEVEMENT_SEED: Record<
  AchievementKey,
  { title: string; description: string; xpReward: number }
> = {
  FIRST_ENROLLMENT: {
    title: 'First Step',
    description: 'Enroll in your first course',
    xpReward: 25,
  },
  FIRST_LESSON_COMPLETION: {
    title: 'Momentum',
    description: 'Complete your first lesson',
    xpReward: 35,
  },
  STREAK_3_DAYS: {
    title: 'Consistency 3',
    description: 'Stay active for 3 days in a row',
    xpReward: 40,
  },
  STREAK_7_DAYS: {
    title: 'Consistency 7',
    description: 'Stay active for 7 days in a row',
    xpReward: 90,
  },
  COURSE_COMPLETED: {
    title: 'Course Finisher',
    description: 'Reach 100% on any enrolled course',
    xpReward: 60,
  },
};

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    await this.ensureAchievementDefinitions();

    const profile = await this.prisma.userGamificationProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const awards = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            key: true,
            title: true,
            description: true,
            xpReward: true,
          },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });

    return {
      xp: profile.xp,
      level: profile.level,
      streakDays: profile.streakDays,
      longestStreak: profile.longestStreak,
      lastActiveDate: profile.lastActiveDate,
      achievements: awards.map((award) => ({
        key: award.achievement.key,
        title: award.achievement.title,
        description: award.achievement.description,
        xpReward: award.achievement.xpReward,
        awardedAt: award.awardedAt,
      })),
    };
  }

  async recordEnrollment(userId: string, courseId: string) {
    await this.ensureAchievementDefinitions();
    await this.grantPoints(userId, ENROLL_XP, 'COURSE_ENROLL', courseId, null);
    await this.touchDailyActivity(userId);

    const enrollmentCount = await this.prisma.enrollment.count({
      where: { userId },
    });
    if (enrollmentCount === 1) {
      await this.grantAchievement(userId, AchievementKey.FIRST_ENROLLMENT);
    }
  }

  async recordLessonCompletion(
    userId: string,
    courseId: string,
    lessonId: string,
  ) {
    await this.ensureAchievementDefinitions();

    const priorCompletionEvent = await this.prisma.gamificationEvent.findFirst({
      where: {
        userId,
        eventType: 'LESSON_COMPLETED',
        lessonId,
      },
      select: { id: true },
    });

    if (!priorCompletionEvent) {
      await this.grantPoints(
        userId,
        LESSON_COMPLETE_XP,
        'LESSON_COMPLETED',
        courseId,
        lessonId,
      );
    }

    await this.touchDailyActivity(userId);

    const completionCount = await this.prisma.progress.count({
      where: {
        userId,
        completed: true,
      },
    });

    if (completionCount === 1) {
      await this.grantAchievement(
        userId,
        AchievementKey.FIRST_LESSON_COMPLETION,
      );
    }
  }

  async recordCourseCompletion(
    userId: string,
    courseId: string,
    progress: number,
  ) {
    if (progress < 100) {
      return;
    }

    const priorEvent = await this.prisma.gamificationEvent.findFirst({
      where: {
        userId,
        eventType: 'COURSE_COMPLETED',
        courseId,
      },
      select: { id: true },
    });
    if (priorEvent) {
      return;
    }

    await this.grantPoints(
      userId,
      COURSE_COMPLETE_XP,
      'COURSE_COMPLETED',
      courseId,
      null,
    );
    await this.grantAchievement(userId, AchievementKey.COURSE_COMPLETED);
  }

  private async touchDailyActivity(userId: string) {
    const today = this.asUtcDateOnly(new Date());

    const profile = await this.prisma.userGamificationProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const lastDate = profile.lastActiveDate
      ? this.asUtcDateOnly(profile.lastActiveDate)
      : null;

    if (lastDate && lastDate.getTime() === today.getTime()) {
      return;
    }

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    let nextStreak = 1;
    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
      nextStreak = profile.streakDays + 1;
    }

    const longestStreak = Math.max(profile.longestStreak, nextStreak);

    await this.prisma.userGamificationProfile.update({
      where: { userId },
      data: {
        streakDays: nextStreak,
        longestStreak,
        lastActiveDate: today,
      },
    });

    await this.grantPoints(
      userId,
      DAILY_ACTIVITY_XP,
      'DAILY_ACTIVITY',
      null,
      null,
    );

    if (nextStreak >= 3) {
      await this.grantAchievement(userId, AchievementKey.STREAK_3_DAYS);
    }
    if (nextStreak >= 7) {
      await this.grantAchievement(userId, AchievementKey.STREAK_7_DAYS);
    }
  }

  private async grantAchievement(userId: string, key: AchievementKey) {
    const def = await this.prisma.achievementDefinition.findUnique({
      where: { key },
      select: {
        id: true,
        xpReward: true,
      },
    });
    if (!def) {
      return;
    }

    try {
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: def.id,
        },
      });
    } catch {
      return;
    }

    if (def.xpReward > 0) {
      await this.grantPoints(
        userId,
        def.xpReward,
        `ACHIEVEMENT_${key}`,
        null,
        null,
      );
    }
  }

  private async grantPoints(
    userId: string,
    points: number,
    eventType: string,
    courseId: string | null,
    lessonId: string | null,
  ) {
    if (points <= 0) {
      return;
    }

    await this.prisma.gamificationEvent.create({
      data: {
        userId,
        eventType,
        points,
        courseId,
        lessonId,
      },
    });

    const profile = await this.prisma.userGamificationProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const xp = profile.xp + points;
    const level = this.calculateLevel(xp);

    await this.prisma.userGamificationProfile.update({
      where: { userId },
      data: {
        xp,
        level,
      },
    });
  }

  private calculateLevel(xp: number) {
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  }

  private asUtcDateOnly(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private async ensureAchievementDefinitions() {
    const keys = Object.keys(ACHIEVEMENT_SEED) as AchievementKey[];
    for (const key of keys) {
      const item = ACHIEVEMENT_SEED[key];
      await this.prisma.achievementDefinition.upsert({
        where: { key },
        update: {
          title: item.title,
          description: item.description,
          xpReward: item.xpReward,
        },
        create: {
          key,
          title: item.title,
          description: item.description,
          xpReward: item.xpReward,
        },
      });
    }
  }
}
