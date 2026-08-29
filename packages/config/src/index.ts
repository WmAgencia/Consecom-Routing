export const config = {
  ports: {
    api: Number(process.env.API_PORT ?? 3001),
    web: Number(process.env.WEB_PORT ?? 3000),
  },
  publicUrls: {
    web: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
    api: process.env.PUBLIC_API_URL ?? 'http://localhost:3001',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604_800),
  },
  masterEncryptionKey: process.env.MASTER_ENCRYPTION_KEY ?? '',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  rateLimits: {
    authPerMin: 10,
  },
} as const;

if (!config.jwt.secret || config.jwt.secret.length < 32) {
  // In dev, allow a fallback so the API boots without setup, but warn loudly.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required (>=32 chars) in production');
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[config] JWT_SECRET is missing or too short — using insecure dev fallback. Set JWT_SECRET in .env.local.',
  );
}

if (config.masterEncryptionKey.startsWith('dev-only-')) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MASTER_ENCRYPTION_KEY is the dev default. Refusing to boot in production.');
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[config] MASTER_ENCRYPTION_KEY is the dev default. Provider keys will not be encrypted securely.',
  );
}
