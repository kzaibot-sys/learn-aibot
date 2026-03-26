import { Context } from 'grammy';
import { prisma } from '@lms/database';
import { config } from '../config';
import { saveSession } from '../services/session';

export async function handleBuyCallback(ctx: Context): Promise<void> {
  const callbackData = ctx.callbackQuery?.data;
  if (!callbackData?.startsWith('buy_')) return;

  await ctx.answerCallbackQuery();

  const courseId = callbackData.replace('buy_', '');
  const telegramId = String(ctx.from!.id);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    await ctx.reply('Курс не найден.');
    return;
  }

  // Find or create user
  let tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { user: true },
  });

  if (!tgAccount) {
    const user = await prisma.user.create({
      data: {
        firstName: ctx.from!.first_name,
        lastName: ctx.from!.last_name || null,
        telegramAccount: {
          create: {
            telegramId,
            username: ctx.from!.username || null,
            firstName: ctx.from!.first_name,
            lastName: ctx.from!.last_name || null,
          },
        },
      },
    });

    tgAccount = await prisma.telegramAccount.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
  }

  const userId = tgAccount!.user.id;

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing?.status === 'ACTIVE') {
    await ctx.reply('Вы уже записаны на этот курс! Нажмите кнопку ниже, чтобы начать обучение.', {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Открыть курс', web_app: { url: config.telegram.miniAppUrl } },
        ]],
      },
    });
    return;
  }

  // Handle free courses
  if (course.isFree) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });

    await ctx.reply(`Доступ к курсу "${course.title}" открыт! Нажмите кнопку ниже.`, {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Открыть курс', web_app: { url: config.telegram.miniAppUrl } },
        ]],
      },
    });
    return;
  }

  // Create payment via YooKassa
  await saveSession(telegramId, { state: 'buying', selectedCourseId: courseId });

  try {
    const idempotenceKey = `${userId}_${courseId}_${Date.now()}`;

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${config.yookassa.shopId}:${config.yookassa.secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: { value: course.price.toString(), currency: course.currency },
        confirmation: { type: 'redirect', return_url: config.telegram.miniAppUrl },
        capture: true,
        description: `Курс: ${course.title}`,
        metadata: { userId, courseId },
      }),
    });

    if (!response.ok) {
      throw new Error(`YooKassa error: ${response.status}`);
    }

    const paymentData = await response.json() as { id: string; confirmation: { confirmation_url: string } };

    // Save payment record
    await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        currency: course.currency,
        provider: 'YOOKASSA',
        providerPaymentId: paymentData.id,
        status: 'PENDING',
      },
    });

    await ctx.reply(
      `Курс: *${course.title}*\nЦена: ${course.price} ${course.currency}\n\nНажмите кнопку ниже для оплаты:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Оплатить', url: paymentData.confirmation.confirmation_url },
          ]],
        },
      },
    );
  } catch (err) {
    console.error('Payment creation error:', err);
    await ctx.reply('Произошла ошибка при создании платежа. Попробуйте позже.');
  }
}
