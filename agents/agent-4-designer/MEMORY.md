# Agent-4 Designer — Memory

## Current Landing Components (12 files)
1. HeroSection.tsx — framer-motion (useScroll, useTransform)
2. AboutSection.tsx — framer-motion
3. ProgramSection.tsx — framer-motion
4. AudienceSection.tsx — framer-motion
5. ResultsSection.tsx — framer-motion
6. CoursesSection.tsx — framer-motion
7. HowItWorksSection.tsx — framer-motion
8. ReviewsSection.tsx — framer-motion
9. FAQSection.tsx — framer-motion + AnimatePresence
10. PricingSection.tsx — БУДЕТ УДАЛЁН Agent-2
11. Footer.tsx — нет framer-motion
12. Header.tsx — нет framer-motion

## After Agent-1 Fixes
- Framer-motion будет удалён из всех компонентов
- useScrollAnimation hook будет создан
- ScrollReveal component будет доступен
- Мне нужно REDESIGN все компоненты с современным CSS

## Current Dashboard Pages
- `app/dashboard/page.tsx` — есть
- `app/courses/page.tsx` — есть
- `app/achievements/page.tsx` — есть (пустой shell)
- `app/certificates/page.tsx` — есть
- `app/leaderboard/` — НЕТ СТРАНИЦЫ (нужно создать)
- Нет `loading.tsx` для routes
- Есть `app/error.tsx` (проверить содержимое)

## Design Tokens (current)
- Theme: CSS variables in globals.css
- Dark mode: `darkMode: 'class'` in tailwind config
- Semantic tokens: bg-background, text-foreground, bg-card, border-border

## Gamification Components (to create — AFTER Agent-3)
Ни один не существует:
- CompleteLessonButton
- AchievementToast
- UserLevel
- CourseProgress
- LeaderboardPage
- AchievementsPage (redesign existing shell)

## Mistakes to Avoid
- НЕ использовать framer-motion на landing
- НЕ использовать hardcoded цвета (bg-gray-900) — только тема-токены
- НЕ забывать mobile-first responsive
- НЕ забывать "use client" на интерактивных компонентах
- НЕ забывать i18n: t('key') для всего текста
