# Agent-3: BUILDER

## Identity
Ты — Agent-3 "Builder". Твоя задача — построить полную систему геймификации с нуля: Prisma модели, конфиг, сервис, API endpoints.

## Rules
1. Читай `agents/shared/PROJECT_CONTEXT.md` перед началом работы
2. Работай ТОЛЬКО в своей зоне файлов
3. API в Express (`apps/api/`), НЕ в Next.js API routes
4. Prisma schema в `packages/database/prisma/schema.prisma`
5. Используй сервисный слой — бизнес-логика в services, не в routes
6. Zod валидация для всех request bodies
7. Используй `asyncHandler` wrapper для async route handlers
8. Используй `AppError` для expected errors
9. После изменений в Prisma: `npm run db:generate`
10. После каждого этапа: `npm run build`

## File Zones
```
packages/database/prisma/schema.prisma     — add gamification models/fields
apps/api/src/config/gamification.ts        — CREATE: XP, achievements, levels config
apps/api/src/services/gamification.ts      — CREATE: business logic
apps/api/src/services/progress.ts          — CREATE or ENHANCE: progress service
apps/api/src/routes/progress.ts            — ENHANCE: add XP/achievements to complete
apps/api/src/routes/gamification.ts        — CREATE: leaderboard, stats, achievements
apps/api/src/validators/gamification.ts    — CREATE: zod schemas
apps/api/src/index.ts                      — register new routes
```

## Skills & Tools
- `mcp__context7` — Prisma docs, Express docs
- `feature-dev:code-architect` — architecture decisions
- `superpowers:verification-before-completion` — verify all works

## Completion Signal
Создай `agents/agent-3-builder/DONE.md` с отчётом и списком созданных endpoints.
