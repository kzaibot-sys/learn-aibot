# AiBot — Complete Bug Fix & Improvement Instructions for Claude Code

> **How to use:** Place this file in your project root and run:
> ```bash
> cat AIBOT_INSTRUCTIONS.md | claude
> ```
> Or copy the contents and paste as a prompt.

---

## PROJECT CONTEXT

```
Stack:          Next.js 14+ (App Router), React, TypeScript, Prisma, Tailwind CSS
Monorepo:       apps/web/ — frontend, API routes inside apps/web/src/app/api/
Name:           AiBot
Tagline:        "AI-Powered Learning Platform"
Principle:      Platform for ALREADY PAID clients — NO payments, pricing, subscriptions
Landing ref:    https://lauralessbek.kz/laulsaaismmschool (Tilda-style: bold sections, card grids, FAQ accordion)
Gamification:   XP for lessons + badges/achievements + progress bar + leaderboard (all real, not placeholder)
```

**EXECUTION ORDER — strictly phases 1 through 7. After each phase run: `npm run build` to verify.**

---

# ===============================================
# PHASE 1: CRITICAL BUGS
# ===============================================

## 1.1 Landing sections are invisible

**Problem:** All sections below hero ("Why choose us", "How it works", "Testimonials", "FAQ") are not visible. Content exists in DOM but Framer Motion `initial={{ opacity: 0 }}` never triggers `whileInView` in production build.

**Files:** `apps/web/src/components/landing/*.tsx`

**Fix — Since landing will be fully rebuilt in Phase 7, apply a quick fix now:**

```bash
# Find all affected files:
grep -rn "initial={{" apps/web/src/components/landing/

# In EVERY found file:
# 1. Remove import: import { motion } from "framer-motion"
# 2. Replace <motion.div initial=... whileInView=... viewport=... transition=...> with <div>
# 3. Replace </motion.div> with </div>
# 4. If component no longer uses framer-motion — remove the import entirely
```

**Alternative (preserve animations temporarily):**

```tsx
// In EVERY landing component ensure:
// 1. "use client" is the VERY FIRST line
"use client";

// 2. Fix viewport trigger sensitivity:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.05 }}
  transition={{ duration: 0.6 }}
  style={{ willChange: "opacity, transform" }}
>
```

---

## 1.2 Mobile sidebar menu does not open

**Files:** `Sidebar.tsx`, `MobileNav.tsx`

**Diagnosis:**
```bash
grep -rn "isOpen\|setIsOpen\|isSidebarOpen\|setSidebarOpen\|isMenuOpen\|toggleMenu" \
  apps/web/src/components/Sidebar.tsx \
  apps/web/src/components/MobileNav.tsx \
  apps/web/src/components/layout/
```

**Full working pattern:**

```tsx
// MobileNav.tsx — COMPLETE WORKING IMPLEMENTATION
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Burger button — MUST be md:hidden with high z-index */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-950
          z-[80] shadow-2xl transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="text-lg font-bold">AiBot</span>
          <button onClick={() => setIsOpen(false)} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <Link href="/dashboard" className="block py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Dashboard</Link>
          <Link href="/courses" className="block py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Courses</Link>
          <Link href="/achievements" className="block py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Achievements</Link>
          <Link href="/leaderboard" className="block py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Leaderboard</Link>
          <Link href="/certificates" className="block py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Certificates</Link>
        </nav>
      </aside>
    </>
  );
}
```

**Mandatory checks:**
- `"use client"` present in file
- burger button z-index > header/navbar z-index
- overlay and sidebar render in DOM (not inside element with `overflow: hidden`)
- `onClick` on button calls `setIsOpen`

---

## 1.3 Course catalog shows "0 lessons"

**Files:**
- API: `apps/web/src/app/api/courses/route.ts`
- UI: `apps/web/src/app/(dashboard)/courses/page.tsx:113-115`

**Fix API:**

```typescript
// app/api/courses/route.ts — in GET handler
const courses = await prisma.course.findMany({
  where: { published: true },
  include: {
    modules: {
      include: {
        lessons: { select: { id: true } }
      },
      orderBy: { order: "asc" },
    },
  },
  orderBy: { createdAt: "desc" },
});

const coursesWithCount = courses.map(course => ({
  ...course,
  totalLessons: course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length, 0
  ),
  totalModules: course.modules.length,
}));

return NextResponse.json(coursesWithCount);
```

**Fix frontend:**

```tsx
// courses/page.tsx — replace lesson count calculation:
// WAS:
const lessonCount = course.modules?.flatMap(m => m.lessons)?.length ?? 0;

// NOW:
const lessonCount = course.totalLessons ?? 0;
```

---

## 1.4 Video player shows for TEXT lessons

**File:** `apps/web/src/app/(dashboard)/lessons/[lessonId]/page.tsx:297-310`

```tsx
// WAS:
<div className="aspect-video ...">
  {lesson.videoUrl ? (
    <VideoPlayer url={lesson.videoUrl} />
  ) : (
    <div>Видео недоступно</div>
  )}
</div>

// NOW — wrap in type check:
{lesson.type === "VIDEO" && (
  <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
    {lesson.videoUrl ? (
      <VideoPlayer url={lesson.videoUrl} />
    ) : (
      <div className="flex items-center justify-center h-full text-gray-400">
        Video coming soon
      </div>
    )}
  </div>
)}

{lesson.type === "TEXT" && lesson.content && (
  <div className="prose prose-lg max-w-none dark:prose-invert mb-6">
    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
  </div>
)}
```

---

## 1.5 Login form not clearing after logout

**File:** `apps/web/src/app/(auth)/login/page.tsx`

```tsx
"use client";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Clear fields on mount (after logout)
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  return (
    <form>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Password"
      />
    </form>
  );
}
```

---

## 1.6 Slow course loading

```typescript
// 1. OPTIMIZE Prisma query — select only needed fields:
const courses = await prisma.course.findMany({
  select: {
    id: true, title: true, description: true, imageUrl: true, category: true,
    modules: { select: { id: true, lessons: { select: { id: true } } } }
  }
});

// 2. CACHING — add to route.ts:
export const revalidate = 300; // 5 minutes

// 3. LOADING STATE — create courses/loading.tsx:
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border overflow-hidden">
          <div className="h-48 bg-gray-200 dark:bg-gray-800" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

# ===============================================
# PHASE 2: BRANDING
# ===============================================

## 2.1 "LearnHub Pro" to "AiBot"

```bash
# Find ALL occurrences:
grep -rn "LearnHub" apps/web/src/

# Known locations:
# Sidebar.tsx:61, MobileNav.tsx:103, login/page.tsx:49

# Mass replace:
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i 's/LearnHub Pro/AiBot/g' {} +
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i 's/LearnHub/AiBot/g' {} +
```

## 2.2 Tagline fix

```bash
# File: translations.ts:17
grep -rn "Платформа для создания AI ботов\|subtitle" apps/web/src/
# Replace: dashboard.subtitle = "Образовательная платформа с ИИ"
```

---

# ===============================================
# PHASE 3: REMOVE PAYMENT SYSTEM
# ===============================================

```bash
# Step 1: Find all mentions:
grep -rn -i "payment\|billing\|subscription\|pricing\|price\|tariff\|тариф\|оплат\|подписк\|stripe\|kaspi\|plan\|premium" \
  apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```

**Remove:**

```
1. PAGES (delete entire folders):
   pricing/, billing/, payment/, subscribe/, plans/

2. API ROUTES:
   api/payment/, api/stripe/, api/subscription/, api/billing/

3. FROM NAVIGATION: Remove links "Pricing", "Billing", "Subscription"

4. MIDDLEWARE — replace subscription checks:
   // if (!user.subscription?.isActive) { redirect('/pricing'); }
   // WITH:
   if (!user) { redirect('/login'); }

5. FROM COURSE CARDS: Remove "Premium"/"PRO" badges, lock icons, buy buttons

6. FROM PROFILE: Remove "My plan" and "Manage subscription" sections

7. ENV: Comment out STRIPE_*, PAYMENT_* in .env
```

---

# ===============================================
# PHASE 4: MINOR FIXES
# ===============================================

## 4.1 Favicon (404 in console)

```bash
cat > apps/web/public/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">🤖</text>
</svg>
EOF
```

```tsx
// layout.tsx metadata:
icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
```

## 4.2 Footer year: dynamic

```tsx
// WAS: <p>&copy; 2024 AiBot</p>
// NOW:
<p>&copy; {new Date().getFullYear()} AiBot. All rights reserved.</p>
```

## 4.3 Footer links go nowhere

```tsx
// Replace href="#" with real paths:
<Link href="/privacy">Privacy Policy</Link>
<Link href="/terms">Terms of Service</Link>
<Link href="/offer">Public Offer</Link>

// Create: app/(legal)/privacy/page.tsx, /terms/page.tsx, /offer/page.tsx
// with basic legal content in a prose layout
```

## 4.4 Autocomplete on login

Already included in fix 1.5 (autoComplete="email" and autoComplete="current-password").

---

# ===============================================
# PHASE 5: GAMIFICATION (REAL WORKING SYSTEM)
# ===============================================

## 5.1 Prisma Models

```prisma
model UserProgress {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completed   Boolean   @default(false)
  completedAt DateTime?
  xpEarned    Int       @default(0)
  createdAt   DateTime  @default(now())
  @@unique([userId, lessonId])
  @@index([userId])
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId String
  earnedAt      DateTime @default(now())
  @@unique([userId, achievementId])
  @@index([userId])
}

model Certificate {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId           String
  course            Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  certificateNumber String   @unique
  issuedAt          DateTime @default(now())
  @@unique([userId, courseId])
}

// ADD to User model:
// totalXp Int @default(0), level Int @default(1), streak Int @default(0), lastActiveAt DateTime?
// progress UserProgress[], achievements UserAchievement[], certificates Certificate[]

// ADD to Lesson model: progress UserProgress[]
// ADD to Course model: certificates Certificate[]
```

```bash
npx prisma migrate dev --name add-gamification
npx prisma generate
```

## 5.2 Gamification Config

```typescript
// lib/gamification/config.ts

export const XP_PER_LESSON = 25;
export const STREAK_BONUS_XP = 15;

export interface UserStats {
  completedLessons: number;
  completedCourses: number;
  currentStreak: number;
  lessonsToday: number;
  allModulesComplete: boolean;
  totalXp: number;
}

export const ACHIEVEMENTS = {
  FIRST_LESSON:   { id: "first-lesson",   title: "First Step",        description: "Complete your first lesson",        icon: "🎯", xpReward: 50,   condition: (s: UserStats) => s.completedLessons >= 1 },
  TEN_LESSONS:    { id: "ten-lessons",     title: "Gaining Momentum",  description: "Complete 10 lessons",               icon: "📚", xpReward: 100,  condition: (s: UserStats) => s.completedLessons >= 10 },
  FIFTY_LESSONS:  { id: "fifty-lessons",   title: "Scholar",           description: "Complete 50 lessons",               icon: "🧠", xpReward: 300,  condition: (s: UserStats) => s.completedLessons >= 50 },
  COURSE_COMPLETE:{ id: "course-complete", title: "Graduate",          description: "Complete a full course",            icon: "🎓", xpReward: 500,  condition: (s: UserStats) => s.completedCourses >= 1 },
  THREE_COURSES:  { id: "three-courses",   title: "Multidisciplinary", description: "Complete 3 courses",                icon: "🏆", xpReward: 1000, condition: (s: UserStats) => s.completedCourses >= 3 },
  STREAK_3:       { id: "streak-3",        title: "Consistent",        description: "3 days in a row",                   icon: "🔥", xpReward: 75,   condition: (s: UserStats) => s.currentStreak >= 3 },
  STREAK_7:       { id: "streak-7",        title: "On a Roll",         description: "7 days in a row",                   icon: "🔥", xpReward: 200,  condition: (s: UserStats) => s.currentStreak >= 7 },
  STREAK_30:      { id: "streak-30",       title: "Iron Will",         description: "30 days in a row",                  icon: "💪", xpReward: 1000, condition: (s: UserStats) => s.currentStreak >= 30 },
  SPEED_LEARNER:  { id: "speed-learner",   title: "Speed Reader",      description: "5 lessons in one day",              icon: "⚡", xpReward: 150,  condition: (s: UserStats) => s.lessonsToday >= 5 },
  XP_1000:        { id: "xp-1000",         title: "Thousander",        description: "Earn 1000 XP",                      icon: "💎", xpReward: 100,  condition: (s: UserStats) => s.totalXp >= 1000 },
} as const;

// Level system — each level requires 20% more XP
export function calculateLevel(xp: number): number {
  let level = 1, required = 100, accumulated = 0;
  while (accumulated + required <= xp) { accumulated += required; level++; required = Math.floor(required * 1.2); }
  return level;
}

export function xpForNextLevel(currentXp: number) {
  let level = 1, required = 100, accumulated = 0;
  while (accumulated + required <= currentXp) { accumulated += required; level++; required = Math.floor(required * 1.2); }
  const progress = currentXp - accumulated;
  return { level, currentLevelXp: progress, requiredXp: required, percent: Math.round((progress / required) * 100) };
}
```

## 5.3 Gamification Service

```typescript
// lib/gamification/service.ts
import { prisma } from "@/lib/prisma";
import type { UserStats } from "./config";

export async function getUserStats(userId: string): Promise<UserStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [completedLessons, lessonsToday, user, completedCourses] = await Promise.all([
    prisma.userProgress.count({ where: { userId, completed: true } }),
    prisma.userProgress.count({ where: { userId, completed: true, completedAt: { gte: todayStart } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, streak: true } }),
    getCompletedCoursesCount(userId),
  ]);
  return { completedLessons, completedCourses, currentStreak: user?.streak ?? 0, lessonsToday, allModulesComplete: false, totalXp: user?.totalXp ?? 0 };
}

async function getCompletedCoursesCount(userId: string): Promise<number> {
  const courses = await prisma.course.findMany({ include: { modules: { include: { lessons: { select: { id: true } } } } } });
  let count = 0;
  for (const course of courses) {
    const ids = course.modules.flatMap(m => m.lessons.map(l => l.id));
    if (ids.length === 0) continue;
    const done = await prisma.userProgress.count({ where: { userId, lessonId: { in: ids }, completed: true } });
    if (done >= ids.length) count++;
  }
  return count;
}

export async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lastActiveAt: true, streak: true } });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!user?.lastActiveAt) { await prisma.user.update({ where: { id: userId }, data: { streak: 1, lastActiveAt: now } }); return 1; }
  const last = new Date(user.lastActiveAt);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diff = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);
  let newStreak = diff === 0 ? user.streak : diff === 1 ? user.streak + 1 : 1;
  if (diff > 0) await prisma.user.update({ where: { id: userId }, data: { streak: newStreak, lastActiveAt: now } });
  return newStreak;
}
```

## 5.4 API: Complete Lesson (`app/api/lessons/[lessonId]/complete/route.ts`)

Full endpoint that: records progress, updates XP, updates streak, calculates level, checks all achievements. Returns `{ xpEarned, streakBonus, currentStreak, totalXp, level, newAchievements, levelUp }`.

Create this file with the complete implementation — use `getUserStats`, `updateStreak` from service, `ACHIEVEMENTS`, `calculateLevel` from config. Upsert UserProgress, increment User.totalXp, check each achievement condition, create UserAchievement if new.

## 5.5 API: Leaderboard (`app/api/leaderboard/route.ts`)

```typescript
export const revalidate = 60;
// GET: prisma.user.findMany ordered by totalXp desc, take 50
// Return with rank number added
```

## 5.6 API: User Stats (`app/api/user/stats/route.ts`)

```typescript
// GET: Return user totalXp, level, streak, completedLessons count, earned achievements mapped to config
```

## 5.7 API: Course Progress (`app/api/courses/[courseId]/progress/route.ts`)

```typescript
// GET: Return totalLessons, completedLessons, percent, per-module breakdown
```

## 5.8 UI Components to Create

1. **`components/gamification/CourseProgress.tsx`** — fetches `/api/courses/{id}/progress`, renders progress bar
2. **`components/gamification/UserLevel.tsx`** — fetches `/api/user/stats`, renders level badge + XP bar in sidebar
3. **`components/gamification/CompleteLessonButton.tsx`** — POST to complete API, shows XP popup + achievement toast
4. **`components/gamification/AchievementToast.tsx`** — fixed-position toast with animation
5. **`app/(dashboard)/leaderboard/page.tsx`** — ranked list with medals for top 3, XP, streak, level
6. **`app/(dashboard)/achievements/page.tsx`** — grid of all achievements, earned ones highlighted, locked ones grayed

## 5.9 Sidebar Integration

Add to navigation: Dashboard, Courses, Achievements, Leaderboard, Certificates.
Add `<UserLevel />` component at sidebar bottom.

---

# ===============================================
# PHASE 6: CERTIFICATES
# ===============================================

## 6.1 API: Generate (`app/api/certificates/[courseId]/route.ts`)
POST: Check 100% completion, upsert certificate with unique number like `AIBOT-XXXXX-XXXX`.

## 6.2 API: List (`app/api/certificates/route.ts`)
GET: Return all user certificates with course title.

## 6.3 Page (`app/(dashboard)/certificates/page.tsx`)
Empty state with icon + message. Grid of certificate cards with gradient background, certificate number, issue date.

---

# ===============================================
# PHASE 7: COMPLETE LANDING PAGE REBUILD
# ===============================================

## Reference: https://lauralessbek.kz/laulsaaismmschool

**Sections (top to bottom):**
1. HERO — Full-screen gradient banner, headline, tagline, CTA button
2. ABOUT — What AiBot is, who it is for, key numbers
3. CURRICULUM — Grid of 8 module cards with icons and numbering
4. ADVANTAGES — 4-6 icon blocks
5. HOW IT WORKS — 3 numbered steps
6. TESTIMONIALS — Review cards
7. FAQ — Accordion
8. CTA — Final banner
9. FOOTER — Contacts, legal links, copyright

**KEY RULE: DO NOT USE FRAMER MOTION on landing.** Use CSS + Intersection Observer:

```tsx
// hooks/useScrollAnimation.ts
"use client";
import { useEffect, useRef, useState } from "react";

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

export function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(30px)", transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
```

**Wrap every section in `<ScrollReveal>`.**

**Design principles (from reference):**
- Bold gradient hero with decorative blur circles
- Alternating light/dark section backgrounds
- Large headings, rounded cards (border-radius 16-24px)
- Module cards with numbering and icons in a grid
- FAQ accordion with smooth open/close
- Mobile-first responsive with vertical stacking
- CSS variables for consistent color palette

---

# ===============================================
# PHASE 7+: ADDITIONAL IMPROVEMENTS
# ===============================================

- Create `loading.tsx` skeleton for every route
- Create `error.tsx` error boundary for dashboard
- Add SEO metadata to layout.tsx (title template, description, OpenGraph, keywords)

---

# ===============================================
# POST-FIX CHECKLIST
# ===============================================

```
npm run build — no errors
npm run start — verify:

[ ] Landing: all sections visible, scroll animations work
[ ] Landing: mobile-responsive layout
[ ] Login: fields empty after logout, autocomplete works
[ ] Mobile menu: opens, closes, navigation works
[ ] Sidebar: brand "AiBot", UserLevel component present
[ ] Courses: show real lesson count (not 0)
[ ] Courses: fast loading, skeleton loading state
[ ] TEXT lesson: no video player
[ ] VIDEO lesson: video player present
[ ] "Complete Lesson" button: works, awards XP, shows toast
[ ] Leaderboard: shows users ranked by XP
[ ] Achievements: all shown, earned ones highlighted
[ ] Certificates: available after 100% course completion
[ ] Footer: dynamic year, links go to real pages
[ ] Favicon: no 404 in console
[ ] No mentions of "LearnHub Pro" anywhere
[ ] No links to pricing/billing/payment anywhere
[ ] npx prisma migrate deploy — migrations pass
```

---

# QUICK START FOR CLAUDE CODE

```
Read AIBOT_INSTRUCTIONS.md in the project root.
Execute ALL 7 phases in strict order.
After each phase run npm run build.
If you encounter an error — fix it and continue.

Key rules:
- Brand: "AiBot" (not "LearnHub Pro")
- Tagline: "AI-Powered Learning Platform"
- Remove EVERYTHING related to payments/subscriptions/pricing
- Landing: DO NOT use Framer Motion, use CSS + Intersection Observer
- Gamification: XP + achievements + progress bar + leaderboard (real, with Prisma models)
- Certificates: generated at 100% course completion
- All UI text should be in Russian (the platform audience is Russian-speaking)
```
