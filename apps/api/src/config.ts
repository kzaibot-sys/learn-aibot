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

  yookassa: {
    shopId: optionalEnv('YOOKASSA_SHOP_ID', ''),
    secretKey: optionalEnv('YOOKASSA_SECRET_KEY', ''),
  },

  stripe: {
    secretKey: optionalEnv('STRIPE_SECRET_KEY', ''),
    webhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET', ''),
  },

  s3: {
    endpoint: optionalEnv('S3_ENDPOINT', ''),
    accessKey: optionalEnv('S3_ACCESS_KEY', ''),
    secretKey: optionalEnv('S3_SECRET_KEY', ''),
    bucket: optionalEnv('S3_BUCKET_NAME', 'lms-media'),
    publicUrl: optionalEnv('S3_PUBLIC_URL', ''),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  payment: {
    enabled: optionalEnv('PAYMENT_ENABLED', 'false') === 'true',
  },

  app: {
    url: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
};
