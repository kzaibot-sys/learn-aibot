import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateCertificatePDF } from '../services/certificate';
import { uploadFile, getSignedUrl } from '../services/storage';
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

  const fullName = `${firstName} ${lastName}`;
  const pdfBuffer = await generateCertificatePDF({
    fullName,
    courseTitle: course.title,
    certificateNumber: number,
    issuedDate: now,
  });

  // Upload to S3
  const key = `certificates/${userId}/${courseId}/${number}.pdf`;
  const fileUrl = await uploadFile(pdfBuffer, key, 'application/pdf');

  // Save to DB
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      number,
      fileUrl,
    },
  });

  res.status(201).json({ success: true, data: certificate });
}));

// GET /api/certificates/my — list user's certificates (authenticated)
router.get('/my', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

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

  res.json({ success: true, data });
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

// GET /api/certificates/:id/download — download certificate PDF (authenticated via Bearer or ?token= query)
router.get('/:id/download', asyncHandler(async (req: Request, res: Response) => {
  // Support token passed as query param for direct browser downloads
  if (!req.user && req.query.token) {
    try {
      const payload = jwt.verify(req.query.token as string, config.jwt.secret) as JwtPayload;
      req.user = payload;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  }
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const userId = req.user.sub;

  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
  });

  if (!certificate || certificate.userId !== userId) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  if (!certificate.fileUrl) {
    throw new AppError(404, 'FILE_NOT_FOUND', 'Certificate file not found');
  }

  // If fileUrl is an S3 key (no http), generate signed URL
  if (!certificate.fileUrl.startsWith('http')) {
    const signedUrl = await getSignedUrl(certificate.fileUrl, 600);
    res.redirect(signedUrl);
    return;
  }

  res.redirect(certificate.fileUrl);
}));

export { router as certificatesRouter };
