# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AiBot** — LMS platform for online courses. Brand: ТОО "AiBot". Full cycle: **Landing -> Telegram Bot (external, separate project) -> LMS Web**.

Language: Russian UI (default), Kazakh (kz) as second language. Code and comments in English.

**Key decisions (2026-03-28):**
- **Bot is EXTERNAL** — apps/bot and apps/mini-app removed from monorepo, bot connects via Bot API
- **Payments REMOVED** entirely — no payment models, routes, or config
- **Registration DISABLED** — users created only via Bot API (`POST /api/bot/users`)
- **Dark theme REMOVED** — only light theme, no dark mode toggle
- **Gamification REMOVED** — no XP, levels, streaks, achievements, leaderboard
- **Access via Bot API**: `POST /api/bot/grant-access` with X-Bot-Secret header
- **Swagger docs** at `/api/docs` (swagger-ui-express)
- **Sessions persist**: JWT 7d access, 90d refresh

## Monorepo Structure

```
├── apps/
│   ├── web/           # Next.js 16 (App Router) — Landing + LMS student cabinet
│   └── api/           # Express — REST API (PORT env or 3001)
├── packages/
│   ├── database/      # Prisma schema + singleton client (@lms/database)
│   ├── shared/        # Shared TypeScript types and utilities (@lms/shared)
│   └── ui/            # Shared React components (@lms/ui)
├── Dockerfile         # Multi-stage build for API
├── Dockerfile.web     # Multi-stage build for Next.js (standalone output)
└── docker-compose.yml # Local dev: PostgreSQL 16 (:5433), Redis 7 (:6380)
```

npm workspaces + Turborepo. Node >=20.

## Commands

```bash
# Local infrastructure (PostgreSQL on :5433, Redis on :6380)
docker compose up -d

# Development
npm run dev                          # Start all apps via Turborepo
npm run build                        # Build all (turbo, depends on ^build)
npm run lint                         # Lint all (next lint in web)

# Run single app (ports: web=3000, api=3001)
cd apps/api && npm run dev           # tsx watch with --env-file=../../.env
cd apps/web && npm run dev           # next dev

# Database
npm run db:generate                  # Generate Prisma client
npm run db:migrate                   # Run migrations via Turborepo filter
cd packages/database && npx prisma migrate dev   # Create new migration interactively
cd packages/database && npx tsx prisma/seed.ts    # Seed database

# Production start
npm run start:api                    # node apps/api/dist/index.js
npm run start:web                    # next start on PORT (default 3000)

# Deploy to Railway (MANUAL — no auto-deploy)
railway service api && railway up --detach
railway service lms-platform && railway up --detach
```

## Environment Variables

Copy `.env` from `.env.example` to project root. Key variables:

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | api | PostgreSQL connection string. Local: `postgresql://lms:lms_password@localhost:5433/lms_db` |
| `REDIS_URL` | api | Optional — app works without it (graceful degradation) |
| `JWT_SECRET` | api | Required for auth |
| `NEXT_PUBLIC_API_URL` | web | API base URL. Local: `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | web | Web app URL. Local: `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | api | For HMAC validation of Telegram Mini App initData |
| `BOT_SECRET` | api | Shared secret for Bot API endpoints (X-Bot-Secret header) |
| `PORT` | api | Default 3001, Railway sets automatically |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), Tailwind CSS 3, Zustand, Framer Motion, React Query |
| API | Express 4, JWT (jsonwebtoken), bcryptjs, zod, helmet, compression |
| DB | PostgreSQL 16 (Neon prod) + Prisma ORM |
| Cache | Redis 7 (ioredis, graceful degradation — works without Redis) |
| Video | MP4 streaming with Range headers (`/api/videos/:filename`), custom VideoPlayer with auto-save |
| Certificates | PDFKit (on-the-fly PDF, fonts loaded as Buffer for Docker compatibility) |
| Docs | Swagger/OpenAPI via swagger-jsdoc + swagger-ui-express at `/api/docs` |
| Rich text | TipTap (admin lesson editor) |
| DnD | @dnd-kit (admin module/lesson ordering) |
| i18n | Custom React context (ru/kz), localStorage persistence |
| Theme | Light only. CSS variables in globals.css `:root` |

## Architecture & Key Flows

### API structure
Entry: `apps/api/src/index.ts`. Routes mounted under `/api/*`. Middleware chain: helmet → cors → compression → json → swagger → routes → errorHandler.

Config: `apps/api/src/config.ts` reads all env vars with defaults.

API build copies `src/assets/` to `dist/assets/` (inline Node script in package.json `build`). This is needed for certificate fonts.

Key patterns:
- `asyncHandler()` wrapper (`middleware/asyncHandler.ts`) — wraps async route handlers to catch rejections
- `AppError(statusCode, code, message)` class (`middleware/errorHandler.ts`) — standardized error responses: `{ success: false, error: { code, message } }`
- `requireBotSecret` middleware (`middleware/auth.ts`) — validates X-Bot-Secret header for Bot API
- Web path alias: `@/*` maps to `./src/*` in `apps/web/tsconfig.json`

### Docker
Dockerfile for API only. **Auto-runs** `prisma db push` on container startup before `node dist/index.js`. Dockerfile.web builds Next.js standalone output, serves via `node apps/web/server.js`.

### Auth
1. **Web**: email/password login only (registration disabled) → JWT access 7d + refresh 90d
2. **Telegram Mini App**: `initData` HMAC validation → JWT tokens (`POST /api/auth/telegram`)
3. Telegram account can be linked via `/api/auth/telegram/link`

### Bot API (external bot integration)
All under `/api/bot/`, authenticated via `X-Bot-Secret` header:
```
POST /api/bot/users                              # Create user + TelegramAccount
GET/PATCH /api/bot/users/:telegramId             # Get/update user
POST /api/bot/grant-access                        # { telegramId, courseSlug }
POST /api/bot/revoke-access                       # { telegramId, courseSlug }
GET  /api/bot/users/:telegramId/enrollments      # User's courses
GET  /api/bot/courses                             # Published courses list
GET  /api/bot/courses/:slug                       # Course detail
GET  /api/bot/users/:telegramId/progress/:slug   # Course progress
GET  /api/bot/stats                               # Platform statistics
POST /api/bot/notifications                       # Send notification
GET  /api/bot/users/:telegramId/certificates     # User's certificates
GET  /api/bot/certificates/verify/:number        # Public verification
```

### Video streaming
- `GET /api/videos/:filename` — streams MP4 with Range header support (seek)
- Files stored in `apps/api/public/videos/` (gitignored, not in repo)
- VideoPlayer saves position to localStorage every 5s, syncs to server every 10s

### Certificate generation
- POST /request/:courseId — creates DB record only (no PDF, no S3)
- GET /:id/download — generates PDF on-the-fly via PDFKit, streams as response
- Fonts loaded as Buffer at module level (works in Docker)
- File: `apps/api/src/services/certificate.ts`
- Fonts: `apps/api/src/assets/fonts/Roboto-*.ttf` (copied to dist via build script)

### Redis caching
Endpoints cached: courses list (5m), course detail (5m), my-progress (60s), analytics (120s), students (60s), certificates (60s), unread-count (15s). Cache invalidated on mutations. Use `cacheGet`/`cacheSet`/`cacheDelete` from `services/redis.ts`.

### Frontend caching
Courses and certificates pages use React Query (`useQuery`) with staleTime matching server cache. Course links prefetch on hover via `queryClient.prefetchQuery`.

## Code Rules

1. **TypeScript strict** — no `any`
2. **Prisma singleton** — import from `@lms/database`
3. **Light theme only** — use `bg-background`, `text-foreground`, `bg-card`, `border-border`. NO `dark:` prefixes
4. **i18n everywhere** — `t('key')` for all UI text, keys in translations.ts for both ru and kz
5. **Mobile-first** — Tailwind responsive prefixes (sm:, md:, lg:). Min touch target 44px
6. **No payments** — no price display, no buy buttons, no payment routes
7. **No registration** — login page only, no signup link
8. **Select over include** — Prisma queries should use `select` for only needed fields
9. **React Query for data fetching** — use `useQuery` on pages, not raw useState/useEffect

## Database Schema

File: `packages/database/prisma/schema.prisma`

Core models:
- **User** (id, email, passwordHash, firstName, lastName, middleName, phone, role, isActive) → TelegramAccount, Enrollments, LessonProgress, Certificates, Notifications, RefreshTokens
- **TelegramAccount** (telegramId, userId) — links Telegram users to LMS accounts
- **Course** → Modules → Lessons → Tasks
- **Enrollment** (userId, courseId, status: ACTIVE/EXPIRED/REVOKED)
- **LessonProgress** (userId, lessonId, completed, watchedSec)
- **Certificate** (userId, courseId, number, fileUrl nullable)

Removed models: Payment, ChatMessage, TelegramSession (and related enums).

## Deploy

### Railway (current production)
- **API**: Dockerfile, PORT=3001
- **Web**: Dockerfile.web (Next.js standalone output)
- **DB**: Neon PostgreSQL
- **Redis**: redis.railway.internal:6379
- Deploy is MANUAL: `railway service <name> && railway up --detach`

### Test accounts
- Admin: admin@aibot.kz / admin123456
- Student: student@aibot.kz / student123456 (telegramId: 123456789)

## Testing

No test infrastructure exists in this project.
