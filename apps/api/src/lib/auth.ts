import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes, createHash } from 'node:crypto';
import { config } from '@consecom/config';

const SECRET = new TextEncoder().encode(
  config.jwt.secret || 'dev-cookie-secret-only-min-32-chars-aaaa',
);

export type SessionRole = 'customer' | 'admin' | 'superadmin';

export interface SessionClaims extends JWTPayload {
  sub: string; // user id
  role: SessionRole;
  email: string;
  /** CSRF token (random per session) — must be echoed in X-CSRF-Token header */
  csrf: string;
}

export async function signAccessToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${config.jwt.accessTtlSeconds}s`)
    .setIssuer('consecom')
    .setAudience('consecom-api')
    .sign(SECRET);
}

export async function verifyAccessToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: 'consecom',
    audience: 'consecom-api',
  });
  const c = payload as unknown as SessionClaims;
  if (!c.sub || !c.role || !c.email || !c.csrf) {
    throw new Error('invalid session claims');
  }
  return c;
}

/** Generate an opaque refresh token (base64url) and its SHA-256 hash for DB storage. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(48).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}