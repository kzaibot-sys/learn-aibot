import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SALES_PROMPT = `Ты — дружелюбный консультант образовательной платформы.
Твоя задача — помочь потенциальному студенту понять ценность курса и принять решение о покупке.

СТИЛЬ:
- Тёплый, профессиональный, без агрессивных продаж
- Отвечай развёрнуто на вопросы о содержании
- Приводи конкретные результаты студентов
- При сомнениях — разбери конкретную ситуацию человека

ВОРОНКА:
1. Выясни цель и запрос пользователя
2. Покажи как курс решает именно его задачу
3. При интересе — предложи перейти к оформлению

Отвечай ТОЛЬКО на русском. Используй Markdown. Не придумывай факты о курсе.`;

const SUPPORT_PROMPT = `Ты — помощник для студентов образовательной платформы.
Студент уже купил курс. Помогай с:
- Вопросами по материалу уроков
- Навигацией по платформе
- Заданиями и домашними работами
- Техническими проблемами

Будь конкретным, давай примеры, ссылайся на уроки курса.
Отвечай на русском. Используй Markdown.`;

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildSystemPrompt(params: { hasCourses: boolean; firstName: string }): string {
  const base = params.hasCourses ? SUPPORT_PROMPT : SALES_PROMPT;
  return `${base}\n\nИмя пользователя: ${params.firstName}`;
}

export async function getAIResponse(
  systemPrompt: string,
  history: ChatHistoryMessage[],
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'Извините, не удалось сформировать ответ.';
  } catch (err) {
    console.error('AI response error:', err);
    return 'Извините, произошла ошибка. Попробуйте позже.';
  }
}
