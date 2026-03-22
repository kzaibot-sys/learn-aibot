# Learn.Aibot.KZ MVP Handoff

Status: READY  
Date: 2026-03-21

## 1) MVP scope delivered

- Authentication: register, login, refresh, logout.
- Student flow:
  - public catalog
  - enroll to course
  - open lesson
  - save lesson progress
  - dashboard + my-courses progress view
- Instructor flow:
  - create draft course
  - add module
  - add lesson
  - publish
- Admin flow:
  - moderation list
  - reject/approve published courses
  - role update endpoint

## 2) Frontend routes delivered

- Public: `/`, `/courses`, `/login`, `/register`, `/about`, `/pricing`
- Student: `/dashboard`, `/my-courses`, `/learn/[courseId]`
- Instructor: `/instructor`
- Admin: `/admin`

## 3) Backend contract

Base: `/api/v1`

Validated endpoint groups:
- auth
- users/profile
- courses/catalog
- enrollment/learning/progress
- instructor console
- admin moderation

## 4) Quality and smoke status

Latest local release gate: PASS

- Backend:
  - `npm run lint` PASS
  - `npm run build` PASS
  - `npm run test` PASS
  - `npm run test:e2e` PASS
  - `npm run smoke:learner` PASS
  - `npm run smoke:moderation` PASS
- Frontend:
  - `npm run lint` PASS
  - `npm run build` PASS

## 5) Run instructions (local)

### Dependencies

From `backend`:
1. `npm run db:up`
2. `npm run prisma:migrate`

### Start apps

Backend (PowerShell):
- `$env:PORT=3001; npm run start:dev`

Frontend (PowerShell):
- `$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:3001/api/v1'; npm run dev`

## 6) Operational scripts

From `backend`:
- `npm run smoke:learner`
- `npm run smoke:moderation`
- `npm run prepare:console-users` (optional UI role accounts)

## 7) Project management status

- Protocol in force: `AGENT_COLLAB_PROTOCOL.md`
- Execution tracking: `Execution Board - Web MVP.md`
- Release runbook: `RELEASE_RUNBOOK.md`

Final sign-off: MVP is ready for staging handoff under current agreed scope.
