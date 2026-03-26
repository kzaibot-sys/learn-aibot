import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@lms/database';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateTelegramInitData } from '../services/telegram';
import type { JwtPayload } from '@lms/shared';

const router = Router();

function generateTokens(user: { id: string; email: string | null; role: string }): { accessToken: string } {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email ?? undefined,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  return { accessToken };
}

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  const tokens = generateTokens(user);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ...tokens,
    },
  });
}));

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

  const tokens = generateTokens(user);

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ...tokens,
    },
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
  const tokens = generateTokens(user);

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      ...tokens,
    },
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

export { router as authRouter };
