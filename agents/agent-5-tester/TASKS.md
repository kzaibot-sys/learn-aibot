# Agent-5 Tester — Task List

## Pre-flight

- [ ] **T5.0** Дождаться сигналов готовности от агентов 1-4:
  - `agents/agent-1-bugfixer/DONE.md`
  - `agents/agent-2-cleaner/DONE.md`
  - `agents/agent-3-builder/DONE.md`
  - `agents/agent-4-designer/DONE.md`
  Примечание: можно начинать промежуточные проверки раньше

## Build Verification

- [ ] **T5.1** Запустить `npm run build` — должно пройти без ошибок
- [ ] **T5.2** Запустить `npm run db:generate` — должно пройти без ошибок
- [ ] **T5.3** Проверить: нет ли TypeScript ошибок в build output

## POST-FIX CHECKLIST (из AIBOT_INSTRUCTIONS.md)

- [ ] **T5.4** Landing: все секции видимы, scroll анимации работают
- [ ] **T5.5** Landing: mobile-responsive layout (320px)
- [ ] **T5.6** Login: поля пустые после logout, autocomplete работает
- [ ] **T5.7** Mobile menu: открывается, закрывается, навигация работает
- [ ] **T5.8** Sidebar: бренд "AiBot", UserLevel компонент
- [ ] **T5.9** Courses: реальный подсчёт уроков (не 0)
- [ ] **T5.10** Courses: быстрая загрузка, skeleton loading
- [ ] **T5.11** TEXT lesson: нет видеоплеера
- [ ] **T5.12** VIDEO lesson: видеоплеер присутствует
- [ ] **T5.13** "Complete Lesson" кнопка: работает, даёт XP, показывает toast
- [ ] **T5.14** Leaderboard: показывает пользователей по XP
- [ ] **T5.15** Achievements: все показаны, earned подсвечены
- [ ] **T5.16** Certificates: доступны после 100% прохождения
- [ ] **T5.17** Footer: динамический год, ссылки на реальные страницы
- [ ] **T5.18** Favicon: нет 404 в console
- [ ] **T5.19** Нигде нет "LearnHub Pro"
- [ ] **T5.20** Нет ссылок на pricing/billing/payment в UI

## E2E Smoke Tests (Playwright MCP)

- [ ] **T5.21** Landing page smoke test:
  ```
  1. Navigate to /
  2. Snapshot DOM — verify all sections present
  3. Scroll down — verify scroll animations
  4. Resize to 320px — verify mobile layout
  5. Check console — no errors
  ```

- [ ] **T5.22** Auth smoke test:
  ```
  1. Navigate to /login
  2. Verify form fields empty
  3. Check autocomplete attributes
  ```

- [ ] **T5.23** Mobile menu smoke test:
  ```
  1. Resize to 375px
  2. Find burger button
  3. Click — verify menu opens
  4. Click overlay — verify menu closes
  ```

- [ ] **T5.24** Dashboard smoke test:
  ```
  1. Login (use test credentials from seed)
  2. Navigate to /dashboard
  3. Verify course cards present
  4. Verify stats widgets
  ```

- [ ] **T5.25** Dark mode test:
  ```
  1. Toggle theme
  2. Verify dark class on html element
  3. Verify no white flashes
  4. Screenshot light vs dark
  ```

## Responsive Testing

- [ ] **T5.26** Test at 320px (mobile small)
- [ ] **T5.27** Test at 768px (tablet)
- [ ] **T5.28** Test at 1024px (laptop)
- [ ] **T5.29** Test at 1440px (desktop)

## Performance

- [ ] **T5.30** Check for unused imports in modified files
- [ ] **T5.31** Check bundle size — no unexpectedly large chunks
- [ ] **T5.32** Verify loading skeletons render before data

## Final Report

- [ ] **T5.33** Создать `agents/agent-5-tester/REPORT.md`:
  - Build status
  - Checklist results (pass/fail each item)
  - E2E test results
  - Responsive test results
  - Issues found (with file references)
  - Overall quality assessment
