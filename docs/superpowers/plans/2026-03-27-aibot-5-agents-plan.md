# AiBot 5-Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all bugs, rebrand, build gamification, modernize design, and QA — via 5 parallel agents.

**Architecture:** Monorepo with Express API (`apps/api`), Next.js frontend (`apps/web`), Prisma DB (`packages/database`). Each agent owns specific file zones to avoid conflicts.

**Tech Stack:** Next.js 14, Express, Prisma, Tailwind CSS, TypeScript, shadcn/ui, CSS animations

---

## Agent-1: BUGFIXER

### Task 1.1: Create useScrollAnimation hook

**Files:**
- Create: `apps/web/src/hooks/useScrollAnimation.ts`

- [ ] **Step 1: Create the hook file**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

export function ScrollReveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify file created** — `ls apps/web/src/hooks/useScrollAnimation.ts`

### Task 1.2: Remove Framer Motion from HeroSection

**Files:**
- Modify: `apps/web/src/components/landing/HeroSection.tsx`

- [ ] **Step 1: Replace entire HeroSection** — remove `motion`, `useScroll`, `useTransform` imports. Replace all `<motion.div>`, `<motion.h1>`, `<motion.p>`, `<motion.a>` with plain HTML tags. Add CSS animation classes. Use `ScrollReveal` for entrance animations. Keep existing CSS classes and i18n.

- [ ] **Step 2: Verify** — `npm run build`

### Task 1.3: Remove Framer Motion from AboutSection

**Files:**
- Modify: `apps/web/src/components/landing/AboutSection.tsx`

- [ ] **Step 1:** Remove `import { motion } from 'framer-motion'`. Add `import { ScrollReveal } from '@/hooks/useScrollAnimation'`. Replace `<motion.div initial=... whileInView=... viewport=... transition=...>` → `<ScrollReveal>`. Replace `<motion.div key=... initial=... whileInView=... viewport=... transition=...>` → `<ScrollReveal delay={i * 100}>`.

### Task 1.4: Remove Framer Motion from remaining 7 components

**Files:**
- Modify: `ProgramSection.tsx`, `AudienceSection.tsx`, `ResultsSection.tsx`, `CoursesSection.tsx`, `HowItWorksSection.tsx`, `ReviewsSection.tsx`

- [ ] **Step 1:** For EACH file — same pattern: remove `motion` import, add `ScrollReveal` import, replace `<motion.div>` → `<ScrollReveal>`.

### Task 1.5: Fix FAQSection — CSS accordion

**Files:**
- Modify: `apps/web/src/components/landing/FAQSection.tsx`

- [ ] **Step 1:** Remove `import { motion, AnimatePresence }`. Add `ScrollReveal` import. Replace `<motion.h2>` → `<ScrollReveal><h2>`. Replace `<motion.div>` wrappers → `<ScrollReveal delay={i*50}>`. Replace `AnimatePresence` accordion → CSS `max-height` transition:

```tsx
<div
  className={`overflow-hidden transition-all duration-300 ${
    openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
  }`}
>
```

Replace `<motion.div animate={{ rotate }}>` for chevron → CSS transform:
```tsx
<div className={`shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>
```

### Task 1.6: Fix MobileNav branding + premium label

**Files:**
- Modify: `apps/web/src/components/lms/MobileNav.tsx:103`

- [ ] **Step 1:** Change `LearnHub Pro` → `AiBot` on line 103
- [ ] **Step 2:** Remove `<p className="text-[10px] text-primary">{t('common.premium')}</p>` (line 222) — no premium concept

### Task 1.7: Fix Sidebar branding

**Files:**
- Modify: `apps/web/src/components/lms/Sidebar.tsx:61`

- [ ] **Step 1:** Change `LearnHub Pro` → `AiBot` on line 61

### Task 1.8: Fix Login branding + autoComplete

**Files:**
- Modify: `apps/web/src/app/login/page.tsx:49`

- [ ] **Step 1:** Change `LearnHub Pro` → `AiBot` on line 49
- [ ] **Step 2:** Add `autoComplete="email"` to email input, `autoComplete="current-password"` to password input

### Task 1.9: Fix course lesson count in API

**Files:**
- Modify: `apps/api/src/routes/courses.ts:33-46`

- [ ] **Step 1:** Add `modules` include to the select:
```typescript
const courses = await prisma.course.findMany({
  where: whereClause,
  select: {
    id: true, slug: true, title: true, description: true,
    coverUrl: true, price: true, currency: true, isFree: true,
    modules: {
      select: {
        id: true,
        lessons: { where: { isPublished: true }, select: { id: true } },
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

- [ ] **Step 2:** Add totalLessons/totalModules to response map:
```typescript
data: courses.map(c => ({
  ...c,
  price: c.price.toString(),
  paymentEnabled,
  totalLessons: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
  totalModules: c.modules.length,
  modules: undefined,
})),
```

- [ ] **Step 3:** `npm run build`

---

## Agent-2: CLEANER

### Task 2.1: Delete PricingSection

**Files:**
- Delete: `apps/web/src/components/landing/PricingSection.tsx`

- [ ] **Step 1:** Verify it's not imported in `apps/web/src/app/page.tsx` (audit shows it's NOT imported — already removed from page)
- [ ] **Step 2:** Delete the file
- [ ] **Step 3:** Grep for any remaining imports: `grep -rn "PricingSection" apps/web/src/`

### Task 2.2: Remove payment references from navigation

**Files:**
- Modify: `apps/web/src/components/lms/MobileNav.tsx` — check for payment/billing links
- Modify: `apps/web/src/components/lms/Sidebar.tsx` — check for payment/billing links

- [ ] **Step 1:** Grep: `grep -rni "payment\|billing\|subscription\|pricing\|premium" apps/web/src/components/`
- [ ] **Step 2:** Remove any found payment nav links (keep admin/payments as-is)
- [ ] **Step 3:** Remove `{t('common.premium')}` label from MobileNav user section (line ~222)

### Task 2.3: Fix Footer

**Files:**
- Modify: `apps/web/src/components/landing/Footer.tsx:108`

- [ ] **Step 1:** Change `&copy; 2024` → `&copy; {new Date().getFullYear()}`
- [ ] **Step 2:** Change `href="#"` → `href="/privacy"`, `href="/terms"`, `href="/offer"` for legal links (lines 59, 64, 69)

### Task 2.4: Create Favicon

**Files:**
- Create: `apps/web/public/favicon.svg`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1:** Create SVG file:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">🤖</text>
</svg>
```

- [ ] **Step 2:** Add to layout.tsx metadata:
```typescript
export const metadata: Metadata = {
  title: 'AiBot — Образовательная платформа с ИИ',
  description: '...',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};
```

### Task 2.5: Create Legal Pages

**Files:**
- Create: `apps/web/src/app/privacy/page.tsx`
- Create: `apps/web/src/app/terms/page.tsx`
- Create: `apps/web/src/app/offer/page.tsx`

- [ ] **Step 1:** Create each page with basic legal content in Russian, prose layout, back link to `/`

- [ ] **Step 2:** `npm run build`

---

## Agent-3: BUILDER (Gamification)

### Task 3.1: Update Prisma Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1:** Add fields to User model (after `notifications` relation):
```prisma
totalXp      Int       @default(0)    @map("total_xp")
level        Int       @default(1)
streak       Int       @default(0)
lastActiveAt DateTime? @map("last_active_at")
achievements UserAchievement[]
```

- [ ] **Step 2:** Add new UserAchievement model (after Certificate):
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

- [ ] **Step 3:** Add Certificate → Course relation:
  - In Certificate model add: `course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)`
  - In Course model add: `certificates Certificate[]`

- [ ] **Step 4:** Run: `cd packages/database && npx prisma migrate dev --name add-gamification-fields && npx prisma generate`

### Task 3.2: Create Gamification Config

**Files:**
- Create: `apps/api/src/config/gamification.ts`

- [ ] **Step 1:** Create file with XP constants, ACHIEVEMENTS object (10 achievements with id, title, description, icon, xpReward, condition function), calculateLevel(), xpForNextLevel() — full code as specified in spec section 5.2.

### Task 3.3: Create Gamification Service

**Files:**
- Create: `apps/api/src/services/gamification.ts`

- [ ] **Step 1:** Create with: getUserStats(userId), updateStreak(userId), checkAndAwardAchievements(userId, stats), getCompletedCoursesCount(userId) — full code as specified in spec section 5.3.

### Task 3.4: Enhance lesson complete endpoint

**Files:**
- Modify: `apps/api/src/routes/progress.ts:13-37`

- [ ] **Step 1:** Import gamification config and service
- [ ] **Step 2:** After upsert LessonProgress, add:
  - Calculate XP (XP_PER_LESSON + streak bonus)
  - Update User.totalXp and level
  - Call updateStreak()
  - Call checkAndAwardAchievements()
  - Return enhanced response: `{ progress, xpEarned, streakBonus, currentStreak, totalXp, level, newAchievements, levelUp }`

### Task 3.5: Create Gamification Routes

**Files:**
- Create: `apps/api/src/routes/gamification.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1:** Create routes file with:
  - `GET /api/leaderboard` — top 50 users by totalXp
  - `GET /api/user/stats` — current user gamification stats
  - `GET /api/user/achievements` — earned achievements

- [ ] **Step 2:** Register in index.ts:
```typescript
import { gamificationRouter } from './routes/gamification';
app.use('/api', gamificationRouter);
```

- [ ] **Step 3:** `npm run build`

---

## Agent-4: DESIGNER

### Task 4.1: Update globals.css Design System

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1:** Add CSS keyframes and utility classes:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
.animate-shimmer { animation: shimmer 1.5s infinite; background-size: 200% 100%; }
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
}
.hover-lift { transition: transform 0.3s, box-shadow 0.3s; }
.hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
```

### Task 4.2: Redesign Landing sections

**Files:**
- Modify: ALL `apps/web/src/components/landing/*.tsx` (after Agent-1 removes framer-motion)

- [ ] **Step 1:** Use `frontend-design` skill for each section
- [ ] **Step 2:** Use `mcp__shadcn` for component queries
- [ ] **Step 3:** Use `mcp__magic__21st_magic_component_inspiration` for design ideas
- [ ] **Step 4:** Apply modern styles: gradient mesh hero, glassmorphism cards, hover-lift effects, ScrollReveal wrappers

### Task 4.3: Create Gamification UI Components

**Files:**
- Create: `apps/web/src/components/gamification/CompleteLessonButton.tsx`
- Create: `apps/web/src/components/gamification/AchievementToast.tsx`
- Create: `apps/web/src/components/gamification/UserLevel.tsx`
- Create: `apps/web/src/components/gamification/CourseProgress.tsx`

- [ ] **Step 1:** Create each component using `frontend-design` skill — fetch from real API endpoints created by Agent-3

### Task 4.4: Redesign Dashboard Pages

**Files:**
- Modify: `apps/web/src/app/achievements/page.tsx` — replace hardcoded data with API fetch, remove framer-motion
- Modify: `apps/web/src/app/dashboard/page.tsx` — add stats widgets
- Modify: `apps/web/src/app/courses/page.tsx` — modern cards
- Create: `apps/web/src/app/leaderboard/page.tsx` — new page
- Modify: `apps/web/src/app/certificates/page.tsx` — gradient cards

- [ ] **Step 1:** For each page — use `frontend-design` skill, connect to real API

### Task 4.5: Create Loading Skeletons

**Files:**
- Create: `apps/web/src/app/dashboard/loading.tsx`
- Create: `apps/web/src/app/courses/loading.tsx`
- Create: `apps/web/src/app/achievements/loading.tsx`
- Create: `apps/web/src/app/certificates/loading.tsx`

- [ ] **Step 1:** Create shimmer skeleton for each route

### Task 4.6: Create Error Boundary

**Files:**
- Modify or create: `apps/web/src/app/error.tsx`

- [ ] **Step 1:** Friendly error UI with retry button
- [ ] **Step 2:** `npm run build`

---

## Agent-5: TESTER

### Task 5.1: Build Verification

- [ ] **Step 1:** Wait for DONE.md from agents 1-4
- [ ] **Step 2:** Run `npm run build` — must pass with 0 errors
- [ ] **Step 3:** Run `npm run db:generate` — must pass

### Task 5.2: POST-FIX CHECKLIST

- [ ] **Step 1:** Verify each of 16 checklist items from AIBOT_INSTRUCTIONS.md
- [ ] **Step 2:** Use `mcp__playwright` for browser testing
- [ ] **Step 3:** Test responsive at 320px, 768px, 1024px, 1440px
- [ ] **Step 4:** Test dark/light theme toggle
- [ ] **Step 5:** Grep for "LearnHub" — must return 0 results
- [ ] **Step 6:** Grep for payment UI in non-admin pages — must return 0

### Task 5.3: Create QA Report

**Files:**
- Create: `agents/agent-5-tester/REPORT.md`

- [ ] **Step 1:** Document all results: pass/fail per checklist item, screenshots, issues found
- [ ] **Step 2:** Create issue files in `agents/agent-5-tester/issues/` for any failures

---

## Execution Order

```
PARALLEL:
  Agent-1 (Tasks 1.1-1.9) ─── no dependencies
  Agent-2 (Tasks 2.1-2.5) ─── no dependencies
  Agent-3 (Tasks 3.1-3.5) ─── no dependencies
  Agent-4 (Tasks 4.1)     ─── design system, no dependencies

THEN:
  Agent-4 (Tasks 4.2)     ─── AFTER Agent-1 finishes (framer-motion removed)
  Agent-4 (Tasks 4.3-4.4) ─── AFTER Agent-3 finishes (API ready)
  Agent-4 (Tasks 4.5-4.6) ─── independent

FINALLY:
  Agent-5 (Tasks 5.1-5.3) ─── AFTER all agents finish
```
