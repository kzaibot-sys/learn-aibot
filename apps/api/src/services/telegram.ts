import crypto from 'crypto';
import { config } from '../config';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function validateTelegramInitData(initData: string): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const checkString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(config.telegram.botToken)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  if (expectedHash !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  if (Date.now() / 1000 - authDate > 86400) return null;

  const userParam = params.get('user');
  if (!userParam) return null;

  try {
    return JSON.parse(decodeURIComponent(userParam)) as TelegramUser;
  } catch {
    return null;
  }
}

export async function notifyUserAccessGranted(telegramId: string, courseTitle: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: `Доступ к курсу "${courseTitle}" успешно открыт! Нажмите кнопку ниже, чтобы начать обучение.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Открыть курс',
              web_app: { url: config.telegram.miniAppUrl },
            },
          ]],
        },
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}
