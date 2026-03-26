# Agent-2 Cleaner — Memory

## Branding Issues Found
- "LearnHub" в 3 файлах: Sidebar.tsx, MobileNav.tsx, login/page.tsx
- Могут быть скрытые вхождения в translations.ts

## Payment Issues Found
- `PricingSection.tsx` — целый компонент с framer-motion
- Payment mentions в 6 файлах:
  - `MobileNav.tsx`
  - `translations.ts`
  - `Sidebar.tsx`
  - `admin/analytics/page.tsx`
  - `admin/payments/page.tsx` (ОСТАВИТЬ — админ просмотр)
  - `PricingSection.tsx` (УДАЛИТЬ)

## Architecture Notes
- Landing page собирается в `apps/web/src/app/page.tsx`
- Sidebar навигация в `apps/web/src/components/lms/Sidebar.tsx`
- Legal pages нужно создать в `apps/web/src/app/` (не в dashboard layout)
- Translations: `apps/web/src/lib/i18n/translations.ts` — ключи для ru и kz

## Coordination
- Agent-1 тоже правит MobileNav (баг бургера) и Login (очистка формы)
- Мои изменения: ТОЛЬКО текст/бренд, НЕ поведение/layout
