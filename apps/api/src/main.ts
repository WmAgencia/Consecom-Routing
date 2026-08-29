import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from '@consecom/config';
import { createDb, type Db } from '@consecom/db';
import { registerHealthRoutes } from './routes/health.js';
import { registerAuthRoutes } from './routes/auth.js';
import { errorHandler } from './lib/errors.js';
import { requestContext } from './lib/context.js';

export interface AppDeps {
  db: Db;
}

export async function buildApp(deps?: Partial<AppDeps>): Promise<FastifyInstance> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const db = deps?.db ?? createDb(url);

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

  await app.register(requestContext);
  app.setErrorHandler(errorHandler);

  // Public
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes, { prefix: '/v1/auth' });

  return app;
}

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    config: typeof config;
  }
}

const isMain = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMain) {
  const port = config.ports.api;
  const host = '0.0.0.0';
  const app = await buildApp();
  app.listen({ port, host }, (err, addr) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`Consecom API listening at ${addr}`);
  });
}