# Agent-3 Builder — Task List

## Database (Prisma)

- [ ] **T3.1** Обновить User модель в `packages/database/prisma/schema.prisma`:
  ```prisma
  // Добавить поля:
  totalXp      Int       @default(0)    @map("total_xp")
  level        Int       @default(1)
  streak       Int       @default(0)
  lastActiveAt DateTime? @map("last_active_at")
  // Добавить relation:
  achievements UserAchievement[]
  ```

- [ ] **T3.2** Создать модель UserAchievement:
  ```prisma
  model UserAchievement {
    id            String   @id @default(cuid())
    userId        String   @map("user_id")
    achievementId String   @map("achievement_id")
    earnedAt      DateTime @default(now()) @map("earned_at")
    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@unique([userId, achievementId])
    @@index([userId])
    @@map("user_achievements")
  }
  ```

- [ ] **T3.3** Добавить Certificate → Course relation:
  - В Certificate модель: `course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)`
  - В Course модель: `certificates Certificate[]`

- [ ] **T3.4** Добавить индекс на users.total_xp:
  - В User: `@@index([totalXp])` для быстрого leaderboard

- [ ] **T3.5** Запустить миграцию:
  ```bash
  cd packages/database && npx prisma migrate dev --name add-gamification-fields
  npx prisma generate
  ```

## Gamification Config

- [ ] **T3.6** Создать `apps/api/src/config/gamification.ts`:
  - XP_PER_LESSON = 25
  - STREAK_BONUS_XP = 15
  - UserStats interface
  - ACHIEVEMENTS object (10 ачивок с условиями)
  - calculateLevel(xp) function
  - xpForNextLevel(currentXp) function

## Gamification Service

- [ ] **T3.7** Создать `apps/api/src/services/gamification.ts`:
  - `getUserStats(userId)` — completedLessons, completedCourses, streak, lessonsToday, totalXp
  - `updateStreak(userId)` — подсчёт стрика (0 дней = reset, 1 день = increment, same day = keep)
  - `checkAndAwardAchievements(userId, stats)` — проверить все conditions, создать UserAchievement если новый
  - `getCompletedCoursesCount(userId)` — подсчёт полностью завершённых курсов

## API Endpoints

- [ ] **T3.8** Улучшить `POST /api/progress/lesson/:id/complete` в `apps/api/src/routes/progress.ts`:
  - Upsert LessonProgress (completed: true)
  - Вычислить XP (XP_PER_LESSON + streak bonus)
  - Обновить User.totalXp, User.level
  - Обновить streak
  - Проверить achievements
  - Вернуть: `{ xpEarned, streakBonus, currentStreak, totalXp, level, newAchievements, levelUp }`

- [ ] **T3.9** Создать `apps/api/src/routes/gamification.ts`:
  - `GET /api/leaderboard` — top 50 users by totalXp, include rank
  - `GET /api/user/stats` — full gamification stats for current user
  - `GET /api/user/achievements` — list earned achievements mapped to config

- [ ] **T3.10** Зарегистрировать новые routes в `apps/api/src/index.ts`

## Validation

- [ ] **T3.11** Создать `apps/api/src/validators/gamification.ts`:
  - Zod schemas для query params (leaderboard limit, offset)

## Verification

- [ ] **T3.12** `npm run build` — 0 ошибок
- [ ] **T3.13** Проверить что `npm run db:generate` проходит без ошибок
