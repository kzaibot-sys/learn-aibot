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

/**
 * @openapi
 * /bot/users:
 *   post:
 *     tags: [Bot API]
 *     summary: Create user with TelegramAccount
 *     security: [{ BotSecret: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegramId, firstName]
 *             properties:
 *               telegramId: { type: string, example: "123456789" }
 *               firstName: { type: string, example: "John" }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       201: { description: User created }
 *       200: { description: User already exists }
 */
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

/**
 * @openapi
 * /bot/users/{telegramId}:
 *   get:
 *     tags: [Bot API]
 *     summary: Get user by Telegram ID
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User profile }
 *       404: { description: User not found }
 */
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

/**
 * @openapi
 * /bot/users/{telegramId}:
 *   patch:
 *     tags: [Bot API]
 *     summary: Update user profile
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               middleName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Updated user }
 */
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

/**
 * @openapi
 * /bot/grant-access:
 *   post:
 *     tags: [Bot API]
 *     summary: Grant course access to user
 *     security: [{ BotSecret: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegramId, courseSlug]
 *             properties:
 *               telegramId: { type: string }
 *               courseSlug: { type: string }
 *     responses:
 *       200: { description: Access granted }
 */
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

/**
 * @openapi
 * /bot/revoke-access:
 *   post:
 *     tags: [Bot API]
 *     summary: Revoke course access
 *     security: [{ BotSecret: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegramId, courseSlug]
 *             properties:
 *               telegramId: { type: string }
 *               courseSlug: { type: string }
 *     responses:
 *       200: { description: Access revoked }
 */
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

/**
 * @openapi
 * /bot/users/{telegramId}/enrollments:
 *   get:
 *     tags: [Bot API]
 *     summary: List user enrollments
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Active enrollments }
 */
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

/**
 * @openapi
 * /bot/courses:
 *   get:
 *     tags: [Bot API]
 *     summary: List published courses
 *     security: [{ BotSecret: [] }]
 *     responses:
 *       200: { description: Course list }
 */
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

/**
 * @openapi
 * /bot/courses/{slug}:
 *   get:
 *     tags: [Bot API]
 *     summary: Get course details
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course with modules and lessons }
 *       404: { description: Course not found }
 */
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

/**
 * @openapi
 * /bot/users/{telegramId}/progress/{courseSlug}:
 *   get:
 *     tags: [Bot API]
 *     summary: Get user progress in course
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: courseSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Progress data }
 */
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

/**
 * @openapi
 * /bot/stats:
 *   get:
 *     tags: [Bot API]
 *     summary: Platform statistics
 *     security: [{ BotSecret: [] }]
 *     responses:
 *       200: { description: Stats (totalUsers, totalEnrollments, activeCourses) }
 */
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalEnrollments, activeCourses] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  res.json({ success: true, data: { totalUsers, totalEnrollments, activeCourses } });
}));

/**
 * @openapi
 * /bot/notifications:
 *   post:
 *     tags: [Bot API]
 *     summary: Send notification to user
 *     security: [{ BotSecret: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegramId, title, message]
 *             properties:
 *               telegramId: { type: string }
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       200: { description: Notification created }
 */
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

/**
 * @openapi
 * /bot/users/{telegramId}/certificates:
 *   get:
 *     tags: [Bot API]
 *     summary: List user certificates
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificates list }
 */
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

/**
 * @openapi
 * /bot/certificates/verify/{number}:
 *   get:
 *     tags: [Bot API]
 *     summary: Verify certificate by number
 *     security: [{ BotSecret: [] }]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate valid }
 *       404: { description: Certificate not found }
 */
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
