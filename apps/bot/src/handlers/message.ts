import { Context } from 'grammy';
import { prisma } from '@lms/database';
import { buildSystemPrompt, getAIResponse } from '../services/ai';
import { saveSession } from '../services/session';

export async function handleTextMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const telegramId = String(ctx.from!.id);
  const firstName = ctx.from!.first_name || 'Пользователь';

  // Save user message to DB
  await prisma.chatMessage.create({
    data: {
      telegramId,
      role: 'USER',
      content: text,
    },
  });

  // Check if user has active enrollments
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: {
      user: {
        include: {
          enrollments: { where: { status: 'ACTIVE' } },
        },
      },
    },
  });

  const hasCourses = (tgAccount?.user?.enrollments?.length ?? 0) > 0;

  // Load chat history (last 20 messages)
  const history = await prisma.chatMessage.findMany({
    where: { telegramId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const chatHistory = history.map(msg => ({
    role: msg.role === 'USER' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  // Update session state
  await saveSession(telegramId, { state: 'chatting' });

  // Get AI response
  const systemPrompt = buildSystemPrompt({ hasCourses, firstName });
  const aiResponse = await getAIResponse(systemPrompt, chatHistory);

  // Save AI response to DB
  await prisma.chatMessage.create({
    data: {
      telegramId,
      role: 'ASSISTANT',
      content: aiResponse,
    },
  });

  // Send response, optionally with "Buy" button if not enrolled
  if (!hasCourses) {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      take: 3,
    });

    if (courses.length > 0) {
      await ctx.reply(aiResponse, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: courses.map(c => ([
            { text: `Купить: ${c.title}`, callback_data: `buy_${c.id}` },
          ])),
        },
      });
      return;
    }
  }

  await ctx.reply(aiResponse, { parse_mode: 'Markdown' });
}
