import { NextRequest, NextResponse } from 'next/server';

// Em produção, usa API_BASE_URL do ambiente
// Em desenvolvimento, usa localhost
const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Para desenvolvimento local
  return 'http://localhost:3001';
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiBase = getApiBase();
  const url = `${apiBase}/${path.join('/')}${request.nextUrl.search}`;

  try {
    const headers: Record<string, string> = {};
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await response.text();
    const nextResponse = new NextResponse(data, { status: response.status });

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        nextResponse.headers.set(key, value);
      }
    });

    return nextResponse;
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiBase = getApiBase();
  const url = `${apiBase}/${path.join('/')}${request.nextUrl.search}`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;

    const body = await request.text();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    const data = await response.text();
    const nextResponse = new NextResponse(data, { status: response.status });

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        nextResponse.headers.set(key, value);
      }
    });

    return nextResponse;
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 });
  }
}
