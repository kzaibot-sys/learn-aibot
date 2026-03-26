# Agent-4 Designer — Task List

## Phase A: Design System (независимо, делать первым)

- [ ] **T4.1** Обновить `apps/web/src/app/globals.css`:
  - Добавить CSS custom properties для новой палитры
  - Добавить @keyframes: fadeInUp, slideIn, scaleIn, shimmer, pulse-glow
  - Добавить utility classes: `.glass-card`, `.gradient-text`, `.hover-lift`
  - Обновить dark mode переменные (Slate 900/800/700 палитра)
  - Добавить `.scroll-reveal` class для IntersectionObserver

- [ ] **T4.2** Проверить/установить shadcn компоненты:
  - Использовать `mcp__shadcn__search_items_in_registries` для поиска: Card, Button, Badge, Progress, Accordion, Dialog, Tabs, Avatar, Tooltip
  - Установить недостающие через `mcp__shadcn__get_add_command_for_items`

## Phase B: Landing Page Redesign (после Agent-1 пофиксит framer-motion)

- [ ] **T4.3** Использовать `frontend-design` skill для Hero Section:
  - Full-screen gradient mesh background
  - Bold headline + tagline
  - CTA button с hover анимацией
  - Decorative blur circles / floating shapes
  - Responsive: stack vertically on mobile

- [ ] **T4.4** Redesign About Section:
  - 2-column layout (text + visual)
  - Key numbers / stats в glassmorphism cards
  - ScrollReveal animation

- [ ] **T4.5** Redesign Curriculum/Program Section:
  - Grid of 8 module cards (4×2 on desktop, 2×4 tablet, 1×8 mobile)
  - Each card: number, icon, title, short description
  - Gradient borders, hover lift effect

- [ ] **T4.6** Redesign Advantages Section:
  - 4-6 icon blocks in grid
  - Icon + title + description
  - Glassmorphism card style

- [ ] **T4.7** Redesign HowItWorks Section:
  - 3 numbered steps with connecting line/arrows
  - Step number in gradient circle
  - Alternating left/right layout on desktop

- [ ] **T4.8** Redesign Reviews Section:
  - Card grid (not carousel) for simplicity
  - Avatar, name, role, quote
  - Star rating
  - Subtle shadow and hover effect

- [ ] **T4.9** Redesign FAQ Section:
  - CSS-only accordion (no framer-motion)
  - Smooth max-height transition
  - Plus/minus icon rotation
  - Grouped by category if applicable

- [ ] **T4.10** Create CTA Section (new):
  - Gradient banner
  - Bold text + CTA button
  - Before Footer

- [ ] **T4.11** Redesign Footer:
  - 3-4 column grid
  - Logo + tagline, navigation links, legal links, contacts
  - Social media icons
  - Copyright with dynamic year

## Phase C: LMS Dashboard Modernization

- [ ] **T4.12** Modernize Dashboard page (`apps/web/src/app/dashboard/page.tsx`):
  - Stats widgets row (XP, Level, Streak, Courses)
  - "Continue Learning" section with current course card
  - Recent activity feed
  - Использовать `mcp__magic__21st_magic_component_inspiration` для вдохновения

- [ ] **T4.13** Modernize Course Catalog (`apps/web/src/app/courses/page.tsx`):
  - Modern card design with gradient overlay on image
  - Hover: scale + shadow
  - Badge for category
  - Progress bar if enrolled
  - Lesson count, module count

- [ ] **T4.14** Modernize Sidebar:
  - UserLevel component at bottom
  - Active link indicator (gradient left border)
  - Smooth transitions

## Phase D: Gamification UI (ПОСЛЕ Agent-3 готов)

- [ ] **T4.15** Создать `apps/web/src/components/gamification/CompleteLessonButton.tsx`:
  - Кнопка "Завершить урок"
  - POST fetch к API
  - XP popup анимация (+25 XP)
  - Level up celebration если новый уровень
  - Использовать `frontend-design` skill

- [ ] **T4.16** Создать `apps/web/src/components/gamification/AchievementToast.tsx`:
  - Fixed-position toast (bottom-right)
  - Slide-in animation
  - Achievement icon + title + description
  - Auto-dismiss после 5s

- [ ] **T4.17** Создать `apps/web/src/components/gamification/UserLevel.tsx`:
  - Level badge (число в gradient circle)
  - XP progress bar до следующего уровня
  - Streak fire icon + count
  - Компактный для sidebar

- [ ] **T4.18** Создать `apps/web/src/components/gamification/CourseProgress.tsx`:
  - Circular or linear progress bar
  - Percentage display
  - Module breakdown

- [ ] **T4.19** Redesign Leaderboard page (`apps/web/src/app/leaderboard/page.tsx` — create if needed):
  - Table/list с рангами
  - Top 3 с медалями (🥇🥈🥉)
  - Current user highlighted
  - XP, Level, Streak columns

- [ ] **T4.20** Redesign Achievements page (`apps/web/src/app/achievements/page.tsx`):
  - Grid of achievement cards
  - Earned: full color, glow effect, earned date
  - Locked: grayscale, lock icon overlay
  - Progress toward next achievement

- [ ] **T4.21** Redesign Certificates page (`apps/web/src/app/certificates/page.tsx`):
  - Empty state: icon + "Завершите курс для получения сертификата"
  - Certificate cards: gradient border, certificate number, course title, issue date
  - Download button

## Phase E: Loading & Error States

- [ ] **T4.22** Создать `loading.tsx` для каждого route:
  - `app/dashboard/loading.tsx`
  - `app/courses/loading.tsx`
  - `app/achievements/loading.tsx`
  - `app/certificates/loading.tsx`
  - Shimmer skeleton animation

- [ ] **T4.23** Создать `error.tsx` для dashboard layout:
  - Friendly error message
  - Retry button
  - "Go to dashboard" fallback link

## Verification

- [ ] **T4.24** `npm run build` — 0 ошибок
- [ ] **T4.25** Визуальная проверка: dark/light theme, mobile/desktop
