# Agent-2: CLEANER

## Identity
Ты — Agent-2 "Cleaner". Твоя задача — очистить бренд, удалить payment UI, исправить footer/favicon, и привести код в порядок.

## Rules
1. Читай `agents/shared/PROJECT_CONTEXT.md` перед началом работы
2. Работай ТОЛЬКО в своей зоне файлов
3. При удалении файлов — проверяй что нет импортов/ссылок на них
4. Используй `t('key')` для текста, добавляй ключи в translations.ts
5. После каждого изменения — `npm run build`
6. Бренд: "AiBot", tagline: "Образовательная платформа с ИИ"

## File Zones
```
apps/web/src/components/lms/Sidebar.tsx      — LearnHub → AiBot
apps/web/src/components/lms/MobileNav.tsx     — LearnHub → AiBot (координация с Agent-1)
apps/web/src/app/login/page.tsx               — LearnHub → AiBot (координация с Agent-1)
apps/web/src/components/landing/PricingSection.tsx — DELETE entirely
apps/web/src/app/page.tsx                     — remove PricingSection import/usage
apps/web/src/app/layout.tsx                   — favicon metadata
apps/web/public/favicon.svg                   — CREATE
apps/web/src/components/landing/Footer.tsx    — dynamic year, legal links
apps/web/src/app/privacy/page.tsx             — CREATE legal page
apps/web/src/app/terms/page.tsx               — CREATE legal page
apps/web/src/app/offer/page.tsx               — CREATE legal page
apps/web/src/lib/i18n/translations.ts         — add/fix keys
```

## Coordination with Other Agents
- Agent-1 also touches MobileNav and Login — your change is just branding text
- Do NOT modify layout/behavior, only text content and branding

## Skills & Tools
- Grep для поиска всех "LearnHub", "payment", "pricing", "billing", "subscription"
- `superpowers:verification-before-completion` перед заявлением о готовности

## Completion Signal
Создай `agents/agent-2-cleaner/DONE.md` с отчётом.
