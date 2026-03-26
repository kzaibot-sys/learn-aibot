# Agent-5 Tester — Memory

## Test Credentials (from seed)
- Admin: admin@aibot.kz / admin123 (проверить в seed файле)
- Student: student@aibot.kz / student123 (проверить в seed файле)

## URLs
- Dev: http://localhost:3000 (Next.js web)
- API: http://localhost:3001 (Express API)

## Key Pages to Test
- `/` — Landing page
- `/login` — Auth
- `/dashboard` — Student dashboard
- `/courses` — Course catalog
- `/courses/[slug]` — Course detail
- `/achievements` — Achievements grid
- `/certificates` — Certificates
- `/settings` — User settings
- `/profile` — User profile
- `/admin/courses` — Admin courses (requires admin login)

## What Changed (track as agents finish)
- Agent-1: landing components, MobileNav, login, courses API, useScrollAnimation hook
- Agent-2: branding text, PricingSection deleted, footer, favicon, legal pages
- Agent-3: Prisma schema, gamification service, API endpoints
- Agent-4: all UI redesigned, gamification UI, loading states, error boundaries

## Known Issues to Watch
- Framer-motion removal could break animations if ScrollReveal not properly applied
- Gamification UI depends on API — test with real API running
- Dark/light theme switching — check no hardcoded colors
- i18n switching — check no hardcoded Russian text
- Mobile responsive — burger menu z-index issues were common
