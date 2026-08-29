import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes } from 'node:crypto';
import { config } from '@consecom/config';

const ADMIN_SECRET = new TextEncoder().encode(
  (config.jwt.secret || 'dev-cookie-secret-only-min-32-chars-aaaa') + ':admin',
);

export type AdminRole = 'admin' | 'superadmin';

export interface AdminClaims extends JWTPayload {
  sub: string;
  role: AdminRole;
  email: string;
  /** Optional: when set, this token grants scoped access to a specific customer. */
  customerId?: string;
  /** TTL marker: 'impersonate' tokens are short-lived (15min). */
  kind: 'session' | 'impersonate';
}

export async function signAdminToken(
  claims: Omit<AdminClaims, 'iat' | 'exp'>,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .setIssuer('consecom-admin')
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminClaims> {
  const { payload } = await jwtVerify(token, ADMIN_SECRET, {
    issuer: 'consecom-admin',
  });
  const c = payload as unknown as AdminClaims;
  if (!c.sub || !c.role || !c.email || !c.kind) {
    throw new Error('invalid admin claims');
  }
  return c;
}

export function generateImpersonationToken(): string {
  return randomBytes(24).toString('base64url');
}