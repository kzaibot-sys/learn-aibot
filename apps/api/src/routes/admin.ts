import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { grantCourseAccess, revokeCourseAccess } from '../services/enrollment';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// ===== COURSES =====

// GET /api/admin/courses
router.get('/courses', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.course.count(),
  ]);

  res.json({
    success: true,
    data: courses.map(c => ({ ...c, price: c.price.toString() })),
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}));

// POST /api/admin/courses
router.post('/courses', asyncHandler(async (req: Request, res: Response) => {
  const { title, slug, description, price, currency, isFree, coverUrl } = req.body;

  if (!title || !slug || price === undefined) {
    throw new AppError(400, 'VALIDATION_ERROR', 'title, slug, and price are required');
  }

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description: description || null,
      price,
      currency: currency || 'RUB',
      isFree: isFree || false,
      coverUrl: coverUrl || null,
    },
  });

  res.status(201).json({ success: true, data: { ...course, price: course.price.toString() } });
}));

// PATCH /api/admin/courses/:id
router.patch('/courses/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, description, price, currency, isFree, isPublished, coverUrl } = req.body;

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(currency !== undefined && { currency }),
      ...(isFree !== undefined && { isFree }),
      ...(isPublished !== undefined && { isPublished }),
      ...(coverUrl !== undefined && { coverUrl }),
    },
  });

  res.json({ success: true, data: { ...course, price: course.price.toString() } });
}));

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ===== MODULES =====

// POST /api/admin/courses/:courseId/modules
router.post('/courses/:courseId/modules', asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, description, order } = req.body;

  if (!title) {
    throw new AppError(400, 'VALIDATION_ERROR', 'title is required');
  }

  const mod = await prisma.module.create({
    data: { courseId, title, description: description || null, order: order ?? 0 },
  });

  res.status(201).json({ success: true, data: mod });
}));

// PATCH /api/admin/modules/:id
router.patch('/modules/:id', asyncHandler(async (req: Request, res: Response) => {
  const { title, description, order, isPublished } = req.body;

  const mod = await prisma.module.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  res.json({ success: true, data: mod });
}));

// DELETE /api/admin/modules/:id
router.delete('/modules/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.module.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ===== LESSONS =====

// POST /api/admin/modules/:moduleId/lessons
router.post('/modules/:moduleId/lessons', asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const { title, description, type, videoUrl, videoKey, duration, content, order, isFree } = req.body;

  if (!title) {
    throw new AppError(400, 'VALIDATION_ERROR', 'title is required');
  }

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      description: description || null,
      type: type || 'VIDEO',
      videoUrl: videoUrl || null,
      videoKey: videoKey || null,
      duration: duration || null,
      content: content || null,
      order: order ?? 0,
      isFree: isFree || false,
    },
  });

  res.status(201).json({ success: true, data: lesson });
}));

// PATCH /api/admin/lessons/:id
router.patch('/lessons/:id', asyncHandler(async (req: Request, res: Response) => {
  const { title, description, type, videoUrl, videoKey, duration, content, order, isFree, isPublished } = req.body;

  const lesson = await prisma.lesson.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(videoKey !== undefined && { videoKey }),
      ...(duration !== undefined && { duration }),
      ...(content !== undefined && { content }),
      ...(order !== undefined && { order }),
      ...(isFree !== undefined && { isFree }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  res.json({ success: true, data: lesson });
}));

// DELETE /api/admin/lessons/:id
router.delete('/lessons/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.lesson.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ===== STUDENTS =====

// GET /api/admin/students
router.get('/students', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
  const search = (req.query.search as string) || '';

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: students,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}));

// ===== ENROLLMENT MANAGEMENT =====

// POST /api/admin/enrollments/grant
router.post('/enrollments/grant', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'userId and courseId are required');
  }
  await grantCourseAccess(userId, courseId);
  res.json({ success: true });
}));

// POST /api/admin/enrollments/revoke
router.post('/enrollments/revoke', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'userId and courseId are required');
  }
  await revokeCourseAccess(userId, courseId);
  res.json({ success: true });
}));

// ===== PAYMENTS =====

// GET /api/admin/payments
router.get('/payments', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
  const status = req.query.status as string | undefined;

  const where = status ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' } : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    data: payments.map(p => ({ ...p, amount: p.amount.toString() })),
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}));

// ===== NOTIFICATIONS =====

// POST /api/admin/notifications — send notification to all users
router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    throw new AppError(400, 'VALIDATION_ERROR', 'title and message are required');
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      title,
      message,
      type: type || 'info',
    })),
  });

  res.json({ success: true, data: { sentTo: users.length } });
}));

export { router as adminRouter };
