TECHNICAL SPECIFICATION
Backend Architecture
Образовательная Платформа
Version: 1.0
Date: 21.03.2026


1. Backend Architecture Overview
1.1 Технологический стек
Core Stack
•Runtime: Node.js 20 LTS
•Framework: NestJS 10.x (TypeScript)
•ORM: Prisma 5.x
•API Type: RESTful + GraphQL (опционально)
Database Layer
•Primary DB: PostgreSQL 15.x
•Cache: Redis 7.x
•Search: Elasticsearch 8.x (опционально)
Infrastructure
•Storage: AWS S3 / MinIO
•CDN: CloudFlare / AWS CloudFront
•Queue: BullMQ (Redis-based)
•Container: Docker + Kubernetes
1.2 Архитектурные слои
1.API Gateway Layer - Маршрутизация, аутентификация, rate limiting
2.Controller Layer - Обработка HTTP запросов, валидация
3.Service Layer - Бизнес-логика
4.Repository Layer - Работа с БД через Prisma
5.Infrastructure Layer - Внешние сервисы, очереди, кэш


2. Database Schema
2.1 Prisma Schema
User Model
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  avatar        String?
  role          UserRole  @default(STUDENT)
  isPremium     Boolean   @default(false)
  premiumUntil  DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  enrollments   Enrollment[]
  progress      Progress[]
  comments      Comment[]
  certificates  Certificate[]
  payments      Payment[]
  
  @@index([email])
  @@index([role])
  @@index([isPremium])
}

enum UserRole {
  STUDENT
  INSTRUCTOR
  ADMIN
}

Course Model
model Course {
  id            String       @id @default(uuid())
  slug          String       @unique
  title         String
  description   String       @db.Text
  thumbnail     String
  category      Category     @relation(fields: [categoryId], references: [id])
  categoryId    String
  
  level         CourseLevel  @default(BEGINNER)
  language      String       @default("ru")
  duration      Int          // minutes
  price         Decimal      @db.Decimal(10, 2)
  isFree        Boolean      @default(false)
  isPublished   Boolean      @default(false)
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  publishedAt   DateTime?
  
  // Relations
  modules       Module[]
  enrollments   Enrollment[]
  reviews       Review[]
  
  @@index([categoryId])
  @@index([isPublished])
  @@index([isFree])
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}



Module & Lesson Models
model Module {
  id          String    @id @default(uuid())
  courseId    String
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  description String?   @db.Text
  order       Int
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  lessons     Lesson[]
  
  @@index([courseId])
  @@unique([courseId, order])
}

model Lesson {
  id          String       @id @default(uuid())
  moduleId    String
  module      Module       @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  description String?      @db.Text
  type        LessonType
  content     Json         // Video URL, text content, quiz data
  duration    Int?         // seconds
  order       Int
  isFree      Boolean      @default(false)
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  progress    Progress[]
  
  @@index([moduleId])
  @@unique([moduleId, order])
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  ASSIGNMENT
}

Progress Tracking
model Enrollment {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId        String
  course          Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  enrolledAt      DateTime  @default(now())
  completedAt     DateTime?
  progress        Int       @default(0) // 0-100
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model Progress {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId        String
  lesson          Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  completed       Boolean   @default(false)
  watchedDuration Int       @default(0) // seconds
  quizScore       Int?      // 0-100
  
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  lastAccessedAt  DateTime  @updatedAt
  
  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
}



Payment & Subscription
model Payment {
  id              String        @id @default(uuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  status          PaymentStatus @default(PENDING)
  provider        PaymentProvider
  
  transactionId   String?       @unique
  metadata        Json?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  paidAt          DateTime?
  
  @@index([userId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentProvider {
  STRIPE
  GOOGLE_PAY
  APPLE_PAY
  BANK_CARD
}

Comments & Q&A
model Comment {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  courseId    String?
  lessonId    String?
  parentId    String?   // For replies
  
  content     String    @db.Text
  isAnswer    Boolean   @default(false)
  upvotes     Int       @default(0)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  
  @@index([userId])
  @@index([courseId])
  @@index([lessonId])
  @@index([parentId])
}



3. API Specification
3.1 Authentication Endpoints
Method	Endpoint	Description	Auth Required
POST	/api/v1/auth/register	Регистрация нового пользователя	No
POST	/api/v1/auth/login	Вход в систему	No
POST	/api/v1/auth/refresh	Обновление токена	Refresh Token
POST	/api/v1/auth/logout	Выход из системы	Yes (JWT)



3.2 Courses Endpoints
Method	Endpoint	Description	Auth Required
GET	/api/v1/courses	Список курсов (pagination, filters)	Optional
GET	/api/v1/courses/:id	Детали курса с модулями	Optional
POST	/api/v1/courses/:id/enroll	Записаться на курс	Yes (JWT)
GET	/api/v1/courses/:id/modules	Модули курса с уроками	Yes (JWT)



3.3 Lessons & Progress Endpoints
Method	Endpoint	Description	Auth Required
GET	/api/v1/lessons/:id	Получить урок (видео URL, контент)	Yes (JWT)
POST	/api/v1/lessons/:id/progress	Обновить прогресс урока	Yes (JWT)
POST	/api/v1/lessons/:id/complete	Отметить урок завершенным	Yes (JWT)
GET	/api/v1/users/me/progress	Общий прогресс пользователя	Yes (JWT)



4. Authentication & Authorization
4.1 JWT Strategy
Token Structure
•Access Token - срок жизни 15 минут
•Refresh Token - срок жизни 7 дней
•Algorithm: RS256 (асимметричное шифрование)
JWT Payload
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "STUDENT",
  "isPremium": true,
  "iat": 1234567890,
  "exp": 1234568890
}

4.2 Password Security
•Algorithm: bcrypt с cost factor 12
•Minimum password length: 8 символов
•Requirements: минимум 1 uppercase, 1 lowercase, 1 digit
4.3 Rate Limiting
•Global: 100 requests/minute per IP
•Auth endpoints: 5 requests/minute per IP
•Premium users: 200 requests/minute


5. Video Streaming Architecture
5.1 Video Processing Pipeline
Upload Flow
6.Instructor загружает видео через multipart/form-data
7.Backend сохраняет в S3 (raw folder)
8.Создается задача в BullMQ для обработки
9.Worker транскодирует в HLS (m3u8 + ts сегменты)
10.Генерируются версии: 360p, 480p, 720p, 1080p
Transcoding Configuration
// FFmpeg команда для HLS
ffmpeg -i input.mp4 \
  -vf scale=w=1920:h=1080 -c:v libx264 -b:v 5000k -maxrate 5350k -bufsize 7500k \
  -c:a aac -b:a 192k -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "1080p_%03d.ts" 1080p.m3u8
  
// Аналогично для 720p, 480p, 360p с другими bitrate

5.2 CDN & Streaming
•CDN: CloudFlare / AWS CloudFront перед S3
•Signed URLs с TTL 3600 секунд для защиты контента
•Adaptive bitrate streaming через HLS protocol
•Cache-Control: max-age=86400 для .ts сегментов


6. Payment Integration
6.1 Stripe Integration (Web)
Payment Flow
11.Frontend вызывает POST /api/v1/payments/create-intent
12.Backend создает Stripe PaymentIntent
13.Frontend получает client_secret и инициирует оплату
14.Stripe отправляет webhook на /api/v1/webhooks/stripe
15.Backend обновляет статус payment и активирует премиум
Webhook Handling
// Stripe Webhook Handler
@Post('webhooks/stripe')
async handleStripeWebhook(@Req() req, @Res() res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.activatePremium(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await this.handlePaymentFailed(event.data.object);
      break;
  }
  
  return res.json({ received: true });
}

6.2 Mobile Payments
Google Play Billing (Android)
•Product ID: premium_monthly, premium_yearly
•Мобильное приложение инициирует purchase flow
•Purchase token отправляется на POST /api/v1/payments/verify-google
•Backend верифицирует через Google Play Developer API
Apple In-App Purchase (iOS)
•Product ID: com.platform.premium.monthly
•Receipt отправляется на POST /api/v1/payments/verify-apple
•Backend верифицирует через Apple App Store Server API


7. Caching Strategy
7.1 Redis Cache Layers
Data Type	Cache Key Pattern	TTL	Invalidation
Course List	courses:list:{filters}	5 minutes	On publish
Course Details	course:{id}	1 hour	On update
User Progress	progress:{userId}:{courseId}	30 seconds	On progress
Signed Video URL	video:url:{lessonId}	50 minutes	Auto-expire



8. Background Jobs (BullMQ)
8.1 Job Queues
Queue Name	Purpose	Concurrency
video-processing	Транскодирование видео в HLS	2 (CPU-intensive)
email-notifications	Отправка email уведомлений	10
certificate-generation	Генерация PDF сертификатов	5
analytics-aggregation	Агрегация статистики курсов	3



9. Monitoring & Logging
9.1 Logging Stack
•Logger: Winston (JSON format)
•Log Levels: error, warn, info, debug
•Aggregation: CloudWatch Logs / ELK Stack
•Retention: 30 days for info, 90 days for errors
9.2 Metrics & APM
•APM: New Relic / DataDog
•Metrics: Request rate, latency, error rate
•Database: Query performance, connection pool
•Custom: Video processing time, enrollment rate
9.3 Alerts
•Critical: API error rate > 1%, DB connection failure
•Warning: Response time > 500ms (P95), Queue delay > 5 min
•Channels: Slack, PagerDuty, Email


10. Deployment & DevOps
10.1 Container Configuration
Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

10.2 Environment Variables
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_ACCESS_SECRET=secret_key_access
JWT_REFRESH_SECRET=secret_key_refresh

# AWS S3
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret
AWS_S3_BUCKET=platform-videos
AWS_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Feature Flags
ENABLE_ELASTICSEARCH=false
ENABLE_VIDEO_TRANSCODING=true

10.3 CI/CD Pipeline
16.GitHub Actions / GitLab CI триггерится на push
17.Lint, type-check, unit tests
18.Build Docker image, push to registry
19.Deploy to staging → integration tests
20.Manual approval for production
21.Rolling update в Kubernetes