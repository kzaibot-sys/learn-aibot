import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  searchUsers(query: string, viewerUserId: string, limit = 12) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return Promise.resolve([]);
    }

    return this.prisma.user.findMany({
      where: {
        id: { not: viewerUserId },
        OR: [
          { email: { contains: trimmed, mode: 'insensitive' } },
          { firstName: { contains: trimmed, mode: 'insensitive' } },
          { lastName: { contains: trimmed, mode: 'insensitive' } },
          { id: trimmed },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      take: Math.max(1, Math.min(25, limit)),
      orderBy: { createdAt: 'desc' },
    });
  }

  createStudent(
    email: string,
    passwordHash: string,
    firstName?: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        role: Role.STUDENT,
      },
    });
  }

  updateProfile(
    id: string,
    payload: { firstName?: string; lastName?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: payload,
    });
  }

  updateRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  listEnrollmentsByUserId(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        progress: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            category: true,
            level: true,
            language: true,
            priceCents: true,
            status: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async getDashboardSummary(userId: string) {
    const [profile, enrollments, activity, gamification, achievements] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        }),
        this.prisma.enrollment.findMany({
          where: { userId },
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                category: true,
                level: true,
                language: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        }),
        this.prisma.gamificationEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            eventType: true,
            points: true,
            courseId: true,
            lessonId: true,
            createdAt: true,
          },
        }),
        this.prisma.userGamificationProfile.findUnique({
          where: { userId },
          select: {
            xp: true,
            level: true,
            streakDays: true,
            longestStreak: true,
            lastActiveDate: true,
          },
        }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          orderBy: { awardedAt: 'desc' },
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
        }),
      ]);

    const totalProgress = enrollments.reduce(
      (sum, item) => sum + item.progress,
      0,
    );
    const completedCourses = enrollments.filter(
      (item) => item.progress >= 100,
    ).length;

    return {
      profile,
      stats: {
        enrolledCourses: enrollments.length,
        completedCourses,
        averageProgress:
          enrollments.length > 0
            ? Number((totalProgress / enrollments.length).toFixed(2))
            : 0,
      },
      gamification: gamification ?? {
        xp: 0,
        level: 1,
        streakDays: 0,
        longestStreak: 0,
        lastActiveDate: null,
      },
      enrollments: enrollments.map((item) => ({
        id: item.id,
        progress: item.progress,
        enrolledAt: item.enrolledAt,
        course: item.course,
      })),
      achievements: achievements.map((award) => ({
        key: award.achievement.key,
        title: award.achievement.title,
        description: award.achievement.description,
        xpReward: award.achievement.xpReward,
        awardedAt: award.awardedAt,
      })),
      recentActivity: activity,
    };
  }
}
