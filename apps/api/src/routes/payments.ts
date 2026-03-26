import { Router, Request, Response } from 'express';
import { prisma } from '@lms/database';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { createYooKassaPayment, verifyYooKassaWebhook } from '../services/yookassa';
import { createStripePayment, verifyStripeWebhook } from '../services/stripe';
import { grantCourseAccess } from '../services/enrollment';
import { config } from '../config';

const router = Router();

// POST /api/payments/create
router.post('/create', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!config.payment.enabled) {
    throw new AppError(403, 'PAYMENTS_DISABLED', 'Payments are currently disabled');
  }

  const userId = req.user!.sub;
  const { courseId, provider } = req.body;

  if (!courseId || !provider) {
    throw new AppError(400, 'VALIDATION_ERROR', 'courseId and provider are required');
  }

  if (provider !== 'YOOKASSA' && provider !== 'STRIPE') {
    throw new AppError(400, 'VALIDATION_ERROR', 'provider must be YOOKASSA or STRIPE');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  if (course.isFree) {
    await grantCourseAccess(userId, courseId);
    res.json({ success: true, data: { free: true } });
    return;
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing?.status === 'ACTIVE') {
    throw new AppError(409, 'ALREADY_ENROLLED', 'You are already enrolled in this course');
  }

  const metadata = { userId, courseId };
  const returnUrl = `${config.app.url}/courses/${course.slug}`;

  let paymentUrl: string;
  let providerPaymentId: string;

  if (provider === 'YOOKASSA') {
    const result = await createYooKassaPayment({
      amount: course.price.toString(),
      currency: course.currency,
      description: `Курс: ${course.title}`,
      returnUrl,
      metadata,
    });
    paymentUrl = result.confirmation.confirmation_url;
    providerPaymentId = result.id;
  } else {
    const amountInSmallest = Math.round(Number(course.price) * 100);
    const result = await createStripePayment({
      amount: amountInSmallest,
      currency: course.currency,
      courseTitle: course.title,
      successUrl: `${returnUrl}?payment=success`,
      cancelUrl: `${returnUrl}?payment=cancel`,
      metadata,
    });
    paymentUrl = result.url;
    providerPaymentId = result.id;
  }

  await prisma.payment.create({
    data: {
      userId,
      courseId,
      amount: course.price,
      currency: course.currency,
      provider,
      providerPaymentId,
      status: 'PENDING',
    },
  });

  res.json({ success: true, data: { paymentUrl, paymentId: providerPaymentId } });
}));

// POST /api/payments/yookassa/webhook
router.post('/yookassa/webhook', asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;

  if (!verifyYooKassaWebhook(body)) {
    throw new AppError(400, 'INVALID_WEBHOOK', 'Invalid webhook payload');
  }

  const event = body.event as string;
  const paymentObject = body.object as Record<string, unknown>;
  const providerPaymentId = paymentObject.id as string;

  if (event === 'payment.succeeded') {
    const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });

    if (payment && payment.status === 'PENDING') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          providerData: paymentObject as Record<string, never>,
        },
      });

      await grantCourseAccess(payment.userId, payment.courseId);
    }
  }

  res.json({ success: true });
}));

// POST /api/payments/stripe/webhook
router.post('/stripe/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody) {
    throw new AppError(400, 'MISSING_RAW_BODY', 'Raw body is required for webhook verification');
  }

  const event = verifyStripeWebhook(rawBody, signature);
  if (!event) {
    throw new AppError(400, 'INVALID_WEBHOOK', 'Invalid webhook signature');
  }

  const eventType = event.type as string;

  if (eventType === 'checkout.session.completed') {
    const session = event.data as Record<string, unknown>;
    const sessionObject = (session as Record<string, Record<string, unknown>>).object;
    const providerPaymentId = sessionObject.id as string;

    const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });

    if (payment && payment.status === 'PENDING') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          providerData: sessionObject as Record<string, never>,
        },
      });

      await grantCourseAccess(payment.userId, payment.courseId);
    }
  }

  res.json({ success: true });
}));

export { router as paymentsRouter };
