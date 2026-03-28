<p align="center">
  <img src="apps/web/public/favicon.svg" alt="AiBot Logo" width="80" height="80">
</p>

<h1 align="center">AiBot LMS</h1>

<p align="center">
  <strong>Образовательная платформа с ИИ</strong><br>
  Онлайн-курсы, видеоуроки, сертификаты и интеграция с Telegram
</p>

<p align="center">
  <a href="https://demo-lms.aibot.kz">Demo</a> &bull;
  <a href="https://demo-lms.aibot.kz/api/docs/">API Docs</a> &bull;
  <a href="https://t.me/aibot_learn_bot">Telegram Bot</a> &bull;
  <a href="docs/mobile-api.md">Mobile API</a>
</p>

---

## Обзор

AiBot LMS — полноценная платформа для онлайн-обучения. Полный цикл: **Landing -> Telegram Bot (оплата) -> LMS Web/Mini App (обучение) -> Сертификат**.

### Ключевые возможности

- **Каталог курсов** — модули, видео-уроки, текстовые уроки, задания
- **Видеоплеер** — MP4 стриминг с Range headers, автосохранение позиции, fullscreen
- **Прогресс** — отслеживание пройденных уроков, процент завершения
- **Сертификаты** — PDF генерация с печатью, подписью и QR-кодом
- **Telegram Mini App** — авторизация через HMAC, доступ прямо из бота
- **Bot API** — 15 эндпоинтов для интеграции внешнего бота
- **Мобильное API** — REST API для Android/iOS приложений
- **Swagger UI** — интерактивная документация на `/api/docs`
- **Админка** — управление курсами, студентами, аналитика
- **i18n** — русский и казахский языки

---

## Архитектура

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js    │     │  Express API │     │  PostgreSQL  │
│  Frontend   │────>│  REST API    │────>│  (Prisma)    │
│  (SSR/CSR)  │     │  + Swagger   │     │              │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
┌─────────────┐     ┌──────┴───────┐     ┌──────────────┐
│  Telegram   │     │  Bot API     │     │  Redis       │
│  Bot        │────>│  (X-Bot-     │     │  (cache)     │
│  (external) │     │   Secret)    │     │              │
└─────────────┘     └──────────────┘     └──────────────┘

┌─────────────┐     ┌──────────────┐
│  Mobile App │     │  Telegram    │
│  (Android/  │────>│  Mini App    │
│   iOS)      │     │  (/tg-auth)  │
└─────────────┘     └──────────────┘
```

---

## Технологии

| Слой | Стек |
|------|------|
| **Frontend** | Next.js 16, React 18, Tailwind CSS 3, Zustand, React Query, Framer Motion |
| **API** | Express 4, JWT, bcryptjs, zod, helmet, compression |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Cache** | Redis 7 (graceful degradation) |
| **Video** | MP4 streaming (Range headers), custom VideoPlayer |
| **PDF** | PDFKit (сертификаты с печатью, подписью, QR) |
| **Docs** | Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express) |
| **i18n** | Custom React Context (ru/kz) |
| **Deploy** | Docker, Docker Compose, Nginx, Cloudflare |

---

## Быстрый старт

### Требования

- Node.js >= 20
- Docker & Docker Compose
- npm

### Установка

```bash
# Клонировать
git clone https://github.com/kzaibot-sys/learn-aibot.git
cd learn-aibot

# Установить зависимости
npm install

# Скопировать .env
cp .env.example .env

# Запустить PostgreSQL и Redis
docker compose up -d

# Сгенерировать Prisma клиент и миграции
npm run db:generate
cd packages/database && npx prisma migrate dev

# Seed базы данных
cd packages/database && npx tsx prisma/seed.ts

# Запустить dev
npm run dev
```

### Порты

| Сервис | Порт |
|--------|------|
| Web (Next.js) | 3000 |
| API (Express) | 3001 |
| PostgreSQL | 5433 |
| Redis | 6380 |

### Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@aibot.kz | admin123456 |
| Student | student@aibot.kz | student123456 |

---

## API

### Swagger UI

Интерактивная документация: **[/api/docs](https://demo-lms.aibot.kz/api/docs/)**

### Основные эндпоинты

```
# Авторизация
POST /api/auth/register          # Регистрация
POST /api/auth/login             # Вход
POST /api/auth/refresh           # Обновить токены
PATCH /api/auth/profile          # Обновить профиль
POST /api/auth/change-password   # Сменить пароль
POST /api/auth/telegram          # Вход через Telegram Mini App

# Курсы
GET  /api/courses                # Список курсов
GET  /api/courses/:slug          # Детали курса
GET  /api/courses/my-progress    # Мои курсы с прогрессом
GET  /api/courses/:slug/lessons/:id  # Контент урока (enrollment)

# Прогресс
POST  /api/progress/lesson/:id/complete   # Завершить урок
PATCH /api/progress/lesson/:id/watchtime  # Время просмотра

# Сертификаты
POST /api/certificates/request/:courseId  # Запросить
GET  /api/certificates/my                 # Мои сертификаты
GET  /api/certificates/:id/download       # Скачать PDF
GET  /api/certificates/verify/:number     # Проверить (публичный)

# Видео
GET  /api/videos/:filename    # Стриминг MP4

# Уведомления
GET   /api/notifications           # Список
GET   /api/notifications/unread-count
PATCH /api/notifications/read-all
```

### Bot API

Для интеграции внешнего Telegram бота. Авторизация: `X-Bot-Secret` header.

```
POST /api/bot/users                    # Создать пользователя
GET  /api/bot/users/:telegramId        # Получить пользователя
POST /api/bot/grant-access             # Выдать доступ к курсу
POST /api/bot/revoke-access            # Отозвать доступ
GET  /api/bot/courses                  # Список курсов
GET  /api/bot/stats                    # Статистика
POST /api/bot/notifications            # Отправить уведомление
```

Полная документация: **[docs/mobile-api.md](docs/mobile-api.md)**

---

## Деплой

### Docker Compose (VDS)

```bash
# Production
docker compose -f docker-compose.prod.yml up -d --build

# Nginx настраивается отдельно (проксирование на 3000/3001)
```

### Railway

```bash
railway service api && railway up --detach
railway service lms-platform && railway up --detach
```

---

## Структура проекта

```
├── apps/
│   ├── web/                 # Next.js 16 — Landing + LMS
│   │   ├── src/app/         # App Router pages
│   │   ├── src/components/  # React компоненты
│   │   └── src/lib/         # API client, auth, i18n
│   └── api/                 # Express REST API
│       ├── src/routes/      # API маршруты
│       ├── src/services/    # Бизнес-логика
│       ├── src/middleware/   # Auth, error handling
│       └── src/assets/      # Шрифты, печать, подпись
├── packages/
│   ├── database/            # Prisma schema + клиент
│   ├── shared/              # Типы и утилиты
│   └── ui/                  # UI компоненты
├── docs/
│   └── mobile-api.md        # Документация Mobile API
├── Dockerfile               # API Docker image
├── Dockerfile.web           # Web Docker image
└── docker-compose.prod.yml  # Production compose
```

---

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis URL (опционально) |
| `JWT_SECRET` | Секрет для JWT токенов |
| `TELEGRAM_BOT_TOKEN` | Токен бота для HMAC валидации |
| `BOT_SECRET` | Секрет для Bot API (X-Bot-Secret) |
| `NEXT_PUBLIC_API_URL` | URL API для фронтенда |
| `PORT` | Порт API (по умолчанию 3001) |

---

## Лицензия

Proprietary. ТОО "AiBot", Казахстан.
