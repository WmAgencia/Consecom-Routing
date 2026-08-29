import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';
import {
  errors,
  LoginSchema,
  RegisterSchema,
  type AuthResponse,
  type Role,
} from '@consecom/shared';
import * as s from '@consecom/db';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  generateCsrfToken,
  hashRefreshToken,
} from '../lib/auth.js';

const COOKIE_ACCESS = '__consecom_session';
const COOKIE_REFRESH = '__consecom_refresh';
const COOKIE_CSRF = '__consecom_csrf';

export async function registerAuthRoutes(app: FastifyInstance) {
  const db = app.db;

  // ---------------------------------------------------------------------------
  // POST /v1/auth/register — create customer account
  // ---------------------------------------------------------------------------
  app.post('/register', async (req, reply) => {
    const input = RegisterSchema.parse(req.body);
    const existing = await db
      .select()
      .from(s.users)
      .where(eq(s.users.email, input.email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      throw errors.conflict('Email already registered');
    }

    const passwordHash = await hash(input.password);
    const [user] = await db
      .insert(s.users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        doc: input.doc ?? null,
        role: 'customer',
        status: 'active',
      })
      .returning();
    if (!user) throw errors.internal('User creation failed');

    // Create customer record (1:1 with user)
    await db.insert(s.customers).values({ id: user.id, status: 'active' });

    // Initialize empty credit balance
    await db
      .insert(s.creditBalances)
      .values({
        customerId: user.id,
        creditsAvailable: 0,
        creditsReserved: 0,
        creditsUsed: 0,
      })
      .onConflictDoNothing();

    const session = await issueSession(reply, user);
    return session;
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/login
  // ---------------------------------------------------------------------------
  app.post('/login', async (req, reply) => {
    const input = LoginSchema.parse(req.body);
    const [user] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.email, input.email.toLowerCase()))
      .limit(1);
    if (!user || user.deletedAt) {
      throw errors.unauthorized('Invalid credentials');
    }
    if (user.status !== 'active') {
      throw errors.forbidden('Account is not active');
    }

    const ok = await verify(user.passwordHash, input.password);
    if (!ok) throw errors.unauthorized('Invalid credentials');

    return issueSession(reply, user);
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/refresh — rotate refresh token
  // ---------------------------------------------------------------------------
  app.post('/refresh', async (req, reply) => {
    const presented = req.cookies[COOKIE_REFRESH];
    if (!presented) throw errors.unauthorized('Missing refresh token');

    const tokenHash = hashRefreshToken(presented);
    const [stored] = await db
      .select()
      .from(s.refreshTokens)
      .where(eq(s.refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw errors.unauthorized('Invalid or expired refresh token');
    }

    const [user] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.id, stored.userId))
      .limit(1);
    if (!user || user.status !== 'active') {
      throw errors.unauthorized('User not active');
    }

    // Rotate — revoke old, issue new
    await db
      .update(s.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(s.refreshTokens.id, stored.id));

    return issueSession(reply, user);
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/logout
  // ---------------------------------------------------------------------------
  app.post('/logout', async (req, reply) => {
    const presented = req.cookies[COOKIE_REFRESH];
    if (presented) {
      await db
        .update(s.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(s.refreshTokens.tokenHash, hashRefreshToken(presented)));
    }
    reply.clearCookie(COOKIE_ACCESS, { path: '/' });
    reply.clearCookie(COOKIE_REFRESH, { path: '/' });
    reply.clearCookie(COOKIE_CSRF, { path: '/' });
    return { ok: true };
  });

  // ---------------------------------------------------------------------------
  // GET /v1/auth/me — current session info
  // ---------------------------------------------------------------------------
  app.get('/me', async (req) => {
    const token = req.cookies[COOKIE_ACCESS];
    if (!token) throw errors.unauthorized();
    const claims = await verifyAccessToken(token);

    const [user] = await db
      .select()
      .from(s.users)
      .where(eq(s.users.id, claims.sub))
      .limit(1);
    if (!user || user.status !== 'active') {
      throw errors.unauthorized();
    }

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        doc: user.doc,
        role: user.role as Role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
    return response;
  });
}

// =============================================================================
// Helpers
// =============================================================================

interface SessionUser {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  name: string;
  doc: string | null;
  createdAt: Date;
}

async function issueSession(reply: import('fastify').FastifyReply, user: SessionUser) {
  const csrf = generateCsrfToken();
  const access = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as 'customer' | 'admin' | 'superadmin',
    csrf,
  });

  const refresh = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await reply.server.db.insert(s.refreshTokens).values({
    userId: user.id,
    tokenHash: refresh.hash,
    expiresAt,
  });

  reply.setCookie(COOKIE_ACCESS, access, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // dev
    path: '/',
    maxAge: 15 * 60,
  });
  reply.setCookie(COOKIE_REFRESH, refresh.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  reply.setCookie(COOKIE_CSRF, csrf, {
    httpOnly: false, // readable by JS for the X-CSRF-Token header
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  const out: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      doc: user.doc,
      role: user.role as Role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    },
  };
  return out;
}