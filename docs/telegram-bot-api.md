# Telegram Bot API — Выдача доступа к курсам

## Endpoint: POST /api/bot/grant-access

Выдаёт доступ к курсу пользователю по его Telegram ID.

### Request
POST {API_URL}/api/bot/grant-access
Content-Type: application/json

```json
{
  "telegramId": "123456789",
  "courseSlug": "my-course",
  "botSecret": "{TELEGRAM_BOT_TOKEN}"
}
```

### Response (success)
```json
{
  "success": true,
  "data": {
    "enrollment": { ... },
    "userId": "cuid..."
  }
}
```

### Errors
- 403 FORBIDDEN — неверный botSecret
- 404 USER_NOT_FOUND — пользователь не найден по telegramId (нужна регистрация)
- 404 COURSE_NOT_FOUND — курс не найден по slug

### Пример использования в боте (grammy)
```typescript
bot.command('grant', async (ctx) => {
  const [courseSlug] = ctx.match.split(' ');
  const telegramId = ctx.from.id;

  const res = await fetch(`${API_URL}/api/bot/grant-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId: String(telegramId), courseSlug, botSecret: BOT_TOKEN }),
  });

  const data = await res.json();
  if (data.success) {
    await ctx.reply('Доступ к курсу открыт!');
  }
});
```

### Интеграция с оплатой
После успешной оплаты через бота, вызовите этот endpoint для автоматической выдачи доступа.
