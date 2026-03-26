export const USER_ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;

export const PAYMENT_PROVIDERS = {
  YOOKASSA: 'YOOKASSA',
  STRIPE: 'STRIPE',
  MANUAL: 'MANUAL',
} as const;

export const LESSON_TYPES = {
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  QUIZ: 'QUIZ',
} as const;

export const API_ROUTES = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    TELEGRAM: '/api/auth/telegram',
    TELEGRAM_LINK: '/api/auth/telegram/link',
  },
  COURSES: '/api/courses',
  PROGRESS: '/api/progress',
  PAYMENTS: '/api/payments',
  ADMIN: '/api/admin',
  BOT_WEBHOOK: '/api/bot/webhook',
} as const;
