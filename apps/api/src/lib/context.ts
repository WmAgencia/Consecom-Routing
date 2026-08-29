import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    requestStartedAt: number;
  }
}

/**
 * Per-request context: requestId + high-resolution timer.
 * Available on every request via `req.requestId` and `req.requestStartedAt`.
 */
export async function requestContext(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => {
    req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.requestStartedAt = performance.now();
    req.headers['x-request-id'] = req.requestId;
  });
  app.addHook('onResponse', async (req, reply) => {
    const latencyMs = Math.round(performance.now() - req.requestStartedAt);
    req.log.info(
      {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        status: reply.statusCode,
        latencyMs,
        ip: req.ip,
      },
      'request completed',
    );
  });
}