# PRD v2 - Web MVP (Backend-first)

## 1) Product Context

**Product name:** Learn.Aibot.KZ  
**Version:** 2.0 (MVP focus)  
**Date:** 2026-03-21

Learn.Aibot.KZ is an educational platform with a web-first strategy and a shared backend for future mobile applications.  
This PRD defines the first production MVP focused on learner value and content operations.

## 2) MVP Goal

Deliver a working web platform where:
- a learner can register, enroll, consume lessons, and track progress end-to-end;
- an instructor can create and publish course content from an instructor console;
- an admin can moderate and control publication quality.

## 3) Target Users

- **Student (B2C):** discovers courses, learns, completes lessons.
- **Instructor:** creates course structure, lessons, and publishes updates.
- **Admin/Moderator:** controls role assignment and moderation workflow.

## 4) Product Scope

### 4.1 Must-have (MVP)

- Authentication: email/password login, refresh tokens, logout.
- Course catalog: search/filter/sort, course details page.
- Enrollment: join course, view enrolled courses.
- Learning flow:
  - lesson types: `VIDEO`, `TEXT`, `QUIZ` (quiz as basic stub in MVP);
  - progress tracking per lesson and per course.
- Instructor console:
  - CRUD for courses, modules, lessons;
  - draft/publish flow.
- Admin basics:
  - role control (`STUDENT`, `INSTRUCTOR`, `ADMIN`);
  - basic moderation for publish/unpublish actions.
- Basic observability:
  - structured logs;
  - core API metrics (latency, errors, throughput).

### 4.2 Out of Scope (MVP)

- Payments and subscriptions.
- Mobile apps (iOS/Android clients).
- Certificates and advanced gamification.
- Full video transcoding pipeline (HLS workers, multiple renditions).
- Elasticsearch-based search.

## 5) Business and Product Metrics (8-12 weeks)

- **Activation Rate:** `%` of registered users who enroll into at least one course within 24h.
- **Lesson Completion Rate:** `%` of started lessons that are completed.
- **Weekly Retention (W1/W4):** returning learners after first enrollment.
- **Instructor Throughput:** number of published lessons/courses per week.
- **Core API Reliability:** error rate and P95 latency for critical read endpoints.

## 6) Functional Requirements

### 6.1 Student Experience

- Register, sign in, sign out, refresh session.
- Browse and filter courses by category, level, language.
- View course details with module and lesson outline.
- Enroll to a course.
- Open lesson content and persist progress.
- View own progress dashboard for enrolled courses.

### 6.2 Instructor Experience

- Create/edit/delete own courses.
- Manage module ordering and lesson ordering.
- Save drafts and publish course updates.
- Attach lesson content metadata (URL/text/basic quiz schema).

### 6.3 Admin Experience

- Manage user roles.
- Review and moderate published content.
- Revoke publication state if quality/compliance issues appear.

## 7) Non-functional Requirements

- **Performance:** P95 < 400ms for key read APIs in staging-like load.
- **Security:** JWT auth, role-based access checks on all protected routes.
- **Auditability:** log publish/unpublish and role changes with actor metadata.
- **Availability target (MVP):** best effort with clear recovery playbooks.

## 8) Constraints and Assumptions

- One shared backend is the long-term source of truth for web and mobile.
- MVP ships without monetization to optimize for product-market validation.
- Video content can be delivered by pre-signed URLs from object storage in MVP.

## 9) Risks and Mitigation (summary)

- **Scope creep:** freeze MVP scope with strict out-of-scope list.
- **Content quality variance:** enforce publish checklist and admin moderation.
- **Progress data inconsistency:** define idempotent progress update contract.
- **Future migration pressure:** keep API versioned (`/api/v1`) and modular.

## 10) Release Readiness Criteria

- Core learner flow works end-to-end in staging.
- Instructor can publish at least one full pilot course.
- RBAC and moderation checks pass.
- Smoke tests and API contract tests are green.
- Monitoring dashboards include core API health indicators.
