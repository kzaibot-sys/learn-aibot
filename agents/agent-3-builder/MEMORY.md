# Agent-3 Builder — Memory

## Current Schema State
- User модель: НЕТ полей totalXp, level, streak, lastActiveAt
- НЕТ модели UserAchievement
- Certificate модель: есть, но НЕТ relation к Course
- LessonProgress модель: есть, работает (userId, lessonId, completed, watchedSec)
- Course → modules → lessons → tasks chain: работает

## API Architecture
- Express app в `apps/api/`
- Routes: `apps/api/src/routes/` (auth, courses, progress, admin, notifications, payments, certificates, bot)
- Middleware: `authenticate` (JWT), `requireAdmin`
- Error handling: `AppError` + `asyncHandler`
- Response format: `{ success: true, data }` / `{ success: false, error: { code, message } }`
- Prisma import: `import { prisma } from '@lms/database'`

## Progress Route (existing)
- File: `apps/api/src/routes/progress.ts`
- POST `/progress/lesson/:id/complete` — currently just marks lesson as complete
- GET `/progress/course/:courseId` — returns lesson progress list
- Needs enhancement: add XP, streak, achievements

## Key Dependencies
- `@lms/database` — Prisma client
- `zod` — validation
- `jsonwebtoken` — JWT
- Route registration in `apps/api/src/index.ts`

## Mistakes to Avoid
- НЕ создавать API routes в Next.js (`apps/web/src/app/api/`) — используй Express
- НЕ забывать `asyncHandler` wrapper
- НЕ забывать `authenticate` middleware для protected routes
- Prisma upsert для идемпотентности
