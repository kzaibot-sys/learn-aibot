import { prisma } from '@lms/database';
import { notifyUserAccessGranted } from './telegram';

export async function grantCourseAccess(userId: string, courseId: string): Promise<void> {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  // Notify via Telegram if user has linked account
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      telegramAccount: true,
    },
  });

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (user?.telegramAccount && course) {
    await notifyUserAccessGranted(user.telegramAccount.telegramId, course.title);
  }
}

export async function revokeCourseAccess(userId: string, courseId: string): Promise<void> {
  await prisma.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: { status: 'REVOKED' },
  });
}
