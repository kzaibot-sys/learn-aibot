# Learn.Aibot.KZ Platform V2 (Rebuild)

## 1) System Architecture

### Frontend (Next.js 16 + TailwindCSS)
- App Router with route-based pages:
  - learner workspace (`/dashboard`, `/courses`, `/learn/[courseId]`)
  - admin control center (`/admin`)
  - instructor/social/chat routes
- API client layer in `src/lib/api` with typed contracts.
- Query orchestration with React Query.
- Global UI shell:
  - sidebar navigation
  - theme toggle (light/dark)
  - consistent surface/card system

### Backend (NestJS + Prisma + PostgreSQL)
- Modular monolith with clear domain boundaries:
  - `auth`, `users`, `courses`, `learning`, `instructor`, `admin`
  - `payments` (mock checkout)
  - `media` (video upload + streaming endpoint)
  - `gamification` (XP/levels/streaks/achievements)
  - `social`, `chat`, `assignments`, `certificates`
- Global validation, global exception filter, request-id support.
- RBAC via JWT + role guards.

### Data Layer
- Prisma schema expanded for:
  - `Payment`
  - `MediaAsset`
  - `UserGamificationProfile`
  - `AchievementDefinition`
  - `UserAchievement`
  - `GamificationEvent`
- Migration: `20260321211900_v2_platform_rebuild`

## 2) Folder Structure

```text
Learn.Aibot.KZ/
  backend/
    prisma/
      schema.prisma
      migrations/
    src/
      admin/
      assignments/
      auth/
      certificates/
      chat/
      common/
      courses/
      gamification/
      health/
      instructor/
      learning/
      media/
      payments/
      social/
      users/
      app.module.ts
      main.ts
  frontend/
    src/
      app/
        admin/
        courses/
        dashboard/
        learn/[courseId]/
        ...
      components/
        auth/
        layout/
        learn/
        providers/
        ui/
      lib/
        api/
        hooks/
        store/
```

## 3) Core API Surface (V2 Additions)

### Gamification
- `GET /api/v1/gamification/me`

### Learning / Course Flow
- `GET /api/v1/courses/:courseId/curriculum` (with lock/unlock state)
- `PUT /api/v1/lessons/:lessonId/progress` (triggers XP/streak updates)

### Payments (Mock)
- `POST /api/v1/payments/courses/:courseId/checkout`
- `GET /api/v1/payments/admin/list`

### Media / Video
- `POST /api/v1/instructor/uploads/video`
- `GET /api/v1/media/:assetId`
- `GET /api/v1/media/stream/:assetId`

### Admin Control Center
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/courses`
- `GET /api/v1/admin/payments`
- `POST /api/v1/admin/courses`
- `PATCH /api/v1/admin/courses/:courseId`
- `DELETE /api/v1/admin/courses/:courseId`
- `POST /api/v1/admin/courses/:courseId/modules`
- `POST /api/v1/admin/modules/:moduleId/lessons`

### User Dashboard Aggregate
- `GET /api/v1/users/me/dashboard`

## 4) UX/Design System Notes

- New app shell with persistent sidebar + topbar.
- New design tokens in `frontend/src/app/globals.css`.
- Theme switching via `ThemeProvider`.
- Rebuilt pages:
  - landing (`/`)
  - dashboard (`/dashboard`)
  - catalog (`/courses`)
  - learning player (`/learn/[courseId]`)
  - admin (`/admin`)

## 5) Run Instructions

### Backend
```powershell
cd backend
npm run db:up
npm run prisma:migrate
npm run prisma:generate
npm run start:dev
```

### Frontend
```powershell
cd frontend
npm run dev
```

### Quality Gates

Backend:
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run smoke:learner`
- `npm run smoke:moderation`

Frontend:
- `npm run lint`
- `npm run build`
