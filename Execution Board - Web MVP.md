# Execution Board - Web MVP

Last update: 2026-03-21
PM owner: AI coordinator
Collaboration protocol: `AGENT_COLLAB_PROTOCOL.md`

## Latest orchestration run (parallel agents)

- Backend stream report: P0 endpoints for courses/enrollment prepared in isolated runner, with passing checks (`lint/build/test`) and idempotent enrollment test.
- Frontend stream report: integration scaffold prepared in isolated runner (`api client`, token storage, auth hydration, login/register wiring, courses API states), checks passed (`lint/build`).
- Status: outputs are validated at report level; changes are not yet integrated into this main workspace.
- PM decision: proceed to Stage 1 closeout by importing backend changes first, then frontend scaffold, then run local integration smoke.

## Latest smoke run (local)

- Backend and frontend were started with corrected ports (`backend:3001`, `frontend:3000`, frontend API base -> `http://localhost:3001/api/v1`).
- Health check passed: `GET /api/v1/health` -> `200`.
- Core smoke flow currently blocked:
  - `POST /auth/register`, `POST /auth/login`, `GET /courses` -> `500` due to database connectivity.
  - Prisma status: `P1001 Can't reach database server at localhost:5432`.
  - Docker compose startup failed because Docker daemon is not running.
- PM status: Stage 3 smoke is **blocked by infrastructure** (database unavailable), not by app code compilation.

## Latest smoke run (resolved)

- Docker Desktop started, `docker compose` services are up (`postgres`, `redis`).
- Prisma migration applied successfully (`prisma migrate dev`).
- Added smoke seed data for one published course.
- End-to-end API smoke passed:
  - `POST /auth/register` -> `201`
  - `POST /auth/login` -> `201`
  - `GET /courses` -> `200` with published course
  - `GET /users/me/enrollments` -> `200`
  - `POST /courses/:courseId/enroll` -> `201`
  - `GET /users/me/enrollments` (after enroll) -> `200` with enrolled course
- PM status: Stage 3 core learner API flow is **green** in local environment.

## Stage 4 UI smoke (latest)

- Browser UI smoke re-run after backend CORS fix: **PASS**.
- Verified flow:
  - register -> dashboard redirect
  - courses list loaded from API
  - enroll action success
  - my-courses shows enrolled course
- Additional fix applied after smoke:
  - frontend enrollment response mapping updated to support backend nested `course` object (resolved `Course undefined` display issue).
- PM status: Milestone A is ready for Stage 4 sign-off in local.

## Milestone B kickoff (in progress)

- Learner `learn/[courseId]` page moved from mock lesson list to live API integration.
- Added client support for:
  - `GET /courses/:courseId` (course modules/lessons)
  - `GET /lessons/:lessonId` (lesson payload + learner progress)
  - existing `PUT /lessons/:lessonId/progress` now used with real selected lesson id.
- Frontend checks after update: `lint` PASS, `build` PASS.
- PM status: first Milestone B vertical slice (`enroll -> open lesson -> save progress`) is implemented in UI; next step is full browser smoke validation for this slice.

## Milestone B learner slice (validated)

- Browser smoke for learner slice is now **PASS**.
- Verified flow:
  - register user -> dashboard
  - enroll from catalog
  - open `/learn/seed_course_1`
  - save lesson progress
  - dashboard progress cards render valid numeric values (no NaN)
- Fixes included in this iteration:
  - frontend progress mapping aligned with backend `/users/me/progress` shape
  - seed course enriched with module + lessons for realistic learn/progress testing
- PM status: learner vertical for Milestone B is green locally.

## Milestone B moderation slice (validated, API)

- Added executable smoke script: `backend/scripts/smoke-moderation-flow.js`.
- Instructor/Admin API smoke is **PASS** for full moderation lifecycle:
  - register admin + instructor
  - promote instructor role
  - instructor create course/module/lesson
  - publish course
  - admin moderation list includes course
  - admin reject (course hidden from public catalog)
  - admin approve (course visible again in public catalog)
- PM status: moderation API flow is green locally; remaining step is dedicated frontend console/admin UI for these endpoints.

## Milestone B moderation UI (validated)

- Added frontend routes:
  - `frontend/src/app/instructor/page.tsx`
  - `frontend/src/app/admin/page.tsx`
- Added frontend integration hooks/API:
  - `frontend/src/lib/hooks/use-instructor-admin.ts`
  - instructor/admin methods in `frontend/src/lib/api/client.ts`
- Added utility scripts for reliable local validation:
  - `backend/scripts/prepare-console-users.js`
  - `backend/scripts/smoke-moderation-flow.js`
- UI smoke result: **PASS**
  - Instructor flow: login -> create course -> add module -> add lesson -> publish
  - Admin flow: login -> moderation list -> reject with reason
- Frontend quality gate after changes: `lint` PASS, `build` PASS.

## PM Sign-off (current)

- Milestone A: **green**
- Milestone B learner slice: **green**
- Milestone B moderation API: **green**
- Milestone B moderation UI: **green**
- Overall local MVP execution status: **100% for planned scope in this cycle**.

## Release hardening (completed)

- Added reproducible release runbook: `RELEASE_RUNBOOK.md`.
- Added assert-based smoke scripts and npm commands:
  - `npm run smoke:learner`
  - `npm run smoke:moderation`
  - `npm run prepare:console-users`
- Backend smoke scripts now fail fast on contract regressions (status/assert checks).
- Full local release gate re-run:
  - backend: `lint`, `build`, `test`, `test:e2e` -> PASS
  - backend smokes: learner + moderation -> PASS
  - frontend: `lint`, `build` -> PASS
- PM status: project is ready for staging handoff under current MVP scope.

## Final closure

- All planned updates in current MVP cycle are closed.
- Handoff artifact prepared: `MVP_HANDOFF.md`.
- Final PM sign-off: **READY MVP**.

## Phase 1 acceleration (post-MVP)

- PM launched parallel agents for:
  - CI/CD pipeline enforcement
  - Backend critical-role e2e expansion
- Delivered CI workflows:
  - `.github/workflows/ci.yml` (push/PR backend+frontend gates)
  - `.github/workflows/smoke-manual.yml` (workflow_dispatch smoke orchestration note)
- Backend e2e strengthened:
  - shared bootstrap helper `backend/test/create-test-app.ts`
  - extended role and learner flow checks in `backend/test/auth-roles.e2e-spec.ts`
- Validation after integration:
  - backend: `lint`, `build`, `test`, `test:e2e` -> PASS (`8` e2e tests)
  - frontend: `lint`, `build` -> PASS
- PM status: quality baseline upgraded; ready to continue full-product phases at higher delivery speed.

## Multi-agent acceleration wave #2

- PM launched 4 parallel streams:
  - Backend quiz API
  - Frontend quiz UI
  - Backend activity feed API
  - Frontend activity feed UI
- Delivered:
  - quiz endpoints: `GET /lessons/:lessonId/quiz`, `POST /lessons/:lessonId/quiz/submit`
  - activity endpoint: `GET /users/me/activity`
  - learn page quiz rendering + submission flow
  - dashboard recent activity section
- Validation:
  - backend: `lint/build/test/test:e2e` PASS
  - frontend: `lint/build` PASS

## Multi-agent acceleration wave #3

- PM launched 4 additional parallel streams:
  - Backend social/friends API
  - Frontend friends page
  - Backend recommendations API
  - Frontend recommendations UI
- Delivered:
  - social endpoints under `/api/v1/social/friends/*`
  - recommendations endpoint: `GET /api/v1/courses/recommendations`
  - new frontend route: `/friends`
  - recommendations blocks on `/` and `/dashboard`
- Integration fix applied by PM:
  - frontend social client paths and payload normalization aligned to backend contracts.
- Validation:
  - backend: `prisma:generate`, `lint`, `build`, `test`, `test:e2e`, `smoke:learner`, `smoke:moderation` PASS
  - frontend: `lint`, `build` PASS
- PM status: project baseline moved beyond MVP toward full-platform phases with social + recommendations + quiz/activity flows green locally.

## Multi-agent acceleration wave #4

- PM launched 4 additional parallel streams:
  - realtime chat backend
  - realtime chat frontend
  - assignments + certificates backend
  - search/ranking upgrade
- Delivered:
  - chat REST API under `/api/v1/chat/*` and websocket gateway `/chat`
  - frontend chat page `/chat` with rooms, messages, direct-room creation and message send
  - assignments endpoints (`get lesson assignment`, `submit`, `grade`)
  - certificate endpoints (`issue`, `list mine`) with progress eligibility checks
  - advanced catalog sorting (`relevance`, `newest`, `popular`) with frontend URL-synced filters
- Integration fix applied by PM:
  - frontend chat client aligned to backend payload contracts (`rooms/messages` wrappers, `content` body field).
- Validation:
  - backend: `lint`, `build`, `test`, `test:e2e`, `smoke:learner`, `smoke:moderation` PASS
  - frontend: `lint`, `build` PASS
- PM status: full-product trajectory accelerated with chat + assignments/certificates + upgraded discovery/search now green in local quality gates.

## 1) Current Health Check

- Backend: `lint` PASS, `build` PASS, `test` PASS (1/1).
- Frontend: `lint` PASS, `build` PASS.
- Integration status: NOT connected yet (frontend uses static/mock content, no live API calls).

## 2) Team Split (parallel work)

### Backend stream (Agent B)

Goal: close API surface from MVP contract.

Top priorities:
1. Implement missing endpoints from `API Surface v1 - Web MVP.md`:
   - Public courses list/details
   - Enrollment and learning progress
   - Instructor course/module/lesson CRUD + publish flow
   - Admin moderation endpoints
2. Add DTO validation and unified error envelopes for all write endpoints.
3. Add API contract tests for critical learner flow:
   - register -> login -> enroll -> get lesson -> update progress.
4. Prepare OpenAPI docs and example payloads.

Definition of done:
- All P0 endpoints respond under `/api/v1`.
- Happy path and RBAC tests green.
- Seed data available for frontend integration.

### Frontend stream (Agent F)

Goal: replace static pages with API-driven user flow.

Top priorities:
1. Add API client layer with `NEXT_PUBLIC_API_BASE_URL`.
2. Implement auth flow:
   - register/login forms -> backend auth
   - token storage and refresh strategy
   - protected route handling
3. Connect `/courses` to live catalog endpoint.
4. Build first protected page:
   - `my-courses` from enrollments API
   - basic progress UI from progress endpoint.
5. Error/loading/empty states for all API-backed pages.

Definition of done:
- No hardcoded course/auth data on MVP-critical pages.
- Core learner path works with real backend.

## 3) Integration Milestones

### Milestone A (P0)
- Auth integration complete.
- Catalog and enrollment complete.
- Demo scenario: new user can register, login, view courses, enroll.

### Milestone B (P1)
- Lesson open + progress update complete.
- Instructor basic publish flow complete.
- Admin basic moderation complete.

## 4) QA and Test Gate

Required before staging demo:
1. Backend: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.
2. Frontend: `npm run lint`, `npm run build`.
3. Smoke (manual or Playwright):
   - register
   - login
   - open catalog
   - enroll
   - open lesson
   - save progress
4. Contract check:
   - frontend request/response shapes match backend DTOs.

## 5) Risks and Mitigation

- Risk: frontend-backend contract drift.
  - Mitigation: lock API schemas and track contract changes in one changelog.
- Risk: progress update inconsistency.
  - Mitigation: enforce idempotent `PUT /lessons/:lessonId/progress`.
- Risk: role leaks (RBAC gaps).
  - Mitigation: mandatory RBAC tests for all protected endpoints.

## 6) Next PM Actions

1. Confirm backend endpoint completion map (done/missing per API surface).
2. Add frontend API client + auth integration first.
3. Run end-to-end smoke against local environment.
4. Produce staging readiness report with blockers and ETA.

