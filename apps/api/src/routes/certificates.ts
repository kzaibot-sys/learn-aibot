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

/**
 * @openapi
 * /certificates/request/{courseId}:
 *   post:
 *     tags: [Certificates]
 *     summary: Request certificate for completed course
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *         description: Course ID
 *     responses:
 *       201: { description: Certificate created }
 *       403: { description: Course not fully completed }
 *       404: { description: Course not found }
 *       409: { description: Certificate already exists }
 */
router.post('/request/:courseId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { courseId } = req.params;

  // Check course exists
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  // Check if certificate already exists — once created, it cannot be regenerated
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    throw new AppError(409, 'CERTIFICATE_EXISTS', 'Certificate already exists');
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

  // Get user profile for fullName (locked at certificate creation time)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastName: true, firstName: true, middleName: true },
  });
  const fullName = [user?.lastName, user?.firstName, user?.middleName]
    .filter(Boolean).join(' ') || 'Студент';

  // Generate certificate number: AIBOT-XXXXX-XXXX (uppercase alphanumeric)
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSegment = (len: number) =>
    Array.from(crypto.randomBytes(len))
      .map(b => charset[b % charset.length])
      .join('');
  const number = `AIBOT-${randomSegment(5)}-${randomSegment(4)}`;

  // Save to DB with locked fullName (PDF is generated on-the-fly at download time)
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      number,
      fullName,
      fileUrl: null,
    },
  });

  // Invalidate user's certificate cache
  await cacheDelete(`certs:${userId}`);

  res.status(201).json({ success: true, data: certificate });
}));

/**
 * @openapi
 * /certificates/my:
 *   get:
 *     tags: [Certificates]
 *     summary: List current user's certificates
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: List of user certificates }
 */
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

/**
 * @openapi
 * /certificates/verify/{number}:
 *   get:
 *     tags: [Certificates]
 *     summary: Verify certificate by number (public, no auth)
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: string }
 *         description: Certificate number (e.g. AIBOT-XXXXX-XXXX)
 *     responses:
 *       200: { description: Certificate verification details }
 *       404: { description: Certificate not found }
 */
router.get('/verify/:number', asyncHandler(async (req: Request, res: Response) => {
  const { number } = req.params;

  const certificate = await prisma.certificate.findUnique({
    where: { number },
    include: {
      user: { select: { firstName: true, lastName: true, middleName: true } },
      course: { select: { title: true } },
    },
  });

  if (!certificate) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  // Use locked fullName; fall back to user profile for legacy certs
  const fullName = certificate.fullName
    || [certificate.user.lastName, certificate.user.firstName, certificate.user.middleName]
        .filter(Boolean).join(' ')
    || 'Студент';

  res.json({
    success: true,
    data: {
      number: certificate.number,
      fullName,
      courseTitle: certificate.course?.title || 'Unknown',
      issuedAt: certificate.issuedAt,
    },
  });
}));

/**
 * @openapi
 * /certificates/{id}/download:
 *   get:
 *     tags: [Certificates]
 *     summary: Download certificate as PDF
 *     description: Supports Bearer token in header or token query parameter for direct browser downloads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ID
 *       - in: query
 *         name: token
 *         schema: { type: string }
 *         description: JWT token (alternative to Bearer header for browser downloads)
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf: {}
 *       401: { description: Authentication required }
 *       404: { description: Certificate not found }
 */
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

  // Use locked fullName from certificate record; fall back to user profile for legacy certs
  const fullName = certificate.fullName
    || [certificate.user.lastName, certificate.user.firstName, certificate.user.middleName]
        .filter(Boolean).join(' ')
    || 'Студент';

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

/**
 * @openapi
 * /certificates/{id}/send-telegram:
 *   post:
 *     tags: [Certificates]
 *     summary: Generate certificate PDF and send via Telegram
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certificate ID
 *     responses:
 *       200: { description: Certificate sent to Telegram }
 *       400: { description: Telegram account not linked }
 *       404: { description: Certificate not found }
 *       502: { description: Failed to send via Telegram }
 *       503: { description: Telegram bot not configured }
 */
router.post('/:id/send-telegram', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    include: {
      course: { select: { title: true } },
      user: {
        select: {
          firstName: true, lastName: true, middleName: true,
          telegramAccount: { select: { telegramId: true } },
        },
      },
    },
  });

  if (!certificate || certificate.userId !== userId) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  const telegramId = certificate.user.telegramAccount?.telegramId;
  if (!telegramId) {
    throw new AppError(400, 'NO_TELEGRAM', 'Telegram account not linked');
  }

  const fullName = certificate.fullName
    || [certificate.user.lastName, certificate.user.firstName, certificate.user.middleName]
        .filter(Boolean).join(' ')
    || 'Студент';

  const pdfBuffer = await generateCertificatePDF({
    fullName,
    courseTitle: certificate.course.title,
    certificateNumber: certificate.number,
    issuedDate: certificate.issuedAt,
  });

  // Send PDF via Telegram Bot API
  const botToken = config.telegram.botToken;
  if (!botToken) {
    throw new AppError(503, 'BOT_NOT_CONFIGURED', 'Telegram bot not configured');
  }

  const FormData = (await import('node:buffer')).Buffer;
  const boundary = '----FormBoundary' + Date.now().toString(36);
  const fileName = `certificate-${certificate.number}.pdf`;
  const caption = `🎓 Сертификат: ${certificate.course.title}\n📋 ${fullName}\n🔢 ${certificate.number}`;

  // Build multipart form data manually
  const parts: Buffer[] = [];
  // chat_id
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${telegramId}\r\n`));
  // caption
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
  // document (PDF file)
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`));
  parts.push(pdfBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const tgResult = await tgResponse.json() as { ok: boolean; description?: string };

  if (!tgResult.ok) {
    console.error('[Certificate] Telegram send failed:', tgResult);
    throw new AppError(502, 'TELEGRAM_SEND_FAILED', 'Failed to send certificate via Telegram');
  }

  res.json({ success: true, data: { sent: true, telegramId } });
}));

export { router as certificatesRouter };
