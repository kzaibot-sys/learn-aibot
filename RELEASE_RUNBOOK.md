# Release Runbook (Local -> Staging Ready)

Last update: 2026-03-22

## 1) Start dependencies

### Backend

From `backend`:

1. `npm run db:up`
2. `npm run prisma:migrate`

## 2) Quality gates

On GitHub, workflow **CI** runs backend and frontend checks on push and pull requests (lint, build, tests; backend includes `test:e2e`). Optional manual workflow **Smoke (manual)** documents smoke requirements and can run `smoke:learner` / `smoke:moderation` when `execute_smokes` is enabled on an environment with the API and data services available (see workflow description).

### Backend quality gate

From `backend`:

1. `npm run lint`
2. `npm run build`
3. `npm run test`
4. `npm run test:e2e`

### Frontend quality gate

From `frontend`:

1. `npm run lint`
2. `npm run build`

## 3) Smoke gates

From `backend`:

1. Learner flow: `npm run smoke:learner`
2. Moderation flow: `npm run smoke:moderation`

Notes:
- smoke scripts auto-start local API on `:3001` if it is not already running
- learner smoke auto-seeds a published course with module + lessons
- moderation smoke uses Prisma for role promotion (no `docker exec` dependency)

Expected:
- no assertion failures
- exit code `0` for both scripts

## 4) Optional UI role checks

Prepare users:

From `backend`: `npm run prepare:console-users`

Then in browser:
- login as instructor -> `/instructor` -> create/module/lesson/publish
- login as admin -> `/admin` -> approve/reject

## 5) Runtime start commands

Use separate terminals:

- Backend (port 3001):  
  PowerShell: `$env:PORT=3001; npm run start:dev`
- Frontend (api base):  
  PowerShell: `$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:3001/api/v1'; npm run dev`

## 6) Sign-off criteria

Release candidate is considered ready when:

1. Backend + frontend quality gates are green.
2. `smoke:learner` and `smoke:moderation` are green.
3. No blocker in `Execution Board - Web MVP.md`.
4. Protocol compliance maintained (`AGENT_COLLAB_PROTOCOL.md`).
