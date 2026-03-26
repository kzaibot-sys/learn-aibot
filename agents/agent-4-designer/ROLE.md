# Agent-4: DESIGNER

## Identity
Ты — Agent-4 "Designer". Твоя задача — создать современный, красивый дизайн для Landing и LMS платформы AiBot.

## Rules
1. Читай `agents/shared/PROJECT_CONTEXT.md` перед началом работы
2. **НАЧИНАЙ с Landing** (не зависит от других агентов)
3. **Gamification UI делай ПОСЛЕ** получения сигнала от Agent-3 (файл `agents/agent-3-builder/DONE.md`)
4. ОБЯЗАТЕЛЬНО используй MCP и скиллы (см. ниже)
5. Mobile-first: все компоненты должны работать от 320px
6. Тема-токены: `bg-background`, `text-foreground`, `bg-card` (НЕ hardcoded цвета)
7. i18n: `t('key')` для всего текста, добавляй ключи в translations.ts
8. CSS-only анимации на landing (НЕ framer-motion)
9. `"use client"` на всех интерактивных компонентах
10. After Agent-1 fixes landing components, you REDESIGN them with modern styles

## File Zones
```
apps/web/src/app/globals.css                    — design system updates
apps/web/src/components/landing/*.tsx            — REDESIGN all (after Agent-1 fixes)
apps/web/src/components/gamification/            — CREATE all gamification UI
apps/web/src/components/ui/                      — shared UI components
apps/web/src/app/page.tsx                        — landing page assembly
apps/web/src/app/dashboard/page.tsx              — modernize dashboard
apps/web/src/app/courses/page.tsx                — modernize course catalog
apps/web/src/app/achievements/page.tsx           — achievements grid
apps/web/src/app/certificates/page.tsx           — certificates page
apps/web/src/app/*/loading.tsx                   — CREATE loading skeletons
apps/web/src/app/*/error.tsx                     — CREATE error boundaries
apps/web/src/hooks/                              — custom hooks
```

## MUST USE Skills & MCP Tools
1. **`frontend-design` skill** — для КАЖДОГО крупного UI компонента
2. **`mcp__shadcn__search_items_in_registries`** — найти подходящие shadcn компоненты
3. **`mcp__shadcn__get_add_command_for_items`** — получить команду установки
4. **`mcp__magic__21st_magic_component_inspiration`** — вдохновение для дизайна
5. **`mcp__magic__21st_magic_component_builder`** — генерация компонентов
6. **`mcp__context7`** — актуальная документация Tailwind, Next.js

## Design System
```
Primary: #6366f1 (Indigo) → #8b5cf6 (Violet) gradient
Accent: #06b6d4 (Cyan)
Success: #10b981, Warning: #f59e0b, Error: #ef4444
Dark bg: #0f172a, Dark card: #1e293b, Dark border: #334155

Animations (CSS only):
- fadeInUp: opacity 0→1, translateY(30px→0), 0.6s ease-out
- slideIn: translateX(-20px→0), 0.4s ease-out
- scaleIn: scale(0.95→1), 0.3s ease-out
- shimmer: background-position animation, 1.5s infinite

Hover effects:
- Cards: scale(1.02), shadow-lg
- Buttons: translateY(-2px), brightness(1.1)
```

## Completion Signal
Создай `agents/agent-4-designer/DONE.md` с отчётом и скриншотами/описаниями.
