# AiBot LMS — Mobile API Documentation

**Base URL:** `https://demo-lms.aibot.kz/api`
**Swagger UI:** https://demo-lms.aibot.kz/api/docs/
**Content-Type:** `application/json`
**Auth:** `Authorization: Bearer <accessToken>`

---

## Формат ответов

Все ответы имеют одинаковую структуру:

```json
// Успех
{
  "success": true,
  "data": { ... }
}

// Ошибка
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки на русском"
  }
}
```

**HTTP коды:** 200 (OK), 201 (Created), 400 (Validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

---

## 1. Авторизация

### POST /auth/register

Регистрация нового пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "firstName": "Иван",
  "lastName": "Иванов",
  "phone": "+77001234567"
}
```
Обязательные: `email`, `password` (мин. 6 символов), `firstName`
Опциональные: `lastName`, `phone`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmn123abc",
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Иванов",
      "middleName": null,
      "phone": "+77001234567",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "4478920efacb85568f32..."
  }
}
```

**Ошибки:**
- 400 `VALIDATION_ERROR` — не все поля заполнены или пароль < 6 символов
- 409 `EMAIL_EXISTS` — email уже зарегистрирован

---

### POST /auth/login

Вход по email и паролю.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmn123abc",
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Иванов",
      "middleName": null,
      "phone": "+77001234567",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "4478920efacb85568f32..."
  }
}
```

**Ошибки:**
- 400 `VALIDATION_ERROR` — email или password не указаны
- 401 `INVALID_CREDENTIALS` — неверный email или пароль

---

### POST /auth/refresh

Обновление токенов. Старый refreshToken становится невалидным (ротация).

**Request:**
```json
{
  "refreshToken": "4478920efacb85568f32..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmn123abc",
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Иванов",
      "middleName": null,
      "phone": "+77001234567",
      "role": "STUDENT"
    },
    "accessToken": "новый_токен...",
    "refreshToken": "новый_refresh..."
  }
}
```

**Ошибки:**
- 401 `INVALID_REFRESH_TOKEN` — токен не найден
- 401 `REFRESH_TOKEN_EXPIRED` — токен истёк

---

### PATCH /auth/profile

Обновление профиля. **Требует Bearer token.**

**Request:**
```json
{
  "firstName": "Иван",
  "lastName": "Петров",
  "middleName": "Сергеевич",
  "phone": "+77009876543"
}
```
Все поля опциональные — отправляйте только те, которые нужно обновить.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cmn123abc",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "middleName": "Сергеевич",
    "phone": "+77009876543",
    "role": "STUDENT"
  }
}
```

---

### POST /auth/change-password

Смена пароля. **Требует Bearer token.**

**Request:**
```json
{
  "currentPassword": "старый_пароль",
  "newPassword": "новый_пароль_мин_6"
}
```

**Response 200:**
```json
{
  "success": true
}
```

**Ошибки:**
- 401 `INVALID_PASSWORD` — неверный текущий пароль
- 400 `VALIDATION_ERROR` — новый пароль < 6 символов

---

## 2. Курсы

### GET /courses

Список опубликованных курсов. **Без авторизации.**

**Query параметры:** `?search=текст` (опционально)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmn456def",
      "slug": "ai-basics",
      "title": "Основы ИИ",
      "description": "Вводный курс по искусственному интеллекту",
      "coverUrl": null,
      "totalLessons": 5,
      "totalModules": 2,
      "enrollmentCount": 15
    }
  ]
}
```

---

### GET /courses/:slug

Детали курса с модулями и уроками. **Без авторизации.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cmn456def",
    "slug": "ai-basics",
    "title": "Основы ИИ",
    "description": "Вводный курс...",
    "coverUrl": null,
    "price": "0",
    "currency": "RUB",
    "isFree": true,
    "isPublished": true,
    "createdAt": "2026-03-28T00:00:00.000Z",
    "updatedAt": "2026-03-28T00:00:00.000Z",
    "modules": [
      {
        "id": "mod1",
        "title": "Введение",
        "description": "Что такое ИИ",
        "order": 1,
        "isPublished": true,
        "lessons": [
          {
            "id": "les1",
            "title": "Введение в AI",
            "type": "VIDEO",
            "duration": 600,
            "order": 1,
            "isFree": false
          }
        ]
      }
    ]
  }
}
```

**Поле `type`:** `"VIDEO"` | `"TEXT"` | `"QUIZ"`

---

### GET /courses/my-progress

Мои курсы с прогрессом. **Требует Bearer token.**

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmn456def",
      "slug": "ai-basics",
      "title": "Основы ИИ",
      "description": "Вводный курс...",
      "coverUrl": null,
      "totalModules": 2,
      "totalLessons": 5,
      "completedLessons": 3,
      "progressPercent": 60,
      "enrolledAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

Пустой массив если нет enrollments.

---

### GET /courses/:slug/lessons/:lessonId

Контент урока. **Требует Bearer token + enrollment.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "les1",
    "title": "Введение в AI",
    "type": "VIDEO",
    "videoUrl": "/api/videos/intro.mp4",
    "content": null,
    "description": "Видео-урок: основы AI",
    "duration": 600,
    "order": 1,
    "moduleId": "mod1",
    "isFree": false,
    "isPublished": true,
    "createdAt": "2026-03-28T00:00:00.000Z",
    "tasks": [
      {
        "id": "task1",
        "title": "Тест",
        "description": "Ответьте на вопросы",
        "type": "QUIZ",
        "maxScore": 100
      }
    ],
    "progress": {
      "completed": false,
      "watchedSec": 120,
      "completedAt": null
    }
  }
}
```

**`progress`** = `null` если пользователь ещё не начинал урок.
**`videoUrl`** — относительный URL. Полный: `https://demo-lms.aibot.kz/api/videos/intro.mp4`
**`content`** — HTML-текст для уроков типа TEXT.

**Ошибки:**
- 403 `NOT_ENROLLED` — нет доступа к курсу (не оплачен)
- 404 `COURSE_NOT_FOUND` или `LESSON_NOT_FOUND`

---

## 3. Прогресс

### POST /progress/lesson/:lessonId/complete

Отметить урок как завершённый. **Требует Bearer token.**

**Request:** пустое тело `{}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": "prog1",
      "userId": "cmn123abc",
      "lessonId": "les1",
      "completed": true,
      "watchedSec": 0,
      "completedAt": "2026-03-28T12:00:00.000Z",
      "updatedAt": "2026-03-28T12:00:00.000Z"
    }
  }
}
```

---

### PATCH /progress/lesson/:lessonId/watchtime

Обновить время просмотра видео. **Требует Bearer token.** Вызывать каждые 10 секунд.

**Request:**
```json
{
  "watchedSec": 120
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "prog1",
    "userId": "cmn123abc",
    "lessonId": "les1",
    "completed": false,
    "watchedSec": 120,
    "updatedAt": "2026-03-28T12:00:00.000Z"
  }
}
```

---

### GET /progress/course/:courseId

Прогресс по курсу. **Требует Bearer token + enrollment.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "courseId": "cmn456def",
    "totalLessons": 5,
    "completedLessons": 3,
    "progressPercent": 60,
    "lessons": [
      {
        "lessonId": "les1",
        "completed": true,
        "watchedSec": 600,
        "completedAt": "2026-03-28T12:00:00.000Z"
      },
      {
        "lessonId": "les2",
        "completed": false,
        "watchedSec": 120,
        "completedAt": null
      }
    ]
  }
}
```

**Ошибки:**
- 403 `NOT_ENROLLED` — нет enrollment

---

## 4. Сертификаты

### POST /certificates/request/:courseId

Запросить сертификат. **Требует Bearer token.** Курс должен быть завершён на 100%. Имя берётся из профиля.

**Request:** пустое тело `{}`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "cert1",
    "userId": "cmn123abc",
    "courseId": "cmn456def",
    "number": "AIBOT-ABCDE-1234",
    "fullName": "Иванов Иван Сергеевич",
    "fileUrl": null,
    "issuedAt": "2026-03-28T12:00:00.000Z"
  }
}
```

**Ошибки:**
- 400 `VALIDATION_ERROR` — firstName/lastName не заполнены в профиле
- 403 `NOT_ENROLLED` или курс не завершён на 100%
- 409 `CERTIFICATE_EXISTS` — сертификат уже выдан

---

### GET /certificates/my

Мои сертификаты. **Требует Bearer token.**

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cert1",
      "courseId": "cmn456def",
      "courseTitle": "Основы ИИ",
      "number": "AIBOT-ABCDE-1234",
      "fileUrl": null,
      "issuedAt": "2026-03-28T12:00:00.000Z"
    }
  ]
}
```

---

### GET /certificates/:id/download

Скачать PDF. Поддерживает два способа авторизации:
- Header: `Authorization: Bearer <token>`
- Query: `?token=<accessToken>`

**Response 200:** бинарный PDF файл
**Content-Type:** `application/pdf`

---

### GET /certificates/verify/:number

Проверить сертификат. **Без авторизации.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "number": "AIBOT-ABCDE-1234",
    "fullName": "Иванов Иван Сергеевич",
    "courseTitle": "Основы ИИ",
    "issuedAt": "2026-03-28T12:00:00.000Z"
  }
}
```

---

## 5. Уведомления

### GET /notifications

Список уведомлений. **Требует Bearer token.**

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif1",
      "type": "success",
      "title": "Доступ к курсу открыт",
      "message": "Вам открыт доступ к курсу \"Основы ИИ\"",
      "isRead": false,
      "createdAt": "2026-03-28T12:00:00.000Z"
    }
  ]
}
```

---

### GET /notifications/unread-count

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

### PATCH /notifications/read-all

Прочитать все. **Требует Bearer token.**

**Response 200:**
```json
{
  "success": true
}
```

---

### PATCH /notifications/:id/read

Прочитать одно. **Требует Bearer token.**

**Response 200:**
```json
{
  "success": true
}
```

---

## 6. Видео

### GET /videos/:filename

Стриминг MP4. Поддерживает `Range` headers для seek. **Без авторизации.**

**Headers запроса:**
```
Range: bytes=0-1000000
```

**Response 206 (Partial Content):**
```
Content-Type: video/mp4
Content-Range: bytes 0-1000000/50000000
Accept-Ranges: bytes
```

**Полный URL видео:** берётся из `lesson.videoUrl` → `https://demo-lms.aibot.kz` + videoUrl
Пример: `https://demo-lms.aibot.kz/api/videos/intro.mp4`

---

## Токены

| Токен | Срок | Описание |
|-------|------|----------|
| `accessToken` | 7 дней | JWT, передавать в `Authorization: Bearer` |
| `refreshToken` | 90 дней | Для обновления пары токенов через `/auth/refresh` |

### Поток обновления токенов

1. Запрос с `accessToken` → 401
2. Вызвать `POST /auth/refresh` с `refreshToken`
3. Получить новую пару `accessToken` + `refreshToken`
4. Повторить исходный запрос с новым `accessToken`
5. Если refresh тоже 401 → пользователь должен залогиниться заново

---

## Коды ошибок

| Код | HTTP | Описание |
|-----|------|----------|
| `VALIDATION_ERROR` | 400 | Неверные входные данные |
| `UNAUTHORIZED` | 401 | Токен отсутствует или невалиден |
| `INVALID_CREDENTIALS` | 401 | Неверный email/пароль |
| `INVALID_PASSWORD` | 401 | Неверный текущий пароль |
| `INVALID_REFRESH_TOKEN` | 401 | Невалидный refresh token |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token истёк |
| `NOT_ENROLLED` | 403 | Нет доступа к курсу |
| `FORBIDDEN` | 403 | Нет прав |
| `COURSE_NOT_FOUND` | 404 | Курс не найден |
| `LESSON_NOT_FOUND` | 404 | Урок не найден |
| `CERTIFICATE_NOT_FOUND` | 404 | Сертификат не найден |
| `EMAIL_EXISTS` | 409 | Email уже зарегистрирован |
| `CERTIFICATE_EXISTS` | 409 | Сертификат уже выдан |
