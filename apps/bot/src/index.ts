import { Bot, webhookCallback } from 'grammy';
import express from 'express';
import { prisma } from '@lms/database';
import { config } from './config';
import { handleTextMessage } from './handlers/message';
import { handleBuyCallback } from './handlers/payment';

const bot = new Bot(config.telegram.botToken);

// /start command
bot.command('start', async (ctx) => {
  const firstName = ctx.from?.first_name || 'друг';
  await ctx.reply(
    `Привет, ${firstName}! 👋\n\nЯ — помощник образовательной платформы. Могу рассказать о курсах, помочь с оплатой или ответить на вопросы.\n\nВыберите действие:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Курсы', callback_data: 'list_courses' }],
          [{ text: 'Задать вопрос', callback_data: 'ask_question' }],
        ],
      },
    },
  );
});

// /help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    'Доступные команды:\n\n' +
    '/start — начать\n' +
    '/courses — список курсов\n' +
    '/my — мои курсы\n' +
    '/help — помощь',
  );
});

// /courses command
bot.command('courses', async (ctx) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });

  if (courses.length === 0) {
    await ctx.reply('Пока нет доступных курсов.');
    return;
  }

  const text = courses
    .map((c, i) => `${i + 1}. *${c.title}*\n${c.description || ''}\nЦена: ${c.isFree ? 'Бесплатно' : `${c.price} ${c.currency}`}`)
    .join('\n\n');

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: courses.map(c => ([
        { text: `${c.isFree ? 'Получить' : 'Купить'}: ${c.title}`, callback_data: `buy_${c.id}` },
      ])),
    },
  });
});

// /my command — user's enrolled courses
bot.command('my', async (ctx) => {
  const telegramId = String(ctx.from!.id);

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: {
      user: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { course: true },
          },
        },
      },
    },
  });

  if (!tgAccount || tgAccount.user.enrollments.length === 0) {
    await ctx.reply('У вас пока нет купленных курсов. Используйте /courses чтобы посмотреть доступные.');
    return;
  }

  const text = tgAccount.user.enrollments
    .map((e, i) => `${i + 1}. *${e.course.title}*`)
    .join('\n');

  await ctx.reply(`Ваши курсы:\n\n${text}`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: 'Открыть платформу', web_app: { url: config.telegram.miniAppUrl } },
      ]],
    },
  });
});

// Callback: list courses
bot.callbackQuery('list_courses', async (ctx) => {
  await ctx.answerCallbackQuery();
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });

  if (courses.length === 0) {
    await ctx.reply('Пока нет доступных курсов.');
    return;
  }

  await ctx.reply('Доступные курсы:', {
    reply_markup: {
      inline_keyboard: courses.map(c => ([
        { text: `${c.title} — ${c.isFree ? 'Бесплатно' : `${c.price} ${c.currency}`}`, callback_data: `buy_${c.id}` },
      ])),
    },
  });
});

// Callback: ask question — just prompt the user
bot.callbackQuery('ask_question', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('Напишите ваш вопрос, и я постараюсь помочь!');
});

// Callback: buy course
bot.callbackQuery(/^buy_/, handleBuyCallback);

// All text messages → AI handler
bot.on('message:text', handleTextMessage);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start: webhook mode for production, polling for development
async function start(): Promise<void> {
  if (config.telegram.webhookUrl) {
    // Webhook mode
    const app = express();
    app.use(express.json());
    app.post('/webhook', webhookCallback(bot, 'express'));
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    const port = Number(process.env.BOT_PORT || 3002);
    app.listen(port, () => {
      console.log(`Bot webhook server running on port ${port}`);
    });

    await bot.api.setWebhook(config.telegram.webhookUrl);
    console.log(`Webhook set to: ${config.telegram.webhookUrl}`);
  } else {
    // Polling mode for development
    console.log('Starting bot in polling mode...');
    await bot.start();
  }
}

start().catch(console.error);
