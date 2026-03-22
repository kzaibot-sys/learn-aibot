# Backend API Contract Examples

Base path: `/api/v1`

## Error Envelope (all errors)

```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "requestId": "4af9f90f-2a01-4b6d-8dbd-9f7f1c0d9ea9"
}
```

## Auth

### `POST /auth/register`

Request:

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### `POST /auth/refresh`

Request:

```json
{
  "refreshToken": "<jwt>"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### `POST /auth/logout`

Headers: `Authorization: Bearer <access_token>`

Request:

```json
{
  "refreshToken": "<jwt>"
}
```

Response:

```json
{
  "success": true
}
```

## Public Courses

### `GET /courses?page=1&limit=20&category=ai&level=beginner&language=ru&search=prompt`

Response:

```json
{
  "items": [
    {
      "id": "clx123",
      "slug": "prompt-engineering-basics",
      "title": "Prompt Engineering Basics",
      "description": "Learn prompt fundamentals",
      "category": "AI",
      "level": "Beginner",
      "language": "RU",
      "createdAt": "2026-03-21T10:00:00.000Z",
      "updatedAt": "2026-03-21T10:10:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### `GET /courses/:courseId`

Response:

```json
{
  "id": "clx123",
  "slug": "prompt-engineering-basics",
  "title": "Prompt Engineering Basics",
  "status": "PUBLISHED",
  "modules": [
    {
      "id": "mod1",
      "title": "Module 1",
      "order": 1,
      "lessons": [
        {
          "id": "les1",
          "title": "Intro",
          "type": "VIDEO",
          "order": 1
        }
      ]
    }
  ]
}
```

## Student Learning

### `POST /courses/:courseId/enroll`

Headers: `Authorization: Bearer <student_access_token>`

Response:

```json
{
  "id": "enr1",
  "userId": "usr1",
  "courseId": "clx123",
  "progress": 0,
  "enrolledAt": "2026-03-21T10:20:00.000Z"
}
```

### `PUT /lessons/:lessonId/progress`

Request:

```json
{
  "watchedDuration": 420,
  "completed": true,
  "quizScore": 90
}
```

Response:

```json
{
  "progress": {
    "id": "prg1",
    "userId": "usr1",
    "lessonId": "les1",
    "watchedDuration": 420,
    "completed": true,
    "quizScore": 90
  },
  "courseProgress": 33.33
}
```

## Instructor

### `POST /instructor/courses`

Headers: `Authorization: Bearer <instructor_access_token>`

Request:

```json
{
  "title": "Prompt Engineering Basics",
  "slug": "prompt-engineering-basics",
  "description": "Learn prompt fundamentals",
  "category": "AI",
  "level": "Beginner",
  "language": "RU"
}
```

### `POST /instructor/courses/:courseId/publish`

Response:

```json
{
  "id": "clx123",
  "status": "PUBLISHED",
  "moderationReason": null
}
```

## Admin

### `PATCH /admin/users/:userId/role`

Headers: `Authorization: Bearer <admin_access_token>`

Request:

```json
{
  "role": "INSTRUCTOR"
}
```

### `POST /admin/courses/:courseId/reject`

Request:

```json
{
  "reason": "Low content quality"
}
```

Response:

```json
{
  "id": "clx123",
  "status": "DRAFT",
  "moderationReason": "Low content quality"
}
```
