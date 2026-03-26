import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateCertificatePDF } from '../services/certificate';
import { uploadFile, getSignedUrl } from '../services/storage';

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

  // Generate certificate
  const now = new Date();
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const number = `CERT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${hex}`;

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
      user: { select: { firstName: true, lastName: true } },
    },
  });

  // Get course titles
  const courseIds = certificates.map(c => c.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });
  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  const data = certificates.map(cert => ({
    ...cert,
    courseTitle: courseMap.get(cert.courseId) || 'Unknown',
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

// GET /api/certificates/:id/download — download certificate PDF (authenticated)
router.get('/:id/download', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

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
