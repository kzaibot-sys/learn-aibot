# API Surface v1 - Web MVP

Base path: `/api/v1`  
Auth: `Bearer access_token` for protected endpoints.  
Roles: `PUBLIC`, `STUDENT`, `INSTRUCTOR`, `ADMIN`.

## 1) Authentication

- `POST /auth/register` - `PUBLIC`  
  Create account with email/password.
- `POST /auth/login` - `PUBLIC`  
  Issue access and refresh tokens.
- `POST /auth/refresh` - `PUBLIC` (refresh token required)  
  Rotate access token.
- `POST /auth/logout` - `STUDENT|INSTRUCTOR|ADMIN`  
  Revoke current refresh session.

## 2) Profile and User

- `GET /users/me` - `STUDENT|INSTRUCTOR|ADMIN`  
  Return current user profile and role.
- `PATCH /users/me` - `STUDENT|INSTRUCTOR|ADMIN`  
  Update basic profile fields.

## 3) Public Courses

- `GET /courses` - `PUBLIC`  
  Query catalog with pagination, filters (`category`, `level`, `language`, `search`) and sorting (`sortBy=relevance|newest|popular`).
- `GET /courses/:courseId` - `PUBLIC`  
  Get course details and learning outline.

## 4) Enrollment and Learning

- `POST /courses/:courseId/enroll` - `STUDENT`  
  Enroll current user in a course (idempotent).
- `GET /users/me/enrollments` - `STUDENT`  
  List enrolled courses with progress summary.
- `GET /lessons/:lessonId` - `STUDENT`  
  Get lesson content if enrolled and authorized.
- `PUT /lessons/:lessonId/progress` - `STUDENT`  
  Upsert lesson progress (`watchedDuration`, `completed`, optional `quizScore`).
- `GET /users/me/progress` - `STUDENT`  
  Aggregated progress by course and lesson status.
- `GET /lessons/:lessonId/quiz` - `STUDENT`  
  Return sanitized quiz payload for quiz-type lessons.
- `POST /lessons/:lessonId/quiz/submit` - `STUDENT`  
  Submit answers, calculate score, update lesson/course progress.
- `GET /lessons/:lessonId/assignment` - `STUDENT`  
  Return assignment details for lesson if learner is enrolled.
- `POST /assignments/:assignmentId/submit` - `STUDENT`  
  Submit or update assignment submission.
- `POST /assignments/:assignmentId/grade` - `INSTRUCTOR`  
  Grade learner submission for owned course assignment.
- `POST /courses/:courseId/certificate/issue` - `STUDENT`  
  Issue course certificate for learner when course progress is 100%.
- `GET /users/me/certificates` - `STUDENT`  
  List learner certificates.
- `GET /users/me/activity` - `STUDENT`  
  Return recent learning activity feed (`ENROLLED`, `LESSON_PROGRESS`, `LESSON_COMPLETED`, `QUIZ_SUBMITTED`).

## 5) Instructor Console

- `POST /instructor/courses` - `INSTRUCTOR`  
  Create course draft.
- `PATCH /instructor/courses/:courseId` - `INSTRUCTOR`  
  Update owned course metadata.
- `DELETE /instructor/courses/:courseId` - `INSTRUCTOR`  
  Archive or delete draft course.
- `POST /instructor/courses/:courseId/modules` - `INSTRUCTOR`  
  Add module to owned course.
- `PATCH /instructor/modules/:moduleId` - `INSTRUCTOR`  
  Update module details/order.
- `POST /instructor/modules/:moduleId/lessons` - `INSTRUCTOR`  
  Add lesson to module.
- `PATCH /instructor/lessons/:lessonId` - `INSTRUCTOR`  
  Update lesson details/order/content metadata.
- `POST /instructor/courses/:courseId/publish` - `INSTRUCTOR`  
  Publish course if validation passes.
- `POST /instructor/courses/:courseId/unpublish` - `INSTRUCTOR`  
  Move course back to draft.

## 6) Admin

- `PATCH /admin/users/:userId/role` - `ADMIN`  
  Change user role.
- `GET /admin/courses/moderation` - `ADMIN`  
  List recently published/updated courses.
- `POST /admin/courses/:courseId/reject` - `ADMIN`  
  Reject publication and provide moderation reason.
- `POST /admin/courses/:courseId/approve` - `ADMIN`  
  Confirm moderation and keep published state.

## 7) API Contract Conventions

- Errors follow standard envelope:
  - `code` (machine-readable)
  - `message` (human-readable)
  - `requestId` (traceability)
- Pagination standard:
  - request: `page`, `limit`
  - response: `items`, `total`, `page`, `limit`
- Time format: ISO-8601 UTC.
- All write endpoints validate DTOs and return typed errors.
- Reference request/response payload examples:
  - `backend/API_CONTRACT_EXAMPLES.md`

## 8) Social and Recommendations

- `GET /courses/recommendations` - `PUBLIC`  
  Return top published courses ranked by enrollment count and freshness.
- `GET /social/friends/requests` - `STUDENT|INSTRUCTOR|ADMIN`  
  Return incoming/outgoing pending friend requests.
- `POST /social/friends/request` - `STUDENT|INSTRUCTOR|ADMIN`  
  Create friend request by `targetUserId`.
- `POST /social/friends/:requestId/accept` - `STUDENT|INSTRUCTOR|ADMIN`  
  Accept pending incoming friend request.
- `POST /social/friends/:requestId/decline` - `STUDENT|INSTRUCTOR|ADMIN`  
  Decline pending incoming friend request.
- `GET /social/friends` - `STUDENT|INSTRUCTOR|ADMIN`  
  Return accepted friends list.
- `POST /social/friends/:friendUserId/block` - `STUDENT|INSTRUCTOR|ADMIN`  
  Block a user and remove existing relation between pair.

## 9) Chat

- `GET /chat/rooms` - `STUDENT|INSTRUCTOR|ADMIN`  
  List rooms available for current user.
- `POST /chat/rooms` - `STUDENT|INSTRUCTOR|ADMIN`  
  Create/get room (`DIRECT` with `peerUserId` or `COURSE` with `courseId`).
- `GET /chat/rooms/:roomId/messages` - `STUDENT|INSTRUCTOR|ADMIN`  
  List room messages with optional cursor params.
- `POST /chat/rooms/:roomId/messages` - `STUDENT|INSTRUCTOR|ADMIN`  
  Send message to room.
