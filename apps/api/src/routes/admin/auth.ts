import type { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import * as s from '@consecom/db';
import { errors } from '@consecom/shared';
import { verifyAdminToken, signAdminToken, generateImpersonationToken } from '../../lib/admin-auth.js';

/**
 * Admin auth — separate cookie namespace + JWT secret namespace from
 * customer auth. Only users with role IN ('admin','superadmin') can log in.
 */
export async function registerAdminAuthRoutes(app: FastifyInstance) {
  const db = app.db;
  const COOKIE = '__consecom_admin';

  // Reuse the user login: admin logs in via the same /v1/auth/login endpoint
  // (gets the regular session cookie), then clicks "Acessar painel admin" —
  // OR uses this dedicated /v1/admin/login that requires admin role.
  app.post('/v1/admin/login', async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    if (!body.email || !body.password) throw errors.validation('email and password required');
    const [user] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.email, body.email.toLowerCase()))
      .limit(1);
    if (!user || user.deletedAt) throw errors.unauthorized('invalid credentials');
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw errors.forbidden('admin role required');
    }
    if (user.status !== 'active') throw errors.forbidden('account not active');
    const { verify } = await import('@node-rs/argon2');
    const ok = await verify(user.passwordHash, body.password);
    if (!ok) throw errors.unauthorized('invalid credentials');

    const token = await signAdminToken(
      {
        sub: user.id,
        role: user.role as 'admin' | 'superadmin',
        email: user.email,
        kind: 'session',
      },
      60 * 60 * 8, // 8 hours
    );

    reply.setCookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    return { ok: true };
  });

  app.post('/v1/admin/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  // "Assumir controle" — issue a short-lived token for the customer dashboard.
  // The admin UI swaps its cookie to this token to view the customer's perspective.
  app.post<{ Params: { customerId: string } }>(
    '/v1/admin/customers/:customerId/impersonate',
    async (req, reply) => {
      const adminToken = req.cookies[COOKIE];
      if (!adminToken) throw errors.unauthorized();
      const claims = await verifyAdminToken(adminToken);
      if (claims.role !== 'admin' && claims.role !== 'superadmin') {
        throw errors.forbidden();
      }

      const customerId = req.params.customerId;
      const [customer] = await db
        .select()
        .from(s.users)
        .where(eq(s.users.id, customerId))
        .limit(1);
      if (!customer) throw errors.notFound('customer not found');

      // Log the impersonation entry.
      await db.insert(s.auditLogs).values({
        adminUserId: claims.sub,
        action: 'impersonate_start',
        targetType: 'customer',
        targetId: customerId,
        metadata: { adminEmail: claims.email, reason: 'support' },
      });

      const token = generateImpersonationToken();
      reply.setCookie('__consecom_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 15 * 60,
      });
      // Note: real "assumir controle" would mint a temporary customer-session
      // token; for MVP, the admin simply sees the customer's data via /v1/admin/customers/:id
      return { ok: true, redirectTo: `/admin/customers/${customerId}` };
    },
  );
}

export async function requireAdmin(req: FastifyRequest): Promise<{ sub: string; role: string; email: string }> {
  const cookie = req.cookies['__consecom_admin'];
  if (!cookie) throw errors.unauthorized();
  const claims = await verifyAdminToken(cookie);
  if (claims.role !== 'admin' && claims.role !== 'superadmin') {
    throw errors.forbidden();
  }
  return { sub: claims.sub, role: claims.role, email: claims.email };
}