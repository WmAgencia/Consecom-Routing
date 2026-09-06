import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Generic proxy for all /v1/* API calls from the browser.
 * Bridges the gap left by Next.js rewrites not working with
 * output: 'standalone' on Vercel.
 *
 * Browser posts to `/api/proxy/v1/<path>` and we forward server-side
 * to `${API_BASE}/v1/<path>`, passing cookies along.
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
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamPath = path.join('/');
  // The browser calls /api/proxy/v1/admin/me, so `path` = ['v1', 'admin', 'me']
  // and we just forward upstreamPath as-is (no extra prefix needed).
  const url = `${API_BASE}/${upstreamPath}${req.nextUrl.search}`;

  // Build headers
  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === 'cookie' || lower === 'host' || lower === 'connection') continue;
    headers.set(k, v);
  }
  // Forward cookies from the browser
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(url, init);

  // Stream response, rewriting cookies for cross-domain
  const outHeaders = new Headers();
  for (const [k, v] of res.headers.entries()) {
    const lower = k.toLowerCase();
    if (['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) continue;
    if (lower === 'set-cookie') {
      let cookieValue = v;
      cookieValue = cookieValue.replace(/;\s*Domain=[^;]+/gi, '');
      cookieValue = cookieValue.replace(/;\s*SameSite=[^;]+/gi, '');
      if (!/;\s*Secure/i.test(cookieValue)) {
        cookieValue += '; Secure';
      }
      cookieValue += '; SameSite=None';
      outHeaders.append(k, cookieValue);
      continue;
    }
    outHeaders.set(k, v);
  }
  return new NextResponse(res.body, { status: res.status, headers: outHeaders });
}
