# Agent-1 Bugfixer — Task List

## Priority: CRITICAL

- [ ] **T1.1** Создать `apps/web/src/hooks/useScrollAnimation.ts`
  - IntersectionObserver-based scroll reveal
  - `useScrollAnimation<T>()` hook с threshold параметром
  - `ScrollReveal` wrapper component с delay prop
  - CSS transitions: opacity 0→1, translateY(30px→0), duration 700ms

- [ ] **T1.2** Удалить Framer Motion из ВСЕХ landing компонентов (10 файлов):
  - `HeroSection.tsx` — удалить `import { motion, useScroll, useTransform }`, заменить `<motion.div>` → `<div>`
  - `AboutSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `ProgramSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `AudienceSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `ResultsSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `CoursesSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `HowItWorksSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `ReviewsSection.tsx` — удалить motion import, использовать `<ScrollReveal>`
  - `FAQSection.tsx` — удалить `motion, AnimatePresence`, CSS accordion animation
  - `PricingSection.tsx` — НЕ ТРОГАТЬ (Agent-2 удалит целиком)
  - Обернуть каждую секцию в `<ScrollReveal>`

- [ ] **T1.3** Исправить MobileNav (`apps/web/src/components/lms/MobileNav.tsx`):
  - `useState` для `isOpen`
  - Burger button: `z-[60]`, `md:hidden`, `fixed top-4 left-4`
  - Overlay: `fixed inset-0 bg-black/60 z-[70]`
  - Sidebar panel: `z-[80]`, `transform transition-transform`, `-translate-x-full` / `translate-x-0`
  - Close on `pathname` change (usePathname + useEffect)
  - Body scroll lock: `document.body.style.overflow`
  - `"use client"` на первой строке

- [ ] **T1.4** Исправить видеоплеер для TEXT уроков:
  - Найти lesson page (courses/[slug]/lessons/[id] или аналог)
  - Обернуть видео блок в `{lesson.type === "VIDEO" && (...)}`
  - Добавить `{lesson.type === "TEXT" && lesson.content && (<div className="prose" dangerouslySetInnerHTML />)}`

- [ ] **T1.5** Исправить login form clearing:
  - `useEffect(() => { setEmail(""); setPassword(""); }, [])` в login page
  - `autoComplete="email"` и `autoComplete="current-password"` на инпутах

- [ ] **T1.6** Исправить подсчёт уроков в курсах:
  - В `apps/api/src/routes/courses.ts` — include modules→lessons в query
  - Вычислять `totalLessons` через reduce
  - На фронте использовать `course.totalLessons` вместо ручного подсчёта

- [ ] **T1.7** Запустить `npm run build` — исправить все ошибки
