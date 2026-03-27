import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@lms/database';
import { requireBotSecret } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { cacheDelete } from '../services/redis';

const router = Router();

// All bot routes require X-Bot-Secret header
router.use(requireBotSecret);

// POST /api/bot/users — create user + TelegramAccount
router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, firstName, lastName, phone, email, password } = req.body;

  if (!telegramId || !firstName) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and firstName are required');
  }

  const tgId = String(telegramId);

  // Check if TelegramAccount already exists
  const existing = await prisma.telegramAccount.findUnique({
    where: { telegramId: tgId },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, middleName: true, phone: true, role: true, isActive: true, createdAt: true } } },
  });

  if (existing) {
    res.json({ success: true, data: { user: existing.user, created: false } });
    return;
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const user = await prisma.user.create({
    data: {
      email: email || null,
      passwordHash,
      firstName,
      lastName: lastName || null,
      phone: phone || null,
      telegramAccount: {
        create: { telegramId: tgId, firstName, lastName: lastName || null },
      },
    },
    select: { id: true, email: true, firstName: true, lastName: true, middleName: true, phone: true, role: true, isActive: true, createdAt: true },
  });

  res.status(201).json({ success: true, data: { user, created: true } });
}));

// GET /api/bot/users/:telegramId
router.get('/users/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, middleName: true, phone: true, role: true, isActive: true, createdAt: true },
      },
    },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  res.json({ success: true, data: tgAccount.user });
}));

// PATCH /api/bot/users/:telegramId
router.patch('/users/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const { firstName, lastName, middleName, phone, email } = req.body;

  const user = await prisma.user.update({
    where: { id: tgAccount.userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(middleName !== undefined && { middleName }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, middleName: true, phone: true, role: true, isActive: true },
  });

  res.json({ success: true, data: user });
}));

// POST /api/bot/grant-access
router.post('/grant-access', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, courseSlug } = req.body;

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

  await prisma.notification.create({
    data: {
      userId: tgAccount.user.id,
      title: 'Доступ к курсу открыт',
      message: `Вам открыт доступ к курсу "${course.title}"`,
      type: 'success',
    },
  });

  await cacheDelete(`progress:${tgAccount.user.id}`);

  res.json({ success: true, data: { enrollment, userId: tgAccount.user.id } });
}));

// POST /api/bot/revoke-access
router.post('/revoke-access', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, courseSlug } = req.body;

  if (!telegramId || !courseSlug) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and courseSlug are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  await prisma.enrollment.update({
    where: { userId_courseId: { userId: tgAccount.userId, courseId: course.id } },
    data: { status: 'REVOKED' },
  });

  await cacheDelete(`progress:${tgAccount.userId}`);

  res.json({ success: true });
}));

// GET /api/bot/users/:telegramId/enrollments
router.get('/users/:telegramId/enrollments', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: tgAccount.userId, status: 'ACTIVE' },
    include: {
      course: { select: { id: true, slug: true, title: true, description: true, coverUrl: true } },
    },
  });

  res.json({ success: true, data: enrollments });
}));

// GET /api/bot/courses
router.get('/courses', asyncHandler(async (_req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true, slug: true, title: true, description: true, coverUrl: true,
      _count: { select: { modules: true, enrollments: true } },
      modules: {
        where: { isPublished: true },
        select: { _count: { select: { lessons: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, slug: c.slug, title: c.title, description: c.description, coverUrl: c.coverUrl,
      totalModules: c._count.modules,
      totalLessons: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
      enrollmentCount: c._count.enrollments,
    })),
  });
}));

// GET /api/bot/courses/:slug
router.get('/courses/:slug', asyncHandler(async (req: Request, res: Response) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug, isPublished: true },
    select: {
      id: true, slug: true, title: true, description: true, coverUrl: true,
      modules: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true, title: true, order: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, type: true, duration: true, order: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  res.json({ success: true, data: course });
}));

// GET /api/bot/users/:telegramId/progress/:courseSlug
router.get('/users/:telegramId/progress/:courseSlug', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({
    where: { slug: req.params.courseSlug },
    select: {
      id: true, title: true,
      modules: {
        where: { isPublished: true },
        select: { lessons: { where: { isPublished: true }, select: { id: true } } },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const completed = await prisma.lessonProgress.count({
    where: { userId: tgAccount.userId, lessonId: { in: allLessonIds }, completed: true },
  });

  res.json({
    success: true,
    data: {
      courseId: course.id,
      courseTitle: course.title,
      totalLessons: allLessonIds.length,
      completedLessons: completed,
      progressPercent: allLessonIds.length > 0 ? Math.round((completed / allLessonIds.length) * 100) : 0,
    },
  });
}));

// GET /api/bot/stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalEnrollments, activeCourses] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  res.json({ success: true, data: { totalUsers, totalEnrollments, activeCourses } });
}));

// POST /api/bot/notifications
router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, title, message } = req.body;

  if (!telegramId || !title || !message) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId, title, and message are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const notification = await prisma.notification.create({
    data: { userId: tgAccount.userId, title, message, type: 'info' },
  });

  res.json({ success: true, data: notification });
}));

// GET /api/bot/users/:telegramId/certificates
router.get('/users/:telegramId/certificates', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: tgAccount.userId },
    include: { course: { select: { title: true } } },
    orderBy: { issuedAt: 'desc' },
  });

  res.json({
    success: true,
    data: certificates.map(c => ({
      id: c.id, number: c.number, courseTitle: c.course.title, issuedAt: c.issuedAt,
    })),
  });
}));

// GET /api/bot/certificates/verify/:number
router.get('/certificates/verify/:number', asyncHandler(async (req: Request, res: Response) => {
  const cert = await prisma.certificate.findUnique({
    where: { number: req.params.number },
    include: {
      user: { select: { firstName: true, lastName: true, middleName: true } },
      course: { select: { title: true } },
    },
  });

  if (!cert) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  res.json({
    success: true,
    data: {
      number: cert.number,
      fullName: [cert.user.lastName, cert.user.firstName, cert.user.middleName].filter(Boolean).join(' '),
      courseTitle: cert.course.title,
      issuedAt: cert.issuedAt,
    },
  });
}));

export { router as botRouter };
