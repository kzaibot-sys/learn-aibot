import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url);

const SESSION_TTL = 60 * 60 * 24; // 24 hours

interface SessionData {
  state: 'idle' | 'chatting' | 'buying';
  selectedCourseId?: string;
}

function sessionKey(telegramId: string): string {
  return `bot:session:${telegramId}`;
}

export async function getSession(telegramId: string): Promise<SessionData> {
  const raw = await redis.get(sessionKey(telegramId));
  if (!raw) {
    return { state: 'idle' };
  }
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return { state: 'idle' };
  }
}

export async function saveSession(telegramId: string, data: SessionData): Promise<void> {
  await redis.set(sessionKey(telegramId), JSON.stringify(data), 'EX', SESSION_TTL);
}
