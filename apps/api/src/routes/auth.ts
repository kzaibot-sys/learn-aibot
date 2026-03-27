import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@lms/database';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateTelegramInitData } from '../services/telegram';
import type { JwtPayload } from '@lms/shared';

const router = Router();

function generateAccessToken(user: { id: string; email: string | null; role: string }): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email ?? undefined,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRefreshTokenString();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Parse refresh expiry (e.g. '30d' -> 30 days)
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
  let expiresMs = 30 * 24 * 60 * 60 * 1000; // default 30 days
  if (match) {
    const num = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
    expiresMs = num * (multipliers[unit] || 86400000);
  }

  const expiresAt = new Date(Date.now() + expiresMs);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

async function generateTokens(user: { id: string; email: string | null; role: string }): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken };
}

function formatUser(user: { id: string; email: string | null; firstName: string | null; lastName: string | null; middleName?: string | null; phone?: string | null; role: string }) {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, middleName: user.middleName ?? null, phone: user.phone ?? null, role: user.role };
}

// Registration is disabled — users are created via Telegram bot only.
// POST /api/auth/register route has been removed.

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const tokens = await generateTokens(user);

  res.json({
    success: true,
    data: { user: formatUser(user), ...tokens },
  });
}));

// POST /api/auth/refresh — get new token pair using refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'refreshToken is required');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
  }

  // Token rotation: delete old token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = storedToken.user;
  const tokens = await generateTokens(user);

  res.json({
    success: true,
    data: { user: formatUser(user), ...tokens },
  });
}));

// POST /api/auth/telegram — auth via Mini App initData
router.post('/telegram', asyncHandler(async (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) {
    throw new AppError(400, 'VALIDATION_ERROR', 'initData is required');
  }

  const tgUser = validateTelegramInitData(initData);
  if (!tgUser) {
    throw new AppError(401, 'INVALID_TELEGRAM_DATA', 'Invalid or expired Telegram data');
  }

  const telegramId = String(tgUser.id);

  let tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { user: true },
  });

  if (!tgAccount) {
    const user = await prisma.user.create({
      data: {
        firstName: tgUser.first_name,
        lastName: tgUser.last_name || null,
        telegramAccount: {
          create: {
            telegramId,
            username: tgUser.username || null,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || null,
          },
        },
      },
    });

    tgAccount = await prisma.telegramAccount.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
  }

  const user = tgAccount!.user;
  const tokens = await generateTokens(user);

  res.json({
    success: true,
    data: { user: formatUser(user), ...tokens },
  });
}));

// POST /api/auth/telegram/link — link TG to existing account
router.post('/telegram/link', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) {
    throw new AppError(400, 'VALIDATION_ERROR', 'initData is required');
  }

  const tgUser = validateTelegramInitData(initData);
  if (!tgUser) {
    throw new AppError(401, 'INVALID_TELEGRAM_DATA', 'Invalid or expired Telegram data');
  }

  const telegramId = String(tgUser.id);
  const userId = req.user!.sub;

  const existing = await prisma.telegramAccount.findUnique({ where: { telegramId } });
  if (existing && existing.userId !== userId) {
    throw new AppError(409, 'TELEGRAM_ALREADY_LINKED', 'This Telegram account is linked to another user');
  }

  await prisma.telegramAccount.upsert({
    where: { userId },
    create: {
      userId,
      telegramId,
      username: tgUser.username || null,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name || null,
    },
    update: {
      telegramId,
      username: tgUser.username || null,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name || null,
    },
  });

  res.json({ success: true, data: { linked: true } });
}));

// PATCH /api/auth/profile — update user profile
router.patch('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { firstName, lastName, middleName, phone } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(middleName !== undefined && { middleName }),
      ...(phone !== undefined && { phone }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, middleName: true, phone: true, role: true },
  });

  res.json({ success: true, data: user });
}));

export { router as authRouter };
