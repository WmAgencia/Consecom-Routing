import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'consecom-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/db', async (req) => {
    try {
      await req.server.db.$client.unsafe('SELECT 1');
      return { status: 'ok', database: 'reachable' };
    } catch (err) {
      req.log.error({ err }, 'db health check failed');
      return { status: 'error', database: 'unreachable' };
    }
  });
}