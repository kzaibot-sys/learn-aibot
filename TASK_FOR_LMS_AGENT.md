# Задача: Добавить авторизацию через Telegram Mini App

## Контекст

У нас есть Telegram-бот (@aibot_learn_bot, token: `8270269166:AAH4HxR2DN7zDwxAiAgt6pVS1f6UWL6RGfU`), который открывает LMS-платформу как Telegram Mini App. Пользователи должны автоматически авторизовываться без ввода email/пароля — Telegram сам передаёт `initData` с подписанными данными пользователя.

Бот при регистрации уже создаёт пользователя в LMS через `POST /api/bot/users` с `telegramId`. Теперь нужно чтобы при открытии Mini App пользователь автоматически авторизовывался и попадал на `/dashboard`.

## Что нужно сделать

### 1. Создать файл `public/tg-auth.html`

Это статическая HTML-страница — точка входа для Telegram Mini App. Она:
- Загружает Telegram WebApp SDK (`https://telegram.org/js/telegram-web-app.js`)
- Вызывает `window.Telegram.WebApp.ready()` и `.expand()`
- Берёт `window.Telegram.WebApp.initData`
- Отправляет `POST /api/auth/telegram` с `{ initData }`
- Получает токен из ответа
- Сохраняет токен **в точности так же, как это делает обычная форма логина** (localStorage, cookie — посмотри как работает текущий `/login`)
- Делает `window.location.replace('/dashboard')`
- При ошибке показывает сообщение и кнопку "Попробовать снова"
- Стилизация через CSS-переменные Telegram: `var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)`, `var(--tg-theme-button-color)` и т.д.

### 2. Убедиться что `POST /api/auth/telegram` работает корректно

Эндпоинт уже существует и принимает `{ initData }`. Проверь/исправь:

- **Валидация initData**: HMAC-SHA256 подпись через `BOT_TOKEN` (`8270269166:AAH4HxR2DN7zDwxAiAgt6pVS1f6UWL6RGfU`). Алгоритм:
  ```
  secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
  hash = HMAC-SHA256(secret_key, data_check_string)
  ```
  где `data_check_string` — все поля из initData (кроме `hash`) отсортированные по алфавиту, соединённые через `\n`.

- **Проверка `auth_date`**: отклонять если старше 5 минут.

- **Поиск пользователя**: из initData извлекается `user.id` (telegram_id). Найти пользователя в БД по `telegramId`. Если не найден — создать автоматически (firstName, lastName, username из initData).

- **Ответ**: должен возвращать токен (JWT или session) **в том же формате**, что и `POST /api/auth/login`. Это критично — фронтенд должен одинаково обрабатывать токен из обоих методов входа.

### 3. Убедиться что `/dashboard` принимает этот токен

Проверь что middleware авторизации на `/dashboard` и других защищённых страницах принимает токен, выданный через `/api/auth/telegram`, точно так же как обычный логин.

### 4. Переменные окружения

Убедись что `TELEGRAM_BOT_TOKEN` (или как он называется в проекте) установлен:
```
TELEGRAM_BOT_TOKEN=8270269166:AAH4HxR2DN7zDwxAiAgt6pVS1f6UWL6RGfU
```

## Важные требования

- **Безопасность**: Обязательная HMAC-валидация initData. Без неё любой может подделать авторизацию.
- **Хранение токена**: Использовать тот же механизм что и обычный login (посмотри как `/login` страница сохраняет сессию — localStorage, httpOnly cookie, или и то и другое). `tg-auth.html` должен делать то же самое.
- **Не ломать существующее**: Обычный вход по email/паролю должен продолжать работать.
- **Автосоздание пользователя**: Если пользователь с таким telegramId не найден — создать его из данных initData (не выдавать ошибку).

## Как проверить

После выполнения задачи, эта страница должна быть доступна:
```
curl -s https://demo-lms.aibot.kz/tg-auth.html | head -5
```

А эндпоинт должен корректно отвечать:
```bash
# С невалидными данными — ошибка:
curl -X POST https://demo-lms.aibot.kz/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"invalid"}'
# → {"success":false,"error":{"code":"INVALID_TELEGRAM_DATA",...}}

# С валидными данными (из Telegram) — токен:
# → {"success":true,"data":{"token":"...","user":{...}}}
```

## Схема работы (итоговая)

```
Telegram Bot → кнопка "📱 Платформа" (WebApp url: /tg-auth.html)
  → Telegram открывает Mini App
  → tg-auth.html загружает Telegram WebApp SDK
  → JS берёт window.Telegram.WebApp.initData
  → POST /api/auth/telegram { initData }
  → Backend: HMAC-валидация → поиск/создание user → генерация JWT
  → Frontend: сохранить токен → redirect /dashboard
  → Пользователь на dashboard, авторизован
```
