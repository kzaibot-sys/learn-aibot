# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LMS platform for selling and delivering online courses. Full cycle: **Landing -> Telegram Bot (AI sales) -> Payment (YooKassa/Stripe) -> LMS Web + Telegram Mini App**.

Language: Russian UI, Russian-language AI prompts. Code and comments in English.

## Monorepo Structure

```
├── apps/
│   ├── web/           # Next.js 14 (App Router) — Landing + LMS student cabinet
│   ├── api/           # Express — REST API (port 3001)
│   ├── bot/           # Telegram Bot (grammy) + AI (Claude API)
│   └── mini-app/      # Telegram Mini App (React + Vite, base=/mini-app/)
├── packages/
│   ├── database/      # Prisma schema + singleton client (@lms/database)
│   ├── shared/        # Shared TypeScript types and utilities (@lms/shared)
│   └── ui/            # Shared React components (@lms/ui)
├── nginx/             # Nginx reverse proxy config (SSL, gzip, WebSocket)
├── Dockerfile         # Multi-stage build for api and bot (ARG APP_NAME)
├── Dockerfile.web     # Multi-stage build for Next.js (standalone output)
├── docker-compose.yml # Local dev: PostgreSQL 16 (:5433), Redis 7 (:6380)
└── docker-compose.prod.yml  # Production: all services + nginx + SSL
```

npm workspaces + Turborepo. Node >=20, npm@11.12.0.

## Commands

```bash
# Development
npm run dev                          # Start all apps via Turborepo
npm run build                        # Build all apps and packages
npm run lint                         # Lint all apps

# Per-app dev (from root)
npx turbo run dev --filter=web
npx turbo run dev --filter=api
npx turbo run dev --filter=bot
npx turbo run dev --filter=mini-app

# Database (from root)
npm run db:migrate                   # Run Prisma migrations
npm run db:generate                  # Generate Prisma client
cd packages/database && npx prisma migrate dev   # Create new migration
cd packages/database && npx prisma studio        # Visual DB editor

# Local infrastructure
docker compose up -d                 # PostgreSQL on :5433, Redis on :6380

# Production deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Query |
| Mini App | React + Vite, Telegram WebApp SDK |
| API | Express, JWT (jsonwebtoken), bcryptjs, zod |
| Bot | grammy, @anthropic-ai/sdk |
| DB | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 (ioredis) |
| Storage | S3-compatible (Cloudflare R2 or AWS S3) |
| Video | HLS streaming (hls.js on client), Bunny.net CDN |
| Payments | YooKassa (Russia/CIS), Stripe (international) |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |

## Architecture & Key Flows

### Auth: Two paths
1. **Web**: email/password -> JWT tokens
2. **Telegram Mini App**: `initData` HMAC validation -> JWT tokens
3. Telegram account can be linked to existing web account via `/api/auth/telegram/link`

### Payment -> Access flow
```
User clicks "Buy" -> Bot creates payment (YooKassa/Stripe)
  -> User pays -> Provider sends webhook to API
  -> API verifies webhook signature (raw body required!)
  -> Updates Payment status to CONFIRMED
  -> Upserts Enrollment (ACTIVE) via grantCourseAccess()
  -> Notifies user in Telegram with "Open Course" WebApp button
```

### Bot AI funnel
- Non-enrolled users get SALES_PROMPT -> AI guides toward purchase (warm, no aggressive sales)
- Enrolled users get SUPPORT_PROMPT -> AI helps with course material
- Chat history stored in ChatMessage table, keyed by telegramId
- Both prompts are Russian-only

### Webhook raw body requirement
Express must receive `Buffer` body BEFORE `json()` middleware on `/webhook` routes. This is critical for HMAC signature verification (YooKassa, Stripe, Telegram).

## Code Rules

1. **TypeScript strict** — no `any`, no `as unknown`. Root tsconfig: ES2022 target, bundler moduleResolution
2. **Idempotency** — payments and enrollments use `upsert`, never `create` (prevents duplicates on webhook retries)
3. **Prisma singleton** — always import from `@lms/database`, never instantiate new PrismaClient
4. **Raw body for webhooks** — Express receives Buffer before json() middleware on `/webhook` routes
5. **Env validation** — check required env vars at startup, throw if missing
6. **React components** — named exports, one component per file

## Database Schema

File: `packages/database/prisma/schema.prisma`

Core models and their relationships:
- **User** -> TelegramAccount (optional 1:1), Enrollments, Payments, LessonProgress, TaskSubmissions, Certificates
- **Course** -> Modules -> Lessons -> Tasks -> TaskSubmissions
- **Course** -> Enrollments, Payments
- **Lesson** -> LessonProgress (unique per [userId, lessonId])
- **Payment** tracks provider (YOOKASSA/STRIPE/MANUAL), has unique providerPaymentId

Conventions: all table/column names use snake_case via `@@map()`/`@map()`. IDs use `cuid()`. Prices use `Decimal(10,2)`.

Enums: UserRole (STUDENT/TEACHER/ADMIN), LessonType (VIDEO/TEXT/QUIZ), TaskType (TEXT/FILE/QUIZ), PaymentStatus (PENDING/CONFIRMED/CANCELLED/REFUNDED), PaymentProvider (YOOKASSA/STRIPE/MANUAL), EnrollmentStatus (ACTIVE/EXPIRED/REVOKED), SubmissionStatus (PENDING/REVIEWED/PASSED/FAILED), ChatMessageRole (USER/ASSISTANT/SYSTEM).

## API Routes

```
POST /api/auth/register, /login, /telegram, /telegram/link
GET  /api/courses, /api/courses/:slug, /api/courses/:slug/lessons/:lessonId
POST /api/progress/lesson/:lessonId/complete
PATCH /api/progress/lesson/:lessonId/watchtime
GET  /api/progress/course/:courseId
POST /api/payments/create
POST /api/payments/yookassa/webhook, /api/payments/stripe/webhook
POST /api/bot/webhook
/api/admin/* — requireAdmin middleware: CRUD courses/modules/lessons, students, payments
```

## Telegram initData Validation

```typescript
// HMAC-SHA256: hash check string with secret derived from bot token
// Reject if auth_date > 24 hours ago
// Parse user from URL-encoded params
const secretKey = crypto.createHmac("sha256", "WebAppData")
  .update(process.env.TELEGRAM_BOT_TOKEN!).digest();
```

## Implementation Order

Phases built sequentially — each depends on the previous:

```
Phase 1 (monorepo + DB) -> Phase 2 (API) -> Phase 3 (Bot) -> Phase 4 (Mini App) -> Phase 5 (Web) -> Phase 6 (Admin)
```

## Environment Variables

See `.env.example` for all required variables. Key groups:
- DATABASE_URL, REDIS_URL
- JWT_SECRET, JWT_EXPIRES_IN
- TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL, TELEGRAM_MINI_APP_URL
- ANTHROPIC_API_KEY
- YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
- S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET_NAME, S3_PUBLIC_URL
- NEXT_PUBLIC_API_URL (default :3001), NEXT_PUBLIC_APP_URL (default :3000), API_PORT

## Deploy

Docker Compose on VPS (Ubuntu) with Nginx reverse proxy + SSL (Let's Encrypt/certbot).

```bash
# After deploy, register Telegram webhook:
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -d "url=${TELEGRAM_WEBHOOK_URL}"
```

CI: GitHub Actions — push to `main` triggers build check; deploy workflow SSHes into VPS, pulls, rebuilds containers, runs `prisma migrate deploy`.
