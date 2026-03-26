# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AiBot** — LMS platform for online courses. Brand: ТОО "AiBot". Full cycle: **Landing -> Telegram Bot (AI sales) -> Payment (disabled, admin grants access) -> LMS Web + Telegram Mini App**.

Language: Russian UI (default), Kazakh (kz) as second language. Code and comments in English.

## Monorepo Structure

```
├── apps/
│   ├── web/           # Next.js 14 (App Router) — Landing + LMS student cabinet
│   ├── api/           # Express — REST API (PORT env or 3001)
│   ├── bot/           # Telegram Bot (grammy) + AI (Claude API)
│   └── mini-app/      # Telegram Mini App (React + Vite, base=/mini-app/)
├── packages/
│   ├── database/      # Prisma schema + singleton client (@lms/database)
│   ├── shared/        # Shared TypeScript types and utilities (@lms/shared)
│   └── ui/            # Shared React components (@lms/ui)
├── nginx/             # Nginx reverse proxy config (SSL, gzip, WebSocket)
├── Dockerfile         # Multi-stage build for api and bot (ARG APP_NAME)
├── Dockerfile.web     # Multi-stage build for Next.js (standalone output, ARG NEXT_PUBLIC_API_URL)
├── docker-compose.yml # Local dev: PostgreSQL 16 (:5433), Redis 7 (:6380)
├── docker-compose.prod.yml  # Production: all services + nginx + SSL
├── railway.toml       # Railway deployment config (API service)
├── nixpacks.toml      # Nixpacks config (Node 20)
└── Procfile           # Fallback process definition
```

npm workspaces + Turborepo. Node >=20, npm@11.12.0.

## Commands

```bash
# Development
npm run dev                          # Start all apps via Turborepo
npm run build                        # Build all apps and packages
npm run lint                         # Lint all apps
npm run start:api                    # Start API in production mode
npm run start:web                    # Start Web in production mode

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

# Production deploy (Docker Compose)
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Production deploy (Railway) — see Deploy section
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Query, Framer Motion |
| Mini App | React + Vite, Telegram WebApp SDK |
| API | Express, JWT (jsonwebtoken), bcryptjs, zod |
| Bot | grammy, @anthropic-ai/sdk |
| DB | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 (ioredis, graceful degradation) |
| Storage | S3-compatible (Cloudflare R2 or AWS S3) |
| Video | HLS streaming (hls.js on client), custom HTML5 player |
| Payments | YooKassa + Stripe (disabled via PAYMENT_ENABLED=false, admin grants access manually) |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Certificates | PDFKit (server-side PDF generation) |
| i18n | Custom React context (ru/kz), localStorage persistence |
| Theming | CSS variables + Tailwind `darkMode: 'class'`, localStorage persistence |

## Architecture & Key Flows

### Auth: Two paths
1. **Web**: email/password -> JWT access token (15m) + refresh token (30d in httpOnly concept, stored in DB)
2. **Telegram Mini App**: `initData` HMAC validation -> JWT tokens
3. Telegram account can be linked to existing web account via `/api/auth/telegram/link`
4. Theme loads from localStorage before hydration (inline script in layout.tsx prevents FOUC)

### Access flow (payments disabled)
```
Admin grants access via /admin/courses/:id/access or /admin/students
  -> API creates Enrollment (ACTIVE) via grantCourseAccess()
  -> Creates in-app Notification for user
  -> Optionally notifies user in Telegram
```

### Payment flow (when PAYMENT_ENABLED=true)
```
User clicks "Buy" -> Bot creates payment (YooKassa/Stripe)
  -> Provider sends webhook -> API verifies signature (raw body!)
  -> Updates Payment status to CONFIRMED -> Upserts Enrollment (ACTIVE)
```

### Bot AI funnel
- Non-enrolled users get SALES_PROMPT -> AI guides toward purchase
- Enrolled users get SUPPORT_PROMPT -> AI helps with course material
- Chat history stored in ChatMessage table, keyed by telegramId

### Webhook raw body requirement
Express must receive `Buffer` body BEFORE `json()` middleware on `/webhook` routes. Critical for HMAC signature verification.

### Notification system
- Backend: CRUD endpoints + admin broadcast to all active users
- Frontend: Bell icon with badge, 30-second polling, sound on new notifications
- Types: info, warning, success, course_update

### Theme system
- CSS variables in globals.css (`:root` for light, `.dark` for dark)
- Tailwind uses `darkMode: 'class'`
- All components use semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`)
- NO hardcoded gray/dark colors — always use theme tokens
- Inline `<script>` in layout.tsx reads localStorage before paint to prevent flash

### i18n system
- `apps/web/src/lib/i18n/translations.ts` — all keys for ru and kz
- `apps/web/src/lib/i18n/context.tsx` — React context with `t()` function
- Fallback: always Russian. Stored in localStorage key `lms-locale`
- All UI text must use `t('key')`, never hardcoded strings

## Code Rules

1. **TypeScript strict** — no `any`, no `as unknown`. Root tsconfig: ES2022 target, bundler moduleResolution
2. **Idempotency** — payments and enrollments use `upsert`, never `create`
3. **Prisma singleton** — always import from `@lms/database`
4. **Raw body for webhooks** — Express receives Buffer before json() middleware on `/webhook` routes
5. **Env validation** — check required env vars at startup, throw if missing
6. **React components** — named exports, one component per file
7. **Theme-aware styling** — use `bg-background`, `text-foreground`, `bg-card`, `border-border` etc. Never `bg-gray-900` or `text-white` on non-gradient backgrounds
8. **i18n everywhere** — use `t('key')` for all user-visible text. Add keys to translations.ts for both ru and kz
9. **Mobile-first** — use Tailwind responsive prefixes (sm:, md:, lg:). Min touch target 44px
10. **Sidebar responsive** — hidden on mobile (md:hidden), MobileNav component for mobile

## Database Schema

File: `packages/database/prisma/schema.prisma`

Core models:
- **User** -> TelegramAccount (1:1), Enrollments, Payments, LessonProgress, TaskSubmissions, Certificates, Notifications
- **Course** -> Modules -> Lessons -> Tasks -> TaskSubmissions
- **Course** -> Enrollments, Payments
- **Lesson** -> LessonProgress (unique per [userId, lessonId])
- **Payment** tracks provider (YOOKASSA/STRIPE/MANUAL), has unique providerPaymentId
- **Notification** -> User (indexed on userId+isRead)
- **Certificate** -> User + Course (unique per userId+courseId)

Conventions: snake_case via `@@map()`/`@map()`. IDs: `cuid()`. Prices: `Decimal(10,2)`.

## API Routes

```
GET  /api/health                     # Health check
POST /api/auth/register, /login, /refresh, /telegram, /telegram/link
GET  /api/courses?search=term        # List courses (with optional search)
GET  /api/courses/:slug              # Course detail
GET  /api/courses/:slug/lessons/:id  # Lesson detail
POST /api/progress/lesson/:id/complete
PATCH /api/progress/lesson/:id/watchtime
GET  /api/progress/course/:courseId
GET  /api/notifications              # User notifications (paginated)
GET  /api/notifications/unread-count
PATCH /api/notifications/read-all
PATCH /api/notifications/:id/read
POST /api/certificates/request/:courseId
GET  /api/certificates/my
GET  /api/certificates/verify/:number  # Public
GET  /api/certificates/:id/download
POST /api/payments/create             # Gated by PAYMENT_ENABLED
POST /api/payments/yookassa/webhook
POST /api/payments/stripe/webhook
POST /api/bot/webhook

# Admin (requireAdmin middleware)
GET/POST/PATCH/DELETE /api/admin/courses, /modules, /lessons
POST /api/admin/lessons/:id/upload-video
POST /api/admin/upload-image
PATCH /api/admin/modules/reorder, /lessons/reorder
GET  /api/admin/students
POST /api/admin/enrollments/grant, /revoke
GET  /api/admin/courses/:id/enrollments
POST /api/admin/notifications         # Broadcast to all users
GET  /api/admin/payments
```

## Frontend Pages

```
/                           # Landing page (Header, Hero, About, Courses, HowItWorks, Reviews, FAQ, Footer)
/login                      # Auth
/dashboard                  # Student dashboard with course progress
/courses                    # Course catalog with search/filter/sort
/courses/[slug]             # Course detail with modules/lessons
/courses/[slug]/lessons/[id] # Lesson player (custom HTML5 video)
/certificates               # My certificates
/certificates/request/[id]  # Request certificate (100% completion required)
/certificates/verify/[num]  # Public verification
/achievements               # Badges & progress
/calendar                   # Calendar view
/settings                   # User preferences (theme, language)
/profile                    # Edit profile
/admin/courses              # Admin: manage courses
/admin/courses/[id]         # Admin: edit course
/admin/courses/[id]/modules # Admin: manage modules
/admin/courses/[id]/access  # Admin: manage student access
/admin/lessons/[id]         # Admin: edit lesson
/admin/students             # Admin: manage students
/admin/payments             # Admin: view payments
/admin/analytics            # Admin: dashboard analytics
```

## Environment Variables

See `.env.example` for all required variables. Key groups:
- `PORT` (Railway sets automatically), `API_PORT` (fallback: 3001)
- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PAYMENT_ENABLED` (default: false)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_MINI_APP_URL`
- `ANTHROPIC_API_KEY`
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_URL`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`

## Deploy

### Railway (recommended)
Two services in Railway dashboard:
- **API**: Root dir `/`, uses `Dockerfile`. Set all env vars. Health check at `/api/health`.
- **Web**: Root dir `/`, uses `Dockerfile.web`. Build arg `NEXT_PUBLIC_API_URL` = API Railway URL.

### Docker Compose (VPS)
```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
# Register Telegram webhook:
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -d "url=${TELEGRAM_WEBHOOK_URL}"
```

CI: GitHub Actions — push to `main` triggers build check.
