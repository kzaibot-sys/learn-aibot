# Full Project QA Check

Run a comprehensive quality assurance check of the entire AiBot LMS project. Spawns 3 parallel background Haiku agents to check code quality, API health, and UI integrity. Produces a unified report with pass/fail per check and prioritized fix recommendations.

## When to Use

- Before deploying to Railway or VPS
- After a failed deploy to diagnose what broke
- When initializing work on the project and need full context verification
- When the user says: "проверь проект", "qa", "проверка перед деплоем", "что сломано", "/qa-check"

## Process

### Step 1: Read Project Context

Before spawning agents, quickly read current state:

1. `CLAUDE.md` — project structure, routes, pages, tech stack
2. Run `git status` and `git log --oneline -5` to see recent changes
3. If triggered by deploy error — also capture the error output

### Step 2: Spawn 3 Background Agents

Launch all 3 agents in a single message using the Agent tool with `model: "haiku"` and `run_in_background: true`. Each agent receives the project path and is told this is a READ-ONLY task (no edits).

While agents run, inform the user: "3 QA-агента запущены в фоне: Code Quality, API Health, UI Check. Сообщу по готовности."

---

**Agent 1: Code Quality Check**

```
You are a code quality checker for an LMS monorepo at [PROJECT_PATH].
This is a READ-ONLY task — do NOT edit any files.

Checks to perform:

1. **TypeScript**: Run `npx tsc --noEmit` in apps/web and apps/api separately. Report type errors with file:line.
2. **Build**: Run `npm run build` from project root. Report failures with full error.
3. **Prisma schema**: Run `npx prisma validate --schema=packages/database/prisma/schema.prisma`.
4. **Security**: Search for:
   - `dangerouslySetInnerHTML` without DOMPurify sanitization
   - Hardcoded secrets/API keys (not in .env)
   - `as any` or `as unknown` type casts (note: Prisma singleton pattern is acceptable)
   - `eval()` or `Function()` calls
5. **Env vars**: Compare .env.example with env references in apps/api/src/config.ts. Check all required vars are documented.
6. **Dependencies**: Check for outdated or vulnerable packages — run `npm audit --omit=dev` (report HIGH/CRITICAL only).

Report format:
## Code Quality Report
### TypeScript: PASS/FAIL
### Build: PASS/FAIL
### Prisma Schema: PASS/FAIL
### Security: PASS/FAIL
### Env Vars: PASS/FAIL
### Dependencies: PASS/FAIL

For each FAIL — include file:line, exact error, and severity (CRITICAL/HIGH/MEDIUM).
```

---

**Agent 2: API Health Check**

```
You are an API tester for an Express REST API at [PROJECT_PATH].
This is a READ-ONLY task — do NOT edit any files.

First read CLAUDE.md to get the full route list, then read all files in apps/api/src/routes/.

Checks to perform:

1. **Route coverage**: Compare CLAUDE.md route list with actual route files. Count matches. Report missing/undocumented routes.
2. **Middleware security**: Verify all admin routes use both `authenticate` and `requireAdmin`. Check router-level middleware in admin.ts.
3. **Error handling**: Every async route handler must use `asyncHandler()` wrapper. Grep for `router.get|post|patch|delete` and check each one.
4. **Response format consistency**: All routes must return `{ success: true, data }` or throw `AppError`. Check for raw `res.status().json()` without the standard format.
5. **Webhook raw body**: Verify in apps/api/src/index.ts that `express.raw()` is applied to webhook routes BEFORE `express.json()`.
6. **Input validation**: Check if request bodies have validation (zod schemas or manual checks). Report routes with no validation.
7. **Auth flow correctness**: Verify JWT generation uses proper payload shape, refresh token rotation works, Telegram HMAC uses timing-safe comparison.

Report format:
## API Health Report
### Route Coverage: PASS/FAIL (X/Y)
### Middleware Security: PASS/FAIL
### Error Handling: PASS/FAIL
### Response Format: PASS/FAIL
### Webhook Safety: PASS/FAIL
### Input Validation: PASS/FAIL
### Auth Flow: PASS/FAIL

For each FAIL — include the route path, file:line, and what's wrong.
```

---

**Agent 3: UI & Frontend Check**

```
You are a frontend quality checker for a Next.js 14 LMS app at [PROJECT_PATH].
This is a READ-ONLY task — do NOT edit any files.

First read CLAUDE.md for the page list and theme/i18n rules.

Checks to perform:

1. **Page structure**: Verify every page listed in CLAUDE.md exists as a file in apps/web/src/app/. Count matches.
2. **Theme compliance**: Grep apps/web/src for hardcoded Tailwind colors that violate the semantic token rule:
   - `bg-gray-*`, `bg-slate-*`, `bg-zinc-*` (should be `bg-background`, `bg-card`, `bg-secondary`)
   - `text-white`, `text-black` on non-gradient elements (should be `text-foreground`)
   - `text-red-500`, `text-green-500`, `bg-green-600` (should be semantic destructive/success tokens)
   - Note: gradient classes like `from-*` and `to-*` are acceptable
3. **i18n coverage**: Grep for hardcoded Russian/Kazakh text in .tsx files (Cyrillic strings outside of translations.ts). Check that components use `t('key')` pattern.
4. **Responsive design**: Verify MobileNav.tsx exists, Sidebar uses `hidden md:flex` or similar. Check touch targets (min 44px).
5. **Accessibility**: Check for `<img>` without `alt`, `<button>` without accessible text, missing `aria-label` on icon-only buttons.
6. **Component standards**: Verify named exports (not `export default`), one component per file.

If Playwright MCP tools are available AND dev server is running on localhost:3000:
7. **Visual smoke test**: Navigate to /, /login, /courses. Take screenshots. Check for console errors.
8. **Mobile test**: Resize to 375px width. Check layout doesn't break.

Report format:
## UI & Frontend Report
### Page Structure: PASS/FAIL (X/Y pages)
### Theme Compliance: PASS/FAIL (list violations with file:line)
### i18n Coverage: PASS/FAIL (list hardcoded strings)
### Responsive Design: PASS/FAIL
### Accessibility: PASS/FAIL
### Component Standards: PASS/FAIL
### Visual Smoke Test: PASS/FAIL or SKIPPED
### Mobile Test: PASS/FAIL or SKIPPED

For each FAIL — include file:line and what's wrong.
```

### Step 3: Collect and Present Unified Report

As each agent completes, note its results. When all 3 are done, present:

```markdown
# QA Report — [date]

## Summary
| Category | Passed | Total |
|----------|--------|-------|
| Code Quality | X | 6 |
| API Health | X | 7 |
| UI & Frontend | X | 6-8 |
| **Overall** | **X** | **19-21** |

**Deploy verdict: SAFE / UNSAFE / RISKY**

## Critical Issues (blocks deploy)
[FAIL items that would break production — crashes, security holes, build failures]

## Warnings (fix soon)
[FAIL items that don't break production but violate project standards]

## All Clear
[PASS items in a compact list]
```

### Step 4: Actionable Recommendations

After the report:
1. List critical fixes in priority order with the exact file and what to change
2. Give a clear deploy verdict: SAFE (all critical pass), RISKY (minor issues), UNSAFE (critical failures)
3. Offer to fix issues: "Хочешь чтобы я пофиксил найденные проблемы?"

## Key Behaviors

- Agents run on `model: "haiku"` — fast and cheap
- All agents run with `run_in_background: true` — parallel execution
- Agents are READ-ONLY — they grep, read, and run build/type-check commands, but never edit files
- Playwright visual tests are optional — skipped if no dev server is running
- Be honest about failures — the goal is to catch issues before users do
- After deploy failure: include the error logs in agent prompts for context
- Theme check should distinguish between acceptable gradient colors and violations
- Security check should flag `dangerouslySetInnerHTML` only when NOT wrapped with DOMPurify
