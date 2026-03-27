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
  port: Number(optionalEnv('PORT', '') || optionalEnv('API_PORT', '3001')),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    refreshSecret: optionalEnv('JWT_REFRESH_SECRET', '') || requireEnv('JWT_SECRET'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '90d'),
  },

  telegram: {
    botToken: optionalEnv('TELEGRAM_BOT_TOKEN', ''),
    webhookUrl: optionalEnv('TELEGRAM_WEBHOOK_URL', ''),
    miniAppUrl: optionalEnv('TELEGRAM_MINI_APP_URL', ''),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  bot: {
    secret: optionalEnv('BOT_SECRET', ''),
  },

  app: {
    url: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
};
