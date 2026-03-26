# AiBot — Shared Project Context for All Agents

## Project
**AiBot** — LMS platform for online courses.
Brand: TOO "AiBot". Market: Kazakhstan, Russian-speaking.
Principle: Platform for ALREADY PAID clients — NO payments UI.

## Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Query |
| API | Express, JWT, bcryptjs, zod |
| DB | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 |
| i18n | Custom React context (ru/kz) |
| Theme | CSS variables + Tailwind `darkMode: 'class'` |

## Monorepo Structure
```
apps/web/          — Next.js frontend (pages in src/app/, components in src/components/)
apps/api/          — Express REST API (routes in src/routes/, services in src/services/)
apps/bot/          — Telegram Bot (grammy + Claude AI)
apps/mini-app/     — Telegram Mini App (React + Vite)
packages/database/ — Prisma schema + client (@lms/database)
packages/shared/   — Shared TypeScript types
packages/ui/       — Shared React components
```

## Key Conventions
- TypeScript strict — no `any`
- Theme-aware: use `bg-background`, `text-foreground`, `bg-card`, `border-border` (NEVER hardcoded gray)
- i18n: use `t('key')` for all user-visible text, add keys to `translations.ts` for ru and kz
- Mobile-first: Tailwind responsive prefixes (sm:, md:, lg:)
- Named exports, one component per file
- API: `{ success: true, data: ... }` / `{ success: false, error: { code, message } }`
- Prisma: import from `@lms/database`, use `upsert` for idempotency

## Commands
```bash
npm run build          # Build all
npm run dev            # Dev all via Turborepo
npm run db:generate    # Prisma generate
npm run db:migrate     # Prisma migrate
```

## Current Issues (from audit 2026-03-27)
1. Framer Motion in 10/12 landing components — causes invisible sections
2. "LearnHub" in 3 files (Sidebar, MobileNav, Login)
3. PricingSection.tsx still exists
4. Payment mentions in 6 files
5. Gamification system NOT BUILT (no Prisma fields, no API, no UI)
6. useScrollAnimation hook DOES NOT EXIST
7. Design is outdated — needs modern redesign

## MCP & Skills Available
- `mcp__shadcn` — query/install shadcn components
- `mcp__magic__21st_magic_component_builder` — generate modern UI
- `mcp__magic__21st_magic_component_inspiration` — design inspiration
- `mcp__playwright` — e2e testing
- `mcp__context7` — up-to-date library docs
- `frontend-design` skill — modern frontend implementation
- `feature-dev` skill — feature architecture
