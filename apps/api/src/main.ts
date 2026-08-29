import Fastify, { type FastifyInstance } from 'fastify';
import { config as loadEnv } from 'dotenv';

// Load .env.local from project root (absolute path)
loadEnv({ path: 'C:/Users/junin/consecom-routing/.env.local' });

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from '@consecom/config';
import { createDb, type Db } from '@consecom/db';
import type { RateLimiterPort } from '@consecom/shared';
import { registerHealthRoutes } from './routes/health.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerChatRoutes } from './routes/v1/chat.js';
import { registerModelsRoutes } from './routes/v1/models.js';
import { registerApiKeyRoutes } from './routes/v1/api-keys.js';
import { registerUsageRoutes } from './routes/v1/usage.js';
import { registerBillingRoutes, registerStripeWebhook } from './routes/v1/billing.js';
import { registerAdminAuthRoutes } from './routes/admin/auth.js';
import { registerAdminApi } from './routes/admin/api.js';
import { errorHandler } from './lib/errors.js';
import { requestContext } from './lib/context.js';
import { InMemoryRateLimiter } from './services/rate-limit.js';

export interface AppDeps {
  db: Db;
  rateLimiter?: RateLimiterPort;
}

export async function buildApp(deps?: Partial<AppDeps>): Promise<FastifyInstance> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const db = deps?.db ?? createDb(url);
  const rateLimiter = deps?.rateLimiter ?? new InMemoryRateLimiter();

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        censor: '[redacted]',
      },
    },
    trustProxy: true,
    bodyLimit: 1 * 1024 * 1024, // 1 MB
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(cookie, {
    secret: config.jwt.secret || 'dev-cookie-secret-only',
    parseOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookie.secure,
      domain: config.cookie.domain,
    },
  });

  app.decorate('db', db);
  app.decorate('config', config);
  app.decorate('rateLimiter', rateLimiter);

  await app.register(requestContext);
  app.setErrorHandler(errorHandler);

  // Capture raw body for webhook signature verification.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      // Stash the raw bytes for routes that need them (Stripe webhook).
      (_req as unknown as { rawBody?: Buffer }).rawBody = body as Buffer;
      try {
        const parsed = body.length > 0 ? JSON.parse((body as Buffer).toString('utf8')) : {};
        done(null, parsed);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // Public
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes, { prefix: '/v1/auth' });
  await app.register(registerChatRoutes, { prefix: '/v1' });
  await app.register(registerModelsRoutes, { prefix: '/v1' });
  await app.register(registerApiKeyRoutes, { prefix: '/v1' });
  await app.register(registerUsageRoutes, { prefix: '/v1' });
  await app.register(registerBillingRoutes);
  await app.register(registerStripeWebhook);
  await app.register(registerAdminAuthRoutes);
  await app.register(registerAdminApi);

  return app;
}

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    config: typeof config;
    rateLimiter: RateLimiterPort;
  }
}

// Cleanup on shutdown
function installShutdownHandlers(app: FastifyInstance) {
  const stop = async () => {
    app.log.info('shutting down...');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

const isMain = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMain) {
  const port = config.ports.api;
  const host = '0.0.0.0';
  const app = await buildApp();
  installShutdownHandlers(app);
  app.listen({ port, host }, (err, addr) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`Consecom API listening at ${addr}`);
  });
}