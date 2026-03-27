# LMS Overhaul v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove bot/payments, fix certificate crash, speed up pages, add Bot API with Swagger, seed DB with video course, deploy.

**Architecture:** Clean dead code (bot/payments/S3) from monorepo, fix PDF font loading via Buffer, eliminate N+1 queries and add React Query caching, build full Bot API under `/api/bot/` with X-Bot-Secret auth, add Swagger via swagger-jsdoc, serve video via static endpoint with Range headers.

**Tech Stack:** Express 4, Prisma ORM, Next.js 16 (App Router), React Query, PDFKit, swagger-jsdoc + swagger-ui-express

---

### Task 1: Remove bot app, mini-app, and payment code from Prisma schema

**Files:**
- Delete: `apps/bot/` (entire directory)
- Delete: `apps/mini-app/` (entire directory)
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Delete bot and mini-app directories**

```bash
rm -rf apps/bot apps/mini-app
```

- [ ] **Step 2: Clean Prisma schema — remove Payment, ChatMessage, TelegramSession models and related enums/fields**

In `packages/database/prisma/schema.prisma`:

Remove from `User` model:
```
  payments        Payment[]
```

Remove from `Course` model:
```
  payments     Payment[]
```

Remove from `TelegramAccount` model:
```
  sessions TelegramSession[]
```

Delete these entire models/enums:
- `TelegramSession` model (lines 57-67)
- `ChatMessage` model (lines 69-79)
- `ChatMessageRole` enum (lines 81-85)
- `Payment` model (lines 237-257)
- `PaymentStatus` enum (lines 259-264)
- `PaymentProvider` enum (lines 266-270)

- [ ] **Step 3: Generate Prisma client to verify schema is valid**

```bash
cd packages/database && npx prisma generate
```
Expected: Success, no errors

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove bot, mini-app, and payment/chat models from schema"
```

---

### Task 2: Clean API code — remove payment routes, S3, dead config

**Files:**
- Modify: `apps/api/src/config.ts` — remove yookassa, stripe, s3, payment config
- Modify: `apps/api/src/routes/admin.ts` — remove payments endpoint, S3 upload import
- Modify: `apps/api/src/routes/bot.ts` — remove webhook endpoint
- Modify: `apps/api/src/index.ts` — no changes needed (botRouter still used for grant-access)
- Delete: `apps/api/src/services/storage.ts`
- Modify: `apps/api/package.json` — remove @aws-sdk deps
- Modify: `Dockerfile` — remove bot package.json COPY
- Modify: `.env.example` — remove payment/S3 vars
- Modify: `.gitignore` — add videos directory

- [ ] **Step 1: Clean config.ts**

In `apps/api/src/config.ts`, remove the `yookassa`, `stripe`, `s3`, and `payment` blocks (lines 30-54). Keep everything else. Final config:

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  port: Number(optionalEnv('PORT', '') || optionalEnv('API_PORT', '3001')),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    refreshSecret: optionalEnv('JWT_REFRESH_SECRET', '') || requireEnv('JWT_SECRET'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '90d'),
  },

  telegram: {
    botToken: optionalEnv('TELEGRAM_BOT_TOKEN', ''),
    webhookUrl: optionalEnv('TELEGRAM_WEBHOOK_URL', ''),
    miniAppUrl: optionalEnv('TELEGRAM_MINI_APP_URL', ''),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  bot: {
    secret: optionalEnv('BOT_SECRET', ''),
  },

  app: {
    url: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
};
```

- [ ] **Step 2: Remove payments endpoint and S3 imports from admin.ts**

In `apps/api/src/routes/admin.ts`:

1. Remove import of `uploadFile` from `../services/storage` (line 8)
2. Remove the entire `// ===== PAYMENTS =====` section (lines 310-339)
3. In the video upload handler (line 390), replace `await uploadFile(...)` with a throw since S3 is removed:

```typescript
// In upload-video handler, replace the uploadFile call:
throw new AppError(503, 'UPLOAD_NOT_CONFIGURED', 'File upload via S3 is not configured. Use videoUrl field directly.');
```

4. In upload-image handler, same:

```typescript
throw new AppError(503, 'UPLOAD_NOT_CONFIGURED', 'File upload via S3 is not configured. Use coverUrl field directly.');
```

- [ ] **Step 3: Remove webhook endpoint from bot.ts**

In `apps/api/src/routes/bot.ts`, delete lines 9-16 (the `/webhook` POST handler).

Also update the grant-access endpoint to use `config.bot.secret` instead of `config.telegram.botToken`:

```typescript
// Change line 23 from:
if (botSecret !== config.telegram.botToken) {
// To:
if (!config.bot.secret || botSecret !== config.bot.secret) {
```

- [ ] **Step 4: Delete storage.ts and remove S3 deps**

```bash
rm apps/api/src/services/storage.ts
```

In `apps/api/package.json`, remove these from `dependencies`:
```
"@aws-sdk/client-s3": "^3.700.0",
"@aws-sdk/s3-request-presigner": "^3.700.0",
```

- [ ] **Step 5: Update Dockerfile — remove bot package.json reference**

In `Dockerfile`, remove line 8:
```
COPY apps/bot/package.json ./apps/bot/
```

- [ ] **Step 6: Clean .env.example**

Replace `.env.example` with:

```
# Database
DATABASE_URL="postgresql://lms:lms_password@localhost:5433/lms_db"
REDIS_URL="redis://localhost:6380"

# Auth
JWT_SECRET="change-in-production"

# Telegram (for HMAC validation)
TELEGRAM_BOT_TOKEN="token-from-BotFather"

# Bot API
BOT_SECRET="shared-secret-for-bot-api"

# URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Server port
PORT=3001
```

- [ ] **Step 7: Add videos to .gitignore**

Append to `.gitignore`:
```
# Video files
apps/api/public/videos/
*.mp4
```

- [ ] **Step 8: Remove payment translation keys from translations.ts**

In `apps/web/src/lib/i18n/translations.ts`, remove all keys containing `payment` or `payments` in both `ru` and `kz` sections (nav.admin.payments, admin.payments, admin.noPayments, admin.paymentsCount, admin.paymentsAnalytics).

- [ ] **Step 9: Verify build**

```bash
npm run build
```
Expected: All packages and apps compile successfully.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: remove payments, S3, bot webhook, dead config"
```

---

### Task 3: Create DB migration and update seed

**Files:**
- Create: new Prisma migration (auto-generated)
- Modify: `packages/database/prisma/seed.ts`

- [ ] **Step 1: Create migration to drop removed tables**

```bash
cd packages/database && npx prisma migrate dev --name remove_payments_chat_sessions
```

Expected: Migration created that drops `payments`, `chat_messages`, `telegram_sessions` tables and related enums.

- [ ] **Step 2: Update seed script with TelegramAccount and video lesson**

Replace `packages/database/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aibot.kz' },
    update: { passwordHash: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@aibot.kz',
      passwordHash: adminPassword,
      firstName: 'Админ',
      lastName: 'AiBot',
      role: 'ADMIN',
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create student user with TelegramAccount
  const studentPassword = await bcrypt.hash('student123456', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@aibot.kz' },
    update: { passwordHash: studentPassword },
    create: {
      email: 'student@aibot.kz',
      passwordHash: studentPassword,
      firstName: 'Студент',
      lastName: 'Тестовый',
      middleName: 'Иванович',
      role: 'STUDENT',
    },
  });

  // Link TelegramAccount to student
  await prisma.telegramAccount.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      telegramId: '123456789',
      username: 'test_student',
      firstName: 'Студент',
      lastName: 'Тестовый',
    },
  });
  console.log(`Student created: ${student.email} (telegramId: 123456789)`);

  // Create demo course with video
  const course = await prisma.course.upsert({
    where: { slug: 'ai-basics' },
    update: {},
    create: {
      title: 'Основы искусственного интеллекта',
      slug: 'ai-basics',
      description: 'Вводный курс по искусственному интеллекту. Вы узнаете основные концепции AI, машинного обучения и нейронных сетей.',
      price: 0,
      isFree: true,
      isPublished: true,
    },
  });
  console.log(`Course created: ${course.title}`);

  // Create module
  const mod = await prisma.module.upsert({
    where: { id: 'seed-module-1' },
    update: {},
    create: {
      id: 'seed-module-1',
      courseId: course.id,
      title: 'Введение в AI',
      description: 'Что такое искусственный интеллект',
      order: 1,
      isPublished: true,
    },
  });

  // Create video lesson — videoUrl points to our streaming endpoint
  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-1' },
    update: { videoUrl: '/api/videos/intro.mp4' },
    create: {
      id: 'seed-lesson-1',
      moduleId: mod.id,
      title: 'Введение в искусственный интеллект',
      description: 'Видео-урок: основы AI и его применение',
      type: 'VIDEO',
      videoUrl: '/api/videos/intro.mp4',
      order: 1,
      isPublished: true,
      isFree: true,
    },
  });

  // Enroll student
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id, status: 'ACTIVE' },
  });
  console.log(`Student enrolled in: ${course.title}`);

  console.log('\nSeed completed!');
  console.log('Admin:   admin@aibot.kz / admin123456');
  console.log('Student: student@aibot.kz / student123456 (telegramId: 123456789)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: migration to drop payments/chat tables, update seed with telegram + video"
```

---

### Task 4: Fix certificate PDF font crash

**Files:**
- Modify: `apps/api/src/services/certificate.ts`

- [ ] **Step 1: Rewrite findFontsDir and font loading to use Buffer**

Replace the top of `apps/api/src/services/certificate.ts` (lines 1-53):

```typescript
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface CertificateData {
  fullName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedDate: Date;
}

// Load fonts once at module level
let fontMain: Buffer | null = null;
let fontBold: Buffer | null = null;
let fontsLoaded = false;

function loadFonts(): void {
  if (fontsLoaded) return;
  fontsLoaded = true;

  const candidates = [
    path.join(__dirname, '../assets/fonts'),         // dist/assets/fonts (build copies here)
    path.join(__dirname, '../../src/assets/fonts'),   // from dist/services/ -> src/assets/fonts
    path.resolve('src/assets/fonts'),                 // CWD = apps/api/
    path.resolve('apps/api/src/assets/fonts'),        // CWD = monorepo root
    path.resolve('apps/api/dist/assets/fonts'),       // CWD = monorepo root, dist
  ];

  for (const dir of candidates) {
    const regularPath = path.join(dir, 'Roboto-Regular.ttf');
    const boldPath = path.join(dir, 'Roboto-Bold.ttf');
    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      fontMain = fs.readFileSync(regularPath);
      fontBold = fs.readFileSync(boldPath);
      console.log(`[Certificate] Fonts loaded from: ${dir}`);
      return;
    }
  }

  console.warn('[Certificate] Roboto fonts not found, falling back to Helvetica');
}

// Load fonts on module import
loadFonts();

export function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 842;
    const H = 595;

    // Register fonts — use Buffer (works reliably in Docker)
    if (fontMain && fontBold) {
      doc.registerFont('Main', fontMain);
      doc.registerFont('Bold', fontBold);
    } else {
      // Helvetica fallback — limited Cyrillic but won't crash
      doc.font('Helvetica');
    }
```

Keep everything below line 53 (`// === COLORS ...`) unchanged, EXCEPT: if the fallback branch is hit (no Roboto), replace font names 'Main'/'Bold' with 'Helvetica'/'Helvetica-Bold'. The simplest way: since we register fonts with those names when Roboto IS available, and in fallback we just use Helvetica directly, we need a flag:

Actually, simpler: always register with those names. For fallback:

```typescript
    if (fontMain && fontBold) {
      doc.registerFont('Main', fontMain);
      doc.registerFont('Bold', fontBold);
    } else {
      // Use built-in fonts — no registerFont needed, just alias
      doc.registerFont('Main', 'Helvetica');
      doc.registerFont('Bold', 'Helvetica-Bold');
    }
```

Wait — this is the original code that CRASHES. `doc.registerFont('Main', 'Helvetica')` tries to load 'Helvetica' as a file path, which fails.

Correct approach: use a boolean flag and conditionally use font names:

```typescript
    const hasCustomFonts = !!(fontMain && fontBold);
    if (hasCustomFonts) {
      doc.registerFont('Main', fontMain);
      doc.registerFont('Bold', fontBold);
    }

    // Helper to set font
    const setFont = (bold: boolean) => {
      if (hasCustomFonts) {
        doc.font(bold ? 'Bold' : 'Main');
      } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
      }
    };
```

Then replace all `doc.font('Main')` with `setFont(false)` and `doc.font('Bold')` with `setFont(true)` throughout the rest of the function.

- [ ] **Step 2: Verify build compiles**

```bash
cd apps/api && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/certificate.ts && git commit -m "fix: certificate PDF font loading via Buffer, fallback to Helvetica"
```

---

### Task 5: Speed up courses and certificates pages

**Files:**
- Modify: `apps/api/src/routes/courses.ts` — add `_count` to GET /api/courses
- Modify: `apps/web/src/app/(lms)/courses/page.tsx` — remove N+1, use React Query
- Modify: `apps/web/src/app/(lms)/certificates/page.tsx` — use React Query

- [ ] **Step 1: Add `_count` to GET /api/courses API**

In `apps/api/src/routes/courses.ts`, replace the Prisma query in the `GET /` handler (lines 103-119) with:

```typescript
  const courses = await prisma.course.findMany({
    where: whereClause,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      _count: {
        select: { enrollments: true, modules: true },
      },
      modules: {
        where: { isPublished: true },
        select: {
          _count: { select: { lessons: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const response = {
    success: true,
    data: courses.map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl,
      totalLessons: c.modules.reduce((sum, m) => sum._count.lessons, 0),
      totalModules: c._count.modules,
      enrollmentCount: c._count.enrollments,
    })),
  };
```

Wait, that reduce is wrong. Fix:

```typescript
      totalLessons: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
```

- [ ] **Step 2: Rewrite courses/page.tsx with React Query, no N+1**

Replace `apps/web/src/app/(lms)/courses/page.tsx`. Key changes:
- Import `useQuery` from `@tanstack/react-query`
- Use `useQuery` for courses list and my-progress (two separate queries)
- Derive `enrolledIds` from my-progress data
- Remove `useState` for courses/enrolledIds/loading
- Use `staleTime: 5 * 60 * 1000` for courses
- Add `prefetchQuery` on course link hover

```typescript
'use client';

import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Clock, Users, Search, BookOpen, CheckCircle2,
} from 'lucide-react';
import { SkeletonCard, SkeletonStatCard } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  totalLessons: number;
  totalModules: number;
  enrollmentCount: number;
}

interface MyProgress {
  id: string;
  slug: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

type SortOption = 'name' | 'popularity';

export default function CoursesPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CoursesPage />
    </Suspense>
  );
}

function CoursesPage() {
  const token = useAuthStore(s => s.token);
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchFromUrl);
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => apiRequest<Course[]>('/api/courses', {}, token),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<MyProgress[]>('/api/courses/my-progress', {}, token),
    staleTime: 60 * 1000,
    enabled: !!token,
  });

  const enrolledIds = useMemo(() => new Set(progress.map(p => p.id)), [progress]);
  const loading = coursesLoading;

  const filtered = useMemo(() => {
    let result = courses.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case 'name':
        result = result.slice().sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popularity':
        result = result.slice().sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
        break;
    }

    return result;
  }, [courses, search, sortBy]);

  const totalLessons = courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0);

  const prefetchCourse = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['course', slug],
      queryFn: () => apiRequest(`/api/courses/${slug}`, {}, token),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-foreground mb-2">{t('courses.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('courses.subtitle')}</p>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-black text-primary">{courses.length}</p>
              <p className="text-xs text-muted-foreground">{t('courses.total')}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-black text-primary">{totalLessons}</p>
              <p className="text-xs text-muted-foreground">{t('courses.lessons')}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-black text-primary">{courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">{t('courses.enrolled')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + Sort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('courses.search')}
            className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm pl-12 pr-6 py-3.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-orange-500/50 focus:outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
          className="rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm px-4 py-3.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-orange-500/50 focus:outline-none"
        >
          <option value="name">{t('courses.sortByName')}</option>
          <option value="popularity">{t('courses.sortByPopularity')}</option>
        </select>
      </motion.div>

      {/* Courses grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('courses.notFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Link
                  href={`/courses/${course.slug}`}
                  onMouseEnter={() => prefetchCourse(course.slug)}
                  className="block rounded-3xl overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all"
                >
                  <div className="relative h-48 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-card overflow-hidden">
                    {course.coverUrl ? (
                      <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {isEnrolled && (
                        <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold rounded-full px-3 py-1">
                          <CheckCircle2 className="w-3 h-3" /> {t('courses.enrolled')}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {course.totalLessons || 0} {t('dashboard.ofLessons')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {course.enrollmentCount || 0}
                      </span>
                    </div>
                    <div className="rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white text-center py-2.5 font-bold text-sm">
                      {isEnrolled ? t('courses.continue') : t('courses.start')}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Rewrite certificates/page.tsx with React Query**

In `apps/web/src/app/(lms)/certificates/page.tsx`, replace the `useState`/`useEffect` data loading with `useQuery`. Add these imports and hooks at the top of `CertificatesPage`:

```typescript
import { useQuery } from '@tanstack/react-query';
```

Replace lines 32-52 (the useState/useEffect block) with:

```typescript
  const { data: certificates = [], isLoading: certsLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => apiRequest<Certificate[]>('/api/certificates/my', {}, token).catch(() => []),
    staleTime: 60 * 1000,
    enabled: !!token,
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<CourseProgress[]>('/api/courses/my-progress', {}, token).catch(() => []),
    staleTime: 60 * 1000,
    enabled: !!token,
  });

  const loading = certsLoading || progressLoading;

  const availableCourses = useMemo(() => {
    const certCourseIds = new Set(certificates.map(c => c.courseId));
    return progress.filter(p => p.progressPercent >= 100 && !certCourseIds.has(p.id));
  }, [certificates, progress]);
```

Add `useMemo` to the import from `react`.

- [ ] **Step 4: Verify frontend build**

```bash
cd apps/web && npx next build
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "perf: eliminate N+1 queries, add React Query caching to courses and certificates"
```

---

### Task 6: Build Bot API endpoints

**Files:**
- Modify: `apps/api/src/routes/bot.ts` — add all bot endpoints
- Modify: `apps/api/src/middleware/auth.ts` — add `requireBotSecret` middleware

- [ ] **Step 1: Add requireBotSecret middleware**

In `apps/api/src/middleware/auth.ts`, add after the `requireAdmin` function:

```typescript
export function requireBotSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-bot-secret'] as string;
  if (!config.bot.secret || secret !== config.bot.secret) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid bot secret' } });
    return;
  }
  next();
}
```

Add `import { config } from '../config';` at the top (already imported via jwt — check; if not, add it).

- [ ] **Step 2: Rewrite bot.ts with full Bot API**

Replace `apps/api/src/routes/bot.ts` entirely:

```typescript
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@lms/database';
import { requireBotSecret } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { cacheDelete } from '../services/redis';

const router = Router();

// All bot routes require X-Bot-Secret header
router.use(requireBotSecret);

// POST /api/bot/users — create user + TelegramAccount
router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, firstName, lastName, phone, email, password } = req.body;

  if (!telegramId || !firstName) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and firstName are required');
  }

  const tgId = String(telegramId);

  // Check if TelegramAccount already exists
  const existing = await prisma.telegramAccount.findUnique({
    where: { telegramId: tgId },
    include: { user: true },
  });

  if (existing) {
    res.json({ success: true, data: { user: existing.user, created: false } });
    return;
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const user = await prisma.user.create({
    data: {
      email: email || null,
      passwordHash,
      firstName,
      lastName: lastName || null,
      phone: phone || null,
      telegramAccount: {
        create: {
          telegramId: tgId,
          firstName,
          lastName: lastName || null,
        },
      },
    },
    include: { telegramAccount: true },
  });

  res.status(201).json({ success: true, data: { user, created: true } });
}));

// GET /api/bot/users/:telegramId
router.get('/users/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
    include: {
      user: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          middleName: true, phone: true, role: true, isActive: true, createdAt: true,
        },
      },
    },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  res.json({ success: true, data: tgAccount.user });
}));

// PATCH /api/bot/users/:telegramId
router.patch('/users/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const { firstName, lastName, middleName, phone, email } = req.body;

  const user = await prisma.user.update({
    where: { id: tgAccount.userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(middleName !== undefined && { middleName }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      middleName: true, phone: true, role: true, isActive: true,
    },
  });

  res.json({ success: true, data: user });
}));

// POST /api/bot/grant-access
router.post('/grant-access', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, courseSlug } = req.body;

  if (!telegramId || !courseSlug) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and courseSlug are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
    include: { user: true },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: tgAccount.user.id, courseId: course.id } },
    create: { userId: tgAccount.user.id, courseId: course.id, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  await prisma.notification.create({
    data: {
      userId: tgAccount.user.id,
      title: 'Доступ к курсу открыт',
      message: `Вам открыт доступ к курсу "${course.title}"`,
      type: 'success',
    },
  });

  await cacheDelete(`progress:${tgAccount.user.id}`);

  res.json({ success: true, data: { enrollment, userId: tgAccount.user.id } });
}));

// POST /api/bot/revoke-access
router.post('/revoke-access', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, courseSlug } = req.body;

  if (!telegramId || !courseSlug) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId and courseSlug are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  await prisma.enrollment.update({
    where: { userId_courseId: { userId: tgAccount.userId, courseId: course.id } },
    data: { status: 'REVOKED' },
  });

  await cacheDelete(`progress:${tgAccount.userId}`);

  res.json({ success: true });
}));

// GET /api/bot/users/:telegramId/enrollments
router.get('/users/:telegramId/enrollments', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: tgAccount.userId, status: 'ACTIVE' },
    include: {
      course: {
        select: { id: true, slug: true, title: true, description: true, coverUrl: true },
      },
    },
  });

  res.json({ success: true, data: enrollments });
}));

// GET /api/bot/courses — public course list
router.get('/courses', asyncHandler(async (_req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true, slug: true, title: true, description: true, coverUrl: true,
      _count: { select: { modules: true, enrollments: true } },
      modules: {
        where: { isPublished: true },
        select: { _count: { select: { lessons: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: courses.map(c => ({
      id: c.id, slug: c.slug, title: c.title, description: c.description, coverUrl: c.coverUrl,
      totalModules: c._count.modules,
      totalLessons: c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
      enrollmentCount: c._count.enrollments,
    })),
  });
}));

// GET /api/bot/courses/:slug
router.get('/courses/:slug', asyncHandler(async (req: Request, res: Response) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug, isPublished: true },
    select: {
      id: true, slug: true, title: true, description: true, coverUrl: true,
      modules: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true, title: true, order: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, type: true, duration: true, order: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  res.json({ success: true, data: course });
}));

// GET /api/bot/users/:telegramId/progress/:courseSlug
router.get('/users/:telegramId/progress/:courseSlug', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const course = await prisma.course.findUnique({
    where: { slug: req.params.courseSlug },
    select: {
      id: true, title: true,
      modules: {
        where: { isPublished: true },
        select: {
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const completed = await prisma.lessonProgress.count({
    where: { userId: tgAccount.userId, lessonId: { in: allLessonIds }, completed: true },
  });

  res.json({
    success: true,
    data: {
      courseId: course.id,
      courseTitle: course.title,
      totalLessons: allLessonIds.length,
      completedLessons: completed,
      progressPercent: allLessonIds.length > 0 ? Math.round((completed / allLessonIds.length) * 100) : 0,
    },
  });
}));

// GET /api/bot/stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalEnrollments, activeCourses] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  res.json({ success: true, data: { totalUsers, totalEnrollments, activeCourses } });
}));

// POST /api/bot/notifications
router.post('/notifications', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, title, message } = req.body;

  if (!telegramId || !title || !message) {
    throw new AppError(400, 'VALIDATION_ERROR', 'telegramId, title, and message are required');
  }

  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const notification = await prisma.notification.create({
    data: { userId: tgAccount.userId, title, message, type: 'info' },
  });

  res.json({ success: true, data: notification });
}));

// GET /api/bot/users/:telegramId/certificates
router.get('/users/:telegramId/certificates', asyncHandler(async (req: Request, res: Response) => {
  const tgAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId: req.params.telegramId },
  });

  if (!tgAccount) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No user with this telegramId');
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: tgAccount.userId },
    include: { course: { select: { title: true } } },
    orderBy: { issuedAt: 'desc' },
  });

  res.json({
    success: true,
    data: certificates.map(c => ({
      id: c.id, number: c.number, courseTitle: c.course.title, issuedAt: c.issuedAt,
    })),
  });
}));

// GET /api/bot/certificates/verify/:number
router.get('/certificates/verify/:number', asyncHandler(async (req: Request, res: Response) => {
  const cert = await prisma.certificate.findUnique({
    where: { number: req.params.number },
    include: {
      user: { select: { firstName: true, lastName: true, middleName: true } },
      course: { select: { title: true } },
    },
  });

  if (!cert) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found');
  }

  res.json({
    success: true,
    data: {
      number: cert.number,
      fullName: [cert.user.lastName, cert.user.firstName, cert.user.middleName].filter(Boolean).join(' '),
      courseTitle: cert.course.title,
      issuedAt: cert.issuedAt,
    },
  });
}));

export { router as botRouter };
```

- [ ] **Step 3: Verify build**

```bash
cd apps/api && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: full Bot API — users, enrollments, courses, progress, stats, notifications, certificates"
```

---

### Task 7: Add Swagger/OpenAPI documentation

**Files:**
- Create: `apps/api/src/swagger.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install swagger deps**

```bash
cd apps/api && npm install swagger-jsdoc swagger-ui-express && npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

- [ ] **Step 2: Create swagger.ts config**

Create `apps/api/src/swagger.ts`:

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AiBot LMS API',
      version: '2.0.0',
      description: 'API for AiBot LMS platform. Includes student-facing endpoints (JWT auth), admin endpoints, and Bot API for external Telegram bot integration.',
    },
    servers: [
      { url: '/api', description: 'API base' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /api/auth/login or /api/auth/telegram',
        },
        BotSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Bot-Secret',
          description: 'Shared secret for Bot API endpoints',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'telegramId is required' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', nullable: true },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            middleName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            coverUrl: { type: 'string', nullable: true },
            totalModules: { type: 'integer' },
            totalLessons: { type: 'integer' },
            enrollmentCount: { type: 'integer' },
          },
        },
        Progress: {
          type: 'object',
          properties: {
            courseId: { type: 'string' },
            courseTitle: { type: 'string' },
            totalLessons: { type: 'integer' },
            completedLessons: { type: 'integer' },
            progressPercent: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication (login, refresh, Telegram HMAC)' },
      { name: 'Courses', description: 'Public course catalog and details' },
      { name: 'Progress', description: 'Lesson progress tracking' },
      { name: 'Certificates', description: 'Certificate management' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Bot API', description: 'Endpoints for external Telegram bot (X-Bot-Secret auth)' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

- [ ] **Step 3: Mount Swagger UI in index.ts**

In `apps/api/src/index.ts`, add after imports:

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
```

Add before the routes section:

```typescript
// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AiBot LMS API Docs',
}));
app.get('/api/docs/json', (_req, res) => res.json(swaggerSpec));
```

- [ ] **Step 4: Add JSDoc annotations to bot.ts routes**

Add JSDoc comments above each route handler in `apps/api/src/routes/bot.ts`. Example for the first two:

```typescript
/**
 * @openapi
 * /bot/users:
 *   post:
 *     tags: [Bot API]
 *     summary: Create user with TelegramAccount
 *     security:
 *       - BotSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [telegramId, firstName]
 *             properties:
 *               telegramId: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User created }
 *       200: { description: User already exists }
 *       400: { description: Validation error }
 */
```

Add similar annotations to all bot routes. This is mechanical — each route gets a `@openapi` block with tag `Bot API`, summary, security `BotSecret`, requestBody/parameters, and responses.

Also add annotations to existing routes in `auth.ts`, `courses.ts`, `certificates.ts`, `notifications.ts`, `progress.ts`.

- [ ] **Step 5: Verify build and Swagger loads**

```bash
cd apps/api && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Swagger/OpenAPI documentation for all API endpoints"
```

---

### Task 8: Video streaming endpoint

**Files:**
- Create: `apps/api/src/routes/videos.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create video streaming route with Range header support**

Create `apps/api/src/routes/videos.ts`:

```typescript
import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const VIDEOS_DIR = path.resolve(__dirname, '../../public/videos');

// GET /api/videos/:filename — stream video with Range support
router.get('/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;

  // Sanitize filename — only allow alphanumeric, hyphens, underscores, dots
  if (!/^[\w.-]+$/.test(filename)) {
    throw new AppError(400, 'INVALID_FILENAME', 'Invalid filename');
  }

  const filePath = path.join(VIDEOS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video file not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

export { router as videosRouter };
```

- [ ] **Step 2: Mount video route in index.ts**

In `apps/api/src/index.ts`, add import:

```typescript
import { videosRouter } from './routes/videos';
```

Add route:

```typescript
app.use('/api/videos', videosRouter);
```

- [ ] **Step 3: Create videos directory**

```bash
mkdir -p apps/api/public/videos
```

- [ ] **Step 4: Download the YouTube video**

Download using yt-dlp (must be installed):

```bash
yt-dlp -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]" -o "apps/api/public/videos/intro.mp4" "https://youtu.be/PkXjihPOl58"
```

If yt-dlp is not installed:
```bash
pip install yt-dlp
```

Or download manually and place the file at `apps/api/public/videos/intro.mp4`.

- [ ] **Step 5: Update Dockerfile to include videos directory**

In `Dockerfile`, after the existing COPY lines (after line 40), add:

```dockerfile
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
```

- [ ] **Step 6: Verify build**

```bash
cd apps/api && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: video streaming endpoint with Range headers, download YouTube video"
```

---

### Task 9: Deploy to Railway

**Files:**
- No new files

- [ ] **Step 1: Build everything locally to verify**

```bash
npm run build
```
Expected: All packages and apps build successfully.

- [ ] **Step 2: Deploy API**

```bash
railway service api && railway up --detach
```

- [ ] **Step 3: Deploy Web**

```bash
railway service lms-platform && railway up --detach
```

- [ ] **Step 4: Reset production DB and seed**

Set the production DATABASE_URL and run:

```bash
cd packages/database && DATABASE_URL="<production-db-url>" npx prisma migrate deploy
cd packages/database && DATABASE_URL="<production-db-url>" npx tsx prisma/seed.ts
```

- [ ] **Step 5: Set BOT_SECRET env var on Railway**

```bash
railway service api && railway variables set BOT_SECRET=<your-secret-here>
```

- [ ] **Step 6: Verify production**

- Visit `/api/docs` — Swagger UI loads
- Visit `/api/health` — returns `{ status: 'ok' }`
- Login as admin@aibot.kz — courses page loads fast
- Login as student@aibot.kz — courses page shows enrollment badge
- Navigate to certificates — page loads fast
- Test Bot API: `curl -H "X-Bot-Secret: <secret>" <api-url>/api/bot/stats`

- [ ] **Step 7: Commit final changes (if any)**

```bash
git add -A && git commit -m "chore: deploy to Railway with clean DB"
```
