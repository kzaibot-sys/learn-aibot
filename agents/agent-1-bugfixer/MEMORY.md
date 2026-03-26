# Agent-1 Bugfixer — Memory

## Key Facts
- 10 из 12 landing компонентов импортируют `framer-motion`
- HeroSection использует `useScroll, useTransform` (расширенный motion API)
- FAQSection использует `AnimatePresence` для аккордеона
- useScrollAnimation хук НЕ существует — нужно создать с нуля
- MobileNav находится в `apps/web/src/components/lms/MobileNav.tsx`
- Login page: `apps/web/src/app/login/page.tsx`
- API routes в Express: `apps/api/src/routes/courses.ts`
- Lesson pages: `apps/web/src/app/courses/[slug]/` (проверить точную структуру)

## Architecture Notes
- Frontend: Next.js 14 App Router (pages in `apps/web/src/app/`)
- API: Express (отдельный сервис в `apps/api/`)
- Prisma: `packages/database/`
- i18n: `t('key')` из контекста, ключи в `apps/web/src/lib/i18n/translations.ts`
- Theme: CSS variables, tailwind `darkMode: 'class'`

## Mistakes to Avoid
- НЕ использовать framer-motion нигде на landing
- НЕ забывать `"use client"` на клиентских компонентах
- НЕ использовать hardcoded цвета (bg-gray-900 и т.д.) — только тема-токены
