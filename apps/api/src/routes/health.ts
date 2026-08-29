import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'consecom-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/db', async (req, reply) => {
    try {
      await app.db.$client.unsafe('SELECT 1');
      return { status: 'ok', database: 'reachable' };
    } catch (err) {
      req.log.error({ err }, 'db health check failed');
      return reply.status(503).send({
        status: 'error',
        database: 'unreachable',
      });
    }
  });
}