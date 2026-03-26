function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  telegram: {
    botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    webhookUrl: optionalEnv('TELEGRAM_WEBHOOK_URL', ''),
    miniAppUrl: optionalEnv('TELEGRAM_MINI_APP_URL', ''),
  },

  anthropic: {
    apiKey: requireEnv('ANTHROPIC_API_KEY'),
    model: optionalEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  api: {
    url: optionalEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'),
  },

  yookassa: {
    shopId: optionalEnv('YOOKASSA_SHOP_ID', ''),
    secretKey: optionalEnv('YOOKASSA_SECRET_KEY', ''),
  },
};
