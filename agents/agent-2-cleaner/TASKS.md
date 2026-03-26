# Agent-2 Cleaner — Task List

## Branding

- [ ] **T2.1** Заменить "LearnHub Pro" / "LearnHub" → "AiBot" во ВСЕХ файлах:
  - `apps/web/src/components/lms/Sidebar.tsx`
  - `apps/web/src/components/lms/MobileNav.tsx`
  - `apps/web/src/app/login/page.tsx`
  - Запустить: `grep -rn "LearnHub" apps/` — найти ВСЕ вхождения
  - Проверить translations.ts на "LearnHub"

- [ ] **T2.2** Проверить tagline:
  - `dashboard.subtitle` в translations.ts должен быть "Образовательная платформа с ИИ"
  - Проверить все места где упоминается tagline

## Remove Payment UI

- [ ] **T2.3** Удалить `PricingSection.tsx`:
  - Удалить файл `apps/web/src/components/landing/PricingSection.tsx`
  - Убрать импорт и использование из landing page (`apps/web/src/app/page.tsx`)
  - Проверить нет ли ссылок в навигации

- [ ] **T2.4** Очистить payment/billing/subscription из UI:
  - Запустить: `grep -rni "payment\|billing\|subscription\|pricing\|stripe\|premium" apps/web/src/ --include="*.tsx" --include="*.ts"`
  - В навигации (Sidebar, MobileNav) — убрать ссылки на pricing/billing
  - В course cards — убрать premium бейджи, lock icons, buy buttons
  - В `translations.ts` — убрать ключи pricing/billing (если есть)
  - НЕ ТРОГАТЬ `apps/web/src/app/admin/payments/` (админ просмотр истории оставить)
  - НЕ ТРОГАТЬ `apps/api/` payment routes (backend сохранить)

## Footer & Favicon

- [ ] **T2.5** Исправить Footer (`apps/web/src/components/landing/Footer.tsx`):
  - Год: `{new Date().getFullYear()}` вместо hardcoded
  - Ссылки: `href="/privacy"`, `href="/terms"`, `href="/offer"`
  - Бренд: "AiBot" + tagline

- [ ] **T2.6** Создать favicon:
  - Создать `apps/web/public/favicon.svg`:
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y=".9em" font-size="90">🤖</text>
    </svg>
    ```
  - Обновить `apps/web/src/app/layout.tsx` metadata:
    ```ts
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] }
    ```

- [ ] **T2.7** Создать legal pages:
  - `apps/web/src/app/privacy/page.tsx` — Политика конфиденциальности
  - `apps/web/src/app/terms/page.tsx` — Условия использования
  - `apps/web/src/app/offer/page.tsx` — Публичная оферта
  - Базовый контент на русском, layout с prose стилями

## Code Cleanup

- [ ] **T2.8** Убрать неиспользуемые imports во всех модифицированных файлах
- [ ] **T2.9** Запустить `npm run build` — 0 ошибок
