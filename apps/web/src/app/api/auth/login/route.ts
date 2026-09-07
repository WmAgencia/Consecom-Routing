import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

interface LoginResponse {
  ok: boolean;
  user?: { id: string; email: string; name?: string; role?: string };
  csrfToken?: string;
  error?: string;
  message?: string;
}

/**
 * Unified login endpoint.
 * Tries customer login first; if 401, tries admin login.
 * Returns the user + role so the client can redirect appropriately.
 *
 * IMPORTANT: this doesn't reveal which endpoint succeeded/failed —
 * both return the same generic error if neither works.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json(
      { ok: false, message: 'Email and password required' },
      { status: 400 },
    );
  }

  // Forward cookies from request to API (for CSRF etc)
  const cookieHeader = req.headers.get('cookie') ?? '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookieHeader) headers.cookie = cookieHeader;

  // Try customer login first
  try {
    const customerRes = await fetch(`${API_BASE}/v1/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const customerData = (await customerRes.json().catch(() => ({}))) as LoginResponse;
    if (customerRes.ok && customerData.ok) {
      return forwardLoginResponse(customerRes, customerData);
    }
  } catch {
    // continue to admin
  }

  // Try admin login
  try {
    const adminRes = await fetch(`${API_BASE}/v1/admin/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const adminData = (await adminRes.json().catch(() => ({}))) as LoginResponse;
    if (adminRes.ok && adminData.ok) {
      return forwardLoginResponse(adminRes, adminData);
    }
  } catch {
    // fall through
  }

  // Both failed — return generic error (don't leak which path failed)
  return NextResponse.json(
    { ok: false, message: 'Email ou senha incorretos' },
    { status: 401 },
  );
}

function forwardLoginResponse(upstreamRes: Response, data: LoginResponse): NextResponse {
  const outHeaders = new Headers();
  for (const [k, v] of upstreamRes.headers.entries()) {
    const lower = k.toLowerCase();
    if (['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) continue;
    if (lower === 'set-cookie') {
      let cookieValue = v;
      cookieValue = cookieValue.replace(/;\s*Domain=[^;]+/gi, '');
      cookieValue = cookieValue.replace(/;\s*SameSite=[^;]+/gi, '');
      if (!/;\s*Secure/i.test(cookieValue)) cookieValue += '; Secure';
      cookieValue += '; SameSite=None';
      outHeaders.append(k, cookieValue);
      continue;
    }
    outHeaders.set(k, v);
  }
  return NextResponse.json(data, { status: upstreamRes.status, headers: outHeaders });
}
