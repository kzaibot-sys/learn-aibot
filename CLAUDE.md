# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AiBot** — LMS platform for online courses. Brand: ТОО "AiBot". Full cycle: **Landing -> Telegram Bot (AI sales + auto-access) -> LMS Web**.

Language: Russian UI (default), Kazakh (kz) as second language. Code and comments in English.

**Key decisions (2026-03-28):**
- **Payments REMOVED** entirely from LMS — no payment routes, no stripe/yookassa
- **Registration DISABLED** — users created only via Telegram bot
- **Dark theme REMOVED** — only light theme, no dark mode toggle
- **Gamification REMOVED** — no XP, levels, streaks, achievements, leaderboard
- **Access via bot**: `POST /api/bot/grant-access` (telegramId + courseSlug + botSecret)
- **Course covers optional** — gradient placeholder when no coverUrl
- **Prices/ratings NOT shown** in LMS
- **Sessions persist**: JWT 7d access, 90d refresh

## Monorepo Structure

```
├── apps/
│   ├── web/           # Next.js 16 (App Router) — Landing + LMS student cabinet
│   ├── api/           # Express — REST API (PORT env or 3001)
│   ├── bot/           # Telegram Bot (grammy) + AI (Claude API)
│   └── mini-app/      # Telegram Mini App (React + Vite, base=/mini-app/)
├── packages/
│   ├── database/      # Prisma schema + singleton client (@lms/database)
│   ├── shared/        # Shared TypeScript types and utilities (@lms/shared)
│   └── ui/            # Shared React components (@lms/ui)
├── docs/
│   └── telegram-bot-api.md  # API docs for bot grant-access
├── Dockerfile         # Multi-stage build for api and bot (ARG APP_NAME)
├── Dockerfile.web     # Multi-stage build for Next.js (standalone output)
└── docker-compose.yml # Local dev: PostgreSQL 16 (:5433), Redis 7 (:6380)
```

npm workspaces + Turborepo. Node >=20, npm@11.12.0.

## Commands

```bash
# Development
npm run dev                          # Start all apps via Turborepo
npm run build                        # Build all apps and packages

# Database (from root)
npm run db:generate                  # Generate Prisma client
cd packages/database && npx prisma migrate dev   # Create new migration

# Deploy to Railway (MANUAL — no auto-deploy)
railway service api && railway up --detach       # API
railway service lms-platform && railway up --detach  # Web
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), Tailwind CSS, Zustand, Framer Motion |
| API | Express, JWT (jsonwebtoken), bcryptjs, zod |
| Bot | grammy, @anthropic-ai/sdk |
| DB | PostgreSQL 16 (Neon) + Prisma ORM |
| Cache | Redis 7 (ioredis, graceful degradation) |
| Video | HLS streaming (hls.js), custom VideoPlayer with auto-save position |
| AI | Anthropic Claude |
| Certificates | PDFKit (on-the-fly PDF generation, NO S3 upload) |
| i18n | Custom React context (ru/kz), localStorage persistence |
| Theme | Light only. CSS variables in globals.css `:root` |

## Architecture & Key Flows

### Auth
1. **Web**: email/password login only (registration disabled) -> JWT access 7d + refresh 90d
2. **Telegram Mini App**: `initData` HMAC validation -> JWT tokens
3. Telegram account can be linked via `/api/auth/telegram/link`

### Access flow (via Telegram bot)
```
User pays in Telegram bot
  -> Bot calls POST /api/bot/grant-access { telegramId, courseSlug, botSecret }
  -> API finds user by telegramId, upserts Enrollment (ACTIVE)
  -> Creates Notification for user
```

### Video auto-save
- VideoPlayer saves position to localStorage every 5s (key: `video-pos-${lessonId}`)
- Sends watchedSec to server every 10s via PATCH /api/progress/lesson/:id/watchtime
- On load: restores from localStorage OR server (whichever is greater)

### Certificate generation
- POST /request/:courseId — creates DB record only (no PDF, no S3)
- GET /:id/download — generates PDF on-the-fly via PDFKit, streams as response
- **KNOWN BUG**: Font loading crashes in Docker (`Error: Unknown font format`)
- File: `apps/api/src/services/certificate.ts`
- Fonts: `apps/api/src/assets/fonts/Roboto-*.ttf` (copied to dist via build script)

### Redis caching
Endpoints cached: courses list (5m), course detail (5m), my-progress (60s), analytics (120s), students (60s), certificates (60s), unread-count (15s). Cache invalidated on mutations.

## Code Rules

1. **TypeScript strict** — no `any`
2. **Prisma singleton** — import from `@lms/database`
3. **Light theme only** — use `bg-background`, `text-foreground`, `bg-card`, `border-border`. NO `dark:` prefixes
4. **i18n everywhere** — `t('key')` for all UI text, keys in translations.ts for both ru and kz
5. **Mobile-first** — Tailwind responsive prefixes (sm:, md:, lg:). Min touch target 44px
6. **No payments** — no price display, no buy buttons, no payment routes
7. **No registration** — login page only, no signup link
8. **Redis caching** — use `cacheGet`/`cacheSet`/`cacheDelete` from `services/redis.ts`
9. **Select over include** — Prisma queries should use `select` for only needed fields

## Database Schema

File: `packages/database/prisma/schema.prisma`

Core models:
- **User** (id, email, passwordHash, firstName, lastName, middleName, phone, role, isActive) -> TelegramAccount, Enrollments, LessonProgress, Certificates, Notifications, RefreshTokens
- **Course** -> Modules -> Lessons -> Tasks
- **Enrollment** (userId, courseId, status: ACTIVE/EXPIRED/REVOKED)
- **LessonProgress** (userId, lessonId, completed, watchedSec)
- **Certificate** (userId, courseId, number, fileUrl nullable)

## API Routes

```
GET  /api/health
POST /api/auth/login, /refresh, /telegram, /telegram/link
PATCH /api/auth/profile                  # firstName, lastName, middleName, phone

GET  /api/courses                        # Public list (cached 5m)
GET  /api/courses/my-progress            # Batch: enrolled courses + progress (auth, cached 60s)
GET  /api/courses/:slug                  # Course detail (cached 5m)
GET  /api/courses/:slug/lessons/:id      # Lesson detail (auth)

POST /api/progress/lesson/:id/complete
PATCH /api/progress/lesson/:id/watchtime
GET  /api/progress/course/:courseId

POST /api/certificates/request/:courseId
GET  /api/certificates/my
GET  /api/certificates/verify/:number    # Public
GET  /api/certificates/:id/download      # On-the-fly PDF

GET  /api/notifications, /unread-count
PATCH /api/notifications/read-all, /:id/read

POST /api/bot/grant-access               # { telegramId, courseSlug, botSecret }
POST /api/bot/webhook

# Admin (requireAdmin)
GET/POST/PATCH/DELETE /api/admin/courses, /modules, /lessons
GET  /api/admin/analytics                # Stats: students, courses, progress (cached 120s)
GET  /api/admin/students                 # With search, pagination (cached 60s)
GET  /api/admin/certificates             # All certificates with search
POST /api/admin/enrollments/grant, /revoke
POST /api/admin/notifications
```

## Frontend Pages

```
# Landing (independent layout — LandingHeader + LandingFooter)
/                           # Hero, About, Courses, HowItWorks, Reviews, FAQ
/privacy, /terms, /offer    # Legal pages

# Auth
/login                      # Email/password only (no registration)

# LMS (Sidebar layout — AuthGuard)
/dashboard                  # "День X из Y" per course, stats cards
/courses                    # Catalog (no prices, no ratings)
/courses/[slug]             # Course detail
/courses/[slug]/lessons/[id] # Lesson with VideoPlayer (auto-save)
/certificates               # My certs + available for request
/certificates/request/[id]  # Request cert (requires 100% + ФИО)
/profile                    # ФИО + phone (used for certificates)
/settings                   # Language toggle only

# Admin
/admin/courses              # CRUD courses
/admin/courses/[id]         # Edit course
/admin/courses/[id]/modules # Manage modules
/admin/courses/[id]/access  # Manage enrollments
/admin/lessons/[id]         # Edit lesson + video upload
/admin/students             # Students with progress per course
/admin/analytics            # Stats: students, registrations, course progress
/admin/certificates         # All issued certificates

# Public
/certificates/verify/[num]  # Certificate verification
```

## Deploy

### Railway (current production)
- **API**: https://api-production-d64b.up.railway.app (Dockerfile, PORT=3001)
- **Web**: https://lms-platform-production-8b12.up.railway.app (Dockerfile.web)
- **DB**: Neon PostgreSQL (ep-lingering-sun-a4xz7f6z-pooler.us-east-1.aws.neon.tech)
- **Redis**: redis.railway.internal:6379
- Deploy is MANUAL: `railway service <name> && railway up --detach`

### Test accounts
- Admin: admin@aibot.kz / admin123456
- Student: student@aibot.kz / student123456

## Known Issues (as of 2026-03-28)

1. **Certificate PDF crashes in Docker**: `Error: Unknown font format` — PDFKit can't load Roboto TTF in Docker container. Need to fix font loading in `apps/api/src/services/certificate.ts` (try `fs.readFileSync` Buffer approach)
2. **Pages load slowly (2-3s)**: Redis caching added but may not be active if REDIS_URL not configured. Neon cold starts add latency. Consider: skeleton loading, React Query staleTime, prefetching.

## Testing

No test infrastructure exists in this project.
