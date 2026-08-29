import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = '__consecom_admin';
const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Admin API proxy — bridges client components (which run in the browser and
 * can't read the httpOnly `__consecom_admin` cookie) to the Fastify API.
 *
 * The browser posts to `/api/admin/proxy/v1/admin/...` and we forward the
 * request server-side, injecting the admin cookie that Next reads from its
 * own cookie jar.
 *
 * The proxy is intentionally narrow — it only forwards to the configured
 * `PUBLIC_API_URL` and strips hop-by-hop headers. Auth is enforced upstream
 * by the Fastify routes (requireAdmin), so this proxy is a pure pass-through.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamPath = path.join('/');
  const url = `${API_BASE}/${upstreamPath}${req.nextUrl.search}`;

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value ?? '';

  // Forward headers we care about; never forward the browser's cookie header
  // (we'll set our own from the admin session cookie).
  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === 'cookie' || lower === 'host' || lower === 'connection') continue;
    headers.set(k, v);
  }
  if (adminCookie) headers.set('cookie', `${ADMIN_COOKIE}=${adminCookie}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(url, init);

  // Stream response back with the same status + headers (filter hop-by-hop).
  const outHeaders = new Headers();
  for (const [k, v] of res.headers.entries()) {
    const lower = k.toLowerCase();
    if (['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) continue;
    outHeaders.set(k, v);
  }
  return new NextResponse(res.body, { status: res.status, headers: outHeaders });
}