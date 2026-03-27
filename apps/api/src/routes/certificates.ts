import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateCertificatePDF } from '../services/certificate';
import { cacheGet, cacheSet, cacheDelete } from '../services/redis';
import { config } from '../config';
import type { JwtPayload } from '@lms/shared';

const router = Router();

// POST /api/certificates/request/:courseId — request certificate (authenticated)
router.post('/request/:courseId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { courseId } = req.params;
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    throw new AppError(400, 'VALIDATION_ERROR', 'firstName and lastName are required');
  }

  // Check course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  // Check if certificate already exists
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    res.json({ success: true, data: existing });
    return;
  }

  // Verify 100% completion
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId }, isPublished: true },
    select: { id: true },
  });

  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: lessons.map(l => l.id) },
      completed: true,
    },
  });

  if (lessons.length === 0 || completedCount < lessons.length) {
    throw new AppError(403, 'COURSE_NOT_COMPLETED', `Course not completed. ${completedCount}/${lessons.length} lessons done.`);
  }

  // Generate certificate number: AIBOT-XXXXX-XXXX (uppercase alphanumeric)
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSegment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map(b => charset[b % charset.length])
      .join('');
  const number = `AIBOT-${randomSegment(5)}-${randomSegment(4)}`;
  const now = new Date();

  // Save to DB (PDF is generated on-the-fly at download time)
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      number,
      fileUrl: null,
    },
  });

  // Invalidate user's certificate cache
  await cacheDelete(`certs:${userId}`);

  res.status(201).json({ success: true, data: certificate });
}));

// GET /api/certificates/my — list user's certificates (authenticated)
router.get('/my', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  // Try cache first (60s per user)
  const certsCacheKey = `certs:${userId}`;
  const cachedCerts = await cacheGet<unknown>(certsCacheKey);
  if (cachedCerts) {
    res.json(cachedCerts);
    return;
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  const data = certificates.map(cert => ({
    id: cert.id,
    courseId: cert.courseId,
    courseTitle: cert.course.title,
    number: cert.number,
    fileUrl: cert.fileUrl,
    issuedAt: cert.issuedAt,
  }));

  const certsResponse = { success: true, data };
  await cacheSet(certsCacheKey, certsResponse, 60);
  res.json(certsResponse);
}));

// GET /api/certificates/verify/:number — public verification (no auth)
router.get('/verify/:number', asyncHandler(async (req: Request, res: Response) => {
  const { number } = req.params;

  const certificate = await prisma.certificate.findUnique({
    where: { number },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!certificate) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  const course = await prisma.course.findUnique({
    where: { id: certificate.courseId },
    select: { title: true },
  });

  res.json({
    success: true,
    data: {
      number: certificate.number,
      fullName: `${certificate.user.firstName || ''} ${certificate.user.lastName || ''}`.trim(),
      courseTitle: course?.title || 'Unknown',
      issuedAt: certificate.issuedAt,
    },
  });
}));

// GET /api/certificates/:id/download — generate PDF on-the-fly and stream to client
router.get('/:id/download', asyncHandler(async (req: Request, res: Response) => {
  // Support token via query param for direct browser downloads
  let userId: string;
  if (req.query.token) {
    try {
      const payload = jwt.verify(req.query.token as string, config.jwt.secret) as JwtPayload;
      userId = payload.sub;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  } else {
    // Try Bearer token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    try {
      const payload = jwt.verify(authHeader.split(' ')[1], config.jwt.secret) as JwtPayload;
      userId = payload.sub;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    include: {
      course: { select: { title: true } },
      user: { select: { firstName: true, lastName: true, middleName: true } },
    },
  });

  if (!certificate || certificate.userId !== userId) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  const fullName = [certificate.user.firstName, certificate.user.middleName, certificate.user.lastName]
    .filter(Boolean).join(' ') || 'Студент';

  const pdfBuffer = await generateCertificatePDF({
    fullName,
    courseTitle: certificate.course.title,
    certificateNumber: certificate.number,
    issuedDate: certificate.issuedAt,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.number}.pdf"`);
  res.send(pdfBuffer);
}));

export { router as certificatesRouter };
