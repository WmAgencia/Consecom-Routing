import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import * as s from '@consecom/db';
import { ApiKeyService, toPublic } from '../../services/api-key.js';
import { CreateApiKeySchema } from '@consecom/shared';
import { errors } from '@consecom/shared';

/**
 * API key management for the customer dashboard.
 * Auth: Bearer cookie session (set by /v1/auth/*).
 */
export async function registerApiKeyRoutes(app: FastifyInstance) {
  const db = app.db;
  const apiKeyService = new ApiKeyService(db);

  // Helper: resolve the user from the cookie session.
  async function userFromSession(req: FastifyRequest): Promise<string> {
    const { verifyAccessToken } = await import('../../lib/auth.js');
    const token = req.cookies['__consecom_session'];
    if (!token) throw errors.unauthorized();
    const claims = await verifyAccessToken(token);
    return claims.sub;
  }

  // GET /v1/api-keys — list
  app.get('/api-keys', async (req) => {
    const userId = await userFromSession(req);
    const keys = await apiKeyService.list(userId);
    return { data: keys };
  });

  // POST /v1/api-keys — create
  app.post('/api-keys', async (req) => {
    const userId = await userFromSession(req);
    const input = CreateApiKeySchema.parse(req.body);
    const created = await apiKeyService.create(userId, input.name, input.expiresInDays);
    return created; // contains the full key, shown once
  });

  // DELETE /v1/api-keys/:id — revoke
  app.delete<{ Params: { id: string } }>('/api-keys/:id', async (req) => {
    const userId = await userFromSession(req);
    await apiKeyService.revoke(userId, req.params.id);
    return { ok: true };
  });

  // Suppress unused-import warnings for tree-shaking
  void toPublic;
  void desc;
  void gte;
  void lte;
  void eq;
  void and;
}
