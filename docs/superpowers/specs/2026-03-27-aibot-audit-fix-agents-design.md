# AiBot — Audit, Fix & 5-Agent System Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Author:** Claude + User

---

## 1. Overview

AiBot is an LMS platform for online courses. A previous implementation pass (phases 1-10) left significant gaps: gamification system was never built, framer-motion bugs persist on landing, branding remnants of "LearnHub" remain, payment UI was not fully removed, and the design is outdated.

This spec defines:
1. A comprehensive PRD for all remaining work
2. A 5-agent parallel execution system with roles, memory, and launch scripts
3. Modern redesign of Landing + LMS using CSS animations, shadcn, and 21st.dev components
4. Architecture and code quality improvements

## 2. Current State Audit

### 2.1 Critical Issues Found

| Area | Status | Details |
|------|--------|---------|
| Landing — Framer Motion | BROKEN | 10/12 components still import `framer-motion`. `useScrollAnimation` hook does NOT exist. Sections invisible in prod |
| Branding | PARTIAL | "LearnHub" found in 3 files: `Sidebar.tsx`, `MobileNav.tsx`, `login/page.tsx` |
| Payments UI | NOT REMOVED | `PricingSection.tsx` exists. Payment mentions in 6 files |
| Gamification | NOT BUILT | No `lib/gamification/`, no API routes, no UI components, no Prisma fields (totalXp, level, streak missing from User) |
| Leaderboard | EMPTY SHELL | Page exists at `app/achievements/page.tsx` but no backend API |
| Achievements | EMPTY SHELL | Page exists but no achievement system |
| Certificates | PARTIAL | Prisma model exists but missing Course relation, API only in Express |
| Design | OUTDATED | Generic design, no modern patterns (glassmorphism, gradients, micro-interactions) |

### 2.2 What Works

- Auth system (JWT + refresh tokens)
- Prisma schema (base models: User, Course, Module, Lesson, etc.)
- Express API with routes for auth, courses, progress, admin, notifications
- i18n system (ru/kz)
- Theme system (light/dark with CSS variables)
- Admin panel (courses, students, payments management)
- Telegram bot integration
- Docker + Railway deployment setup

## 3. Architecture: 5-Agent System

### 3.1 Agent Roles

| Agent | Name | Role | Scope |
|-------|------|------|-------|
| 1 | `bugfixer` | Bug Fixes | Fix all broken functionality from AIBOT_INSTRUCTIONS phases 1, 1.4, 1.5, 1.6 |
| 2 | `cleaner` | Branding & Cleanup | Remove LearnHub, payments UI, dead code; fix footer, favicon; clean architecture |
| 3 | `builder` | New Features | Gamification system end-to-end: Prisma → service → API → integration |
| 4 | `designer` | UI/Design | Modern redesign of Landing + LMS; gamification UI; loading states; responsive |
| 5 | `tester` | QA & Verify | Build verification, e2e tests, checklist validation, regression checks |

### 3.2 Dependency Graph

```
Agent-1 (bugfixer)  ─── parallel ───┐
Agent-2 (cleaner)   ─── parallel ───┤
Agent-3 (builder)   ─── parallel ───┼──► Agent-5 (tester) runs final QA
Agent-4 (designer)  ─── parallel ───┘
                                     │
Agent-4 waits for Agent-3 gamification backend before building gamification UI
Agent-4 starts with Landing (independent) while Agent-3 builds backend
Agent-5 runs continuous QA, final comprehensive pass when all done
```

### 3.3 File System Structure

```
agents/
├── launch.sh                    # Launch all 5 agents in separate terminals
├── launch.ps1                   # PowerShell version for Windows
├── shared/
│   └── PROJECT_CONTEXT.md       # Shared context: stack, structure, conventions
├── agent-1-bugfixer/
│   ├── ROLE.md                  # Role definition, tools, constraints
│   ├── TASKS.md                 # Checklist of tasks
│   └── MEMORY.md               # Agent-specific context
├── agent-2-cleaner/
│   ├── ROLE.md
│   ├── TASKS.md
│   └── MEMORY.md
├── agent-3-builder/
│   ├── ROLE.md
│   ├── TASKS.md
│   └── MEMORY.md
├── agent-4-designer/
│   ├── ROLE.md
│   ├── TASKS.md
│   └── MEMORY.md
└── agent-5-tester/
    ├── ROLE.md
    ├── TASKS.md
    └── MEMORY.md
```

### 3.4 Conflict Prevention Rules

- Each agent works in designated file zones (listed in ROLE.md)
- Agent-1: `apps/web/src/components/landing/*.tsx`, `apps/web/src/components/lms/MobileNav.tsx`, `apps/web/src/app/courses/`, `apps/web/src/app/login/`
- Agent-2: `apps/web/src/components/lms/Sidebar.tsx`, `apps/web/src/components/landing/PricingSection.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/public/`, legal pages
- Agent-3: `packages/database/prisma/schema.prisma`, `apps/api/src/routes/progress.ts`, `apps/api/src/routes/gamification.ts` (new), `apps/api/src/services/` (new), `apps/web/src/lib/gamification/` (new)
- Agent-4: `apps/web/src/components/landing/` (AFTER Agent-1 fixes), `apps/web/src/components/gamification/` (new), `apps/web/src/components/ui/`, `apps/web/src/hooks/`, `apps/web/src/app/*/page.tsx` (dashboard pages), `apps/web/src/app/globals.css`
- Agent-5: read-only audit + `apps/web/src/app/error.tsx`, test files

## 4. Detailed Task Specifications

### 4.1 Agent-1: Bug Fixes

**T1.1** Remove Framer Motion from ALL landing components (10 files):
- `HeroSection.tsx`, `AboutSection.tsx`, `ProgramSection.tsx`, `AudienceSection.tsx`
- `ResultsSection.tsx`, `CoursesSection.tsx`, `HowItWorksSection.tsx`
- `ReviewsSection.tsx`, `FAQSection.tsx`, `PricingSection.tsx`
- Replace `<motion.div>` → `<div>` with CSS classes
- Remove all `import { motion } from 'framer-motion'`

**T1.2** Create `apps/web/src/hooks/useScrollAnimation.ts`:
- IntersectionObserver-based scroll reveal
- `ScrollReveal` wrapper component
- CSS transitions (opacity, transform, delay)

**T1.3** Fix MobileNav:
- Ensure burger button has z-index > header
- Proper state management (useState for isOpen)
- Body scroll lock when menu open
- Close on pathname change

**T1.4** Fix video player for TEXT lessons:
- Wrap video player in `lesson.type === "VIDEO"` check
- Show prose content for TEXT lessons

**T1.5** Fix login form clearing after logout

**T1.6** Fix course lesson count:
- API route must include modules→lessons in query
- Return `totalLessons` computed field

### 4.2 Agent-2: Branding & Cleanup

**T2.1** Replace "LearnHub" / "LearnHub Pro" → "AiBot" in all files

**T2.2** Delete `PricingSection.tsx` entirely

**T2.3** Remove payment/billing/subscription UI references from:
- Navigation links
- Sidebar
- Admin pages (keep admin/payments for viewing history)
- Course cards (remove premium badges, lock icons, buy buttons)

**T2.4** Fix Footer:
- Dynamic year: `{new Date().getFullYear()}`
- Create legal pages: `/privacy`, `/terms`, `/offer` with basic content

**T2.5** Fix Favicon:
- Create `apps/web/public/favicon.svg` with robot emoji
- Update `layout.tsx` metadata

**T2.6** Code cleanup:
- Remove unused imports across all modified files
- Consistent named exports
- Remove dead code paths

### 4.3 Agent-3: New Features (Gamification)

**T3.1** Prisma schema updates:
```prisma
// Add to User model:
totalXp     Int       @default(0)    @map("total_xp")
level       Int       @default(1)
streak      Int       @default(0)
lastActiveAt DateTime? @map("last_active_at")
achievements UserAchievement[]

// New model:
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

// Add to Certificate:
course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
// Add to Course:
certificates Certificate[]
```

**T3.2** Gamification config (`apps/api/src/config/gamification.ts`):
- XP_PER_LESSON = 25, STREAK_BONUS = 15
- ACHIEVEMENTS object with conditions
- calculateLevel(), xpForNextLevel()

**T3.3** Gamification service (`apps/api/src/services/gamification.ts`):
- getUserStats()
- updateStreak()
- checkAndAwardAchievements()
- getCompletedCoursesCount()

**T3.4** API endpoints (in `apps/api/src/routes/`):
- Enhance `POST /progress/lesson/:id/complete` — add XP, streak, achievements
- Add `GET /leaderboard` — top 50 by totalXp
- Add `GET /user/stats` — full gamification stats
- Enhance `GET /progress/course/:courseId` — add percentage, per-module breakdown

**T3.5** Zod validation schemas for all new endpoints

### 4.4 Agent-4: Modern Design

**T4.1** Update design system in `globals.css`:
- Modern gradient palette (Indigo → Violet primary)
- Glassmorphism variables
- CSS animation keyframes (fadeInUp, slideIn, scaleIn, shimmer)
- Improved dark mode palette

**T4.2** Landing page complete rebuild (after Agent-1 cleans framer-motion):
- Hero: Full-screen gradient mesh, bold headline, CTA, decorative blur circles
- About: What AiBot is, who it's for, key numbers
- Curriculum: Grid of module cards with icons and numbering
- Advantages: 4-6 icon blocks
- HowItWorks: 3 numbered steps with connecting line
- Reviews: Card carousel/grid
- FAQ: Smooth CSS accordion
- CTA: Final banner with gradient
- Footer: Contacts, legal links, social
- ALL sections wrapped in ScrollReveal
- Mobile-first responsive
- Use shadcn components via MCP where applicable
- Use 21st.dev magic components for inspiration

**T4.3** LMS Dashboard modernization:
- Course cards with hover effects, gradient borders
- Progress bars with CSS animation
- Stats widgets (XP, streak, level)
- Modern sidebar with UserLevel component

**T4.4** Gamification UI components (after Agent-3 backend ready):
- `CompleteLessonButton.tsx` — POST to API, show XP popup
- `AchievementToast.tsx` — fixed-position animated toast
- `UserLevel.tsx` — level badge + XP progress bar
- `CourseProgress.tsx` — course completion progress
- `LeaderboardPage` — ranked table with medals for top 3
- `AchievementsPage` — grid of all achievements (earned highlighted, locked grayed)
- `CertificatesPage` — gradient certificate cards

**T4.5** Loading states:
- `loading.tsx` skeleton for every route
- Shimmer animation on skeleton cards

**T4.6** Error boundaries:
- `error.tsx` for dashboard routes
- Friendly error UI with retry button

### 4.5 Agent-5: QA & Verification

**T5.1** Run `npm run build` — fix any errors
**T5.2** Validate POST-FIX CHECKLIST (all 16 items)
**T5.3** Playwright smoke tests via MCP:
- Landing: all sections visible, scroll animations
- Login: fields clear, form works
- Mobile: burger menu opens/closes
- Dashboard: course cards show lesson count
- Leaderboard: renders with data
- Achievements: shows grid
- Dark mode toggle
- i18n switch (ru/kz)
**T5.4** Mobile responsive checks (320px, 768px, 1024px, 1440px)
**T5.5** Performance: no unused JS imports, no large bundles
**T5.6** Regression report

## 5. Design System

### 5.1 Color Palette

```css
/* Light */
--primary: #6366f1;        /* Indigo 500 */
--primary-hover: #4f46e5;  /* Indigo 600 */
--accent: #8b5cf6;         /* Violet 500 */
--cyan: #06b6d4;
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* Dark */
--background: #0f172a;     /* Slate 900 */
--card: #1e293b;           /* Slate 800 */
--border: #334155;         /* Slate 700 */
```

### 5.2 Component Library

Use shadcn/ui components: Card, Button, Badge, Progress, Dialog, Accordion, Tabs, Avatar, Tooltip.

Custom components: XPBar, AchievementCard, LeaderboardRow, CertificateCard, ScrollReveal.

### 5.3 Animation Rules

- NO framer-motion on landing page
- CSS transitions: `transition-all duration-300 ease-out`
- Scroll reveal: IntersectionObserver + CSS transform/opacity
- Keyframes: fadeInUp (0.6s), slideIn (0.4s), scaleIn (0.3s), shimmer (1.5s infinite)
- Hover: `scale(1.02)` on cards, `translateY(-2px)` on buttons

## 6. Architecture Improvements

### 6.1 Backend (apps/api)

- Service layer pattern: `services/gamification.ts`, `services/progress.ts`
- Zod schemas in `validators/` directory for all request bodies
- Consistent error codes via AppError
- Rate limiting on gamification endpoints

### 6.2 Frontend (apps/web)

- React Query hooks in `hooks/api/`: `useUserStats()`, `useCourseProgress()`, `useLeaderboard()`
- Component directory structure: `ui/`, `lms/`, `landing/`, `gamification/`
- Loading/error boundaries per route group
- Proper TypeScript interfaces for all API responses

### 6.3 Database

- Add index on `users.total_xp` for leaderboard queries
- Add Certificate → Course relation
- Migration: `add-gamification-fields`

## 7. Success Criteria

- [ ] `npm run build` passes with 0 errors
- [ ] All 12 landing sections visible and animated (CSS only)
- [ ] No "LearnHub" mentions anywhere in codebase
- [ ] No payment/pricing UI visible to students
- [ ] Gamification: complete lesson → XP awarded → achievements checked → toast shown
- [ ] Leaderboard: shows ranked users by XP
- [ ] Achievements: grid with earned/locked states
- [ ] Certificates: available after 100% course completion
- [ ] Mobile responsive: all pages work at 320px+
- [ ] Dark/Light theme: consistent across all pages
- [ ] i18n: ru/kz switching works
- [ ] Modern design: gradients, glassmorphism, micro-interactions
- [ ] Favicon loads (no 404)
- [ ] Footer: dynamic year, working legal links

## 8. Tools & MCP Usage

| Tool | Usage |
|------|-------|
| `mcp__shadcn` | Query and install shadcn/ui components |
| `mcp__magic__21st_magic_component_builder` | Generate modern UI components |
| `mcp__magic__21st_magic_component_inspiration` | Design inspiration for layouts |
| `mcp__playwright` | E2E testing and visual verification |
| `mcp__context7` | Up-to-date docs for Next.js, Prisma, Tailwind |
| `mcp__github` | PR creation, issue tracking |
| `frontend-design` skill | Modern frontend implementation |
| `feature-dev` skill | Feature architecture and implementation |

## 9. Open Questions

None — all questions resolved during brainstorming.
