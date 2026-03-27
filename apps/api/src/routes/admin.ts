import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '@lms/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { grantCourseAccess, revokeCourseAccess } from '../services/enrollment';
import { uploadFile } from '../services/storage';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../services/redis';

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only mp4, webm, mov files are allowed'));
    }
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only jpeg, png, webp files are allowed'));
    }
  },
});

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

  await cacheInvalidatePattern('courses:*');
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

  await cacheInvalidatePattern('courses:*');
  res.json({ success: true, data: { ...course, price: course.price.toString() } });
}));

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.course.delete({ where: { id: req.params.id } });
  await cacheInvalidatePattern('courses:*');
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

// GET /api/admin/lessons/:id
router.get('/lessons/:id', asyncHandler(async (req: Request, res: Response) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id },
    include: { module: { select: { courseId: true, title: true } } },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
  }

  res.json({ success: true, data: lesson });
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

  // Try cache first (60s, keyed by page + search)
  const cacheKey = `admin:students:${page}:${search}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

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

  const response = {
    success: true,
    data: students,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };

  await cacheSet(cacheKey, response, 60);
  res.json(response);
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

// ===== FILE UPLOADS =====

// POST /api/admin/lessons/:lessonId/upload-video
router.post('/lessons/:lessonId/upload-video', videoUpload.single('video'), asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const file = req.file;

  if (!file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Video file is required');
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
  }

  const ext = file.originalname.split('.').pop() || 'mp4';
  const key = `videos/${lesson.module.courseId}/${lessonId}/${Date.now()}.${ext}`;
  const videoUrl = await uploadFile(file.buffer, key, file.mimetype);

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: { videoUrl, videoKey: key },
  });

  res.json({ success: true, data: updated });
}));

// POST /api/admin/upload-image
router.post('/upload-image', imageUpload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
  }

  const ext = file.originalname.split('.').pop() || 'jpg';
  const key = `images/${Date.now()}.${ext}`;
  const url = await uploadFile(file.buffer, key, file.mimetype);

  res.json({ success: true, data: { url } });
}));

// ===== REORDER =====

// PATCH /api/admin/modules/reorder
router.patch('/modules/reorder', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; order: number }[] };

  if (!items || !Array.isArray(items)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'items array is required');
  }

  await prisma.$transaction(
    items.map(item => prisma.module.update({ where: { id: item.id }, data: { order: item.order } }))
  );

  res.json({ success: true });
}));

// PATCH /api/admin/lessons/reorder
router.patch('/lessons/reorder', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; order: number }[] };

  if (!items || !Array.isArray(items)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'items array is required');
  }

  await prisma.$transaction(
    items.map(item => prisma.lesson.update({ where: { id: item.id }, data: { order: item.order } }))
  );

  res.json({ success: true });
}));

// ===== COURSE ENROLLMENTS =====

// GET /api/admin/courses/:courseId/enrollments
router.get('/courses/:courseId/enrollments', asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.enrollment.count({ where: { courseId } }),
  ]);

  res.json({
    success: true,
    data: enrollments,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}));

// ===== CERTIFICATES =====

// GET /api/admin/certificates — list all certificates with student and course info
router.get('/certificates', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
  const search = (req.query.search as string) || '';

  const where = search
    ? {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { issuedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        course: { select: { id: true, title: true } },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  const data = certificates.map(cert => ({
    id: cert.id,
    number: cert.number,
    studentName: [cert.user.firstName, cert.user.lastName].filter(Boolean).join(' ') || cert.user.email || '—',
    studentEmail: cert.user.email,
    courseTitle: cert.course.title,
    courseId: cert.course.id,
    issuedAt: cert.issuedAt,
    fileUrl: cert.fileUrl,
  }));

  res.json({
    success: true,
    data,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}));

// ===== ANALYTICS =====

// GET /api/admin/analytics
router.get('/analytics', asyncHandler(async (req: Request, res: Response) => {
  // Try cache first (120s)
  const analyticsCacheKey = 'admin:analytics';
  const cachedAnalytics = await cacheGet<unknown>(analyticsCacheKey);
  if (cachedAnalytics) {
    res.json(cachedAnalytics);
    return;
  }

  const [totalStudents, totalCourses, courses, recentRegistrations] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.course.count(),
    prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true, title: true, slug: true,
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          select: { userId: true },
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        role: 'STUDENT',
      },
    }),
  ]);

  // Calculate progress per course
  const courseStats = await Promise.all(courses.map(async (course) => {
    const lessonCount = await prisma.lesson.count({
      where: { module: { courseId: course.id }, isPublished: true },
    });

    const enrolledUserIds = course.enrollments.map(e => e.userId);
    let avgProgress = 0;

    if (enrolledUserIds.length > 0 && lessonCount > 0) {
      const completedCounts = await prisma.lessonProgress.groupBy({
        by: ['userId'],
        where: {
          userId: { in: enrolledUserIds },
          lesson: { module: { courseId: course.id } },
          completed: true,
        },
        _count: { _all: true },
      });

      const totalProgress = completedCounts.reduce((sum, c) => sum + (c._count._all / lessonCount) * 100, 0);
      avgProgress = Math.round(totalProgress / enrolledUserIds.length);
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      enrolledCount: course._count.enrollments,
      avgProgress,
      totalLessons: lessonCount,
    };
  }));

  const analyticsResponse = {
    success: true,
    data: {
      totalStudents,
      totalCourses,
      recentRegistrations,
      courses: courseStats,
    },
  };

  await cacheSet(analyticsCacheKey, analyticsResponse, 120);
  res.json(analyticsResponse);
}));

export { router as adminRouter };
